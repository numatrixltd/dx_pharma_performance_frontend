"use client";
import { useState } from "react";
import { Award } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/context/AuthContext";
import { money, monthLabel, pct } from "@/lib/format";
import Card, { CardHeader } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { ErrorBox, PageSkeleton } from "@/components/ui/States";
import { OutletLink, TableWrap } from "@/components/shared/cells";
import AlertsCard from "./AlertsCard";

const highest = (tiers, v) =>
  v === null
    ? null
    : [...(tiers || [])]
        .sort((a, b) => b.min - a.min)
        .find((t) => v >= t.min) || null;

/** Month projection with a what-if slider. Manager incentive projection is shown only to permitted accounts. */
export default function InsightsView({ date, outlet }) {
  const { can } = useAuth();
  const [change, setChange] = useState(0);
  const { data, loading, error, reload } = useApi("/dashboard/insights", {
    date,
    outlet,
  });
  const alerts = useApi("/dashboard/alerts", { date, outlet });
  if (!data && loading) return <PageSkeleton />;
  if (!data && error) return <ErrorBox message={error} onRetry={reload} />;
  if (!data) return null;

  const f = 1 + change / 100;
  const rows = data.projections.map((p) => {
    const projected =
      p.target > 0
        ? ((p.mtdSales + p.rate * f * p.remaining) / p.target) * 100
        : null;
    return { ...p, whatIf: projected, base: p.projected, needsRate: p.needed };
  });

  const mp = data.managerPolicy;
  const counted = rows.filter((r) => r.target > 0 && r.whatIf !== null);
  const mgr =
    mp && counted.length
      ? (() => {
          const rewards = counted.map(
            (r) => highest(mp.outletSlabs, r.whatIf)?.amount || 0,
          );
          const bonus =
            highest(
              mp.allOutletBonuses,
              Math.min(...counted.map((r) => r.whatIf)),
            )?.amount || 0;
          return { rewards: rewards.reduce((a, b) => a + b, 0), bonus };
        })()
      : null;

  return (
    <div className="space-y-4 sm:space-y-5">
      <Card>
        <CardHeader
          title={`Month projection · ${monthLabel(data.month)}`}
          subtitle="Month-to-date net sales extended over the remaining working days at the current daily run rate. Outlet off days are not working days."
        />
        <div className="rounded-xl border border-ink-600/60 bg-ink-900/50 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label
              htmlFor="whatif"
              className="text-sm font-semibold text-white"
            >
              What if daily sales change from now on?
            </label>
            <Badge tone={change === 0 ? "gray" : change > 0 ? "green" : "red"}>
              {change > 0 ? "+" : ""}
              {change}% vs current run rate
            </Badge>
          </div>
          <input
            id="whatif"
            type="range"
            min={-30}
            max={50}
            step={5}
            value={change}
            onChange={(e) => setChange(Number(e.target.value))}
            className="mt-4 w-full accent-brand-500"
          />
          <div className="mt-1 flex justify-between text-[11px] text-slate-500">
            <span>−30%</span>
            <span>Current pace</span>
            <span>+50%</span>
          </div>
        </div>

        <TableWrap className="mt-4 rounded-xl border border-ink-600/60">
          <table className="w-full min-w-[860px]">
            <thead>
              <tr>
                {[
                  "Outlet",
                  "Monthly target",
                  "Month to date",
                  "Run rate / day",
                  "Needed / day",
                  "Days left",
                  "Projected",
                  change === 0 ? "" : "What-if",
                ]
                  .filter(Boolean)
                  .map((h) => (
                    <th key={h} className="th">
                      {h}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="tr-hover">
                  <td className="td font-semibold text-white">
                    <OutletLink id={r.id} name={r.name} />
                  </td>
                  <td className="td">
                    {r.target > 0 ? (
                      money(r.target)
                    ) : (
                      <span className="text-amber-300">No target</span>
                    )}
                  </td>
                  <td className="td">{money(r.mtdSales)}</td>
                  <td className="td">{money(r.rate)}</td>
                  <td className="td">
                    {r.remaining > 0 ? money(r.needed) : "—"}
                  </td>
                  <td className="td">{r.remaining}</td>
                  <td
                    className={`td font-bold ${r.base === null ? "text-slate-500" : r.base >= 100 ? "text-emerald-400" : r.base >= 85 ? "text-amber-300" : "text-rose-400"}`}
                  >
                    {pct(r.base)}
                  </td>
                  {change !== 0 && (
                    <td
                      className={`td font-bold ${r.whatIf === null ? "text-slate-500" : r.whatIf >= 100 ? "text-emerald-400" : r.whatIf >= 85 ? "text-amber-300" : "text-rose-400"}`}
                    >
                      {pct(r.whatIf)}
                    </td>
                  )}
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td className="td" colSpan={8}>
                    No outlets.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </TableWrap>

        {can.canViewManagerIncentive && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-amber-400/25 bg-amber-400/5 px-4 py-3 text-sm">
            <Award size={18} className="text-amber-300" />
            {mgr ? (
              <span className="text-slate-300">
                Projected manager incentive at this pace:{" "}
                <strong className="text-white">
                  {money(mgr.rewards + mgr.bonus)}
                </strong>
                <span className="text-slate-500">
                  {" "}
                  ({money(mgr.rewards)} outlet slabs + {money(mgr.bonus)}{" "}
                  all-outlet bonus)
                </span>
              </span>
            ) : (
              <span className="text-slate-400">
                Manager incentive projection appears once manager slabs are set
                in Policy Settings and outlets have targets.
              </span>
            )}
          </div>
        )}
      </Card>

      <AlertsCard
        data={alerts.data}
        loading={alerts.loading}
        error={alerts.error}
      />
    </div>
  );
}

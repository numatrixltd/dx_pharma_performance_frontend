"use client";
import { Crown } from "lucide-react";
import Card, { CardHeader } from "@/components/ui/Card";
import Progress from "@/components/ui/Progress";
import Avatar from "@/components/ui/Avatar";
import Badge from "@/components/ui/Badge";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { EmptyState } from "@/components/ui/States";
import {
  AchievementCell,
  EmployeeCell,
  OutletLink,
  RankCell,
  TableWrap,
} from "@/components/shared/cells";
import { useProfiles } from "@/context/ProfileContext";
import { money, pct } from "@/lib/format";

/** Outlet bars. Clicking an outlet opens its 360° profile. */
export function OutletPerformanceCard({ outlets, subtitle }) {
  const { openOutlet } = useProfiles();
  return (
    <Card>
      <CardHeader
        title="Outlet performance"
        subtitle={subtitle}
        action={
          <div className="flex gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <i className="h-2 w-2 rounded-full bg-brand-400" />
              Achievement
            </span>
            <span className="flex items-center gap-1.5">
              <i className="h-2 w-2 rounded-full bg-violet-500" />
              Target line
            </span>
          </div>
        }
      />
      <div className="space-y-6">
        {!outlets.length && <EmptyState title="No outlet data" />}
        {outlets.map((o, i) => (
          <button
            key={o.id}
            type="button"
            onClick={() => openOutlet(o.id)}
            title="Open outlet 360°"
            className="block w-full text-left"
          >
            <div className="grid grid-cols-[88px_1fr_56px] items-center gap-3 text-xs">
              <span className="truncate font-semibold text-slate-300">
                {o.name}
              </span>
              <Progress
                value={o.achievement}
                tone={i % 2 ? "blue" : "violet"}
                height={9}
              />
              <span className="text-right font-bold text-white">
                {pct(o.achievement)}
              </span>
            </div>
            <div className="mt-1.5 pl-[100px] text-[11px] text-slate-500">
              {money(o.sales)} sales · {money(o.target)} target
            </div>
          </button>
        ))}
      </div>
    </Card>
  );
}

/** Blue "Daily champion" card */
export function ChampionCard({ champion, scope }) {
  const { openEmployee } = useProfiles();
  return (
    <Card className="relative overflow-hidden !border-brand-500/30 !bg-gradient-to-br !from-brand-600/60 !via-brand-700/40 !to-ink-800">
      <div className="pointer-events-none absolute -right-8 -top-8 text-[140px] leading-none text-white/[0.05]">
        ✦
      </div>
      <div className="relative">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300">
          ✦ Daily champion
        </div>
        <h3 className="mt-2 text-lg font-bold text-white">
          Leading the league
        </h3>
        <p className="mt-1 text-xs text-slate-300/80">
          Highest achievement across {scope}
        </p>
        {champion ? (
          <div className="mt-7 flex items-center gap-3">
            {champion.employee.avatar ? (
              <Avatar
                name={champion.employee.name}
                src={champion.employee.avatar}
                size={48}
                className="!rounded-full ring-2 ring-amber-300/60"
              />
            ) : (
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-amber-300/20 text-amber-300 ring-2 ring-amber-300/50">
                <Crown size={20} />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => openEmployee(champion.employee.id)}
                className="block max-w-full truncate text-left font-bold text-white hover:underline"
              >
                {champion.employee.name}
              </button>
              <div className="text-xs text-slate-300/80">
                {champion.outlet.name} · {champion.category || "Unassigned"}
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-extrabold text-amber-300">
                {pct(champion.achievement)}
              </div>
              <div className="text-[11px] text-slate-300/80">Achievement</div>
            </div>
          </div>
        ) : (
          <p className="mt-7 text-sm text-slate-300">
            No finalized sales yet. The champion appears once a batch is
            finalized.
          </p>
        )}
      </div>
    </Card>
  );
}

/** rows: leaderboard-style rows { id, rank, employee, outlet, sales, target, achievement, incentive } */
export function PerformersTable({ title, rows, showLink = true }) {
  return (
    <Card pad={false} className="overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {showLink && (
          <Link
            href="/leaderboard"
            className="flex items-center gap-1 rounded-lg border border-ink-600 px-3 py-1.5 text-xs font-semibold text-white hover:border-brand-500/60"
          >
            Open leaderboard <ArrowUpRight size={13} />
          </Link>
        )}
      </div>
      <TableWrap>
        <table className="w-full min-w-[820px]">
          <thead>
            <tr>
              {[
                "Rank",
                "Employee",
                "Outlet",
                "Sales / target",
                "Achievement",
                "Incentive",
              ].map((h) => (
                <th key={h} className="th">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id || r.employee.id} className="tr-hover">
                <td className="td">
                  <RankCell rank={r.rank} />
                </td>
                <td className="td">
                  <EmployeeCell
                    id={r.employee.id}
                    name={r.employee.name}
                    avatar={r.employee.avatar}
                    sub={r.employee.designation}
                  />
                </td>
                <td className="td">
                  <OutletLink
                    id={r.outlet?.id || r.outletId}
                    name={r.outlet?.name || r.outlet}
                  />
                </td>
                <td className="td">
                  {money(r.sales)}{" "}
                  <span className="text-slate-500">/ {money(r.target)}</span>
                </td>
                <td className="td">
                  <AchievementCell value={r.achievement} />
                </td>
                <td className="td font-semibold text-emerald-400">
                  {money(r.incentive)}
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={6}>
                  <EmptyState
                    title="No finalized records"
                    message="Finalize a sales batch or pick another date."
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </TableWrap>
    </Card>
  );
}

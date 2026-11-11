"use client";
import { useEffect, useRef, useState } from "react";
import { History, Save, Sparkles, Shuffle, Trash2, Upload } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api } from "@/lib/api";
import { parseCsv } from "@/lib/csv";
import { currentMonth, shiftMonth } from "@/lib/dates";
import { money, monthLabel } from "@/lib/format";
import Card, { CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Notice from "@/components/ui/Notice";
import PageHeader from "@/components/ui/PageHeader";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { Field, Input, Select } from "@/components/ui/Field";
import { EmptyState, ErrorBox, PageSkeleton } from "@/components/ui/States";
import { EmployeeCell, OutletLink, TableWrap } from "@/components/shared/cells";
import TierEditor, { validateTiers } from "@/components/shared/TierEditor";
import ManagerPolicyCard from "@/components/plans/ManagerPolicyCard";

const clone = (t) => t.map((x) => ({ min: x.min, amount: x.amount }));

export default function MonthlyPlanPage() {
  const { can } = useAuth();
  const toast = useToast();
  const fileRef = useRef(null);
  const [month, setMonth] = useState(currentMonth());
  const [outlet, setOutlet] = useState("");
  const [growth, setGrowth] = useState("10");
  const [outletTarget, setOutletTarget] = useState("");
  const [rows, setRows] = useState([]);
  const [custom, setCustom] = useState(false);
  const [senior, setSenior] = useState([]);
  const [junior, setJunior] = useState([]);
  const [busy, setBusy] = useState("");
  const [del, setDel] = useState(null);
  const readOnly = !can.canManagePlans;

  const outlets = useApi("/outlets");
  const active = (outlets.data || []).filter((o) => o.isActive);
  useEffect(() => {
    if (!outlet && active.length) setOutlet(active[0]._id);
  }, [active, outlet]);

  const plan = useApi("/plans", { month, outlet }, { enabled: !!outlet });
  const saved = useApi("/plans/list");
  const d =
    plan.data && plan.data.month === month && plan.data.outlet === outlet
      ? plan.data
      : null;

  // Fill the form whenever a plan (or the defaults) loads
  useEffect(() => {
    if (!d) return;
    setOutletTarget(
      d.plan?.outletTarget > 0 ? String(d.plan.outletTarget) : "",
    );
    setRows(
      d.effective.employees.map((e) => ({
        id: e.id,
        name: e.name,
        avatar: e.avatar,
        category: e.category,
        dailyTarget: String(e.dailyTarget ?? ""),
        monthlyTarget: String(e.monthlyTarget ?? ""),
        defaultDaily: e.defaultDaily,
        defaultMonthly: e.defaultMonthly,
      })),
    );
    const hasCustom = !!(
      d.plan &&
      (d.plan.senior?.length || d.plan.junior?.length)
    );
    setCustom(hasCustom);
    setSenior(
      clone(
        hasCustom && d.plan.senior.length ? d.plan.senior : d.defaults.senior,
      ),
    );
    setJunior(
      clone(
        hasCustom && d.plan.junior.length ? d.plan.junior : d.defaults.junior,
      ),
    );
  }, [d]);

  const setRow = (id, key, value) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
  const workingDays = d ? Math.max(1, d.workingDays) : 26;

  const suggest = async () => {
    setBusy("suggest");
    try {
      const r = await api("/plans/suggest", {
        params: { month, outlet, growth },
      });
      if (!r.lastMonthSales) {
        toast.error(`No finalized sales found for ${monthLabel(r.lastMonth)}.`);
        return;
      }
      setOutletTarget(String(r.suggested));
      toast.success(
        `${monthLabel(r.lastMonth)} sales were ${money(r.lastMonthSales)}. Suggested target ${money(r.suggested)} (+${r.growth}%).`,
      );
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy("");
    }
  };

  const spread = () => {
    const total = Number(outletTarget);
    if (!(total > 0)) {
      toast.error("Enter the outlet monthly target first");
      return;
    }
    const base = rows.map((r) => Number(r.monthlyTarget) || 0);
    const sum = base.reduce((a, b) => a + b, 0);
    setRows((rs) =>
      rs.map((r, i) => {
        const share = sum > 0 ? base[i] / sum : 1 / rs.length;
        const monthly = Math.round(total * share);
        return {
          ...r,
          monthlyTarget: String(monthly),
          dailyTarget: String(Math.round(monthly / workingDays)),
        };
      }),
    );
    toast.success(
      `Spread across ${rows.length} employees over ${workingDays} working days. Review, then save.`,
    );
  };

  const loadPrevious = async () => {
    setBusy("prev");
    try {
      const prev = await api("/plans", {
        params: { month: shiftMonth(month, -1), outlet },
      });
      if (!prev.plan) {
        toast.error(`No plan saved for ${monthLabel(shiftMonth(month, -1))}.`);
        return;
      }
      setOutletTarget(
        prev.plan.outletTarget > 0 ? String(prev.plan.outletTarget) : "",
      );
      const map = new Map(
        prev.plan.employeeTargets.map((t) => [String(t.employee), t]),
      );
      setRows((rs) =>
        rs.map((r) => {
          const t = map.get(String(r.id));
          return t
            ? {
                ...r,
                dailyTarget: String(t.dailyTarget || r.dailyTarget),
                monthlyTarget: String(t.monthlyTarget || r.monthlyTarget),
              }
            : r;
        }),
      );
      const hasCustom = !!(
        prev.plan.senior?.length || prev.plan.junior?.length
      );
      setCustom(hasCustom);
      if (hasCustom) {
        if (prev.plan.senior.length) setSenior(clone(prev.plan.senior));
        if (prev.plan.junior.length) setJunior(clone(prev.plan.junior));
      }
      toast.success(
        `Loaded ${monthLabel(shiftMonth(month, -1))}. Review, then save.`,
      );
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy("");
    }
  };

  const bulk = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    const table = parseCsv(await f.text());
    const h = (table[0] || []).map((x) => x.toLowerCase());
    const iName = h.findIndex((x) => x.includes("name"));
    const iDaily = h.findIndex((x) => x.includes("daily"));
    const iMonthly = h.findIndex((x) => x.includes("monthly"));
    if (iName < 0 || (iDaily < 0 && iMonthly < 0)) {
      toast.error(
        "CSV needs the columns: Employee Name, Daily Target, Monthly Target",
      );
      return;
    }
    let hit = 0;
    const byName = new Map(
      table.slice(1).map((r) => [String(r[iName]).trim().toLowerCase(), r]),
    );
    setRows((rs) =>
      rs.map((r) => {
        const row = byName.get(r.name.toLowerCase());
        if (!row) return r;
        hit += 1;
        return {
          ...r,
          dailyTarget:
            iDaily >= 0 && row[iDaily]
              ? String(Number(row[iDaily]) || r.dailyTarget)
              : r.dailyTarget,
          monthlyTarget:
            iMonthly >= 0 && row[iMonthly]
              ? String(Number(row[iMonthly]) || r.monthlyTarget)
              : r.monthlyTarget,
        };
      }),
    );
    toast.success(
      `${hit} of ${byName.size} CSV rows matched employees in this outlet. Review, then save.`,
    );
  };

  const save = async () => {
    if (custom) {
      const problem =
        validateTiers("Senior", senior) || validateTiers("Junior", junior);
      if (problem) {
        toast.error(problem);
        return;
      }
    }
    setBusy("save");
    try {
      const employeeTargets = rows
        .filter(
          (r) =>
            Number(r.dailyTarget) !== Number(r.defaultDaily) ||
            Number(r.monthlyTarget) !== Number(r.defaultMonthly),
        )
        .map((r) => ({
          employeeId: r.id,
          dailyTarget: Number(r.dailyTarget) || 0,
          monthlyTarget: Number(r.monthlyTarget) || 0,
        }));
      await api("/plans", {
        method: "PUT",
        body: {
          month,
          outlet,
          outletTarget: outletTarget === "" ? null : Number(outletTarget),
          employeeTargets,
          customPolicy: custom,
          senior: custom
            ? senior.map((t) => ({
                min: Number(t.min),
                amount: Number(t.amount),
              }))
            : [],
          junior: custom
            ? junior.map((t) => ({
                min: Number(t.min),
                amount: Number(t.amount),
              }))
            : [],
        },
      });
      toast.success("Plan saved. It applies to sales finalized from now on.");
      plan.reload();
      saved.reload();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy("");
    }
  };

  const remove = async () => {
    setBusy("del");
    try {
      await api(`/plans/${del.id}`, { method: "DELETE" });
      toast.success("Plan deleted. That month uses the defaults again.");
      setDel(null);
      plan.reload();
      saved.reload();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy("");
    }
  };

  const sumMonthly = rows.reduce(
    (s, r) => s + (Number(r.monthlyTarget) || 0),
    0,
  );

  return (
    <div>
      <PageHeader
        title="Monthly plan"
        subtitle="Set the sales target and incentive tiers for one outlet and month. A month without its own tiers uses the default Policy Settings tiers."
        actions={
          !readOnly && (
            <>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                hidden
                onChange={bulk}
              />
              <Button onClick={() => fileRef.current?.click()}>
                <Upload size={15} /> Bulk upload targets
              </Button>
              <Button onClick={loadPrevious} loading={busy === "prev"}>
                <History size={15} /> Load previous month
              </Button>
              <Button
                variant="primary"
                onClick={save}
                loading={busy === "save"}
                disabled={!d}
              >
                <Save size={15} /> Save plan
              </Button>
            </>
          )
        }
      />
      {readOnly && (
        <Notice tone="blue" title="View only.">
          Managers can read plans but can&apos;t change them.
        </Notice>
      )}

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Input
          type="month"
          value={month}
          onChange={(e) => e.target.value && setMonth(e.target.value)}
          className="!w-auto"
          aria-label="Month"
        />
        <Select
          value={outlet}
          onChange={(e) => setOutlet(e.target.value)}
          className="!w-auto min-w-[160px]"
          aria-label="Outlet"
        >
          {active.map((o) => (
            <option key={o._id} value={o._id}>
              {o.name}
            </option>
          ))}
        </Select>
        {d && (
          <span className="text-xs text-slate-400 sm:ml-auto">
            {d.plan ? (
              <Badge tone="green">Plan saved for {month}</Badge>
            ) : (
              <Badge tone="gray">No plan saved · defaults apply</Badge>
            )}
            <span className="ml-3">
              {d.workingDays} working days ({d.offDays} outlet off day
              {d.offDays === 1 ? "" : "s"})
            </span>
          </span>
        )}
      </div>

      {plan.error && !d && (
        <ErrorBox message={plan.error} onRetry={plan.reload} />
      )}
      {!d && plan.loading && <PageSkeleton />}

      {d && (
        <>
          <div className="mb-5 grid grid-cols-1 gap-4 xl:grid-cols-2 sm:gap-5">
            <Card>
              <CardHeader
                title="Outlet sales target"
                subtitle="Monthly target for the whole outlet"
              />
              <Field
                label="Outlet monthly target (৳)"
                hint={`Employee monthly targets add up to ${money(sumMonthly)}. Leave this blank to use that sum.`}
              >
                <Input
                  type="number"
                  min="0"
                  value={outletTarget}
                  disabled={readOnly}
                  onChange={(e) => setOutletTarget(e.target.value)}
                  placeholder={String(sumMonthly)}
                />
              </Field>
              {!readOnly && (
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <div className="relative w-28">
                    <Input
                      type="number"
                      min="0"
                      value={growth}
                      onChange={(e) => setGrowth(e.target.value)}
                      className="pr-8"
                      aria-label="Growth percent"
                    />
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                      %
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">
                    growth over last month
                  </span>
                  <Button onClick={suggest} loading={busy === "suggest"}>
                    <Sparkles size={15} /> Suggest target
                  </Button>
                  <Button onClick={spread}>
                    <Shuffle size={15} /> Spread across employees
                  </Button>
                </div>
              )}
            </Card>

            <Card>
              <CardHeader
                title="Incentive policy"
                subtitle={`Daily reward by achievement tier, for ${monthLabel(month)} and this outlet`}
                action={
                  <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={custom}
                      disabled={readOnly}
                      onChange={(e) => setCustom(e.target.checked)}
                      className="h-4 w-4 accent-brand-500"
                    />{" "}
                    Custom tiers for this month
                  </label>
                }
              />
              {!custom && (
                <Notice
                  tone="blue"
                  className="!mb-4"
                  title="Using default tiers."
                >
                  This month follows Policy Settings. Tick “Custom tiers” to set
                  different rewards for this outlet and month.
                </Notice>
              )}
              <div className="space-y-5">
                <TierEditor
                  title="Senior"
                  tiers={senior}
                  onChange={setSenior}
                  disabled={readOnly || !custom}
                />
                <TierEditor
                  title="Junior"
                  tiers={junior}
                  onChange={setJunior}
                  disabled={readOnly || !custom}
                />
              </div>
            </Card>
          </div>

          {can.canViewManagerIncentive && (
            <ManagerPolicyCard month={month} canEdit={!!can.isAdmin} />
          )}

          <Card pad={false} className="mb-5 overflow-hidden">
            <div className="px-5 py-4">
              <h3 className="text-sm font-semibold text-white">
                Employee targets for this month
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Daily target drives each person&apos;s achievement %. Only
                values that differ from the employee&apos;s default are saved as
                overrides.
              </p>
            </div>
            <TableWrap>
              <table className="w-full min-w-[720px]">
                <thead>
                  <tr>
                    {[
                      "Employee",
                      "Category",
                      "Daily target (৳)",
                      "Monthly target (৳)",
                    ].map((h) => (
                      <th key={h} className="th">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="tr-hover">
                      <td className="td">
                        <EmployeeCell
                          id={r.id}
                          name={r.name}
                          avatar={r.avatar}
                        />
                      </td>
                      <td className="td">{r.category || "Unassigned"}</td>
                      <td className="td">
                        <Input
                          type="number"
                          min="0"
                          value={r.dailyTarget}
                          disabled={readOnly}
                          onChange={(e) =>
                            setRow(r.id, "dailyTarget", e.target.value)
                          }
                          className="!w-36"
                          aria-label={`Daily target for ${r.name}`}
                        />
                      </td>
                      <td className="td">
                        <Input
                          type="number"
                          min="0"
                          value={r.monthlyTarget}
                          disabled={readOnly}
                          onChange={(e) =>
                            setRow(r.id, "monthlyTarget", e.target.value)
                          }
                          className="!w-40"
                          aria-label={`Monthly target for ${r.name}`}
                        />
                      </td>
                    </tr>
                  ))}
                  {!rows.length && (
                    <tr>
                      <td colSpan={4}>
                        <EmptyState title="No active employees in this outlet" />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </TableWrap>
          </Card>
        </>
      )}

      <Card pad={false} className="overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4">
          <h3 className="text-sm font-semibold text-white">All saved plans</h3>
          <Badge tone="blue">Newest first</Badge>
        </div>
        <TableWrap>
          <table className="w-full min-w-[760px]">
            <thead>
              <tr>
                {[
                  "Month",
                  "Outlet",
                  "Outlet target",
                  "Employee targets",
                  "Incentive policy",
                  ...(readOnly ? [] : ["Actions"]),
                ].map((h) => (
                  <th key={h} className="th">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(saved.data || []).map((p) => (
                <tr key={p.id} className="tr-hover">
                  <td className="td">{p.month}</td>
                  <td className="td">
                    <OutletLink id={p.outlet.id} name={p.outlet.name} />
                  </td>
                  <td className="td">
                    {p.outletTarget > 0 ? (
                      money(p.outletTarget)
                    ) : (
                      <span className="text-slate-500">Sum of employees</span>
                    )}
                  </td>
                  <td className="td">
                    {p.employeeTargets} override
                    {p.employeeTargets === 1 ? "" : "s"}
                  </td>
                  <td className="td">
                    <Badge tone={p.policy === "Custom" ? "amber" : "gray"}>
                      {p.policy}
                    </Badge>
                  </td>
                  {!readOnly && (
                    <td className="td">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            setMonth(p.month);
                            setOutlet(p.outlet.id);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="hover:!text-rose-300"
                          aria-label={`Delete plan ${p.month} ${p.outlet.name}`}
                          onClick={() => setDel(p)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {saved.data && !saved.data.length && (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      title="No plans saved yet"
                      message="Months without a plan use each employee's default targets and the default incentive tiers."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </TableWrap>
      </Card>

      <ConfirmDialog
        open={!!del}
        title="Delete this plan?"
        confirmLabel="Delete plan"
        loading={busy === "del"}
        onClose={() => setDel(null)}
        onConfirm={remove}
        message={`${del ? `${monthLabel(del.month)} · ${del.outlet.name}` : ""} will go back to the employees' default targets and the default incentive tiers. Days already finalized keep their original targets and incentives.`}
      />
    </div>
  );
}

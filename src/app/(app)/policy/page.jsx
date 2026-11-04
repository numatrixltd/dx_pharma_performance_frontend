"use client";
import { useEffect, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { api } from "@/lib/api";
import { money } from "@/lib/format";
import Card, { CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Notice from "@/components/ui/Notice";
import PageHeader from "@/components/ui/PageHeader";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { Field, Input, Select } from "@/components/ui/Field";
import { ErrorBox, PageSkeleton } from "@/components/ui/States";
import SharedTierEditor from "@/components/shared/TierEditor";

/** Returns an error message, or '' when the tiers are valid. */
function validateTiers(label, tiers) {
  if (!tiers.length) return `${label}: add at least one tier`;
  const mins = [];
  for (const t of tiers) {
    const min = Number(t.min);
    const amount = Number(t.amount);
    if (t.min === "" || !Number.isFinite(min) || min <= 0 || min > 1000)
      return `${label}: minimum achievement must be between 1% and 1000%`;
    if (t.amount === "" || !Number.isFinite(amount) || amount < 0)
      return `${label}: enter a reward for every tier (0 or more)`;
    mins.push(min);
  }
  if (new Set(mins).size !== mins.length)
    return `${label}: two tiers have the same minimum %`;
  return "";
}

function TierEditor({ title, tiers, onChange, disabled }) {
  const update = (i, key, value) =>
    onChange(tiers.map((t, j) => (j === i ? { ...t, [key]: value } : t)));
  const remove = (i) => onChange(tiers.filter((_, j) => j !== i));
  const add = () => {
    const top = Math.max(0, ...tiers.map((t) => Number(t.min) || 0));
    onChange([...tiers, { min: top ? top + 50 : 50, amount: "" }]);
  };
  const summary = [...tiers]
    .filter((t) => t.min !== "" && t.amount !== "")
    .sort((a, b) => Number(a.min) - Number(b.min))
    .map((t) => `${Number(t.min)}%+ → ${money(t.amount)}`)
    .join("  ·  ");

  return (
    <Card>
      <CardHeader
        title={title}
        subtitle="Daily incentive by achievement milestone. Set any percentage you like."
        action={
          !disabled && (
            <Button size="sm" onClick={add}>
              <Plus size={14} /> Add tier
            </Button>
          )
        }
      />
      <div className="grid grid-cols-[1fr_1fr_40px] gap-3 border-b border-ink-600/50 pb-2 text-xs font-semibold text-slate-400">
        <span>Minimum achievement (%)</span>
        <span>Reward (৳)</span>
        <span className="sr-only">Remove</span>
      </div>
      <div className="divide-y divide-ink-600/40">
        {tiers.map((t, i) => (
          <div
            key={i}
            className="grid grid-cols-[1fr_1fr_40px] items-center gap-3 py-3"
          >
            <div className="relative">
              <Input
                type="number"
                min="1"
                max="1000"
                step="any"
                value={t.min}
                disabled={disabled}
                aria-label={`${title} tier ${i + 1} minimum percent`}
                onChange={(e) => update(i, "min", e.target.value)}
                className="pr-9"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
                %
              </span>
            </div>
            <Input
              type="number"
              min="0"
              step="any"
              value={t.amount}
              disabled={disabled}
              placeholder="0"
              aria-label={`${title} tier ${i + 1} reward`}
              onChange={(e) => update(i, "amount", e.target.value)}
            />
            {!disabled && (
              <Button
                size="icon"
                variant="ghost"
                className="hover:!text-rose-300"
                disabled={tiers.length <= 1}
                aria-label={`Remove tier ${i + 1}`}
                title={
                  tiers.length <= 1
                    ? "At least one tier is required"
                    : "Remove tier"
                }
                onClick={() => remove(i)}
              >
                <Trash2 size={16} />
              </Button>
            )}
          </div>
        ))}
        {!tiers.length && (
          <p className="py-6 text-center text-xs text-slate-500">
            No tiers yet. Add one to start rewarding.
          </p>
        )}
      </div>
      {summary && (
        <p className="mt-4 rounded-xl bg-ink-900/60 px-3 py-2.5 text-xs leading-relaxed text-slate-400">
          <span className="font-semibold text-slate-300">How it pays:</span>{" "}
          {summary}
        </p>
      )}
    </Card>
  );
}

function OutletsCard({ canManage }) {
  const toast = useToast();
  const { data, reload } = useApi("/outlets");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [del, setDel] = useState(null);

  const add = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await api("/outlets", { method: "POST", body: { name: name.trim() } });
      setName("");
      toast.success("Outlet added");
      reload();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };
  const toggle = async (o) => {
    try {
      await api(`/outlets/${o._id}`, {
        method: "PUT",
        body: { isActive: !o.isActive },
      });
      reload();
    } catch (e) {
      toast.error(e.message);
    }
  };
  const remove = async () => {
    try {
      await api(`/outlets/${del._id}`, { method: "DELETE" });
      toast.success("Outlet deleted");
      setDel(null);
      reload();
    } catch (e) {
      toast.error(e.message);
      setDel(null);
    }
  };

  return (
    <Card className="mt-5">
      <CardHeader
        title="Outlets"
        subtitle="Outlets with employees or sales history can be disabled but not deleted."
      />
      <div className="divide-y divide-ink-600/40">
        {(data || []).map((o) => (
          <div
            key={o._id}
            className="flex flex-wrap items-center justify-between gap-3 py-3"
          >
            <div>
              <span className="font-semibold text-white">{o.name}</span>
              <span className="ml-3 text-xs text-slate-500">
                {o.employeeCount} active employee
                {o.employeeCount === 1 ? "" : "s"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={o.isActive ? "green" : "gray"}>
                {o.isActive ? "Active" : "Disabled"}
              </Badge>
              {canManage && (
                <>
                  <Button size="sm" onClick={() => toggle(o)}>
                    {o.isActive ? "Disable" : "Enable"}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Delete ${o.name}`}
                    className="hover:!text-rose-300"
                    onClick={() => setDel(o)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
      {canManage && (
        <div className="mt-4 flex gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New outlet name"
            onKeyDown={(e) => e.key === "Enter" && add()}
            aria-label="New outlet name"
          />
          <Button variant="primary" loading={busy} onClick={add}>
            <Plus size={16} /> Add outlet
          </Button>
        </div>
      )}
      <ConfirmDialog
        open={!!del}
        title={`Delete ${del?.name}?`}
        confirmLabel="Delete outlet"
        onClose={() => setDel(null)}
        onConfirm={remove}
        message="This permanently removes the outlet. It only works when the outlet has no employees or sales history."
      />
    </Card>
  );
}

export default function PolicyPage() {
  const { can } = useAuth();
  const toast = useToast();
  const { data, loading, error, reload } = useApi("/policy");
  const [senior, setSenior] = useState([]);
  const [junior, setJunior] = useState([]);
  const [slabs, setSlabs] = useState([]);
  const [bonuses, setBonuses] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!data) return;
    setSenior(data.senior);
    setJunior(data.junior);
    setSlabs(
      (data.manager?.outletSlabs || []).map((t) => ({
        min: t.min,
        amount: t.amount,
      })),
    );
    setBonuses(
      (data.manager?.allOutletBonuses || []).map((t) => ({
        min: t.min,
        amount: t.amount,
      })),
    );
  }, [data]);

  if (!data && loading) return <PageSkeleton />;
  if (!data && error) return <ErrorBox message={error} onRetry={reload} />;
  if (!data) return null;

  const save = async () => {
    const problem =
      validateTiers("Senior", senior) ||
      validateTiers("Junior", junior) ||
      (slabs.length ? validateTiers("Manager outlet slabs", slabs) : "") ||
      (bonuses.length ? validateTiers("All-outlet bonus", bonuses) : "");
    if (problem) {
      toast.error(problem);
      return;
    }
    setBusy(true);
    try {
      await api("/policy", {
        method: "PUT",
        body: {
          senior: senior.map((t) => ({
            min: Number(t.min),
            amount: Number(t.amount),
          })),
          junior: junior.map((t) => ({
            min: Number(t.min),
            amount: Number(t.amount),
          })),
          manager: {
            outletSlabs: slabs.map((t) => ({
              min: Number(t.min),
              amount: Number(t.amount),
            })),
            allOutletBonuses: bonuses.map((t) => ({
              min: Number(t.min),
              amount: Number(t.amount),
            })),
          },
        },
      });
      toast.success(
        "Policy saved. New rates apply to sales finalized from now on.",
      );
      reload();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };
  const readOnly = !can.canManagePolicy;
  const configured = slabs.length > 0;

  return (
    <div>
      <PageHeader
        title="Policy settings"
        subtitle={`Version ${data.version}. Changes apply to sales finalized after you save. Earlier finalized days keep their original rates.`}
        actions={
          !readOnly && (
            <Button variant="primary" loading={busy} onClick={save}>
              <Save size={15} /> Save policy changes
            </Button>
          )
        }
      />
      <Notice tone="amber" title="How rewards are paid:">
        Eligibility uses the unrounded achievement percentage. Only the highest
        tier an employee reaches is paid, so rewards never stack. Add, change or
        remove tiers separately for Senior and Junior, then save.
      </Notice>
      {readOnly && (
        <Notice tone="blue" title="View only.">
          Managers can read the policy but can&apos;t change it.
        </Notice>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 sm:gap-5">
        <TierEditor
          title="Senior salesperson rewards"
          tiers={senior}
          onChange={setSenior}
          disabled={readOnly}
        />
        <TierEditor
          title="Junior salesperson rewards"
          tiers={junior}
          onChange={setJunior}
          disabled={readOnly}
        />
      </div>

      <Card className="mt-5">
        <CardHeader
          title="Manager incentive policy"
          subtitle="Separate from salesperson rewards. Calculated monthly from each outlet's net sales against its approved monthly target (Monthly Plan)."
          action={
            <Badge tone={configured ? "green" : "amber"}>
              {configured ? "Configured" : "Pending configuration"}
            </Badge>
          }
        />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <SharedTierEditor
              title="Outlet slabs (per outlet)"
              tiers={slabs}
              onChange={setSlabs}
              disabled={readOnly}
              allowEmpty
            />
            <p className="mt-2 text-xs text-slate-500">
              Each outlet earns the highest slab its achievement reaches. For
              example 100%+ → ৳5,000 and 120%+ → ৳8,000.
            </p>
          </div>
          <div>
            <SharedTierEditor
              title="All-outlet bonus"
              tiers={bonuses}
              onChange={setBonuses}
              disabled={readOnly}
              allowEmpty
            />
            <p className="mt-2 text-xs text-slate-500">
              An extra bonus when every active outlet reaches the same tier.
              Leave empty for no bonus.
            </p>
          </div>
        </div>
        <p className="mt-5 text-xs text-slate-500">
          With no outlet slabs the manager incentive is not configured and
          nothing is calculated. Only admins, and manager accounts you grant
          access to in Users &amp; Access, can see the result under Manager
          Incentive. Settlement is recorded there by an admin; payment is never
          automatic.
        </p>
      </Card>

      <OutletsCard canManage={can.canManageOutlets} />
    </div>
  );
}

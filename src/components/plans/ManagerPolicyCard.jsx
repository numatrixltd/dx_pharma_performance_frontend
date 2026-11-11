"use client";
import { useEffect, useState } from "react";
import { RotateCcw, Save } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { useToast } from "@/context/ToastContext";
import { api } from "@/lib/api";
import { monthLabel } from "@/lib/format";
import Card, { CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Notice from "@/components/ui/Notice";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { Skeleton } from "@/components/ui/States";
import TierEditor, { validateTiers } from "@/components/shared/TierEditor";

const copy = (t) => (t || []).map((x) => ({ min: x.min, amount: x.amount }));

/**
 * Manager Incentive Policy · Monthly. Applies across all active outlets for the selected month.
 * A month without its own policy uses the default from Policy Settings.
 */
export default function ManagerPolicyCard({ month, canEdit }) {
  const toast = useToast();
  const { data, loading, error, reload } = useApi("/manager-policy", { month });
  const [slabs, setSlabs] = useState([]);
  const [bonuses, setBonuses] = useState([]);
  const [busy, setBusy] = useState("");
  const [confirm, setConfirm] = useState(false);
  const ready = data && data.month === month;

  useEffect(() => {
    if (!ready) return;
    setSlabs(copy(data.policy.outletSlabs));
    setBonuses(copy(data.policy.allOutletBonuses));
  }, [data, ready]);

  const save = async () => {
    const problem =
      validateTiers("Per-outlet reward", slabs) ||
      (bonuses.length ? validateTiers("All-outlet bonus", bonuses) : "");
    if (problem) {
      toast.error(problem);
      return;
    }
    setBusy("save");
    try {
      await api("/manager-policy", {
        method: "PUT",
        body: {
          month,
          outletSlabs: slabs.map((t) => ({
            min: Number(t.min),
            amount: Number(t.amount),
          })),
          allOutletBonuses: bonuses.map((t) => ({
            min: Number(t.min),
            amount: Number(t.amount),
          })),
        },
      });
      toast.success(`Manager incentive policy saved for ${monthLabel(month)}`);
      await reload();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy("");
    }
  };

  const useDefault = async () => {
    setBusy("reset");
    try {
      await api("/manager-policy", { method: "DELETE", params: { month } });
      toast.success(`${monthLabel(month)} now uses the default policy`);
      setConfirm(false);
      await reload();
    } catch (e) {
      toast.error(e.message);
      setConfirm(false);
    } finally {
      setBusy("");
    }
  };

  return (
    <Card className="mb-5">
      <CardHeader
        title="Manager Incentive Policy · Monthly"
        subtitle="Set the manager's payout amounts for the selected month. Applies across all active outlets."
        action={<Badge tone="blue">Admin only · confidential</Badge>}
      />
      <Notice tone="amber" className="!mb-5">
        For each outlet, only the highest achieved slab is paid. If every active
        outlet reaches the same milestone, the corresponding all-outlet bonus is
        added. Only finalized net sales count.
      </Notice>

      {!ready && loading && <Skeleton className="h-48" />}
      {!ready && error && (
        <p className="text-sm text-rose-300">
          Couldn&apos;t load the policy: {error}
        </p>
      )}
      {ready && (
        <>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div>
              <h4 className="mb-3 text-base font-semibold text-white">
                Per-outlet reward
              </h4>
              <TierEditor
                title="Reward when an outlet reaches"
                tiers={slabs}
                onChange={setSlabs}
                disabled={!canEdit}
              />
            </div>
            <div>
              <h4 className="mb-3 text-base font-semibold text-white">
                Additional bonus when all outlets achieve the same slab
              </h4>
              <TierEditor
                title="Bonus when all outlets reach"
                tiers={bonuses}
                onChange={setBonuses}
                disabled={!canEdit}
                allowEmpty
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <p className="max-w-2xl text-sm text-slate-400">
              {data.custom
                ? `A specific manager incentive policy is saved for ${month}. Changes take effect after you save this month's policy.`
                : `No policy is saved for ${month}, so the default from Policy Settings applies${data.defaults.outletSlabs.length ? "" : " (and it has no slabs yet)"}. Save below to set one for this month.`}
            </p>
            {canEdit && (
              <div className="flex flex-wrap gap-2">
                {data.custom && (
                  <Button onClick={() => setConfirm(true)} disabled={!!busy}>
                    <RotateCcw size={15} /> Use default policy
                  </Button>
                )}
                <Button
                  variant="primary"
                  onClick={save}
                  loading={busy === "save"}
                >
                  <Save size={15} /> Save manager incentive policy for this
                  month
                </Button>
              </div>
            )}
          </div>
          {!canEdit && (
            <p className="mt-3 text-xs text-slate-500">
              Only an admin can change the manager incentive policy.
            </p>
          )}
        </>
      )}

      <ConfirmDialog
        open={confirm}
        tone="primary"
        title="Use the default policy?"
        confirmLabel="Use default"
        loading={busy === "reset"}
        onClose={() => setConfirm(false)}
        onConfirm={useDefault}
        message={`The policy saved for ${monthLabel(month)} is removed. That month goes back to the default manager slabs from Policy Settings, and the Manager Incentive page recalculates. Settlements already recorded keep the amounts they were saved with.`}
      />
    </Card>
  );
}

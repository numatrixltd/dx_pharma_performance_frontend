"use client";
import { useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { api, downloadFile } from "@/lib/api";
import { longDate } from "@/lib/format";
import Card, { CardHeader } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import DangerDialog from "./DangerDialog";

const LABELS = {
  outlets: "outlets",
  employees: "employees",
  salesRecords: "sales records",
  monthlyPlans: "monthly plans",
  attendanceMarks: "attendance marks",
  outletOffDays: "outlet off days",
  managerSettlements: "manager settlements",
  managerPolicies: "monthly manager policies",
};

export default function BackupRestore() {
  const toast = useToast();
  const fileRef = useRef(null);
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState("");

  const download = async () => {
    setBusy("backup");
    try {
      await downloadFile("/admin/backup", undefined, "dx-pharma-backup.json");
      toast.success("Backup downloaded. Keep it somewhere safe.");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy("");
    }
  };

  const pick = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try {
      const backup = JSON.parse(await f.text());
      if (backup?.meta?.app !== "dx-pharma-arena-backup" || !backup.collections)
        throw new Error("bad");
      setPending({ backup, name: f.name });
    } catch {
      toast.error("That file is not a DX Pharma Arena backup.");
    }
  };

  const restore = async ({ confirm, password }) => {
    setBusy("restore");
    try {
      await api("/admin/restore", {
        method: "POST",
        body: { backup: pending.backup, confirm, password },
      });
      toast.success("Backup restored. Reloading…");
      setPending(null);
      setTimeout(() => window.location.reload(), 1200);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy("");
    }
  };

  const counts = pending?.backup.meta.counts || {};

  return (
    <Card>
      <CardHeader
        title="Backup & restore"
        subtitle="Download everything as a file, or restore from one."
      />
      <div className="flex flex-wrap gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={pick}
        />
        <Button
          variant="primary"
          onClick={download}
          loading={busy === "backup"}
        >
          <Download size={15} /> Download backup (JSON)
        </Button>
        <Button onClick={() => fileRef.current?.click()}>
          <Upload size={15} /> Restore from backup
        </Button>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-slate-500">
        A backup holds outlets, employees, sales records, policies, settings
        (including the theme), monthly plans, attendance and settlements. User
        accounts and passwords are not included, and they are never changed by a
        restore.
      </p>

      <DangerDialog
        open={!!pending}
        title="Restore from backup?"
        word="RESTORE"
        confirmLabel="Restore backup"
        loading={busy === "restore"}
        onClose={() => setPending(null)}
        onConfirm={restore}
      >
        <p>
          <strong className="text-white">This replaces all current data</strong>{" "}
          with the contents of{" "}
          <span className="font-mono">{pending?.name}</span>
          {pending?.backup.meta.createdAt
            ? ` (made ${longDate(pending.backup.meta.createdAt.slice(0, 10))})`
            : ""}
          . Anything entered since then is lost. Download a fresh backup first
          if unsure.
        </p>
        <ul className="mt-2 list-disc pl-5">
          {Object.entries(LABELS).map(([k, l]) => (
            <li key={k}>
              {counts[k] ?? 0} {l}
            </li>
          ))}
        </ul>
      </DangerDialog>
    </Card>
  );
}

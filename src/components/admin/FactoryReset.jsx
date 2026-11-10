'use client';
import { useState } from 'react';
import { useToast } from '@/context/ToastContext';
import { api } from '@/lib/api';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import DangerDialog from './DangerDialog';

export default function FactoryReset() {
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const run = async ({ confirm }) => {
    setBusy(true);
    try {
      await api('/admin/factory-reset', { method: 'POST', body: { confirm, password } });
      toast.success('Workspace reset. Reloading…');
      setOpen(false);
      setTimeout(() => window.location.reload(), 1200);
    } catch (e) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  return (
    <Card className="!border-rose-500/30">
      <h3 className="text-sm font-semibold text-rose-300">Factory reset</h3>
      <p className="mt-1 text-xs text-slate-400">Erases all employees, sales records, policies and settings, returning the workspace to a blank state. The admin password is not changed.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Admin password" autoComplete="current-password" className="!w-60" aria-label="Admin password" />
        <Button variant="danger" disabled={!password} onClick={() => setOpen(true)}>Factory reset…</Button>
      </div>

      <DangerDialog open={open} title="Factory reset the workspace?" word="RESET" needPassword={false} confirmLabel="Erase everything" loading={busy} onClose={() => setOpen(false)} onConfirm={run}>
        <p><strong className="text-white">This erases everything below and cannot be undone:</strong></p>
        <ul className="mt-2 list-disc pl-5">
          <li>All employees and their photos</li>
          <li>All sales records, attendance marks and outlet off days</li>
          <li>Outlets, monthly plans and manager settlements</li>
          <li>Reward tiers, manager slabs, attendance rules and the theme (they return to defaults)</li>
        </ul>
        <p className="mt-2">User accounts, passwords and the audit log are kept. Download a backup first if you may need this data.</p>
      </DangerDialog>
    </Card>
  );
}
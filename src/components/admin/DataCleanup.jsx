'use client';
import { useState } from 'react';
import { useToast } from '@/context/ToastContext';
import { api } from '@/lib/api';
import { defaultReportDate, todayISO } from '@/lib/dates';
import { longDate } from '@/lib/format';
import Card, { CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Field, Input } from '@/components/ui/Field';
import DangerDialog from './DangerDialog';

const n = (v) => Number(v || 0).toLocaleString('en-US');

export default function DataCleanup() {
  const toast = useToast();
  const [from, setFrom] = useState(defaultReportDate());
  const [to, setTo] = useState(defaultReportDate());
  const [dlg, setDlg] = useState(null); // { kind, counts }
  const [busy, setBusy] = useState('');
  const invalid = !from || !to || from > to;

  const open = async (kind) => {
    setBusy(kind);
    try {
      const counts = await api('/admin/counts', { params: kind === 'range' ? { from, to } : undefined });
      setDlg({ kind, counts });
    } catch (e) { toast.error(e.message); }
    finally { setBusy(''); }
  };

  const run = async ({ confirm, password }) => {
    setBusy('run');
    try {
      const body = { confirm, password };
      const r = dlg.kind === 'range' ? await api('/admin/cleanup/sales-range', { method: 'POST', body: { ...body, from, to } })
        : dlg.kind === 'sales' ? await api('/admin/cleanup/sales-all', { method: 'POST', body })
        : await api('/admin/cleanup/employees-and-sales', { method: 'POST', body });
      toast.success(dlg.kind === 'employees' ? `${n(r.employees)} employees and ${n(r.sales)} sales records deleted` : `${n(r.deleted)} sales records deleted`);
      setDlg(null);
    } catch (e) { toast.error(e.message); }
    finally { setBusy(''); }
  };

  const resetTiers = async () => {
    setBusy('tiers');
    try { await api('/admin/cleanup/reset-tiers', { method: 'POST' }); toast.success('Reward tiers reset to the defaults'); setDlg(null); }
    catch (e) { toast.error(e.message); }
    finally { setBusy(''); }
  };

  const c = dlg?.counts;
  return (
    <Card>
      <CardHeader title="Data cleanup" subtitle="Download a backup first — these cannot be undone." />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Delete from"><Input type="date" value={from} max={todayISO()} onChange={(e) => setFrom(e.target.value)} /></Field>
        <Field label="Delete to"><Input type="date" value={to} max={todayISO()} onChange={(e) => setTo(e.target.value)} /></Field>
      </div>
      {invalid && <p className="mt-2 text-xs text-rose-300">Choose a valid range: the start date must not be after the end date.</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={() => open('range')} loading={busy === 'range'} disabled={invalid}>Delete sales in date range</Button>
        <Button onClick={() => open('sales')} loading={busy === 'sales'}>Delete all sales records</Button>
        <Button onClick={() => open('employees')} loading={busy === 'employees'}>Delete all employees &amp; sales</Button>
        <Button onClick={() => setDlg({ kind: 'tiers' })}>Reset reward tiers to default</Button>
      </div>

      <DangerDialog open={dlg?.kind === 'range'} title="Delete sales in this date range?" word="DELETE" confirmLabel="Delete sales" loading={busy === 'run'} onClose={() => setDlg(null)} onConfirm={run}>
        <p><strong className="text-white">{n(c?.range?.sales)} sales records</strong> from {longDate(from)} to {longDate(to)} will be deleted permanently{c?.range?.paid ? `, including ${n(c.range.paid)} whose incentive is already marked paid` : ''}. Rankings, incentives and reports for those days will change.</p>
      </DangerDialog>
      <DangerDialog open={dlg?.kind === 'sales'} title="Delete ALL sales records?" word="DELETE" confirmLabel="Delete all sales" loading={busy === 'run'} onClose={() => setDlg(null)} onConfirm={run}>
        <p><strong className="text-white">All {n(c?.sales)} sales records</strong> will be deleted permanently{c?.paid ? `, including ${n(c.paid)} with paid incentives` : ''}. Employees, outlets, plans and policies are kept.</p>
      </DangerDialog>
      <DangerDialog open={dlg?.kind === 'employees'} title="Delete ALL employees and sales?" word="DELETE" confirmLabel="Delete everything" loading={busy === 'run'} onClose={() => setDlg(null)} onConfirm={run}>
        <p><strong className="text-white">All {n(c?.employees)} employees and all {n(c?.sales)} sales records</strong> will be deleted permanently, along with their attendance marks, photos and per-employee plan targets. Outlets, policies and user accounts are kept.</p>
      </DangerDialog>
      <ConfirmDialog open={dlg?.kind === 'tiers'} tone="primary" title="Reset reward tiers?" confirmLabel="Reset tiers" loading={busy === 'tiers'} onClose={() => setDlg(null)} onConfirm={resetTiers}
        message="Senior and Junior reward tiers go back to the defaults (100% / 150% / 200%). Manager incentive slabs and monthly plans are not changed, and days already finalized keep their incentives." />
    </Card>
  );
}
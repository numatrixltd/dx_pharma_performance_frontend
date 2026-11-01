'use client';
import { useEffect, useMemo, useState } from 'react';
import { Lock, Search, Send, Save } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { api } from '@/lib/api';
import { defaultReportDate, todayISO } from '@/lib/dates';
import { money, pct } from '@/lib/format';
import { calcAchievement, calcIncentive } from '@/lib/incentive';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Notice from '@/components/ui/Notice';
import PageHeader from '@/components/ui/PageHeader';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { Field, Input, Select } from '@/components/ui/Field';
import { EmptyState, ErrorBox, Skeleton } from '@/components/ui/States';
import { CategoryBadge, EmployeeCell, TableWrap } from '@/components/shared/cells';

export default function SalesEntryPage() {
  const { can } = useAuth();
  const toast = useToast();
  const [outlet, setOutlet] = useState('');
  const [date, setDate] = useState(defaultReportDate());
  const [search, setSearch] = useState('');
  const [values, setValues] = useState({});
  const [busy, setBusy] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [result, setResult] = useState(null);

  const outlets = useApi('/outlets');
  const policy = useApi('/policy');
  const active = (outlets.data || []).filter((o) => o.isActive);
  useEffect(() => { if (!outlet && active.length) setOutlet(active[0]._id); }, [active, outlet]);

  const sheet = useApi('/sales/sheet', { outlet, date }, { enabled: !!outlet });

  useEffect(() => {
    if (!sheet.data) return;
    const next = {};
    sheet.data.rows.forEach((r) => { next[r.employee.id] = r.record ? String(r.record.sales) : ''; });
    setValues(next);
    setResult(null);
  }, [sheet.data]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (sheet.data?.rows || []).filter((r) => !q || r.employee.name.toLowerCase().includes(q));
  }, [sheet.data, search]);

  const calc = (r) => {
    const v = values[r.employee.id];
    if (v === '' || v === undefined) return null;
    const sales = Math.max(0, Number(v));
    const ach = calcAchievement(sales, r.dailyTarget);
    return { sales, ach, inc: r.category ? calcIncentive(r.category, ach, policy.data) : null };
  };

  const all = sheet.data?.rows || [];
  const filled = all.filter((r) => values[r.employee.id] !== '' && values[r.employee.id] !== undefined);
  const totals = filled.reduce((a, r) => {
    const c = calc(r);
    return { sales: a.sales + c.sales, target: a.target + r.dailyTarget, inc: a.inc + (c.inc || 0) };
  }, { sales: 0, target: 0, inc: 0 });

  const submit = async (status) => {
    const entries = filled.map((r) => ({ employeeId: r.employee.id, sales: Number(values[r.employee.id]) }));
    if (!entries.length) { toast.error('Enter at least one sales amount'); setConfirm(false); return; }
    setBusy(status);
    try {
      const out = await api('/sales/batch', { method: 'POST', body: { outlet, date, status, entries } });
      toast.success(`${status === 'Finalized' ? 'Sales finalized' : 'Draft saved'} for ${out.saved} employee${out.saved === 1 ? '' : 's'}`);
      await sheet.reload();
      setResult(out.skipped?.length ? out.skipped : null);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy('');
      setConfirm(false);
    }
  };

  if (!can.canEnterSales) return <EmptyState title="You don't have access to sales entry" message="Ask an admin to enter daily sales." />;

  return (
    <div>
      <PageHeader title="Daily sales entry" subtitle="Enter previous-day sales in one table, preview incentives, then save a draft or finalize." actions={<Badge tone={sheet.data?.batchStatus === 'Finalized' ? 'green' : sheet.data?.batchStatus === 'Draft' ? 'amber' : 'gray'}>{sheet.data?.batchStatus || 'Not started'}</Badge>} />
      <Notice tone="amber" title="Workflow:">Choose outlet and date → enter actual sales → preview incentives → save draft or finalize. Drafts do not count in rankings. Finalizing locks the target, category and incentive for that day, and later corrections are audited.</Notice>

      <Card className="mb-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Outlet">
            <Select value={outlet} onChange={(e) => setOutlet(e.target.value)}>{active.map((o) => <option key={o._id} value={o._id}>{o.name}</option>)}</Select>
          </Field>
          <Field label="Sales date"><Input type="date" value={date} max={todayISO()} onChange={(e) => e.target.value && setDate(e.target.value)} /></Field>
          <Field label="Batch status"><Input readOnly value={sheet.data?.batchStatus || '—'} /></Field>
        </div>
      </Card>

      {sheet.error && !sheet.data && <ErrorBox message={sheet.error} onRetry={sheet.reload} />}
      {!sheet.data && sheet.loading && <Skeleton className="h-96" />}

      {sheet.data && (
        <Card pad={false} className="overflow-hidden">
          <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Employee sales input</h3>
              <p className="mt-1 text-xs text-slate-400">Use 0 for confirmed zero sales. Leave blank if not reported.</p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employee…" className="pl-10" aria-label="Search employee" />
            </div>
          </div>

          <TableWrap>
            <table className="w-full min-w-[860px]">
              <thead><tr>{['Employee', 'Category', 'Daily target', 'Actual sales (৳)', 'Achievement', 'Incentive preview', 'Status'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
              <tbody>
                {rows.map((r) => {
                  const c = calc(r);
                  const locked = r.record?.payment === 'Paid';
                  return (
                    <tr key={r.employee.id} className="tr-hover">
                      <td className="td"><EmployeeCell name={r.employee.name} avatar={r.employee.avatar} sub={r.employee.designation} /></td>
                      <td className="td"><CategoryBadge category={r.category} /></td>
                      <td className="td">{money(r.dailyTarget)}</td>
                      <td className="td">
                        <Input type="number" min="0" inputMode="numeric" disabled={locked} value={values[r.employee.id] ?? ''} placeholder="Enter sales" aria-label={`Sales for ${r.employee.name}`}
                          onChange={(e) => setValues((v) => ({ ...v, [r.employee.id]: e.target.value }))} className="!w-36" />
                      </td>
                      <td className="td font-semibold text-white">{c ? pct(c.ach) : '—'}</td>
                      <td className="td font-semibold text-emerald-400">{c ? (r.category ? money(c.inc) : <span className="text-xs font-normal text-amber-400">Category needed</span>) : '—'}</td>
                      <td className="td">
                        {locked ? <Badge tone="gray"><Lock size={11} /> Paid</Badge> : r.record ? <Badge tone={r.record.status === 'Finalized' ? 'green' : 'amber'}>{r.record.status}</Badge> : <span className="text-slate-500">—</span>}
                      </td>
                    </tr>
                  );
                })}
                {!rows.length && <tr><td colSpan={7}><EmptyState title="No employees match" message="Check the outlet and search, or add employees first." /></td></tr>}
              </tbody>
            </table>
          </TableWrap>

          <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-ink-600/50 bg-ink-900/40 px-5 py-3.5 text-xs text-slate-400">
            <span>Employees entered: <strong className="text-white">{filled.length} / {all.length}</strong></span>
            <span>Entered sales: <strong className="text-white">{money(totals.sales)}</strong></span>
            <span>Potential target: <strong className="text-white">{money(totals.target)}</strong></span>
            <span>Preview incentives: <strong className="text-emerald-400">{money(totals.inc)}</strong></span>
          </div>

          {result && (
            <div className="border-t border-ink-600/50 px-5 py-3 text-xs text-amber-200">
              <strong className="text-white">Some rows were skipped:</strong>
              <ul className="mt-1 list-disc pl-5">{result.map((s, i) => <li key={i}>{s.name}: {s.reason}</li>)}</ul>
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-2 border-t border-ink-600/50 px-5 py-4">
            <Button onClick={() => submit('Draft')} loading={busy === 'Draft'} disabled={!!busy}><Save size={15} /> Save draft</Button>
            {can.canFinalizeSales && <Button variant="primary" onClick={() => setConfirm(true)} disabled={!!busy}><Send size={15} /> Finalize sales batch</Button>}
          </div>
        </Card>
      )}

      <ConfirmDialog open={confirm} tone="primary" title="Finalize this batch?" confirmLabel="Finalize" loading={busy === 'Finalized'} onClose={() => setConfirm(false)} onConfirm={() => submit('Finalized')}
        message={`This finalizes ${filled.length} sales record${filled.length === 1 ? '' : 's'} for ${date}. Targets, categories and incentives are locked in and will count in rankings. Later corrections are audited.`} />
    </div>
  );
}

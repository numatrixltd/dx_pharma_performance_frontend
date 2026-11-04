'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Lock, Save, Search, Send } from 'lucide-react';
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
  const [values, setValues] = useState({}); // employeeId -> typed sales (string)
  const [busy, setBusy] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [result, setResult] = useState(null);
  const inputs = useRef({});

  const outlets = useApi('/outlets');
  const active = (outlets.data || []).filter((o) => o.isActive);
  useEffect(() => { if (!outlet && active.length) setOutlet(active[0]._id); }, [active, outlet]);

  const sheet = useApi('/sales/sheet', { outlet, date }, { enabled: !!outlet });
  const policy = sheet.data?.policy;
  const quota = sheet.data?.rosterQuota ?? 4;

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

  const isTyped = (r) => values[r.employee.id] !== '' && values[r.employee.id] !== undefined;

  const calc = (r) => {
    if (!isTyped(r)) return null;
    const sales = Math.max(0, Number(values[r.employee.id]));
    const ach = calcAchievement(sales, r.dailyTarget);
    return { sales, ach, inc: r.category ? calcIncentive(r.category, ach, policy) : null };
  };

  const all = sheet.data?.rows || [];
  const filled = all.filter(isTyped);
  const totals = filled.reduce((a, r) => {
    const c = calc(r);
    return { sales: a.sales + c.sales, target: a.target + r.dailyTarget, inc: a.inc + (c.inc || 0) };
  }, { sales: 0, target: 0, inc: 0 });
  const offCount = all.filter((r) => !isTyped(r) && r.mark === 'Off').length;
  const absentCount = all.length - filled.length - offCount;

  /** Attendance dropdown. Present = sales typed. Absent / Day off save instantly. */
  const changeAttendance = async (r, v) => {
    const id = r.employee.id;
    try {
      if (v === 'present') {
        if (r.mark) { await api('/attendance/mark', { method: 'POST', body: { employeeId: id, date, status: 'Clear' } }); await sheet.reload(); }
        setTimeout(() => inputs.current[id]?.focus(), 150);
        return;
      }
      setValues((x) => ({ ...x, [id]: '' }));
      const res = await api('/attendance/mark', { method: 'POST', body: { employeeId: id, date, status: v === 'off' ? 'Off' : 'Absent' } });
      if (res.beyondQuota) toast.error(`Day off saved, but ${r.employee.name} is beyond the monthly quota (${res.offUsed}/${res.quota}). It counts as absent.`);
      else toast.success('Attendance saved');
      await sheet.reload();
    } catch (e) {
      toast.error(e.message);
      sheet.reload();
    }
  };

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

  const usingPlan = policy?.source === 'plan';

  return (
    <div>
      <PageHeader title="Daily sales entry" subtitle="Enter previous-day sales and attendance in one table, preview incentives, then save a draft or finalize." actions={<Badge tone={sheet.data?.batchStatus === 'Finalized' ? 'green' : sheet.data?.batchStatus === 'Draft' ? 'amber' : 'gray'}>{sheet.data?.batchStatus || 'Not started'}</Badge>} />
      <Notice tone="amber" title="Workflow:">
        Choose outlet and date → enter actual sales → preview incentives → save draft or finalize. <strong className="text-white">Attendance:</strong> entering sales marks a person present. For anyone without sales choose <em>Absent</em> or <em>Day off</em> (roster off is limited per month). A blank row counts as absent once the day has closed. Attendance marks save instantly.
      </Notice>

      {sheet.data?.outletOff && <Notice tone="blue" title="Outlet off day.">This outlet is marked off on {date}. Attendance is not counted for this date, but you can still enter sales if the outlet traded.</Notice>}

      <Card className="mb-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Outlet"><Select value={outlet} onChange={(e) => setOutlet(e.target.value)}>{active.map((o) => <option key={o._id} value={o._id}>{o.name}</option>)}</Select></Field>
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
            <table className="w-full min-w-[1020px]">
              <thead><tr>{['Employee', 'Category', 'Daily target', 'Attendance', 'Actual sales (৳)', 'Achievement', 'Incentive preview', 'Status'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
              <tbody>
                {rows.map((r) => {
                  const id = r.employee.id;
                  const c = calc(r);
                  const typed = isTyped(r);
                  const paid = r.record?.payment === 'Paid';
                  const att = typed ? 'present' : r.mark === 'Off' ? 'off' : 'absent';
                  const beyond = r.mark === 'Off' && r.offUsed > quota;
                  const sub = att === 'present' ? `Present · off used ${r.offUsed}/${quota}`
                    : att === 'off' ? (beyond ? 'Off beyond quota · counts absent' : `Day off · off used ${r.offUsed}/${quota}`)
                    : r.mark ? 'Absent' : sheet.data.outletOff ? 'Outlet off day' : 'Counts as absent';
                  return (
                    <tr key={id} className="tr-hover">
                      <td className="td"><EmployeeCell id={id} name={r.employee.name} avatar={r.employee.avatar} sub={r.employee.designation} /></td>
                      <td className="td"><CategoryBadge category={r.category} /></td>
                      <td className="td">{money(r.dailyTarget)}</td>
                      <td className="td">
                        <Select
                          value={att}
                          disabled={!can.canMarkAttendance || !!r.record}
                          onChange={(e) => changeAttendance(r, e.target.value)}
                          className="!w-44 !py-1.5 !text-xs"
                          aria-label={`Attendance for ${r.employee.name}`}
                        >
                          <option value="present">Present (via sales)</option>
                          <option value="absent">Absent</option>
                          <option value="off">Day off</option>
                        </Select>
                        <div className={`mt-1 text-[11px] ${att === 'absent' || beyond ? 'text-rose-300/80' : 'text-slate-500'}`}>{sub}</div>
                      </td>
                      <td className="td">
                        <Input
                          ref={(el) => { inputs.current[id] = el; }}
                          type="number"
                          min="0"
                          inputMode="numeric"
                          disabled={paid || (!!r.mark && !typed)}
                          value={values[id] ?? ''}
                          placeholder={r.mark === 'Off' ? 'Day off' : r.mark === 'Absent' ? 'Absent' : 'Enter sales'}
                          aria-label={`Sales for ${r.employee.name}`}
                          onChange={(e) => setValues((v) => ({ ...v, [id]: e.target.value }))}
                          className="!w-36"
                        />
                      </td>
                      <td className="td font-semibold text-white">{c ? pct(c.ach) : '—'}</td>
                      <td className="td font-semibold text-emerald-400">{c ? (r.category ? money(c.inc) : <span className="text-xs font-normal text-amber-400">Category needed</span>) : '—'}</td>
                      <td className="td">
                        {paid ? <Badge tone="gray"><Lock size={11} /> Paid</Badge> : r.record ? <Badge tone={r.record.status === 'Finalized' ? 'green' : 'amber'}>{r.record.status}</Badge> : <span className="text-slate-500">—</span>}
                      </td>
                    </tr>
                  );
                })}
                {!rows.length && <tr><td colSpan={8}><EmptyState title="No employees match" message="Check the outlet and search, or add employees first." /></td></tr>}
              </tbody>
            </table>
          </TableWrap>

          <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-ink-600/50 bg-ink-900/40 px-5 py-3.5 text-xs text-slate-400">
            <span>Employees entered: <strong className="text-white">{filled.length} / {all.length}</strong></span>
            <span>Entered sales: <strong className="text-white">{money(totals.sales)}</strong></span>
            <span>Potential target: <strong className="text-white">{money(totals.target)}</strong></span>
            <span>Preview incentives: <strong className="text-emerald-400">{money(totals.inc)}</strong></span>
            <span>Absent: <strong className="text-rose-300">{absentCount}</strong> · Day off: <strong className="text-brand-300">{offCount}</strong></span>
            <span className="sm:ml-auto">Incentive tiers: <strong className={usingPlan ? 'text-amber-300' : 'text-white'}>{usingPlan ? 'Monthly plan' : 'Default policy'}</strong></span>
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
        message={`This finalizes ${filled.length} sales record${filled.length === 1 ? '' : 's'} for ${date}. Targets, categories and incentives are locked in and count in rankings. ${absentCount} employee${absentCount === 1 ? '' : 's'} without sales will count as absent${offCount ? ` and ${offCount} as day off` : ''}. Later corrections are audited.`} />
    </div>
  );
}
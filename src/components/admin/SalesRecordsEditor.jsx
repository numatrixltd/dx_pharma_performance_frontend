'use client';
import { useEffect, useState } from 'react';
import { useApi } from '@/hooks/useApi';
import { useToast } from '@/context/ToastContext';
import { api } from '@/lib/api';
import { defaultReportDate, todayISO } from '@/lib/dates';
import { money, pct } from '@/lib/format';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import OutletSelect from '@/components/ui/OutletSelect';
import { Input, Select } from '@/components/ui/Field';
import { EmptyState, ErrorBox, Skeleton } from '@/components/ui/States';
import { EmployeeCell, TableWrap } from '@/components/shared/cells';

const FIELDS = ['sales', 'status', 'approval', 'payment'];

/** Edit or delete any sales record (draft or finalized) for a chosen date. */
export default function SalesRecordsEditor() {
  const toast = useToast();
  const [date, setDate] = useState(defaultReportDate());
  const [outlet, setOutlet] = useState('All');
  const { data, loading, error, reload } = useApi('/admin/sales', { date, outlet });
  const [edits, setEdits] = useState({});
  const [busy, setBusy] = useState('');
  const [del, setDel] = useState(null);

  useEffect(() => setEdits({}), [data]);

  const val = (r, k) => (edits[r.id] && edits[r.id][k] !== undefined ? edits[r.id][k] : r[k]);
  const dirty = (r) => FIELDS.some((k) => String(val(r, k)) !== String(r[k]));
  const set = (r, k, v) => setEdits((e) => {
    const next = { ...e[r.id], [k]: v };
    if (k === 'status' && v === 'Draft') { next.approval = 'Pending approval'; next.payment = 'Unpaid'; }
    return { ...e, [r.id]: next };
  });

  const save = async (r) => {
    setBusy(r.id);
    try {
      await api(`/admin/sales/${r.id}`, { method: 'PUT', body: { sales: Number(val(r, 'sales')), status: val(r, 'status'), approval: val(r, 'approval'), payment: val(r, 'payment') } });
      toast.success(`${r.employee.name}: record saved`);
      await reload();
    } catch (e) { toast.error(e.message); }
    finally { setBusy(''); }
  };

  const remove = async () => {
    setBusy('del');
    try { await api(`/sales/${del.id}`, { method: 'DELETE' }); toast.success('Sales record deleted'); setDel(null); await reload(); }
    catch (e) { toast.error(e.message); setDel(null); }
    finally { setBusy(''); }
  };

  return (
    <Card pad={false} className="overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Edit or delete sales records</h3>
          <p className="mt-1 text-xs text-slate-400">Pick a date, change the values and click Save, or delete the record. Saving recalculates the incentive and is written to the audit log.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Input type="date" value={date} max={todayISO()} onChange={(e) => e.target.value && setDate(e.target.value)} className="!w-auto" aria-label="Date" />
          <OutletSelect value={outlet} onChange={setOutlet} allLabel="All" className="!w-auto min-w-[120px]" />
        </div>
      </div>

      {error && !data && <div className="px-5 pb-5"><ErrorBox message={error} onRetry={reload} /></div>}
      {!data && loading && <div className="px-5 pb-5"><Skeleton className="h-48" /></div>}
      {data && (
        <TableWrap>
          <table className="w-full min-w-[1040px]">
            <thead><tr>{['Employee', 'Outlet', 'Sales (৳)', 'Achievement', 'Incentive', 'Status', 'Approval', 'Payment', 'Actions'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
            <tbody>
              {data.rows.map((r) => {
                const draft = val(r, 'status') === 'Draft';
                const canPay = val(r, 'approval') === 'Approved' && val(r, 'status') === 'Finalized';
                const sel = '!w-auto !py-1.5 !text-xs';
                return (
                  <tr key={r.id} className="tr-hover">
                    <td className="td"><EmployeeCell id={r.employee.id} name={r.employee.name} avatar={r.employee.avatar} /></td>
                    <td className="td">{r.outlet.name}</td>
                    <td className="td"><Input type="number" min="0" value={val(r, 'sales')} onChange={(e) => set(r, 'sales', e.target.value)} className="!w-32 !py-1.5 !text-xs" aria-label={`Sales for ${r.employee.name}`} /></td>
                    <td className="td text-slate-400">{pct(r.target > 0 ? (Number(val(r, 'sales')) / r.target) * 100 : null)}</td>
                    <td className="td text-emerald-400">{draft ? '—' : money(r.incentive)}</td>
                    <td className="td"><Select value={val(r, 'status')} onChange={(e) => set(r, 'status', e.target.value)} className={sel} aria-label={`Status for ${r.employee.name}`}><option>Draft</option><option>Finalized</option></Select></td>
                    <td className="td"><Select value={val(r, 'approval')} disabled={draft} onChange={(e) => set(r, 'approval', e.target.value)} className={sel} aria-label={`Approval for ${r.employee.name}`}><option>Pending approval</option><option>Approved</option><option>Rejected</option></Select></td>
                    <td className="td"><Select value={val(r, 'payment')} disabled={draft} onChange={(e) => set(r, 'payment', e.target.value)} className={sel} aria-label={`Payment for ${r.employee.name}`}><option>Unpaid</option><option disabled={!canPay}>Paid</option></Select></td>
                    <td className="td">
                      <div className="flex gap-2">
                        <Button size="sm" variant={dirty(r) ? 'primary' : 'secondary'} disabled={!dirty(r)} loading={busy === r.id} onClick={() => save(r)}>Save</Button>
                        <Button size="sm" variant="danger" disabled={!!busy} onClick={() => setDel(r)}>Delete</Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!data.rows.length && <tr><td colSpan={9}><EmptyState title="No sales records on this date" message="Pick another date or outlet." /></td></tr>}
            </tbody>
          </table>
        </TableWrap>
      )}

      <ConfirmDialog open={!!del} title="Delete this sales record?" confirmLabel="Delete record" loading={busy === 'del'} onClose={() => setDel(null)} onConfirm={remove}
        message={del ? `${del.employee.name} · ${del.date} · ${money(del.sales)}. The record is removed permanently, so the employee will show as absent for that day unless attendance is marked. Paid incentives can't be deleted: set payment to Unpaid first.` : ''} />
    </Card>
  );
}
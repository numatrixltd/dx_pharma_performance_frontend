'use client';
import { useState } from 'react';
import { BadgeDollarSign, CheckCheck, CheckCircle2, Clock, Download, Wallet } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { api, downloadFile } from '@/lib/api';
import { defaultReportDate, todayISO } from '@/lib/dates';
import { money, pct } from '@/lib/format';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import KpiCard from '@/components/ui/KpiCard';
import Notice from '@/components/ui/Notice';
import PageHeader from '@/components/ui/PageHeader';
import OutletSelect from '@/components/ui/OutletSelect';
import { Input } from '@/components/ui/Field';
import { EmptyState, ErrorBox, PageSkeleton } from '@/components/ui/States';
import { ApprovalBadge, CategoryBadge, EmployeeCell, OutletLink, TableWrap } from '@/components/shared/cells';

export default function IncentivesPage() {
  const { can } = useAuth();
  const toast = useToast();
  const [date, setDate] = useState(defaultReportDate());
  const [outlet, setOutlet] = useState('All');
  const [busy, setBusy] = useState('');
  const { data, loading, error, reload } = useApi('/incentives', { date, outlet });

  if (!data && loading) return <PageSkeleton />;
  if (!data && error) return <ErrorBox message={error} onRetry={reload} />;
  if (!data) return null;
  const { rows, totals, managerPolicyConfigured } = data;
  const pendingCount = rows.filter((r) => r.approval === 'Pending approval').length;

  const patch = async (id, body, msg) => {
    setBusy(id);
    try { await api(`/incentives/${id}`, { method: 'PATCH', body }); toast.success(msg); await reload(); }
    catch (e) { toast.error(e.message); }
    finally { setBusy(''); }
  };
  const approveAll = async () => {
    setBusy('all');
    try { const r = await api('/incentives/approve-all', { method: 'POST', body: { date, outlet } }); toast.success(`${r.approved} incentive${r.approved === 1 ? '' : 's'} approved`); await reload(); }
    catch (e) { toast.error(e.message); }
    finally { setBusy(''); }
  };

  return (
    <div>
      <PageHeader title="Incentives" subtitle="Track earned rewards separately from approvals and payments."
        actions={<>
          {can.canApproveIncentives && <Button variant="success" onClick={approveAll} loading={busy === 'all'} disabled={!pendingCount}><CheckCheck size={15} /> Approve all pending ({pendingCount})</Button>}
          <Button onClick={() => downloadFile('/reports/export/daily', { date, outlet }).catch((e) => toast.error(e.message))}><Download size={15} /> Export incentives</Button>
        </>} />

      {!managerPolicyConfigured && <Notice tone="amber" title="Manager incentive policy is not set up.">Add the manager slabs in Policy Settings. Salesperson rates are never applied to managers, and manager incentives are settled monthly under Manager Incentive.</Notice>}

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <OutletSelect value={outlet} onChange={setOutlet} className="!w-auto min-w-[150px]" />
        <Input type="date" value={date} max={todayISO()} onChange={(e) => e.target.value && setDate(e.target.value)} className="!w-auto" aria-label="Date" />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard animate={false} label="Earned this day" icon={BadgeDollarSign} tone="blue" value={totals.earned} format={(n) => money(n)} foot="Calculated from finalized records" />
        <KpiCard animate={false} label="Awaiting approval" icon={Clock} tone="amber" value={totals.awaiting} format={(n) => money(n)} foot="Pending admin approval" />
        <KpiCard animate={false} label="Approved" icon={CheckCircle2} tone="green" value={totals.approved} format={(n) => money(n)} foot="Approved, not yet paid" />
        <KpiCard animate={false} label="Paid" icon={Wallet} tone="violet" value={totals.paid} format={(n) => money(n)} foot="Payment is never automatic" />
      </div>

      <Card pad={false} className="overflow-hidden">
        <div className="px-5 py-4"><h3 className="text-sm font-semibold text-white">Daily incentive ledger</h3></div>
        <TableWrap>
          <table className="w-full min-w-[960px]">
            <thead><tr>{['Employee', 'Outlet', 'Category', 'Achievement', 'Earned', 'Approval', 'Payment', ...(can.canApproveIncentives ? ['Actions'] : [])].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="tr-hover">
                  <td className="td"><EmployeeCell id={r.employee.id} name={r.employee.name} avatar={r.employee.avatar} /></td>
                  <td className="td"><OutletLink id={r.outlet.id} name={r.outlet.name} /></td>
                  <td className="td"><CategoryBadge category={r.category} /></td>
                  <td className="td">{pct(r.achievement)}</td>
                  <td className="td font-semibold text-emerald-400">{money(r.incentive)}</td>
                  <td className="td"><ApprovalBadge value={r.approval} /></td>
                  <td className="td"><Badge tone={r.payment === 'Paid' ? 'green' : 'gray'}>{r.payment}</Badge></td>
                  {can.canApproveIncentives && (
                    <td className="td">
                      <div className="flex gap-2">
                        {r.payment === 'Paid' ? <span className="text-xs text-slate-500">Completed</span> : r.approval === 'Approved' ? (
                          <>
                            <Button size="sm" variant="success" loading={busy === r.id} onClick={() => patch(r.id, { payment: 'Paid' }, `${r.employee.name} marked as paid`)}>Mark paid</Button>
                            <Button size="sm" variant="ghost" disabled={busy === r.id} onClick={() => patch(r.id, { approval: 'Pending approval' }, 'Moved back to pending')}>Undo</Button>
                          </>
                        ) : (
                          <>
                            <Button size="sm" variant="success" loading={busy === r.id} onClick={() => patch(r.id, { approval: 'Approved' }, `${r.employee.name} approved`)}>Approve</Button>
                            {r.approval !== 'Rejected' && <Button size="sm" variant="danger" disabled={busy === r.id} onClick={() => patch(r.id, { approval: 'Rejected' }, `${r.employee.name} rejected`)}>Reject</Button>}
                          </>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={8}><EmptyState title="No finalized records" message="Incentives appear once sales for this date are finalized." /></td></tr>}
            </tbody>
          </table>
        </TableWrap>
      </Card>
    </div>
  );
}
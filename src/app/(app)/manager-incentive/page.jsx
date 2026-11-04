'use client';
import { useEffect, useState } from 'react';
import { Award, Gift, Save, Sparkles, Target, Wallet, Trophy } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { api } from '@/lib/api';
import { currentMonth } from '@/lib/dates';
import { money, monthLabel, pct } from '@/lib/format';
import Card, { CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import KpiCard from '@/components/ui/KpiCard';
import Notice from '@/components/ui/Notice';
import Progress from '@/components/ui/Progress';
import PageHeader from '@/components/ui/PageHeader';
import { Field, Input, Select } from '@/components/ui/Field';
import { EmptyState, ErrorBox, PageSkeleton } from '@/components/ui/States';
import { OutletLink, TableWrap } from '@/components/shared/cells';

const STATUS_TONE = { Pending: 'amber', Approved: 'blue', Paid: 'green' };

function SettlementCard({ data, month, onSaved }) {
  const toast = useToast();
  const calc = data.totals.total;
  const s = data.settlement;
  const [form, setForm] = useState({ status: 'Pending', amount: String(calc), paymentDate: '', reference: '', remarks: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setForm({ status: s?.status || 'Pending', amount: String(s ? s.amount : calc), paymentDate: s?.paymentDate || '', reference: s?.reference || '', remarks: s?.remarks || '' });
  }, [s, calc, month]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const differs = Math.round(Number(form.amount)) !== Math.round(calc);

  const save = async () => {
    if (differs && !form.remarks.trim()) { toast.error('Add a remark because the amount differs from the calculated incentive'); return; }
    if (form.status === 'Paid' && !form.paymentDate) { toast.error('Enter the payment date when marking as Paid'); return; }
    setBusy(true);
    try {
      await api('/manager-incentive/settlement', { method: 'PUT', body: { month, ...form, amount: Number(form.amount) } });
      toast.success('Monthly settlement saved');
      onSaved();
    } catch (e) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  return (
    <Card>
      <CardHeader title="Manager Incentive · Monthly Settlement" subtitle="Review the calculated manager incentive for the selected month, then record its settlement. Admin only." action={<Badge tone={s ? STATUS_TONE[s.status] : 'gray'}>{s ? s.status : 'Not settled'}</Badge>} />
      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        <KpiCard animate={false} label="Calculated incentive" icon={Wallet} tone="blue" value={calc} format={money} foot="Based on finalized net sales" variant="spread" dot />
        <KpiCard animate={false} label="Outlet rewards" icon={Trophy} tone="violet" value={data.totals.outletRewards} format={money} foot="Highest qualifying slab per outlet" variant="spread" dot />
        <KpiCard animate={false} label="All-outlet bonus" icon={Sparkles} tone="amber" value={data.totals.bonus} format={money} foot={data.totals.bonusTier ? `${data.totals.bonusTier}%+ tier reached by every outlet` : 'Not unlocked'} variant="spread" dot />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Field label="Settlement status"><Select value={form.status} onChange={set('status')}><option>Pending</option><option>Approved</option><option>Paid</option></Select></Field>
        <Field label="Settlement amount (৳)"><Input type="number" min="0" value={form.amount} onChange={set('amount')} /></Field>
        <Field label="Payment / settlement date"><Input type="date" value={form.paymentDate} onChange={set('paymentDate')} /></Field>
        <Field label="Payment reference"><Input value={form.reference} onChange={set('reference')} placeholder="Transaction ID / voucher no." /></Field>
        <Field label="Remarks" className="md:col-span-2" hint={differs ? 'Required: the amount differs from the calculated incentive.' : undefined}><Input value={form.remarks} onChange={set('remarks')} placeholder="Optional settlement note" /></Field>
      </div>
      <div className="mt-5 flex justify-end"><Button variant="primary" loading={busy} onClick={save}><Save size={15} /> Save monthly settlement</Button></div>
      <p className="mt-4 text-sm text-slate-400">The calculated incentive is read from finalized net sales and the approved incentive policy. The settlement amount can be adjusted by Admin with a recorded remark.</p>
    </Card>
  );
}

export default function ManagerIncentivePage() {
  const { can } = useAuth();
  const [month, setMonth] = useState(currentMonth());
  const { data, loading, error, reload } = useApi('/manager-incentive', { month }, { enabled: !!can.canViewManagerIncentive });

  if (!can.canViewManagerIncentive) return <EmptyState title="Private page" message="Manager incentive is private to Admin and accounts that were granted access. Ask an admin to enable it in Users & Access." />;
  if (!data && loading) return <PageSkeleton />;
  if (!data && error) return <ErrorBox message={error} onRetry={reload} />;
  if (!data) return null;

  const { rows, totals, configured, settlement, policy } = data;
  const lowest = policy.outletSlabs.length ? Math.min(...policy.outletSlabs.map((t) => t.min)) : null;
  const below = (r) => (r.slab ? `${r.slab}%+ slab` : lowest ? `Below ${lowest}%` : 'No policy');

  return (
    <div>
      <PageHeader
        eyebrow="Confidential · Manager"
        title="Monthly achievement & incentive"
        subtitle="Your management incentive, calculated from each outlet's monthly net sales against its approved target. This page is private to Admin and accounts granted Manager Incentive access."
        actions={<Input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} className="!w-auto" aria-label="Month" />}
      />

      <Notice tone="amber" title="Confidential manager view.">Only finalized sales count. The highest achieved slab applies per outlet, with an additional bonus when all active outlets reach the same tier. Targets come from the Monthly Plan.</Notice>
      {!configured && <Notice tone="blue" title="Manager policy not set up.">Nothing is calculated until outlet slabs exist. {can.canManagePolicy ? 'Add them in Policy Settings.' : 'Ask an admin to add them in Policy Settings.'}</Notice>}

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard variant="spread" dot animate={false} label="Total outlet net sales" icon={Wallet} tone="blue" value={totals.netSales} format={money} foot={`Finalized sales in ${monthLabel(month)}`} />
        <KpiCard variant="spread" dot animate={false} label="Combined outlet target" icon={Target} tone="violet" value={totals.target} format={money} foot="Approved monthly outlet targets" />
        <KpiCard variant="spread" dot animate={false} label="Outlet slab incentives" icon={Trophy} tone="amber" value={totals.outletRewards} format={money} foot="Highest qualifying slab per outlet" />
        <KpiCard variant="spread" dot animate={false} label="All-outlet bonus" icon={Gift} tone="green" value={totals.bonus} format={money} foot={totals.bonusTier ? `${totals.bonusTier}%+ tier` : 'Not yet unlocked'} />
        <KpiCard variant="spread" dot animate={false} label="Total manager incentive" icon={Award} tone="blue" value={totals.total} format={money} foot="Indicative earned amount · month close subject to approval" />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        {rows.map((r) => (
          <Card key={r.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-white"><OutletLink id={r.id} name={r.name} /></h3>
                <p className="mt-1 text-xs text-slate-400">Monthly outlet achievement</p>
              </div>
              <Badge tone={r.slab ? 'green' : 'blue'}>{below(r)}</Badge>
            </div>
            <div className="mt-5 text-4xl font-bold tracking-tight text-brand-400">{pct(r.achievement)}</div>
            <div className="mt-5 grid grid-cols-3 gap-3 border-t border-ink-600/50 pt-4">
              <div><div className="text-[11px] text-slate-400">Net sales</div><div className="mt-1 text-sm font-bold text-white">{money(r.netSales)}</div></div>
              <div><div className="text-[11px] text-slate-400">Target</div><div className="mt-1 text-sm font-bold text-white">{r.target > 0 ? money(r.target) : '—'}</div></div>
              <div><div className="text-[11px] text-slate-400">Your reward</div><div className="mt-1 text-sm font-bold text-emerald-400">{money(r.reward)}</div></div>
            </div>
          </Card>
        ))}
      </div>

      <Card pad={false} className="mb-5 overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4">
          <div><h3 className="text-sm font-semibold text-white">Monthly outlet achievement</h3><p className="mt-1 text-xs text-slate-400">Outlet target vs finalized net sales · confidential manager view</p></div>
          <Badge tone={configured ? 'blue' : 'amber'}>{configured ? 'Policy configured' : 'Policy not configured'}</Badge>
        </div>
        <TableWrap>
          <table className="w-full min-w-[820px]">
            <thead><tr>{['Outlet', 'Monthly target', 'Net sales', 'Achievement', 'Slab reward', 'Result'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="tr-hover">
                  <td className="td font-semibold text-white"><OutletLink id={r.id} name={r.name} /></td>
                  <td className="td">{r.target > 0 ? money(r.target) : <span className="text-amber-300">No target set</span>}</td>
                  <td className="td">{money(r.netSales)}</td>
                  <td className="td"><div className="min-w-[150px]"><span className="font-bold text-white">{pct(r.achievement)}</span><Progress value={r.achievement || 0} tone={r.slab ? 'green' : 'blue'} height={5} className="mt-1.5" /></div></td>
                  <td className="td font-semibold text-emerald-400">{r.reward ? money(r.reward) : '—'}</td>
                  <td className="td"><Badge tone={r.slab ? 'green' : 'blue'}>{r.slab ? `${r.slab}%+ unlocked` : 'Not unlocked'}</Badge></td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={6}><EmptyState title="No active outlets" /></td></tr>}
            </tbody>
          </table>
        </TableWrap>
        <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-ink-600/50 bg-ink-900/40 px-5 py-3.5 text-xs text-slate-400">
          <span>Outlets counted: <strong className="text-white">{totals.counted}</strong></span>
          <span>Outlets at 100%+: <strong className="text-white">{totals.at100}</strong></span>
          <span>All-outlet bonus tier: <strong className="text-white">{totals.bonusTier ? `${totals.bonusTier}%+` : 'Not unlocked'}</strong></span>
          <span>Manager incentive total: <strong className="text-emerald-400">{money(totals.total)}</strong></span>
          <span>Settlement: <strong className={settlement ? 'text-white' : 'text-slate-400'}>{settlement ? settlement.status : 'Pending'}</strong></span>
        </div>
      </Card>

      {can.canManageManagerSettlement && configured && <SettlementCard data={data} month={month} onSaved={reload} />}
    </div>
  );
}
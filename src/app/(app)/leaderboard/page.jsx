'use client';
import { useState } from 'react';
import { Download, Wallet, UserCheck, Users, Clock } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { useToast } from '@/context/ToastContext';
import { downloadFile } from '@/lib/api';
import { defaultReportDate, todayISO } from '@/lib/dates';
import { money, pct } from '@/lib/format';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Tabs from '@/components/ui/Tabs';
import KpiCard from '@/components/ui/KpiCard';
import PageHeader from '@/components/ui/PageHeader';
import { Input } from '@/components/ui/Field';
import { EmptyState, ErrorBox, PageSkeleton } from '@/components/ui/States';
import { AchievementCell, EmployeeCell, MilestoneBadge, OutletLink, RankCell, TableWrap } from '@/components/shared/cells';
import TopPerformerHero from '@/components/leaderboard/TopPerformerHero';

export default function LeaderboardPage() {
  const toast = useToast();
  const [outlet, setOutlet] = useState('All');
  const [date, setDate] = useState(defaultReportDate());
  const outlets = useApi('/outlets');
  const { data, loading, error, reload } = useApi('/leaderboard', { date, outlet });

  if (!data && loading) return <PageSkeleton />;
  if (!data && error) return <ErrorBox message={error} onRetry={reload} />;
  if (!data) return null;
  const { rows, pending, kpis } = data;
  const tabs = [{ value: 'All', label: 'All DX Pharma' }, ...(outlets.data || []).filter((o) => o.isActive).map((o) => ({ value: o._id, label: o.name }))];
  const scope = tabs.find((t) => t.value === outlet)?.label || 'All DX Pharma';
  const top = rows[0];
  const tiedWith = top ? rows.filter((r) => r !== top && r.rank === top.rank).map((r) => r.employee.name) : [];

  return (
    <div>
      <PageHeader
        title="Leaderboard"
        subtitle="Ranked by target achievement. Equal percentages share the same rank."
        actions={<Button onClick={() => downloadFile('/reports/export/daily', { date, outlet }).catch((e) => toast.error(e.message))}><Download size={15} /> Export CSV</Button>}
      />
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Tabs options={tabs} value={outlet} onChange={setOutlet} />
        <Input type="date" value={date} max={todayISO()} onChange={(e) => e.target.value && setDate(e.target.value)} className="!w-auto" aria-label="Date" />
        <span className="text-xs text-slate-500 sm:ml-auto">Missing entries show as pending, never as zero.</span>
      </div>

      {top && <div className="mb-5"><TopPerformerHero key={`${outlet}-${date}-${top.id}`} row={top} runnerUps={rows.slice(1, 3)} scope={scope} date={date} tiedWith={tiedWith} /></div>}

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard animate={false} label="Ranked employees" icon={Users} tone="blue" value={kpis.ranked} foot="Finalized entries only" />
        <KpiCard animate={false} label="100%+ achievers" icon={UserCheck} tone="green" value={kpis.achievers100} foot="First incentive tier" />
        <KpiCard animate={false} label="Total incentives" icon={Wallet} tone="amber" value={kpis.incentives} format={(n) => money(n)} foot="Earned · not necessarily approved" />
        <KpiCard animate={false} label="Pending entries" icon={Clock} tone="violet" value={kpis.pending} foot="Excluded from ranking" />
      </div>

      <Card pad={false} className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-4">
          <h3 className="text-sm font-semibold text-white">Daily rankings</h3>
          <Badge tone="blue">100% · 150% · 200% milestones</Badge>
        </div>
        <TableWrap>
          <table className="w-full min-w-[900px]">
            <thead><tr>{['Rank', 'Employee', 'Outlet', 'Sales', 'Target', 'Achievement', 'Incentive', 'Milestone'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="tr-hover">
                  <td className="td"><RankCell rank={r.rank} /></td>
                  <td className="td"><EmployeeCell id={r.employee.id} name={r.employee.name} avatar={r.employee.avatar} sub={r.category || 'Category unassigned'} /></td>
                  <td className="td"><OutletLink id={r.outlet.id} name={r.outlet.name} /></td>
                  <td className="td font-semibold text-white">{money(r.sales)}</td>
                  <td className="td">{money(r.target)}</td>
                  <td className="td"><AchievementCell value={r.achievement} /></td>
                  <td className="td font-semibold text-emerald-400">{money(r.incentive)}</td>
                  <td className="td"><MilestoneBadge milestone={r.milestone} /></td>
                </tr>
              ))}
              {pending.map((p) => (
                <tr key={p.id} className="tr-hover">
                  <td className="td text-slate-500">—</td>
                  <td className="td"><EmployeeCell id={p.id} name={p.name} avatar={p.avatar} sub={p.category || 'Category unassigned'} /></td>
                  <td className="td">{p.outlet}</td>
                  <td className="td" colSpan={4}>{p.offDay ? <Badge tone="blue">Outlet off day</Badge> : <Badge tone="gray">Pending · no finalized record</Badge>}</td>
                  <td className="td text-slate-500">—</td>
                </tr>
              ))}
              {!rows.length && !pending.length && <tr><td colSpan={8}><EmptyState title="No employees yet" message="Add employees first, then enter daily sales." /></td></tr>}
            </tbody>
          </table>
        </TableWrap>
      </Card>
    </div>
  );
}
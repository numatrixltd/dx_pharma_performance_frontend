'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowUpRight, BadgeDollarSign, Clock, Crown, Info, Sparkles, Target, TrendingUp, UserCheck, Wallet, CheckCircle2, Download } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { downloadFile } from '@/lib/api';
import { defaultReportDate, todayISO } from '@/lib/dates';
import { greeting, money, num, pct, shortDate } from '@/lib/format';
import Card, { CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import KpiCard from '@/components/ui/KpiCard';
import Progress from '@/components/ui/Progress';
import Avatar from '@/components/ui/Avatar';
import { Input } from '@/components/ui/Field';
import OutletSelect from '@/components/ui/OutletSelect';
import { EmptyState, ErrorBox, PageSkeleton } from '@/components/ui/States';
import TrendChart from '@/components/charts/TrendChart';
import MilestoneDonut from '@/components/charts/MilestoneDonut';
import { AchievementCell, EmployeeCell, OutletLink, RankCell, TableWrap } from '@/components/shared/cells';

const INSIGHT_ICON = { success: CheckCircle2, info: Info, warning: Clock, danger: AlertTriangle };
const INSIGHT_TONE = { success: 'text-emerald-400 bg-emerald-500/12', info: 'text-brand-400 bg-brand-500/12', warning: 'text-amber-400 bg-amber-500/12', danger: 'text-rose-400 bg-rose-500/12' };

function InsightsCard({ insights = [] }) {
  return (
    <Card className="relative h-full overflow-hidden">
      <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-brand-600/20 blur-3xl" />
      <div className="relative flex items-start justify-between gap-3">
        <CardHeader title={<span className="flex items-center gap-2"><Sparkles size={16} className="text-brand-400" /> Arena insights</span>} subtitle="Calculated from the finalized records" className="!mb-0" />
        <div className="relative grid h-16 w-16 shrink-0 place-items-center" aria-hidden="true">
          <div className="absolute inset-0 animate-orb rounded-full bg-[radial-gradient(circle_at_35%_30%,#93c5fd,#2563eb_45%,#1e1b4b_100%)] shadow-[0_0_36px_rgba(59,130,246,.65)]" />
          <div className="absolute inset-1 rounded-full border border-white/20" />
          <span className="relative text-sm font-extrabold text-white">DX</span>
        </div>
      </div>
      <ul className="relative mt-5 space-y-2.5">
        {insights.length === 0 && <li className="rounded-xl bg-ink-900/60 p-4 text-xs text-slate-400">Insights appear once sales for this date are finalized.</li>}
        {insights.map((i, idx) => {
          const Icon = INSIGHT_ICON[i.tone] || Info;
          return (
            <li key={idx} className="flex items-start gap-3 rounded-xl border border-ink-600/60 bg-ink-900/50 p-3">
              <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${INSIGHT_TONE[i.tone]}`}><Icon size={16} /></span>
              <div>
                <div className="text-xs font-semibold text-white">{i.title}</div>
                <div className="mt-0.5 text-xs leading-relaxed text-slate-400">{i.text}</div>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [date, setDate] = useState(defaultReportDate());
  const [outlet, setOutlet] = useState('All');
  const { data, loading, error, reload } = useApi('/dashboard', { date, outlet });

  if (!data && loading) return <PageSkeleton />;
  if (!data && error) return <ErrorBox message={error} onRetry={reload} />;
  if (!data) return null;

  const { kpis, outletPerformance, trend, milestones, champion, topPerformers, insights } = data;
  const sparkOf = (k) => trend.map((t) => t[k]);
  const reported = trend.filter((t) => t.sales !== null);
  const avgDaily = reported.length ? reported.reduce((s, t) => s + t.sales, 0) / reported.length : 0;
  const best = reported.length ? reported.reduce((a, b) => (a.sales > b.sales ? a : b)) : null;
  const low = reported.length ? reported.reduce((a, b) => (a.sales < b.sales ? a : b)) : null;
  const exportReport = () => downloadFile('/reports/export/daily', { date, outlet }).catch((e) => toast.error(e.message));

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">{greeting()}, {user?.name?.split(' ')[0]} <span className="text-brand-400">✦</span></h1>
          <p className="mt-1.5 text-sm text-slate-400">One team. Two outlets. Every sale moves the leaderboard.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <OutletSelect value={outlet} onChange={setOutlet} className="!w-auto min-w-[150px]" />
          <Input type="date" value={date} max={todayISO()} onChange={(e) => e.target.value && setDate(e.target.value)} className="!w-auto" aria-label="Reporting date" />
          <Button onClick={exportReport}><Download size={15} /> Export</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard index={0} label="Total daily sales" icon={Wallet} tone="blue" value={kpis.sales} format={(n) => money(n)} foot="Finalized records" spark={sparkOf('sales')} />
        <KpiCard index={1} label="Total daily target" icon={Target} tone="violet" value={kpis.target} format={(n) => money(n)} foot="Target coverage for selected date" spark={sparkOf('target')} />
        <KpiCard index={2} label="Overall achievement" icon={TrendingUp} tone="green" value={kpis.achievement} format={(n) => pct(n)} foot={`${kpis.achievers100} of ${kpis.ranked} employees at 100%+`} spark={sparkOf('achievement')} />
        <KpiCard index={3} label="Salesperson incentives" icon={BadgeDollarSign} tone="amber" value={kpis.incentives} format={(n) => money(n)} foot="Earned · pending approval" spark={sparkOf('incentives')} />
        <KpiCard index={4} label="100%+ achievers" icon={UserCheck} tone="green" value={kpis.achievers100} foot={`${kpis.achievers150} reached 150%+`} />
        <KpiCard index={5} label="200%+ achievers" icon={Crown} tone="amber" value={kpis.achievers200} foot="Highest reward tier" />
        <KpiCard index={6} label="Missing entries" icon={AlertTriangle} tone={kpis.missing ? 'red' : 'cyan'} value={kpis.missing} foot="Not ranked as zero performers" />
        <KpiCard index={7} label="Pending approvals" icon={Clock} tone="cyan" value={kpis.pendingApprovals} foot="Earned is not the same as paid" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3 sm:gap-5">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Sales trend"
            subtitle={`Last 14 days to ${shortDate(date)} · finalized records`}
            action={<div className="flex items-center gap-3 text-[11px] text-slate-400"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-brand-400" />Sales</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-violet-500" />Target</span></div>}
          />
          <div className="mb-4 flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-bold tracking-tight text-white">{money(kpis.sales)}</span>
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/12 px-2.5 py-1 text-xs font-semibold text-emerald-300"><ArrowUpRight size={13} />{pct(kpis.achievement)} of target</span>
          </div>
          <TrendChart data={trend} />
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              ['Average per day', money(avgDaily)],
              ['Best day', best ? `${money(best.sales)}` : '—', best && shortDate(best.date)],
              ['Lowest day', low ? `${money(low.sales)}` : '—', low && shortDate(low.date)],
              ['Days reported', `${reported.length} / 14`],
            ].map(([k, v, s]) => (
              <div key={k} className="rounded-xl border border-ink-600/60 bg-ink-900/50 p-3">
                <div className="text-[11px] text-slate-400">{k}</div>
                <div className="mt-1 text-base font-bold text-white">{v}</div>
                {s && <div className="text-[11px] text-slate-500">{s}</div>}
              </div>
            ))}
          </div>
        </Card>
        <InsightsCard insights={insights} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 sm:gap-5">
        <Card>
          <CardHeader title="Outlet performance" subtitle="Daily sales against target" />
          <div className="space-y-6">
            {outletPerformance.length === 0 && <EmptyState title="No outlets" />}
            {outletPerformance.map((o, i) => (
              <div key={o.id}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <OutletLink id={o.id} name={o.name} className="font-semibold text-white" />
                  <span className="font-bold text-white">{pct(o.achievement)}</span>
                </div>
                <Progress value={o.achievement} tone={i % 2 ? 'violet' : 'blue'} height={9} />
                <div className="mt-1.5 text-xs text-slate-500">{money(o.sales)} sales · {money(o.target)} target</div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Milestone spread" subtitle="Employees by achievement band" />
          <MilestoneDonut data={milestones} centerValue={num(kpis.ranked)} centerLabel="ranked today" />
        </Card>

        <Card className="relative overflow-hidden !border-brand-500/30 !bg-gradient-to-br !from-brand-700/40 !via-ink-800 !to-violet-700/30">
          <div className="pointer-events-none absolute -right-8 -top-8 text-[140px] leading-none text-white/[0.04]">✦</div>
          <div className="relative">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-300"><Crown size={14} /> Daily champion</div>
            <h3 className="mt-2 text-lg font-bold text-white">Leading the league</h3>
            <p className="mt-1 text-xs text-slate-300/80">Highest achievement across {outlet === 'All' ? 'DX Pharma' : 'this outlet'}</p>
            {champion ? (
              <div className="mt-6 flex items-center gap-3">
                <Avatar name={champion.employee.name} src={champion.employee.avatar} size={52} className="ring-2 ring-amber-300/60" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-bold text-white">{champion.employee.name}</div>
                  <div className="text-xs text-slate-300/80">{champion.outlet.name} · {champion.category}</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-extrabold text-amber-300">{pct(champion.achievement)}</div>
                  <div className="text-[11px] text-slate-300/80">Achievement</div>
                </div>
              </div>
            ) : (
              <p className="mt-6 text-sm text-slate-300">No finalized sales yet. The champion appears once a batch is finalized.</p>
            )}
          </div>
        </Card>
      </div>

      <Card pad={false} className="overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-4">
          <h3 className="text-sm font-semibold text-white">Top performers</h3>
          <Link href="/leaderboard" className="flex items-center gap-1 text-xs font-semibold text-brand-400 hover:text-brand-300">Full leaderboard <ArrowUpRight size={14} /></Link>
        </div>
        <TableWrap>
          <table className="w-full min-w-[760px]">
            <thead><tr><th className="th">Rank</th><th className="th">Employee</th><th className="th">Outlet</th><th className="th">Sales / target</th><th className="th">Achievement</th><th className="th">Incentive</th></tr></thead>
            <tbody>
              {topPerformers.map((r) => (
                <motion.tr key={r.id} className="tr-hover" initial={false}>
                  <td className="td"><RankCell rank={r.rank} /></td>
                  <td className="td"><EmployeeCell id={r.employee.id} name={r.employee.name} avatar={r.employee.avatar} sub={r.employee.designation} /></td>
                  <td className="td"><OutletLink id={r.outlet.id} name={r.outlet.name} /></td>
                  <td className="td">{money(r.sales)} <span className="text-slate-500">/ {money(r.target)}</span></td>
                  <td className="td"><AchievementCell value={r.achievement} /></td>
                  <td className="td font-semibold text-emerald-400">{money(r.incentive)}</td>
                </motion.tr>
              ))}
              {topPerformers.length === 0 && <tr><td colSpan={6}><EmptyState title="No finalized records for this date" message="Finalize a sales batch or pick another reporting date." /></td></tr>}
            </tbody>
          </table>
        </TableWrap>
      </Card>
    </div>
  );
}
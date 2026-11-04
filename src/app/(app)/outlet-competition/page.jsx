'use client';
import { useState } from 'react';
import { Download } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { useToast } from '@/context/ToastContext';
import { downloadFile } from '@/lib/api';
import { defaultReportDate, todayISO } from '@/lib/dates';
import { money, pct } from '@/lib/format';
import Card, { CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Progress from '@/components/ui/Progress';
import PageHeader from '@/components/ui/PageHeader';
import { OutletLink } from '@/components/shared/cells';
import { Input } from '@/components/ui/Field';
import { EmptyState, ErrorBox, PageSkeleton } from '@/components/ui/States';
import ComparisonBars from '@/components/charts/ComparisonBars';

export default function OutletCompetitionPage() {
  const toast = useToast();
  const [date, setDate] = useState(defaultReportDate());
  const { data, loading, error, reload } = useApi('/outlets/competition', { date });

  if (!data && loading) return <PageSkeleton />;
  if (!data && error) return <ErrorBox message={error} onRetry={reload} />;
  if (!data) return null;
  const { outlets, milestones } = data;
  const leader = [...outlets].filter((o) => o.records).sort((a, b) => b.achievement - a.achievement)[0];

  return (
    <div>
      <PageHeader title="Outlet competition" subtitle="Compare sales momentum with consistent targets and incentive rules." actions={<Button onClick={() => downloadFile('/reports/export/daily', { date }).catch((e) => toast.error(e.message))}><Download size={15} /> Export comparison</Button>} />
      <div className="mb-5"><Input type="date" value={date} max={todayISO()} onChange={(e) => e.target.value && setDate(e.target.value)} className="!w-auto" aria-label="Date" /></div>

      {outlets.length === 0 ? (
        <Card><EmptyState title="No outlets yet" message="Add outlets in Policy Settings." /></Card>
      ) : (
        <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 sm:gap-5">
          {outlets.map((o, i) => (
            <Card key={o.id} className={leader?.id === o.id ? '!border-brand-500/40' : ''}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2"><h3 className="text-lg font-bold"><OutletLink id={o.id} name={o.name} className="text-white" /></h3>{leader?.id === o.id && outlets.length > 1 && <Badge tone="amber">Leading</Badge>}</div>
                  <p className="mt-1 text-xs text-slate-400">{o.records} finalized employee record{o.records === 1 ? '' : 's'}</p>
                </div>
                <div className={`text-3xl font-extrabold ${i % 2 ? 'text-violet-400' : 'text-brand-400'}`}>{pct(o.achievement)}</div>
              </div>
              <Progress value={o.achievement} tone={i % 2 ? 'violet' : 'blue'} height={9} className="mt-4" />
              <div className="mt-5 grid grid-cols-3 gap-3 border-t border-ink-600/50 pt-4">
                {[['Daily sales', money(o.sales)], ['Daily target', money(o.target)], ['Incentives earned', money(o.incentives)]].map(([k, v]) => (
                  <div key={k}><div className="text-[11px] text-slate-400">{k}</div><div className="mt-1 text-sm font-bold text-white sm:text-base">{v}</div></div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 sm:gap-5">
        <Card>
          <CardHeader title="Sales versus target" subtitle="Finalized totals by outlet" />
          <ComparisonBars data={outlets.map((o) => ({ name: o.name, sales: o.sales, target: o.target }))} />
        </Card>
        <div className="grid gap-4 sm:gap-5">
          <Card>
            <CardHeader title="Milestone achievers" subtitle="Number of employees in each tier" />
            <div className="space-y-4">
              {[['100%+ milestone', milestones.m100, 'green'], ['150%+ milestone', milestones.m150, 'violet'], ['200%+ milestone', milestones.m200, 'amber']].map(([label, n, tone]) => (
                <div key={label} className="grid grid-cols-[120px_1fr_28px] items-center gap-3 text-xs">
                  <span className="font-medium text-slate-300">{label}</span>
                  <Progress value={milestones.total ? (n / milestones.total) * 100 : 0} tone={tone} height={8} />
                  <span className="text-right font-bold text-white">{n}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <CardHeader title="Competition rules" />
            <ul className="space-y-2 text-xs leading-relaxed text-slate-400">
              <li>• Ranking is based on achievement percentage.</li>
              <li>• Both outlets use the same selected reporting date.</li>
              <li>• Missing records are excluded from ranking.</li>
              <li>• Manager incentives remain separate from salesperson rewards.</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
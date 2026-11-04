'use client';
import { useEffect, useState } from 'react';
import { Download, Target, TrendingUp, Wallet, BadgeDollarSign } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { useToast } from '@/context/ToastContext';
import { downloadFile } from '@/lib/api';
import { defaultReportDate, monthStart, todayISO, weekStart } from '@/lib/dates';
import { longDate, money, pct, shortDate } from '@/lib/format';
import { barTone } from '@/lib/incentive';
import Card, { CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import KpiCard from '@/components/ui/KpiCard';
import Progress from '@/components/ui/Progress';
import PageHeader from '@/components/ui/PageHeader';
import OutletSelect from '@/components/ui/OutletSelect';
import { Field, Input, Select } from '@/components/ui/Field';
import { EmptyState, ErrorBox, PageSkeleton } from '@/components/ui/States';
import { AchievementCell, EmployeeCell, RankCell, TableWrap } from '@/components/shared/cells';

const anchor = defaultReportDate();

export default function PerformancePage() {
  const toast = useToast();
  const [mode, setMode] = useState('team');
  const [period, setPeriod] = useState('week');
  const [outlet, setOutlet] = useState('All');
  const [personId, setPersonId] = useState('');
  const [start, setStart] = useState(weekStart(anchor));
  const [end, setEnd] = useState(anchor);

  const people = useApi('/employees', { outlet: outlet === 'All' ? undefined : outlet });
  useEffect(() => {
    if (people.data?.length && !people.data.some((p) => p._id === personId)) setPersonId(people.data[0]._id);
  }, [people.data, personId]);

  const changePeriod = (p) => {
    setPeriod(p);
    if (p === 'week') { setStart(weekStart(anchor)); setEnd(anchor); }
    if (p === 'month') { setStart(monthStart(anchor)); setEnd(anchor); }
  };
  const changeDate = (setter) => (e) => { setter(e.target.value); setPeriod('custom'); };

  const invalid = !start || !end || start > end;
  const { data, loading, error, reload } = useApi(
    '/reports/performance',
    { start, end, outlet, mode, employeeId: mode === 'person' ? personId : undefined },
    { enabled: !invalid && (mode === 'team' || !!personId) }
  );

  const exportView = () => downloadFile('/reports/export/performance', { start, end, outlet }).catch((e) => toast.error(e.message));
  // `data` can briefly be the previous report (e.g. team data right after switching to "person").
  // Always render from the loaded report's own mode, and wait until it matches the selected one.
  const stale = !!data && data.mode !== mode;
  const isPerson = data?.mode === 'person';
  const s = data?.summary || {};
  const k = data?.kpis;

  return (
    <div>
      <PageHeader title="Performance reports" subtitle="Compare the team over a week, month or custom range, or look at one salesperson." actions={<Button onClick={exportView} disabled={invalid}><Download size={15} /> Export view</Button>} />

      <Card className="mb-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Field label="Report type">
            <Select value={mode} onChange={(e) => setMode(e.target.value)}><option value="team">Team leaderboard</option><option value="person">Single salesperson</option></Select>
          </Field>
          <Field label="Period">
            <Select value={period} onChange={(e) => changePeriod(e.target.value)}><option value="week">This week</option><option value="month">This month</option><option value="custom">Custom date range</option></Select>
          </Field>
          <Field label="Outlet"><OutletSelect value={outlet} onChange={setOutlet} allLabel="All" /></Field>
          {mode === 'person' && (
            <Field label="Salesperson">
              <Select value={personId} onChange={(e) => setPersonId(e.target.value)}>{(people.data || []).map((p) => <option key={p._id} value={p._id}>{p.name} · {p.outlet?.name}</option>)}</Select>
            </Field>
          )}
          <Field label="Start date"><Input type="date" value={start} max={todayISO()} onChange={changeDate(setStart)} /></Field>
          <Field label="End date"><Input type="date" value={end} max={todayISO()} onChange={changeDate(setEnd)} /></Field>
        </div>
        {invalid && <p className="mt-3 text-xs text-rose-300">Start date must be on or before the end date.</p>}
        <p className="mt-4 text-xs text-slate-500">Only finalized daily sales count toward official results. Days without a finalized record show as missing, not as zero.</p>
      </Card>

      {error && !data && <ErrorBox message={error} onRetry={reload} />}
      {(!data || stale) && loading && <PageSkeleton />}

      {data && !stale && k && (
        <>
          <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard animate={false} label={isPerson ? 'Period sales' : 'Team sales'} icon={Wallet} tone="blue" value={k.sales} format={(n) => money(n)} foot={`${data.days} calendar day${data.days === 1 ? '' : 's'} selected`} />
            <KpiCard animate={false} label="Period target" icon={Target} tone="violet" value={k.target} format={(n) => money(n)} foot="Daily target × working days (outlet off days excluded)" />
            <KpiCard animate={false} label="Achievement" icon={TrendingUp} tone="green" value={k.achievement} format={(n) => pct(n)} foot={isPerson ? `${k.daysReported} of ${data.days} days reported` : 'Against selected period targets'} />
            <KpiCard animate={false} label="Incentives earned" icon={BadgeDollarSign} tone="amber" value={k.incentive} format={(n) => money(n)} foot="Daily rewards summed · pending approval" />
          </div>

          <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-2 sm:gap-5">
            <Card>
              <CardHeader title={isPerson ? 'Daily achievement' : 'Achievement by salesperson'} subtitle="Period sales ÷ period target" />
              <div className="space-y-4">
                {isPerson
                  ? (data.daily || []).map((d) => (
                      <div key={d.date} className="grid grid-cols-[64px_1fr_56px] items-center gap-3 text-xs">
                        <span className="font-medium text-slate-300">{shortDate(d.date)}</span>
                        <Progress value={(d.achievement / Math.max(100, d.achievement)) * 100} tone={barTone(d.achievement)} height={8} />
                        <span className="text-right font-bold text-white">{pct(d.achievement)}</span>
                      </div>
                    ))
                  : data.rows.slice(0, 8).map((r) => {
                      const max = Math.max(100, ...data.rows.map((x) => x.achievement || 0));
                      return (
                        <div key={r.employee.id} className="grid grid-cols-[84px_1fr_56px] items-center gap-3 text-xs">
                          <span className="truncate font-medium text-slate-300">{r.employee.name.split(' ')[0]}</span>
                          <Progress value={((r.achievement || 0) / max) * 100} tone={r.outlet === data.rows[0]?.outlet ? 'blue' : 'violet'} height={8} />
                          <span className="text-right font-bold text-white">{pct(r.achievement)}</span>
                        </div>
                      );
                    })}
                {((isPerson && !(data.daily || []).length) || (!isPerson && !data.rows.length)) && <EmptyState title="No finalized records" message="Choose a different period or finalize sales for these dates." />}
              </div>
            </Card>

            <Card>
              <CardHeader title={isPerson ? 'Salesperson summary' : 'Period summary'} subtitle="Sales, target, incentives and coverage" />
              <dl className="space-y-3.5 text-sm">
                {(isPerson
                  ? [
                      ['Salesperson', s.salesperson],
                      ['Outlet / category', s.outlet ? `${s.outlet} · ${s.category}` : '—'],
                      ['Days reported', `${s.daysReported ?? 0} / ${data.days}`],
                      ['Missing days', s.missingDays ?? 0],
                      ['Best day', s.bestDay ? longDate(s.bestDay) : '—'],
                      ['Average per reported day', s.avgPerReportedDay ? money(s.avgPerReportedDay) : '—'],
                    ]
                  : [
                      ['Employees with reported sales', `${s.employeesReported} / ${s.employeesTotal}`],
                      ['Finalized employee-days', `${s.reportedDays} / ${s.possibleDays}`],
                      ['Missing employee-days', s.missingDays],
                      ['100%+ employee-periods', s.achievers100],
                      ...Object.entries(s.outletTotals || {}).map(([name, v]) => [`${name} sales`, money(v)]),
                    ]
                ).map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between gap-4"><dt className="text-slate-400">{label}</dt><dd className="text-right font-semibold text-white">{value}</dd></div>
                ))}
              </dl>
            </Card>
          </div>

          <Card pad={false} className="overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-5 py-4">
              <h3 className="text-sm font-semibold text-white">{isPerson ? 'Salesperson period result' : 'Period leaderboard'}</h3>
              <Badge tone="blue">Ranked by achievement %</Badge>
            </div>
            <TableWrap>
              <table className="w-full min-w-[900px]">
                <thead><tr>{['Rank', 'Employee', 'Outlet', 'Days reported', 'Total sales', 'Total target', 'Achievement', 'Incentive earned'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
                <tbody>
                  {data.rows.map((r) => (
                    <tr key={r.employee.id} className="tr-hover">
                      <td className="td"><RankCell rank={r.rank} /></td>
                      <td className="td"><EmployeeCell id={r.employee.id} name={r.employee.name} avatar={r.employee.avatar} sub={r.category || 'Category unassigned'} /></td>
                      <td className="td">{r.outlet}</td>
                      <td className="td">{r.daysReported} / {r.workingDays ?? data.days}</td>
                      <td className="td font-semibold text-white">{money(r.sales)}</td>
                      <td className="td">{money(r.target)}</td>
                      <td className="td"><AchievementCell value={r.achievement} /></td>
                      <td className="td font-semibold text-emerald-400">{money(r.incentive)}</td>
                    </tr>
                  ))}
                  {!data.rows.length && <tr><td colSpan={8}><EmptyState title="No finalized sales in this period" message="Pick another period or enter and finalize sales." /></td></tr>}
                </tbody>
              </table>
            </TableWrap>
          </Card>
        </>
      )}
    </div>
  );
}
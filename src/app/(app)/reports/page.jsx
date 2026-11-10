'use client';
import { Fragment } from 'react';
import { Download, Printer } from 'lucide-react';
import clsx from 'clsx';
import { useApi } from '@/hooks/useApi';
import { useToast } from '@/context/ToastContext';
import { downloadText } from '@/lib/csv';
import { longDate, money, monthLabel } from '@/lib/format';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { ErrorBox, Skeleton } from '@/components/ui/States';

const f1 = (v) => (v === null || v === undefined ? '—' : `${v.toFixed(1)}%`);

/** Formats one cell and picks its colour. */
function show(v, fmt) {
  if (fmt === 'text') return { text: v, cls: '' };
  if (fmt === 'money') return { text: money(v), cls: '' };
  if (fmt === 'int') return { text: String(v), cls: '' };
  if (fmt === 'pct') return { text: f1(v), cls: '' };
  if (fmt === 'gap') {
    if (Math.round(v) === 0) return { text: 'On target', cls: 'text-slate-300' };
    return v > 0 ? { text: `Behind ${money(v)}`, cls: 'text-rose-400' } : { text: `Ahead ${money(-v)}`, cls: 'text-emerald-400' };
  }
  if (fmt === 'growth') {
    if (v === null || v === undefined) return { text: '—', cls: 'text-slate-400' };
    if (v < 0) return { text: `▼ −${Math.abs(v).toFixed(1)}%`, cls: 'text-rose-400' };
    return v > 0 ? { text: `▲ +${v.toFixed(1)}%`, cls: 'text-emerald-400' } : { text: '0.0%', cls: 'text-slate-300' };
  }
  return { text: String(v), cls: '' };
}

// The report, row by row. `total` overrides how the DX Pharma Total column is filled.
const SECTIONS = [
  { title: 'Target', rows: [
    { label: 'Monthly sales target', bold: true, fmt: 'money', get: (r) => r.monthlyTarget },
    { label: 'Working days passed', sub: 'Passed / total, outlet off days excluded', fmt: 'text', get: (r) => `${r.passed} / ${r.workingDays}`, total: () => '—' },
    { label: 'MTD target', sub: 'Pro-rata for working days passed', fmt: 'money', get: (r) => r.mtdTarget },
  ] },
  { title: 'Month-to-date achievement', rows: [
    { label: 'MTD achievement', sub: 'Finalized sales, 1st to report date', bold: true, fmt: 'money', get: (r) => r.mtdSales },
    { label: 'Achievement %', sub: 'MTD achievement ÷ monthly target', bold: true, fmt: 'pct', get: (r) => r.achievementPct },
    { label: 'Gap as per days passed', sub: 'MTD target − MTD achievement', bold: true, fmt: 'gap', csvLabel: 'Gap as per days passed (+ behind / − ahead)', get: (r) => r.gap },
  ] },
  { title: 'Projection', rows: [
    { label: 'Projected month-end sales', sub: 'Current run rate × total working days', fmt: 'money', get: (r) => r.projected },
    { label: 'Projected achievement %', sub: 'Projected ÷ monthly target', bold: true, fmt: 'pct', get: (r) => r.projectedPct },
  ] },
  { title: 'Run rate (per working day)', rows: [
    { label: 'Current run rate', sub: 'MTD achievement ÷ working days passed', fmt: 'money', get: (r) => r.runRate },
    { label: 'Required run rate', sub: 'Remaining target ÷ remaining working days', fmt: 'money', get: (r) => r.requiredRate },
  ] },
  { title: 'Last month comparison', rows: [
    { label: 'Last month (full month)', fmt: 'money', get: (r) => r.lastMonthFull },
    { label: 'Last month MTD', sub: 'Same date range last month', fmt: 'money', get: (r) => r.lastMonthMtd },
    { label: 'Growth %', sub: 'MTD vs last month MTD', bold: true, fmt: 'growth', get: (r) => r.growthPct },
  ] },
  { title: 'Attendance (month to date)', rows: [
    { label: 'Present days', sub: 'Employee-days with a sales entry', fmt: 'int', get: (r) => r.present },
    { label: 'Absent days', sub: 'No sales and no roster off (incl. off beyond quota)', fmt: 'int', get: (r) => r.absent },
    { label: 'Roster-off days', fmt: 'int', get: (r) => r.rosterOff },
    { label: 'Attendance %', sub: 'Present ÷ (present + absent)', bold: true, fmt: 'pct', get: (r) => r.attendancePct },
  ] },
];

const csvCell = (v, fmt) => (v === null || v === undefined ? '' : fmt === 'money' || fmt === 'gap' ? Math.round(v) : fmt === 'pct' || fmt === 'growth' ? Number(v.toFixed(1)) : v);
const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

function buildCsv(d) {
  const names = d.outlets.map((o) => o.name);
  const lines = [
    ['Outlet MTD performance report'],
    ['Month', monthLabel(d.month)],
    ['As of', d.date],
    ['Month-to-date', 'From the 1st of the month to the reporting date. Finalized sales only'],
    [],
    ['Section', 'Metric', ...names, 'DX Pharma Total'],
  ];
  SECTIONS.forEach((s) => s.rows.forEach((r) => lines.push([s.title, r.csvLabel || r.label, ...d.outlets.map((o) => csvCell(r.get(o), r.fmt)), r.total ? r.total() : csvCell(r.get(d.total), r.fmt)])));
  lines.push([], ['Week by week (week 1 starts on the 1st; weeks are 7-day blocks)'], ['Week', 'Dates', ...names.flatMap((n) => [`${n} sales`, `${n} target`, `${n} achievement %`]), 'Total sales', 'Total target', 'Total achievement %']);
  d.weeks.forEach((w) => lines.push([`Week ${w.n}`, `${w.from} to ${w.to}`, ...w.outlets.flatMap((o) => (w.state === 'upcoming' ? ['', '', ''] : [Math.round(o.sales), Math.round(o.target), csvCell(o.achievement, 'pct')])), ...(w.state === 'upcoming' ? ['', '', ''] : [Math.round(w.total.sales), Math.round(w.total.target), csvCell(w.total.achievement, 'pct')])]));
  return lines.map((l) => l.map(esc).join(',')).join('\r\n');
}

export default function MtdReport({ date }) {
  const toast = useToast();
  const { data: d, loading, error, reload } = useApi('/reports/mtd', { date });

  if (!d && loading) return <Skeleton className="h-96" />;
  if (!d && error) return <ErrorBox message={error} onRetry={reload} />;
  if (!d) return null;

  const cal = d.calendar;
  const sub = `${monthLabel(d.month)} · as of ${d.date} · ${cal.uniform ? `${cal.passed} of ${cal.workingDays} working days passed · ${cal.remaining} remaining` : 'working days differ by outlet (see the table)'}`;
  const offAll = d.outlets.reduce((s, o) => s + o.offDays, 0);
  const cols = d.outlets.length + 2;

  const exportCsv = () => { downloadText(`dx-pharma-outlet-mtd-${d.date}.csv`, buildCsv(d)); toast.success('CSV downloaded'); };

  return (
    <Card pad={false} className="print-report overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-5">
        <div>
          <h3 className="text-base font-semibold text-white">Outlet MTD performance report</h3>
          <p className="mt-1 text-xs text-slate-400">{sub}</p>
        </div>
        <div className="no-print flex gap-2">
          <Button onClick={exportCsv}><Download size={15} /> Export CSV</Button>
          <Button variant="primary" onClick={() => window.print()}><Printer size={15} /> Print / Save PDF</Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr>
              <th className="th sticky left-0 bg-ink-850">Metric</th>
              {d.outlets.map((o) => <th key={o.id} className="th text-right">{o.name}</th>)}
              <th className="th border-l border-ink-600/60 text-right">DX Pharma total</th>
            </tr>
          </thead>
          <tbody>
            {SECTIONS.map((s) => (
              <Fragment key={s.title}>
                <tr><td colSpan={cols} className="border-t border-ink-600/50 bg-ink-900/60 px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-400">{s.title}</td></tr>
                {s.rows.map((r) => (
                  <tr key={r.label} className="tr-hover">
                    <td className="td sticky left-0 bg-ink-850">
                      <div className={clsx('text-sm', r.bold ? 'font-bold text-white' : 'text-slate-200')}>{r.label}</div>
                      {r.sub && <div className="mt-0.5 text-[11px] text-slate-500">{r.sub}</div>}
                    </td>
                    {d.outlets.map((o) => { const c = show(r.get(o), r.fmt); return <td key={o.id} className={clsx('td text-right tabular-nums', r.bold ? 'font-bold' : '', c.cls || (r.bold ? 'text-white' : ''))}>{c.text}</td>; })}
                    {(() => { const c = r.total ? { text: r.total(), cls: 'text-slate-400' } : show(r.get(d.total), r.fmt); return <td className={clsx('td border-l border-ink-600/60 text-right tabular-nums', r.bold ? 'font-bold' : '', c.cls || (r.bold ? 'text-white' : ''))}>{c.text}</td>; })()}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-ink-600/60 px-5 py-5">
        <h4 className="text-sm font-semibold text-white">Week by week</h4>
        <p className="mt-1 text-xs text-slate-400">Weeks are counted from the 1st of the month: week 1 is days 1–7, week 2 is 8–14, and so on. Targets are pro-rata by working days.</p>
        <div className="mt-3 overflow-x-auto rounded-xl border border-ink-600/60">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr>
                <th className="th">Week</th>
                {d.outlets.map((o) => <th key={o.id} className="th text-right">{o.name}</th>)}
                <th className="th border-l border-ink-600/60 text-right">DX Pharma total</th>
              </tr>
            </thead>
            <tbody>
              {d.weeks.map((w) => {
                const cell = (x) => (w.state === 'upcoming'
                  ? <span className="text-slate-600">—</span>
                  : <><div className="font-semibold text-white">{money(x.sales)}</div><div className="mt-0.5 text-[11px] text-slate-400">{f1(x.achievement)} of {money(x.target)}</div></>);
                return (
                  <tr key={w.n} className={clsx('tr-hover', w.state === 'upcoming' && 'opacity-60')}>
                    <td className="td">
                      <div className="flex items-center gap-2 font-medium text-white">Week {w.n} {w.state === 'current' && <Badge tone="blue">In progress</Badge>}</div>
                      <div className="mt-0.5 text-[11px] text-slate-500">{longDate(w.from)} – {longDate(w.to)}</div>
                    </td>
                    {w.outlets.map((x) => <td key={x.id} className="td text-right tabular-nums">{cell(x)}</td>)}
                    <td className="td border-l border-ink-600/60 text-right tabular-nums">{cell(w.total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <p className="border-t border-ink-600/60 bg-ink-900/40 px-5 py-4 text-[11px] leading-relaxed text-slate-400">
        <strong className="text-slate-300">Notes:</strong> only <em>Finalized</em> sales are counted, and month-to-date always starts on the 1st. Monthly target = the Monthly Plan outlet target, or the sum of employee monthly targets when none is set. Working days exclude the {offAll} off day(s) set in Admin Settings. Projection assumes the current run rate continues for the rest of the month. Last month MTD covers the same day-of-month range. “Behind” means MTD achievement is below the pro-rata target.
      </p>
    </Card>
  );
}
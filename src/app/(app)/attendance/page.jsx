'use client';
import { useEffect, useMemo, useState } from 'react';
import { CalendarCheck, ChevronLeft, ChevronRight, Download, Flag, Percent, Save, Umbrella, UserX } from 'lucide-react';
import clsx from 'clsx';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { api, downloadFile } from '@/lib/api';
import { currentMonth, shiftMonth, todayISO } from '@/lib/dates';
import { money, monthLabel, pct } from '@/lib/format';
import Card, { CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import KpiCard from '@/components/ui/KpiCard';
import Progress from '@/components/ui/Progress';
import PageHeader from '@/components/ui/PageHeader';
import OutletSelect from '@/components/ui/OutletSelect';
import { Field, Input } from '@/components/ui/Field';
import { EmptyState, ErrorBox, PageSkeleton } from '@/components/ui/States';
import HeadcountChart from '@/components/charts/HeadcountChart';
import { EmployeeCell, TableWrap } from '@/components/shared/cells';

const DOW = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const DOW_FULL = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const CELL = {
  P: ['P', 'bg-emerald-500/15 text-emerald-300'],
  A: ['A', 'bg-rose-500/15 text-rose-300'],
  O: ['O', 'bg-brand-500/15 text-brand-300'],
  X: ['O!', 'bg-amber-500/15 text-amber-300'],
  C: ['–', 'text-slate-600'],
  '.': ['·', 'text-slate-700'],
};

export default function AttendancePage() {
  const { can } = useAuth();
  const toast = useToast();
  const [month, setMonth] = useState(currentMonth());
  const [outlet, setOutlet] = useState('All');
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState('');
  const [rules, setRules] = useState({ rosterOffPerMonth: 4, trackingStart: '' });
  const [savingRules, setSavingRules] = useState(false);
  const { data, loading, error, reload } = useApi('/attendance', { month, outlet });

  useEffect(() => { if (data?.settings) setRules(data.settings); }, [data?.settings?.rosterOffPerMonth, data?.settings?.trackingStart]); // eslint-disable-line react-hooks/exhaustive-deps

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (data?.employees || []).filter((e) => !s || e.name.toLowerCase().includes(s));
  }, [data, q]);

  if (!data && loading) return <PageSkeleton />;
  if (!data && error) return <ErrorBox message={error} onRetry={reload} />;
  if (!data) return null;

  const { days, kpis, headcount, weekday, byOutlet, settings } = data;
  const maxWeek = Math.max(1, ...weekday.map((w) => w.count));

  /** Click cycle for a day without sales: (none) → Off → Absent → cleared */
  const cycle = async (emp, i) => {
    const d = days[i];
    const cur = emp.marks[i];
    const status = cur === null ? 'Off' : cur === 'Off' ? 'Absent' : 'Clear';
    const key = `${emp.id}-${d.date}`;
    setBusy(key);
    try {
      const res = await api('/attendance/mark', { method: 'POST', body: { employeeId: emp.id, date: d.date, status } });
      if (res.beyondQuota) toast.error(`${emp.name}: day off is beyond the monthly quota (${res.offUsed}/${res.quota}), so it counts as absent.`);
      await reload();
    } catch (e) { toast.error(e.message); }
    finally { setBusy(''); }
  };

  const saveRules = async () => {
    setSavingRules(true);
    try { await api('/attendance/settings', { method: 'PUT', body: { rosterOffPerMonth: Number(rules.rosterOffPerMonth), trackingStart: rules.trackingStart } }); toast.success('Attendance rules saved'); await reload(); }
    catch (e) { toast.error(e.message); }
    finally { setSavingRules(false); }
  };

  const exp = (path) => downloadFile(path, { month, outlet }).catch((e) => toast.error(e.message));
  const today = todayISO();

  return (
    <div>
      <PageHeader
        title="Attendance"
        subtitle="Sales entered = present. Roster days off are limited per month; every other closed day without sales is absent. Click a day in the grid to cycle Off → Absent → clear."
        actions={<><Button onClick={() => exp('/attendance/export/summary')}><Download size={15} /> Summary CSV</Button><Button onClick={() => exp('/attendance/export/daily')}><Download size={15} /> Daily detail CSV</Button></>}
      />

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Button size="icon" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="Previous month"><ChevronLeft size={16} /></Button>
        <Input type="month" value={month} max={currentMonth()} onChange={(e) => e.target.value && setMonth(e.target.value)} className="!w-auto" aria-label="Month" />
        <Button size="icon" onClick={() => setMonth(shiftMonth(month, 1))} disabled={month >= currentMonth()} aria-label="Next month"><ChevronRight size={16} /></Button>
        <OutletSelect value={outlet} onChange={setOutlet} className="!w-auto min-w-[150px]" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search employee…" className="!w-52" aria-label="Search employee" />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard animate={false} label="Attendance rate" icon={Percent} tone="blue" value={kpis.rate ?? 0} format={(n) => (kpis.rate === null ? '—' : pct(n))} foot="Present ÷ (present + absent)" />
        <KpiCard animate={false} label="Present days" icon={CalendarCheck} tone="green" value={kpis.present} foot="Employee-days with a sales entry" />
        <KpiCard animate={false} label="Absent days" icon={UserX} tone={kpis.absent ? 'red' : 'cyan'} value={kpis.absent} foot="No sales and no roster off" />
        <KpiCard animate={false} label="Roster-off days" icon={Umbrella} tone="violet" value={kpis.offUsed} foot={`Quota ${settings.rosterOffPerMonth} per employee per month`} />
        <KpiCard animate={false} label="Frequent absentees" icon={Flag} tone="amber" value={kpis.frequentAbsentees} foot="3 or more absent days" />
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr] sm:gap-5">
        <Card>
          <CardHeader title="Daily headcount" subtitle="Present, day off and absent per day" action={<div className="flex gap-3 text-[11px] text-slate-400"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-emerald-500" />present</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-brand-500" />off</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-rose-500" />absent</span></div>} />
          <HeadcountChart data={headcount} />
        </Card>
        <div className="grid gap-4 sm:gap-5">
          <Card>
            <CardHeader title="Absences by weekday" subtitle="Which days lose the most people" />
            <div className="space-y-2.5">
              {weekday.map((w) => (
                <div key={w.dow} className="grid grid-cols-[34px_1fr_24px] items-center gap-3 text-xs">
                  <span className="text-slate-400">{DOW_FULL[w.dow]}</span>
                  <Progress value={(w.count / maxWeek) * 100} tone="amber" height={7} />
                  <span className="text-right font-semibold text-white">{w.count}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <CardHeader title="Attendance rate by outlet" subtitle="Present ÷ (present + absent), whole month" />
            <div className="space-y-3">
              {byOutlet.length === 0 && <p className="text-xs text-slate-500">No data.</p>}
              {byOutlet.map((o, i) => (
                <div key={o.outlet}>
                  <div className="mb-1.5 flex justify-between text-xs"><span className="text-slate-300">{o.outlet}</span><span className="font-semibold text-white">{o.rate === null ? '—' : pct(o.rate)} <span className="font-normal text-slate-500">· {o.absent} absent</span></span></div>
                  <Progress value={o.rate || 0} tone={i % 2 ? 'blue' : 'green'} height={7} />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Card pad={false} className="mb-5 overflow-hidden">
        <div className="px-5 py-4">
          <h3 className="text-sm font-semibold text-white">Roster grid · {monthLabel(month)}</h3>
          <p className="mt-1 text-xs text-slate-400"><strong className="text-emerald-300">P</strong> present · <strong className="text-rose-300">A</strong> absent · <strong className="text-brand-300">O</strong> roster off · <strong className="text-amber-300">O!</strong> off beyond quota (absent) · – outlet off day · · not tracked yet. {can.canMarkAttendance ? 'Click a cell to change it.' : 'View only.'}</p>
        </div>
        <TableWrap>
          <table className="border-separate border-spacing-0" style={{ minWidth: 260 + days.length * 38 + 150 }}>
            <thead>
              <tr>
                <th className="th sticky left-0 z-20 min-w-[220px] bg-ink-850">Employee</th>
                {days.map((d) => (
                  <th key={d.date} className={clsx('th !px-0 text-center', d.date === today && 'text-brand-300')}>
                    <div>{d.day}</div><div className="text-[10px] font-normal text-slate-500">{DOW[d.dow]}</div>
                  </th>
                ))}
                <th className="th text-center">P</th><th className="th text-center">A</th><th className="th text-center">Off</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id} className="tr-hover">
                  <td className="td sticky left-0 z-10 bg-ink-850"><EmployeeCell id={e.id} name={e.name} sub={e.outlet.name} avatar={e.avatar} /></td>
                  {days.map((d, i) => {
                    const code = e.cells[i];
                    const [label, cls] = CELL[code];
                    const editable = can.canMarkAttendance && code !== 'P' && !d.future && !d.beforeStart;
                    const key = `${e.id}-${d.date}`;
                    return (
                      <td key={d.date} className="border-t border-ink-600/50 p-0.5 text-center">
                        <button
                          type="button"
                          disabled={!editable || busy === key}
                          onClick={() => cycle(e, i)}
                          title={`${e.name} · ${d.date}${editable ? ' · click to change' : ''}`}
                          className={clsx('h-8 w-8 rounded-md text-[11px] font-bold transition', cls, editable ? 'cursor-pointer hover:ring-1 hover:ring-brand-400/60' : 'cursor-default', busy === key && 'animate-pulse')}
                        >
                          {label}
                        </button>
                      </td>
                    );
                  })}
                  <td className="td text-center font-semibold text-emerald-300">{e.present}</td>
                  <td className="td text-center font-semibold text-rose-300">{e.absent}</td>
                  <td className="td text-center">{e.offUsed}/{e.quota}</td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={days.length + 4}><EmptyState title="No employees match" /></td></tr>}
            </tbody>
          </table>
        </TableWrap>
      </Card>

      <Card pad={false} className="mb-5 overflow-hidden">
        <div className="px-5 py-4"><h3 className="text-sm font-semibold text-white">Employee attendance summary</h3><p className="mt-1 text-xs text-slate-400">Sorted by most absences. Off days beyond the monthly quota are counted as absent.</p></div>
        <TableWrap>
          <table className="w-full min-w-[980px]">
            <thead><tr>{['Employee', 'Outlet', 'Present', 'Absent', 'Roster off used', 'Off beyond quota', 'Attendance %', 'Avg sales / present day', 'Last absent'].map((h) => <th key={h} className="th">{h}</th>)}</tr></thead>
            <tbody>
              {[...rows].sort((a, b) => b.absent - a.absent || a.name.localeCompare(b.name)).map((e) => (
                <tr key={e.id} className="tr-hover">
                  <td className="td"><EmployeeCell id={e.id} name={e.name} avatar={e.avatar} sub={e.category || 'Unassigned'} /></td>
                  <td className="td">{e.outlet.name}</td>
                  <td className="td">{e.present}</td>
                  <td className="td">{e.absent ? <Badge tone="red">{e.absent}</Badge> : 0}</td>
                  <td className="td">{e.offUsed} / {e.quota}</td>
                  <td className="td">{e.offBeyond}</td>
                  <td className={clsx('td font-semibold', e.rate === null ? 'text-slate-500' : e.rate >= 90 ? 'text-emerald-400' : 'text-rose-400')}>{e.rate === null ? '—' : pct(e.rate)}</td>
                  <td className="td">{e.avgSalesPresent === null ? '—' : money(e.avgSalesPresent)}</td>
                  <td className="td text-slate-400">{e.lastAbsent || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </Card>

      <Card>
        <CardHeader title="Attendance rules" subtitle="Dates before the tracking start are never counted as absent, so old history is not distorted." />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Field label="Roster days off per employee, per month"><Input type="number" min="0" max="31" value={rules.rosterOffPerMonth} disabled={!can.canManageAttendanceRules} onChange={(e) => setRules({ ...rules, rosterOffPerMonth: e.target.value })} /></Field>
          <Field label="Attendance tracking starts on"><Input type="date" value={rules.trackingStart} disabled={!can.canManageAttendanceRules} onChange={(e) => setRules({ ...rules, trackingStart: e.target.value })} /></Field>
          {can.canManageAttendanceRules && <Button variant="primary" loading={savingRules} onClick={saveRules}><Save size={15} /> Save rules</Button>}
        </div>
      </Card>
    </div>
  );
}
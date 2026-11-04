'use client';
import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Save } from 'lucide-react';
import clsx from 'clsx';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { api } from '@/lib/api';
import { currentMonth, shiftMonth } from '@/lib/dates';
import { monthLabel } from '@/lib/format';
import Card, { CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Notice from '@/components/ui/Notice';
import PageHeader from '@/components/ui/PageHeader';
import { Input, Select } from '@/components/ui/Field';
import { EmptyState } from '@/components/ui/States';

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function monthDays(m) {
  const [y, mm] = m.split('-').map(Number);
  const n = new Date(Date.UTC(y, mm, 0)).getUTCDate();
  const first = new Date(Date.UTC(y, mm - 1, 1)).getUTCDay();
  return { first, days: Array.from({ length: n }, (_, i) => ({ date: `${m}-${String(i + 1).padStart(2, '0')}`, day: i + 1, dow: (first + i) % 7 })) };
}

export default function AdminSettingsPage() {
  const { can } = useAuth();
  const toast = useToast();
  const [outlet, setOutlet] = useState('');
  const [month, setMonth] = useState(currentMonth());
  const [off, setOff] = useState(new Set());
  const [dirty, setDirty] = useState(false);
  const [applyAll, setApplyAll] = useState(false);
  const [weekday, setWeekday] = useState('5');
  const [busy, setBusy] = useState(false);

  const outlets = useApi('/outlets');
  const active = (outlets.data || []).filter((o) => o.isActive);
  useEffect(() => { if (!outlet && active.length) setOutlet(active[0]._id); }, [active, outlet]);

  const loaded = useApi('/off-days', { outlet, month }, { enabled: !!outlet && !!can.canManageOffDays });
  useEffect(() => {
    if (loaded.data && loaded.data.month === month && loaded.data.outlet === outlet) { setOff(new Set(loaded.data.dates)); setDirty(false); }
  }, [loaded.data, month, outlet]);

  const { first, days } = useMemo(() => monthDays(month), [month]);
  if (!can.canManageOffDays) return <EmptyState title="Admins only" message="Only an admin can change outlet off days." />;

  const toggle = (date) => { setOff((s) => { const n = new Set(s); if (n.has(date)) n.delete(date); else n.add(date); return n; }); setDirty(true); };
  const markWeekday = () => { setOff((s) => { const n = new Set(s); days.filter((d) => d.dow === Number(weekday)).forEach((d) => n.add(d.date)); return n; }); setDirty(true); };
  const clearMonth = () => { setOff(new Set()); setDirty(true); };
  const changeMonth = (m) => { if (dirty && !window.confirm('You have unsaved changes for this month. Leave without saving?')) return; setMonth(m); };
  const go = (n) => changeMonth(shiftMonth(month, n));

  const save = async () => {
    setBusy(true);
    try {
      const ids = applyAll ? active.map((o) => o._id) : [outlet];
      await api('/off-days', { method: 'PUT', body: { outlets: ids, month, dates: [...off].sort() } });
      toast.success(applyAll ? `Off days saved for all ${ids.length} outlets` : 'Off days saved');
      setDirty(false);
      loaded.reload();
    } catch (e) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  const outletName = active.find((o) => o._id === outlet)?.name || '';

  return (
    <div>
      <PageHeader title="Admin settings" subtitle="Choose which outlet is closed on which days. Off days are not working days: they are excluded from period targets and are never counted as absences."
        actions={<Button variant="primary" onClick={save} loading={busy} disabled={!outlet}><Save size={15} /> Save off days{dirty ? ' •' : ''}</Button>} />

      <Card>
        <CardHeader title="Monthly off days" subtitle="Click a date to mark it OFF (not a working day). A 6-day work week means about 4 off days a month." />

        <div className="mb-5 flex flex-wrap items-center gap-3">
          <Select value={outlet} onChange={(e) => { if (dirty && !window.confirm('You have unsaved changes. Switch outlet without saving?')) return; setOutlet(e.target.value); }} className="!w-auto min-w-[170px]" aria-label="Outlet">
            {active.map((o) => <option key={o._id} value={o._id}>{o.name}</option>)}
          </Select>
          <div className="flex items-center gap-2">
            <Button size="icon" onClick={() => go(-1)} aria-label="Previous month"><ChevronLeft size={16} /></Button>
            <Input type="month" value={month} onChange={(e) => e.target.value && changeMonth(e.target.value)} className="!w-auto" aria-label="Month" />
            <Button size="icon" onClick={() => go(1)} aria-label="Next month"><ChevronRight size={16} /></Button>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-300 sm:ml-auto">
            <input type="checkbox" checked={applyAll} onChange={(e) => setApplyAll(e.target.checked)} className="h-4 w-4 accent-brand-500" />
            Apply to all outlets when saving
          </label>
        </div>

        {applyAll && <Notice tone="amber" className="!mb-4" title="All outlets:">Saving will replace the off days of every active outlet for {monthLabel(month)} with the dates selected below.</Notice>}

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2" role="grid" aria-label={`Off days for ${outletName}, ${monthLabel(month)}`}>
          {DOW.map((d) => <div key={d} className="pb-1 text-center text-xs font-semibold text-slate-400">{d}</div>)}
          {Array.from({ length: first }).map((_, i) => <div key={`b${i}`} />)}
          {days.map((d) => {
            const isOff = off.has(d.date);
            return (
              <button
                key={d.date}
                type="button"
                onClick={() => toggle(d.date)}
                aria-pressed={isOff}
                className={clsx('rounded-xl border px-1 py-2.5 text-center transition', isOff ? 'border-rose-500/50 bg-rose-500/15 text-rose-200' : 'border-ink-600 bg-ink-900/60 text-slate-200 hover:border-brand-500/60')}
              >
                <div className="text-sm font-bold">{d.day}</div>
                <div className={clsx('text-[10px] font-semibold', isOff ? 'text-rose-300' : 'text-slate-500')}>{isOff ? 'OFF' : 'WORK'}</div>
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border border-ink-600/60 bg-ink-900/50 px-4 py-3 text-xs text-slate-400">
          <span>Calendar days: <strong className="text-white">{days.length}</strong></span>
          <span>Off days: <strong className="text-rose-300">{off.size}</strong></span>
          <span>Working days: <strong className="text-emerald-300">{days.length - off.size}</strong></span>
          <Badge tone="blue">{outletName} · {monthLabel(month)}</Badge>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Select value={weekday} onChange={(e) => setWeekday(e.target.value)} className="!w-auto" aria-label="Weekday">{DOW.map((d, i) => <option key={d} value={i}>{d}</option>)}</Select>
          <Button onClick={markWeekday}>Mark every selected weekday off (this month)</Button>
          <Button onClick={clearMonth}>Clear this month</Button>
        </div>
      </Card>
    </div>
  );
}
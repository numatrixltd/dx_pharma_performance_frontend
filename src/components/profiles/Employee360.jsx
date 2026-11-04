'use client';
import { Crown } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { longDate, money, monthLabel, pct } from '@/lib/format';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import { ErrorBox, Skeleton } from '@/components/ui/States';
import { CategoryBadge, OutletLink } from '@/components/shared/cells';
import { AttendanceBadge, Empty, MiniTable, Section, StatusBadge, Tile } from './parts';

export default function Employee360Modal({ id, onClose }) {
  const { data, error, reload } = useApi(id ? `/employees/${id}/profile` : null, undefined, { enabled: !!id });
  const ready = data && data.employee.id === id;
  const e = ready ? data.employee : null;

  return (
    <Modal open={!!id} onClose={onClose} size="xl" title={e ? e.name : 'Employee 360°'} subtitle={e ? `${e.designation} · ${e.outlet.name} · ${e.category || 'Unassigned'}` : 'Loading profile…'}>
      {!ready && !error && <div className="space-y-3"><Skeleton className="h-24" /><Skeleton className="h-48" /></div>}
      {error && !ready && <ErrorBox message={error} onRetry={reload} />}
      {ready && <Body d={data} />}
    </Modal>
  );
}

function Body({ d }) {
  const { employee: e, kpis: k, monthly, topPerformer: top, ledger, attendance: att } = d;
  const a = att.summary;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <Avatar name={e.name} src={e.avatar} size={56} />
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge category={e.category} />
          <OutletLink id={e.outlet.id} name={e.outlet.name} className="text-sm text-slate-300" />
          {!e.isActive && <Badge tone="gray">Archived</Badge>}
          {top.overallTotal > 0 ? (
            <Badge tone="amber"><Crown size={12} fill="currentColor" /> Daily top performer × {top.overallTotal}</Badge>
          ) : (
            <Badge tone="gray">Not yet a daily top performer</Badge>
          )}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile label="Net finalized sales" value={money(k.netSales)} />
        <Tile label="Finalized sales days" value={k.finalizedDays} />
        <Tile label="Average sales / day" value={money(k.avgPerDay)} />
        <Tile label="Incentives earned" value={money(k.incentives)} tone="text-emerald-400" />
        <Tile label="Top performer days (all outlets)" value={k.topOverall} tone="text-amber-300" />
        <Tile label="Top performer days (own outlet)" value={k.topOutlet} tone="text-amber-300" />
        <Tile label="Best sales day" value={k.bestDay ? money(k.bestDay.sales) : '—'} sub={k.bestDay?.date} />
        <Tile label="Pending / draft records" value={k.pendingRecords} />
      </div>

      <Section title="Top performer history" hint="month by month · ties share the title">
        {top.months.length ? (
          <MiniTable heads={['Month', 'All-outlet #1 days', 'Own-outlet #1 days', 'Dates as overall #1']}>
            {top.months.map((m) => (
              <tr key={m.month}>
                <td className="td">{m.month}</td>
                <td className="td font-semibold text-amber-300">{m.overall}</td>
                <td className="td">{m.outlet}</td>
                <td className="td whitespace-normal text-xs text-slate-400">{m.dates.length ? m.dates.slice().sort().join(', ') : '—'}</td>
              </tr>
            ))}
          </MiniTable>
        ) : (
          <Empty>{e.name} has not been the top performer on any finalized day yet.</Empty>
        )}
      </Section>

      <Section title="Monthly performance history" hint="target = daily targets on reported days">
        {monthly.length ? (
          <MiniTable heads={['Month', 'Net sales', 'Target', 'Achievement', 'Sales days', 'Incentive']}>
            {monthly.map((m) => (
              <tr key={m.month}>
                <td className="td">{m.month}</td>
                <td className="td font-bold text-white">{money(m.netSales)}</td>
                <td className="td">{money(m.target)}</td>
                <td className="td">{pct(m.achievement)}</td>
                <td className="td">{m.salesDays}</td>
                <td className="td text-emerald-400">{money(m.incentive)}</td>
              </tr>
            ))}
          </MiniTable>
        ) : <Empty>No finalized sales yet.</Empty>}
      </Section>

      <Section title="Daily sales ledger" hint="draft and finalized records, newest first">
        {ledger.length ? (
          <MiniTable maxH="max-h-80" min="min-w-[720px]" heads={['Date', 'Sales', 'Daily target', 'Achievement', 'Status', 'Incentive', 'Approval / payment']}>
            {ledger.map((r) => (
              <tr key={r.date} className="tr-hover">
                <td className="td">{r.date}</td>
                <td className="td font-bold text-white">{money(r.sales)}</td>
                <td className="td">{money(r.target)}</td>
                <td className="td">{pct(r.achievement)}</td>
                <td className="td"><StatusBadge value={r.status} /></td>
                <td className="td text-emerald-400">{money(r.incentive)}</td>
                <td className="td text-xs text-slate-400">{r.status === 'Finalized' ? `${r.approval} · ${r.payment}` : '—'}</td>
              </tr>
            ))}
          </MiniTable>
        ) : <Empty>No sales records yet.</Empty>}
      </Section>

      <Section title="Attendance history" hint={`tracked from ${att.trackingStart}`}>
        <div className="mb-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Tile label="Present days" value={a.present} tone="text-emerald-400" />
          <Tile label="Absent days" value={a.absent} tone={a.absent ? 'text-rose-400' : 'text-white'} />
          <Tile label="Days off" value={a.off} tone="text-brand-300" />
          <Tile label="Attendance rate" value={pct(a.rate)} />
        </div>
        {att.history.length ? (
          <MiniTable maxH="max-h-64" min="min-w-[360px]" heads={['Date', 'Attendance status']}>
            {att.history.map((h) => (
              <tr key={h.date}><td className="td">{longDate(h.date)}</td><td className="td"><AttendanceBadge code={h.code} label={h.status} /></td></tr>
            ))}
          </MiniTable>
        ) : <Empty>No absences or days off recorded since tracking started.</Empty>}
      </Section>
    </div>
  );
}
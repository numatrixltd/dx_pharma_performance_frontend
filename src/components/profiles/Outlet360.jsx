'use client';
import { useApi } from '@/hooks/useApi';
import { useProfiles } from '@/context/ProfileContext';
import { money, pct } from '@/lib/format';
import Modal from '@/components/ui/Modal';
import Progress from '@/components/ui/Progress';
import Notice from '@/components/ui/Notice';
import { ErrorBox, Skeleton } from '@/components/ui/States';
import { Empty, MiniTable, Section, StatusBadge, Tile } from './parts';

export default function Outlet360Modal({ id, onClose }) {
  const { data, error, reload } = useApi(id ? `/outlets/${id}/profile` : null, undefined, { enabled: !!id });
  const ready = data && data.outlet.id === id;

  return (
    <Modal
      open={!!id}
      onClose={onClose}
      size="xl"
      title={ready ? data.outlet.name : 'Outlet 360°'}
      subtitle={ready ? `${data.kpis.activeEmployees} active employees · ${data.kpis.salesRecords} sales records · ${data.kpis.finalizedRecords} finalized records` : 'Loading profile…'}
    >
      {!ready && !error && <div className="space-y-3"><Skeleton className="h-24" /><Skeleton className="h-48" /></div>}
      {error && !ready && <ErrorBox message={error} onRetry={reload} />}
      {ready && <Body d={data} />}
    </Modal>
  );
}

function Body({ d }) {
  const { openEmployee } = useProfiles();
  const { kpis: k, monthly, employees, attendance: att, ledger } = d;
  const trend = monthly.slice(0, 3);
  const max = Math.max(1, ...trend.map((m) => m.netSales));

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile label="Net finalized sales" value={money(k.netSales)} />
        <Tile label="Finalized target" value={money(k.target)} />
        <Tile label="Achievement" value={pct(k.achievement)} tone="text-amber-300" />
        <Tile label="Incentives earned" value={money(k.incentives)} tone="text-emerald-400" />
        <Tile label="Sales days" value={k.salesDays} />
        <Tile label="Average sales / day" value={money(k.avgPerDay)} />
        <Tile label="Active employees" value={k.activeEmployees} />
        <Tile label="Finalized records" value={k.finalizedRecords} />
      </div>

      <Section title="Monthly sales trend" hint="finalized sales only · latest 3 months with activity">
        {trend.length ? (
          <div className="space-y-3">
            {trend.map((m) => (
              <div key={m.month} className="grid grid-cols-[72px_1fr_96px] items-center gap-3 text-xs">
                <span className="text-slate-300">{m.month}</span>
                <Progress value={(m.netSales / max) * 100} tone="violet" height={9} />
                <span className="text-right font-bold text-white">{money(m.netSales)}</span>
              </div>
            ))}
          </div>
        ) : <Empty>No finalized sales yet.</Empty>}
      </Section>

      <Section title="Month-wise business history">
        {monthly.length ? (
          <MiniTable heads={['Month', 'Net sales', 'Target', 'Achievement', 'Sales days', 'Incentives']}>
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
        ) : <Empty>No history yet.</Empty>}
      </Section>

      <Section title="Employee performance" hint="click a name to open Employee 360°">
        <MiniTable maxH="max-h-80" min="min-w-[820px]" heads={['Employee', 'Sales days', 'Net sales', 'Target', 'Achievement', 'Incentive', 'Present', 'Absent', 'Day off', 'Extra off']}>
          {employees.map((e) => (
            <tr key={e.id} className="tr-hover">
              <td className="td">
                <button type="button" onClick={() => openEmployee(e.id)} className="block text-left font-semibold text-white underline-offset-2 hover:text-brand-300 hover:underline">{e.name}</button>
                <div className="text-xs text-slate-500">{e.designation}</div>
              </td>
              <td className="td">{e.salesDays}</td>
              <td className="td">{money(e.netSales)}</td>
              <td className="td">{money(e.target)}</td>
              <td className="td">{pct(e.achievement)}</td>
              <td className="td text-emerald-400">{money(e.incentive)}</td>
              <td className="td">{e.present}</td>
              <td className="td">{e.absent}</td>
              <td className="td">{e.dayOff}</td>
              <td className="td">{e.extraOff}</td>
            </tr>
          ))}
          {!employees.length && <tr><td className="td" colSpan={10}>No active employees in this outlet.</td></tr>}
        </MiniTable>
      </Section>

      <Section title="Attendance history" hint={`tracked from ${att.trackingStart}`}>
        <div className="mb-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Tile label="Present days" value={att.totals.present} tone="text-emerald-400" />
          <Tile label="Absent" value={att.totals.absent} tone={att.totals.absent ? 'text-rose-400' : 'text-white'} />
          <Tile label="Day off" value={att.totals.off} tone="text-brand-300" />
          <Tile label="Extra roster-off" value={att.totals.extra} tone="text-amber-300" />
        </div>
        {att.history.length ? (
          <MiniTable maxH="max-h-64" min="min-w-[480px]" heads={['Date', 'Present', 'Absent', 'Day off', 'Extra off']}>
            {att.history.map((h) => (
              <tr key={h.date}><td className="td">{h.date}</td><td className="td">{h.present}</td><td className="td">{h.absent}</td><td className="td">{h.off}</td><td className="td">{h.extra}</td></tr>
            ))}
          </MiniTable>
        ) : <Empty>No absences or days off since tracking started.</Empty>}
      </Section>

      <Section title="Complete outlet sales ledger" hint="draft and finalized records, newest first">
        {ledger.length ? (
          <MiniTable maxH="max-h-80" min="min-w-[720px]" heads={['Date', 'Employee', 'Sales', 'Target', 'Achievement', 'Status', 'Incentive']}>
            {ledger.map((r, i) => (
              <tr key={`${r.date}-${r.employeeId}-${i}`} className="tr-hover">
                <td className="td">{r.date}</td>
                <td className="td font-semibold text-white">{r.employee}</td>
                <td className="td">{money(r.sales)}</td>
                <td className="td">{money(r.target)}</td>
                <td className="td">{pct(r.achievement)}</td>
                <td className="td"><StatusBadge value={r.status} /></td>
                <td className="td text-emerald-400">{money(r.incentive)}</td>
              </tr>
            ))}
          </MiniTable>
        ) : <Empty>No sales records yet.</Empty>}
      </Section>

      <Notice tone="amber" className="!mb-0 mt-6" title="Data scope:">Sales are attributed to the outlet recorded on each sales entry. Attendance uses each employee&apos;s current outlet. Days without a mark and without sales count as absent only after tracking starts and the day has closed.</Notice>
    </div>
  );
}
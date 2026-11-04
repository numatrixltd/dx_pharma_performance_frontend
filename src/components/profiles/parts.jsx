import clsx from 'clsx';
import Badge from '@/components/ui/Badge';

export function Tile({ label, value, sub, tone = 'text-white' }) {
  return (
    <div className="rounded-xl border border-ink-600/60 bg-ink-900/60 p-3.5">
      <div className="text-xs text-slate-400">{label}</div>
      <div className={clsx('mt-1.5 text-xl font-bold tabular-nums', tone)}>{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-slate-500">{sub}</div>}
    </div>
  );
}

export function Section({ title, hint, children }) {
  return (
    <section className="mt-6">
      <h3 className="mb-2.5 text-sm font-semibold text-white">
        {title} {hint && <span className="font-normal text-slate-500">· {hint}</span>}
      </h3>
      {children}
    </section>
  );
}

/** Bordered table with a sticky header. Use maxH (e.g. 'max-h-80') for a scrolling ledger. */
export function MiniTable({ heads, children, maxH, min = 'min-w-[560px]' }) {
  return (
    <div className={clsx('overflow-auto rounded-xl border border-ink-600/60', maxH)}>
      <table className={clsx('w-full', min)}>
        <thead className="sticky top-0 z-10">
          <tr>{heads.map((h) => <th key={h} className="th">{h}</th>)}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export const Empty = ({ children }) => <p className="rounded-xl border border-dashed border-ink-600 bg-ink-900/40 px-4 py-6 text-center text-xs text-slate-400">{children}</p>;

export function StatusBadge({ value }) {
  return <Badge tone={value === 'Finalized' ? 'blue' : 'amber'}>{value}</Badge>;
}

export function AttendanceBadge({ code, label }) {
  const tone = code === 'A' ? 'red' : code === 'X' ? 'amber' : code === 'O' ? 'blue' : 'gray';
  return <Badge tone={tone}>{label}</Badge>;
}
'use client';
import Link from 'next/link';
import clsx from 'clsx';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { useProfiles } from '@/context/ProfileContext';
import { Skeleton } from '@/components/ui/States';

const DOT = { danger: 'bg-rose-400', warning: 'bg-amber-400', info: 'bg-brand-400', success: 'bg-emerald-400' };

function Row({ a }) {
  const { openOutlet } = useProfiles();
  const inner = (
    <>
      <i className={clsx('mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full', DOT[a.severity])} />
      <div className="min-w-0">
        <div className="text-sm font-semibold leading-snug text-white">{a.title}</div>
        {a.detail && <div className="mt-1 text-xs text-slate-400">{a.detail}</div>}
      </div>
    </>
  );
  const cls = 'flex w-full items-start gap-3 rounded-xl border border-ink-600/80 bg-ink-800/60 px-4 py-3 text-left transition';
  if (a.href) return <Link href={a.href} className={clsx(cls, 'hover:border-brand-500/50')}>{inner}</Link>;
  if (a.outletId) return <button type="button" onClick={() => openOutlet(a.outletId)} className={clsx(cls, 'hover:border-brand-500/50')}>{inner}</button>;
  return <div className={cls}>{inner}</div>;
}

/** Smart alerts & management exceptions (auto-generated from finalized sales, targets and attendance). */
export default function AlertsCard({ data, loading, error }) {
  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">Smart alerts &amp; management exceptions</h3>
          <p className="mt-1 text-xs text-slate-400">Auto-generated from your data — review these after the performance summary</p>
        </div>
        {data && <Badge tone={data.attention ? 'blue' : 'green'}>{data.attention ? `${data.attention} need attention` : 'All clear'}</Badge>}
      </div>
      {!data && loading && <div className="space-y-2.5"><Skeleton className="h-14" /><Skeleton className="h-14" /><Skeleton className="h-14" /></div>}
      {!data && error && <p className="text-xs text-rose-300">Couldn&apos;t load alerts: {error}</p>}
      {data && (
        <div className="space-y-2.5">
          {data.alerts.map((a, i) => <Row key={i} a={a} />)}
          {!data.alerts.length && <p className="rounded-xl border border-dashed border-ink-600 px-4 py-6 text-center text-xs text-slate-400">Nothing to flag for this date.</p>}
        </div>
      )}
    </Card>
  );
}
import { AlertTriangle, Inbox } from 'lucide-react';
import clsx from 'clsx';

export function Skeleton({ className }) {
  return (
    <div className={clsx('relative overflow-hidden rounded-xl bg-ink-700/60', className)}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent" />
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-9 w-64" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-36" />)}
      </div>
      <Skeleton className="h-72" />
    </div>
  );
}

export function EmptyState({ title = 'Nothing here yet', message, action }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-ink-700 text-slate-400"><Inbox size={22} /></span>
      <p className="text-sm font-semibold text-slate-200">{title}</p>
      {message && <p className="max-w-sm text-xs leading-relaxed text-slate-400">{message}</p>}
      {action}
    </div>
  );
}

export function ErrorBox({ message, onRetry }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
      <AlertTriangle size={18} className="mt-0.5 shrink-0" />
      <div className="flex-1">
        <p className="font-medium">We couldn&apos;t load this page</p>
        <p className="mt-0.5 text-xs text-rose-200/80">{message}</p>
      </div>
      {onRetry && <button onClick={onRetry} className="rounded-lg border border-rose-400/40 px-3 py-1 text-xs hover:bg-rose-500/10">Try again</button>}
    </div>
  );
}

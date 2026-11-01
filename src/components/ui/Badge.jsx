import clsx from 'clsx';

const TONES = {
  green: 'bg-emerald-500/12 text-emerald-300 ring-emerald-500/25',
  amber: 'bg-amber-500/12 text-amber-300 ring-amber-500/25',
  blue: 'bg-brand-500/12 text-brand-300 ring-brand-500/25',
  violet: 'bg-violet-500/12 text-violet-300 ring-violet-500/25',
  red: 'bg-rose-500/12 text-rose-300 ring-rose-500/25',
  gray: 'bg-slate-500/12 text-slate-300 ring-slate-500/25',
};

export default function Badge({ tone = 'gray', className, children }) {
  return (
    <span className={clsx('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset', TONES[tone], className)}>
      {children}
    </span>
  );
}

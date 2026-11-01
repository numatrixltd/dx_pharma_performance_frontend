import clsx from 'clsx';

const TONES = {
  blue: 'from-brand-600 to-brand-400 shadow-[0_0_10px_rgba(59,130,246,.55)]',
  green: 'from-emerald-600 to-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.45)]',
  amber: 'from-amber-500 to-amber-300 shadow-[0_0_10px_rgba(251,191,36,.5)]',
  violet: 'from-violet-600 to-violet-400 shadow-[0_0_10px_rgba(139,92,246,.55)]',
};

export default function Progress({ value = 0, tone = 'blue', height = 6, className }) {
  const w = Math.max(0, Math.min(100, value || 0));
  return (
    <div className={clsx('overflow-hidden rounded-full bg-ink-600/70', className)} style={{ height }} role="progressbar" aria-valuenow={Math.round(w)} aria-valuemin={0} aria-valuemax={100}>
      <div className={clsx('h-full rounded-full bg-gradient-to-r transition-[width] duration-700 ease-out', TONES[tone])} style={{ width: `${w}%` }} />
    </div>
  );
}

import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary: 'bg-gradient-to-b from-brand-500 to-brand-600 text-onaccent shadow-glow hover:from-brand-400 hover:to-brand-500',
  secondary: 'border border-ink-600 bg-ink-700/60 text-slate-200 hover:border-brand-500/60 hover:bg-ink-700',
  ghost: 'text-slate-300 hover:bg-white/5',
  danger: 'border border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20',
  success: 'border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20',
};
const SIZES = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2.5 text-sm', icon: 'p-2' };

export default function Button({ variant = 'secondary', size = 'md', loading, className, children, disabled, ...props }) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-medium transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 size={15} className="animate-spin" />}
      {children}
    </button>
  );
}
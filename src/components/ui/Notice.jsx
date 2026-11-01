import { Info, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

export default function Notice({ tone = 'amber', title, children, className }) {
  const Icon = tone === 'amber' ? AlertTriangle : Info;
  return (
    <div
      className={clsx(
        'mb-4 flex gap-3 rounded-xl border px-4 py-3 text-xs leading-relaxed',
        tone === 'amber' ? 'border-amber-500/30 bg-amber-500/10 text-amber-100/90' : 'border-brand-500/30 bg-brand-500/10 text-brand-100/90',
        className
      )}
    >
      <Icon size={16} className={clsx('mt-0.5 shrink-0', tone === 'amber' ? 'text-amber-400' : 'text-brand-400')} />
      <div>
        {title && <strong className="mr-1 text-white">{title}</strong>}
        {children}
      </div>
    </div>
  );
}

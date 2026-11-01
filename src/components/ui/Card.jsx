import clsx from 'clsx';

export default function Card({ className, pad = true, children, ...props }) {
  return (
    <div className={clsx('card', pad && 'card-pad', className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className }) {
  return (
    <div className={clsx('mb-4 flex items-start justify-between gap-3', className)}>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
        {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

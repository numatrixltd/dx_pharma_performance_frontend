import clsx from 'clsx';

export function Field({ label, hint, className, children }) {
  return (
    <div className={className}>
      {label && <label className="label">{label}</label>}
      {children}
      {hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export const Input = ({ className, ...p }) => <input className={clsx('input', className)} {...p} />;

export const Select = ({ className, children, ...p }) => (
  <select className={clsx('input', className)} {...p}>
    {children}
  </select>
);

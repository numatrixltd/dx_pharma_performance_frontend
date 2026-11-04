export default function PageHeader({ title, subtitle, actions, eyebrow }) {
  return (
    <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{eyebrow}</div>}
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-[28px]">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-3xl text-sm text-slate-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
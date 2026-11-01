'use client';
import clsx from 'clsx';

/** Segmented control. options: [{ value, label }] */
export default function Tabs({ options, value, onChange }) {
  return (
    <div className="inline-flex max-w-full gap-1 overflow-x-auto rounded-xl border border-ink-600 bg-ink-900/70 p-1" role="tablist">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={clsx(
            'whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-semibold transition',
            value === o.value ? 'bg-brand-600 text-white shadow-glow' : 'text-slate-400 hover:text-white'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

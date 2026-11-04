'use client';
import { Plus, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Field';
import { money } from '@/lib/format';

/** Returns an error message, or '' when the tiers are valid. */
export function validateTiers(label, tiers) {
  if (!tiers.length) return `${label}: add at least one tier`;
  const mins = [];
  for (const t of tiers) {
    const min = Number(t.min);
    const amount = Number(t.amount);
    if (t.min === '' || !Number.isFinite(min) || min <= 0 || min > 1000) return `${label}: minimum achievement must be between 1% and 1000%`;
    if (t.amount === '' || !Number.isFinite(amount) || amount < 0) return `${label}: enter a reward for every tier (0 or more)`;
    mins.push(min);
  }
  if (new Set(mins).size !== mins.length) return `${label}: two tiers have the same minimum %`;
  return '';
}

export default function TierEditor({ title, tiers, onChange, disabled }) {
  const update = (i, key, value) => onChange(tiers.map((t, j) => (j === i ? { ...t, [key]: value } : t)));
  const remove = (i) => onChange(tiers.filter((_, j) => j !== i));
  const add = () => {
    const top = Math.max(0, ...tiers.map((t) => Number(t.min) || 0));
    onChange([...tiers, { min: top ? top + 50 : 50, amount: '' }]);
  };
  const summary = [...tiers].filter((t) => t.min !== '' && t.amount !== '').sort((a, b) => Number(a.min) - Number(b.min)).map((t) => `${Number(t.min)}%+ → ${money(t.amount)}`).join('  ·  ');

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-xs font-semibold text-slate-300">{title}</h4>
        {!disabled && <Button size="sm" onClick={add}><Plus size={14} /> Add tier</Button>}
      </div>
      <div className="grid grid-cols-[1fr_1fr_40px] gap-3 border-b border-ink-600/50 pb-2 text-xs font-semibold text-slate-400"><span>Minimum achievement (%)</span><span>Reward (৳)</span><span className="sr-only">Remove</span></div>
      <div className="divide-y divide-ink-600/40">
        {tiers.map((t, i) => (
          <div key={i} className="grid grid-cols-[1fr_1fr_40px] items-center gap-3 py-2.5">
            <div className="relative">
              <Input type="number" min="1" max="1000" step="any" value={t.min} disabled={disabled} aria-label={`${title} tier ${i + 1} minimum percent`} onChange={(e) => update(i, 'min', e.target.value)} className="pr-9" />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">%</span>
            </div>
            <Input type="number" min="0" step="any" value={t.amount} disabled={disabled} placeholder="0" aria-label={`${title} tier ${i + 1} reward`} onChange={(e) => update(i, 'amount', e.target.value)} />
            {!disabled && <Button size="icon" variant="ghost" className="hover:!text-rose-300" disabled={tiers.length <= 1} aria-label={`Remove tier ${i + 1}`} onClick={() => remove(i)}><Trash2 size={16} /></Button>}
          </div>
        ))}
      </div>
      {summary && <p className="mt-3 rounded-xl bg-ink-900/60 px-3 py-2 text-xs text-slate-400"><span className="font-semibold text-slate-300">How it pays:</span> {summary}</p>}
    </div>
  );
}
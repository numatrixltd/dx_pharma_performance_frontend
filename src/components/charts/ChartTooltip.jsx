export default function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-ink-500 bg-ink-800/95 px-3 py-2 text-xs shadow-card backdrop-blur">
      {label && <div className="mb-1 font-semibold text-white">{label}</div>}
      {payload.filter((p) => p.value !== null && p.value !== undefined).map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-slate-300">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.stroke || p.fill }} />
          <span>{p.name}:</span>
          <span className="font-semibold text-white">{formatter ? formatter(p.value, p.dataKey) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

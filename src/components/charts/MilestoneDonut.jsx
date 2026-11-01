'use client';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import ChartTooltip from './ChartTooltip';

export const MILESTONE_COLORS = { below: '#475569', m100: '#10b981', m150: '#8b5cf6', m200: '#f59e0b' };

export default function MilestoneDonut({ data = [], centerValue, centerLabel }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const shown = total ? data : [{ key: 'empty', label: 'No data', value: 1 }];
  return (
    <div>
      <div className="relative mx-auto h-44 w-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={shown} dataKey="value" nameKey="label" innerRadius={58} outerRadius={78} paddingAngle={total ? 3 : 0} stroke="none" startAngle={90} endAngle={-270}>
              {shown.map((d) => <Cell key={d.key} fill={MILESTONE_COLORS[d.key] || '#1a2744'} />)}
            </Pie>
            {total > 0 && <Tooltip content={<ChartTooltip />} />}
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <div className="text-2xl font-bold text-white">{centerValue}</div>
            <div className="text-[11px] text-slate-400">{centerLabel}</div>
          </div>
        </div>
      </div>
      <ul className="mt-4 space-y-2 text-xs">
        {data.map((d) => (
          <li key={d.key} className="flex items-center justify-between gap-3 text-slate-300">
            <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: MILESTONE_COLORS[d.key] }} />{d.label}</span>
            <span className="font-semibold text-white">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

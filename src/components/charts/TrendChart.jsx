'use client';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartTooltip from './ChartTooltip';
import { money, shortDate } from '@/lib/format';

const compact = (v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v);

/** data: [{ date, sales, target }] — null values leave a gap (missing day). */
export default function TrendChart({ data = [] }) {
  const rows = data.map((d) => ({ ...d, label: shortDate(d.date) }));
  return (
    <div className="h-64 w-full sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rows} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <defs>
            <linearGradient id="salesFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="rgb(var(--brand-500))" stopOpacity={0.45} />
              <stop offset="100%" stopColor="rgb(var(--brand-500))" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgb(var(--ink-600))" strokeDasharray="3 6" vertical={false} />
          <XAxis dataKey="label" stroke="rgb(var(--slate-500))" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={18} />
          <YAxis stroke="rgb(var(--slate-500))" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={compact} width={48} />
          <Tooltip content={<ChartTooltip formatter={(v) => money(v)} />} cursor={{ stroke: 'rgb(var(--brand-500))', strokeOpacity: 0.3 }} />
          <Area type="monotone" dataKey="target" name="Target" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" fill="none" dot={false} connectNulls={false} />
          <Area type="monotone" dataKey="sales" name="Sales" stroke="rgb(var(--brand-400))" strokeWidth={2.5} fill="url(#salesFill)" dot={{ r: 3, fill: 'rgb(var(--brand-400))', strokeWidth: 0 }} activeDot={{ r: 5 }} connectNulls={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
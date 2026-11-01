'use client';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartTooltip from './ChartTooltip';
import { money } from '@/lib/format';

/** data: [{ name, sales, target }] */
export default function ComparisonBars({ data = [] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }} barGap={6}>
          <CartesianGrid stroke="#1a2744" strokeDasharray="3 6" vertical={false} />
          <XAxis dataKey="name" stroke="#5b6b85" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
          <YAxis stroke="#5b6b85" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)} width={48} />
          <Tooltip content={<ChartTooltip formatter={(v) => money(v)} />} cursor={{ fill: 'rgba(59,130,246,.06)' }} />
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12, color: '#8b9bb4' }} />
          <Bar dataKey="target" name="Target" fill="#8b5cf6" radius={[6, 6, 0, 0]} maxBarSize={44} />
          <Bar dataKey="sales" name="Sales" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={44} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

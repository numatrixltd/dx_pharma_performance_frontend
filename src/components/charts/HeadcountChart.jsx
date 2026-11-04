'use client';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartTooltip from './ChartTooltip';

/** data: [{ day, present, off, absent }] — stacked per day */
export default function HeadcountChart({ data = [] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }} barCategoryGap={3}>
          <CartesianGrid stroke="rgb(var(--ink-600))" strokeDasharray="3 6" vertical={false} />
          <XAxis dataKey="day" stroke="rgb(var(--slate-500))" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
          <YAxis stroke="rgb(var(--slate-500))" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} width={44} />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgb(var(--brand-500) / .08)' }} labelFormatter={(d) => `Day ${d}`} />
          <Bar dataKey="present" name="Present" stackId="a" fill="#10b981" />
          <Bar dataKey="off" name="Day off" stackId="a" fill="#3b82f6" />
          <Bar dataKey="absent" name="Absent" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
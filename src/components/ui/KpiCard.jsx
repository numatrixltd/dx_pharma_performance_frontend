'use client';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import Card from './Card';
import AnimatedNumber from './AnimatedNumber';
import Sparkline from './Sparkline';

const TONES = {
  blue: ['bg-brand-500/15 text-brand-400', '#3b82f6'],
  violet: ['bg-violet-500/15 text-violet-400', '#8b5cf6'],
  green: ['bg-emerald-500/15 text-emerald-400', '#10b981'],
  amber: ['bg-amber-500/15 text-amber-400', '#f59e0b'],
  red: ['bg-rose-500/15 text-rose-400', '#f43f5e'],
  cyan: ['bg-cyan-500/15 text-cyan-400', '#22d3ee'],
};

export default function KpiCard({ label, value, format, foot, icon: Icon, tone = 'blue', spark, index = 0, animate = true }) {
  const [chip, color] = TONES[tone];
  const body = (
    <Card className="h-full">
      <div className="flex items-center gap-3">
        <span className={clsx('grid h-10 w-10 shrink-0 place-items-center rounded-xl', chip)}>{Icon && <Icon size={19} />}</span>
        <span className="text-xs font-medium text-slate-400">{label}</span>
      </div>
      <div className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-[26px]">
        <AnimatedNumber value={value} format={format} />
      </div>
      {foot && <div className="mt-1.5 text-xs text-slate-400">{foot}</div>}
      {spark && <div className="mt-3"><Sparkline data={spark} color={color} /></div>}
    </Card>
  );
  if (!animate) return body;
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05, duration: 0.4, ease: 'easeOut' }}>
      {body}
    </motion.div>
  );
}

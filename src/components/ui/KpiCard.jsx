'use client';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import Card from './Card';
import AnimatedNumber from './AnimatedNumber';
import Sparkline from './Sparkline';

const TONES = {
  blue: ['bg-brand-500/15 text-brand-400', 'rgb(var(--brand-500))'],
  violet: ['bg-violet-500/15 text-violet-400', '#8b5cf6'],
  green: ['bg-emerald-500/15 text-emerald-400', '#10b981'],
  amber: ['bg-amber-500/15 text-amber-400', '#f59e0b'],
  red: ['bg-rose-500/15 text-rose-400', '#f43f5e'],
  cyan: ['bg-cyan-500/15 text-cyan-400', '#22d3ee'],
};

/**
 * variant="spread": label on the left, icon chip on the right, optional dot before the footer (Overview style).
 * `text` shows a fixed string (e.g. "10 / 12") instead of an animated number.
 */
export default function KpiCard({ label, value, format, text, foot, icon: Icon, tone = 'blue', spark, index = 0, animate = true, variant = 'default', dot = false }) {
  const [chip, color] = TONES[tone];
  const number = text !== undefined ? text : <AnimatedNumber value={value} format={format} />;
  const spread = variant === 'spread';

  const body = (
    <Card className="h-full">
      {spread ? (
        <div className="flex items-start justify-between gap-3">
          <span className="text-xs font-medium text-slate-400">{label}</span>
          <span className={clsx('grid h-9 w-9 shrink-0 place-items-center rounded-xl', chip)}>{Icon && <Icon size={17} />}</span>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <span className={clsx('grid h-10 w-10 shrink-0 place-items-center rounded-xl', chip)}>{Icon && <Icon size={19} />}</span>
          <span className="text-xs font-medium text-slate-400">{label}</span>
        </div>
      )}
      <div className={clsx('font-bold tracking-tight text-white', spread ? 'mt-5 text-[28px]' : 'mt-4 text-2xl sm:text-[26px]')}>{number}</div>
      {foot && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
          {dot && <i className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: color }} />}
          <span>{foot}</span>
        </div>
      )}
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
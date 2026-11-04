'use client';
import { useId } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Crown, Sparkles, TrendingUp } from 'lucide-react';
import clsx from 'clsx';
import Avatar from '@/components/ui/Avatar';
import AnimatedNumber from '@/components/ui/AnimatedNumber';
import { useProfiles } from '@/context/ProfileContext';
import { heroUrl } from '@/lib/cloudinary';
import { longDate, money } from '@/lib/format';

const fmtPct = (n) => `${n.toFixed(1)}%`;
const fmtMoney = (n) => money(n);
const GOLD_TEXT = 'bg-gradient-to-r from-amber-200 via-amber-300 to-amber-500 bg-clip-text text-transparent';
const EASE = [0.22, 1, 0.36, 1];

const placeLabel = (rank) => (rank === 1 ? 'Tied for #1' : rank === 2 ? 'Second place' : rank === 3 ? 'Third place' : `Rank #${rank}`);

const TONES = {
  silver: {
    ring: 'from-slate-100 via-slate-400 to-slate-600',
    bar: 'from-slate-400 to-slate-100',
    glow: 'rgba(226,232,240,.55)',
    hover: 'hover:border-slate-300/40',
    place: 'border-slate-300/30 bg-slate-300/10 text-slate-200',
  },
  bronze: {
    ring: 'from-orange-200 via-orange-400 to-orange-700',
    bar: 'from-orange-500 to-orange-200',
    glow: 'rgba(251,146,60,.55)',
    hover: 'hover:border-orange-300/40',
    place: 'border-orange-300/30 bg-orange-300/10 text-orange-200',
  },
};

/** Circular achievement gauge. The ring fills to 100% max; anything above is shown as a chip. */
function Gauge({ value, size = 156, stroke = 12 }) {
  const id = useId().replace(/:/g, '');
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const fill = Math.max(0, Math.min(100, value)) / 100;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`${value.toFixed(1)} percent of target achieved`}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id={`gauge-${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={`url(#gauge-${id})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - fill) }}
          transition={{ duration: 1.3, delay: 0.25, ease: EASE }}
          style={{ filter: 'drop-shadow(0 0 8px rgba(251,191,36,.55))' }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <div className="text-3xl font-extrabold tabular-nums text-white"><AnimatedNumber value={value} format={fmtPct} /></div>
          <div className="mt-0.5 text-[11px] text-slate-400">of daily target</div>
        </div>
      </div>
    </div>
  );
}

function Pill({ children, gold }) {
  return (
    <span className={clsx('inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium', gold ? 'border-amber-300/40 bg-amber-300/10 text-amber-200' : 'border-white/10 bg-white/5 text-slate-300')}>
      {children}
    </span>
  );
}

function Metric({ label, children, tone = 'text-white' }) {
  return (
    <div className="min-w-0 px-3 first:pl-0 last:pr-0 sm:px-5">
      <div className="text-xs text-slate-400">{label}</div>
      <div className={clsx('mt-1 truncate text-lg font-bold tabular-nums sm:text-2xl', tone)}>{children}</div>
    </div>
  );
}

function RunnerUpCard({ row, tone, delay }) {
  const { openEmployee } = useProfiles();
  const t = TONES[tone];
  const fill = Math.max(0, Math.min(100, row.achievement));
  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: EASE }}
      whileHover={{ y: -3 }}
      className={clsx('relative flex flex-col justify-between overflow-hidden rounded-[24px] border border-white/10 bg-gradient-to-br from-white/[0.07] to-white/[0.02] p-5 backdrop-blur-xl transition-colors', t.hover)}
    >
      <span aria-hidden="true" className="pointer-events-none absolute -right-1 -top-5 select-none text-[112px] font-black leading-none text-transparent [-webkit-text-stroke:1.5px_rgba(255,255,255,0.09)]">
        {row.rank}
      </span>

      <div className="relative flex items-center gap-4">
        <div className={clsx('shrink-0 rounded-full bg-gradient-to-br p-[2.5px]', t.ring)}>
          <Avatar name={row.employee.name} src={row.employee.avatar} size={56} className="!rounded-full !ring-0" />
        </div>
        <div className="min-w-0">
          <span className={clsx('inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold', t.place)}>{placeLabel(row.rank)}</span>
          <button type="button" onClick={() => openEmployee(row.employee.id)} title="Open 360° profile" className="mt-1 block max-w-full truncate text-left text-lg font-semibold text-white transition hover:text-amber-200">{row.employee.name}</button>
          <div className="truncate text-xs text-slate-400">{row.category || 'Unassigned'} · {row.outlet.name}</div>
        </div>
      </div>

      <div className="relative mt-5">
        <div className="flex items-end justify-between gap-3">
          <div className="text-3xl font-bold tabular-nums text-white"><AnimatedNumber value={row.achievement} format={fmtPct} /></div>
          <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-xs font-medium text-slate-200">{row.milestone}</span>
        </div>
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={Math.round(fill)} aria-valuemin={0} aria-valuemax={100} aria-label={`${row.employee.name} progress to target`}>
          <motion.div
            className={clsx('h-full rounded-full bg-gradient-to-r', t.bar)}
            style={{ boxShadow: `0 0 12px ${t.glow}` }}
            initial={{ width: 0 }}
            animate={{ width: `${fill}%` }}
            transition={{ duration: 1.1, delay: delay + 0.25, ease: EASE }}
          />
        </div>
      </div>

      <dl className="relative mt-5 grid grid-cols-3 divide-x divide-white/10 text-sm">
        <div className="px-3 first:pl-0"><dt className="text-[11px] text-slate-400">Sales</dt><dd className="mt-0.5 font-semibold tabular-nums text-white">{money(row.sales)}</dd></div>
        <div className="px-3"><dt className="text-[11px] text-slate-400">Target</dt><dd className="mt-0.5 font-semibold tabular-nums text-slate-200">{money(row.target)}</dd></div>
        <div className="px-3 last:pr-0"><dt className="text-[11px] text-slate-400">Incentive</dt><dd className="mt-0.5 font-semibold tabular-nums text-emerald-400">{money(row.incentive)}</dd></div>
      </dl>
    </motion.article>
  );
}

/**
 * Left: champion (#1). Right: #2 and #3.
 * Props: row (#1), runnerUps (up to 2 rows), scope, date, tiedWith (names tied with #1)
 */
export default function TopPerformerHero({ row, runnerUps = [], scope, date, tiedWith = [] }) {
  const { openEmployee } = useProfiles();
  const photo = row.employee.avatar;
  const [first, ...rest] = row.employee.name.split(' ');
  const over = row.achievement - 100;
  const hasRight = runnerUps.length > 0;

  return (
    <div className={clsx('force-dark grid gap-4', hasRight && 'xl:grid-cols-[1.75fr_1fr]')} aria-label="Top performers">
      {/* ===== Champion ===== */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
        className="relative isolate overflow-hidden rounded-[28px] border border-white/10 bg-[#060d22] shadow-[0_30px_80px_-40px_rgba(0,0,0,.9)]"
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          <motion.div className="absolute -left-20 -top-24 h-80 w-80 rounded-full bg-amber-400/20 blur-[90px]" animate={{ x: [0, 14, 0], y: [0, 18, 0] }} transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }} />
          <motion.div className="absolute -bottom-32 right-10 h-96 w-96 rounded-full bg-brand-600/30 blur-[110px]" animate={{ y: [0, -22, 0] }} transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }} />
          <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(255,255,255,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.045)_1px,transparent_1px)] [background-size:44px_44px] [mask-image:radial-gradient(ellipse_at_25%_15%,black,transparent_70%)]" />
        </div>
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/60 to-transparent" />

        <div className="relative grid gap-6 p-5 sm:p-7 md:grid-cols-[1.3fr_1fr] lg:p-8">
          {/* Text */}
          <div className="order-2 flex flex-col md:order-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-xs font-semibold text-amber-200">
                <Crown size={13} fill="currentColor" /> Daily champion
              </span>
              <span className="text-xs text-slate-400">{scope} · {longDate(date)}</span>
            </div>

            <h2 className="mt-4 text-4xl font-bold leading-[1.05] tracking-tight text-white sm:text-5xl">
              <button type="button" onClick={() => openEmployee(row.employee.id)} title="Open 360° profile" className="text-left transition hover:opacity-90">
                {first} {rest.length > 0 && <span className={GOLD_TEXT}>{rest.join(' ')}</span>}
              </button>
            </h2>

            <div className="mt-3 flex flex-wrap gap-2">
              <Pill>{row.category || 'Unassigned'}</Pill>
              <Pill>{row.outlet.name}</Pill>
              <Pill gold><Sparkles size={12} /> {row.milestone} milestone</Pill>
            </div>
            {tiedWith.length > 0 && <p className="mt-2 text-xs text-amber-300">Tied for #1 with {tiedWith.join(', ')}</p>}

            <div className="mt-6 flex flex-col items-center gap-5 rounded-3xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl sm:flex-row">
              <Gauge value={row.achievement} />
              <div className="w-full min-w-0 flex-1">
                {over > 0 ? (
                  <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                    <TrendingUp size={13} /> +{over.toFixed(1)}% over target
                  </span>
                ) : (
                  <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-amber-400/10 px-2.5 py-1 text-xs font-semibold text-amber-300">
                    {Math.abs(over).toFixed(1)}% to reach target
                  </span>
                )}
                <div className="grid grid-cols-3 divide-x divide-white/10">
                  <Metric label="Sales"><AnimatedNumber value={row.sales} format={fmtMoney} /></Metric>
                  <Metric label="Target" tone="text-slate-200">{money(row.target)}</Metric>
                  <Metric label="Incentive" tone="text-emerald-400"><AnimatedNumber value={row.incentive} format={fmtMoney} /></Metric>
                </div>
              </div>
            </div>
          </div>

          {/* Photo */}
          <div className="order-1 h-64 sm:h-72 md:order-2 md:h-auto">
            <div className="relative h-full rounded-[28px] bg-gradient-to-br from-amber-300/70 via-white/10 to-brand-500/40 p-[1.5px] shadow-[0_20px_60px_-25px_rgba(251,191,36,.45)]">
              <div className="relative h-full min-h-[240px] overflow-hidden rounded-[26.5px] bg-[#0a1430]">
                {photo ? (
                  <Image
                    src={heroUrl(photo)}
                    alt={row.employee.name}
                    fill
                    priority
                    quality={90}
                    sizes="(min-width: 1280px) 24vw, (min-width: 768px) 40vw, 100vw"
                    className="object-cover object-top"
                  />
                ) : (
                  <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_50%_35%,rgba(251,191,36,.22),transparent_65%)]">
                    <Avatar name={row.employee.name} size={132} className="!rounded-[32px] !text-4xl shadow-[0_0_50px_rgba(251,191,36,.3)]" />
                  </div>
                )}
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#060d22]/70 via-transparent to-transparent" />
                <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 text-sm font-bold text-amber-200 ring-1 ring-amber-300/40 backdrop-blur-md">
                  <Crown size={14} fill="currentColor" /> #{row.rank}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* ===== #2 and #3 ===== */}
      {hasRight && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-1 xl:grid-rows-2">
          {runnerUps.map((r, i) => (
            <RunnerUpCard key={r.id} row={r} tone={i === 0 ? 'silver' : 'bronze'} delay={0.2 + i * 0.15} />
          ))}
        </div>
      )}
    </div>
  );
}
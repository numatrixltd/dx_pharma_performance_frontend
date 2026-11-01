'use client';
import { motion } from 'framer-motion';
import { Crown, Medal, TrendingUp, UserRound } from 'lucide-react';
import clsx from 'clsx';
import Avatar from '@/components/ui/Avatar';
import { longDate, money, pct } from '@/lib/format';
import Image from 'next/image';

const GOLD = 'bg-gradient-to-b from-amber-100 via-amber-300 to-amber-500 bg-clip-text text-transparent';

/** Laurel branch drawn as a curved stem with leaves. */
function Laurel({ flip }) {
  const pt = (t) => {
    const [p0, p1, p2, p3] = [[34, 96], [6, 76], [6, 34], [30, 6]];
    const u = 1 - t;
    return [0, 1].map((k) => u ** 3 * p0[k] + 3 * u * u * t * p1[k] + 3 * u * t * t * p2[k] + t ** 3 * p3[k]);
  };
  const leaves = Array.from({ length: 7 }, (_, i) => {
    const [x, y] = pt(0.08 + i * 0.14);
    return { x, y, rot: -70 + i * 22 };
  });
  return (
    <svg viewBox="0 0 48 100" className="h-16 w-8 shrink-0 sm:h-24 sm:w-12" style={{ transform: flip ? 'scaleX(-1)' : undefined }} aria-hidden="true">
      <path d="M34 96 C6 76 6 34 30 6" fill="none" stroke="#f5b942" strokeWidth="1.6" strokeLinecap="round" />
      {leaves.map((l, i) => (
        <g key={i}>
          <ellipse cx={l.x - 5} cy={l.y} rx="7" ry="3" transform={`rotate(${l.rot - 40} ${l.x - 5} ${l.y})`} fill="#fbbf24" />
          <ellipse cx={l.x + 4} cy={l.y - 2} rx="6" ry="2.6" transform={`rotate(${l.rot + 20} ${l.x + 4} ${l.y - 2})`} fill="#f59e0b" opacity=".85" />
        </g>
      ))}
    </svg>
  );
}

function Stat({ label, children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-white/10 bg-[#07122c]/80 px-3 py-3 text-center backdrop-blur ${className}`}>
      <div className="text-[11px] font-semibold uppercase text-slate-300 sm:text-xs">{label}</div>
      <div className="mt-1.5 text-lg font-extrabold text-white sm:text-2xl">{children}</div>
    </div>
  );
}

const PLACE = {
  silver: { ring: 'border-slate-300/30 from-slate-300/10', medal: 'text-slate-200', bar: 'from-slate-400 to-slate-200', label: 'text-slate-200', glow: 'rgba(203,213,225,.55)' },
  bronze: { ring: 'border-orange-400/30 from-orange-500/10', medal: 'text-orange-300', bar: 'from-orange-500 to-orange-300', label: 'text-orange-300', glow: 'rgba(251,146,60,.55)' },
};
const placeLabel = (rank) => (rank === 1 ? 'Tied for #1' : rank === 2 ? 'Second place' : rank === 3 ? 'Third place' : `Rank #${rank}`);

function RunnerUpCard({ row, tone, delay }) {
  const t = PLACE[tone];
  const fill = Math.max(0, Math.min(100, row.achievement));
  return (
    <motion.article
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      className={clsx('flex flex-1 flex-col justify-center rounded-3xl border bg-gradient-to-br via-[#0a1a45] to-[#050914] p-4 shadow-[0_0_50px_-26px_rgba(148,163,184,.6)] sm:p-5', t.ring)}
    >
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          {row.employee.avatar ? (
            <Avatar name={row.employee.name} src={row.employee.avatar} size={84} className="!rounded-2xl" />
          ) : (
            <span className="grid h-[84px] w-[84px] place-items-center rounded-2xl border border-white/15 bg-white/5 text-slate-300"><UserRound size={36} /></span>
          )}
          <span className={clsx('absolute -bottom-2 -right-2 grid h-8 w-8 place-items-center rounded-full border border-white/15 bg-[#07122c]', t.medal)}><Medal size={17} /></span>
        </div>
        <div className="min-w-0 flex-1">
          <div className={clsx('text-xs font-bold uppercase', t.label)}>{placeLabel(row.rank)}</div>
          <div className="mt-0.5 truncate text-xl font-bold text-white">{row.employee.name}</div>
          <div className="text-xs text-slate-400">{row.category || 'Unassigned'} · {row.outlet.name}</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-white/5 px-2 py-2"><div className="text-[10px] font-semibold uppercase text-slate-400">Sales</div><div className="mt-0.5 text-sm font-bold text-white">{money(row.sales)}</div></div>
        <div className="rounded-xl bg-white/5 px-2 py-2"><div className="text-[10px] font-semibold uppercase text-slate-400">Target</div><div className="mt-0.5 text-sm font-bold text-slate-200">{money(row.target)}</div></div>
        <div className="rounded-xl bg-white/5 px-2 py-2"><div className="text-[10px] font-semibold uppercase text-slate-400">Incentive</div><div className="mt-0.5 text-sm font-bold text-emerald-400">{money(row.incentive)}</div></div>
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <span className="text-2xl font-extrabold text-white">{pct(row.achievement)}</span>
        <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-xs font-semibold text-slate-200">{row.milestone}</span>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={Math.round(fill)} aria-valuemin={0} aria-valuemax={100} aria-label={`${row.employee.name} progress to target`}>
        <motion.div
          className={clsx('h-full rounded-full bg-gradient-to-r', t.bar)}
          style={{ boxShadow: `0 0 12px ${t.glow}` }}
          initial={{ width: 0 }}
          animate={{ width: `${fill}%` }}
          transition={{ duration: 1, delay: delay + 0.25, ease: 'easeOut' }}
        />
      </div>
    </motion.article>
  );
}

/**
 * Left: the full #1 card (details + photo). Right: #2 and #3 cards.
 * Props: row (#1), runnerUps (up to 2 rows), scope, date, tiedWith (names tied with #1)
 */
export default function TopPerformerHero({ row, runnerUps = [], scope, date, tiedWith = [] }) {
  const fill = Math.max(0, Math.min(100, row.achievement));
  const photo = row.employee.avatar;
  const hasRight = runnerUps.length > 0;

  return (
    <div className={clsx('grid gap-4', hasRight && 'xl:grid-cols-[1.9fr_1fr]')} aria-label="Top three performers">
      {/* ===== Left: #1 ===== */}
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-3xl border border-amber-400/30 bg-gradient-to-br from-[#06112e] via-[#0a1a45] to-[#050914] shadow-[0_0_70px_-24px_rgba(251,191,36,.45)]"
      >
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/3 h-56 w-56 rounded-full bg-brand-600/20 blur-3xl" />

        <div className="relative grid md:grid-cols-[1.4fr_1fr]">
          {/* Details */}
          <div className="order-2 p-5 sm:p-7 md:order-1 lg:p-8">
            <div className="text-xs font-semibold text-amber-300/80">{scope} · {longDate(date)}</div>
            <h2 className={`mt-2 text-3xl font-black uppercase leading-[1.05] tracking-tight drop-shadow-[0_2px_18px_rgba(251,191,36,.35)] sm:text-4xl ${GOLD}`}>
              Performance<br />Leaderboard
            </h2>

            <div className="mt-5 flex items-center">
              <div className="relative z-10 flex items-center">
                <Laurel />
                <div className="-mx-1 flex flex-col items-center sm:-mx-2">
                  <Crown className="-mb-1 h-6 w-6 text-amber-300 drop-shadow-[0_0_10px_rgba(251,191,36,.8)] sm:h-8 sm:w-8" fill="currentColor" />
                  <span className={`text-5xl font-black leading-none sm:text-6xl ${GOLD}`}>#{row.rank}</span>
                </div>
                <Laurel flip />
              </div>
              <div
                className="relative -ml-4 flex-1 overflow-hidden bg-gradient-to-r from-amber-500 via-amber-300 to-amber-500 py-3 pl-8 pr-10 text-base font-extrabold uppercase italic text-slate-900 shadow-[0_0_30px_-6px_rgba(251,191,36,.7)] sm:py-3.5 sm:text-2xl"
                style={{ clipPath: 'polygon(0 0, 95% 0, 100% 50%, 95% 100%, 0 100%)' }}
              >
                Top performer
                <motion.span aria-hidden="true" className="absolute inset-y-0 w-1/4 -skew-x-12 bg-white/40 blur-md" initial={{ left: '-30%' }} animate={{ left: '130%' }} transition={{ duration: 1.6, delay: 0.6, ease: 'easeInOut' }} />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-4 rounded-2xl border border-amber-400/30 bg-[#07122c]/80 p-3.5 backdrop-blur">
              {photo ? (
                <Avatar name={row.employee.name} src={photo} size={56} className="!rounded-full ring-2 ring-amber-300/70" />
              ) : (
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border-2 border-amber-400/70 text-amber-300"><UserRound size={26} /></span>
              )}
              <div className="min-w-0">
                <div className="truncate text-2xl font-bold text-white">{row.employee.name}</div>
                <div className="text-sm text-slate-300">{row.category || 'Unassigned'} · {row.outlet.name}</div>
                {tiedWith.length > 0 && <div className="mt-1 text-xs text-amber-300">Tied for #1 with {tiedWith.join(', ')}</div>}
              </div>
            </div>

            <div className="mt-3 grid grid-cols-6 gap-2.5">
              <Stat label="Sales" className="col-span-3 sm:col-span-2">{money(row.sales)}</Stat>
              <Stat label="Target" className="col-span-3 sm:col-span-2"><span className="text-slate-200">{money(row.target)}</span></Stat>
              <Stat label="Achievement" className="col-span-3 sm:col-span-2"><span className="text-amber-300">{pct(row.achievement)}</span></Stat>
              <Stat label="Incentive" className="col-span-3"><span className="text-emerald-400">{money(row.incentive)}</span></Stat>
              <Stat label="Milestone" className="col-span-6 sm:col-span-3">
                <span className="inline-block rounded-full border border-amber-400/70 px-3 py-0.5 text-base text-amber-300">{row.milestone}</span>
              </Stat>
            </div>

            <div className="mt-3 rounded-2xl border border-amber-400/40 bg-[#07122c]/80 px-4 py-3.5 shadow-[0_0_30px_-12px_rgba(251,191,36,.5)]">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-amber-300 sm:text-3xl">{pct(row.achievement)}</span>
                <span className="text-sm font-bold uppercase text-white sm:text-lg">Achieved</span>
              </div>
              <div className="mt-2.5 flex items-center gap-3">
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuenow={Math.round(fill)} aria-valuemin={0} aria-valuemax={100} aria-label="Progress to target">
                  <motion.div className="h-full rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 shadow-[0_0_14px_rgba(251,191,36,.7)]" initial={{ width: 0 }} animate={{ width: `${fill}%` }} transition={{ duration: 1.1, delay: 0.3, ease: 'easeOut' }} />
                </div>
                <span className="text-sm font-semibold text-white">100%</span>
              </div>
            </div>
          </div>

          {/* Photo */}
          <div className="relative order-1 min-h-[260px] md:order-2 md:min-h-full">
  {photo ? (
    <Image
      src={photo}
      alt={row.employee.name}
      fill
      priority
      sizes="(min-width: 1280px) 30vw, (min-width: 768px) 40vw, 100vw"
      className="object-cover object-top"
    />
  ) : (
    <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_50%_40%,rgba(251,191,36,.18),transparent_60%)]">
      <div className="text-center">
        <span className="mx-auto grid h-24 w-24 place-items-center rounded-full border-2 border-amber-400/60 text-amber-300 shadow-[0_0_40px_rgba(251,191,36,.35)]"><UserRound size={48} /></span>
        <div className="mt-3 text-xs text-slate-400">No photo added yet</div>
      </div>
    </div>
  )}
  <div className="absolute inset-0 bg-gradient-to-t from-[#0a1a45] via-transparent to-transparent md:bg-gradient-to-r md:from-[#0a1a45] md:via-[#0a1a45]/10 md:to-transparent" />
  <TrendingUp className="pointer-events-none absolute right-4 top-4 h-14 w-14 text-amber-300/60 drop-shadow-[0_0_16px_rgba(251,191,36,.6)] sm:h-20 sm:w-20" strokeWidth={1.6} aria-hidden="true" />
</div>
        </div>
      </motion.section>

      {/* ===== Right: #2 and #3 ===== */}
      {hasRight && (
        <div className="flex flex-col gap-4">
          {runnerUps.map((r, i) => (
            <RunnerUpCard key={r.id} row={r} tone={i === 0 ? 'silver' : 'bronze'} delay={0.2 + i * 0.15} />
          ))}
        </div>
      )}
    </div>
  );
}
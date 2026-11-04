'use client';
import { Crown } from 'lucide-react';
import clsx from 'clsx';
import Avatar from '@/components/ui/Avatar';
import Progress from '@/components/ui/Progress';
import Badge from '@/components/ui/Badge';
import { useProfiles } from '@/context/ProfileContext';
import { pct } from '@/lib/format';
import { barTone } from '@/lib/incentive';

export function RankCell({ rank }) {
  return rank === 1 ? (
    <span className="grid h-7 w-7 place-items-center rounded-lg bg-amber-500/15 text-amber-300"><Crown size={15} /></span>
  ) : (
    <span className="pl-2 font-bold text-white">{rank ?? '—'}</span>
  );
}

/** Pass `id` to make the name open the Employee 360° profile. */
export function EmployeeCell({ name, sub, avatar, id }) {
  const { openEmployee } = useProfiles();
  return (
    <div className="flex items-center gap-3">
      <Avatar name={name} src={avatar} size={34} />
      <div className="min-w-0">
        {id ? (
          <button type="button" onClick={() => openEmployee(id)} title="Open 360° profile" className="block max-w-full truncate text-left font-semibold text-white underline-offset-2 transition hover:text-brand-300 hover:underline focus-visible:underline">
            {name}
          </button>
        ) : (
          <div className="font-semibold text-white">{name}</div>
        )}
        {sub && <div className="mt-0.5 text-xs text-slate-500">{sub}</div>}
      </div>
    </div>
  );
}

/** Outlet name that opens the Outlet 360° profile. Falls back to plain text without an id. */
export function OutletLink({ id, name, className }) {
  const { openOutlet } = useProfiles();
  if (!id) return <span className={className}>{name}</span>;
  return (
    <button type="button" onClick={() => openOutlet(id)} title="Open outlet 360°" className={clsx('text-left underline-offset-2 transition hover:text-brand-300 hover:underline focus-visible:underline', className)}>
      {name}
    </button>
  );
}

export function AchievementCell({ value }) {
  return (
    <div className="min-w-[110px]">
      <span className="font-bold text-white">{pct(value)}</span>
      <Progress value={value} tone={barTone(value)} height={5} className="mt-1.5" />
    </div>
  );
}

export function CategoryBadge({ category }) {
  if (!category) return <Badge tone="gray">Unassigned</Badge>;
  return <Badge tone={category === 'Senior' ? 'amber' : 'blue'}>{category}</Badge>;
}

export function MilestoneBadge({ milestone }) {
  const tone = milestone === '200%+' ? 'amber' : milestone === '150%+' ? 'violet' : milestone === '100%+' ? 'green' : 'gray';
  return <Badge tone={tone}>{milestone}</Badge>;
}

export function ApprovalBadge({ value }) {
  return <Badge tone={value === 'Approved' ? 'green' : value === 'Rejected' ? 'red' : 'amber'}>{value}</Badge>;
}

export const TableWrap = ({ children, className }) => <div className={clsx('overflow-x-auto', className)}>{children}</div>;
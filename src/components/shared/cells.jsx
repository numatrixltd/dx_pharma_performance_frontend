import { Crown } from 'lucide-react';
import clsx from 'clsx';
import Avatar from '@/components/ui/Avatar';
import Progress from '@/components/ui/Progress';
import Badge from '@/components/ui/Badge';
import { pct } from '@/lib/format';
import { barTone } from '@/lib/incentive';

export function RankCell({ rank }) {
  return rank === 1 ? (
    <span className="grid h-7 w-7 place-items-center rounded-lg bg-amber-500/15 text-amber-300"><Crown size={15} /></span>
  ) : (
    <span className="pl-2 font-bold text-white">{rank ?? '—'}</span>
  );
}

export function EmployeeCell({ name, sub, avatar }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar name={name} src={avatar} size={34} />
      <div className="min-w-0">
        <div className="font-semibold text-white">{name}</div>
        {sub && <div className="mt-0.5 text-xs text-slate-500">{sub}</div>}
      </div>
    </div>
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

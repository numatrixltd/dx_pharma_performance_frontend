// Mirrors the backend rule: unrounded achievement, highest qualifying tier only.
export const calcAchievement = (sales, target) => (target > 0 ? (sales / target) * 100 : null);

export function calcIncentive(category, achievement, policy) {
  if (achievement === null || !category || !policy) return 0;
  const tiers = (category === 'Senior' ? policy.senior : policy.junior) || [];
  const hit = [...tiers].sort((a, b) => b.min - a.min).find((t) => achievement >= t.min);
  return hit ? hit.amount : 0;
}

export const barTone = (a) => (a >= 200 ? 'amber' : a >= 100 ? 'green' : 'blue');

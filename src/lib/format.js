export const money = (n) => '৳' + Math.round(Number(n) || 0).toLocaleString('en-US');
export const num = (n) => Math.round(Number(n) || 0).toLocaleString('en-US');
export const pct = (n, d = 1) => (n === null || n === undefined || !Number.isFinite(n) ? '—' : Number(n).toFixed(d) + '%');
export const initials = (s = '') =>
  s.split(' ').filter(Boolean).map((x) => x[0]).slice(0, 2).join('').toUpperCase();

export function longDate(iso) {
  if (!iso) return '';
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
export function shortDate(iso) {
  if (!iso) return '';
  return new Date(iso + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
export function greeting() {
  const h = Number(new Intl.DateTimeFormat('en-GB', { hour: 'numeric', hour12: false, timeZone: 'Asia/Dhaka' }).format(new Date()));
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

/** '2026-11' -> 'Nov 2026' */
export function monthLabel(m) {
  if (!m) return '';
  return new Date(m + '-01T12:00:00').toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}
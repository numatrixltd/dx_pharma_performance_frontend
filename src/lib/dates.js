const TZ = 'Asia/Dhaka';

export const todayISO = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

export function shiftDate(iso, n) {
  const d = new Date(iso + 'T12:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Default reporting date = yesterday (sales are entered the next day). */
export const defaultReportDate = () => shiftDate(todayISO(), -1);

export function weekStart(iso) {
  const day = new Date(iso + 'T12:00:00Z').getUTCDay(); // 0 = Sunday
  return shiftDate(iso, -((day + 6) % 7)); // Monday
}
export const monthStart = (iso) => iso.slice(0, 8) + '01';

export const currentMonth = () => todayISO().slice(0, 7);

/** shiftMonth('2026-11', -1) -> '2026-10' */
export function shiftMonth(m, n) {
  const [y, mm] = m.split('-').map(Number);
  return new Date(Date.UTC(y, mm - 1 + n, 1)).toISOString().slice(0, 7);
}
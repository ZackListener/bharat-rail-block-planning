// Shared date/time helpers used by the scheduling & timetable components.

export const pad = (n: number) => n.toString().padStart(2, '0');

/** Parses "HH:MM Hrs" or "HH:MM" into minutes-since-midnight. */
export function parseTimeToMinutes(timeStr: string): number {
  const clean = timeStr.replace(/Hrs/i, '').trim();
  const [h, m] = clean.split(':').map((v) => parseInt(v, 10));
  if (isNaN(h)) return 0;
  return h * 60 + (isNaN(m) ? 0 : m);
}

/** Adds `hours` (can be fractional) to a "HH:MM" start time, wrapping past midnight. */
export function addHoursToTime(startHHMM: string, hours: number): string {
  const [h, m] = startHHMM.split(':').map(Number);
  let totalMinutes = Math.round(h * 60 + m + hours * 60);
  totalMinutes = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const eh = Math.floor(totalMinutes / 60);
  const em = totalMinutes % 60;
  return `${pad(eh)}:${pad(em)}`;
}

export function toIsoDate(y: number, m: number, d: number): string {
  return `${y}-${pad(m + 1)}-${pad(d)}`;
}

export function formatDateLong(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatDateShort(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/** Next-day date (standard planning lead time) as an ISO string. */
export function getAutoScheduledDate(offsetDays: number = 1): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return toIsoDate(d.getFullYear(), d.getMonth(), d.getDate());
}

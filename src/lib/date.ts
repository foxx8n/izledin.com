/**
 * Today's date in the user's local timezone as YYYY-MM-DD.
 * `new Date().toISOString().split('T')[0]` is UTC — for UTC+3 users logging
 * between 00:00 and 03:00 local it returns YESTERDAY, misdating watch logs.
 */
export function localTodayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Parses a date string as LOCAL calendar parts (no UTC shift), unlike
 * `new Date('YYYY-MM-DD')` which parses as UTC midnight and shifts the
 * calendar day in negative-offset timezones.
 */
export function parseLocalDate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

/**
 * Local timezone date utility functions.
 * Avoids the UTC-shift bug where new Date(y, m, d).toISOString() rolls back
 * to the previous day in timezones east of UTC (e.g. Asia/Phnom_Penh UTC+7).
 */

export function formatLocalDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getTodayDateString(): string {
  return formatLocalDate(new Date());
}

export function getStartOfMonthDateString(date: Date = new Date()): string {
  return formatLocalDate(new Date(date.getFullYear(), date.getMonth(), 1));
}

export function getEndOfMonthDateString(date: Date = new Date()): string {
  return formatLocalDate(new Date(date.getFullYear(), date.getMonth() + 1, 0));
}

export function getCurrentYearMonthString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

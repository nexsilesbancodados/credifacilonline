/**
 * Formats a Date to "YYYY-MM-DD" using local timezone (avoids UTC shift from toISOString).
 */
export function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Parses a "YYYY-MM-DD" string into a local Date (no UTC offset).
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Safe month addition that preserves the original day-of-month.
 * E.g. "2026-01-31" + 1 month = "2026-02-28", + 2 months = "2026-03-31" (not Mar 28).
 * Works entirely on string dates to avoid timezone and overflow issues.
 */
export function addMonthsToDateStr(dateStr: string, months: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const targetMonth = m - 1 + months;
  const newYear = y + Math.floor(targetMonth / 12);
  const newMonth = ((targetMonth % 12) + 12) % 12; // handle negatives
  const lastDay = new Date(newYear, newMonth + 1, 0).getDate();
  const clampedDay = Math.min(d, lastDay);
  return `${newYear}-${String(newMonth + 1).padStart(2, "0")}-${String(clampedDay).padStart(2, "0")}`;
}

/**
 * Safe day addition on string dates.
 */
export function addDaysToDateStr(dateStr: string, days: number): string {
  const date = parseLocalDate(dateStr);
  date.setDate(date.getDate() + days);
  return formatLocalDate(date);
}

/**
 * Advances a "YYYY-MM-DD" string by one period based on frequency.
 * Returns a new "YYYY-MM-DD" string. Uses string-based math to avoid timezone/overflow bugs.
 */
export function advanceDateStrByFrequency(dateStr: string, frequency: string): string {
  switch (frequency) {
    case "diario":
      return addDaysToDateStr(dateStr, 1);
    case "semanal":
      return addDaysToDateStr(dateStr, 7);
    case "quinzenal":
      return addDaysToDateStr(dateStr, 14);
    case "programada":
    case "mensal":
    default:
      return addMonthsToDateStr(dateStr, 1);
  }
}

/**
 * @deprecated Use advanceDateStrByFrequency with string dates instead.
 * Kept for backward compatibility.
 */
export function advanceDateByFrequency(date: Date, frequency: string): Date {
  const dateStr = formatLocalDate(date);
  const result = advanceDateStrByFrequency(dateStr, frequency);
  return parseLocalDate(result);
}

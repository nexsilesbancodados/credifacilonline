import { addMonths, addWeeks, addDays } from "date-fns";

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
 * Advances a date by one period based on frequency.
 * Note: "programada" frequency uses specific days of the month and is handled separately.
 */
export function advanceDateByFrequency(date: Date, frequency: string): Date {
  switch (frequency) {
    case "diario":
      return addDays(date, 1);
    case "semanal":
      return addWeeks(date, 1);
    case "quinzenal":
      return addWeeks(date, 2);
    case "programada":
      // Programada uses specific scheduled days, fallback to monthly
      return addMonths(date, 1);
    case "mensal":
    default:
      return addMonths(date, 1);
  }
}

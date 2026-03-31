import { addMonths, addWeeks, addDays } from "date-fns";

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

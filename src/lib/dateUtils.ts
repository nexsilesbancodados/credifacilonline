import { addMonths, addWeeks, addDays } from "date-fns";

/**
 * Advances a date by one period based on frequency.
 */
export function advanceDateByFrequency(date: Date, frequency: string): Date {
  switch (frequency) {
    case "diario":
      return addDays(date, 1);
    case "semanal":
      return addWeeks(date, 1);
    case "quinzenal":
      return addWeeks(date, 2);
    case "mensal":
    default:
      return addMonths(date, 1);
  }
}

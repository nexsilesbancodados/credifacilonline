import { differenceInDays, parseISO } from "date-fns";

interface FineCalculation {
  baseFine: number;       // Fixed percentage fine (e.g., 2%)
  dailyInterest: number;  // Daily interest accumulated
  totalFine: number;      // Total fine amount
  daysOverdue: number;    // Days overdue
}

export interface FineConfig {
  baseFinePercent: number;    // e.g., 2 for 2%
  dailyInterestPercent: number; // e.g., 0.033 for 1% per month (1/30)
  maxFinePercent?: number;    // Optional cap on total fine
}

export const DEFAULT_FINE_CONFIG: FineConfig = {
  baseFinePercent: 2,
  dailyInterestPercent: 0.033, // ~1% per month
  maxFinePercent: 20, // Max 20% of the amount
};

/**
 * Calculate fine for an overdue installment
 */
export function calculateFine(
  amountDue: number,
  dueDate: string | Date,
  config: FineConfig = DEFAULT_FINE_CONFIG
): FineCalculation {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dueDateObj = typeof dueDate === "string" ? parseISO(dueDate) : dueDate;
  dueDateObj.setHours(0, 0, 0, 0);
  
  const daysOverdue = differenceInDays(today, dueDateObj);
  
  // No fine if not overdue
  if (daysOverdue <= 0) {
    return {
      baseFine: 0,
      dailyInterest: 0,
      totalFine: 0,
      daysOverdue: 0,
    };
  }
  
  // Calculate base fine (flat percentage)
  const baseFine = amountDue * (config.baseFinePercent / 100);
  
  // Calculate daily interest (compound or simple)
  const dailyInterest = amountDue * (config.dailyInterestPercent / 100) * daysOverdue;
  
  // Total fine
  let totalFine = baseFine + dailyInterest;
  
  // Apply cap if configured
  if (config.maxFinePercent) {
    const maxFine = amountDue * (config.maxFinePercent / 100);
    totalFine = Math.min(totalFine, maxFine);
  }
  
  return {
    baseFine: Math.round(baseFine * 100) / 100,
    dailyInterest: Math.round(dailyInterest * 100) / 100,
    totalFine: Math.round(totalFine * 100) / 100,
    daysOverdue,
  };
}

/**
 * Get the total amount due including fine
 */
export function getTotalWithFine(
  amountDue: number,
  dueDate: string | Date,
  config?: FineConfig
): number {
  const { totalFine } = calculateFine(amountDue, dueDate, config);
  return amountDue + totalFine;
}

/**
 * Format fine breakdown for display
 */
export function formatFineBreakdown(
  amountDue: number,
  dueDate: string | Date,
  config?: FineConfig
): string {
  const calc = calculateFine(amountDue, dueDate, config);
  
  if (calc.daysOverdue <= 0) {
    return "Em dia";
  }
  
  const parts = [];
  
  if (calc.baseFine > 0) {
    parts.push(`Multa: R$ ${calc.baseFine.toFixed(2)}`);
  }
  
  if (calc.dailyInterest > 0) {
    parts.push(`Juros (${calc.daysOverdue} dias): R$ ${calc.dailyInterest.toFixed(2)}`);
  }
  
  return parts.join(" + ");
}

/**
 * Check if an installment is overdue
 */
export function isOverdue(dueDate: string | Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dueDateObj = typeof dueDate === "string" ? parseISO(dueDate) : dueDate;
  dueDateObj.setHours(0, 0, 0, 0);
  
  return today > dueDateObj;
}

/**
 * Get days until due or days overdue
 */
export function getDaysStatus(dueDate: string | Date): { days: number; isOverdue: boolean } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dueDateObj = typeof dueDate === "string" ? parseISO(dueDate) : dueDate;
  dueDateObj.setHours(0, 0, 0, 0);
  
  const diff = differenceInDays(dueDateObj, today);
  
  return {
    days: Math.abs(diff),
    isOverdue: diff < 0,
  };
}

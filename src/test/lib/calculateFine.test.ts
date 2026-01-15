import { describe, it, expect } from "vitest";
import { calculateFine, FineConfig, getTotalWithFine, isOverdue } from "@/lib/calculateFine";
import { format, subDays } from "date-fns";

describe("calculateFine", () => {
  const defaultConfig: FineConfig = {
    baseFinePercent: 2,
    dailyInterestPercent: 0.033,
  };

  it("should return 0 fine for a payment made on due date", () => {
    const today = format(new Date(), "yyyy-MM-dd");
    const result = calculateFine(1000, today, defaultConfig);
    expect(result.daysOverdue).toBe(0);
    expect(result.baseFine).toBe(0);
    expect(result.dailyInterest).toBe(0);
    expect(result.totalFine).toBe(0);
  });

  it("should return 0 fine for a future due date", () => {
    const futureDate = format(new Date(Date.now() + 86400000), "yyyy-MM-dd");
    const result = calculateFine(1000, futureDate, defaultConfig);
    expect(result.daysOverdue).toBe(0);
    expect(result.baseFine).toBe(0);
    expect(result.totalFine).toBe(0);
  });

  it("should calculate fine correctly for 1 day overdue", () => {
    const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
    const result = calculateFine(1000, yesterday, defaultConfig);
    
    expect(result.daysOverdue).toBe(1);
    // Base fine: 2% of 1000 = 20
    expect(result.baseFine).toBe(20);
    // Daily interest: 0.033% per day * 1 day * 1000 = 0.33
    expect(result.dailyInterest).toBeCloseTo(0.33, 2);
    // Total fine should be base + interest
    expect(result.totalFine).toBeCloseTo(20.33, 2);
  });

  it("should calculate fine correctly for 10 days overdue", () => {
    const tenDaysAgo = format(subDays(new Date(), 10), "yyyy-MM-dd");
    const result = calculateFine(1000, tenDaysAgo, defaultConfig);
    
    expect(result.daysOverdue).toBe(10);
    expect(result.baseFine).toBe(20); // 2% fixed
    // Interest: 0.033% * 10 days * 1000 = 3.30
    expect(result.dailyInterest).toBeCloseTo(3.3, 2);
    expect(result.totalFine).toBeCloseTo(23.3, 2);
  });

  it("should use custom config values", () => {
    const fiveDaysAgo = format(subDays(new Date(), 5), "yyyy-MM-dd");
    const customConfig: FineConfig = {
      baseFinePercent: 5,
      dailyInterestPercent: 0.1,
    };
    const result = calculateFine(2000, fiveDaysAgo, customConfig);
    
    expect(result.daysOverdue).toBe(5);
    expect(result.baseFine).toBe(100); // 5% of 2000
    expect(result.dailyInterest).toBeCloseTo(10, 2); // 0.1% * 5 days * 2000
  });

  it("should handle edge case of 0 principal", () => {
    const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
    const result = calculateFine(0, yesterday, defaultConfig);
    
    expect(result.baseFine).toBe(0);
    expect(result.dailyInterest).toBe(0);
    expect(result.totalFine).toBe(0);
  });

  it("should respect maxFinePercent cap", () => {
    const longOverdue = format(subDays(new Date(), 365), "yyyy-MM-dd");
    const cappedConfig: FineConfig = {
      baseFinePercent: 2,
      dailyInterestPercent: 0.1,
      maxFinePercent: 20,
    };
    const result = calculateFine(1000, longOverdue, cappedConfig);
    
    // Without cap: 2% base + 0.1% * 365 days = ~38.5%
    // With 20% cap: max 200
    expect(result.totalFine).toBeLessThanOrEqual(200);
  });
});

describe("getTotalWithFine", () => {
  it("should return amount + fine for overdue payment", () => {
    const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");
    const total = getTotalWithFine(1000, yesterday);
    expect(total).toBeGreaterThan(1000);
  });

  it("should return just the amount for non-overdue payment", () => {
    const today = format(new Date(), "yyyy-MM-dd");
    const total = getTotalWithFine(1000, today);
    expect(total).toBe(1000);
  });
});

describe("isOverdue", () => {
  it("should return false for today", () => {
    const today = new Date();
    expect(isOverdue(today)).toBe(false);
  });

  it("should return false for future dates", () => {
    const tomorrow = new Date(Date.now() + 86400000);
    expect(isOverdue(tomorrow)).toBe(false);
  });

  it("should return true for past dates", () => {
    const yesterday = subDays(new Date(), 1);
    expect(isOverdue(yesterday)).toBe(true);
  });
});

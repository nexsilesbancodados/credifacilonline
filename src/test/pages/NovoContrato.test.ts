import { describe, it, expect } from "vitest";

// Test loan calculation logic
describe("Loan Calculations", () => {
  // Simple interest calculation: Total = Capital × (1 + Rate)
  const calculateInstallment = (capital: number, interestRate: number, installments: number) => {
    const rate = interestRate / 100;
    const totalAmount = capital * (1 + rate);
    return totalAmount / installments;
  };

  const calculateRate = (capital: number, installmentValue: number, installments: number) => {
    if (installmentValue <= 0 || capital <= 0) return 0;
    const totalAmount = installmentValue * installments;
    const profit = totalAmount - capital;
    const rate = (profit / capital) * 100;
    return rate;
  };

  const calculateTotalAmount = (installmentValue: number, installments: number) => {
    return installmentValue * installments;
  };

  const calculateProfit = (capital: number, totalAmount: number) => {
    return totalAmount - capital;
  };

  describe("calculateInstallment", () => {
    it("should calculate correct installment for 10% rate", () => {
      // R$ 1000 at 10% = R$ 1100 total, in 10 installments = R$ 110 each
      const result = calculateInstallment(1000, 10, 10);
      expect(result).toBe(110);
    });

    it("should calculate correct installment for 0% rate", () => {
      const result = calculateInstallment(1000, 0, 10);
      expect(result).toBe(100);
    });

    it("should handle different capital values", () => {
      const result = calculateInstallment(5000, 20, 5);
      // 5000 * 1.20 = 6000 / 5 = 1200
      expect(result).toBe(1200);
    });

    it("should handle single installment", () => {
      const result = calculateInstallment(1000, 10, 1);
      expect(result).toBe(1100);
    });
  });

  describe("calculateRate", () => {
    it("should calculate correct rate from installments", () => {
      // 10 parcelas de R$ 110 = R$ 1100 total, capital R$ 1000 = 10% rate
      const result = calculateRate(1000, 110, 10);
      expect(result).toBe(10);
    });

    it("should return 0 for invalid inputs", () => {
      expect(calculateRate(0, 100, 10)).toBe(0);
      expect(calculateRate(1000, 0, 10)).toBe(0);
      expect(calculateRate(1000, -100, 10)).toBe(0);
    });

    it("should handle high interest rates", () => {
      // R$ 1000 capital, R$ 200 * 10 = R$ 2000 total, profit R$ 1000 = 100% rate
      const result = calculateRate(1000, 200, 10);
      expect(result).toBe(100);
    });
  });

  describe("calculateTotalAmount", () => {
    it("should calculate total correctly", () => {
      const result = calculateTotalAmount(110, 10);
      expect(result).toBe(1100);
    });
  });

  describe("calculateProfit", () => {
    it("should calculate profit correctly", () => {
      const result = calculateProfit(1000, 1100);
      expect(result).toBe(100);
    });

    it("should handle 0 profit", () => {
      const result = calculateProfit(1000, 1000);
      expect(result).toBe(0);
    });
  });
});

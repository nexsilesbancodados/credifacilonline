import { describe, it, expect } from "vitest";

// Form validation utilities
describe("Form Validation", () => {
  describe("Email Validation", () => {
    const isValidEmail = (email: string): boolean => {
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return regex.test(email);
    };

    it("should validate correct emails", () => {
      expect(isValidEmail("test@example.com")).toBe(true);
      expect(isValidEmail("user.name@domain.org")).toBe(true);
      expect(isValidEmail("user+tag@example.co.uk")).toBe(true);
    });

    it("should reject invalid emails", () => {
      expect(isValidEmail("invalid")).toBe(false);
      expect(isValidEmail("missing@domain")).toBe(false);
      expect(isValidEmail("@nodomain.com")).toBe(false);
      expect(isValidEmail("spaces in@email.com")).toBe(false);
    });
  });

  describe("Phone/WhatsApp Validation", () => {
    const isValidPhone = (phone: string): boolean => {
      const cleaned = phone.replace(/\D/g, "");
      return cleaned.length >= 10 && cleaned.length <= 11;
    };

    const formatPhone = (phone: string): string => {
      const cleaned = phone.replace(/\D/g, "");
      if (cleaned.length === 11) {
        return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
      }
      if (cleaned.length === 10) {
        return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
      }
      return phone;
    };

    it("should validate correct phone numbers", () => {
      expect(isValidPhone("(11) 98765-4321")).toBe(true);
      expect(isValidPhone("11987654321")).toBe(true);
      expect(isValidPhone("1198765432")).toBe(true); // 10 digits
    });

    it("should reject invalid phone numbers", () => {
      expect(isValidPhone("123456")).toBe(false);
      expect(isValidPhone("")).toBe(false);
    });

    it("should format phone correctly", () => {
      expect(formatPhone("11987654321")).toBe("(11) 98765-4321");
      expect(formatPhone("1134567890")).toBe("(11) 3456-7890");
    });
  });

  describe("Currency Validation", () => {
    const isValidCurrency = (value: number): boolean => {
      return !isNaN(value) && value >= 0 && isFinite(value);
    };

    const formatCurrency = (value: number): string => {
      return value.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
    };

    const parseCurrency = (value: string): number => {
      // Remove currency symbol and whitespace, handle Brazilian format
      const cleaned = value.replace(/[R$\s\u00a0]/g, "").replace(/\./g, "").replace(",", ".");
      return parseFloat(cleaned) || 0;
    };

    it("should validate positive values", () => {
      expect(isValidCurrency(1000)).toBe(true);
      expect(isValidCurrency(0)).toBe(true);
      expect(isValidCurrency(0.01)).toBe(true);
    });

    it("should reject invalid values", () => {
      expect(isValidCurrency(-100)).toBe(false);
      expect(isValidCurrency(NaN)).toBe(false);
      expect(isValidCurrency(Infinity)).toBe(false);
    });

    it("should format currency correctly", () => {
      const formatted = formatCurrency(1234.56);
      // toLocaleString may use non-breaking space (\u00a0) depending on environment
      expect(formatted.replace(/\u00a0/g, " ")).toBe("R$ 1.234,56");
      expect(formatCurrency(0).replace(/\u00a0/g, " ")).toBe("R$ 0,00");
    });

    it("should parse currency strings", () => {
      expect(parseCurrency("R$ 1.234,56")).toBe(1234.56);
      expect(parseCurrency("1000")).toBe(1000);
    });
  });

  describe("Required Field Validation", () => {
    const isRequired = (value: string | undefined | null): boolean => {
      return value !== undefined && value !== null && value.trim().length > 0;
    };

    it("should pass for non-empty values", () => {
      expect(isRequired("test")).toBe(true);
      expect(isRequired("  value  ")).toBe(true);
    });

    it("should fail for empty values", () => {
      expect(isRequired("")).toBe(false);
      expect(isRequired("   ")).toBe(false);
      expect(isRequired(null)).toBe(false);
      expect(isRequired(undefined)).toBe(false);
    });
  });

  describe("Interest Rate Validation", () => {
    const isValidInterestRate = (rate: number): boolean => {
      return !isNaN(rate) && rate >= 0 && rate <= 100;
    };

    it("should accept valid rates", () => {
      expect(isValidInterestRate(0)).toBe(true);
      expect(isValidInterestRate(10)).toBe(true);
      expect(isValidInterestRate(50)).toBe(true);
      expect(isValidInterestRate(100)).toBe(true);
    });

    it("should reject invalid rates", () => {
      expect(isValidInterestRate(-1)).toBe(false);
      expect(isValidInterestRate(101)).toBe(false);
      expect(isValidInterestRate(NaN)).toBe(false);
    });
  });

  describe("Installment Count Validation", () => {
    const isValidInstallmentCount = (count: number): boolean => {
      return Number.isInteger(count) && count >= 1 && count <= 120;
    };

    it("should accept valid counts", () => {
      expect(isValidInstallmentCount(1)).toBe(true);
      expect(isValidInstallmentCount(12)).toBe(true);
      expect(isValidInstallmentCount(120)).toBe(true);
    });

    it("should reject invalid counts", () => {
      expect(isValidInstallmentCount(0)).toBe(false);
      expect(isValidInstallmentCount(-1)).toBe(false);
      expect(isValidInstallmentCount(1.5)).toBe(false);
      expect(isValidInstallmentCount(121)).toBe(false);
    });
  });
});

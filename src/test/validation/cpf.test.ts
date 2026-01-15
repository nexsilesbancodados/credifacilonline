import { describe, it, expect } from "vitest";

// CPF validation functions
function cleanCPF(cpf: string): string {
  return cpf.replace(/\D/g, "");
}

function formatCPF(cpf: string): string {
  const cleaned = cleanCPF(cpf);
  if (cleaned.length !== 11) return cpf;
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function isValidCPF(cpf: string): boolean {
  const cleaned = cleanCPF(cpf);
  
  if (cleaned.length !== 11) return false;
  
  // Check for known invalid patterns
  if (/^(\d)\1{10}$/.test(cleaned)) return false;
  
  // Validate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned[i]) * (10 - i);
  }
  let checkDigit = (sum * 10) % 11;
  if (checkDigit === 10) checkDigit = 0;
  if (checkDigit !== parseInt(cleaned[9])) return false;
  
  // Validate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned[i]) * (11 - i);
  }
  checkDigit = (sum * 10) % 11;
  if (checkDigit === 10) checkDigit = 0;
  if (checkDigit !== parseInt(cleaned[10])) return false;
  
  return true;
}

describe("CPF Utilities", () => {
  describe("cleanCPF", () => {
    it("should remove dots and dashes", () => {
      expect(cleanCPF("123.456.789-00")).toBe("12345678900");
    });

    it("should handle already clean CPF", () => {
      expect(cleanCPF("12345678900")).toBe("12345678900");
    });

    it("should handle partial CPF", () => {
      expect(cleanCPF("123.456")).toBe("123456");
    });
  });

  describe("formatCPF", () => {
    it("should format 11 digit string correctly", () => {
      expect(formatCPF("12345678909")).toBe("123.456.789-09");
    });

    it("should return original for invalid length", () => {
      expect(formatCPF("12345")).toBe("12345");
    });

    it("should handle already formatted CPF", () => {
      const formatted = formatCPF("123.456.789-09");
      expect(formatted).toBe("123.456.789-09");
    });
  });

  describe("isValidCPF", () => {
    it("should validate correct CPF", () => {
      expect(isValidCPF("529.982.247-25")).toBe(true);
      expect(isValidCPF("52998224725")).toBe(true);
    });

    it("should reject CPF with all same digits", () => {
      expect(isValidCPF("111.111.111-11")).toBe(false);
      expect(isValidCPF("000.000.000-00")).toBe(false);
    });

    it("should reject CPF with wrong check digits", () => {
      expect(isValidCPF("529.982.247-26")).toBe(false);
      expect(isValidCPF("123.456.789-00")).toBe(false);
    });

    it("should reject CPF with wrong length", () => {
      expect(isValidCPF("123.456.789")).toBe(false);
      expect(isValidCPF("123")).toBe(false);
    });
  });
});

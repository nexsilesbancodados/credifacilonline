import { describe, it, expect } from "vitest";
import { addDays, addWeeks, addMonths, getDay } from "date-fns";

// Test due date calculation logic
describe("Installment Due Date Calculations", () => {
  function isValidCollectionDay(date: Date, dailyType: string): boolean {
    const dayOfWeek = getDay(date);
    
    switch (dailyType) {
      case "seg-seg": // Monday to Monday (all days)
        return true;
      case "seg-sex": // Monday to Friday (weekdays only)
        return dayOfWeek >= 1 && dayOfWeek <= 5;
      case "seg-sab": // Monday to Saturday (no Sunday)
        return dayOfWeek >= 1 && dayOfWeek <= 6;
      default:
        return true;
    }
  }

  function getNextDueDate(currentDate: Date, frequency: string, dailyType?: string): Date {
    let nextDate: Date;
    
    switch (frequency) {
      case "diario":
        nextDate = addDays(currentDate, 1);
        if (dailyType && dailyType !== "seg-seg") {
          while (!isValidCollectionDay(nextDate, dailyType)) {
            nextDate = addDays(nextDate, 1);
          }
        }
        return nextDate;
      case "semanal":
        return addWeeks(currentDate, 1);
      case "mensal":
      default:
        return addMonths(currentDate, 1);
    }
  }

  describe("isValidCollectionDay", () => {
    it("should return true for all days with seg-seg", () => {
      for (let i = 0; i < 7; i++) {
        const date = new Date(2026, 0, 12 + i); // Start from a Sunday
        expect(isValidCollectionDay(date, "seg-seg")).toBe(true);
      }
    });

    it("should only return true for weekdays with seg-sex", () => {
      const sunday = new Date(2026, 0, 12); // Sunday
      const saturday = new Date(2026, 0, 17); // Saturday
      const monday = new Date(2026, 0, 13); // Monday
      const friday = new Date(2026, 0, 16); // Friday

      expect(isValidCollectionDay(sunday, "seg-sex")).toBe(false);
      expect(isValidCollectionDay(saturday, "seg-sex")).toBe(false);
      expect(isValidCollectionDay(monday, "seg-sex")).toBe(true);
      expect(isValidCollectionDay(friday, "seg-sex")).toBe(true);
    });

    it("should exclude only Sunday with seg-sab", () => {
      const sunday = new Date(2026, 0, 12); // Sunday
      const saturday = new Date(2026, 0, 17); // Saturday
      const monday = new Date(2026, 0, 13); // Monday

      expect(isValidCollectionDay(sunday, "seg-sab")).toBe(false);
      expect(isValidCollectionDay(saturday, "seg-sab")).toBe(true);
      expect(isValidCollectionDay(monday, "seg-sab")).toBe(true);
    });
  });

  describe("getNextDueDate", () => {
    it("should add 1 day for daily frequency", () => {
      const date = new Date(2026, 0, 15);
      const next = getNextDueDate(date, "diario", "seg-seg");
      expect(next.getDate()).toBe(16);
    });

    it("should skip weekends for seg-sex daily frequency", () => {
      const friday = new Date(2026, 0, 16); // Friday
      const next = getNextDueDate(friday, "diario", "seg-sex");
      // Should skip Saturday and Sunday, land on Monday
      expect(next.getDay()).toBe(1); // Monday
    });

    it("should add 1 week for weekly frequency", () => {
      const date = new Date(2026, 0, 15);
      const next = getNextDueDate(date, "semanal");
      expect(next.getDate()).toBe(22);
    });

    it("should add 1 month for monthly frequency", () => {
      const date = new Date(2026, 0, 15);
      const next = getNextDueDate(date, "mensal");
      expect(next.getMonth()).toBe(1); // February
      expect(next.getDate()).toBe(15);
    });
  });
});

describe("Installment Status Logic", () => {
  const getInstallmentStatus = (
    isPaid: boolean,
    dueDate: Date,
    today: Date = new Date()
  ): "Pago" | "Pendente" | "Atrasado" => {
    if (isPaid) return "Pago";
    const dueDateOnly = new Date(dueDate.setHours(0, 0, 0, 0));
    const todayOnly = new Date(today.setHours(0, 0, 0, 0));
    return dueDateOnly < todayOnly ? "Atrasado" : "Pendente";
  };

  it("should return Pago for paid installments", () => {
    const status = getInstallmentStatus(true, new Date(2020, 0, 1));
    expect(status).toBe("Pago");
  });

  it("should return Pendente for future due dates", () => {
    const futureDate = addDays(new Date(), 5);
    const status = getInstallmentStatus(false, futureDate);
    expect(status).toBe("Pendente");
  });

  it("should return Atrasado for past unpaid due dates", () => {
    const pastDate = addDays(new Date(), -5);
    const status = getInstallmentStatus(false, pastDate);
    expect(status).toBe("Atrasado");
  });

  it("should return Pendente for today's due date", () => {
    const today = new Date();
    const status = getInstallmentStatus(false, today);
    expect(status).toBe("Pendente");
  });
});

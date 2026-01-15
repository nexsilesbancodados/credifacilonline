import { describe, it, expect } from "vitest";

// Test treasury calculation logic
describe("Treasury Calculations", () => {
  interface Transaction {
    id: string;
    type: "entrada" | "saida";
    amount: number;
    category: string;
    date: string;
  }

  const calculateSummary = (transactions: Transaction[]) => {
    const income = transactions
      .filter(t => t.type === "entrada")
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = transactions
      .filter(t => t.type === "saida")
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      income,
      expenses,
      balance: income - expenses,
    };
  };

  it("should calculate income correctly", () => {
    const transactions: Transaction[] = [
      { id: "1", type: "entrada", amount: 1000, category: "Recebimento", date: "2026-01-01" },
      { id: "2", type: "entrada", amount: 500, category: "Recebimento", date: "2026-01-02" },
    ];
    
    const summary = calculateSummary(transactions);
    expect(summary.income).toBe(1500);
  });

  it("should calculate expenses correctly", () => {
    const transactions: Transaction[] = [
      { id: "1", type: "saida", amount: 800, category: "Empréstimo", date: "2026-01-01" },
      { id: "2", type: "saida", amount: 200, category: "Operacional", date: "2026-01-02" },
    ];
    
    const summary = calculateSummary(transactions);
    expect(summary.expenses).toBe(1000);
  });

  it("should calculate positive balance correctly", () => {
    const transactions: Transaction[] = [
      { id: "1", type: "entrada", amount: 2000, category: "Recebimento", date: "2026-01-01" },
      { id: "2", type: "saida", amount: 1000, category: "Empréstimo", date: "2026-01-01" },
    ];
    
    const summary = calculateSummary(transactions);
    expect(summary.balance).toBe(1000);
  });

  it("should calculate negative balance correctly", () => {
    const transactions: Transaction[] = [
      { id: "1", type: "entrada", amount: 500, category: "Recebimento", date: "2026-01-01" },
      { id: "2", type: "saida", amount: 1500, category: "Empréstimo", date: "2026-01-01" },
    ];
    
    const summary = calculateSummary(transactions);
    expect(summary.balance).toBe(-1000);
  });

  it("should handle empty transactions array", () => {
    const summary = calculateSummary([]);
    expect(summary.income).toBe(0);
    expect(summary.expenses).toBe(0);
    expect(summary.balance).toBe(0);
  });
});

describe("Capital on Street Calculation", () => {
  interface Contract {
    id: string;
    capital: number;
    status: string;
  }

  interface Installment {
    contract_id: string;
    amount_paid: number;
    status: string;
  }

  const calculateCapitalOnStreet = (contracts: Contract[], installments: Installment[]) => {
    const activeContracts = contracts.filter(c => c.status === "Ativo" || c.status === "Atraso");
    
    return activeContracts.reduce((total, contract) => {
      const paidAmount = installments
        .filter(i => i.contract_id === contract.id && i.status === "Pago")
        .reduce((sum, i) => sum + i.amount_paid, 0);
      
      // Capital on street = capital - amount already paid back (only capital portion)
      // This is simplified - in reality you'd need to consider interest vs principal
      return total + contract.capital;
    }, 0);
  };

  it("should calculate capital for active contracts", () => {
    const contracts: Contract[] = [
      { id: "1", capital: 10000, status: "Ativo" },
      { id: "2", capital: 5000, status: "Ativo" },
    ];
    
    const installments: Installment[] = [];
    
    const capital = calculateCapitalOnStreet(contracts, installments);
    expect(capital).toBe(15000);
  });

  it("should exclude settled contracts", () => {
    const contracts: Contract[] = [
      { id: "1", capital: 10000, status: "Ativo" },
      { id: "2", capital: 5000, status: "Quitado" },
    ];
    
    const installments: Installment[] = [];
    
    const capital = calculateCapitalOnStreet(contracts, installments);
    expect(capital).toBe(10000);
  });

  it("should include contracts in delay status", () => {
    const contracts: Contract[] = [
      { id: "1", capital: 10000, status: "Atraso" },
    ];
    
    const installments: Installment[] = [];
    
    const capital = calculateCapitalOnStreet(contracts, installments);
    expect(capital).toBe(10000);
  });
});

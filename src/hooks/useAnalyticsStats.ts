import { useMemo, useState } from "react";
import { useContracts, useInstallments } from "@/hooks/useContracts";
import { useAllClients } from "@/hooks/useClients";
import { useTreasury } from "@/hooks/useTreasury";
import { parseISO, differenceInDays, startOfMonth, subMonths, subDays, startOfQuarter, startOfYear } from "date-fns";

export type PeriodFilter = "7d" | "month" | "quarter" | "year" | "all" | "custom";

export interface CustomDateRange {
  from: Date;
  to: Date;
}

export interface AnalyticsStats {
  // Contratos
  totalContracts: number;
  activeContracts: number;
  inactiveContracts: number;
  completedContracts: number;
  overdueContracts: number;
  renegotiatedContracts: number;
  
  // Clientes
  totalClients: number;
  activeClients: number;
  overdueClients: number;
  settledClients: number;
  newClientsThisMonth: number;
  
  // Financeiro
  totalCapital: number;
  capitalOnStreet: number;
  totalProfit: number;
  realizedProfit: number;
  pendingProfit: number;
  averageTicket: number;
  averageRate: number;
  roi: number;
  
  // Parcelas
  totalInstallments: number;
  paidInstallments: number;
  pendingInstallments: number;
  overdueInstallments: number;
  
  // Inadimplência
  defaultRate: number;
  defaultValue: number;
  avgDaysOverdue: number;
  highRiskClients: number;
  
  // Crescimento
  contractsThisMonth: number;
  contractsLastMonth: number;
  growthRate: number;
  
  isLoading: boolean;
}

function getPeriodStartDate(period: PeriodFilter): Date | null {
  const today = new Date();
  
  switch (period) {
    case "7d":
      return subDays(today, 7);
    case "month":
      return startOfMonth(today);
    case "quarter":
      return startOfQuarter(today);
    case "year":
      return startOfYear(today);
    case "all":
    default:
      return null;
  }
}

function isInPeriod(dateString: string, periodStart: Date | null): boolean {
  if (!periodStart) return true;
  const date = parseISO(dateString);
  return date >= periodStart;
}

export function useAnalyticsStats(period: PeriodFilter = "all", customRange?: CustomDateRange): AnalyticsStats {
  const { contracts, isLoading: isLoadingContracts } = useContracts();
  const { data: clients = [], isLoading: isLoadingClients } = useAllClients();
  const { installments, isLoading: isLoadingInstallments } = useInstallments();
  const { transactions, isLoading: isLoadingTreasury } = useTreasury();

  const isLoading = isLoadingContracts || isLoadingClients || isLoadingInstallments || isLoadingTreasury;

  return useMemo(() => {
    if (isLoading) {
      return {
        totalContracts: 0,
        activeContracts: 0,
        inactiveContracts: 0,
        completedContracts: 0,
        overdueContracts: 0,
        renegotiatedContracts: 0,
        totalClients: 0,
        activeClients: 0,
        overdueClients: 0,
        settledClients: 0,
        newClientsThisMonth: 0,
        totalCapital: 0,
        capitalOnStreet: 0,
        totalProfit: 0,
        realizedProfit: 0,
        pendingProfit: 0,
        averageTicket: 0,
        averageRate: 0,
        roi: 0,
        totalInstallments: 0,
        paidInstallments: 0,
        pendingInstallments: 0,
        overdueInstallments: 0,
        defaultRate: 0,
        defaultValue: 0,
        avgDaysOverdue: 0,
        highRiskClients: 0,
        contractsThisMonth: 0,
        contractsLastMonth: 0,
        growthRate: 0,
        isLoading: true,
      };
    }

    const periodStart = getPeriodStartDate(period);

    // Filtrar contratos pelo período
    const filteredContracts = contracts?.filter(c => isInPeriod(c.created_at, periodStart)) || [];
    const filteredClients = clients?.filter(c => isInPeriod(c.created_at, periodStart)) || [];
    const filteredInstallments = installments?.filter(i => isInPeriod(i.due_date, periodStart)) || [];

    // Contratos
    const totalContracts = filteredContracts.length;
    const activeContracts = filteredContracts.filter(c => c.status === "Ativo").length;
    const inactiveContracts = filteredContracts.filter(c => !["Ativo", "Atraso"].includes(c.status) && c.status !== "Quitado").length;
    const completedContracts = filteredContracts.filter(c => c.status === "Quitado").length;
    const overdueContracts = filteredContracts.filter(c => c.status === "Atraso").length;
    const renegotiatedContracts = filteredContracts.filter(c => c.renegotiated_from_id).length;

    // Clientes
    const totalClients = filteredClients.length;
    const activeClients = filteredClients.filter(c => c.status === "Ativo").length;
    const overdueClients = filteredClients.filter(c => c.status === "Atraso").length;
    const settledClients = filteredClients.filter(c => c.status === "Quitado").length;
    
    const thisMonthStart = startOfMonth(new Date());
    const newClientsThisMonth = clients?.filter(c => {
      const created = parseISO(c.created_at);
      return created >= thisMonthStart;
    }).length || 0;

    // Financeiro - CORRIGIDO
    // Capital total emprestado (soma do capital de todos os contratos)
    const totalCapital = filteredContracts.reduce((sum, c) => sum + Number(c.capital), 0);
    
    // Lucro total esperado (soma do total_profit de todos os contratos)
    const totalProfit = filteredContracts.reduce((sum, c) => sum + Number(c.total_profit), 0);
    
    // Contratos ativos e em atraso (ainda não quitados)
    const activeContractsData = filteredContracts.filter(c => ["Ativo", "Atraso"].includes(c.status));
    
    // Capital na rua = capital dos contratos ativos (ainda não recebido)
    const capitalOnStreet = activeContractsData.reduce((sum, c) => sum + Number(c.capital), 0);
    
    // Lucro pendente (a receber) = total_profit dos contratos ativos
    const pendingProfit = activeContractsData.reduce((sum, c) => sum + Number(c.total_profit), 0);
    
    // Contratos quitados
    const completedContractsData = filteredContracts.filter(c => c.status === "Quitado");
    
    // Lucro realizado (já recebido) = total_profit dos contratos quitados
    const realizedProfit = completedContractsData.reduce((sum, c) => sum + Number(c.total_profit), 0);
    
    // Dados de parcelas
    const pendingInstallmentsData = filteredInstallments.filter(i => 
      ["Pendente", "Atrasado"].includes(i.status)
    );
    const paidInstallmentsData = filteredInstallments.filter(i => i.status === "Pago");
    
    const averageTicket = totalContracts > 0 ? totalCapital / totalContracts : 0;
    const averageRate = filteredContracts.length 
      ? filteredContracts.reduce((sum, c) => sum + Number(c.interest_rate), 0) / filteredContracts.length 
      : 0;
    const roi = totalCapital > 0 ? (totalProfit / totalCapital) * 100 : 0;

    // Parcelas
    const totalInstallments = filteredInstallments.length;
    const paidInstallments = paidInstallmentsData.length;
    const pendingInstallments = filteredInstallments.filter(i => i.status === "Pendente").length;
    const overdueInstallmentsData = filteredInstallments.filter(i => i.status === "Atrasado");
    const overdueInstallmentsCount = overdueInstallmentsData.length;

    // Inadimplência
    const totalInstallmentsForDefault = totalInstallments > 0 ? totalInstallments : 1;
    const defaultRate = (overdueInstallmentsCount / totalInstallmentsForDefault) * 100;
    
    const defaultValue = overdueInstallmentsData.reduce(
      (acc, i) => acc + Number(i.amount_due),
      0
    );
    
    const today = new Date();
    const daysOverdueArray = overdueInstallmentsData.map(i => 
      differenceInDays(today, parseISO(i.due_date))
    );
    const avgDaysOverdue = daysOverdueArray.length > 0 
      ? daysOverdueArray.reduce((a, b) => a + b, 0) / daysOverdueArray.length 
      : 0;
    
    // Clientes com mais de 30 dias de atraso
    const highRiskClientIds = new Set(
      overdueInstallmentsData
        .filter(i => differenceInDays(today, parseISO(i.due_date)) > 30)
        .map(i => i.client_id)
    );
    const highRiskClients = highRiskClientIds.size;

    // Crescimento
    const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
    const contractsThisMonth = contracts?.filter(c => {
      const created = parseISO(c.created_at);
      return created >= thisMonthStart;
    }).length || 0;
    
    const contractsLastMonth = contracts?.filter(c => {
      const created = parseISO(c.created_at);
      return created >= lastMonthStart && created < thisMonthStart;
    }).length || 0;
    
    const growthRate = contractsLastMonth > 0 
      ? ((contractsThisMonth - contractsLastMonth) / contractsLastMonth) * 100 
      : contractsThisMonth > 0 ? 100 : 0;

    return {
      totalContracts,
      activeContracts,
      inactiveContracts,
      completedContracts,
      overdueContracts,
      renegotiatedContracts,
      totalClients,
      activeClients,
      overdueClients,
      settledClients,
      newClientsThisMonth,
      totalCapital,
      capitalOnStreet,
      totalProfit,
      realizedProfit,
      pendingProfit,
      averageTicket,
      averageRate,
      roi,
      totalInstallments,
      paidInstallments,
      pendingInstallments,
      overdueInstallments: overdueInstallmentsCount,
      defaultRate,
      defaultValue,
      avgDaysOverdue,
      highRiskClients,
      contractsThisMonth,
      contractsLastMonth,
      growthRate,
      isLoading: false,
    };
  }, [contracts, clients, installments, transactions, isLoading, period]);
}

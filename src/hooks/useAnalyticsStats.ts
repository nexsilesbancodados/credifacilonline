import { useMemo } from "react";
import { useContracts, useInstallments } from "@/hooks/useContracts";
import { useClients } from "@/hooks/useClients";
import { useTreasury } from "@/hooks/useTreasury";
import { parseISO, differenceInDays, startOfMonth, subMonths } from "date-fns";

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

export function useAnalyticsStats(): AnalyticsStats {
  const { contracts, isLoading: isLoadingContracts } = useContracts();
  const { clients, isLoading: isLoadingClients } = useClients();
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

    // Contratos
    const totalContracts = contracts?.length || 0;
    const activeContracts = contracts?.filter(c => c.status === "Ativo").length || 0;
    const inactiveContracts = contracts?.filter(c => !["Ativo", "Atraso"].includes(c.status) && c.status !== "Quitado").length || 0;
    const completedContracts = contracts?.filter(c => c.status === "Quitado").length || 0;
    const overdueContracts = contracts?.filter(c => c.status === "Atraso").length || 0;
    const renegotiatedContracts = contracts?.filter(c => c.renegotiated_from_id).length || 0;

    // Clientes
    const totalClients = clients?.length || 0;
    const activeClients = clients?.filter(c => c.status === "Ativo").length || 0;
    const overdueClients = clients?.filter(c => c.status === "Atraso").length || 0;
    const settledClients = clients?.filter(c => c.status === "Quitado").length || 0;
    
    const thisMonthStart = startOfMonth(new Date());
    const newClientsThisMonth = clients?.filter(c => {
      const created = parseISO(c.created_at);
      return created >= thisMonthStart;
    }).length || 0;

    // Financeiro
    const totalCapital = contracts?.reduce((sum, c) => sum + Number(c.capital), 0) || 0;
    const totalProfit = contracts?.reduce((sum, c) => sum + Number(c.total_profit), 0) || 0;
    
    const pendingInstallmentsData = installments?.filter(i => 
      ["Pendente", "Atrasado"].includes(i.status)
    ) || [];
    const paidInstallmentsData = installments?.filter(i => i.status === "Pago") || [];
    
    const capitalOnStreet = pendingInstallmentsData.reduce(
      (acc, i) => acc + (Number(i.amount_due) - Number(i.amount_paid || 0)),
      0
    );
    
    const realizedProfit = paidInstallmentsData.reduce(
      (acc, i) => acc + Number(i.amount_paid || 0),
      0
    );
    
    const pendingProfit = pendingInstallmentsData.reduce(
      (acc, i) => acc + Number(i.amount_due),
      0
    );
    
    const averageTicket = totalContracts > 0 ? totalCapital / totalContracts : 0;
    const averageRate = contracts?.length 
      ? contracts.reduce((sum, c) => sum + Number(c.interest_rate), 0) / contracts.length 
      : 0;
    const roi = totalCapital > 0 ? (totalProfit / totalCapital) * 100 : 0;

    // Parcelas
    const totalInstallments = installments?.length || 0;
    const paidInstallments = paidInstallmentsData.length;
    const pendingInstallments = installments?.filter(i => i.status === "Pendente").length || 0;
    const overdueInstallmentsData = installments?.filter(i => i.status === "Atrasado") || [];
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
  }, [contracts, clients, installments, transactions, isLoading]);
}

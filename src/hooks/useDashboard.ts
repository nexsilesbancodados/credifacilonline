import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface DashboardStats {
  capitalOnStreet: number;
  realizedProfit: number;
  pendingProfit: number;
  defaultRate: number;
  activeContracts: number;
  overdueContracts: number;
  totalClients: number;
  clientsByStatus: {
    ativo: number;
    atraso: number;
    quitado: number;
  };
}

export function useDashboardStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["dashboard-stats", user?.id],
    queryFn: async () => {
      // Get all contracts with capital and profit
      const { data: contracts, error: contractsError } = await supabase
        .from("contracts")
        .select("status, capital, total_profit");

      if (contractsError) throw contractsError;

      // Get all installments for default rate calculation
      const { data: installments, error: installmentsError } = await supabase
        .from("installments")
        .select("status");

      if (installmentsError) throw installmentsError;

      // Get all clients (excluding archived)
      const { data: clients, error: clientsError } = await supabase
        .from("clients")
        .select("status, archived_at")
        .is("archived_at", null);

      if (clientsError) throw clientsError;

      // Contratos ativos (Ativo ou Atraso - ainda não quitados)
      const activeContractsData = contracts.filter((c) => 
        ["Ativo", "Atraso"].includes(c.status)
      );
      
      // Contratos quitados
      const completedContractsData = contracts.filter((c) => c.status === "Quitado");

      // Capital na rua = capital dos contratos ativos
      const capitalOnStreet = activeContractsData.reduce(
        (acc, c) => acc + Number(c.capital),
        0
      );

      // Lucro recebido = lucro dos contratos quitados
      const realizedProfit = completedContractsData.reduce(
        (acc, c) => acc + Number(c.total_profit),
        0
      );

      // Lucro a receber = lucro dos contratos ativos
      const pendingProfit = activeContractsData.reduce(
        (acc, c) => acc + Number(c.total_profit),
        0
      );

      // Taxa de inadimplência baseada em parcelas
      const overdueInstallments = installments.filter((i) => i.status === "Atrasado");
      const totalInstallments = installments.length;
      const defaultRate = totalInstallments > 0 
        ? (overdueInstallments.length / totalInstallments) * 100 
        : 0;

      const activeContracts = activeContractsData.filter((c) => c.status === "Ativo").length;
      const overdueContracts = activeContractsData.filter((c) => c.status === "Atraso").length;

      const clientsByStatus = clients.reduce(
        (acc, c) => {
          const status = c.status.toLowerCase() as keyof typeof acc;
          if (acc[status] !== undefined) {
            acc[status]++;
          }
          return acc;
        },
        { ativo: 0, atraso: 0, quitado: 0 }
      );

      return {
        capitalOnStreet,
        realizedProfit,
        pendingProfit,
        defaultRate: Math.round(defaultRate * 10) / 10,
        activeContracts,
        overdueContracts,
        totalClients: clients.length,
        clientsByStatus,
      } as DashboardStats;
    },
    enabled: !!user,
    refetchInterval: 60000, // Refresh every 60 seconds (realtime handles instant updates)
  });
}

export function useRecentPayments(limit = 10) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["recent-payments", user?.id, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treasury_transactions")
        .select("*")
        .eq("category", "Recebimento")
        .order("date", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useOverdueClients() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["overdue-clients", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("installments")
        .select(`
          id,
          due_date,
          amount_due,
          client_id,
          clients!inner(id, name, whatsapp)
        `)
        .eq("status", "Atrasado")
        .order("due_date", { ascending: true })
        .limit(10);

      if (error) throw error;

      // Calculate days overdue
      const today = new Date();
      return data.map((item) => {
        const dueDate = new Date(item.due_date);
        const daysOverdue = Math.floor(
          (today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        return {
          ...item,
          daysOverdue,
        };
      });
    },
    enabled: !!user,
  });
}

export function useActivityLog(clientId?: string, limit = 20) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["activity-log", clientId, limit],
    queryFn: async () => {
      let query = supabase
        .from("activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (clientId) {
        query = query.eq("client_id", clientId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

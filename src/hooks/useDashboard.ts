import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface DashboardStats {
  capitalOnStreet: number;
  realizedProfit: number;
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
      // Get all installments
      const { data: installments, error: installmentsError } = await supabase
        .from("installments")
        .select("status, amount_due, amount_paid");

      if (installmentsError) throw installmentsError;

      // Get all contracts
      const { data: contracts, error: contractsError } = await supabase
        .from("contracts")
        .select("status, total_profit");

      if (contractsError) throw contractsError;

      // Get all clients (excluding archived)
      const { data: clients, error: clientsError } = await supabase
        .from("clients")
        .select("status, archived_at")
        .is("archived_at", null);

      if (clientsError) throw clientsError;

      // Calculate stats
      const pendingInstallments = installments.filter((i) =>
        ["Pendente", "Atrasado"].includes(i.status)
      );
      const paidInstallments = installments.filter((i) => i.status === "Pago");
      const overdueInstallments = installments.filter((i) => i.status === "Atrasado");

      const capitalOnStreet = pendingInstallments.reduce(
        (acc, i) => acc + (Number(i.amount_due) - Number(i.amount_paid)),
        0
      );

      const realizedProfit = paidInstallments.reduce(
        (acc, i) => acc + Number(i.amount_paid),
        0
      );

      const totalPending = pendingInstallments.length;
      const defaultRate = totalPending > 0 
        ? (overdueInstallments.length / (totalPending + paidInstallments.length)) * 100 
        : 0;

      const activeContracts = contracts.filter((c) => c.status === "Ativo").length;
      const overdueContracts = contracts.filter((c) => c.status === "Atraso").length;

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
        defaultRate: Math.round(defaultRate * 10) / 10,
        activeContracts,
        overdueContracts,
        totalClients: clients.length,
        clientsByStatus,
      } as DashboardStats;
    },
    enabled: !!user,
    refetchInterval: 30000, // Refresh every 30 seconds
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

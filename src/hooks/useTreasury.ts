import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface TreasuryTransaction {
  id: string;
  operator_id: string;
  date: string;
  description: string;
  category: string;
  type: "entrada" | "saida";
  amount: number;
  reference_id: string | null;
  reference_type: string | null;
  created_at: string;
}

export interface CreateTransactionData {
  date: string;
  description: string;
  category: string;
  type: "entrada" | "saida";
  amount: number;
}

export function useTreasury() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const transactionsQuery = useQuery({
    queryKey: ["treasury", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treasury_transactions")
        .select("*")
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as TreasuryTransaction[];
    },
    enabled: !!user,
  });

  const summaryQuery = useQuery({
    queryKey: ["treasury-summary", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("treasury_transactions")
        .select("type, amount");

      if (error) throw error;

      const summary = data.reduce(
        (acc, t) => {
          if (t.type === "entrada") {
            acc.totalIn += Number(t.amount);
          } else {
            acc.totalOut += Number(t.amount);
          }
          return acc;
        },
        { totalIn: 0, totalOut: 0 }
      );

      return {
        ...summary,
        balance: summary.totalIn - summary.totalOut,
      };
    },
    enabled: !!user,
  });

  // Get capital on the street and pending profit (active loans) - SINCRONIZADO
  // Usa o capital e lucro dos contratos ativos
  const capitalOnStreetQuery = useQuery({
    queryKey: ["capital-on-street", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select("capital, total_profit, status")
        .in("status", ["Ativo", "Atraso"]);

      if (error) throw error;

      // Soma o capital e lucro de todos os contratos ativos
      const capital = data.reduce((acc, c) => acc + Number(c.capital), 0);
      const pendingProfit = data.reduce((acc, c) => acc + Number(c.total_profit), 0);
      
      return {
        capitalOnStreet: capital,
        pendingProfit: pendingProfit,
        totalToReceive: capital + pendingProfit,
      };
    },
    enabled: !!user,
  });

  const createTransactionMutation = useMutation({
    mutationFn: async (transactionData: CreateTransactionData) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("treasury_transactions")
        .insert({
          ...transactionData,
          operator_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as TreasuryTransaction;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["treasury"] });
      queryClient.invalidateQueries({ queryKey: ["treasury-summary"] });
      toast({
        title: variables.type === "entrada" ? "Entrada registrada!" : "Saída registrada!",
        description: `R$ ${variables.amount.toLocaleString("pt-BR")} - ${variables.description}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao registrar transação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteTransactionMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("treasury_transactions")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["treasury"] });
      queryClient.invalidateQueries({ queryKey: ["treasury-summary"] });
      toast({
        title: "Transação removida!",
        description: "A transação foi excluída com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover transação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    transactions: transactionsQuery.data || [],
    summary: summaryQuery.data || { totalIn: 0, totalOut: 0, balance: 0 },
    capitalOnStreet: capitalOnStreetQuery.data?.capitalOnStreet || 0,
    pendingProfit: capitalOnStreetQuery.data?.pendingProfit || 0,
    totalToReceive: capitalOnStreetQuery.data?.totalToReceive || 0,
    isLoading: transactionsQuery.isLoading || summaryQuery.isLoading,
    isError: transactionsQuery.isError || summaryQuery.isError,
    refetch: transactionsQuery.refetch,
    createTransaction: createTransactionMutation.mutate,
    deleteTransaction: deleteTransactionMutation.mutate,
    isCreating: createTransactionMutation.isPending,
  };
}

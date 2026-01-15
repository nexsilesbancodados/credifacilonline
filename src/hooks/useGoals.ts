import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { Json } from "@/integrations/supabase/types";

export interface Goal {
  id: string;
  type: "loans" | "collections" | "clients" | "profit";
  target: number;
  current: number;
  month: string; // YYYY-MM format
  createdAt: string;
}

export interface GoalProgress {
  type: Goal["type"];
  label: string;
  target: number;
  current: number;
  percentage: number;
  icon: string;
  color: string;
}

const goalConfig = {
  loans: { label: "Empréstimos", icon: "💰", color: "hsl(45, 90%, 50%)" },
  collections: { label: "Recebimentos", icon: "📥", color: "hsl(142, 71%, 45%)" },
  clients: { label: "Novos Clientes", icon: "👥", color: "hsl(217, 91%, 60%)" },
  profit: { label: "Lucro", icon: "📈", color: "hsl(280, 70%, 50%)" },
};

export function useGoals(month?: string) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const currentMonth = month || format(new Date(), "yyyy-MM");

  // Fetch goals from activity_log metadata (using it as a simple storage)
  const goalsQuery = useQuery({
    queryKey: ["goals", currentMonth, user?.id],
    queryFn: async () => {
      // For now, we'll use localStorage as a simple storage
      // In production, you'd want a dedicated goals table
      const stored = localStorage.getItem(`goals_${user?.id}_${currentMonth}`);
      if (stored) {
        return JSON.parse(stored) as Goal[];
      }
      
      // Default goals
      return [
        { id: "1", type: "loans" as const, target: 50000, current: 0, month: currentMonth, createdAt: new Date().toISOString() },
        { id: "2", type: "collections" as const, target: 40000, current: 0, month: currentMonth, createdAt: new Date().toISOString() },
        { id: "3", type: "clients" as const, target: 10, current: 0, month: currentMonth, createdAt: new Date().toISOString() },
        { id: "4", type: "profit" as const, target: 15000, current: 0, month: currentMonth, createdAt: new Date().toISOString() },
      ];
    },
    enabled: !!user,
  });

  // Calculate current progress from real data
  const progressQuery = useQuery({
    queryKey: ["goals-progress", currentMonth, user?.id],
    queryFn: async () => {
      const monthStart = startOfMonth(new Date(`${currentMonth}-01`));
      const monthEnd = endOfMonth(monthStart);
      
      // Get transactions for the month
      const { data: transactions } = await supabase
        .from("treasury_transactions")
        .select("*")
        .gte("date", format(monthStart, "yyyy-MM-dd"))
        .lte("date", format(monthEnd, "yyyy-MM-dd"));
      
      // Get clients created this month
      const { data: clients } = await supabase
        .from("clients")
        .select("id")
        .gte("created_at", monthStart.toISOString())
        .lte("created_at", monthEnd.toISOString());
      
      // Calculate metrics
      const loans = transactions
        ?.filter((t) => t.type === "saida" && t.category === "Empréstimo")
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      
      const collections = transactions
        ?.filter((t) => t.type === "entrada" && t.category === "Recebimento")
        .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      
      const newClients = clients?.length || 0;
      
      // Approximate profit (10% of collections)
      const profit = collections * 0.1;
      
      return {
        loans,
        collections,
        clients: newClients,
        profit,
      };
    },
    enabled: !!user,
  });

  const updateGoal = useMutation({
    mutationFn: async ({ type, target }: { type: Goal["type"]; target: number }) => {
      const goals = goalsQuery.data || [];
      const updatedGoals = goals.map((g) =>
        g.type === type ? { ...g, target } : g
      );
      
      localStorage.setItem(`goals_${user?.id}_${currentMonth}`, JSON.stringify(updatedGoals));
      return updatedGoals;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast({
        title: "Meta atualizada!",
        description: "Sua meta foi salva com sucesso.",
      });
    },
  });

  // Combine goals with current progress
  const goalsWithProgress: GoalProgress[] = (goalsQuery.data || []).map((goal) => {
    const current = progressQuery.data?.[goal.type] || 0;
    const config = goalConfig[goal.type];
    
    return {
      type: goal.type,
      label: config.label,
      target: goal.target,
      current,
      percentage: goal.target > 0 ? Math.min(100, Math.round((current / goal.target) * 100)) : 0,
      icon: config.icon,
      color: config.color,
    };
  });

  return {
    goals: goalsWithProgress,
    isLoading: goalsQuery.isLoading || progressQuery.isLoading,
    updateGoal: updateGoal.mutate,
    isUpdating: updateGoal.isPending,
  };
}

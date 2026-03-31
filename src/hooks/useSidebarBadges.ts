import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useSidebarBadges() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["sidebar-badges", user?.id],
    queryFn: async () => {
      // Get overdue installments count
      const { count: overdueCount, error: overdueError } = await supabase
        .from("installments")
        .select("*", { count: "exact", head: true })
        .eq("status", "Atrasado");

      if (overdueError) throw overdueError;

      // Get active clients count
      const { count: clientsCount, error: clientsError } = await supabase
        .from("clients")
        .select("*", { count: "exact", head: true })
        .is("archived_at", null);

      if (clientsError) throw clientsError;

      return {
        overdueCount: overdueCount || 0,
        activeClientsCount: clientsCount || 0,
      };
    },
    enabled: !!user,
    staleTime: 60000,
    refetchInterval: 60000,
  });
}

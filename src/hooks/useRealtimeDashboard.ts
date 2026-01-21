import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Hook that subscribes to real-time updates for dashboard data.
 * Automatically invalidates relevant queries when data changes.
 */
export function useRealtimeDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    // Subscribe to contracts changes
    const contractsChannel = supabase
      .channel("dashboard-contracts")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "contracts",
        },
        () => {
          // Invalidate all dashboard-related queries
          queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
          queryClient.invalidateQueries({ queryKey: ["contracts"] });
        }
      )
      .subscribe();

    // Subscribe to installments changes
    const installmentsChannel = supabase
      .channel("dashboard-installments")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "installments",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
          queryClient.invalidateQueries({ queryKey: ["installments"] });
          queryClient.invalidateQueries({ queryKey: ["pending-installments"] });
          queryClient.invalidateQueries({ queryKey: ["overdue-clients"] });
        }
      )
      .subscribe();

    // Subscribe to clients changes
    const clientsChannel = supabase
      .channel("dashboard-clients")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "clients",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
          queryClient.invalidateQueries({ queryKey: ["clients"] });
        }
      )
      .subscribe();

    // Subscribe to treasury changes
    const treasuryChannel = supabase
      .channel("dashboard-treasury")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "treasury_transactions",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["treasury"] });
          queryClient.invalidateQueries({ queryKey: ["recent-payments"] });
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(contractsChannel);
      supabase.removeChannel(installmentsChannel);
      supabase.removeChannel(clientsChannel);
      supabase.removeChannel(treasuryChannel);
    };
  }, [user, queryClient]);
}

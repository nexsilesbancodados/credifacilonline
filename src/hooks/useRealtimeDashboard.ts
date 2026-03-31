import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNotificationSound } from "@/hooks/useNotificationSound";

/**
 * Hook that subscribes to real-time updates for dashboard data.
 * Automatically invalidates relevant queries when data changes.
 * Plays notification sound when installments become overdue.
 */
export function useRealtimeDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { playSound } = useNotificationSound();
  const playSoundRef = useRef(playSound);
  playSoundRef.current = playSound;

  useEffect(() => {
    if (!user) return;

    const contractsChannel = supabase
      .channel("dashboard-contracts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "contracts" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
          queryClient.invalidateQueries({ queryKey: ["contracts"] });
        }
      )
      .subscribe();

    const installmentsChannel = supabase
      .channel("dashboard-installments")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "installments" },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
          queryClient.invalidateQueries({ queryKey: ["installments"] });
          queryClient.invalidateQueries({ queryKey: ["pending-installments"] });
          queryClient.invalidateQueries({ queryKey: ["overdue-clients"] });

          // Play sound when status changes to "Atrasado"
          if (payload.new && (payload.new as any).status === "Atrasado" && payload.old && (payload.old as any).status !== "Atrasado") {
            playSoundRef.current("warning");
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "installments" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
          queryClient.invalidateQueries({ queryKey: ["installments"] });
          queryClient.invalidateQueries({ queryKey: ["pending-installments"] });
        }
      )
      .subscribe();

    const clientsChannel = supabase
      .channel("dashboard-clients")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "clients" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
          queryClient.invalidateQueries({ queryKey: ["clients"] });
        }
      )
      .subscribe();

    const treasuryChannel = supabase
      .channel("dashboard-treasury")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "treasury_transactions" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["treasury"] });
          queryClient.invalidateQueries({ queryKey: ["recent-payments"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(contractsChannel);
      supabase.removeChannel(installmentsChannel);
      supabase.removeChannel(clientsChannel);
      supabase.removeChannel(treasuryChannel);
    };
  }, [user, queryClient]);
}

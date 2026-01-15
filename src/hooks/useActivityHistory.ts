import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ActivityLog {
  id: string;
  created_at: string;
  description: string;
  type: string;
  operator_id: string;
  client_id: string | null;
  contract_id: string | null;
  metadata: Record<string, unknown> | null;
  client_name?: string;
}

export type ActivityType = "all" | "client" | "contract" | "payment" | "renegotiation" | "collection" | "system";

export function useActivityHistory(
  type: ActivityType = "all",
  searchQuery: string = "",
  page: number = 1,
  limit: number = 20
) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["activity-history", user?.id, type, searchQuery, page, limit],
    queryFn: async () => {
      // First get activities
      let query = supabase
        .from("activity_log")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      // Filter by type
      if (type !== "all") {
        query = query.eq("type", type);
      }

      // Filter by search query
      if (searchQuery) {
        query = query.ilike("description", `%${searchQuery}%`);
      }

      // Pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      // Get client names for activities that have client_id
      const clientIds = data
        .filter((a) => a.client_id)
        .map((a) => a.client_id)
        .filter((id, index, arr) => arr.indexOf(id) === index);

      let clientsMap: Record<string, string> = {};

      if (clientIds.length > 0) {
        const { data: clients } = await supabase
          .from("clients")
          .select("id, name")
          .in("id", clientIds as string[]);

        if (clients) {
          clientsMap = clients.reduce((acc, c) => {
            acc[c.id] = c.name;
            return acc;
          }, {} as Record<string, string>);
        }
      }

      // Merge client names
      const activitiesWithClientNames = data.map((activity) => ({
        ...activity,
        client_name: activity.client_id ? clientsMap[activity.client_id] : undefined,
      }));

      return {
        activities: activitiesWithClientNames as ActivityLog[],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        currentPage: page,
      };
    },
    enabled: !!user,
  });
}

export function useActivityStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["activity-stats", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("activity_log")
        .select("type, created_at");

      if (error) throw error;

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const stats = {
        total: data.length,
        today: data.filter((a) => new Date(a.created_at) >= today).length,
        thisWeek: data.filter((a) => new Date(a.created_at) >= thisWeek).length,
        thisMonth: data.filter((a) => new Date(a.created_at) >= thisMonth).length,
        byType: {} as Record<string, number>,
      };

      data.forEach((a) => {
        stats.byType[a.type] = (stats.byType[a.type] || 0) + 1;
      });

      return stats;
    },
    enabled: !!user,
  });
}

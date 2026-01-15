import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface CollectionLog {
  id: string;
  user_id: string;
  client_id: string | null;
  installment_id: string | null;
  rule_id: string | null;
  message_sent: string;
  channel: 'whatsapp' | 'sms' | 'email';
  status: 'sent' | 'delivered' | 'read' | 'failed';
  sent_at: string;
  delivered_at: string | null;
  read_at: string | null;
}

export function useCollectionLogs(clientId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['collection-logs', clientId],
    queryFn: async () => {
      let query = supabase
        .from('collection_logs')
        .select('*')
        .order('sent_at', { ascending: false });

      if (clientId) {
        query = query.eq('client_id', clientId);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data as CollectionLog[];
    },
    enabled: !!user,
  });

  const createLog = useMutation({
    mutationFn: async (log: Omit<CollectionLog, 'id' | 'user_id' | 'sent_at' | 'delivered_at' | 'read_at'>) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('collection_logs')
        .insert({
          ...log,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection-logs'] });
    },
  });

  const updateLogStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: CollectionLog['status'] }) => {
      const updates: Partial<CollectionLog> = { status };
      
      if (status === 'delivered') {
        updates.delivered_at = new Date().toISOString();
      } else if (status === 'read') {
        updates.read_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('collection_logs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection-logs'] });
    },
  });

  return {
    logs,
    isLoading,
    createLog,
    updateLogStatus,
  };
}

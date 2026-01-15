import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface CollectionRule {
  id: string;
  user_id: string;
  name: string;
  trigger_days: number;
  message_template: string;
  tone: 'friendly' | 'formal' | 'urgent';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useCollectionRules() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['collection-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('collection_rules')
        .select('*')
        .order('trigger_days', { ascending: true });

      if (error) throw error;
      return data as CollectionRule[];
    },
    enabled: !!user,
  });

  const createRule = useMutation({
    mutationFn: async (rule: Omit<CollectionRule, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('collection_rules')
        .insert({
          ...rule,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection-rules'] });
      toast.success('Regra de cobrança criada!');
    },
    onError: (error) => {
      toast.error('Erro ao criar regra: ' + error.message);
    },
  });

  const updateRule = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<CollectionRule> & { id: string }) => {
      const { data, error } = await supabase
        .from('collection_rules')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection-rules'] });
      toast.success('Regra atualizada!');
    },
    onError: (error) => {
      toast.error('Erro ao atualizar regra: ' + error.message);
    },
  });

  const deleteRule = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('collection_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['collection-rules'] });
      toast.success('Regra excluída!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir regra: ' + error.message);
    },
  });

  const toggleRule = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('collection_rules')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['collection-rules'] });
      toast.success(data.is_active ? 'Regra ativada!' : 'Regra desativada!');
    },
    onError: (error) => {
      toast.error('Erro ao alterar regra: ' + error.message);
    },
  });

  return {
    rules,
    isLoading,
    createRule,
    updateRule,
    deleteRule,
    toggleRule,
  };
}

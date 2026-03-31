import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface Collector {
  id: string;
  operator_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  access_token: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CollectorWithClients extends Collector {
  clients_count: number;
  clients: {
    id: string;
    name: string;
    whatsapp: string | null;
    street: string | null;
    number: string | null;
    neighborhood: string | null;
    city: string | null;
    state: string | null;
  }[];
}

export function useCollectors() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: collectors = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["collectors", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("collectors")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Collector[];
    },
    enabled: !!user?.id,
  });

  const { data: collectorsWithClients = [] } = useQuery({
    queryKey: ["collectors-with-clients", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data: collectorsData, error: collectorsError } = await supabase
        .from("collectors")
        .select("*")
        .order("created_at", { ascending: false });

      if (collectorsError) throw collectorsError;

      const result: CollectorWithClients[] = [];

      for (const collector of collectorsData) {
        const { data: clientsData, error: clientsError } = await supabase
          .from("clients")
          .select("id, name, whatsapp, street, number, neighborhood, city, state")
          .eq("collector_id", collector.id)
          .is("archived_at", null);

        if (clientsError) throw clientsError;

        result.push({
          ...collector,
          clients_count: clientsData?.length || 0,
          clients: clientsData || [],
        });
      }

      return result;
    },
    enabled: !!user?.id,
  });

  const createCollector = useMutation({
    mutationFn: async (data: { name: string; phone?: string; email?: string }) => {
      if (!user?.id) throw new Error("Usuário não autenticado");

      const { data: newCollector, error } = await supabase
        .from("collectors")
        .insert({
          operator_id: user.id,
          name: data.name,
          phone: data.phone || null,
          email: data.email || null,
        })
        .select()
        .single();

      if (error) throw error;
      return newCollector;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collectors"] });
      queryClient.invalidateQueries({ queryKey: ["collectors-with-clients"] });
      toast({
        title: "Cobrador criado",
        description: "O cobrador foi cadastrado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar cobrador",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateCollector = useMutation({
    mutationFn: async (data: { id: string; name?: string; phone?: string; email?: string; is_active?: boolean }) => {
      const { id, ...updates } = data;
      const { error } = await supabase
        .from("collectors")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collectors"] });
      queryClient.invalidateQueries({ queryKey: ["collectors-with-clients"] });
      toast({
        title: "Cobrador atualizado",
        description: "Os dados foram atualizados com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar cobrador",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteCollector = useMutation({
    mutationFn: async (id: string) => {
      // First, unassign all clients from this collector
      const { error: clientsError } = await supabase
        .from("clients")
        .update({ collector_id: null })
        .eq("collector_id", id);

      if (clientsError) throw clientsError;

      const { error } = await supabase
        .from("collectors")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collectors"] });
      queryClient.invalidateQueries({ queryKey: ["collectors-with-clients"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({
        title: "Cobrador excluído",
        description: "O cobrador foi removido com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir cobrador",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const assignClient = useMutation({
    mutationFn: async ({ clientId, collectorId }: { clientId: string; collectorId: string | null }) => {
      const { error } = await supabase
        .from("clients")
        .update({ collector_id: collectorId })
        .eq("id", clientId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collectors-with-clients"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({
        title: "Cliente atribuído",
        description: "O cliente foi atribuído ao cobrador.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atribuir cliente",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const regenerateToken = useMutation({
    mutationFn: async (id: string) => {
      // Generate new token using crypto
      const newToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const { error } = await supabase
        .from("collectors")
        .update({ access_token: newToken })
        .eq("id", id);

      if (error) throw error;
      return newToken;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["collectors"] });
      queryClient.invalidateQueries({ queryKey: ["collectors-with-clients"] });
      toast({
        title: "Token regenerado",
        description: "O novo link de acesso foi gerado.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao regenerar token",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    collectors,
    collectorsWithClients,
    isLoading,
    createCollector,
    updateCollector,
    deleteCollector,
    assignClient,
    regenerateToken,
  };
}

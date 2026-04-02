import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export interface Client {
  id: string;
  operator_id: string;
  name: string;
  cpf: string;
  email: string | null;
  whatsapp: string | null;
  avatar_url: string | null;
  cep: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  status: "Ativo" | "Atraso" | "Quitado";
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  collector_id: string | null;
}

export interface CreateClientData {
  name: string;
  cpf: string;
  email?: string;
  whatsapp?: string;
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

const PAGE_SIZE = 20;

export function useClients() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  const clientsQuery = useQuery({
    queryKey: ["clients", user?.id, page],
    queryFn: async () => {
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      const { data, error, count } = await supabase
        .from("clients")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;
      return { clients: data as Client[], totalCount: count || 0 };
    },
    enabled: !!user,
  });

  const totalCount = clientsQuery.data?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const createClientMutation = useMutation({
    mutationFn: async (clientData: CreateClientData) => {
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("clients")
        .insert({
          ...clientData,
          operator_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Client;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["clients-all"] });
      toast({
        title: "Cliente criado!",
        description: "O cliente foi cadastrado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar cliente",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateClientMutation = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Client> & { id: string }) => {
      const { data: updated, error } = await supabase
        .from("clients")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return updated as Client;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["clients-all"] });
      toast({
        title: "Cliente atualizado!",
        description: "Os dados foram salvos com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar cliente",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      toast({
        title: "Cliente removido!",
        description: "O cliente foi excluído com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover cliente",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    clients: clientsQuery.data?.clients || [],
    totalCount,
    page,
    setPage,
    totalPages,
    isLoading: clientsQuery.isLoading,
    isError: clientsQuery.isError,
    error: clientsQuery.error,
    refetch: clientsQuery.refetch,
    createClient: createClientMutation.mutate,
    updateClient: updateClientMutation.mutate,
    deleteClient: deleteClientMutation.mutate,
    isCreating: createClientMutation.isPending,
    isUpdating: updateClientMutation.isPending,
    isDeleting: deleteClientMutation.isPending,
  };
}

export function useClient(clientId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["client", clientId],
    queryFn: async () => {
      if (!clientId) return null;

      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .single();

      if (error) throw error;
      return data as Client;
    },
    enabled: !!user && !!clientId,
  });
}

// Hook to get ALL clients without pagination (for dropdowns, search, etc.)
export function useAllClients() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["clients-all", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Client[];
    },
    enabled: !!user,
  });
}

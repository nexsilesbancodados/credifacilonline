import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface CompanySettings {
  id: string;
  operator_id: string;
  company_name: string | null;
  cnpj: string | null;
  default_fine_percentage: number;
  default_daily_interest: number;
  default_frequency: string;
  logo_url: string | null;
  theme: string;
  created_at: string;
  updated_at: string;
}

export function useCompanySettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading, error } = useQuery({
    queryKey: ["company_settings", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Try to fetch existing settings
      const { data, error } = await supabase
        .from("company_settings")
        .select("*")
        .eq("operator_id", user.id)
        .maybeSingle();

      if (error) throw error;

      // If no settings exist, create default ones
      if (!data) {
        const { data: newSettings, error: insertError } = await supabase
          .from("company_settings")
          .insert({
            operator_id: user.id,
            default_fine_percentage: 2,
            default_daily_interest: 0.033,
            default_frequency: "mensal",
            theme: "dark",
          })
          .select()
          .single();

        if (insertError) throw insertError;
        return newSettings as CompanySettings;
      }

      return data as CompanySettings;
    },
    enabled: !!user?.id,
  });

  const updateSettings = useMutation({
    mutationFn: async (updates: Partial<CompanySettings>) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("company_settings")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("operator_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data as CompanySettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company_settings"] });
      toast({
        title: "Configurações salvas!",
        description: "As configurações da empresa foram atualizadas.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    },
  });

  return {
    settings,
    isLoading,
    error,
    updateSettings: updateSettings.mutate,
    isUpdating: updateSettings.isPending,
  };
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface DocumentFile {
  id: string;
  user_id: string;
  client_id: string | null;
  contract_id: string | null;
  file_name: string;
  file_path: string;
  file_type: 'document' | 'payment_proof' | 'contract' | 'photo';
  file_size: number | null;
  mime_type: string | null;
  description: string | null;
  created_at: string;
}

export function useDocuments(clientId?: string, contractId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['documents', clientId, contractId],
    queryFn: async () => {
      let query = supabase
        .from('document_files')
        .select('*')
        .order('created_at', { ascending: false });

      if (clientId) {
        query = query.eq('client_id', clientId);
      }
      if (contractId) {
        query = query.eq('contract_id', contractId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as DocumentFile[];
    },
    enabled: !!user,
  });

  const uploadDocument = useMutation({
    mutationFn: async ({
      file,
      clientId,
      contractId,
      fileType,
      description,
    }: {
      file: File;
      clientId?: string;
      contractId?: string;
      fileType: DocumentFile['file_type'];
      description?: string;
    }) => {
      if (!user) throw new Error('Usuário não autenticado');

      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${clientId || 'general'}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Save metadata
      const { data, error: dbError } = await supabase
        .from('document_files')
        .insert({
          user_id: user.id,
          client_id: clientId || null,
          contract_id: contractId || null,
          file_name: file.name,
          file_path: filePath,
          file_type: fileType,
          file_size: file.size,
          mime_type: file.type,
          description: description || null,
        })
        .select()
        .single();

      if (dbError) throw dbError;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Documento enviado com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao enviar documento: ' + error.message);
    },
  });

  const deleteDocument = useMutation({
    mutationFn: async (document: DocumentFile) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([document.file_path]);

      if (storageError) throw storageError;

      // Delete metadata
      const { error: dbError } = await supabase
        .from('document_files')
        .delete()
        .eq('id', document.id);

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Documento excluído com sucesso!');
    },
    onError: (error) => {
      toast.error('Erro ao excluir documento: ' + error.message);
    },
  });

  const getDocumentUrl = async (filePath: string): Promise<string | null> => {
    const { data } = await supabase.storage
      .from('documents')
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    return data?.signedUrl || null;
  };

  return {
    documents,
    isLoading,
    uploadDocument,
    deleteDocument,
    getDocumentUrl,
  };
}

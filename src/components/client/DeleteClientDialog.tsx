import { useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

interface DeleteClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
}

export function DeleteClientDialog({
  open,
  onOpenChange,
  clientId,
  clientName,
}: DeleteClientDialogProps) {
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const isConfirmed = confirmText.toLowerCase() === "excluir";

  const handleDelete = async () => {
    if (!isConfirmed) return;

    setIsDeleting(true);

    try {
      // 1. Get all contracts for this client
      const { data: contracts, error: contractsError } = await supabase
        .from("contracts")
        .select("id")
        .eq("client_id", clientId);

      if (contractsError) throw contractsError;

      const contractIds = contracts?.map((c) => c.id) || [];

      // 2. Delete all installments for these contracts
      if (contractIds.length > 0) {
        const { error: installmentsError } = await supabase
          .from("installments")
          .delete()
          .in("contract_id", contractIds);

        if (installmentsError) throw installmentsError;
      }

      // 3. Delete installments directly linked to client (if any)
      const { error: clientInstallmentsError } = await supabase
        .from("installments")
        .delete()
        .eq("client_id", clientId);

      if (clientInstallmentsError) throw clientInstallmentsError;

      // 4. Delete collection logs for this client
      const { error: collectionLogsError } = await supabase
        .from("collection_logs")
        .delete()
        .eq("client_id", clientId);

      if (collectionLogsError) throw collectionLogsError;

      // 5. Delete activity logs for this client
      const { error: activityLogsError } = await supabase
        .from("activity_log")
        .delete()
        .eq("client_id", clientId);

      if (activityLogsError) throw activityLogsError;

      // 6. Delete document files for this client
      const { error: documentFilesError } = await supabase
        .from("document_files")
        .delete()
        .eq("client_id", clientId);

      if (documentFilesError) throw documentFilesError;

      // 7. Delete all contracts for this client
      if (contractIds.length > 0) {
        const { error: deleteContractsError } = await supabase
          .from("contracts")
          .delete()
          .eq("client_id", clientId);

        if (deleteContractsError) throw deleteContractsError;
      }

      // 8. Finally, delete the client
      const { error: deleteClientError } = await supabase
        .from("clients")
        .delete()
        .eq("id", clientId);

      if (deleteClientError) throw deleteClientError;

      toast({
        title: "Cliente excluído",
        description: `${clientName} e todos os dados relacionados foram removidos permanentemente.`,
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["installments"] });
      queryClient.invalidateQueries({ queryKey: ["activity_log"] });

      // Close dialog and navigate
      onOpenChange(false);
      navigate("/clientes");
    } catch (error: any) {
      console.error("Error deleting client:", error);
      toast({
        title: "Erro ao excluir cliente",
        description: error.message || "Não foi possível excluir o cliente.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setConfirmText("");
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isDeleting) {
      onOpenChange(newOpen);
      if (!newOpen) {
        setConfirmText("");
      }
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/20">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-xl">
              Excluir Cliente
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left space-y-3">
            <p>
              Você está prestes a excluir permanentemente{" "}
              <strong className="text-foreground">{clientName}</strong>.
            </p>
            <p className="text-destructive font-medium">
              Esta ação irá remover:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1 text-muted-foreground">
              <li>Todos os contratos do cliente</li>
              <li>Todas as parcelas e pagamentos</li>
              <li>Histórico de atividades</li>
              <li>Documentos anexados</li>
              <li>Registros de cobrança</li>
            </ul>
            <p className="text-sm font-medium text-destructive">
              Esta ação não pode ser desfeita!
            </p>
            <div className="mt-4">
              <label className="text-sm font-medium text-foreground">
                Digite <strong>excluir</strong> para confirmar:
              </label>
              <Input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="excluir"
                className="mt-2"
                disabled={isDeleting}
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <button
            onClick={handleDelete}
            disabled={!isConfirmed || isDeleting}
            className="inline-flex h-10 items-center justify-center rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground ring-offset-background transition-colors hover:bg-destructive/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Excluindo...
              </>
            ) : (
              "Excluir Permanentemente"
            )}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

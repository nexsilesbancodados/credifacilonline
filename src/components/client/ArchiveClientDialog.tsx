import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2, Archive, ArchiveRestore } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface ArchiveClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  clientName: string;
  isArchived: boolean;
}

export function ArchiveClientDialog({
  open,
  onOpenChange,
  clientId,
  clientName,
  isArchived,
}: ArchiveClientDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleAction = async () => {
    setIsProcessing(true);

    try {
      const { error } = await supabase
        .from("clients")
        .update({
          archived_at: isArchived ? null : new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", clientId);

      if (error) throw error;

      toast({
        title: isArchived ? "Cliente restaurado" : "Cliente arquivado",
        description: isArchived
          ? `${clientName} foi restaurado e está ativo novamente.`
          : `${clientName} foi arquivado. Você pode restaurá-lo a qualquer momento.`,
      });

      queryClient.invalidateQueries({ queryKey: ["clients"] });
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error archiving/restoring client:", error);
      toast({
        title: isArchived ? "Erro ao restaurar" : "Erro ao arquivar",
        description: error.message || "Não foi possível completar a operação.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className={`flex h-12 w-12 items-center justify-center rounded-full ${isArchived ? 'bg-success/20' : 'bg-warning/20'}`}>
              {isArchived ? (
                <ArchiveRestore className="h-6 w-6 text-success" />
              ) : (
                <Archive className="h-6 w-6 text-warning" />
              )}
            </div>
            <AlertDialogTitle className="text-xl">
              {isArchived ? "Restaurar Cliente" : "Arquivar Cliente"}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-left space-y-3">
            {isArchived ? (
              <>
                <p>
                  Deseja restaurar{" "}
                  <strong className="text-foreground">{clientName}</strong>?
                </p>
                <p className="text-sm text-muted-foreground">
                  O cliente voltará a aparecer na lista principal e todos os seus
                  dados serão mantidos.
                </p>
              </>
            ) : (
              <>
                <p>
                  Deseja arquivar{" "}
                  <strong className="text-foreground">{clientName}</strong>?
                </p>
                <p className="text-sm text-muted-foreground">
                  O cliente será removido da lista principal, mas todos os dados
                  serão preservados. Você poderá restaurá-lo a qualquer momento.
                </p>
                <div className="rounded-lg bg-secondary/50 p-3 text-sm">
                  <p className="font-medium text-foreground mb-1">O que será mantido:</p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-0.5">
                    <li>Contratos e parcelas</li>
                    <li>Histórico de pagamentos</li>
                    <li>Documentos anexados</li>
                    <li>Registro de atividades</li>
                  </ul>
                </div>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleAction}
            disabled={isProcessing}
            className={isArchived 
              ? "bg-success text-success-foreground hover:bg-success/90" 
              : "bg-warning text-warning-foreground hover:bg-warning/90"
            }
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isArchived ? "Restaurando..." : "Arquivando..."}
              </>
            ) : isArchived ? (
              <>
                <ArchiveRestore className="mr-2 h-4 w-4" />
                Restaurar
              </>
            ) : (
              <>
                <Archive className="mr-2 h-4 w-4" />
                Arquivar
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

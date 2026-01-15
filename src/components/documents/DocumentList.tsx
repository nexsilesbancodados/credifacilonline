import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { useDocuments, DocumentFile } from "@/hooks/useDocuments";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { DocumentUpload } from "./DocumentUpload";
import {
  FileText,
  FileCheck,
  Image,
  Download,
  Trash2,
  ExternalLink,
  Loader2,
  FolderOpen,
} from "lucide-react";

interface DocumentListProps {
  clientId?: string;
  contractId?: string;
}

const fileTypeConfig = {
  document: { icon: FileText, label: 'Documento', color: 'bg-blue-500/10 text-blue-500' },
  payment_proof: { icon: FileCheck, label: 'Comprovante', color: 'bg-green-500/10 text-green-500' },
  contract: { icon: FileText, label: 'Contrato', color: 'bg-purple-500/10 text-purple-500' },
  photo: { icon: Image, label: 'Foto', color: 'bg-orange-500/10 text-orange-500' },
};

export function DocumentList({ clientId, contractId }: DocumentListProps) {
  const { documents, isLoading, deleteDocument, getDocumentUrl } = useDocuments(clientId, contractId);
  const [deleteConfirm, setDeleteConfirm] = useState<DocumentFile | null>(null);
  const [loadingDownload, setLoadingDownload] = useState<string | null>(null);

  const handleDownload = async (doc: DocumentFile) => {
    setLoadingDownload(doc.id);
    try {
      const url = await getDocumentUrl(doc.file_path);
      if (url) {
        window.open(url, '_blank');
      }
    } finally {
      setLoadingDownload(null);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm) {
      await deleteDocument.mutateAsync(deleteConfirm);
      setDeleteConfirm(null);
    }
  };

  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return '-';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-primary" />
          Documentos ({documents.length})
        </h3>
        <DocumentUpload clientId={clientId} contractId={contractId} />
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
          <FolderOpen className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p>Nenhum documento encontrado</p>
          <p className="text-sm">Clique em "Enviar Documento" para adicionar</p>
        </div>
      ) : (
        <div className="grid gap-3">
          <AnimatePresence>
            {documents.map((doc, index) => {
              const config = fileTypeConfig[doc.file_type] || fileTypeConfig.document;
              const Icon = config.icon;

              return (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  {/* Icon */}
                  <div className={`p-2 rounded-lg ${config.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{doc.file_name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-xs">
                        {config.label}
                      </Badge>
                      <span>{formatFileSize(doc.file_size)}</span>
                      <span>•</span>
                      <span>
                        {format(new Date(doc.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>
                    {doc.description && (
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        {doc.description}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDownload(doc)}
                      disabled={loadingDownload === doc.id}
                    >
                      {loadingDownload === doc.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ExternalLink className="h-4 w-4" />
                      )}
                    </Button>
                    <PermissionGate permission="canDeleteDocuments">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteConfirm(doc)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </PermissionGate>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O documento "{deleteConfirm?.file_name}" será 
              permanentemente removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteDocument.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

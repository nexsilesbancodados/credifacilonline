import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useDocuments, DocumentFile } from "@/hooks/useDocuments";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { Upload, FileText, Image, FileCheck, X, Loader2 } from "lucide-react";

interface DocumentUploadProps {
  clientId?: string;
  contractId?: string;
  trigger?: React.ReactNode;
}

const fileTypeOptions = [
  { value: 'document', label: 'Documento', icon: FileText },
  { value: 'payment_proof', label: 'Comprovante de Pagamento', icon: FileCheck },
  { value: 'contract', label: 'Contrato', icon: FileText },
  { value: 'photo', label: 'Foto', icon: Image },
];

export function DocumentUpload({ clientId, contractId, trigger }: DocumentUploadProps) {
  const [open, setOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<DocumentFile['file_type']>('document');
  const [description, setDescription] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { uploadDocument } = useDocuments(clientId, contractId);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    await uploadDocument.mutateAsync({
      file: selectedFile,
      clientId,
      contractId,
      fileType,
      description: description || undefined,
    });

    // Reset form
    setSelectedFile(null);
    setFileType('document');
    setDescription('');
    setPreview(null);
    setOpen(false);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <PermissionGate permission="canUploadDocuments">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline" size="sm">
              <Upload className="h-4 w-4 mr-2" />
              Enviar Documento
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Enviar Documento
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* File Drop Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
                transition-colors duration-200
                ${selectedFile 
                  ? 'border-primary bg-primary/5' 
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
                }
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
              />
              
              <AnimatePresence mode="wait">
                {selectedFile ? (
                  <motion.div
                    key="file-selected"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="space-y-2"
                  >
                    {preview ? (
                      <img
                        src={preview}
                        alt="Preview"
                        className="mx-auto h-24 w-24 object-cover rounded-lg"
                      />
                    ) : (
                      <FileText className="mx-auto h-12 w-12 text-primary" />
                    )}
                    <p className="font-medium text-sm">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(selectedFile.size)}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedFile(null);
                        setPreview(null);
                      }}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remover
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="no-file"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">
                      Clique para selecionar ou arraste um arquivo
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Imagens, PDFs, Word, Excel (máx. 10MB)
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* File Type */}
            <div className="space-y-2">
              <Label>Tipo de Documento</Label>
              <Select value={fileType} onValueChange={(v) => setFileType(v as DocumentFile['file_type'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fileTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <option.icon className="h-4 w-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Adicione uma descrição para o documento..."
                rows={2}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || uploadDocument.isPending}
              >
                {uploadDocument.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Enviar
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </PermissionGate>
  );
}

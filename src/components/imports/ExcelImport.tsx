import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Download,
  Loader2,
  Users,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import * as XLSX from "xlsx";

type ImportType = "clients" | "contracts";

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

interface ExcelImportProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExcelImport({ open, onOpenChange }: ExcelImportProps) {
  const [importType, setImportType] = useState<ImportType>("clients");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Record<string, unknown>[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const clientColumns = ["nome", "cpf", "email", "whatsapp", "cep", "cidade", "estado"];
  const contractColumns = ["cliente_cpf", "capital", "taxa_juros", "parcelas", "valor_parcela", "frequencia", "data_inicio", "primeiro_vencimento"];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet) as Record<string, unknown>[];
        
        setPreview(jsonData.slice(0, 5));
      } catch {
        toast({
          title: "Erro ao ler arquivo",
          description: "O arquivo não pôde ser processado.",
          variant: "destructive",
        });
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const downloadTemplate = () => {
    const columns = importType === "clients" ? clientColumns : contractColumns;
    const sampleData = importType === "clients" 
      ? [{ nome: "João Silva", cpf: "123.456.789-00", email: "joao@email.com", whatsapp: "11999999999", cep: "01234-567", cidade: "São Paulo", estado: "SP" }]
      : [{ cliente_cpf: "123.456.789-00", capital: 5000, taxa_juros: 10, parcelas: 12, valor_parcela: 500, frequencia: "mensal", data_inicio: "2025-01-15", primeiro_vencimento: "2025-02-15" }];
    
    const ws = XLSX.utils.json_to_sheet(sampleData, { header: columns });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, importType === "clients" ? "Clientes" : "Contratos");
    XLSX.writeFile(wb, `modelo_${importType}.xlsx`);
  };

  const handleImport = async () => {
    if (!file || !user) return;

    setIsImporting(true);
    const importResult: ImportResult = { success: 0, failed: 0, errors: [] };

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet) as Record<string, unknown>[];

        if (importType === "clients") {
          for (const row of jsonData) {
            try {
              const { error } = await supabase.from("clients").insert({
                operator_id: user.id,
                name: String(row.nome || row.name || ""),
                cpf: String(row.cpf || ""),
                email: row.email ? String(row.email) : null,
                whatsapp: row.whatsapp ? String(row.whatsapp) : null,
                cep: row.cep ? String(row.cep) : null,
                city: row.cidade || row.city ? String(row.cidade || row.city) : null,
                state: row.estado || row.state ? String(row.estado || row.state) : null,
              });

              if (error) {
                importResult.failed++;
                importResult.errors.push(`CPF ${row.cpf}: ${error.message}`);
              } else {
                importResult.success++;
              }
            } catch (err) {
              importResult.failed++;
              importResult.errors.push(`Linha: ${String(err)}`);
            }
          }
        }

        setResult(importResult);
        setIsImporting(false);

        if (importResult.success > 0) {
          queryClient.invalidateQueries({ queryKey: ["clients"] });
          queryClient.invalidateQueries({ queryKey: ["contracts"] });
          
          // Log activity
          await supabase.from("activity_log").insert({
            operator_id: user.id,
            type: "system",
            description: `Importação Excel: ${importResult.success} ${importType === "clients" ? "clientes" : "contratos"} importados`,
            metadata: { success: importResult.success, failed: importResult.failed },
          });

          toast({
            title: "Importação concluída!",
            description: `${importResult.success} registros importados com sucesso.`,
          });
        }
      };
      reader.readAsArrayBuffer(file);
    } catch {
      setIsImporting(false);
      toast({
        title: "Erro na importação",
        description: "Não foi possível processar o arquivo.",
        variant: "destructive",
      });
    }
  };

  const reset = () => {
    setFile(null);
    setPreview([]);
    setResult(null);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => onOpenChange(false)}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative z-10 w-full max-w-2xl rounded-2xl border border-border/50 bg-card p-6 shadow-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Upload className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-foreground">
                Importar via Excel
              </h2>
              <p className="text-sm text-muted-foreground">
                Importe clientes ou contratos
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 rounded-lg hover:bg-secondary text-muted-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Import Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-muted-foreground mb-3">
            O que deseja importar?
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => { setImportType("clients"); reset(); }}
              className={`rounded-xl p-4 text-left transition-all border ${
                importType === "clients"
                  ? "bg-primary/10 border-primary/50 text-primary"
                  : "bg-secondary/50 border-border/50 text-muted-foreground hover:bg-secondary"
              }`}
            >
              <Users className="h-6 w-6 mb-2" />
              <p className="font-medium">Clientes</p>
              <p className="text-xs opacity-70">Nome, CPF, contato</p>
            </button>
            <button
              onClick={() => { setImportType("contracts"); reset(); }}
              className={`rounded-xl p-4 text-left transition-all border ${
                importType === "contracts"
                  ? "bg-primary/10 border-primary/50 text-primary"
                  : "bg-secondary/50 border-border/50 text-muted-foreground hover:bg-secondary"
              }`}
            >
              <FileText className="h-6 w-6 mb-2" />
              <p className="font-medium">Contratos</p>
              <p className="text-xs opacity-70">Capital, parcelas, taxas</p>
            </button>
          </div>
        </div>

        {/* Download Template */}
        <div className="mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={downloadTemplate}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Baixar modelo de {importType === "clients" ? "clientes" : "contratos"}
          </Button>
        </div>

        {/* File Upload */}
        <div className="mb-6">
          <label
            htmlFor="file-upload"
            className={`flex flex-col items-center justify-center h-32 rounded-xl border-2 border-dashed transition-colors cursor-pointer ${
              file 
                ? "border-primary/50 bg-primary/5" 
                : "border-border hover:border-primary/30 hover:bg-secondary/30"
            }`}
          >
            {file ? (
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium text-foreground">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {preview.length} registros encontrados
                  </p>
                </div>
              </div>
            ) : (
              <>
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Clique para selecionar ou arraste o arquivo
                </p>
                <p className="text-xs text-muted-foreground/70">
                  Formatos: .xlsx, .xls
                </p>
              </>
            )}
            <input
              id="file-upload"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        </div>

        {/* Preview */}
        <AnimatePresence>
          {preview.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Pré-visualização (5 primeiros registros):
              </p>
              <div className="rounded-lg border border-border overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-secondary/50">
                    <tr>
                      {Object.keys(preview[0] || {}).slice(0, 5).map((key) => (
                        <th key={key} className="px-3 py-2 text-left font-medium text-muted-foreground">
                          {key}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} className="border-t border-border/50">
                        {Object.values(row).slice(0, 5).map((val, j) => (
                          <td key={j} className="px-3 py-2 text-foreground">
                            {String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 rounded-xl p-4 ${
                result.failed === 0 
                  ? "bg-success/10 border border-success/30" 
                  : "bg-warning/10 border border-warning/30"
              }`}
            >
              <div className="flex items-center gap-3">
                {result.failed === 0 ? (
                  <CheckCircle2 className="h-6 w-6 text-success" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-warning" />
                )}
                <div>
                  <p className="font-medium text-foreground">
                    {result.success} importados com sucesso
                  </p>
                  {result.failed > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {result.failed} falharam
                    </p>
                  )}
                </div>
              </div>
              {result.errors.length > 0 && (
                <div className="mt-3 max-h-24 overflow-y-auto">
                  {result.errors.slice(0, 5).map((err, i) => (
                    <p key={i} className="text-xs text-destructive">{err}</p>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
          <Button
            className="flex-1 bg-primary hover:bg-primary/90"
            onClick={handleImport}
            disabled={!file || isImporting}
          >
            {isImporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Importando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Importar
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

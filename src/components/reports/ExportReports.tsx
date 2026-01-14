import { useState } from "react";
import { motion } from "framer-motion";
import { Download, FileSpreadsheet, FileText, Calendar, CheckCircle2 } from "lucide-react";
import { useContracts, useInstallments } from "@/hooks/useContracts";
import { useClients } from "@/hooks/useClients";
import { useTreasury } from "@/hooks/useTreasury";
import { useToast } from "@/hooks/use-toast";

type ReportType = "contracts" | "clients" | "installments" | "treasury";
type ExportFormat = "csv" | "json";

interface ExportReportsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ExportReports = ({ open, onOpenChange }: ExportReportsProps) => {
  const [selectedReport, setSelectedReport] = useState<ReportType>("contracts");
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [isExporting, setIsExporting] = useState(false);
  const [exported, setExported] = useState(false);

  const { contracts } = useContracts();
  const { clients } = useClients();
  const { installments } = useInstallments();
  const { transactions } = useTreasury();
  const { toast } = useToast();

  const reportOptions = [
    { value: "contracts" as const, label: "Contratos", description: "Todos os contratos com detalhes" },
    { value: "clients" as const, label: "Clientes", description: "Lista de clientes cadastrados" },
    { value: "installments" as const, label: "Parcelas", description: "Cronograma de parcelas" },
    { value: "treasury" as const, label: "Tesouraria", description: "Movimentações financeiras" },
  ];

  const formatOptions = [
    { value: "csv" as const, label: "CSV", icon: FileSpreadsheet, description: "Excel compatível" },
    { value: "json" as const, label: "JSON", icon: FileText, description: "Dados estruturados" },
  ];

  const generateCSV = (data: Record<string, unknown>[], filename: string) => {
    if (data.length === 0) {
      toast({ title: "Sem dados", description: "Não há dados para exportar.", variant: "destructive" });
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(";"),
      ...data.map(row => 
        headers.map(h => {
          const value = row[h];
          if (value === null || value === undefined) return "";
          if (typeof value === "string" && value.includes(";")) return `"${value}"`;
          return String(value);
        }).join(";")
      )
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    downloadBlob(blob, `${filename}.csv`);
  };

  const generateJSON = (data: Record<string, unknown>[], filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    downloadBlob(blob, `${filename}.json`);
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const date = new Date().toISOString().split("T")[0];
      let data: Record<string, unknown>[] = [];
      let filename = "";

      switch (selectedReport) {
        case "contracts":
          data = contracts.map(c => ({
            ID: c.id,
            Cliente_ID: c.client_id,
            Capital: c.capital,
            Taxa_Juros: c.interest_rate,
            Parcelas: c.installments,
            Valor_Parcela: c.installment_value,
            Total: c.total_amount,
            Lucro: c.total_profit,
            Frequencia: c.frequency,
            Status: c.status,
            Data_Inicio: c.start_date,
            Primeiro_Vencimento: c.first_due_date,
            Criado_Em: c.created_at,
          }));
          filename = `contratos_${date}`;
          break;

        case "clients":
          data = clients.map(c => ({
            ID: c.id,
            Nome: c.name,
            CPF: c.cpf,
            Email: c.email || "",
            WhatsApp: c.whatsapp || "",
            Status: c.status,
            Rua: c.street || "",
            Numero: c.number || "",
            Bairro: c.neighborhood || "",
            Cidade: c.city || "",
            Estado: c.state || "",
            CEP: c.cep || "",
            Criado_Em: c.created_at,
          }));
          filename = `clientes_${date}`;
          break;

        case "installments":
          data = installments.map(i => ({
            ID: i.id,
            Contrato_ID: i.contract_id,
            Cliente_ID: i.client_id,
            Numero_Parcela: i.installment_number,
            Total_Parcelas: i.total_installments,
            Vencimento: i.due_date,
            Valor: i.amount_due,
            Valor_Pago: i.amount_paid || 0,
            Data_Pagamento: i.payment_date || "",
            Status: i.status,
            Multa: i.fine || 0,
          }));
          filename = `parcelas_${date}`;
          break;

        case "treasury":
          data = transactions.map(t => ({
            ID: t.id,
            Data: t.date,
            Descricao: t.description,
            Categoria: t.category,
            Tipo: t.type,
            Valor: t.amount,
            Referencia_ID: t.reference_id || "",
            Referencia_Tipo: t.reference_type || "",
            Criado_Em: t.created_at,
          }));
          filename = `tesouraria_${date}`;
          break;
      }

      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for UX

      if (format === "csv") {
        generateCSV(data, filename);
      } else {
        generateJSON(data, filename);
      }

      setExported(true);
      setTimeout(() => setExported(false), 2000);
      toast({
        title: "Exportação concluída!",
        description: `Relatório exportado como ${format.toUpperCase()}.`,
      });
    } catch (error) {
      toast({
        title: "Erro na exportação",
        description: "Não foi possível gerar o relatório.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
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
        className="relative z-10 w-full max-w-md rounded-2xl border border-border/50 bg-card p-6 shadow-lg"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Download className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">
              Exportar Relatórios
            </h2>
            <p className="text-sm text-muted-foreground">
              Escolha o tipo e formato
            </p>
          </div>
        </div>

        {/* Report Type */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-muted-foreground mb-3">
            Tipo de Relatório
          </label>
          <div className="grid grid-cols-2 gap-2">
            {reportOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedReport(option.value)}
                className={`rounded-xl p-3 text-left transition-all border ${
                  selectedReport === option.value
                    ? "bg-primary/10 border-primary/50 text-primary"
                    : "bg-secondary/50 border-border/50 text-muted-foreground hover:bg-secondary"
                }`}
              >
                <p className="font-medium text-sm">{option.label}</p>
                <p className="text-xs opacity-70">{option.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Format */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-muted-foreground mb-3">
            Formato
          </label>
          <div className="grid grid-cols-2 gap-2">
            {formatOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setFormat(option.value)}
                className={`rounded-xl p-3 text-left transition-all border flex items-center gap-3 ${
                  format === option.value
                    ? "bg-primary/10 border-primary/50 text-primary"
                    : "bg-secondary/50 border-border/50 text-muted-foreground hover:bg-secondary"
                }`}
              >
                <option.icon className="h-5 w-5" />
                <div>
                  <p className="font-medium text-sm">{option.label}</p>
                  <p className="text-xs opacity-70">{option.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => onOpenChange(false)}
            className="flex-1 rounded-xl border border-border bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
          >
            Cancelar
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {exported ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Exportado!
              </>
            ) : isExporting ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Download className="h-4 w-4" />
                </motion.div>
                Exportando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Exportar
              </>
            )}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

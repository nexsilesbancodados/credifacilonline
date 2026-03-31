import { useState } from "react";
import { motion } from "framer-motion";
import { Download, FileSpreadsheet, FileText, CheckCircle2, FileIcon } from "lucide-react";
import { useContracts, useInstallments } from "@/hooks/useContracts";
import { useAllClients } from "@/hooks/useClients";
import { useTreasury } from "@/hooks/useTreasury";
import { useToast } from "@/hooks/use-toast";
import { formatLocalDate } from "@/lib/dateUtils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

type ReportType = "contracts" | "clients" | "installments" | "treasury" | "delinquency";
type ExportFormat = "csv" | "json" | "pdf" | "excel";

interface ExportReportsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ExportReports = ({ open, onOpenChange }: ExportReportsProps) => {
  const [selectedReport, setSelectedReport] = useState<ReportType>("contracts");
  const [format, setFormat] = useState<ExportFormat>("excel");
  const [isExporting, setIsExporting] = useState(false);
  const [exported, setExported] = useState(false);

  const { contracts } = useContracts();
  const { data: clients = [] } = useAllClients();
  const { installments } = useInstallments();
  const { transactions } = useTreasury();
  const { toast } = useToast();

  const reportOptions = [
    { value: "contracts" as const, label: "Contratos", description: "Todos os contratos" },
    { value: "clients" as const, label: "Clientes", description: "Lista de clientes" },
    { value: "installments" as const, label: "Parcelas", description: "Cronograma" },
    { value: "treasury" as const, label: "Tesouraria", description: "Movimentações" },
    { value: "delinquency" as const, label: "Inadimplência", description: "Parcelas atrasadas" },
  ];

  const formatOptions = [
    { value: "excel" as const, label: "Excel", icon: FileSpreadsheet, description: "XLSX nativo" },
    { value: "pdf" as const, label: "PDF", icon: FileIcon, description: "Documento" },
    { value: "csv" as const, label: "CSV", icon: FileSpreadsheet, description: "Texto" },
    { value: "json" as const, label: "JSON", icon: FileText, description: "Dados" },
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

  const generateExcel = (data: Record<string, unknown>[], filename: string, title: string) => {
    if (data.length === 0) {
      toast({ title: "Sem dados", description: "Não há dados para exportar.", variant: "destructive" });
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    
    // Auto-size columns
    const maxWidths: number[] = [];
    const headers = Object.keys(data[0]);
    headers.forEach((header, idx) => {
      maxWidths[idx] = header.length;
      data.forEach(row => {
        const value = row[header];
        const len = value ? String(value).length : 0;
        if (len > maxWidths[idx]) maxWidths[idx] = Math.min(len, 50);
      });
    });
    worksheet["!cols"] = maxWidths.map(w => ({ wch: w + 2 }));
    
    XLSX.utils.book_append_sheet(workbook, worksheet, title);
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  };

  const generatePDF = (data: Record<string, unknown>[], filename: string, title: string) => {
    if (data.length === 0) {
      toast({ title: "Sem dados", description: "Não há dados para exportar.", variant: "destructive" });
      return;
    }

    const doc = new jsPDF({ orientation: "landscape" });
    
    // Header
    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text(title, 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 14, 28);
    
    // Table
    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(h => {
      const value = row[h];
      if (value === null || value === undefined) return "";
      if (typeof value === "number") {
        return value.toLocaleString("pt-BR", { minimumFractionDigits: 2 });
      }
      return String(value);
    }));

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 35,
      styles: {
        fontSize: 8,
        cellPadding: 2,
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [245, 247, 250],
      },
      margin: { top: 35 },
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Página ${i} de ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: "center" }
      );
    }

    doc.save(`${filename}.pdf`);
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

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const formatDate = (date: string) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const date = formatLocalDate(new Date());
      let data: Record<string, unknown>[] = [];
      let filename = "";
      let title = "";

      switch (selectedReport) {
        case "contracts":
          data = contracts.map(c => ({
            ID: c.id.slice(0, 8),
            Capital: formatCurrency(c.capital),
            "Taxa Juros": `${c.interest_rate}%`,
            Parcelas: c.installments,
            "Valor Parcela": formatCurrency(c.installment_value),
            "Total": formatCurrency(c.total_amount),
            "Lucro": formatCurrency(c.total_profit),
            Frequência: c.frequency,
            Status: c.status,
            "Data Início": formatDate(c.start_date),
            "1º Vencimento": formatDate(c.first_due_date),
          }));
          filename = `contratos_${date}`;
          title = "Relatório de Contratos";
          break;

        case "clients":
          data = clients.map(c => ({
            Nome: c.name,
            CPF: c.cpf,
            Email: c.email || "-",
            WhatsApp: c.whatsapp || "-",
            Status: c.status,
            Cidade: c.city || "-",
            Estado: c.state || "-",
            "Cadastrado Em": formatDate(c.created_at),
          }));
          filename = `clientes_${date}`;
          title = "Relatório de Clientes";
          break;

        case "installments":
          data = installments.map(i => ({
            "Nº Parcela": `${i.installment_number}/${i.total_installments}`,
            Vencimento: formatDate(i.due_date),
            "Valor Devido": formatCurrency(i.amount_due),
            "Valor Pago": i.amount_paid ? formatCurrency(i.amount_paid) : "-",
            "Data Pgto": i.payment_date ? formatDate(i.payment_date) : "-",
            Status: i.status,
            Multa: i.fine ? formatCurrency(i.fine) : "-",
          }));
          filename = `parcelas_${date}`;
          title = "Relatório de Parcelas";
          break;

        case "treasury":
          data = transactions.map(t => ({
            Data: formatDate(t.date),
            Descrição: t.description,
            Categoria: t.category,
            Tipo: t.type,
            Valor: formatCurrency(t.amount),
          }));
          filename = `tesouraria_${date}`;
          title = "Relatório de Tesouraria";
          break;

        case "delinquency":
          const overdueInstallments = installments.filter(i => i.status === "Atrasado");
          const clientMap = new Map(clients.map(c => [c.id, c]));
          
          data = overdueInstallments.map(i => {
            const client = clientMap.get(i.client_id);
            const daysOverdue = Math.floor(
              (new Date().getTime() - new Date(i.due_date).getTime()) / (1000 * 60 * 60 * 24)
            );
            return {
              Cliente: client?.name || "N/A",
              CPF: client?.cpf || "N/A",
              WhatsApp: client?.whatsapp || "-",
              "Nº Parcela": `${i.installment_number}/${i.total_installments}`,
              Vencimento: formatDate(i.due_date),
              "Dias Atraso": daysOverdue,
              "Valor Devido": formatCurrency(i.amount_due),
              Multa: i.fine ? formatCurrency(i.fine) : "-",
              "Total c/ Multa": formatCurrency(i.amount_due + (i.fine || 0)),
            };
          }).sort((a, b) => (b["Dias Atraso"] as number) - (a["Dias Atraso"] as number));
          
          filename = `inadimplencia_${date}`;
          title = "Relatório de Inadimplência";
          break;
      }

      await new Promise(resolve => setTimeout(resolve, 300));

      switch (format) {
        case "csv":
          generateCSV(data, filename);
          break;
        case "json":
          generateJSON(data, filename);
          break;
        case "excel":
          generateExcel(data, filename, title);
          break;
        case "pdf":
          generatePDF(data, filename, title);
          break;
      }

      setExported(true);
      setTimeout(() => setExported(false), 2000);
      toast({
        title: "Exportação concluída!",
        description: `Relatório exportado como ${format.toUpperCase()}.`,
      });
    } catch (error) {
      console.error("Export error:", error);
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
        className="relative z-10 w-full max-w-lg rounded-2xl border border-border/50 bg-card p-6 shadow-lg"
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
          <div className="grid grid-cols-3 gap-2">
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
            Formato de Exportação
          </label>
          <div className="grid grid-cols-4 gap-2">
            {formatOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setFormat(option.value)}
                className={`rounded-xl p-3 text-center transition-all border ${
                  format === option.value
                    ? "bg-primary/10 border-primary/50 text-primary"
                    : "bg-secondary/50 border-border/50 text-muted-foreground hover:bg-secondary"
                }`}
              >
                <option.icon className="h-5 w-5 mx-auto mb-1" />
                <p className="font-medium text-sm">{option.label}</p>
                <p className="text-xs opacity-70">{option.description}</p>
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

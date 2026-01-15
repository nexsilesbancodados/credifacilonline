import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useClients } from "@/hooks/useClients";
import { useContracts, useInstallments } from "@/hooks/useContracts";
import { useTreasury } from "@/hooks/useTreasury";
import { PermissionGate } from "@/components/auth/PermissionGate";
import {
  Download,
  Database,
  FileJson,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  Shield,
} from "lucide-react";
import * as XLSX from 'xlsx';

interface ExportOption {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
}

const exportOptions: ExportOption[] = [
  { id: 'clients', label: 'Clientes', description: 'Dados cadastrais e scores', icon: Database },
  { id: 'contracts', label: 'Contratos', description: 'Todos os contratos e condições', icon: Database },
  { id: 'installments', label: 'Parcelas', description: 'Histórico de pagamentos', icon: Database },
  { id: 'treasury', label: 'Tesouraria', description: 'Transações financeiras', icon: Database },
];

export function ExportData() {
  const [open, setOpen] = useState(false);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [format, setFormat] = useState<'json' | 'csv' | 'xlsx'>('xlsx');
  const [isExporting, setIsExporting] = useState(false);
  const [exportComplete, setExportComplete] = useState(false);

  const { clients } = useClients();
  const { contracts } = useContracts();
  const { installments } = useInstallments();
  const { transactions } = useTreasury();

  const toggleTable = (tableId: string) => {
    setSelectedTables(prev =>
      prev.includes(tableId)
        ? prev.filter(t => t !== tableId)
        : [...prev, tableId]
    );
  };

  const selectAll = () => {
    if (selectedTables.length === exportOptions.length) {
      setSelectedTables([]);
    } else {
      setSelectedTables(exportOptions.map(o => o.id));
    }
  };

  const getDataForExport = () => {
    const data: Record<string, any[]> = {};

    if (selectedTables.includes('clients')) {
      data.clients = clients || [];
    }
    if (selectedTables.includes('contracts')) {
      data.contracts = contracts || [];
    }
    if (selectedTables.includes('installments')) {
      data.installments = installments || [];
    }
    if (selectedTables.includes('treasury')) {
      data.treasury = transactions || [];
    }

    return data;
  };

  const exportJSON = (data: Record<string, any[]>) => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = (data: Record<string, any[]>) => {
    Object.entries(data).forEach(([tableName, records]) => {
      if (records.length === 0) return;

      const headers = Object.keys(records[0]);
      const csvContent = [
        headers.join(','),
        ...records.map(record =>
          headers.map(h => {
            const value = record[h];
            if (value === null || value === undefined) return '';
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${tableName}-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    });
  };

  const exportXLSX = (data: Record<string, any[]>) => {
    const workbook = XLSX.utils.book_new();

    Object.entries(data).forEach(([tableName, records]) => {
      if (records.length === 0) return;
      const worksheet = XLSX.utils.json_to_sheet(records);
      XLSX.utils.book_append_sheet(workbook, worksheet, tableName);
    });

    XLSX.writeFile(workbook, `backup-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExport = async () => {
    if (selectedTables.length === 0) return;

    setIsExporting(true);
    setExportComplete(false);

    try {
      // Simulate some processing time
      await new Promise(resolve => setTimeout(resolve, 1000));

      const data = getDataForExport();

      switch (format) {
        case 'json':
          exportJSON(data);
          break;
        case 'csv':
          exportCSV(data);
          break;
        case 'xlsx':
          exportXLSX(data);
          break;
      }

      setExportComplete(true);
      setTimeout(() => {
        setExportComplete(false);
      }, 3000);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <PermissionGate permission="canExportData">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            Backup e Exportação
          </CardTitle>
          <CardDescription>
            Exporte seus dados para backup ou análise externa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Download className="h-4 w-4 mr-2" />
                Exportar Dados
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  Exportar Dados
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Table Selection */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium">Selecione os dados</Label>
                    <Button variant="ghost" size="sm" onClick={selectAll}>
                      {selectedTables.length === exportOptions.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {exportOptions.map((option, index) => (
                      <motion.div
                        key={option.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => toggleTable(option.id)}
                        className={`
                          flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                          ${selectedTables.includes(option.id) 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                          }
                        `}
                      >
                        <Checkbox
                          checked={selectedTables.includes(option.id)}
                          onCheckedChange={() => toggleTable(option.id)}
                        />
                        <option.icon className="h-4 w-4 text-muted-foreground" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">{option.label}</p>
                          <p className="text-xs text-muted-foreground">{option.description}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Format Selection */}
                <div className="space-y-2">
                  <Label className="font-medium">Formato de exportação</Label>
                  <Select value={format} onValueChange={(v) => setFormat(v as any)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="xlsx">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4" />
                          Excel (.xlsx)
                        </div>
                      </SelectItem>
                      <SelectItem value="json">
                        <div className="flex items-center gap-2">
                          <FileJson className="h-4 w-4" />
                          JSON (.json)
                        </div>
                      </SelectItem>
                      <SelectItem value="csv">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4" />
                          CSV (múltiplos arquivos)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Security Notice */}
                <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                  <div className="flex items-start gap-2">
                    <Shield className="h-4 w-4 text-yellow-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                        Dados Sensíveis
                      </p>
                      <p className="text-xs text-muted-foreground">
                        O arquivo exportado contém dados sensíveis. Armazene em local seguro.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleExport}
                    disabled={selectedTables.length === 0 || isExporting}
                    className={exportComplete ? 'bg-green-600 hover:bg-green-700' : ''}
                  >
                    {isExporting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Exportando...
                      </>
                    ) : exportComplete ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Concluído!
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Exportar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Quick Stats */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{clients?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Clientes</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{contracts?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Contratos</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{installments?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Parcelas</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold">{transactions?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Transações</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </PermissionGate>
  );
}

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import {
  Upload,
  Database,
  FileJson,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  Shield,
  AlertTriangle,
  FileUp,
  X,
} from "lucide-react";
import * as XLSX from 'xlsx';

interface ImportOption {
  id: string;
  label: string;
  tableName: string;
  count: number;
}

interface BackupData {
  clients?: any[];
  contracts?: any[];
  installments?: any[];
  treasury?: any[];
}

export function ImportData() {
  const [open, setOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importComplete, setImportComplete] = useState(false);
  const [backupData, setBackupData] = useState<BackupData | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const [importOptions, setImportOptions] = useState<ImportOption[]>([]);
  const [importProgress, setImportProgress] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const resetState = () => {
    setBackupData(null);
    setFileName("");
    setSelectedTables([]);
    setImportOptions([]);
    setImportComplete(false);
    setImportProgress("");
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    try {
      let data: BackupData = {};

      if (fileExtension === 'json') {
        const text = await file.text();
        data = JSON.parse(text);
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        
        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          // Map sheet names to data keys
          const keyMap: Record<string, keyof BackupData> = {
            'clients': 'clients',
            'clientes': 'clients',
            'contracts': 'contracts',
            'contratos': 'contracts',
            'installments': 'installments',
            'parcelas': 'installments',
            'treasury': 'treasury',
            'tesouraria': 'treasury',
            'treasury_transactions': 'treasury',
          };
          
          const dataKey = keyMap[sheetName.toLowerCase()];
          if (dataKey) {
            data[dataKey] = jsonData;
          }
        });
      } else {
        toast({
          title: "Formato não suportado",
          description: "Por favor, use arquivos .json ou .xlsx",
          variant: "destructive",
        });
        return;
      }

      setBackupData(data);
      
      // Build import options based on data
      const options: ImportOption[] = [];
      if (data.clients?.length) {
        options.push({ id: 'clients', label: 'Clientes', tableName: 'clients', count: data.clients.length });
      }
      if (data.contracts?.length) {
        options.push({ id: 'contracts', label: 'Contratos', tableName: 'contracts', count: data.contracts.length });
      }
      if (data.installments?.length) {
        options.push({ id: 'installments', label: 'Parcelas', tableName: 'installments', count: data.installments.length });
      }
      if (data.treasury?.length) {
        options.push({ id: 'treasury', label: 'Tesouraria', tableName: 'treasury_transactions', count: data.treasury.length });
      }

      setImportOptions(options);
      setSelectedTables(options.map(o => o.id));

      if (options.length === 0) {
        toast({
          title: "Nenhum dado encontrado",
          description: "O arquivo não contém dados reconhecíveis para importação.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error parsing file:', error);
      toast({
        title: "Erro ao ler arquivo",
        description: "Não foi possível processar o arquivo. Verifique se o formato está correto.",
        variant: "destructive",
      });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const toggleTable = (tableId: string) => {
    setSelectedTables(prev =>
      prev.includes(tableId)
        ? prev.filter(t => t !== tableId)
        : [...prev, tableId]
    );
  };

  const handleImportClick = () => {
    setConfirmOpen(true);
  };

  const handleImport = async () => {
    if (!backupData || !user || selectedTables.length === 0) return;

    setConfirmOpen(false);
    setIsImporting(true);
    setImportComplete(false);

    try {
      const operatorId = user.id;

      // Import clients first (as other tables depend on client IDs)
      if (selectedTables.includes('clients') && backupData.clients?.length) {
        setImportProgress("Importando clientes...");
        
        for (const client of backupData.clients) {
          const clientData = {
            name: client.name,
            cpf: client.cpf,
            email: client.email || null,
            whatsapp: client.whatsapp || null,
            cep: client.cep || null,
            street: client.street || null,
            number: client.number || null,
            complement: client.complement || null,
            neighborhood: client.neighborhood || null,
            city: client.city || null,
            state: client.state || null,
            status: client.status || 'Ativo',
            operator_id: operatorId,
          };

          const { error } = await supabase
            .from('clients')
            .upsert(clientData, { onConflict: 'cpf' });

          if (error) {
            console.error('Error importing client:', error);
          }
        }
      }

      // Import contracts
      if (selectedTables.includes('contracts') && backupData.contracts?.length) {
        setImportProgress("Importando contratos...");
        
        for (const contract of backupData.contracts) {
          // Find client by CPF if client_id is not a valid UUID
          let clientId = contract.client_id;
          
          if (contract.client_cpf) {
            const { data: clientData } = await supabase
              .from('clients')
              .select('id')
              .eq('cpf', contract.client_cpf)
              .single();
            
            if (clientData) {
              clientId = clientData.id;
            }
          }

          if (!clientId) continue;

          const contractData = {
            client_id: clientId,
            capital: Number(contract.capital),
            interest_rate: Number(contract.interest_rate),
            installments: Number(contract.installments),
            installment_value: Number(contract.installment_value),
            total_amount: Number(contract.total_amount),
            total_profit: Number(contract.total_profit),
            frequency: contract.frequency || 'mensal',
            daily_type: contract.daily_type || null,
            start_date: contract.start_date,
            first_due_date: contract.first_due_date,
            status: contract.status || 'Ativo',
            operator_id: operatorId,
          };

          const { error } = await supabase
            .from('contracts')
            .insert(contractData);

          if (error) {
            console.error('Error importing contract:', error);
          }
        }
      }

      // Import treasury transactions
      if (selectedTables.includes('treasury') && backupData.treasury?.length) {
        setImportProgress("Importando tesouraria...");
        
        for (const transaction of backupData.treasury) {
          const transactionData = {
            type: transaction.type,
            category: transaction.category,
            amount: Number(transaction.amount),
            description: transaction.description,
            date: transaction.date,
            operator_id: operatorId,
          };

          const { error } = await supabase
            .from('treasury_transactions')
            .insert(transactionData);

          if (error) {
            console.error('Error importing transaction:', error);
          }
        }
      }

      setImportComplete(true);
      setImportProgress("");
      
      // Invalidate all queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['installments'] });
      queryClient.invalidateQueries({ queryKey: ['treasury'] });

      toast({
        title: "Importação concluída!",
        description: "Os dados foram importados com sucesso.",
      });

      setTimeout(() => {
        resetState();
        setOpen(false);
      }, 2000);
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Erro na importação",
        description: "Ocorreu um erro ao importar os dados. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <PermissionGate permission="canExportData">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Restaurar Backup
          </CardTitle>
          <CardDescription>
            Importe dados de um backup anterior (JSON ou Excel)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetState(); }}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                Importar Backup
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-primary" />
                  Importar Backup
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* File Upload */}
                <div className="space-y-3">
                  <Label className="font-medium">Selecione o arquivo de backup</Label>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json,.xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {!backupData ? (
                    <motion.div
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    >
                      <FileUp className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                      <p className="text-sm font-medium text-foreground">
                        Clique para selecionar arquivo
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Formatos aceitos: JSON, XLSX
                      </p>
                    </motion.div>
                  ) : (
                    <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                      <div className="flex items-center gap-3">
                        {fileName.endsWith('.json') ? (
                          <FileJson className="h-8 w-8 text-primary" />
                        ) : (
                          <FileSpreadsheet className="h-8 w-8 text-success" />
                        )}
                        <div>
                          <p className="font-medium text-sm">{fileName}</p>
                          <p className="text-xs text-muted-foreground">
                            {importOptions.reduce((acc, o) => acc + o.count, 0)} registros encontrados
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={resetState}
                        className="h-8 w-8"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Data Selection */}
                <AnimatePresence>
                  {importOptions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3"
                    >
                      <Label className="font-medium">Dados para importar</Label>

                      <div className="space-y-2">
                        {importOptions.map((option, index) => (
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
                            <Database className="h-4 w-4 text-muted-foreground" />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{option.label}</p>
                            </div>
                            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                              {option.count} registros
                            </span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Warning Notice */}
                {backupData && (
                  <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                          Atenção
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Dados duplicados serão atualizados. Esta ação não pode ser desfeita.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Progress */}
                {importProgress && (
                  <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 text-primary animate-spin" />
                      <p className="text-sm text-primary">{importProgress}</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => { setOpen(false); resetState(); }}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleImportClick}
                    disabled={selectedTables.length === 0 || isImporting || !backupData}
                    className={importComplete ? 'bg-green-600 hover:bg-green-700' : ''}
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Importando...
                      </>
                    ) : importComplete ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Concluído!
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Importar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Confirmar Importação
            </AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a importar:
              <ul className="mt-2 space-y-1">
                {selectedTables.map(tableId => {
                  const option = importOptions.find(o => o.id === tableId);
                  return option ? (
                    <li key={tableId} className="flex items-center gap-2">
                      <CheckCircle2 className="h-3 w-3 text-success" />
                      {option.label}: {option.count} registros
                    </li>
                  ) : null;
                })}
              </ul>
              <p className="mt-3 text-yellow-600 dark:text-yellow-400 font-medium">
                Esta ação não pode ser desfeita. Deseja continuar?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleImport}>
              Confirmar Importação
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PermissionGate>
  );
}

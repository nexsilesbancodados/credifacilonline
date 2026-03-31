import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, User, Phone, MapPin, Loader2, FileText, RefreshCw, Calendar, Percent, DollarSign, AlertTriangle } from "lucide-react";
import { useClients, Client } from "@/hooks/useClients";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, addMonths } from "date-fns";
import { advanceDateByFrequency, formatLocalDate, parseLocalDate } from "@/lib/dateUtils";
import { saveContractPDFToDocuments } from "@/lib/saveContractDocument";
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

interface Contract {
  id: string;
  capital: number;
  interest_rate: number;
  installments: number;
  installment_value: number;
  total_amount: number;
  total_profit: number;
  frequency: string;
  start_date: string;
  first_due_date: string;
  status: string;
  fine_percentage?: number;
  daily_interest_rate?: number;
  daily_type?: string;
}

interface EditDossierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
  contract: Contract | null;
}

export const EditDossierDialog = ({ open, onOpenChange, client, contract }: EditDossierDialogProps) => {
  const { updateClient, isUpdating } = useClients();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("cliente");
  const [isSavingContract, setIsSavingContract] = useState(false);
  const [isRenewing, setIsRenewing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  
  const [clientData, setClientData] = useState({
    name: "",
    cpf: "",
    email: "",
    whatsapp: "",
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
    status: "Ativo" as "Ativo" | "Atraso" | "Quitado",
  });

  const [contractData, setContractData] = useState({
    capital: 0,
    interest_rate: 0,
    installments: 1,
    frequency: "mensal",
    first_due_date: "",
    fine_percentage: 2,
    daily_interest_rate: 0.033,
    daily_type: "",
  });

  // Renewal form data
  const [renewalData, setRenewalData] = useState({
    capital: 0,
    interest_rate: 10,
    installments: 12,
    frequency: "mensal",
    first_due_date: formatLocalDate(addMonths(new Date(), 1)),
  });

  useEffect(() => {
    if (client) {
      setClientData({
        name: client.name || "",
        cpf: client.cpf || "",
        email: client.email || "",
        whatsapp: client.whatsapp || "",
        cep: client.cep || "",
        street: client.street || "",
        number: client.number || "",
        complement: client.complement || "",
        neighborhood: client.neighborhood || "",
        city: client.city || "",
        state: client.state || "",
        status: client.status || "Ativo",
      });
    }
  }, [client]);

  useEffect(() => {
    if (contract) {
      setContractData({
        capital: Number(contract.capital) || 0,
        interest_rate: Number(contract.interest_rate) || 0,
        installments: contract.installments || 1,
        frequency: contract.frequency || "mensal",
        first_due_date: contract.first_due_date || "",
        fine_percentage: Number(contract.fine_percentage) || 2,
        daily_interest_rate: Number(contract.daily_interest_rate) || 0.033,
        daily_type: contract.daily_type || "",
      });
      // Set renewal capital to previous capital as default
      setRenewalData(prev => ({
        ...prev,
        capital: Number(contract.capital) || 0,
      }));
    }
  }, [contract]);

  const handleSaveClient = () => {
    if (!client) return;
    
    updateClient({
      id: client.id,
      ...clientData,
    });
    toast({
      title: "Cliente atualizado!",
      description: "Os dados foram salvos com sucesso.",
    });
  };

  const handleSaveContract = async () => {
    if (!contract || !user || !client) return;
    
    setIsSavingContract(true);
    try {
      // Calculate new values
      const capital = contractData.capital;
      const rate = contractData.interest_rate / 100;
      const installmentValue = (capital * (1 + rate)) / contractData.installments;
      const totalAmount = installmentValue * contractData.installments;
      const totalProfit = totalAmount - capital;

      // Update contract
      const { error: contractError } = await supabase
        .from("contracts")
        .update({
          capital: contractData.capital,
          interest_rate: contractData.interest_rate,
          installments: contractData.installments,
          installment_value: installmentValue,
          total_amount: totalAmount,
          total_profit: totalProfit,
          frequency: contractData.frequency,
          first_due_date: contractData.first_due_date,
          fine_percentage: contractData.fine_percentage,
          daily_interest_rate: contractData.daily_interest_rate,
          daily_type: contractData.daily_type || null,
        })
        .eq("id", contract.id);

      if (contractError) throw contractError;

      // Delete existing unpaid installments and recreate them
      const { error: deleteError } = await supabase
        .from("installments")
        .delete()
        .eq("contract_id", contract.id)
        .neq("status", "Pago");

      if (deleteError) throw deleteError;

      // Get count of paid installments
      const { data: paidInstallments, error: paidError } = await supabase
        .from("installments")
        .select("installment_number")
        .eq("contract_id", contract.id)
        .eq("status", "Pago");

      if (paidError) throw paidError;

      const paidCount = paidInstallments?.length || 0;
      const remainingInstallments = contractData.installments - paidCount;

      if (remainingInstallments > 0) {
        // Generate new installments starting after paid ones
        const newInstallments = [];
        let currentDueDate = new Date(contractData.first_due_date);

        // Skip to the correct start date based on paid installments
        for (let i = 0; i < paidCount; i++) {
          currentDueDate = advanceDateByFrequency(currentDueDate, contractData.frequency);
        }

        for (let i = paidCount + 1; i <= contractData.installments; i++) {
          newInstallments.push({
            contract_id: contract.id,
            client_id: client.id,
            operator_id: user.id,
            installment_number: i,
            total_installments: contractData.installments,
            due_date: formatLocalDate(currentDueDate),
            amount_due: installmentValue,
            status: "Pendente",
          });

          currentDueDate = advanceDateByFrequency(currentDueDate, contractData.frequency);
        }

        if (newInstallments.length > 0) {
          const { error: insertError } = await supabase
            .from("installments")
            .insert(newInstallments);

          if (insertError) throw insertError;
        }
      }

      // Log activity
      await supabase.from("activity_log").insert({
        operator_id: user.id,
        client_id: client.id,
        contract_id: contract.id,
        type: "contract_updated",
        description: `Contrato editado - R$ ${capital.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} em ${contractData.installments}x`,
      });

      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["installments"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      
      toast({
        title: "Contrato atualizado!",
        description: "Os dados do contrato e parcelas foram salvos.",
      });
      
      onOpenChange(false);
    } catch (error: unknown) {
      toast({
        title: "Erro ao atualizar contrato",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsSavingContract(false);
    }
  };

  const handleRenewContract = async () => {
    if (!client || !user) return;
    
    setIsRenewing(true);
    try {
      const capital = renewalData.capital;
      const rate = renewalData.interest_rate / 100;
      const installmentValue = (capital * (1 + rate)) / renewalData.installments;
      const totalAmount = installmentValue * renewalData.installments;
      const totalProfit = totalAmount - capital;
      const finePercentage = 10;
      const dailyInterestRate = 2;

      // Create new contract
      const { data: newContract, error: contractError } = await supabase
        .from("contracts")
        .insert({
          client_id: client.id,
          operator_id: user.id,
          capital,
          interest_rate: renewalData.interest_rate,
          installments: renewalData.installments,
          installment_value: installmentValue,
          total_amount: totalAmount,
          total_profit: totalProfit,
          frequency: renewalData.frequency,
          start_date: formatLocalDate(new Date()),
          first_due_date: renewalData.first_due_date,
          status: "Ativo",
          fine_percentage: finePercentage,
          daily_interest_rate: dailyInterestRate,
        })
        .select()
        .single();

      if (contractError) throw contractError;

      // Generate installments
      const installmentsToInsert = [];
      let currentDueDate = new Date(renewalData.first_due_date);

      for (let i = 1; i <= renewalData.installments; i++) {
        installmentsToInsert.push({
          contract_id: newContract.id,
          client_id: client.id,
          operator_id: user.id,
          installment_number: i,
          total_installments: renewalData.installments,
          due_date: format(currentDueDate, "yyyy-MM-dd"),
          amount_due: installmentValue,
          status: "Pendente",
        });

        currentDueDate = advanceDateByFrequency(currentDueDate, renewalData.frequency);
      }

      const { error: installmentsError } = await supabase
        .from("installments")
        .insert(installmentsToInsert);

      if (installmentsError) throw installmentsError;

      // Update client status to Ativo
      await supabase
        .from("clients")
        .update({ status: "Ativo" })
        .eq("id", client.id);

      // Log activity
      await supabase.from("activity_log").insert({
        operator_id: user.id,
        client_id: client.id,
        contract_id: newContract.id,
        type: "contract_renewed",
        description: `Empréstimo renovado: R$ ${capital.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} em ${renewalData.installments}x`,
        metadata: {
          capital,
          installments: renewalData.installments,
          interest_rate: renewalData.interest_rate,
        },
      });

      // Create treasury entry for the loan disbursement
      await supabase.from("treasury_transactions").insert({
        operator_id: user.id,
        type: "saida",
        category: "Empréstimo",
        description: `Renovação - ${client.name}`,
        amount: capital,
        date: format(new Date(), "yyyy-MM-dd"),
        reference_type: "contract",
        reference_id: newContract.id,
      });

      // Generate and save contract PDF to documents
      await saveContractPDFToDocuments({
        contractId: newContract.id,
        clientId: client.id,
        userId: user.id,
        contractData: {
          contractId: newContract.id,
          creditorName: "Credifacil Global",
          clientName: client.name,
          clientCpf: client.cpf,
          startDate: format(new Date(), "yyyy-MM-dd"),
          capital,
          installments: renewalData.installments,
          installmentValue,
          frequency: renewalData.frequency,
          firstDueDate: renewalData.first_due_date,
          finePercentage,
          dailyInterestRate,
          city: client.city || undefined,
          state: client.state || undefined,
        },
      });

      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["installments"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["treasury"] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });

      toast({
        title: "Empréstimo renovado!",
        description: `Novo contrato de R$ ${capital.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} criado com sucesso.`,
      });

      onOpenChange(false);
    } catch (error: unknown) {
      toast({
        title: "Erro ao renovar empréstimo",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsRenewing(false);
    }
  };

  // Fetch address from CEP
  const fetchAddress = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        toast({
          title: "CEP não encontrado",
          description: "Verifique o CEP digitado e tente novamente.",
          variant: "destructive",
        });
        return;
      }
      
      setClientData(prev => ({
        ...prev,
        street: data.logradouro || prev.street,
        neighborhood: data.bairro || prev.neighborhood,
        city: data.localidade || prev.city,
        state: data.uf || prev.state,
      }));
      
      toast({
        title: "Endereço encontrado!",
        description: `${data.logradouro}, ${data.bairro}`,
      });
    } catch {
      toast({
        title: "Erro ao buscar CEP",
        description: "Não foi possível conectar ao serviço. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const isClientQuitado = client?.status === "Quitado";

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
          className="relative z-10 w-full max-w-3xl rounded-2xl border border-border/50 bg-card p-6 shadow-lg max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-foreground">
                  Editar Dossiê
                </h2>
                <p className="text-sm text-muted-foreground">
                  {client?.name}
                </p>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="cliente" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Cliente
              </TabsTrigger>
              <TabsTrigger value="contrato" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Contrato
              </TabsTrigger>
              <TabsTrigger value="renovar" className="flex items-center gap-2" disabled={!isClientQuitado}>
                <RefreshCw className="h-4 w-4" />
                Renovar
              </TabsTrigger>
            </TabsList>

            {/* Cliente Tab */}
            <TabsContent value="cliente" className="space-y-6">
              {/* Personal Info */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Dados Pessoais
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Nome</label>
                    <input
                      type="text"
                      value={clientData.name}
                      onChange={(e) => setClientData({ ...clientData, name: e.target.value })}
                      className="w-full h-11 rounded-xl border border-border bg-secondary/50 px-4 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">CPF</label>
                    <input
                      type="text"
                      value={clientData.cpf}
                      onChange={(e) => setClientData({ ...clientData, cpf: e.target.value })}
                      className="w-full h-11 rounded-xl border border-border bg-secondary/50 px-4 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Status</label>
                    <select
                      value={clientData.status}
                      onChange={(e) => setClientData({ ...clientData, status: e.target.value as any })}
                      className="w-full h-11 rounded-xl border border-border bg-secondary/50 px-4 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="Ativo">Ativo</option>
                      <option value="Atraso">Em Atraso</option>
                      <option value="Quitado">Quitado</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Contato
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">WhatsApp</label>
                    <input
                      type="text"
                      value={clientData.whatsapp}
                      onChange={(e) => setClientData({ ...clientData, whatsapp: e.target.value })}
                      placeholder="(00) 00000-0000"
                      className="w-full h-11 rounded-xl border border-border bg-secondary/50 px-4 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Email</label>
                    <input
                      type="email"
                      value={clientData.email}
                      onChange={(e) => setClientData({ ...clientData, email: e.target.value })}
                      className="w-full h-11 rounded-xl border border-border bg-secondary/50 px-4 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Endereço
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">CEP</label>
                    <input
                      type="text"
                      value={clientData.cep}
                      onChange={(e) => {
                        setClientData({ ...clientData, cep: e.target.value });
                        if (e.target.value.replace(/\D/g, "").length === 8) {
                          fetchAddress(e.target.value);
                        }
                      }}
                      placeholder="00000-000"
                      className="w-full h-11 rounded-xl border border-border bg-secondary/50 px-4 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Rua</label>
                    <input
                      type="text"
                      value={clientData.street}
                      onChange={(e) => setClientData({ ...clientData, street: e.target.value })}
                      className="w-full h-11 rounded-xl border border-border bg-secondary/50 px-4 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Número</label>
                    <input
                      type="text"
                      value={clientData.number}
                      onChange={(e) => setClientData({ ...clientData, number: e.target.value })}
                      className="w-full h-11 rounded-xl border border-border bg-secondary/50 px-4 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Complemento</label>
                    <input
                      type="text"
                      value={clientData.complement}
                      onChange={(e) => setClientData({ ...clientData, complement: e.target.value })}
                      placeholder="Apto, Bloco, etc."
                      className="w-full h-11 rounded-xl border border-border bg-secondary/50 px-4 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Bairro</label>
                    <input
                      type="text"
                      value={clientData.neighborhood}
                      onChange={(e) => setClientData({ ...clientData, neighborhood: e.target.value })}
                      className="w-full h-11 rounded-xl border border-border bg-secondary/50 px-4 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Cidade</label>
                    <input
                      type="text"
                      value={clientData.city}
                      onChange={(e) => setClientData({ ...clientData, city: e.target.value })}
                      className="w-full h-11 rounded-xl border border-border bg-secondary/50 px-4 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Estado</label>
                    <input
                      type="text"
                      value={clientData.state}
                      onChange={(e) => setClientData({ ...clientData, state: e.target.value })}
                      maxLength={2}
                      className="w-full h-11 rounded-xl border border-border bg-secondary/50 px-4 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Save Client Button */}
              <div className="flex gap-3 pt-4 border-t border-border/50">
                <button
                  onClick={() => onOpenChange(false)}
                  className="flex-1 rounded-xl border border-border bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
                >
                  Cancelar
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSaveClient}
                  disabled={isUpdating}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {isUpdating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Salvar Cliente
                </motion.button>
              </div>
            </TabsContent>

            {/* Contrato Tab */}
            <TabsContent value="contrato" className="space-y-6">
              {contract ? (
                <>
                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Valores do Empréstimo
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Capital (R$)</label>
                        <input
                          type="number"
                          value={contractData.capital}
                          onChange={(e) => setContractData({ ...contractData, capital: Number(e.target.value) })}
                          className="w-full h-11 rounded-xl border border-border bg-secondary/50 px-4 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Taxa de Juros (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={contractData.interest_rate}
                          onChange={(e) => setContractData({ ...contractData, interest_rate: Number(e.target.value) })}
                          className="w-full h-11 rounded-xl border border-border bg-secondary/50 px-4 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Parcelas</label>
                        <input
                          type="number"
                          value={contractData.installments}
                          onChange={(e) => setContractData({ ...contractData, installments: Number(e.target.value) })}
                          className="w-full h-11 rounded-xl border border-border bg-secondary/50 px-4 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Frequência</label>
                        <select
                          value={contractData.frequency}
                          onChange={(e) => setContractData({ ...contractData, frequency: e.target.value })}
                          className="w-full h-11 rounded-xl border border-border bg-secondary/50 px-4 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="diario">Diário</option>
                          <option value="semanal">Semanal</option>
                          <option value="quinzenal">Quinzenal</option>
                          <option value="mensal">Mensal</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Datas
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Primeiro Vencimento</label>
                        <input
                          type="date"
                          value={contractData.first_due_date}
                          onChange={(e) => setContractData({ ...contractData, first_due_date: e.target.value })}
                          className="w-full h-11 rounded-xl border border-border bg-secondary/50 px-4 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      {contractData.frequency === "diario" && (
                        <div>
                          <label className="block text-sm font-medium text-muted-foreground mb-1">Tipo de Cobrança</label>
                          <select
                            value={contractData.daily_type}
                            onChange={(e) => setContractData({ ...contractData, daily_type: e.target.value })}
                            className="w-full h-11 rounded-xl border border-border bg-secondary/50 px-4 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                          >
                            <option value="">Todos os dias</option>
                            <option value="weekdays">Dias úteis</option>
                            <option value="weekdays_saturday">Dias úteis + Sábado</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                      <Percent className="h-4 w-4" />
                      Multa e Juros de Atraso
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Multa (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={contractData.fine_percentage}
                          onChange={(e) => setContractData({ ...contractData, fine_percentage: Number(e.target.value) })}
                          className="w-full h-11 rounded-xl border border-border bg-secondary/50 px-4 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Juros Diário (%)</label>
                        <input
                          type="number"
                          step="0.001"
                          value={contractData.daily_interest_rate}
                          onChange={(e) => setContractData({ ...contractData, daily_interest_rate: Number(e.target.value) })}
                          className="w-full h-11 rounded-xl border border-border bg-secondary/50 px-4 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Save Contract Button */}
                  <div className="flex gap-3 pt-4 border-t border-border/50">
                    <button
                      onClick={() => onOpenChange(false)}
                      className="flex-1 rounded-xl border border-border bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
                    >
                      Cancelar
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowConfirmDialog(true)}
                      disabled={isSavingContract}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                    >
                      {isSavingContract ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Salvar Contrato
                    </motion.button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum contrato ativo encontrado.</p>
                </div>
              )}
            </TabsContent>

            {/* Renovar Tab */}
            <TabsContent value="renovar" className="space-y-6">
              {isClientQuitado ? (
                <>
                  <div className="rounded-xl bg-success/10 border border-success/30 p-4">
                    <div className="flex items-center gap-3">
                      <RefreshCw className="h-5 w-5 text-success" />
                      <div>
                        <h4 className="font-medium text-success">Cliente Quitado</h4>
                        <p className="text-sm text-muted-foreground">
                          Este cliente quitou o empréstimo anterior. Você pode criar um novo contrato.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Novo Empréstimo
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Capital (R$)</label>
                        <input
                          type="number"
                          value={renewalData.capital}
                          onChange={(e) => setRenewalData({ ...renewalData, capital: Number(e.target.value) })}
                          className="w-full h-11 rounded-xl border border-border bg-secondary/50 px-4 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Taxa de Juros (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={renewalData.interest_rate}
                          onChange={(e) => setRenewalData({ ...renewalData, interest_rate: Number(e.target.value) })}
                          className="w-full h-11 rounded-xl border border-border bg-secondary/50 px-4 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Parcelas</label>
                        <input
                          type="number"
                          value={renewalData.installments}
                          onChange={(e) => setRenewalData({ ...renewalData, installments: Number(e.target.value) })}
                          className="w-full h-11 rounded-xl border border-border bg-secondary/50 px-4 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Frequência</label>
                        <select
                          value={renewalData.frequency}
                          onChange={(e) => setRenewalData({ ...renewalData, frequency: e.target.value })}
                          className="w-full h-11 rounded-xl border border-border bg-secondary/50 px-4 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="diario">Diário</option>
                          <option value="semanal">Semanal</option>
                          <option value="quinzenal">Quinzenal</option>
                          <option value="mensal">Mensal</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-muted-foreground mb-1">Primeiro Vencimento</label>
                        <input
                          type="date"
                          value={renewalData.first_due_date}
                          onChange={(e) => setRenewalData({ ...renewalData, first_due_date: e.target.value })}
                          className="w-full h-11 rounded-xl border border-border bg-secondary/50 px-4 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="rounded-xl bg-secondary/50 p-4">
                    <h4 className="text-sm font-semibold text-muted-foreground mb-3">Resumo</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Valor da Parcela:</span>
                        <p className="font-semibold text-foreground">
                          R$ {((renewalData.capital * (1 + renewalData.interest_rate / 100)) / renewalData.installments).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Total a Receber:</span>
                        <p className="font-semibold text-foreground">
                          R$ {(renewalData.capital * (1 + renewalData.interest_rate / 100)).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Lucro:</span>
                        <p className="font-semibold text-success">
                          R$ {(renewalData.capital * renewalData.interest_rate / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Renew Button */}
                  <div className="flex gap-3 pt-4 border-t border-border/50">
                    <button
                      onClick={() => onOpenChange(false)}
                      className="flex-1 rounded-xl border border-border bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
                    >
                      Cancelar
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleRenewContract}
                      disabled={isRenewing || renewalData.capital <= 0}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-success px-4 py-3 text-sm font-medium text-success-foreground hover:bg-success/90 transition-colors disabled:opacity-50"
                    >
                      {isRenewing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      Renovar Empréstimo
                    </motion.button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <RefreshCw className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Disponível apenas para clientes quitados.</p>
                  <p className="text-sm mt-1">O cliente precisa quitar o empréstimo atual para renovar.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Confirmation Dialog */}
        <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <AlertDialogContent className="rounded-2xl border border-border/50">
            <AlertDialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
                  <AlertTriangle className="h-5 w-5 text-warning" />
                </div>
                <AlertDialogTitle className="font-display">Confirmar Alterações</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-muted-foreground">
                Você está prestes a editar o contrato. As parcelas não pagas serão recalculadas com os novos valores.
                <div className="mt-4 p-3 rounded-xl bg-secondary/50 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Capital:</span>
                    <span className="font-medium text-foreground">
                      R$ {contractData.capital.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxa de Juros:</span>
                    <span className="font-medium text-foreground">{contractData.interest_rate}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Parcelas:</span>
                    <span className="font-medium text-foreground">{contractData.installments}x</span>
                  </div>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleSaveContract}
                className="rounded-xl bg-primary hover:bg-primary/90"
              >
                {isSavingContract ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Confirmar Alteração
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AnimatePresence>
  );
};

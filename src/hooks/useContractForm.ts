import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAllClients, useClient, Client } from "@/hooks/useClients";
import { useContracts } from "@/hooks/useContracts";
import { supabase } from "@/integrations/supabase/client";
import { maskCPF, maskPhone, validateCPF, validatePhone } from "@/lib/masks";
import { LoanContractData } from "@/lib/generateLoanContract";
import { advanceDateByFrequency, formatLocalDate, parseLocalDate } from "@/lib/dateUtils";

export type CalculationMode = "rate" | "installment";

export interface ContractFormData {
  name: string;
  cpf: string;
  email: string;
  whatsapp: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  capital: number;
  interestRate: number;
  installments: number;
  installmentValue: number;
  frequency: string;
  dailyType: string;
  scheduledDays: number[];
  scheduledMonths: number;
  startDate: string;
  firstDueDate: string;
  paidInstallments: number;
  finePercentage: number;
  dailyInterestRate: number;
}

const initialFormData: ContractFormData = {
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
  capital: "" as unknown as number,
  interestRate: "" as unknown as number,
  installments: "" as unknown as number,
  installmentValue: "" as unknown as number,
  frequency: "mensal",
  dailyType: "seg-seg",
  scheduledDays: [],
  scheduledMonths: 1,
  startDate: "",
  firstDueDate: "",
  paidInstallments: "" as unknown as number,
  finePercentage: 10,
  dailyInterestRate: 2,
};

export const frequencies = [
  { value: "diario", label: "Diário", icon: "⚡", description: "Cobranças todos os dias" },
  { value: "semanal", label: "Semanal", icon: "📅", description: "Uma vez por semana" },
  { value: "quinzenal", label: "Quinzenal", icon: "📆", description: "A cada 15 dias" },
  { value: "mensal", label: "Mensal", icon: "🗓️", description: "Uma vez por mês" },
  { value: "programada", label: "Programada", icon: "🎯", description: "Dias específicos" },
];

export const dailyTypes = [
  { value: "seg-seg", label: "Segunda a Segunda", description: "Todos os dias (7/7)" },
  { value: "seg-sex", label: "Segunda a Sexta", description: "Dias úteis (5/7)" },
  { value: "seg-sab", label: "Segunda a Sábado", description: "Exceto domingo (6/7)" },
];

export function useContractForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const existingClientId = searchParams.get("clientId");

  const { toast } = useToast();
  const { data: clients = [] } = useAllClients();
  const { createContract, isCreating: isCreatingContract } = useContracts();
  const { data: existingClient, isLoading: isLoadingClient } = useClient(existingClientId || undefined);

  const [foundClient, setFoundClient] = useState<Client | null>(null);
  const [showClientSuggestion, setShowClientSuggestion] = useState(false);
  const [isSearchingCpf, setIsSearchingCpf] = useState(false);
  const [selectedExistingClient, setSelectedExistingClient] = useState<Client | null>(null);
  const [mode, setMode] = useState<CalculationMode>("rate");
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formDataInitialized, setFormDataInitialized] = useState(false);
  const [formData, setFormData] = useState<ContractFormData>(initialFormData);

  // Auto-calculate firstDueDate based on startDate + frequency
  useEffect(() => {
    if (formData.frequency === "programada") return;
    
    if (!formData.startDate) {
      setFormData(prev => prev.firstDueDate ? { ...prev, firstDueDate: "" } : prev);
      return;
    }

    const startDate = parseLocalDate(formData.startDate);
    if (isNaN(startDate.getTime())) return;

    const nextDue = advanceDateByFrequency(startDate, formData.frequency);
    const formatted = formatLocalDate(nextDue);
    
    setFormData(prev => prev.firstDueDate !== formatted ? { ...prev, firstDueDate: formatted } : prev);
  }, [formData.startDate, formData.frequency]);

  const searchClientByCpf = useCallback((cpf: string) => {
    const cleanCpf = cpf.replace(/\D/g, "");
    if (cleanCpf.length !== 11) {
      setFoundClient(null);
      setShowClientSuggestion(false);
      return;
    }
    setIsSearchingCpf(true);
    const found = clients.find(c => c.cpf.replace(/\D/g, "") === cleanCpf);
    if (found && !selectedExistingClient) {
      setFoundClient(found);
      setShowClientSuggestion(true);
    } else {
      setFoundClient(null);
      setShowClientSuggestion(false);
    }
    setIsSearchingCpf(false);
  }, [clients, selectedExistingClient]);

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const maskedCpf = maskCPF(e.target.value);
    setFormData(prev => ({ ...prev, cpf: maskedCpf }));
    searchClientByCpf(maskedCpf);
  };

  const useExistingClient = (client: Client) => {
    setSelectedExistingClient(client);
    setFormData(prev => ({
      ...prev,
      name: client.name,
      cpf: client.cpf,
      email: client.email || "",
      whatsapp: client.whatsapp || "",
      cep: client.cep || "",
      street: client.street || "",
      number: client.number || "",
      complement: client.complement || "",
      neighborhood: client.neighborhood || "",
      city: client.city || "",
      state: client.state || "",
    }));
    if (client.avatar_url) setAvatarPreview(client.avatar_url);
    setShowClientSuggestion(false);
    setFoundClient(null);
    toast({ title: "Cliente selecionado!", description: `Dados de ${client.name} preenchidos automaticamente.` });
  };

  const clearSelectedClient = () => {
    setSelectedExistingClient(null);
    setFormData(prev => ({
      ...prev,
      name: "", cpf: "", email: "", whatsapp: "",
      cep: "", street: "", number: "", complement: "",
      neighborhood: "", city: "", state: "",
    }));
    setAvatarPreview(null);
  };

  const dismissSuggestion = () => {
    setShowClientSuggestion(false);
    setFoundClient(null);
  };

  useEffect(() => {
    if (existingClient && !formDataInitialized) {
      setSelectedExistingClient(existingClient);
      setFormData(prev => ({
        ...prev,
        name: existingClient.name,
        cpf: existingClient.cpf,
        email: existingClient.email || "",
        whatsapp: existingClient.whatsapp || "",
        cep: existingClient.cep || "",
        street: existingClient.street || "",
        number: existingClient.number || "",
        complement: existingClient.complement || "",
        neighborhood: existingClient.neighborhood || "",
        city: existingClient.city || "",
        state: existingClient.state || "",
      }));
      if (existingClient.avatar_url) setAvatarPreview(existingClient.avatar_url);
      setFormDataInitialized(true);
    }
  }, [existingClient, formDataInitialized]);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: "Arquivo muito grande", description: "A imagem deve ter no máximo 5MB.", variant: "destructive" });
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadAvatar = async (clientId: string): Promise<string | null> => {
    if (!avatarFile) return null;
    setIsUploadingAvatar(true);
    try {
      const fileExt = avatarFile.name.split(".").pop();
      const fileName = `${clientId}.${fileExt}`;
      const filePath = `clients/${fileName}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, avatarFile, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
      return publicUrl;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      console.error("Error uploading avatar:", error);
      toast({ title: "Erro ao enviar foto", description: message, variant: "destructive" });
      return null;
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const fetchAddressByCep = useCallback(async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;
    setIsLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();
      if (data.erro) {
        toast({ title: "CEP não encontrado", description: "Verifique o CEP digitado e tente novamente.", variant: "destructive" });
        return;
      }
      setFormData(prev => ({
        ...prev,
        street: data.logradouro || "",
        neighborhood: data.bairro || "",
        city: data.localidade || "",
        state: data.uf || "",
        complement: data.complemento || "",
      }));
      toast({ title: "Endereço encontrado!", description: `${data.logradouro}, ${data.bairro} - ${data.localidade}/${data.uf}` });
    } catch {
      toast({ title: "Erro ao buscar CEP", description: "Não foi possível conectar ao serviço. Tente novamente.", variant: "destructive" });
    } finally {
      setIsLoadingCep(false);
    }
  }, [toast]);

  const calculateInstallment = () => {
    const capital = Number(formData.capital) || 0;
    const interestRate = Number(formData.interestRate) || 0;
    const scheduledTotal = formData.scheduledDays.length * (Number(formData.scheduledMonths) || 1);
    const numInstallments = formData.frequency === "programada" ? scheduledTotal : (Number(formData.installments) || 1);
    const rate = interestRate / 100;
    const totalAmount = capital * (1 + rate);
    return numInstallments > 0 ? totalAmount / numInstallments : 0;
  };

  const calculateRate = () => {
    const capital = Number(formData.capital) || 0;
    const installmentValue = Number(formData.installmentValue) || 0;
    const scheduledTotal = formData.scheduledDays.length * (Number(formData.scheduledMonths) || 1);
    const numInstallments = formData.frequency === "programada" ? scheduledTotal : (Number(formData.installments) || 1);
    if (installmentValue <= 0 || capital <= 0) return 0;
    const totalAmount = installmentValue * numInstallments;
    const profit = totalAmount - capital;
    return (profit / capital) * 100;
  };

  const scheduledTotal = formData.scheduledDays.length * (Number(formData.scheduledMonths) || 1);
  const effectiveInstallments = formData.frequency === "programada" ? scheduledTotal : (Number(formData.installments) || 0);
  const installmentResult = mode === "rate" ? calculateInstallment() : (Number(formData.installmentValue) || 0);
  const rateResult = mode === "installment" ? calculateRate() : (Number(formData.interestRate) || 0);
  const capitalNum = Number(formData.capital) || 0;
  const totalAmount = installmentResult * effectiveInstallments;
  const totalProfit = totalAmount - capitalNum;

  // Validation helpers
  const validationErrors: string[] = [];
  const clientToUse = selectedExistingClient || existingClient;
  
  if (!clientToUse) {
    if (!formData.name) validationErrors.push("Nome do cliente é obrigatório");
    if (!formData.cpf) validationErrors.push("CPF é obrigatório");
    else if (!validateCPF(formData.cpf)) validationErrors.push("CPF inválido");
    if (formData.whatsapp && !validatePhone(formData.whatsapp)) validationErrors.push("WhatsApp inválido");
  }
  if (!formData.startDate) validationErrors.push("Data de início é obrigatória");
  if (formData.frequency !== "programada" && !formData.firstDueDate) validationErrors.push("Primeiro vencimento é obrigatório");
  if (formData.frequency === "programada" && formData.scheduledDays.length === 0) validationErrors.push("Selecione pelo menos um dia de pagamento");
  if (!formData.capital) validationErrors.push("Capital é obrigatório");
  if (formData.frequency !== "programada" && !formData.installments) validationErrors.push("Número de parcelas é obrigatório");
  if (capitalNum > 0 && totalProfit < 0) validationErrors.push("O lucro está negativo — revise a taxa ou parcela");

  const isFormValid = validationErrors.length === 0;

  const handleSave = async () => {
    if (isSaving || isCreatingContract) return;

    if (!isFormValid) {
      toast({ 
        title: "Formulário incompleto", 
        description: validationErrors[0], 
        variant: "destructive" 
      });
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let clientId: string;

      if (clientToUse) {
        clientId = clientToUse.id;
        if (clientToUse.status === "Quitado") {
          await supabase.from("clients").update({ status: "Ativo" }).eq("id", clientId);
        }
      } else {
        const { data: clientData, error: clientError } = await supabase.from("clients").insert({
          operator_id: user?.id,
          name: formData.name, cpf: formData.cpf,
          email: formData.email || null, whatsapp: formData.whatsapp || null,
          cep: formData.cep || null, street: formData.street || null,
          number: formData.number || null, complement: formData.complement || null,
          neighborhood: formData.neighborhood || null, city: formData.city || null,
          state: formData.state || null,
        }).select().single();
        if (clientError) throw clientError;
        clientId = clientData.id;
        if (avatarFile && clientData) {
          const avatarUrl = await uploadAvatar(clientData.id);
          if (avatarUrl) await supabase.from("clients").update({ avatar_url: avatarUrl }).eq("id", clientData.id);
        }
      }

      const clientForPdf = clientToUse || { name: formData.name, cpf: formData.cpf, city: formData.city, state: formData.state };
      await createContract({
        client_id: clientId,
        capital: formData.capital,
        interest_rate: rateResult,
        installments: formData.frequency === "programada" ? (formData.scheduledDays.length * (Number(formData.scheduledMonths) || 1)) : formData.installments,
        installment_value: installmentResult,
        total_amount: totalAmount,
        total_profit: totalProfit,
        frequency: formData.frequency as "diario" | "semanal" | "mensal" | "quinzenal" | "programada",
        daily_type: formData.frequency === "diario" ? formData.dailyType as "seg-seg" | "seg-sex" | "seg-sab" : undefined,
        scheduled_days: formData.frequency === "programada" ? formData.scheduledDays : undefined,
        start_date: formData.startDate,
        first_due_date: formData.frequency === "programada" ? formData.startDate : formData.firstDueDate,
        paid_installments: formData.paidInstallments,
        fine_percentage: Number(formData.finePercentage) || 10,
        daily_interest_rate: Number(formData.dailyInterestRate) || 2,
        client_name: clientForPdf.name,
        client_cpf: clientForPdf.cpf,
        client_city: clientForPdf.city || undefined,
        client_state: clientForPdf.state || undefined,
        company_name: "Credifacil Global",
      });

      navigate(`/clientes/${clientId}`);
    } catch (error: unknown) {
      console.error("CONTRACT_SAVE_ERROR:", error);
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      toast({ title: "Erro ao criar contrato", description: message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  return {
    formData, setFormData, mode, setMode,
    existingClientId, existingClient, isLoadingClient,
    selectedExistingClient, foundClient, showClientSuggestion,
    isSearchingCpf, isLoadingCep, isSaving, isUploadingAvatar,
    avatarPreview, avatarFile, fileInputRef,
    handleCpfChange, useExistingClient, clearSelectedClient, dismissSuggestion,
    handleAvatarSelect, removeAvatar, fetchAddressByCep,
    handleSave, navigate,
    effectiveInstallments, installmentResult, rateResult,
    capitalNum, totalAmount, totalProfit,
    isCreatingContract, isFormValid, validationErrors,
  };
}

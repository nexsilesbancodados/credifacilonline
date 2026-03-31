import { MainLayout } from "@/components/layout/MainLayout";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Camera, X, Search, UserCheck, AlertCircle,
  Calculator, User, MapPin, Calendar, DollarSign, Percent, Sparkles, Check,
} from "lucide-react";
import { useAllClients, useClient, Client } from "@/hooks/useClients";
import { useContracts } from "@/hooks/useContracts";
import { supabase } from "@/integrations/supabase/client";
import { maskCPF, maskPhone, maskCEP, validateCPF, validatePhone } from "@/lib/masks";
import { cn } from "@/lib/utils";

type CalculationMode = "rate" | "installment";

const NovoContrato = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const existingClientId = searchParams.get("clientId");
  
  const { toast } = useToast();
  const { data: clients = [] } = useAllClients();
  const { createContract, isCreating: isCreatingContract } = useContracts();
  
  // Fetch specific client when clientId is provided
  const { data: existingClient, isLoading: isLoadingClient } = useClient(existingClientId || undefined);
  
  // State for CPF search
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
  
  const [formData, setFormData] = useState({
    // Client data
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
    // Contract data
    capital: "" as unknown as number,
    interestRate: "" as unknown as number,
    installments: "" as unknown as number,
    installmentValue: "" as unknown as number,
    frequency: "mensal",
    dailyType: "seg-seg",
    scheduledDays: [] as number[],
    startDate: "",
    firstDueDate: "",
    paidInstallments: "" as unknown as number,
  });

  // Search for existing client by CPF
  const searchClientByCpf = useCallback((cpf: string) => {
    const cleanCpf = cpf.replace(/\D/g, "");
    
    // Only search when CPF has 11 digits
    if (cleanCpf.length !== 11) {
      setFoundClient(null);
      setShowClientSuggestion(false);
      return;
    }
    
    setIsSearchingCpf(true);
    
    // Search in already loaded clients
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

  // Handle CPF change with search
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const maskedCpf = maskCPF(e.target.value);
    setFormData({ ...formData, cpf: maskedCpf });
    searchClientByCpf(maskedCpf);
  };

  // Use existing client data
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
    if (client.avatar_url) {
      setAvatarPreview(client.avatar_url);
    }
    setShowClientSuggestion(false);
    setFoundClient(null);
    toast({
      title: "Cliente selecionado!",
      description: `Dados de ${client.name} preenchidos automaticamente.`,
    });
  };

  // Clear selected existing client
  const clearSelectedClient = () => {
    setSelectedExistingClient(null);
    setFormData(prev => ({
      ...prev,
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
    }));
    setAvatarPreview(null);
  };

  // Pre-fill form when existing client data is loaded (from URL param)
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
      if (existingClient.avatar_url) {
        setAvatarPreview(existingClient.avatar_url);
      }
      setFormDataInitialized(true);
    }
  }, [existingClient, formDataInitialized]);

  // Handle avatar selection
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Arquivo muito grande",
          description: "A imagem deve ter no máximo 5MB.",
          variant: "destructive",
        });
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Upload avatar to storage
  const uploadAvatar = async (clientId: string): Promise<string | null> => {
    if (!avatarFile) return null;
    
    setIsUploadingAvatar(true);
    try {
      const fileExt = avatarFile.name.split(".").pop();
      const fileName = `${clientId}.${fileExt}`;
      const filePath = `clients/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, avatarFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Erro ao enviar foto",
        description: error.message,
        variant: "destructive",
      });
      return null;
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // CEP lookup function
  const fetchAddressByCep = useCallback(async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, "");
    
    if (cleanCep.length !== 8) return;
    
    setIsLoadingCep(true);
    
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
      
      setFormData((prev) => ({
        ...prev,
        street: data.logradouro || "",
        neighborhood: data.bairro || "",
        city: data.localidade || "",
        state: data.uf || "",
        complement: data.complemento || "",
      }));
      
      toast({
        title: "Endereço encontrado!",
        description: `${data.logradouro}, ${data.bairro} - ${data.localidade}/${data.uf}`,
      });
    } catch (error) {
      toast({
        title: "Erro ao buscar CEP",
        description: "Não foi possível conectar ao serviço. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingCep(false);
    }
  }, [toast]);

  // Calculate based on mode
  const calculateInstallment = () => {
    const capital = Number(formData.capital) || 0;
    const interestRate = Number(formData.interestRate) || 0;
    const numInstallments = formData.frequency === "programada" ? formData.scheduledDays.length : (Number(formData.installments) || 1);
    const rate = interestRate / 100;
    const totalAmount = capital * (1 + rate);
    return numInstallments > 0 ? totalAmount / numInstallments : 0;
  };

  const calculateRate = () => {
    const capital = Number(formData.capital) || 0;
    const installmentValue = Number(formData.installmentValue) || 0;
    const numInstallments = formData.frequency === "programada" ? formData.scheduledDays.length : (Number(formData.installments) || 1);
    if (installmentValue <= 0 || capital <= 0) return 0;
    const totalAmount = installmentValue * numInstallments;
    const profit = totalAmount - capital;
    const rate = (profit / capital) * 100;
    return rate;
  };

  const effectiveInstallments = formData.frequency === "programada" ? formData.scheduledDays.length : (Number(formData.installments) || 0);
  const installmentResult = mode === "rate" ? calculateInstallment() : (Number(formData.installmentValue) || 0);
  const rateResult = mode === "installment" ? calculateRate() : (Number(formData.interestRate) || 0);
  const capitalNum = Number(formData.capital) || 0;
  const installmentsNum = effectiveInstallments;
  const totalAmount = installmentResult * installmentsNum;
  const totalProfit = totalAmount - capitalNum;

  const frequencies = [
    { value: "diario", label: "Diário" },
    { value: "semanal", label: "Semanal" },
    { value: "quinzenal", label: "Quinzenal" },
    { value: "mensal", label: "Mensal" },
    { value: "programada", label: "Programada" },
  ];

  const dailyTypes = [
    { value: "seg-seg", label: "Segunda a Segunda", description: "Todos os dias" },
    { value: "seg-sex", label: "Segunda a Sexta", description: "Dias úteis" },
    { value: "seg-sab", label: "Segunda a Sábado", description: "Exceto domingo" },
  ];

  const handleSave = async () => {
    // Use selectedExistingClient or existingClient (from URL param)
    const clientToUse = selectedExistingClient || existingClient;
    
    // Only validate client data if creating new client
    if (!clientToUse) {
      if (!formData.name || !formData.cpf) {
        toast({ title: "Erro", description: "Preencha o nome e CPF do cliente.", variant: "destructive" });
        return;
      }
      
      // Validate CPF
      if (!validateCPF(formData.cpf)) {
        toast({ title: "CPF Inválido", description: "O CPF informado não é válido. Verifique os dígitos.", variant: "destructive" });
        return;
      }
      
      // Validate phone if provided
      if (formData.whatsapp && !validatePhone(formData.whatsapp)) {
        toast({ title: "WhatsApp Inválido", description: "O número de WhatsApp deve ter 10 ou 11 dígitos.", variant: "destructive" });
        return;
      }
    }
    
    if (!formData.startDate || (!formData.firstDueDate && formData.frequency !== "programada")) {
      toast({ title: "Erro", description: "Preencha as datas do contrato.", variant: "destructive" });
      return;
    }
    
    if (formData.frequency === "programada" && formData.scheduledDays.length === 0) {
      toast({ title: "Erro", description: "Selecione pelo menos um dia do mês para pagamento.", variant: "destructive" });
      return;
    }
    
    if (!formData.capital || (formData.frequency !== "programada" && !formData.installments)) {
      toast({ title: "Erro", description: "Preencha o capital e número de parcelas.", variant: "destructive" });
      return;
    }
    
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      let clientId: string;
      
      if (clientToUse) {
        // Use existing client
        clientId = clientToUse.id;
        
        // Update client status to Ativo if it was Quitado
        if (clientToUse.status === "Quitado") {
          await supabase
            .from("clients")
            .update({ status: "Ativo" })
            .eq("id", clientId);
        }
      } else {
        // Create new client
        const { data: clientData, error: clientError } = await supabase.from("clients").insert({
          operator_id: user?.id,
          name: formData.name,
          cpf: formData.cpf,
          email: formData.email || null,
          whatsapp: formData.whatsapp || null,
          cep: formData.cep || null,
          street: formData.street || null,
          number: formData.number || null,
          complement: formData.complement || null,
          neighborhood: formData.neighborhood || null,
          city: formData.city || null,
          state: formData.state || null,
        }).select().single();
        
        if (clientError) throw clientError;
        clientId = clientData.id;

        // Upload avatar if selected
        if (avatarFile && clientData) {
          const avatarUrl = await uploadAvatar(clientData.id);
          if (avatarUrl) {
            await supabase.from("clients").update({ avatar_url: avatarUrl }).eq("id", clientData.id);
          }
        }
      }
      
      // Create contract with client data for PDF generation
      const clientForPdf = clientToUse || { name: formData.name, cpf: formData.cpf, city: formData.city, state: formData.state };
      await createContract({
        client_id: clientId,
        capital: formData.capital,
        interest_rate: rateResult,
        installments: formData.frequency === "programada" ? formData.scheduledDays.length : formData.installments,
        installment_value: installmentResult,
        total_amount: totalAmount,
        total_profit: totalProfit,
        frequency: formData.frequency as any,
        daily_type: formData.frequency === "diario" ? formData.dailyType as any : undefined,
        scheduled_days: formData.frequency === "programada" ? formData.scheduledDays : undefined,
        start_date: formData.startDate,
        first_due_date: formData.frequency === "programada" ? formData.startDate : formData.firstDueDate,
        paid_installments: formData.paidInstallments,
        fine_percentage: 10,
        daily_interest_rate: 2,
        // Client data for contract PDF
        client_name: clientForPdf.name,
        client_cpf: clientForPdf.cpf,
        client_city: clientForPdf.city || undefined,
        client_state: clientForPdf.state || undefined,
        company_name: "Credifacil Global",
      });
      
      // Navigate back to client dossier if adding to existing client
      if (clientToUse) {
        navigate(`/cliente/${clientId}`);
      } else {
        navigate("/clientes");
      }
    } catch (error: any) {
      toast({ title: "Erro ao criar contrato", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading while fetching existing client
  if (existingClientId && isLoadingClient) {
    return (
      <MainLayout>
        <div className="flex h-[60vh] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Carregando dados do cliente...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">
          {existingClient ? "Novo Contrato" : "Novo Contrato"}
        </h1>
        <p className="mt-1 text-muted-foreground">
          {existingClient 
            ? `Novo empréstimo para ${existingClient.name}`
            : "Registre um novo empréstimo para seu cliente"
          }
        </p>
      </div>

      {/* Selected Client Banner (from CPF search OR from URL param) */}
      {(selectedExistingClient || existingClient) && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-2xl border border-accent/50 bg-accent/10 p-4"
        >
          <div className="flex items-center gap-4">
            {(selectedExistingClient?.avatar_url || existingClient?.avatar_url) ? (
              <img
                src={selectedExistingClient?.avatar_url || existingClient?.avatar_url || ""}
                alt={(selectedExistingClient || existingClient)?.name}
                className="h-12 w-12 rounded-full object-cover border-2 border-accent/30"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/20">
                <UserCheck className="h-6 w-6 text-accent" />
              </div>
            )}
            <div className="flex-1">
              <p className="font-medium text-foreground">Cliente existente selecionado</p>
              <p className="text-sm text-muted-foreground">
                {(selectedExistingClient || existingClient)?.name} • CPF: {(selectedExistingClient || existingClient)?.cpf}
              </p>
              {(selectedExistingClient?.whatsapp || existingClient?.whatsapp) && (
                <p className="text-xs text-muted-foreground">
                  WhatsApp: {selectedExistingClient?.whatsapp || existingClient?.whatsapp}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {(selectedExistingClient?.city || existingClient?.city) && (selectedExistingClient?.state || existingClient?.state) && (
                <p className="text-xs text-muted-foreground">
                  {selectedExistingClient?.city || existingClient?.city}/{selectedExistingClient?.state || existingClient?.state}
                </p>
              )}
              {!existingClientId && (
                <button
                  type="button"
                  onClick={clearSelectedClient}
                  className="h-8 w-8 rounded-full bg-muted hover:bg-destructive/20 flex items-center justify-center transition-colors"
                  title="Remover cliente selecionado"
                >
                  <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Form Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Client Data with Photo - Only show if no client selected */}
          {!selectedExistingClient && !existingClient && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-6"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                  1
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-semibold text-foreground">
                    Dados do Cliente
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Informações pessoais do cliente
                  </p>
                </div>
              </div>

            {/* Avatar Upload */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarSelect}
                  className="hidden"
                  id="avatar-upload"
                />
                
                {avatarPreview ? (
                  <div className="relative">
                    <img
                      src={avatarPreview}
                      alt="Preview"
                      className="h-28 w-28 rounded-full object-cover border-4 border-primary/30"
                    />
                    <button
                      type="button"
                      onClick={removeAvatar}
                      className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg hover:bg-destructive/90 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <label
                      htmlFor="avatar-upload"
                      className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg cursor-pointer hover:bg-primary/90 transition-colors"
                    >
                      <Camera className="h-5 w-5" />
                    </label>
                  </div>
                ) : (
                  <label
                    htmlFor="avatar-upload"
                    className="flex flex-col items-center justify-center h-28 w-28 rounded-full border-2 border-dashed border-border bg-secondary/30 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all"
                  >
                    <Camera className="h-8 w-8 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">Foto</span>
                  </label>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="João da Silva"
                  className="h-11 w-full rounded-xl border border-border bg-secondary/50 px-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div className="relative">
                <label className="mb-2 block text-sm font-medium text-muted-foreground">
                  CPF * <span className="text-xs text-accent">(digite para buscar cliente)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.cpf}
                    onChange={handleCpfChange}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    className={cn(
                      "h-11 w-full rounded-xl border bg-secondary/50 px-4 pr-10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1",
                      showClientSuggestion
                        ? "border-accent focus:border-accent focus:ring-accent"
                        : "border-border focus:border-primary focus:ring-primary"
                    )}
                  />
                  {isSearchingCpf && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    </div>
                  )}
                  {!isSearchingCpf && formData.cpf.replace(/\D/g, "").length === 11 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Search className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
                
                {/* Client Suggestion Popup */}
                <AnimatePresence>
                  {showClientSuggestion && foundClient && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      className="absolute z-50 left-0 right-0 mt-2 rounded-xl border border-accent bg-card shadow-lg overflow-hidden"
                    >
                      <div className="p-3 bg-accent/10 border-b border-accent/30">
                        <div className="flex items-center gap-2 text-accent">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm font-medium">Cliente encontrado!</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => useExistingClient(foundClient)}
                        className="w-full p-4 flex items-center gap-4 hover:bg-accent/5 transition-colors text-left"
                      >
                        {foundClient.avatar_url ? (
                          <img
                            src={foundClient.avatar_url}
                            alt={foundClient.name}
                            className="h-12 w-12 rounded-full object-cover border-2 border-accent/30"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center">
                            <User className="h-6 w-6 text-accent" />
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{foundClient.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {foundClient.whatsapp || "Sem WhatsApp"}
                            {foundClient.city && ` • ${foundClient.city}/${foundClient.state}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded-full">
                            Usar este cliente
                          </span>
                        </div>
                      </button>
                      <div className="p-2 bg-secondary/30 border-t border-border">
                        <button
                          type="button"
                          onClick={() => {
                            setShowClientSuggestion(false);
                            setFoundClient(null);
                          }}
                          className="text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-center py-1"
                        >
                          Ignorar e cadastrar novo cliente
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">
                  E-mail
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="joao@email.com"
                  className="h-11 w-full rounded-xl border border-border bg-secondary/50 px-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">
                  WhatsApp
                </label>
                <input
                  type="text"
                  value={formData.whatsapp}
                  onChange={(e) =>
                    setFormData({ ...formData, whatsapp: maskPhone(e.target.value) })
                  }
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                  className="h-11 w-full rounded-xl border border-border bg-secondary/50 px-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </motion.div>
          )}

          {/* Step 2: Address - Only show if no client selected */}
          {!selectedExistingClient && !existingClient && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                2
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold text-foreground">
                  Endereço
                </h2>
                <p className="text-sm text-muted-foreground">
                  Localização do cliente
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">
                  CEP
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.cep}
                    onChange={(e) => {
                      const masked = maskCEP(e.target.value);
                      setFormData({ ...formData, cep: masked });
                      const cleanCep = masked.replace(/\D/g, "");
                      if (cleanCep.length === 8) {
                        fetchAddressByCep(cleanCep);
                      }
                    }}
                    placeholder="00000-000"
                    maxLength={9}
                    className="h-11 w-full rounded-xl border border-border bg-secondary/50 px-4 pr-10 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  {isLoadingCep && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    </div>
                  )}
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium text-muted-foreground">
                  Rua
                </label>
                <input
                  type="text"
                  value={formData.street}
                  onChange={(e) =>
                    setFormData({ ...formData, street: e.target.value })
                  }
                  placeholder="Rua das Flores"
                  className="h-11 w-full rounded-xl border border-border bg-secondary/50 px-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">
                  Número
                </label>
                <input
                  type="text"
                  value={formData.number}
                  onChange={(e) =>
                    setFormData({ ...formData, number: e.target.value })
                  }
                  placeholder="123"
                  className="h-11 w-full rounded-xl border border-border bg-secondary/50 px-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">
                  Bairro
                </label>
                <input
                  type="text"
                  value={formData.neighborhood}
                  onChange={(e) =>
                    setFormData({ ...formData, neighborhood: e.target.value })
                  }
                  placeholder="Centro"
                  className="h-11 w-full rounded-xl border border-border bg-secondary/50 px-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">
                  Cidade
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  placeholder="São Paulo"
                  className="h-11 w-full rounded-xl border border-border bg-secondary/50 px-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">
                  Estado
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) =>
                    setFormData({ ...formData, state: e.target.value })
                  }
                  placeholder="SP"
                  maxLength={2}
                  className="h-11 w-full rounded-xl border border-border bg-secondary/50 px-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">
                  Complemento
                </label>
                <input
                  type="text"
                  value={formData.complement}
                  onChange={(e) =>
                    setFormData({ ...formData, complement: e.target.value })
                  }
                  placeholder="Apto 101, Bloco B"
                  className="h-11 w-full rounded-xl border border-border bg-secondary/50 px-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </motion.div>
          )}

          {/* Step 3: Calculator (Step 1 if existing client) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: existingClient ? 0.1 : 0.3 }}
            className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                {existingClient ? 1 : 3}
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
                <Calculator className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold text-foreground">
                  Valores do Empréstimo
                </h2>
                <p className="text-sm text-muted-foreground">
                  Escolha como calcular o contrato
                </p>
              </div>
            </div>

            <div className="flex gap-3 mb-6">
              <button
                onClick={() => setMode("rate")}
                className={cn(
                  "flex-1 rounded-xl border p-4 transition-all",
                  mode === "rate"
                    ? "border-primary bg-primary/10"
                    : "border-border/50 hover:border-border"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    mode === "rate" ? "bg-primary text-primary-foreground" : "bg-secondary"
                  )}>
                    <Percent className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">Taxa de Juros</p>
                    <p className="text-xs text-muted-foreground">
                      Calcular parcela pela taxa
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setMode("installment")}
                className={cn(
                  "flex-1 rounded-xl border p-4 transition-all",
                  mode === "installment"
                    ? "border-primary bg-primary/10"
                    : "border-border/50 hover:border-border"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    mode === "installment" ? "bg-primary text-primary-foreground" : "bg-secondary"
                  )}>
                    <DollarSign className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-foreground">Parcela Fixa</p>
                    <p className="text-xs text-muted-foreground">
                      Calcular taxa pela parcela
                    </p>
                  </div>
                </div>
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">
                  Capital (R$) *
                </label>
                <input
                  type="number"
                  value={formData.capital === 0 ? "" : formData.capital}
                  onChange={(e) =>
                    setFormData({ ...formData, capital: e.target.value === "" ? "" as unknown as number : Number(e.target.value) })
                  }
                  placeholder="0"
                  className="h-12 w-full rounded-xl border border-border bg-secondary/50 px-4 font-display text-lg font-semibold text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {mode === "rate" ? (
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted-foreground">
                    Taxa de Juros (%) *
                  </label>
                  <input
                    type="number"
                    value={formData.interestRate === 0 ? "" : formData.interestRate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        interestRate: e.target.value === "" ? "" as unknown as number : Number(e.target.value),
                      })
                    }
                    placeholder="0"
                    className="h-12 w-full rounded-xl border border-border bg-secondary/50 px-4 font-display text-lg font-semibold text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              ) : (
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted-foreground">
                    Valor da Parcela (R$) *
                  </label>
                  <input
                    type="number"
                    value={formData.installmentValue === 0 ? "" : formData.installmentValue}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        installmentValue: e.target.value === "" ? "" as unknown as number : Number(e.target.value),
                      })
                    }
                    placeholder="0"
                    className="h-12 w-full rounded-xl border border-border bg-secondary/50 px-4 font-display text-lg font-semibold text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              )}

              {formData.frequency !== "programada" && (
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">
                  Nº de Parcelas *
                </label>
                <input
                  type="number"
                  value={formData.installments === 0 ? "" : formData.installments}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      installments: e.target.value === "" ? "" as unknown as number : Number(e.target.value),
                    })
                  }
                  placeholder="0"
                  className="h-12 w-full rounded-xl border border-border bg-secondary/50 px-4 font-display text-lg font-semibold text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              )}
              {formData.frequency === "programada" && (
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">
                  Nº de Parcelas
                </label>
                <div className="h-12 w-full rounded-xl border border-border bg-secondary/30 px-4 flex items-center font-display text-lg font-semibold text-muted-foreground">
                  {formData.scheduledDays.length || "—"}
                  <span className="ml-2 text-xs font-normal">(definido pelos dias selecionados)</span>
                </div>
              </div>
              )}
            </div>
          </motion.div>

          {/* Step 4: Contract Details (Step 2 if existing client) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: existingClient ? 0.2 : 0.4 }}
            className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
                {existingClient ? 2 : 4}
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold text-foreground">
                  Detalhes do Contrato
                </h2>
                <p className="text-sm text-muted-foreground">
                  Configurações de pagamento
                </p>
              </div>
            </div>

            {/* Frequency Selection */}
            <div className="mb-4">
              <label className="mb-3 block text-sm font-medium text-muted-foreground">
                Frequência de Pagamento
              </label>
              <div className="flex flex-wrap gap-2">
                {frequencies.map((freq) => (
                  <button
                    key={freq.value}
                    type="button"
                    onClick={() =>
                      setFormData({ ...formData, frequency: freq.value })
                    }
                    className={cn(
                      "rounded-xl px-4 py-2 text-sm font-medium transition-all",
                      formData.frequency === freq.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary/50 text-foreground hover:bg-secondary border border-border"
                    )}
                  >
                    {freq.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Daily Sub-options */}
            {formData.frequency === "diario" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4"
              >
                <label className="mb-3 block text-sm font-medium text-muted-foreground">
                  Dias de Cobrança
                </label>
                <div className="grid gap-2 sm:grid-cols-3">
                  {dailyTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, dailyType: type.value })
                      }
                      className={cn(
                        "rounded-xl p-3 text-left transition-all border",
                        formData.dailyType === type.value
                          ? "border-primary bg-primary/10"
                          : "border-border/50 bg-secondary/30 hover:border-border"
                      )}
                    >
                      <p className="font-medium text-foreground text-sm">
                        {type.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {type.description}
                      </p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Programada - Scheduled Days Selector */}
            {formData.frequency === "programada" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-muted-foreground">
                    Dias do mês para pagamento
                  </label>
                  {formData.scheduledDays.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, scheduledDays: [], installments: 0 as unknown as number })}
                      className="text-xs text-destructive hover:text-destructive/80 transition-colors font-medium"
                    >
                      Limpar todos
                    </button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Selecione os dias em que o cliente fará os pagamentos. O total será dividido igualmente entre esses dias.
                </p>
                <div className="grid grid-cols-7 gap-1.5">
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                    const isSelected = formData.scheduledDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          const newDays = isSelected
                            ? formData.scheduledDays.filter(d => d !== day)
                            : [...formData.scheduledDays, day].sort((a, b) => a - b);
                          setFormData({
                            ...formData,
                            scheduledDays: newDays,
                            installments: newDays.length as unknown as number,
                          });
                        }}
                        className={cn(
                          "h-10 w-full rounded-lg text-sm font-medium transition-all",
                          isSelected
                            ? "bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/30"
                            : "bg-secondary/50 text-foreground hover:bg-secondary border border-border/50"
                        )}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
                {formData.scheduledDays.length > 0 && (
                  <div className="mt-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-foreground">Dias selecionados</span>
                      <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {formData.scheduledDays.length} parcela{formData.scheduledDays.length > 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {formData.scheduledDays.map(day => (
                        <span key={day} className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-semibold">
                          {day}
                          <button
                            type="button"
                            onClick={() => {
                              const newDays = formData.scheduledDays.filter(d => d !== day);
                              setFormData({
                                ...formData,
                                scheduledDays: newDays,
                                installments: newDays.length as unknown as number,
                              });
                            }}
                            className="ml-0.5 hover:text-destructive transition-colors"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                    {installmentResult > 0 && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Cada parcela: <span className="font-semibold text-primary">
                          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(installmentResult)}
                        </span>
                      </p>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">
                  Data de Início *
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className="h-11 w-full rounded-xl border border-border bg-secondary/50 px-4 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              {formData.frequency !== "programada" && (
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">
                  Primeiro Vencimento *
                </label>
                <input
                  type="date"
                  value={formData.firstDueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, firstDueDate: e.target.value })
                  }
                  className="h-11 w-full rounded-xl border border-border bg-secondary/50 px-4 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              )}
              {formData.frequency === "programada" && (
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">
                  Dias de pagamento
                </label>
                <div className="h-11 w-full rounded-xl border border-border bg-secondary/30 px-4 flex items-center text-sm text-muted-foreground">
                  {formData.scheduledDays.length > 0
                    ? formData.scheduledDays.map(d => `dia ${d}`).join(", ")
                    : "Selecione os dias acima"}
                </div>
              </div>
              )}
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">
                  Parcelas Já Pagas
                </label>
                <input
                  type="number"
                  value={formData.paidInstallments === 0 ? "" : formData.paidInstallments}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      paidInstallments: e.target.value === "" ? "" as unknown as number : Number(e.target.value),
                    })
                  }
                  min={0}
                  max={formData.installments ? Number(formData.installments) - 1 : undefined}
                  placeholder="0"
                  className="h-11 w-full rounded-xl border border-border bg-secondary/50 px-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Summary Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="lg:sticky lg:top-8 h-fit"
        >
          <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Sparkles className="h-5 w-5" />
              </div>
              <h2 className="font-display text-lg font-semibold text-foreground">
                Resumo do Contrato
              </h2>
            </div>

            {/* Client Preview */}
            {formData.name && (
              <div className="flex items-center gap-3 mb-6 p-3 rounded-xl bg-secondary/30">
                {avatarPreview ? (
                  <img src={avatarPreview} alt={formData.name} className="h-12 w-12 rounded-full object-cover" />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                    {formData.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-medium text-foreground">{formData.name}</p>
                  <p className="text-xs text-muted-foreground">{formData.cpf || "CPF não informado"}</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-border/50">
                <span className="text-muted-foreground">Capital</span>
                <span className="font-display font-semibold text-foreground">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(formData.capital || 0)}
                </span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-border/50">
                <span className="text-muted-foreground">Taxa de Juros</span>
                <span className="font-display font-semibold text-foreground">
                  {rateResult.toFixed(2)}%
                </span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-border/50">
                <span className="text-muted-foreground">Frequência</span>
                <span className="font-display font-semibold text-foreground">
                  {frequencies.find(f => f.value === formData.frequency)?.label}
                  {formData.frequency === "diario" && ` (${dailyTypes.find(d => d.value === formData.dailyType)?.label})`}
                  {formData.frequency === "programada" && formData.scheduledDays.length > 0 && ` (dias ${formData.scheduledDays.join(", ")})`}
                </span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-border/50">
                <span className="text-muted-foreground">Parcelas</span>
                <span className="font-display font-semibold text-foreground">
                  {effectiveInstallments}x
                </span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-border/50">
                <span className="text-muted-foreground">Valor da Parcela</span>
                <span className="font-display font-semibold text-primary text-xl">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(installmentResult)}
                </span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-border/50">
                <span className="text-muted-foreground">Valor Total</span>
                <span className="font-display font-semibold text-foreground">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(totalAmount)}
                </span>
              </div>

              <div className="flex justify-between items-center py-3 bg-success/10 rounded-xl px-4 -mx-2">
                <span className="text-success font-medium">Lucro Esperado</span>
                <span className="font-display font-bold text-success text-xl">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(totalProfit)}
                </span>
              </div>

              {/* Installment Schedule Preview for Programada */}
              {formData.frequency === "programada" && formData.scheduledDays.length > 0 && formData.startDate && installmentResult > 0 && (
                <div className="mt-4 p-3 rounded-xl bg-secondary/30 border border-border/50">
                  <p className="text-xs font-medium text-foreground mb-2">📅 Cronograma de Parcelas</p>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {(() => {
                      const sortedDays = [...formData.scheduledDays].sort((a, b) => a - b);
                      const [year, month] = formData.startDate.split("-").map(Number);
                      let currentMonth = month - 1;
                      let currentYear = year;
                      const startDay = new Date(year, month - 1, Number(formData.startDate.split("-")[2])).getDate();
                      let dayIndex = sortedDays.findIndex(d => d >= startDay);
                      if (dayIndex === -1) { dayIndex = 0; currentMonth++; if (currentMonth > 11) { currentMonth = 0; currentYear++; } }
                      
                      return sortedDays.map((_, i) => {
                        const day = sortedDays[dayIndex];
                        const maxDay = new Date(currentYear, currentMonth + 1, 0).getDate();
                        const clampedDay = Math.min(day, maxDay);
                        const date = new Date(currentYear, currentMonth, clampedDay);
                        const formatted = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
                        
                        dayIndex++;
                        if (dayIndex >= sortedDays.length) { dayIndex = 0; currentMonth++; if (currentMonth > 11) { currentMonth = 0; currentYear++; } }
                        
                        return (
                          <div key={i} className="flex justify-between items-center text-xs py-1 px-2 rounded-lg hover:bg-secondary/50">
                            <span className="text-muted-foreground">{i + 1}ª parcela — {formatted}</span>
                            <span className="font-semibold text-foreground">
                              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(installmentResult)}
                            </span>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isSaving || isUploadingAvatar || !formData.name || !formData.cpf || !formData.startDate || (formData.frequency !== "programada" && !formData.firstDueDate) || (formData.frequency === "programada" && formData.scheduledDays.length === 0)}
              onClick={handleSave}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-gold py-4 font-display font-semibold text-primary-foreground shadow-gold transition-shadow hover:shadow-gold-lg disabled:opacity-50"
            >
              {isSaving || isUploadingAvatar ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
              {isSaving ? "Salvando..." : isUploadingAvatar ? "Enviando foto..." : "Criar Contrato"}
            </motion.button>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Ao criar o contrato, as parcelas serão geradas automaticamente
            </p>
          </div>
        </motion.div>
      </div>
    </MainLayout>
  );
};

export default NovoContrato;

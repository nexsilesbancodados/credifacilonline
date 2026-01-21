import { MainLayout } from "@/components/layout/MainLayout";
import { motion } from "framer-motion";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Camera, X } from "lucide-react";
import { useClients } from "@/hooks/useClients";
import { useContracts } from "@/hooks/useContracts";
import { supabase } from "@/integrations/supabase/client";
import { maskCPF, maskPhone, maskCEP, validateCPF, validatePhone } from "@/lib/masks";
import {
  Calculator,
  User,
  MapPin,
  Calendar,
  DollarSign,
  Percent,
  Sparkles,
  Check,
  UserCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

type CalculationMode = "rate" | "installment";

const NovoContrato = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const existingClientId = searchParams.get("clientId");
  
  const { toast } = useToast();
  const { clients, createClient, isCreating: isCreatingClient } = useClients();
  const { createContract, isCreating: isCreatingContract } = useContracts();
  const [mode, setMode] = useState<CalculationMode>("rate");
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Find existing client if clientId is provided
  const existingClient = useMemo(() => {
    if (!existingClientId) return null;
    return clients.find(c => c.id === existingClientId) || null;
  }, [clients, existingClientId]);
  
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
    startDate: "",
    firstDueDate: "",
    paidInstallments: "" as unknown as number,
  });

  // Pre-fill form if existing client
  useEffect(() => {
    if (existingClient) {
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
    }
  }, [existingClient]);

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
    const installments = Number(formData.installments) || 1;
    const rate = interestRate / 100;
    const totalAmount = capital * (1 + rate);
    return totalAmount / installments;
  };

  const calculateRate = () => {
    const capital = Number(formData.capital) || 0;
    const installmentValue = Number(formData.installmentValue) || 0;
    const installments = Number(formData.installments) || 1;
    if (installmentValue <= 0 || capital <= 0) return 0;
    const totalAmount = installmentValue * installments;
    const profit = totalAmount - capital;
    const rate = (profit / capital) * 100;
    return rate;
  };

  const installmentResult = mode === "rate" ? calculateInstallment() : (Number(formData.installmentValue) || 0);
  const rateResult = mode === "installment" ? calculateRate() : (Number(formData.interestRate) || 0);
  const capitalNum = Number(formData.capital) || 0;
  const installmentsNum = Number(formData.installments) || 0;
  const totalAmount = installmentResult * installmentsNum;
  const totalProfit = totalAmount - capitalNum;

  const frequencies = [
    { value: "diario", label: "Diário" },
    { value: "semanal", label: "Semanal" },
    { value: "quinzenal", label: "Quinzenal" },
    { value: "mensal", label: "Mensal" },
  ];

  const dailyTypes = [
    { value: "seg-seg", label: "Segunda a Segunda", description: "Todos os dias" },
    { value: "seg-sex", label: "Segunda a Sexta", description: "Dias úteis" },
    { value: "seg-sab", label: "Segunda a Sábado", description: "Exceto domingo" },
  ];

  const handleSave = async () => {
    // Only validate client data if creating new client
    if (!existingClient) {
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
    
    if (!formData.startDate || !formData.firstDueDate) {
      toast({ title: "Erro", description: "Preencha as datas do contrato.", variant: "destructive" });
      return;
    }
    
    if (!formData.capital || !formData.installments) {
      toast({ title: "Erro", description: "Preencha o capital e número de parcelas.", variant: "destructive" });
      return;
    }
    
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      let clientId: string;
      
      if (existingClient) {
        // Use existing client
        clientId = existingClient.id;
        
        // Update client status to Ativo if it was Quitado
        if (existingClient.status === "Quitado") {
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
      await createContract({
        client_id: clientId,
        capital: formData.capital,
        interest_rate: rateResult,
        installments: formData.installments,
        installment_value: installmentResult,
        total_amount: totalAmount,
        total_profit: totalProfit,
        frequency: formData.frequency as any,
        daily_type: formData.frequency === "diario" ? formData.dailyType as any : undefined,
        start_date: formData.startDate,
        first_due_date: formData.firstDueDate,
        paid_installments: formData.paidInstallments,
        fine_percentage: 10, // Default from example
        daily_interest_rate: 2, // Default from example  
        // Client data for contract PDF
        client_name: existingClient ? existingClient.name : formData.name,
        client_cpf: existingClient ? existingClient.cpf : formData.cpf,
        client_city: existingClient ? existingClient.city || undefined : formData.city || undefined,
        client_state: existingClient ? existingClient.state || undefined : formData.state || undefined,
        company_name: "Credifacil Global",
      });
      
      // Navigate back to client dossier if adding to existing client
      if (existingClient) {
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

      {/* Existing Client Info Banner */}
      {existingClient && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-2xl border border-accent/50 bg-accent/10 p-4"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/20">
              <UserCheck className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="font-medium text-foreground">Cliente existente selecionado</p>
              <p className="text-sm text-muted-foreground">
                {existingClient.name} • CPF: {existingClient.cpf}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Form Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Step 1: Client Data with Photo - Only show if new client */}
          {!existingClient && (
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
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">
                  CPF *
                </label>
                <input
                  type="text"
                  value={formData.cpf}
                  onChange={(e) =>
                    setFormData({ ...formData, cpf: maskCPF(e.target.value) })
                  }
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className="h-11 w-full rounded-xl border border-border bg-secondary/50 px-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
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

          {/* Step 2: Address - Only show if new client */}
          {!existingClient && (
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
                </span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-border/50">
                <span className="text-muted-foreground">Parcelas</span>
                <span className="font-display font-semibold text-foreground">
                  {formData.installments || 0}x
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
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isSaving || isUploadingAvatar || !formData.name || !formData.cpf || !formData.startDate || !formData.firstDueDate}
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

import { MainLayout } from "@/components/layout/MainLayout";
import { motion } from "framer-motion";
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useClients } from "@/hooks/useClients";
import { useContracts } from "@/hooks/useContracts";
import {
  Calculator,
  User,
  MapPin,
  Calendar,
  DollarSign,
  Percent,
  Hash,
  ChevronRight,
  Sparkles,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

type CalculationMode = "rate" | "installment";

const NovoContrato = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createClient, isCreating: isCreatingClient } = useClients();
  const { createContract, isCreating: isCreatingContract } = useContracts();
  const [mode, setMode] = useState<CalculationMode>("rate");
  const [isLoadingCep, setIsLoadingCep] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
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
    capital: 10000,
    interestRate: 10,
    installments: 12,
    installmentValue: 0,
    frequency: "mensal",
    startDate: "",
    firstDueDate: "",
    paidInstallments: 0,
  });

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
  // Juros simples: Total = Capital × (1 + Taxa)
  // Exemplo: R$ 1000 a 10% = R$ 1100, em 10 parcelas = R$ 110 cada
  const calculateInstallment = () => {
    const { capital, interestRate, installments } = formData;
    const rate = interestRate / 100;
    const totalAmount = capital * (1 + rate);
    return totalAmount / installments;
  };

  const calculateRate = () => {
    const { capital, installmentValue, installments } = formData;
    if (installmentValue <= 0 || capital <= 0) return 0;
    const totalAmount = installmentValue * installments;
    const profit = totalAmount - capital;
    const rate = (profit / capital) * 100;
    return rate;
  };

  const installmentResult = mode === "rate" ? calculateInstallment() : formData.installmentValue;
  const rateResult = mode === "installment" ? calculateRate() : formData.interestRate;
  const totalAmount = installmentResult * formData.installments;
  const totalProfit = totalAmount - formData.capital;

  const frequencies = [
    { value: "diario", label: "Diário" },
    { value: "semanal", label: "Semanal" },
    { value: "quinzenal", label: "Quinzenal" },
    { value: "mensal", label: "Mensal" },
  ];

  return (
    <MainLayout>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="font-display text-3xl font-bold text-foreground">
          Novo Contrato
        </h1>
        <p className="mt-1 text-muted-foreground">
          Registre um novo empréstimo para seu cliente
        </p>
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Form Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Calculator Mode Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
                <Calculator className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold text-foreground">
                  Motor de Cálculo
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
                  Capital (R$)
                </label>
                <input
                  type="number"
                  value={formData.capital}
                  onChange={(e) =>
                    setFormData({ ...formData, capital: Number(e.target.value) })
                  }
                  className="h-12 w-full rounded-xl border border-border bg-secondary/50 px-4 font-display text-lg font-semibold text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {mode === "rate" ? (
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted-foreground">
                    Taxa de Juros (%)
                  </label>
                  <input
                    type="number"
                    value={formData.interestRate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        interestRate: Number(e.target.value),
                      })
                    }
                    className="h-12 w-full rounded-xl border border-border bg-secondary/50 px-4 font-display text-lg font-semibold text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              ) : (
                <div>
                  <label className="mb-2 block text-sm font-medium text-muted-foreground">
                    Valor da Parcela (R$)
                  </label>
                  <input
                    type="number"
                    value={formData.installmentValue}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        installmentValue: Number(e.target.value),
                      })
                    }
                    className="h-12 w-full rounded-xl border border-border bg-secondary/50 px-4 font-display text-lg font-semibold text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">
                  Nº de Parcelas
                </label>
                <input
                  type="number"
                  value={formData.installments}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      installments: Number(e.target.value),
                    })
                  }
                  className="h-12 w-full rounded-xl border border-border bg-secondary/50 px-4 font-display text-lg font-semibold text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </motion.div>

          {/* Client Data */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">
                  Nome Completo
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
                  CPF
                </label>
                <input
                  type="text"
                  value={formData.cpf}
                  onChange={(e) =>
                    setFormData({ ...formData, cpf: e.target.value })
                  }
                  placeholder="123.456.789-00"
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
                    setFormData({ ...formData, whatsapp: e.target.value })
                  }
                  placeholder="(11) 98765-4321"
                  className="h-11 w-full rounded-xl border border-border bg-secondary/50 px-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </motion.div>

          {/* Address */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
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
                      const value = e.target.value;
                      setFormData({ ...formData, cep: value });
                      // Auto-fetch when CEP has 8 digits (with or without hyphen)
                      const cleanCep = value.replace(/\D/g, "");
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

          {/* Contract Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-6"
          >
            <div className="flex items-center gap-3 mb-6">
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">
                  Frequência
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) =>
                    setFormData({ ...formData, frequency: e.target.value })
                  }
                  className="h-11 w-full rounded-xl border border-border bg-secondary/50 px-4 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {frequencies.map((freq) => (
                    <option key={freq.value} value={freq.value}>
                      {freq.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">
                  Data de Início
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
                  Primeiro Vencimento
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
                  value={formData.paidInstallments}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      paidInstallments: Number(e.target.value),
                    })
                  }
                  min={0}
                  max={formData.installments - 1}
                  className="h-11 w-full rounded-xl border border-border bg-secondary/50 px-4 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
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

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-border/50">
                <span className="text-muted-foreground">Capital</span>
                <span className="font-display font-semibold text-foreground">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(formData.capital)}
                </span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-border/50">
                <span className="text-muted-foreground">Taxa de Juros</span>
                <span className="font-display font-semibold text-foreground">
                  {rateResult.toFixed(2)}%
                </span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-border/50">
                <span className="text-muted-foreground">Parcelas</span>
                <span className="font-display font-semibold text-foreground">
                  {formData.installments}x
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
              disabled={isSaving || !formData.name || !formData.cpf || !formData.startDate || !formData.firstDueDate}
              onClick={async () => {
                if (!formData.name || !formData.cpf) {
                  toast({ title: "Erro", description: "Preencha o nome e CPF do cliente.", variant: "destructive" });
                  return;
                }
                if (!formData.startDate || !formData.firstDueDate) {
                  toast({ title: "Erro", description: "Preencha as datas do contrato.", variant: "destructive" });
                  return;
                }
                setIsSaving(true);
                try {
                  // Import supabase
                  const { supabase } = await import("@/integrations/supabase/client");
                  const { data: { user } } = await supabase.auth.getUser();
                  
                  // Create client first
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
                  
                  // Then create contract
                  await createContract({
                    client_id: clientData.id,
                    capital: formData.capital,
                    interest_rate: rateResult,
                    installments: formData.installments,
                    installment_value: installmentResult,
                    total_amount: totalAmount,
                    total_profit: totalProfit,
                    frequency: formData.frequency as any,
                    start_date: formData.startDate,
                    first_due_date: formData.firstDueDate,
                    paid_installments: formData.paidInstallments,
                  });
                  navigate("/clientes");
                } catch (error: any) {
                  toast({ title: "Erro ao criar contrato", description: error.message, variant: "destructive" });
                } finally {
                  setIsSaving(false);
                }
              }}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-gold py-4 font-display font-semibold text-primary-foreground shadow-gold transition-shadow hover:shadow-gold-lg disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
              {isSaving ? "Salvando..." : "Criar Contrato"}
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

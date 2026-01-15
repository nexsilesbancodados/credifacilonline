import { MainLayout } from "@/components/layout/MainLayout";
import { motion } from "framer-motion";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Phone,
  Mail,
  MessageCircle,
  MapPin,
  Calendar,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  RefreshCw,
  Sparkles,
  DollarSign,
  User,
  Edit,
  Download,
  Loader2,
  FolderOpen,
  Banknote,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { InstallmentSchedule } from "@/components/client/InstallmentSchedule";
import { ActivityHistory } from "@/components/client/ActivityHistory";
import { RenegotiationDialog } from "@/components/client/RenegotiationDialog";
import { PaymentDialog } from "@/components/client/PaymentDialog";
import { BulkPaymentDialog } from "@/components/client/BulkPaymentDialog";
import { AIMessageDialog } from "@/components/client/AIMessageDialog";
import { ClientScoreBadge } from "@/components/client/ClientScoreBadge";
import { DocumentUpload } from "@/components/documents/DocumentUpload";
import { DocumentList } from "@/components/documents/DocumentList";
import { useClients } from "@/hooks/useClients";
import { useContracts, useInstallments } from "@/hooks/useContracts";
import { useActivityHistory } from "@/hooks/useActivityHistory";

const statusStyles = {
  Ativo: "bg-success/20 text-success border-success/30",
  Atraso: "bg-destructive/20 text-destructive border-destructive/30",
  Quitado: "bg-accent/20 text-accent border-accent/30",
};

const ClienteDossie = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<"parcelas" | "historico" | "documentos">("parcelas");
  const [isRenegotiationOpen, setIsRenegotiationOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isBulkPaymentOpen, setIsBulkPaymentOpen] = useState(false);
  const [isAIMessageOpen, setIsAIMessageOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<any>(null);
  const [refreshDocuments, setRefreshDocuments] = useState(0);

  // Fetch real data
  const { clients, isLoading: isLoadingClients } = useClients();
  const { contracts, isLoading: isLoadingContracts } = useContracts();
  const { installments, isLoading: isLoadingInstallments } = useInstallments();
  const { data: activityData, isLoading: isLoadingActivity } = useActivityHistory("all", "", 1, 50);

  const isLoading = isLoadingClients || isLoadingContracts || isLoadingInstallments;

  // Find client by ID
  const client = useMemo(() => {
    return clients.find(c => c.id === id);
  }, [clients, id]);

  // Get client contracts
  const clientContracts = useMemo(() => {
    if (!client) return [];
    return contracts.filter(c => c.client_id === client.id);
  }, [contracts, client]);

  // Get active contract
  const activeContract = useMemo(() => {
    return clientContracts.find(c => c.status === "Ativo" || c.status === "Atraso") || clientContracts[0];
  }, [clientContracts]);

  // Get client installments
  const clientInstallments = useMemo(() => {
    if (!activeContract) return [];
    return installments
      .filter(i => i.contract_id === activeContract.id)
      .sort((a, b) => a.installment_number - b.installment_number);
  }, [installments, activeContract]);

  // Calculate financial summary
  const financialSummary = useMemo(() => {
    if (!activeContract || clientInstallments.length === 0) {
      return {
        totalLoan: 0,
        totalProfit: 0,
        totalAmount: 0,
        paidAmount: 0,
        pendingAmount: 0,
        installmentValue: 0,
        totalInstallments: 0,
        paidInstallments: 0,
        interestRate: 0,
      };
    }

    const paidInstallments = clientInstallments.filter(i => i.status === "Pago");
    const pendingInstallments = clientInstallments.filter(i => i.status !== "Pago");

    const paidAmount = paidInstallments.reduce((sum, i) => sum + (Number(i.amount_paid) || Number(i.amount_due)), 0);
    const pendingAmount = pendingInstallments.reduce((sum, i) => sum + Number(i.amount_due), 0);

    return {
      totalLoan: Number(activeContract.capital),
      totalProfit: Number(activeContract.total_profit),
      totalAmount: Number(activeContract.total_amount),
      paidAmount,
      pendingAmount,
      installmentValue: Number(activeContract.installment_value),
      totalInstallments: activeContract.installments,
      paidInstallments: paidInstallments.length,
      interestRate: Number(activeContract.interest_rate),
    };
  }, [activeContract, clientInstallments]);

  // Map installments to UI format
  const mappedInstallments = useMemo(() => {
    return clientInstallments.map(inst => ({
      id: inst.id,
      number: inst.installment_number,
      dueDate: inst.due_date,
      amount: Number(inst.amount_due),
      status: inst.status as "Pago" | "Pendente" | "Atrasado" | "Agendado",
      paymentDate: inst.payment_date,
      fine: Number(inst.fine) || 0,
    }));
  }, [clientInstallments]);

  // Map activities
  const activities = useMemo(() => {
    if (!activityData?.activities) return [];
    return activityData.activities
      .filter(a => a.client_id === id)
      .slice(0, 20)
      .map(a => ({
        id: a.id,
        type: a.type as "payment" | "message" | "call" | "renegotiation" | "contract",
        date: a.created_at,
        description: a.description,
        amount: a.metadata?.amount as number | undefined,
      }));
  }, [activityData, id]);

  const progress = financialSummary.totalInstallments > 0 
    ? Math.round((financialSummary.paidInstallments / financialSummary.totalInstallments) * 100) 
    : 0;

  const handlePayment = (installment: any) => {
    setSelectedInstallment(installment);
    setIsPaymentOpen(true);
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!client) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-24">
          <User className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Cliente não encontrado</h2>
          <p className="text-muted-foreground mb-4">O cliente solicitado não foi encontrado.</p>
          <Link to="/clientes" className="text-primary hover:underline">
            Voltar para Clientes
          </Link>
        </div>
      </MainLayout>
    );
  }

  const clientForDialogs = {
    id: client.id,
    name: client.name,
    cpf: client.cpf,
    email: client.email || "",
    whatsApp: client.whatsapp || "",
    phone: client.whatsapp || "",
    avatar: client.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase(),
    status: client.status as "Ativo" | "Atraso" | "Quitado",
    createdAt: client.created_at,
    address: {
      street: client.street || "",
      number: client.number || "",
      complement: client.complement || "",
      neighborhood: client.neighborhood || "",
      city: client.city || "",
      state: client.state || "",
      cep: client.cep || "",
    },
    financialSummary,
    contract: activeContract ? {
      id: activeContract.id.slice(0, 8),
      startDate: activeContract.start_date,
      frequency: activeContract.frequency,
      firstDueDate: activeContract.first_due_date,
    } : undefined,
  };

  return (
    <MainLayout>
      {/* Header with Back Button */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <Link
          to="/clientes"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Clientes
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-gold font-display text-xl font-bold text-primary-foreground">
              {clientForDialogs.avatar}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-display text-2xl font-bold text-foreground">
                  {client.name}
                </h1>
                <ClientScoreBadge clientId={id || ""} size="md" />
                <span
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium",
                    statusStyles[client.status as keyof typeof statusStyles] || statusStyles.Ativo
                  )}
                >
                  {client.status}
                </span>
              </div>
              <p className="text-muted-foreground">CPF: {client.cpf}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsPaymentOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-success px-4 py-2.5 text-sm font-medium text-success-foreground transition-colors hover:bg-success/90"
            >
              <DollarSign className="h-4 w-4" />
              Registrar Pagamento
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsBulkPaymentOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Banknote className="h-4 w-4" />
              Pagamento Parcial
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsRenegotiationOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
            >
              <RefreshCw className="h-4 w-4" />
              Renegociar
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsAIMessageOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-gradient-gold px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-gold transition-shadow hover:shadow-gold"
            >
              <Sparkles className="h-4 w-4" />
              Gerar Cobrança IA
            </motion.button>
          </div>
        </div>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Client Info */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="space-y-4"
        >
          {/* Contact Card */}
          <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-5">
            <h3 className="mb-4 font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Contato
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="text-foreground">{client.whatsapp || "Não informado"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="text-foreground">{client.whatsapp || "Não informado"}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="text-foreground">{client.email || "Não informado"}</span>
              </div>
            </div>
          </div>

          {/* Address Card */}
          <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-5">
            <h3 className="mb-4 font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Endereço
            </h3>
            <div className="flex gap-3 text-sm">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary">
                <MapPin className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-foreground">
                {client.street ? (
                  <>
                    <p>{client.street}, {client.number}</p>
                    {client.complement && <p>{client.complement}</p>}
                    <p>{client.neighborhood}</p>
                    <p>{client.city} - {client.state}</p>
                    <p className="text-muted-foreground">CEP: {client.cep}</p>
                  </>
                ) : (
                  <p className="text-muted-foreground">Endereço não informado</p>
                )}
              </div>
            </div>
          </div>

          {/* Contract Info */}
          {activeContract && (
            <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-5">
              <h3 className="mb-4 font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                Dados do Contrato
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nº Contrato</span>
                  <span className="font-medium text-foreground">{activeContract.id.slice(0, 8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data Início</span>
                  <span className="font-medium text-foreground">
                    {new Date(activeContract.start_date).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Frequência</span>
                  <span className="font-medium text-foreground capitalize">{activeContract.frequency}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Taxa de Juros</span>
                  <span className="font-medium text-primary">{activeContract.interest_rate}% a.m.</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cliente desde</span>
                  <span className="font-medium text-foreground">
                    {new Date(client.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Right Column - Financial Summary & Tabs */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-2 space-y-4"
        >
          {/* Financial Summary */}
          <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-5">
            <h3 className="mb-4 font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Resumo Financeiro
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="rounded-xl bg-secondary/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Capital</span>
                </div>
                <p className="font-display text-lg font-bold text-foreground">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(financialSummary.totalLoan)}
                </p>
              </div>
              
              <div className="rounded-xl bg-secondary/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-success" />
                  <span className="text-xs text-muted-foreground">Lucro</span>
                </div>
                <p className="font-display text-lg font-bold text-success">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(financialSummary.totalProfit)}
                </p>
              </div>
              
              <div className="rounded-xl bg-secondary/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Pago</span>
                </div>
                <p className="font-display text-lg font-bold text-primary">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(financialSummary.paidAmount)}
                </p>
              </div>
              
              <div className="rounded-xl bg-secondary/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-destructive" />
                  <span className="text-xs text-muted-foreground">Pendente</span>
                </div>
                <p className="font-display text-lg font-bold text-destructive">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(financialSummary.pendingAmount)}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progresso do Contrato</span>
                <span className="font-medium text-foreground">
                  {financialSummary.paidInstallments} de {financialSummary.totalInstallments} parcelas
                </span>
              </div>
              <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                  className="absolute left-0 top-0 h-full rounded-full bg-gradient-gold"
                />
              </div>
              <p className="text-right text-xs text-muted-foreground">{progress}% concluído</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 overflow-hidden">
            <div className="flex border-b border-border/50">
              <button
                onClick={() => setActiveTab("parcelas")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium transition-all",
                  activeTab === "parcelas"
                    ? "bg-primary/10 text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
                )}
              >
                <Calendar className="h-4 w-4" />
                Parcelas
              </button>
              <button
                onClick={() => setActiveTab("historico")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium transition-all",
                  activeTab === "historico"
                    ? "bg-primary/10 text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
                )}
              >
                <FileText className="h-4 w-4" />
                Histórico
              </button>
              <button
                onClick={() => setActiveTab("documentos")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium transition-all",
                  activeTab === "documentos"
                    ? "bg-primary/10 text-primary border-b-2 border-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
                )}
              >
                <FolderOpen className="h-4 w-4" />
                Documentos
              </button>
            </div>

            <div className="p-4">
              {activeTab === "parcelas" && (
                <InstallmentSchedule 
                  installments={mappedInstallments} 
                  onPayment={handlePayment}
                />
              )}
              {activeTab === "historico" && (
                <ActivityHistory activities={activities} />
              )}
              {activeTab === "documentos" && (
                <div className="space-y-4">
                  <DocumentUpload clientId={id} />
                  <DocumentList clientId={id} />
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Dialogs */}
      <RenegotiationDialog 
        open={isRenegotiationOpen} 
        onOpenChange={setIsRenegotiationOpen}
        client={clientForDialogs}
      />
      
      <PaymentDialog 
        open={isPaymentOpen} 
        onOpenChange={setIsPaymentOpen}
        installment={selectedInstallment}
        clientName={client.name}
      />

      <BulkPaymentDialog
        open={isBulkPaymentOpen}
        onOpenChange={setIsBulkPaymentOpen}
        installments={clientInstallments}
        clientName={client.name}
        clientId={client.id}
      />
      
      <AIMessageDialog 
        open={isAIMessageOpen} 
        onOpenChange={setIsAIMessageOpen}
        client={clientForDialogs}
      />
    </MainLayout>
  );
};

export default ClienteDossie;
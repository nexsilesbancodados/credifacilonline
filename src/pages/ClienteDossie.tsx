import { MainLayout } from "@/components/layout/MainLayout";
import { motion } from "framer-motion";
import { useParams, Link, useNavigate } from "react-router-dom";
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
  Settings,
  Trash2,
  Archive,
  ArchiveRestore,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useMemo } from "react";
import { InstallmentSchedule } from "@/components/client/InstallmentSchedule";
import { ActivityHistory } from "@/components/client/ActivityHistory";
import { RenegotiationDialog } from "@/components/client/RenegotiationDialog";
import { PaymentDialog } from "@/components/client/PaymentDialog";
import { BulkPaymentDialog } from "@/components/client/BulkPaymentDialog";
import { AIMessageDialog } from "@/components/client/AIMessageDialog";
import { EditDossierDialog } from "@/components/client/EditDossierDialog";
import { ManageInstallmentsDialog } from "@/components/client/ManageInstallmentsDialog";
import { DeleteClientDialog } from "@/components/client/DeleteClientDialog";
import { ArchiveClientDialog } from "@/components/client/ArchiveClientDialog";
import { ClientScoreBadge } from "@/components/client/ClientScoreBadge";
import { DocumentUpload } from "@/components/documents/DocumentUpload";
import { DocumentList } from "@/components/documents/DocumentList";
import { useClients, Client } from "@/hooks/useClients";
import { useContracts, useInstallments } from "@/hooks/useContracts";
import { useActivityHistory } from "@/hooks/useActivityHistory";
import { useClientScore } from "@/hooks/useClientScore";
import { useToast } from "@/hooks/use-toast";
import { generateClientDossierPDF } from "@/lib/generateDossierPDF";

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
  const [isEditClientOpen, setIsEditClientOpen] = useState(false);
  const [isManageInstallmentsOpen, setIsManageInstallmentsOpen] = useState(false);
  const [isDeleteClientOpen, setIsDeleteClientOpen] = useState(false);
  const [isArchiveClientOpen, setIsArchiveClientOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<any>(null);
  const [refreshDocuments, setRefreshDocuments] = useState(0);

  const navigate = useNavigate();
  const { toast } = useToast();

  // Fetch real data
  const { clients, isLoading: isLoadingClients, deleteClient } = useClients();
  const { contracts, isLoading: isLoadingContracts } = useContracts();
  const { installments, isLoading: isLoadingInstallments } = useInstallments();
  const { data: activityData, isLoading: isLoadingActivity } = useActivityHistory("all", "", 1, 50);
  const { score } = useClientScore(id || "");

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
      amountPaid: Number(inst.amount_paid) || 0,
      status: inst.status as "Pago" | "Pendente" | "Atrasado" | "Agendado",
      paymentDate: inst.payment_date,
      fine: Number(inst.fine) || 0,
      client_id: inst.client_id,
      contract_id: inst.contract_id,
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

  const handleExportPDF = () => {
    if (!client) return;
    
    generateClientDossierPDF({
      client: {
        name: client.name,
        cpf: client.cpf,
        email: client.email || undefined,
        whatsapp: client.whatsapp || undefined,
        street: client.street || undefined,
        number: client.number || undefined,
        complement: client.complement || undefined,
        neighborhood: client.neighborhood || undefined,
        city: client.city || undefined,
        state: client.state || undefined,
        cep: client.cep || undefined,
        status: client.status,
      },
      contract: activeContract ? {
        id: activeContract.id,
        capital: Number(activeContract.capital),
        interest_rate: Number(activeContract.interest_rate),
        installments: activeContract.installments,
        installment_value: Number(activeContract.installment_value),
        total_amount: Number(activeContract.total_amount),
        total_profit: Number(activeContract.total_profit),
        frequency: activeContract.frequency,
        start_date: activeContract.start_date,
        first_due_date: activeContract.first_due_date,
        status: activeContract.status,
      } : undefined,
      installments: clientInstallments.map(i => ({
        installment_number: i.installment_number,
        due_date: i.due_date,
        amount_due: Number(i.amount_due),
        amount_paid: i.amount_paid ? Number(i.amount_paid) : undefined,
        status: i.status,
        payment_date: i.payment_date || undefined,
        fine: i.fine ? Number(i.fine) : undefined,
      })),
      activities: activities.map(a => ({
        type: a.type,
        description: a.description,
        created_at: a.date,
      })),
      score,
    });
    
    toast({
      title: "PDF Gerado!",
      description: "O dossiê foi exportado com sucesso.",
    });
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
    contractId: activeContract?.id, // Full contract ID for renegotiation
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
            {client.avatar_url ? (
              <img
                src={client.avatar_url}
                alt={client.name}
                className="h-16 w-16 rounded-full object-cover border-2 border-primary/30"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-gold font-display text-xl font-bold text-primary-foreground">
                {clientForDialogs.avatar}
              </div>
            )}
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
              Pagamento
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsBulkPaymentOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              <Banknote className="h-4 w-4" />
              Parcial
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
              IA
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleExportPDF}
              className="flex items-center gap-2 rounded-xl border border-primary/50 bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
            >
              <Download className="h-4 w-4" />
              PDF
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsEditClientOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              <Edit className="h-4 w-4" />
              Editar
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsManageInstallmentsOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
            >
              <Settings className="h-4 w-4" />
              Parcelas
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsArchiveClientOpen(true)}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors",
                client.archived_at
                  ? "border-success/50 bg-success/10 text-success hover:bg-success/20"
                  : "border-warning/50 bg-warning/10 text-warning hover:bg-warning/20"
              )}
            >
              {client.archived_at ? (
                <>
                  <ArchiveRestore className="h-4 w-4" />
                  Restaurar
                </>
              ) : (
                <>
                  <Archive className="h-4 w-4" />
                  Arquivar
                </>
              )}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsDeleteClientOpen(true)}
              className="flex items-center gap-2 rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/20"
            >
              <Trash2 className="h-4 w-4" />
              Excluir
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
        clientId={client.id}
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

      <EditDossierDialog
        open={isEditClientOpen}
        onOpenChange={setIsEditClientOpen}
        client={client as Client}
        contract={activeContract ? {
          id: activeContract.id,
          capital: Number(activeContract.capital),
          interest_rate: Number(activeContract.interest_rate),
          installments: activeContract.installments,
          installment_value: Number(activeContract.installment_value),
          total_amount: Number(activeContract.total_amount),
          total_profit: Number(activeContract.total_profit),
          frequency: activeContract.frequency,
          start_date: activeContract.start_date,
          first_due_date: activeContract.first_due_date,
          status: activeContract.status,
          fine_percentage: (activeContract as any).fine_percentage ?? 2,
          daily_interest_rate: (activeContract as any).daily_interest_rate ?? 0.033,
          daily_type: activeContract.daily_type || undefined,
        } : null}
      />

      <ManageInstallmentsDialog
        open={isManageInstallmentsOpen}
        onOpenChange={setIsManageInstallmentsOpen}
        installments={clientInstallments}
        clientName={client.name}
        contractId={activeContract?.id || ""}
      />

      <DeleteClientDialog
        open={isDeleteClientOpen}
        onOpenChange={setIsDeleteClientOpen}
        clientId={client.id}
        clientName={client.name}
      />

      <ArchiveClientDialog
        open={isArchiveClientOpen}
        onOpenChange={setIsArchiveClientOpen}
        clientId={client.id}
        clientName={client.name}
        isArchived={!!client.archived_at}
      />
    </MainLayout>
  );
};

export default ClienteDossie;
import { MainLayout } from "@/components/layout/MainLayout";
import { motion } from "framer-motion";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
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
  PlusCircle,
  MoreHorizontal,
  ExternalLink,
  Copy,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { QueryErrorState } from "@/components/QueryErrorState";

const statusConfig = {
  Ativo: { label: "Ativo", className: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400", icon: CheckCircle2 },
  Atraso: { label: "Em Atraso", className: "bg-red-500/15 text-red-600 border-red-500/30 dark:text-red-400", icon: AlertTriangle },
  Quitado: { label: "Quitado", className: "bg-blue-500/15 text-blue-600 border-blue-500/30 dark:text-blue-400", icon: CheckCircle2 },
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

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
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null);

  const navigate = useNavigate();
  const { toast } = useToast();

  const { clients, isLoading: isLoadingClients, isError: isErrorClients, refetch: refetchClients, deleteClient } = useClients();
  const { contracts, isLoading: isLoadingContracts, isError: isErrorContracts } = useContracts();
  const { installments, isLoading: isLoadingInstallments } = useInstallments();
  const { data: activityData, isLoading: isLoadingActivity } = useActivityHistory("all", "", 1, 50);
  const { score } = useClientScore(id || "");

  const isLoading = isLoadingClients || isLoadingContracts || isLoadingInstallments;
  const isError = isErrorClients || isErrorContracts;

  const client = useMemo(() => clients.find(c => c.id === id), [clients, id]);

  const clientContracts = useMemo(() => {
    if (!client) return [];
    return contracts.filter(c => c.client_id === client.id);
  }, [contracts, client]);

  const activeContracts = useMemo(() => {
    return clientContracts.filter(c => c.status === "Ativo" || c.status === "Atraso");
  }, [clientContracts]);

  const activeContract = useMemo(() => {
    if (selectedContractId) return clientContracts.find(c => c.id === selectedContractId);
    return activeContracts[0] || clientContracts[0];
  }, [clientContracts, activeContracts, selectedContractId]);

  const clientInstallments = useMemo(() => {
    if (!activeContract) return [];
    return installments
      .filter(i => i.contract_id === activeContract.id)
      .sort((a, b) => a.installment_number - b.installment_number);
  }, [installments, activeContract]);

  const financialSummary = useMemo(() => {
    if (!activeContract || clientInstallments.length === 0) {
      return { totalLoan: 0, totalProfit: 0, totalAmount: 0, paidAmount: 0, pendingAmount: 0, installmentValue: 0, totalInstallments: 0, paidInstallments: 0, interestRate: 0 };
    }
    const paidInst = clientInstallments.filter(i => i.status === "Pago");
    const pendingInst = clientInstallments.filter(i => i.status !== "Pago");
    return {
      totalLoan: Number(activeContract.capital),
      totalProfit: Number(activeContract.total_profit),
      totalAmount: Number(activeContract.total_amount),
      paidAmount: paidInst.reduce((sum, i) => sum + (Number(i.amount_paid) || Number(i.amount_due)), 0),
      pendingAmount: pendingInst.reduce((sum, i) => sum + Number(i.amount_due), 0),
      installmentValue: Number(activeContract.installment_value),
      totalInstallments: activeContract.installments,
      paidInstallments: paidInst.length,
      interestRate: Number(activeContract.interest_rate),
    };
  }, [activeContract, clientInstallments]);

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

  const overdueCount = clientInstallments.filter(i => i.status === "Atrasado").length;
  const nextInstallment = clientInstallments.find(i => i.status === "Pendente" || i.status === "Atrasado");

  const handlePayment = (installment: { id: string; number: number; dueDate: string; amount: number; amountPaid?: number; status: string; paymentDate: string | null; fine: number }) => {
    setSelectedInstallment(installment as unknown as typeof clientInstallments[number]);
    setIsPaymentOpen(true);
  };

  const handleExportPDF = () => {
    if (!client) return;
    generateClientDossierPDF({
      client: { name: client.name, cpf: client.cpf, email: client.email || undefined, whatsapp: client.whatsapp || undefined, street: client.street || undefined, number: client.number || undefined, complement: client.complement || undefined, neighborhood: client.neighborhood || undefined, city: client.city || undefined, state: client.state || undefined, cep: client.cep || undefined, status: client.status },
      contract: activeContract ? { id: activeContract.id, capital: Number(activeContract.capital), interest_rate: Number(activeContract.interest_rate), installments: activeContract.installments, installment_value: Number(activeContract.installment_value), total_amount: Number(activeContract.total_amount), total_profit: Number(activeContract.total_profit), frequency: activeContract.frequency, start_date: activeContract.start_date, first_due_date: activeContract.first_due_date, status: activeContract.status } : undefined,
      installments: clientInstallments.map(i => ({ installment_number: i.installment_number, due_date: i.due_date, amount_due: Number(i.amount_due), amount_paid: i.amount_paid ? Number(i.amount_paid) : undefined, status: i.status, payment_date: i.payment_date || undefined, fine: i.fine ? Number(i.fine) : undefined })),
      activities: activities.map(a => ({ type: a.type, description: a.description, created_at: a.date })),
      score,
    });
    toast({ title: "PDF Gerado!", description: "O dossiê foi exportado com sucesso." });
  };

  const handleCopyCPF = () => {
    if (client) {
      navigator.clipboard.writeText(client.cpf);
      toast({ title: "CPF copiado!" });
    }
  };

  if (isError) {
    return (
      <MainLayout>
        <QueryErrorState message="Erro ao carregar dados do cliente" onRetry={refetchClients} />
      </MainLayout>
    );
  }

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
          <Link to="/clientes" className="text-primary hover:underline">Voltar para Clientes</Link>
        </div>
      </MainLayout>
    );
  }

  const avatar = client.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const statusInfo = statusConfig[client.status as keyof typeof statusConfig] || statusConfig.Ativo;
  const StatusIcon = statusInfo.icon;

  const clientForDialogs = {
    id: client.id, name: client.name, cpf: client.cpf, email: client.email || "", whatsApp: client.whatsapp || "", phone: client.whatsapp || "", avatar, status: client.status as "Ativo" | "Atraso" | "Quitado", createdAt: client.created_at, contractId: activeContract?.id,
    address: { street: client.street || "", number: client.number || "", complement: client.complement || "", neighborhood: client.neighborhood || "", city: client.city || "", state: client.state || "", cep: client.cep || "" },
    financialSummary,
    contract: activeContract ? { id: activeContract.id.slice(0, 8), startDate: activeContract.start_date, frequency: activeContract.frequency, firstDueDate: activeContract.first_due_date } : undefined,
  };

  return (
    <MainLayout>
      <TooltipProvider delayDuration={300}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <Link to="/clientes" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-4 group">
            <ArrowLeft className="h-3 w-3 group-hover:-translate-x-0.5 transition-transform" />
            Voltar para Clientes
          </Link>

          <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-sm p-5 relative overflow-hidden">
            {/* Subtle gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-primary/60 via-primary to-primary/60" />

            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Client Identity */}
              <div className="flex items-center gap-4">
                {client.avatar_url ? (
                  <img src={client.avatar_url} alt={client.name} className="h-14 w-14 rounded-2xl object-cover ring-2 ring-border shadow-md" />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 font-display text-lg font-bold text-primary ring-1 ring-primary/20 shadow-md">
                    {avatar}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="font-display text-xl font-bold text-foreground truncate">{client.name}</h1>
                    <div className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", statusInfo.className)}>
                      <StatusIcon className="h-3 w-3" />
                      {statusInfo.label}
                    </div>
                    <ClientScoreBadge clientId={id || ""} size="md" />
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-xs text-muted-foreground font-mono tracking-wide">CPF: {client.cpf}</span>
                    <button onClick={handleCopyCPF} className="text-muted-foreground/50 hover:text-foreground transition-colors p-0.5 rounded hover:bg-secondary">
                      <Copy className="h-3 w-3" />
                    </button>
                    {client.whatsapp && (
                      <>
                        <span className="text-muted-foreground/30 mx-1">|</span>
                        <a href={`https://wa.me/55${client.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-emerald-500 hover:text-emerald-400 transition-colors">
                          <MessageCircle className="h-3 w-3" />
                          {client.whatsapp}
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button onClick={() => setIsPaymentOpen(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white transition-all shadow-sm shadow-emerald-600/20 hover:shadow-emerald-500/30 active:scale-[0.97]">
                      <DollarSign className="h-4 w-4" />
                      <span className="hidden sm:inline">Pagamento</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Registrar pagamento</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button onClick={() => setIsAIMessageOpen(true)} className="inline-flex items-center gap-1.5 rounded-xl bg-primary hover:bg-primary/90 px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all shadow-sm shadow-primary/20 active:scale-[0.97]">
                      <Sparkles className="h-4 w-4" />
                      <span className="hidden sm:inline">Mensagem IA</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Gerar mensagem com IA</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button onClick={() => setIsEditClientOpen(true)} className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card hover:bg-secondary px-3.5 py-2.5 text-sm font-medium text-foreground transition-all active:scale-[0.97]">
                      <Edit className="h-4 w-4" />
                      <span className="hidden sm:inline">Editar</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>Editar dossiê</TooltipContent>
                </Tooltip>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="inline-flex items-center justify-center rounded-xl border border-border bg-card hover:bg-secondary h-10 w-10 text-muted-foreground hover:text-foreground transition-all active:scale-[0.97]">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuItem onClick={() => navigate(`/contratos/novo?clientId=${client.id}`)}>
                      <PlusCircle className="h-4 w-4 mr-2" /> Novo Contrato
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsBulkPaymentOpen(true)}>
                      <Banknote className="h-4 w-4 mr-2" /> Pagamento Parcial
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsRenegotiationOpen(true)}>
                      <RefreshCw className="h-4 w-4 mr-2" /> Renegociar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsManageInstallmentsOpen(true)}>
                      <Settings className="h-4 w-4 mr-2" /> Gerenciar Parcelas
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleExportPDF}>
                      <Download className="h-4 w-4 mr-2" /> Exportar PDF
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setIsArchiveClientOpen(true)}>
                      {client.archived_at ? <><ArchiveRestore className="h-4 w-4 mr-2" /> Restaurar</> : <><Archive className="h-4 w-4 mr-2" /> Arquivar</>}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setIsDeleteClientOpen(true)} className="text-destructive focus:text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" /> Excluir Cliente
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Alert Banner for overdue */}
        {overdueCount > 0 && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mb-4 flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
            <p className="text-sm text-destructive">
              <span className="font-semibold">{overdueCount} parcela{overdueCount > 1 ? "s" : ""} em atraso</span>
              {nextInstallment && <> — próximo vencimento: {parseLocalDate(nextInstallment.due_date).toLocaleDateString("pt-BR")}</>}
            </p>
            <button onClick={() => setIsPaymentOpen(true)} className="ml-auto text-xs font-medium text-destructive hover:underline shrink-0">
              Registrar pagamento →
            </button>
          </motion.div>
        )}

        <div className="grid gap-5 lg:grid-cols-3">
          {/* Left Column */}
          <motion.div initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="space-y-4">
            
            {/* Quick Info Card */}
            <div className="rounded-xl border border-border/50 bg-card p-4 space-y-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Informações</h3>
              
              {/* Contact Info */}
              <div className="space-y-2.5">
                {client.whatsapp && (
                  <a href={`https://wa.me/55${client.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-sm text-foreground hover:text-primary transition-colors group">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 group-hover:bg-emerald-500/20 transition-colors">
                      <MessageCircle className="h-3.5 w-3.5" />
                    </div>
                    <span>{client.whatsapp}</span>
                    <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                  </a>
                )}
                {client.email && (
                  <a href={`mailto:${client.email}`} className="flex items-center gap-2.5 text-sm text-foreground hover:text-primary transition-colors group">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-500/10 text-blue-600">
                      <Mail className="h-3.5 w-3.5" />
                    </div>
                    <span className="truncate">{client.email}</span>
                  </a>
                )}
                {!client.whatsapp && !client.email && (
                  <p className="text-sm text-muted-foreground italic">Nenhum contato cadastrado</p>
                )}
              </div>

              {/* Address */}
              {client.street && (
                <>
                  <div className="border-t border-border/50" />
                  <div className="flex gap-2.5 text-sm">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-orange-500/10 text-orange-600">
                      <MapPin className="h-3.5 w-3.5" />
                    </div>
                    <div className="text-foreground text-sm leading-relaxed">
                      <p>{client.street}, {client.number}{client.complement ? ` - ${client.complement}` : ""}</p>
                      <p className="text-muted-foreground">{client.neighborhood} • {client.city}/{client.state}</p>
                      {client.cep && <p className="text-muted-foreground text-xs mt-0.5">CEP {client.cep}</p>}
                    </div>
                  </div>
                </>
              )}

              {/* Member Since */}
              <div className="border-t border-border/50" />
              <div className="flex items-center gap-2.5 text-sm">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-purple-500/10 text-purple-600">
                  <Calendar className="h-3.5 w-3.5" />
                </div>
                <span className="text-muted-foreground">Cliente desde <span className="text-foreground font-medium">{new Date(client.created_at).toLocaleDateString("pt-BR")}</span></span>
              </div>
            </div>

            {/* Contract Selector */}
            {activeContracts.length > 1 && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Contratos Ativos ({activeContracts.length})
                </h3>
                <div className="space-y-1.5">
                  {activeContracts.map((contract) => (
                    <button
                      key={contract.id}
                      onClick={() => setSelectedContractId(contract.id)}
                      className={cn(
                        "w-full flex items-center justify-between p-2.5 rounded-lg border text-left transition-all text-sm",
                        activeContract?.id === contract.id
                          ? "border-primary bg-primary/10 text-foreground shadow-sm"
                          : "border-transparent hover:bg-secondary/50 text-muted-foreground"
                      )}
                    >
                      <div>
                        <p className="font-medium">#{contract.id.slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground">{formatCurrency(Number(contract.capital))}</p>
                      </div>
                      <Badge variant={contract.status === "Atraso" ? "destructive" : "default"} className="text-[10px] h-5">
                        {contract.status}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Contract Details */}
            {activeContract && (
              <div className="rounded-xl border border-border/50 bg-card p-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Contrato</h3>
                <div className="space-y-2.5 text-sm">
                  {[
                    { label: "Nº Contrato", value: `#${activeContract.id.slice(0, 8)}` },
                    { label: "Início", value: parseLocalDate(activeContract.start_date).toLocaleDateString("pt-BR") },
                    { label: "Frequência", value: activeContract.frequency, capitalize: true },
                    { label: "Juros", value: `${activeContract.interest_rate}% a.m.`, highlight: true },
                    { label: "Parcela", value: formatCurrency(Number(activeContract.installment_value)) },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between items-center">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className={cn("font-medium", item.highlight ? "text-primary" : "text-foreground", item.capitalize && "capitalize")}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Right Column */}
          <motion.div initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }} className="lg:col-span-2 space-y-4">
            
            {/* Financial Summary - Compact Grid */}
            <div className="rounded-xl border border-border/50 bg-card p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Resumo Financeiro</h3>
                {activeContract && (
                  <span className="text-xs text-muted-foreground">
                    {financialSummary.paidInstallments}/{financialSummary.totalInstallments} parcelas pagas
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                {[
                  { label: "Capital", value: financialSummary.totalLoan, icon: CreditCard, color: "text-foreground" },
                  { label: "Lucro", value: financialSummary.totalProfit, icon: TrendingUp, color: "text-emerald-600 dark:text-emerald-400" },
                  { label: "Recebido", value: financialSummary.paidAmount, icon: CheckCircle2, color: "text-primary" },
                  { label: "Pendente", value: financialSummary.pendingAmount, icon: Clock, color: "text-orange-600 dark:text-orange-400" },
                ].map(item => (
                  <div key={item.label} className="rounded-lg bg-secondary/40 p-3">
                    <div className="flex items-center gap-1.5 mb-1">
                      <item.icon className={cn("h-3.5 w-3.5", item.color)} />
                      <span className="text-[11px] text-muted-foreground font-medium">{item.label}</span>
                    </div>
                    <p className={cn("font-display text-base font-bold", item.color)}>
                      {formatCurrency(item.value)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Progress */}
              <div className="space-y-1.5">
                <Progress value={progress} className="h-2" />
                <p className="text-right text-[11px] text-muted-foreground">{progress}% concluído</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
              <div className="flex border-b border-border/50">
                {[
                  { key: "parcelas", label: "Parcelas", icon: Calendar, count: clientInstallments.filter(i => i.status !== "Pago").length },
                  { key: "historico", label: "Histórico", icon: FileText },
                  { key: "documentos", label: "Documentos", icon: FolderOpen },
                ].map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={cn(
                      "flex-1 flex items-center justify-center gap-1.5 px-3 py-3 text-sm font-medium transition-all relative",
                      activeTab === tab.key
                        ? "text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                    {tab.count !== undefined && tab.count > 0 && (
                      <span className="ml-1 text-[10px] bg-primary/10 text-primary rounded-full px-1.5 py-0.5 font-semibold">
                        {tab.count}
                      </span>
                    )}
                    {activeTab === tab.key && (
                      <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                    )}
                  </button>
                ))}
              </div>

              <div className="p-4">
                {activeTab === "parcelas" && <InstallmentSchedule installments={mappedInstallments} onPayment={handlePayment} />}
                {activeTab === "historico" && <ActivityHistory activities={activities} />}
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
        <RenegotiationDialog open={isRenegotiationOpen} onOpenChange={setIsRenegotiationOpen} client={clientForDialogs} />
        <PaymentDialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen} installment={selectedInstallment} clientName={client.name} clientId={client.id} />
        <BulkPaymentDialog open={isBulkPaymentOpen} onOpenChange={setIsBulkPaymentOpen} installments={clientInstallments} clientName={client.name} clientId={client.id} />
        <AIMessageDialog open={isAIMessageOpen} onOpenChange={setIsAIMessageOpen} client={clientForDialogs} />
        <EditDossierDialog open={isEditClientOpen} onOpenChange={setIsEditClientOpen} client={client as Client} contract={activeContract ? { id: activeContract.id, capital: Number(activeContract.capital), interest_rate: Number(activeContract.interest_rate), installments: activeContract.installments, installment_value: Number(activeContract.installment_value), total_amount: Number(activeContract.total_amount), total_profit: Number(activeContract.total_profit), frequency: activeContract.frequency, start_date: activeContract.start_date, first_due_date: activeContract.first_due_date, status: activeContract.status, fine_percentage: (activeContract as any).fine_percentage ?? 2, daily_interest_rate: (activeContract as any).daily_interest_rate ?? 0.033, daily_type: activeContract.daily_type || undefined } : null} />
        <ManageInstallmentsDialog open={isManageInstallmentsOpen} onOpenChange={setIsManageInstallmentsOpen} installments={clientInstallments} clientName={client.name} contractId={activeContract?.id || ""} />
        <DeleteClientDialog open={isDeleteClientOpen} onOpenChange={setIsDeleteClientOpen} clientId={client.id} clientName={client.name} />
        <ArchiveClientDialog open={isArchiveClientOpen} onOpenChange={setIsArchiveClientOpen} clientId={client.id} clientName={client.name} isArchived={!!client.archived_at} />
      </TooltipProvider>
    </MainLayout>
  );
};

export default ClienteDossie;

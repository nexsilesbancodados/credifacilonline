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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { InstallmentSchedule } from "@/components/client/InstallmentSchedule";
import { ActivityHistory } from "@/components/client/ActivityHistory";
import { RenegotiationDialog } from "@/components/client/RenegotiationDialog";
import { PaymentDialog } from "@/components/client/PaymentDialog";
import { AIMessageDialog } from "@/components/client/AIMessageDialog";
import { ClientScoreBadge } from "@/components/client/ClientScoreBadge";

// Mock data for demonstration
const mockClient = {
  id: "1",
  name: "Maria Santos",
  cpf: "123.456.789-00",
  email: "maria@email.com",
  whatsApp: "(11) 98765-4321",
  phone: "(11) 98765-4321",
  avatar: "MS",
  status: "Ativo" as const,
  createdAt: "2024-01-15",
  address: {
    street: "Rua das Flores",
    number: "123",
    complement: "Apto 45",
    neighborhood: "Centro",
    city: "São Paulo",
    state: "SP",
    cep: "01234-567",
  },
  financialSummary: {
    totalLoan: 15000,
    totalProfit: 3000,
    totalAmount: 18000,
    paidAmount: 7500,
    pendingAmount: 10500,
    installmentValue: 1500,
    totalInstallments: 12,
    paidInstallments: 5,
    interestRate: 10,
  },
  contract: {
    id: "CTR-001",
    startDate: "2024-01-15",
    frequency: "mensal",
    firstDueDate: "2024-02-15",
  },
};

const mockInstallments = [
  { id: "1", number: 1, dueDate: "2024-02-15", amount: 1500, status: "Pago" as const, paymentDate: "2024-02-14", fine: 0 },
  { id: "2", number: 2, dueDate: "2024-03-15", amount: 1500, status: "Pago" as const, paymentDate: "2024-03-15", fine: 0 },
  { id: "3", number: 3, dueDate: "2024-04-15", amount: 1500, status: "Pago" as const, paymentDate: "2024-04-16", fine: 15 },
  { id: "4", number: 4, dueDate: "2024-05-15", amount: 1500, status: "Pago" as const, paymentDate: "2024-05-14", fine: 0 },
  { id: "5", number: 5, dueDate: "2024-06-15", amount: 1500, status: "Pago" as const, paymentDate: "2024-06-15", fine: 0 },
  { id: "6", number: 6, dueDate: "2024-07-15", amount: 1500, status: "Atrasado" as const, paymentDate: null, fine: 150 },
  { id: "7", number: 7, dueDate: "2024-08-15", amount: 1500, status: "Pendente" as const, paymentDate: null, fine: 0 },
  { id: "8", number: 8, dueDate: "2024-09-15", amount: 1500, status: "Agendado" as const, paymentDate: null, fine: 0 },
  { id: "9", number: 9, dueDate: "2024-10-15", amount: 1500, status: "Agendado" as const, paymentDate: null, fine: 0 },
  { id: "10", number: 10, dueDate: "2024-11-15", amount: 1500, status: "Agendado" as const, paymentDate: null, fine: 0 },
  { id: "11", number: 11, dueDate: "2024-12-15", amount: 1500, status: "Agendado" as const, paymentDate: null, fine: 0 },
  { id: "12", number: 12, dueDate: "2025-01-15", amount: 1500, status: "Agendado" as const, paymentDate: null, fine: 0 },
];

const mockActivities = [
  { id: "1", type: "payment" as const, date: "2024-06-15", description: "Pagamento da parcela 5 recebido", amount: 1500 },
  { id: "2", type: "message" as const, date: "2024-06-20", description: "Mensagem de cobrança enviada via WhatsApp" },
  { id: "3", type: "call" as const, date: "2024-06-25", description: "Ligação de cobrança realizada" },
  { id: "4", type: "payment" as const, date: "2024-05-14", description: "Pagamento da parcela 4 recebido", amount: 1500 },
  { id: "5", type: "renegotiation" as const, date: "2024-03-10", description: "Proposta de renegociação rejeitada" },
  { id: "6", type: "contract" as const, date: "2024-01-15", description: "Contrato criado - 12 parcelas de R$ 1.500,00", amount: 18000 },
];

const statusStyles = {
  Ativo: "bg-success/20 text-success border-success/30",
  Atraso: "bg-destructive/20 text-destructive border-destructive/30",
  Quitado: "bg-accent/20 text-accent border-accent/30",
};

const ClienteDossie = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<"parcelas" | "historico">("parcelas");
  const [isRenegotiationOpen, setIsRenegotiationOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isAIMessageOpen, setIsAIMessageOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<typeof mockInstallments[0] | null>(null);

  const client = mockClient; // In real app, fetch by id
  const progress = Math.round((client.financialSummary.paidInstallments / client.financialSummary.totalInstallments) * 100);

  const handlePayment = (installment: typeof mockInstallments[0]) => {
    setSelectedInstallment(installment);
    setIsPaymentOpen(true);
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
              {client.avatar}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="font-display text-2xl font-bold text-foreground">
                  {client.name}
                </h1>
                <ClientScoreBadge clientId={id || "1"} size="md" />
                <span
                  className={cn(
                    "rounded-full border px-3 py-1 text-xs font-medium",
                    statusStyles[client.status]
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
                <span className="text-foreground">{client.phone}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
                  <MessageCircle className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="text-foreground">{client.whatsApp}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <span className="text-foreground">{client.email}</span>
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
                <p>{client.address.street}, {client.address.number}</p>
                {client.address.complement && <p>{client.address.complement}</p>}
                <p>{client.address.neighborhood}</p>
                <p>{client.address.city} - {client.address.state}</p>
                <p className="text-muted-foreground">CEP: {client.address.cep}</p>
              </div>
            </div>
          </div>

          {/* Contract Info */}
          <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-5">
            <h3 className="mb-4 font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Dados do Contrato
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nº Contrato</span>
                <span className="font-medium text-foreground">{client.contract.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Data Início</span>
                <span className="font-medium text-foreground">
                  {new Date(client.contract.startDate).toLocaleDateString("pt-BR")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Frequência</span>
                <span className="font-medium text-foreground capitalize">{client.contract.frequency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxa de Juros</span>
                <span className="font-medium text-primary">{client.financialSummary.interestRate}% a.m.</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cliente desde</span>
                <span className="font-medium text-foreground">
                  {new Date(client.createdAt).toLocaleDateString("pt-BR")}
                </span>
              </div>
            </div>
          </div>
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
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(client.financialSummary.totalLoan)}
                </p>
              </div>
              
              <div className="rounded-xl bg-secondary/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-success" />
                  <span className="text-xs text-muted-foreground">Lucro</span>
                </div>
                <p className="font-display text-lg font-bold text-success">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(client.financialSummary.totalProfit)}
                </p>
              </div>
              
              <div className="rounded-xl bg-secondary/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span className="text-xs text-muted-foreground">Pago</span>
                </div>
                <p className="font-display text-lg font-bold text-primary">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(client.financialSummary.paidAmount)}
                </p>
              </div>
              
              <div className="rounded-xl bg-secondary/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-destructive" />
                  <span className="text-xs text-muted-foreground">Pendente</span>
                </div>
                <p className="font-display text-lg font-bold text-destructive">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(client.financialSummary.pendingAmount)}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progresso do Contrato</span>
                <span className="font-medium text-foreground">
                  {client.financialSummary.paidInstallments} de {client.financialSummary.totalInstallments} parcelas
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
                Cronograma de Parcelas
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
                Histórico de Atividades
              </button>
            </div>

            <div className="p-4">
              {activeTab === "parcelas" ? (
                <InstallmentSchedule 
                  installments={mockInstallments} 
                  onPayment={handlePayment}
                />
              ) : (
                <ActivityHistory activities={mockActivities} />
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Dialogs */}
      <RenegotiationDialog 
        open={isRenegotiationOpen} 
        onOpenChange={setIsRenegotiationOpen}
        client={client}
      />
      
      <PaymentDialog 
        open={isPaymentOpen} 
        onOpenChange={setIsPaymentOpen}
        installment={selectedInstallment}
        clientName={client.name}
      />
      
      <AIMessageDialog 
        open={isAIMessageOpen} 
        onOpenChange={setIsAIMessageOpen}
        client={client}
      />
    </MainLayout>
  );
};

export default ClienteDossie;

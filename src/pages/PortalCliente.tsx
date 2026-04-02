import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  CreditCard,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  MessageCircle,
  LogOut,
  DollarSign,
  FileText,
  ChevronRight,
  Loader2,
  Shield,
  ArrowRight,
  History,
  TrendingUp,
  Receipt,
  Eye,
  EyeOff,
  RefreshCw,
  CircleDollarSign,
  BarChart3,
  Wallet,
} from "lucide-react";
import { format, parseISO, differenceInDays, isPast, isToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { maskCPF, validateCPF, unmask } from "@/lib/masks";
import { MeteorShower } from "@/components/effects/MeteorShower";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

interface ClientData {
  id: string;
  name: string;
  status: string;
  avatar_url: string | null;
}

interface InstallmentData {
  id: string;
  contract_id: string;
  installment_number: number;
  total_installments: number;
  due_date: string;
  amount_due: number;
  amount_paid: number | null;
  fine: number | null;
  status: string;
  payment_date: string | null;
}

interface ContractData {
  id: string;
  capital: number;
  interest_rate: number;
  installments: number;
  installment_value: number;
  total_amount: number;
  total_profit: number;
  start_date: string;
  first_due_date: string;
  frequency: string;
  status: string;
}

interface PortalData {
  client: ClientData;
  contracts: ContractData[];
  installments: InstallmentData[];
  paidInstallments: InstallmentData[];
  summary: {
    totalPending: number;
    overdueCount: number;
    totalOverdue: number;
    totalContracts: number;
    nextDueDate: string | null;
  };
  operator: {
    whatsapp: string | null;
    company: string | null;
  };
}

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const frequencyLabels: Record<string, string> = {
  diario: "Diário",
  semanal: "Semanal",
  quinzenal: "Quinzenal",
  mensal: "Mensal",
};

// ========== Login Screen ==========
function PortalLogin({ onLogin }: { onLogin: (data: PortalData, cpf: string) => void }) {
  const [cpf, setCpf] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(maskCPF(e.target.value));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCpf = unmask(cpf);

    if (!validateCPF(cpf)) {
      setError("CPF inválido. Verifique os números digitados.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "client-portal",
        { body: { cpf: cleanCpf } }
      );

      if (fnError) {
        setError("Erro ao conectar. Tente novamente.");
        setIsLoading(false);
        return;
      }

      if (data?.error) {
        setError(data.error);
        setIsLoading(false);
        return;
      }

      onLogin(data as PortalData, cleanCpf);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden p-4">
      <MeteorShower />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-gold shadow-gold mb-4"
          >
            <Wallet className="h-10 w-10 text-primary-foreground" />
          </motion.div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            Portal do Cliente
          </h1>
          <p className="text-muted-foreground mt-2">
            Acompanhe suas parcelas, contratos e pagamentos
          </p>
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Informe seu CPF para acessar
              </label>
              <div className="relative">
                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={handleCpfChange}
                  maxLength={14}
                  className={cn(
                    "w-full h-14 rounded-xl border bg-secondary/30 pl-12 pr-4 text-lg font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 transition-all",
                    error
                      ? "border-destructive focus:ring-destructive/30"
                      : "border-border/50 focus:border-primary focus:ring-primary/30"
                  )}
                  autoFocus
                />
              </div>
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-sm text-destructive mt-2 flex items-center gap-1.5"
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                  {error}
                </motion.p>
              )}
            </div>

            <motion.button
              type="submit"
              disabled={isLoading || unmask(cpf).length !== 11}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full h-14 rounded-xl bg-gradient-gold text-primary-foreground font-semibold text-lg shadow-gold transition-all hover:shadow-gold-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Acessar meu portal
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            {[
              { icon: Receipt, label: "Parcelas" },
              { icon: BarChart3, label: "Contratos" },
              { icon: MessageCircle, label: "Suporte" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-1.5 rounded-xl bg-secondary/30 p-3">
                <Icon className="h-4 w-4 text-primary" />
                <span className="text-[10px] font-medium text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-3 rounded-xl bg-secondary/30 p-3">
            <Shield className="h-5 w-5 text-primary flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              Seus dados são protegidos e acessíveis apenas por você.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ========== Summary Card Component ==========
function SummaryCard({
  icon: Icon,
  label,
  value,
  subtitle,
  variant = "default",
  delay = 0,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  subtitle?: string;
  variant?: "default" | "danger" | "success" | "primary";
  delay?: number;
}) {
  const variants = {
    default: {
      card: "border-border/50 bg-card",
      icon: "text-muted-foreground bg-secondary/50",
      value: "text-foreground",
    },
    danger: {
      card: "border-destructive/30 bg-destructive/5",
      icon: "text-destructive bg-destructive/15",
      value: "text-destructive",
    },
    success: {
      card: "border-success/30 bg-success/5",
      icon: "text-success bg-success/15",
      value: "text-success",
    },
    primary: {
      card: "border-primary/30 bg-primary/5",
      icon: "text-primary bg-primary/15",
      value: "text-primary",
    },
  };

  const v = variants[variant];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={cn("rounded-2xl border p-3 sm:p-4 min-w-0", v.card)}
    >
      <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
        <div className={cn("flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-lg flex-shrink-0", v.icon)}>
          <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </div>
      </div>
      <p className="text-[10px] sm:text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={cn("font-display text-base sm:text-xl font-bold mt-0.5 truncate", v.value)}>{value}</p>
      {subtitle && (
        <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-0.5 truncate">{subtitle}</p>
      )}
    </motion.div>
  );
}

// ========== Installment Row ==========
function InstallmentRow({
  inst,
  index,
  showContract = false,
}: {
  inst: InstallmentData;
  index: number;
  showContract?: boolean;
}) {
  const dueDate = parseISO(inst.due_date);
  const today = new Date();
  const daysOverdue = differenceInDays(today, dueDate);
  const isOverdue = inst.status === "Atrasado";
  const isDueToday = isToday(dueDate);
  const fineAmount = Number(inst.fine || 0);
  const totalDue = inst.amount_due + fineAmount;

  const daysUntil = differenceInDays(dueDate, today);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className={cn(
        "p-4 transition-colors",
        isOverdue && "bg-destructive/[0.03]",
        isDueToday && "bg-warning/[0.05]"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span
              className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                isOverdue
                  ? "bg-destructive/15 text-destructive border-destructive/30"
                  : isDueToday
                  ? "bg-warning/15 text-warning border-warning/30"
                  : "bg-secondary text-muted-foreground border-border/50"
              )}
            >
              {isOverdue ? (
                <AlertTriangle className="h-3 w-3 mr-1" />
              ) : isDueToday ? (
                <Clock className="h-3 w-3 mr-1" />
              ) : null}
              {isOverdue ? "Atrasado" : isDueToday ? "Vence hoje" : "Pendente"}
            </span>
            <span className="text-xs text-muted-foreground font-medium">
              {inst.installment_number}/{inst.total_installments}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{format(dueDate, "dd 'de' MMMM, yyyy", { locale: ptBR })}</span>
          </div>

          {isOverdue && daysOverdue > 0 && (
            <p className="text-[11px] text-destructive font-medium mt-1">
              ⚠ {daysOverdue} dia{daysOverdue > 1 ? "s" : ""} em atraso
            </p>
          )}
          {!isOverdue && !isDueToday && daysUntil > 0 && daysUntil <= 7 && (
            <p className="text-[11px] text-warning font-medium mt-1">
              Vence em {daysUntil} dia{daysUntil > 1 ? "s" : ""}
            </p>
          )}
        </div>

        <div className="text-right flex-shrink-0">
          <p className="font-display text-lg font-bold text-foreground">
            {fmt(inst.amount_due)}
          </p>
          {fineAmount > 0 && (
            <div className="space-y-0.5">
              <p className="text-[11px] text-destructive">
                +{fmt(fineAmount)} multa
              </p>
              <p className="text-xs font-bold text-destructive">
                Total: {fmt(totalDue)}
              </p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ========== Paid Row ==========
function PaidRow({ inst, index }: { inst: InstallmentData; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.03 }}
      className="flex items-center justify-between p-4"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-success/15">
          <CheckCircle2 className="h-4 w-4 text-success" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            Parcela {inst.installment_number}/{inst.total_installments}
          </p>
          <p className="text-xs text-muted-foreground">
            Pago em{" "}
            {inst.payment_date
              ? format(parseISO(inst.payment_date), "dd/MM/yyyy", { locale: ptBR })
              : "-"}
          </p>
        </div>
      </div>
      <p className="font-display font-semibold text-success">
        {fmt(Number(inst.amount_paid || inst.amount_due))}
      </p>
    </motion.div>
  );
}

// ========== Contract Card ==========
function ContractCard({ contract, paidCount, index }: { contract: ContractData; paidCount: number; index: number }) {
  const progress = (paidCount / contract.installments) * 100;

  return (
    <motion.div
      key={contract.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="rounded-2xl border border-border/50 bg-card overflow-hidden"
    >
      {/* Contract header */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg",
              contract.status === "Ativo" ? "bg-success/15" : "bg-destructive/15"
            )}>
              <FileText className={cn(
                "h-4 w-4",
                contract.status === "Ativo" ? "text-success" : "text-destructive"
              )} />
            </div>
            <span
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                contract.status === "Ativo"
                  ? "bg-success/15 text-success border-success/30"
                  : "bg-destructive/15 text-destructive border-destructive/30"
              )}
            >
              {contract.status}
            </span>
          </div>
          <Badge variant="outline" className="text-[10px]">
            {frequencyLabels[contract.frequency] || contract.frequency}
          </Badge>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-muted-foreground">Progresso de pagamento</span>
            <span className="font-semibold text-foreground">{paidCount}/{contract.installments} pagas</span>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-[10px] text-muted-foreground mt-1">{Math.round(progress)}% concluído</p>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Capital</p>
            <p className="font-display font-bold text-foreground">{fmt(contract.capital)}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Total</p>
            <p className="font-display font-bold text-foreground">{fmt(contract.total_amount)}</p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Parcela</p>
            <p className="text-sm font-medium text-foreground">
              {contract.installments}x {fmt(contract.installment_value)}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Taxa</p>
            <p className="text-sm font-medium text-foreground">{contract.interest_rate}% a.m.</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 sm:px-5 py-2.5 sm:py-3 border-t border-border/30 bg-secondary/20 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-1 text-[11px] sm:text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
          <span className="truncate">Início: {format(parseISO(contract.start_date), "dd/MM/yyyy", { locale: ptBR })}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
          <span className="truncate">Juros: {fmt(contract.total_amount - contract.capital)}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ========== Portal Dashboard ==========
function PortalDashboard({
  data,
  onLogout,
  onRefresh,
  isRefreshing,
}: {
  data: PortalData;
  onLogout: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  const { client, contracts, installments, paidInstallments, summary, operator } = data;
  const [hideValues, setHideValues] = useState(false);

  const getInitials = (name: string) => {
    const parts = name.trim().split(" ");
    return parts.length === 1
      ? parts[0].charAt(0).toUpperCase()
      : (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const openWhatsApp = () => {
    if (!operator.whatsapp) return;
    const clean = operator.whatsapp.replace(/\D/g, "");
    const message = encodeURIComponent(
      `Olá! Sou o(a) ${client.name}, gostaria de falar sobre minhas parcelas.`
    );
    window.open(`https://wa.me/55${clean}?text=${message}`, "_blank");
  };

  // Calculate paid installments per contract
  const paidPerContract = useMemo(() => {
    const map: Record<string, number> = {};
    paidInstallments.forEach((inst) => {
      map[inst.contract_id] = (map[inst.contract_id] || 0) + 1;
    });
    return map;
  }, [paidInstallments]);

  const totalPaid = paidInstallments.reduce((s, i) => s + Number(i.amount_paid || i.amount_due), 0);

  // Group pending by overdue vs upcoming
  const overdueInstallments = installments.filter((i) => i.status === "Atrasado");
  const pendingInstallments = installments.filter((i) => i.status !== "Atrasado");

  // Next due
  const nextDue = pendingInstallments[0];
  const nextDueDate = nextDue ? parseISO(nextDue.due_date) : null;
  const daysUntilNext = nextDueDate ? differenceInDays(nextDueDate, new Date()) : null;

  const displayValue = (v: string) => (hideValues ? "••••" : v);

  return (
    <div className="min-h-[100dvh] bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full bg-gradient-gold font-display font-bold text-xs sm:text-sm text-primary-foreground flex-shrink-0">
              {getInitials(client.name)}
            </div>
            <div className="min-w-0">
              <p className="font-medium text-foreground text-xs sm:text-sm truncate">
                {client.name}
              </p>
              {operator.company && (
                <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{operator.company}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setHideValues(!hideValues)}
              className="flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title={hideValues ? "Mostrar valores" : "Ocultar valores"}
            >
              {hideValues ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center justify-center rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-50"
              title="Atualizar dados"
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-5 pb-[env(safe-area-inset-bottom,1rem)]">
        {/* Welcome banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/[0.02] p-4 sm:p-5"
        >
          <p className="text-sm text-muted-foreground">Bem-vindo(a) de volta,</p>
          <h2 className="font-display text-xl font-bold text-foreground mt-0.5">
            {client.name.split(" ")[0]}! 👋
          </h2>
          {nextDue && daysUntilNext !== null && (
            <p className="text-sm text-muted-foreground mt-2">
              {daysUntilNext === 0
                ? "Você tem uma parcela vencendo hoje."
                : daysUntilNext > 0
                ? `Próximo vencimento em ${daysUntilNext} dia${daysUntilNext > 1 ? "s" : ""}.`
                : `Você possui parcelas em atraso.`}
            </p>
          )}
          {!nextDue && summary.overdueCount === 0 && (
            <p className="text-sm text-success mt-2 font-medium">
              ✨ Todas as parcelas estão em dia!
            </p>
          )}
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <SummaryCard
            icon={AlertTriangle}
            label="Em atraso"
            value={displayValue(String(summary.overdueCount))}
            subtitle={summary.totalOverdue > 0 ? displayValue(fmt(summary.totalOverdue)) : undefined}
            variant={summary.overdueCount > 0 ? "danger" : "success"}
            delay={0.05}
          />
          <SummaryCard
            icon={DollarSign}
            label="Pendente"
            value={displayValue(fmt(summary.totalPending))}
            subtitle={summary.nextDueDate ? `Próx: ${format(parseISO(summary.nextDueDate), "dd/MM", { locale: ptBR })}` : undefined}
            variant="primary"
            delay={0.1}
          />
          <SummaryCard
            icon={CheckCircle2}
            label="Já pago"
            value={displayValue(fmt(totalPaid))}
            subtitle={`${paidInstallments.length} parcela${paidInstallments.length !== 1 ? "s" : ""}`}
            variant="success"
            delay={0.15}
          />
          <SummaryCard
            icon={FileText}
            label="Contratos"
            value={String(summary.totalContracts)}
            subtitle={contracts.filter(c => c.status === "Ativo").length + " ativo(s)"}
            delay={0.2}
          />
        </div>

        {/* WhatsApp Contact */}
        {operator.whatsapp && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={openWhatsApp}
            className="w-full flex items-center gap-3 sm:gap-4 rounded-2xl border border-success/30 bg-success/5 p-3 sm:p-4 transition-all hover:bg-success/10 hover:border-success/50 active:scale-[0.98]"
          >
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-success/20 flex-shrink-0">
              <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6 text-success" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-foreground">Falar no WhatsApp</p>
              <p className="text-xs text-muted-foreground">
                Tire dúvidas ou negocie suas parcelas
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </motion.button>
        )}

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Tabs defaultValue="pending">
            <TabsList className="bg-secondary/50 p-1 h-auto w-full">
              <TabsTrigger value="pending" className="flex-1 gap-1.5 data-[state=active]:shadow-md text-xs sm:text-sm">
                <Clock className="h-4 w-4" />
                <span className="hidden sm:inline">Pendentes</span>
                <span className="sm:hidden">Pend.</span>
                {installments.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="h-5 min-w-5 px-1 text-[10px] bg-destructive/20 text-destructive"
                  >
                    {installments.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="paid" className="flex-1 gap-1.5 data-[state=active]:shadow-md text-xs sm:text-sm">
                <CheckCircle2 className="h-4 w-4" />
                <span className="hidden sm:inline">Pagas</span>
                <span className="sm:hidden">Pagas</span>
              </TabsTrigger>
              <TabsTrigger value="contracts" className="flex-1 gap-1.5 data-[state=active]:shadow-md text-xs sm:text-sm">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Contratos</span>
                <span className="sm:hidden">Contr.</span>
              </TabsTrigger>
            </TabsList>

            {/* Pending Installments */}
            <TabsContent value="pending" className="mt-4">
              {installments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 mb-4"
                  >
                    <CheckCircle2 className="h-8 w-8 text-success" />
                  </motion.div>
                  <h3 className="font-display font-bold text-lg text-foreground">
                    Tudo em dia! 🎉
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                    Você não tem nenhuma parcela pendente. Continue assim!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Overdue section */}
                  {overdueInstallments.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2 px-1">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        <h3 className="text-sm font-semibold text-destructive">
                          Em atraso ({overdueInstallments.length})
                        </h3>
                      </div>
                      <div className="rounded-2xl border border-destructive/20 bg-card overflow-hidden divide-y divide-border/30">
                        {overdueInstallments.map((inst, i) => (
                          <InstallmentRow key={inst.id} inst={inst} index={i} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pending section */}
                  {pendingInstallments.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2 px-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-sm font-semibold text-foreground">
                          A vencer ({pendingInstallments.length})
                        </h3>
                      </div>
                      <div className="rounded-2xl border border-border/50 bg-card overflow-hidden divide-y divide-border/30">
                        {pendingInstallments.map((inst, i) => (
                          <InstallmentRow key={inst.id} inst={inst} index={i} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Paid Installments */}
            <TabsContent value="paid" className="mt-4">
              {paidInstallments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <History className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <h3 className="font-medium text-foreground">
                    Nenhum pagamento registrado
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Seus pagamentos aparecerão aqui.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-3 px-1">
                    <p className="text-sm font-medium text-muted-foreground">
                      Últimos pagamentos
                    </p>
                    <p className="text-sm font-bold text-success">
                      {displayValue(fmt(totalPaid))}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/50 bg-card overflow-hidden divide-y divide-border/30">
                    {paidInstallments.map((inst, index) => (
                      <PaidRow key={inst.id} inst={inst} index={index} />
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Contracts */}
            <TabsContent value="contracts" className="mt-4">
              {contracts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <h3 className="font-medium text-foreground">
                    Nenhum contrato ativo
                  </h3>
                </div>
              ) : (
                <div className="space-y-3">
                  {contracts.map((contract, index) => (
                    <ContractCard
                      key={contract.id}
                      contract={contract}
                      paidCount={paidPerContract[contract.id] || 0}
                      index={index}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Footer */}
        <div className="pt-6 pb-8 text-center space-y-2">
          <Separator className="mb-4" />
          <p className="text-xs text-muted-foreground">
            {operator.company ? `${operator.company} · ` : ""}Portal do Cliente
          </p>
          <p className="text-[10px] text-muted-foreground/60">
            🔒 Dados protegidos · Última consulta: {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
      </main>
    </div>
  );
}

// ========== Main Portal Page ==========
const PortalCliente = () => {
  const [portalData, setPortalData] = useState<PortalData | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [savedCpf, setSavedCpf] = useState<string | null>(null);

  const handleLogout = useCallback(() => {
    setPortalData(null);
    setSavedCpf(null);
  }, []);

  const handleRefresh = useCallback(async () => {
    if (!savedCpf || isRefreshing) return;
    setIsRefreshing(true);
    try {
      const { data } = await supabase.functions.invoke("client-portal", {
        body: { cpf: savedCpf },
      });
      if (data && !data.error) {
        setPortalData(data as PortalData);
      }
    } catch {
      // silent
    } finally {
      setIsRefreshing(false);
    }
  }, [savedCpf, isRefreshing]);

  return (
    <AnimatePresence mode="wait">
      {portalData ? (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <PortalDashboard
            data={portalData}
            onLogout={handleLogout}
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
          />
        </motion.div>
      ) : (
        <motion.div
          key="login"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <PortalLogin
            onLogin={(data, cpf) => {
              setPortalData(data);
              setSavedCpf(cpf);
            }}



          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PortalCliente;

import { useState, useCallback } from "react";
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
  Sparkles,
  ArrowRight,
  History,
  Phone,
} from "lucide-react";
import { format, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { maskCPF, validateCPF, unmask } from "@/lib/masks";
import { MeteorShower } from "@/components/effects/MeteorShower";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

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
  start_date: string;
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
function PortalLogin({ onLogin }: { onLogin: (data: PortalData) => void }) {
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

      onLogin(data as PortalData);
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
            className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-gold shadow-gold mb-4"
          >
            <User className="h-8 w-8 text-primary-foreground" />
          </motion.div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            Portal do Cliente
          </h1>
          <p className="text-muted-foreground mt-2">
            Consulte suas parcelas e vencimentos
          </p>
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Informe seu CPF
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
                  Consultar
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-6 flex items-center gap-3 rounded-xl bg-secondary/30 p-3">
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

// ========== Portal Dashboard ==========
function PortalDashboard({
  data,
  onLogout,
}: {
  data: PortalData;
  onLogout: () => void;
}) {
  const { client, contracts, installments, paidInstallments, summary, operator } =
    data;

  const today = new Date();

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Atrasado":
        return "bg-destructive/15 text-destructive border-destructive/30";
      case "Pendente":
        return "bg-warning/15 text-warning border-warning/30";
      case "Pago":
        return "bg-success/15 text-success border-success/30";
      default:
        return "bg-secondary text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-gold font-display font-bold text-sm text-primary-foreground">
              {getInitials(client.name)}
            </div>
            <div>
              <p className="font-medium text-foreground text-sm truncate max-w-[180px]">
                {client.name}
              </p>
              {operator.company && (
                <p className="text-xs text-muted-foreground">{operator.company}</p>
              )}
            </div>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Summary Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-3"
        >
          <div
            className={cn(
              "rounded-2xl border p-4",
              summary.overdueCount > 0
                ? "border-destructive/30 bg-destructive/5"
                : "border-border/50 bg-card"
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle
                className={cn(
                  "h-4 w-4",
                  summary.overdueCount > 0
                    ? "text-destructive"
                    : "text-muted-foreground"
                )}
              />
              <span className="text-xs text-muted-foreground">Em atraso</span>
            </div>
            <p
              className={cn(
                "font-display text-2xl font-bold",
                summary.overdueCount > 0
                  ? "text-destructive"
                  : "text-foreground"
              )}
            >
              {summary.overdueCount}
            </p>
            {summary.totalOverdue > 0 && (
              <p className="text-xs text-destructive mt-0.5">
                {fmt(summary.totalOverdue)}
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-border/50 bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Total pendente</span>
            </div>
            <p className="font-display text-2xl font-bold text-foreground">
              {fmt(summary.totalPending)}
            </p>
            {summary.nextDueDate && (
              <p className="text-xs text-muted-foreground mt-0.5">
                Próx: {format(parseISO(summary.nextDueDate), "dd/MM", { locale: ptBR })}
              </p>
            )}
          </div>
        </motion.div>

        {/* WhatsApp Contact */}
        {operator.whatsapp && (
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={openWhatsApp}
            className="w-full flex items-center gap-4 rounded-2xl border border-success/30 bg-success/5 p-4 transition-all hover:bg-success/10"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/20">
              <MessageCircle className="h-6 w-6 text-success" />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-foreground">Falar no WhatsApp</p>
              <p className="text-xs text-muted-foreground">
                Entre em contato sobre suas parcelas
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </motion.button>
        )}

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Tabs defaultValue="pending">
            <TabsList className="bg-secondary/50 p-1 h-auto w-full">
              <TabsTrigger
                value="pending"
                className="flex-1 gap-2 data-[state=active]:shadow-md"
              >
                <Clock className="h-4 w-4" />
                Pendentes
                {installments.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="h-5 min-w-5 px-1.5 text-xs bg-destructive/20 text-destructive"
                  >
                    {installments.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="paid"
                className="flex-1 gap-2 data-[state=active]:shadow-md"
              >
                <CheckCircle2 className="h-4 w-4" />
                Pagas
              </TabsTrigger>
              <TabsTrigger
                value="contracts"
                className="flex-1 gap-2 data-[state=active]:shadow-md"
              >
                <FileText className="h-4 w-4" />
                Contratos
              </TabsTrigger>
            </TabsList>

            {/* Pending Installments */}
            <TabsContent value="pending" className="mt-4">
              {installments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10 mb-3">
                    <CheckCircle2 className="h-7 w-7 text-success" />
                  </div>
                  <h3 className="font-medium text-foreground">
                    Tudo em dia! 🎉
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Nenhuma parcela pendente
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-border/50 bg-card overflow-hidden divide-y divide-border/30">
                  {installments.map((inst, index) => {
                    const dueDate = parseISO(inst.due_date);
                    const daysOverdue = differenceInDays(today, dueDate);
                    const isOverdue = inst.status === "Atrasado";
                    const fineAmount = Number(inst.fine || 0);

                    return (
                      <motion.div
                        key={inst.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-4"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className={cn(
                                "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                                getStatusColor(inst.status)
                              )}
                            >
                              {inst.status}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Parcela {inst.installment_number}/
                              {inst.total_installments}
                            </span>
                          </div>
                          {isOverdue && daysOverdue > 0 && (
                            <span className="text-xs font-medium text-destructive">
                              {daysOverdue} dia{daysOverdue > 1 ? "s" : ""} de
                              atraso
                            </span>
                          )}
                        </div>

                        <div className="flex items-end justify-between">
                          <div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-3.5 w-3.5" />
                              Vencimento:{" "}
                              {format(dueDate, "dd/MM/yyyy", { locale: ptBR })}
                            </div>
                            {fineAmount > 0 && (
                              <p className="text-xs text-destructive mt-1">
                                Multa: {fmt(fineAmount)}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-display text-lg font-bold text-foreground">
                              {fmt(inst.amount_due)}
                            </p>
                            {fineAmount > 0 && (
                              <p className="text-xs text-destructive font-medium">
                                Total: {fmt(inst.amount_due + fineAmount)}
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* Paid Installments */}
            <TabsContent value="paid" className="mt-4">
              {paidInstallments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <History className="h-10 w-10 text-muted-foreground mb-3" />
                  <h3 className="font-medium text-foreground">
                    Nenhum pagamento registrado
                  </h3>
                </div>
              ) : (
                <div className="rounded-2xl border border-border/50 bg-card overflow-hidden divide-y divide-border/30">
                  {paidInstallments.map((inst, index) => (
                    <motion.div
                      key={inst.id}
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
                            Parcela {inst.installment_number}/
                            {inst.total_installments}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Pago em{" "}
                            {inst.payment_date
                              ? format(parseISO(inst.payment_date), "dd/MM/yyyy", {
                                  locale: ptBR,
                                })
                              : "-"}
                          </p>
                        </div>
                      </div>
                      <p className="font-display font-semibold text-success">
                        {fmt(Number(inst.amount_paid || inst.amount_due))}
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Contracts */}
            <TabsContent value="contracts" className="mt-4">
              {contracts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-10 w-10 text-muted-foreground mb-3" />
                  <h3 className="font-medium text-foreground">
                    Nenhum contrato ativo
                  </h3>
                </div>
              ) : (
                <div className="space-y-3">
                  {contracts.map((contract, index) => (
                    <motion.div
                      key={contract.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="rounded-2xl border border-border/50 bg-card p-5"
                    >
                      <div className="flex items-center justify-between mb-4">
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
                        <span className="text-xs text-muted-foreground">
                          {frequencyLabels[contract.frequency] || contract.frequency}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Capital</p>
                          <p className="font-display font-bold text-foreground">
                            {fmt(contract.capital)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Valor total
                          </p>
                          <p className="font-display font-bold text-foreground">
                            {fmt(contract.total_amount)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Parcelas</p>
                          <p className="text-sm font-medium text-foreground">
                            {contract.installments}x de{" "}
                            {fmt(contract.installment_value)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Taxa mensal
                          </p>
                          <p className="text-sm font-medium text-foreground">
                            {contract.interest_rate}%
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-border/30 flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        Início:{" "}
                        {format(parseISO(contract.start_date), "dd/MM/yyyy", {
                          locale: ptBR,
                        })}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>

        {/* Footer */}
        <div className="pt-6 pb-8 text-center">
          <p className="text-xs text-muted-foreground">
            {operator.company ? `${operator.company} · ` : ""}Portal do Cliente ·
            Dados protegidos
          </p>
        </div>
      </main>
    </div>
  );
}

// ========== Main Portal Page ==========
const PortalCliente = () => {
  const [portalData, setPortalData] = useState<PortalData | null>(null);

  const handleLogin = useCallback((data: PortalData) => {
    setPortalData(data);
  }, []);

  const handleLogout = useCallback(() => {
    setPortalData(null);
  }, []);

  return (
    <AnimatePresence mode="wait">
      {portalData ? (
        <motion.div
          key="dashboard"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <PortalDashboard data={portalData} onLogout={handleLogout} />
        </motion.div>
      ) : (
        <motion.div
          key="login"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <PortalLogin onLogin={handleLogin} />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PortalCliente;

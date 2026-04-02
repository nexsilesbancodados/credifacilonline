import { MainLayout } from "@/components/layout/MainLayout";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDebounce } from "@/hooks/useDebounce";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { exportToExcel } from "@/lib/exportToExcel";
import { format, isToday, isBefore, isAfter, addDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { parseLocalDate } from "@/lib/dateUtils";
import {
  Search, Plus, FileText, Calendar, DollarSign, TrendingUp,
  ChevronRight, RefreshCw, Clock, CheckCircle2,
  AlertTriangle, Download, Phone, CalendarClock,
  MessageCircle, Check, Sparkles, Bell, Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useContracts, usePendingInstallments } from "@/hooks/useContracts";
import { useCollectionLogs } from "@/hooks/useCollectionLogs";
import { useAllClients } from "@/hooks/useClients";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { useToast } from "@/hooks/use-toast";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { Progress } from "@/components/ui/progress";
import { QueryErrorState } from "@/components/QueryErrorState";
import { PaymentDialog } from "@/components/client/PaymentDialog";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const statusConfig = {
  Ativo: { style: "bg-success/15 text-success border-success/30", icon: CheckCircle2, label: "Ativo" },
  Atraso: { style: "bg-destructive/15 text-destructive border-destructive/30", icon: AlertTriangle, label: "Atraso" },
  Quitado: { style: "bg-accent/15 text-accent-foreground border-accent/30", icon: CheckCircle2, label: "Quitado" },
  Renegociado: { style: "bg-muted/20 text-muted-foreground border-border", icon: RefreshCw, label: "Renegociado" },
};

const frequencyLabels: Record<string, string> = {
  diario: "Diário", semanal: "Semanal", quinzenal: "Quinzenal", mensal: "Mensal",
};

type SortKey = "date" | "amount" | "client";
type CobrancaTabType = "overdue" | "today" | "upcoming" | "upcoming15" | "upcoming30" | "sent";

interface PendingInstallment {
  id: string;
  due_date: string;
  amount_due: number;
  amount_paid: number | null;
  fine: number | null;
  installment_number: number;
  total_installments: number;
  status: string;
  client_id: string;
  contract_id: string;
  clients: {
    name: string;
    whatsapp: string | null;
  };
}

const cobrancaTabs = [
  { id: "overdue" as CobrancaTabType, label: "Atrasados", icon: AlertTriangle, color: "destructive" },
  { id: "today" as CobrancaTabType, label: "Hoje", icon: Clock, color: "warning" },
  { id: "upcoming" as CobrancaTabType, label: "7 dias", icon: CalendarClock, color: "success" },
  { id: "upcoming15" as CobrancaTabType, label: "15 dias", icon: CalendarClock, color: "success" },
  { id: "upcoming30" as CobrancaTabType, label: "30 dias", icon: CalendarClock, color: "success" },
  { id: "sent" as CobrancaTabType, label: "Enviadas", icon: MessageCircle, color: "primary" },
];

// ========== Contratos Tab ==========
function ContratosTab() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortKey>("date");
  const { contracts, isLoading, isError, refetch, page, setPage, totalPages } = useContracts();
  const { data: clients = [] } = useAllClients();
  const { toast } = useToast();

  const clientsMap = clients.reduce((acc, client) => {
    acc[client.id] = client;
    return acc;
  }, {} as Record<string, typeof clients[0]>);

  const filteredContracts = contracts
    .filter((contract) => {
      const client = clientsMap[contract.client_id];
      const matchesSearch =
        client?.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        contract.id.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesStatus = statusFilter === "all" || contract.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "date") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === "amount") return b.total_amount - a.total_amount;
      const nameA = clientsMap[a.client_id]?.name || "";
      const nameB = clientsMap[b.client_id]?.name || "";
      return nameA.localeCompare(nameB, "pt-BR");
    });

  const stats = {
    total: contracts.length,
    ativos: contracts.filter((c) => c.status === "Ativo").length,
    atraso: contracts.filter((c) => c.status === "Atraso").length,
    quitados: contracts.filter((c) => c.status === "Quitado").length,
    renegociados: contracts.filter((c) => c.status === "Renegociado").length,
    totalCapital: contracts.reduce((sum, c) => sum + c.capital, 0),
    totalLucro: contracts.reduce((sum, c) => sum + c.total_profit, 0),
    totalAmount: contracts.reduce((sum, c) => sum + c.total_amount, 0),
  };

  const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact" }).format(v);
  const fmtFull = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const statusButtons = [
    { key: "all", label: "Todos", count: stats.total },
    { key: "Ativo", label: "Ativos", count: stats.ativos },
    { key: "Atraso", label: "Atraso", count: stats.atraso },
    { key: "Quitado", label: "Quitados", count: stats.quitados },
  ];

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex gap-2 justify-end">
        <PermissionGate permission="canExportData">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              const data = contracts.map(c => {
                const client = clientsMap[c.client_id];
                return {
                  Cliente: client?.name || "N/A",
                  Capital: c.capital,
                  "Taxa (%)": c.interest_rate,
                  Parcelas: c.installments,
                  "Valor Parcela": c.installment_value,
                  Total: c.total_amount,
                  Status: c.status,
                  "Data Início": format(parseLocalDate(c.start_date), "dd/MM/yyyy"),
                };
              });
              exportToExcel(data, "contratos", "Contratos");
              toast({ title: "Exportado!", description: "Arquivo Excel gerado com sucesso." });
            }}
            className="flex items-center gap-2 rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            <Download className="h-4 w-4" />
            Exportar
          </motion.button>
        </PermissionGate>
        <PermissionGate permission="canCreateContracts">
          <Link to="/contratos/novo">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 rounded-xl bg-gradient-gold px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-gold transition-shadow hover:shadow-gold-lg"
            >
              <Plus className="h-4 w-4" />
              Novo Contrato
            </motion.button>
          </Link>
        </PermissionGate>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: FileText, label: "Total", value: stats.total, sub: `${stats.ativos} ativos`, color: "text-foreground" },
          { icon: DollarSign, label: "Capital Emprestado", value: fmt(stats.totalCapital), color: "text-primary" },
          { icon: TrendingUp, label: "Lucro Previsto", value: fmt(stats.totalLucro), color: "text-success" },
          { icon: RefreshCw, label: "Renegociados", value: stats.renegociados, sub: `${stats.quitados} quitados`, color: "text-muted-foreground" },
        ].map((card) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-border/50 bg-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <card.icon className={`h-4 w-4 ${card.color}`} />
              <span className="text-xs text-muted-foreground">{card.label}</span>
            </div>
            <p className={`font-display text-xl font-bold ${card.color}`}>{card.value}</p>
            {card.sub && <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>}
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por cliente ou ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 rounded-xl border border-border bg-secondary/50 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <div className="flex gap-1 rounded-xl bg-secondary/50 p-1">
          {statusButtons.map((s) => (
            <button key={s.key} onClick={() => setStatusFilter(s.key)} className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition-all flex items-center gap-1.5",
              statusFilter === s.key ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}>
              {s.label}
              <span className={cn("text-xs rounded-full px-1.5 py-0.5", statusFilter === s.key ? "bg-primary-foreground/20" : "bg-secondary")}>{s.count}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {(["date", "amount", "client"] as SortKey[]).map((key) => (
            <button key={key} onClick={() => setSortBy(key)} className={cn(
              "h-10 px-3 rounded-lg text-xs font-medium transition-all border",
              sortBy === key ? "border-primary/30 bg-primary/10 text-primary" : "border-border bg-secondary/50 text-muted-foreground hover:text-foreground"
            )}>
              {key === "date" ? "Data" : key === "amount" ? "Valor" : "Nome"}
            </button>
          ))}
        </div>
      </div>

      {/* Contracts List */}
      <div className="rounded-2xl border border-border/50 bg-card overflow-hidden" aria-busy={isLoading}>
        {isError ? (
          <QueryErrorState message="Erro ao carregar contratos" onRetry={refetch} />
        ) : isLoading ? (
          <div className="divide-y divide-border/30">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <div className="h-11 w-11 rounded-xl bg-muted animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 rounded bg-muted animate-pulse" />
                  <div className="h-3 w-56 rounded bg-muted animate-pulse" />
                </div>
                <div className="hidden md:block w-24"><div className="h-1.5 rounded bg-muted animate-pulse" /></div>
                <div className="text-right space-y-1">
                  <div className="h-5 w-24 rounded bg-muted animate-pulse" />
                  <div className="h-3 w-16 rounded bg-muted animate-pulse ml-auto" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredContracts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary/50 mx-auto">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 font-medium text-foreground">Nenhum contrato encontrado</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {search ? "Ajuste os filtros de busca" : "Crie seu primeiro contrato para começar"}
            </p>
            {!search && (
              <Link to="/contratos/novo">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-gold px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-gold">
                  <Plus className="h-4 w-4" />
                  Novo Contrato
                </motion.button>
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {filteredContracts.map((contract, index) => {
              const client = clientsMap[contract.client_id];
              const config = statusConfig[contract.status as keyof typeof statusConfig] || statusConfig.Ativo;
              const StatusIcon = config.icon;
              const progressPct = contract.status === "Quitado" ? 100 : Math.round((1 - contract.total_profit / contract.total_amount) * 100);
              const fmtFull = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

              return (
                <Link key={contract.id} to={client ? `/clientes/${client.id}` : "#"} className="block">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.03 }} className="group p-4 hover:bg-secondary/20 transition-colors cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl flex-shrink-0", config.style)}>
                        <StatusIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-medium text-foreground truncate">{client?.name || "Cliente não encontrado"}</h3>
                          <span className={cn("rounded-full border px-2 py-0.5 text-xs font-medium flex-shrink-0", config.style)}>{contract.status}</span>
                          {contract.renegotiated_from_id && (
                            <span className="flex items-center gap-1 text-xs text-primary"><RefreshCw className="h-3 w-3" />Renegociado</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{parseLocalDate(contract.start_date).toLocaleDateString("pt-BR")}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{contract.installments}x {frequencyLabels[contract.frequency] || contract.frequency}</span>
                          <span>{contract.interest_rate}% a.m.</span>
                        </div>
                      </div>
                      <div className="hidden md:block w-24">
                        <Progress value={progressPct} className="h-1.5" />
                        <p className="text-xs text-muted-foreground mt-1 text-center">{progressPct}%</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-display text-base font-bold text-foreground">{fmtFull(contract.total_amount)}</p>
                        <p className="text-xs text-success font-medium">+{fmtFull(contract.total_profit)} lucro</p>
                      </div>
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0">
                        <ChevronRight className="h-5 w-5" />
                      </div>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
      <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}

// ========== Mesa de Cobrança Tab ==========
function CobrancaTab() {
  const [activeTab, setActiveTab] = useState<CobrancaTabType>("overdue");
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const { data: pendingInstallments, isLoading, isError, refetch } = usePendingInstallments();
  const { settings } = useCompanySettings();
  const navigate = useNavigate();
  const [paymentDialog, setPaymentDialog] = useState<{ open: boolean; installment: PendingInstallment | null }>({ open: false, installment: null });

  const isAgentActive = settings?.ai_agent_active ?? false;
  const agentStartTime = settings?.ai_agent_start_time ?? "09:00";
  const agentEndTime = settings?.ai_agent_end_time ?? "18:00";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextWeek = addDays(today, 7);

  const items = (pendingInstallments || []) as PendingInstallment[];

  const filteredInstallments = items.filter((inst) => {
    const dueDate = parseISO(inst.due_date);
    dueDate.setHours(0, 0, 0, 0);
    switch (activeTab) {
      case "overdue": return isBefore(dueDate, today) && !isToday(dueDate);
      case "today": return isToday(dueDate);
      case "upcoming": return isAfter(dueDate, today) && isBefore(dueDate, nextWeek);
      default: return false;
    }
  });

  const counts = {
    overdue: items.filter((inst) => { const d = parseISO(inst.due_date); d.setHours(0,0,0,0); return isBefore(d, today) && !isToday(d); }).length,
    today: items.filter((inst) => isToday(parseISO(inst.due_date))).length,
    upcoming: items.filter((inst) => { const d = parseISO(inst.due_date); d.setHours(0,0,0,0); return isAfter(d, today) && isBefore(d, nextWeek); }).length,
  };

  const totalOverdueAmount = items.filter((inst) => { const d = parseISO(inst.due_date); d.setHours(0,0,0,0); return isBefore(d, today) && !isToday(d); }).reduce((sum, i) => sum + Number(i.amount_due), 0);

  const getDaysOverdue = (dueDate: string) => { const due = parseISO(dueDate); return Math.ceil((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)); };
  const getDaysUntil = (dueDate: string) => { const due = parseISO(dueDate); return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)); };

  const handlePayment = (installment: PendingInstallment) => setPaymentDialog({ open: true, installment });
  const handlePaymentClose = (open: boolean) => { if (!open) setPaymentDialog({ open: false, installment: null }); };
  const openWhatsApp = (phone: string) => { const clean = phone?.replace(/\D/g, "") || ""; if (clean) window.open(`https://wa.me/55${clean}`, "_blank"); };

  const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  return (
    <div className="space-y-6">
      {/* Notifications button */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground" aria-live="polite">
          {items.length} parcelas pendentes · {counts.overdue > 0 && <span className="text-destructive font-medium">{counts.overdue} em atraso</span>}
        </p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsNotificationCenterOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-gold px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-gold"
          aria-label="Abrir notificações"
        >
          <Bell className="h-4 w-4" />
          Notificações
        </motion.button>
      </div>

      <NotificationCenter open={isNotificationCenterOpen} onOpenChange={setIsNotificationCenterOpen} />

      {/* Summary Cards */}
      {!isLoading && (
        <div className="grid grid-cols-3 gap-3" aria-live="polite">
          <div className={cn("rounded-xl border p-4", counts.overdue > 0 ? "border-destructive/30 bg-destructive/5" : "border-border/50 bg-card")}>
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className={cn("h-4 w-4", counts.overdue > 0 ? "text-destructive" : "text-muted-foreground")} />
              <span className="text-xs text-muted-foreground">Atrasados</span>
            </div>
            <p className={cn("font-display text-2xl font-bold", counts.overdue > 0 ? "text-destructive" : "text-foreground")}>{counts.overdue}</p>
            {totalOverdueAmount > 0 && <p className="text-xs text-destructive mt-0.5">{fmt(totalOverdueAmount)} em atraso</p>}
          </div>
          <div className={cn("rounded-xl border p-4", counts.today > 0 ? "border-warning/30 bg-warning/5" : "border-border/50 bg-card")}>
            <div className="flex items-center gap-2 mb-1">
              <Clock className={cn("h-4 w-4", counts.today > 0 ? "text-warning" : "text-muted-foreground")} />
              <span className="text-xs text-muted-foreground">Hoje</span>
            </div>
            <p className={cn("font-display text-2xl font-bold", counts.today > 0 ? "text-warning" : "text-foreground")}>{counts.today}</p>
          </div>
          <div className="rounded-xl border border-border/50 bg-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <CalendarClock className="h-4 w-4 text-success" />
              <span className="text-xs text-muted-foreground">Próx. 7 dias</span>
            </div>
            <p className="font-display text-2xl font-bold text-foreground">{counts.upcoming}</p>
          </div>
        </div>
      )}

      {/* Sub-Tabs */}
      <div className="flex gap-2" role="tablist">
        {cobrancaTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const count = counts[tab.id];
          return (
            <button key={tab.id} role="tab" aria-selected={isActive} onClick={() => setActiveTab(tab.id)} className={cn(
              "relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all",
              isActive ? "bg-card border border-primary/30 text-foreground shadow-sm" : "bg-secondary/30 text-muted-foreground hover:bg-secondary/50"
            )}>
              <Icon className={cn("h-4 w-4", isActive && (tab.color === "destructive" ? "text-destructive" : tab.color === "warning" ? "text-warning" : "text-success"))} />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className={cn(
                "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold",
                isActive
                  ? tab.color === "destructive" ? "bg-destructive/20 text-destructive" : tab.color === "warning" ? "bg-warning/20 text-warning" : "bg-success/20 text-success"
                  : "bg-muted text-muted-foreground"
              )}>{count}</span>
            </button>
          );
        })}
      </div>

      {isError && <QueryErrorState message="Erro ao carregar cobranças" onRetry={refetch} />}

      {!isError && isLoading && (
        <div aria-busy="true">
          <div className="rounded-2xl border border-border/50 bg-card overflow-hidden divide-y divide-border/30">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-4">
                <div className="h-10 w-10 rounded-full bg-muted animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 rounded bg-muted animate-pulse" />
                  <div className="h-3 w-24 rounded bg-muted animate-pulse" />
                </div>
                <div className="h-6 w-16 rounded-full bg-muted animate-pulse" />
                <div className="h-5 w-20 rounded bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      )}

      {!isLoading && filteredInstallments.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 mb-4">
            <Check className="h-8 w-8 text-success" />
          </div>
          <h3 className="font-display text-lg font-semibold text-foreground mb-1">Tudo em dia! 🎉</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            {activeTab === "overdue" && "Nenhuma parcela em atraso. Continue assim!"}
            {activeTab === "today" && "Nenhuma parcela vence hoje."}
            {activeTab === "upcoming" && "Nenhuma parcela nos próximos 7 dias."}
          </p>
        </motion.div>
      )}

      {!isLoading && filteredInstallments.length > 0 && (
        <div className="rounded-2xl border border-border/50 bg-card overflow-hidden" aria-busy={isLoading}>
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="divide-y divide-border/30">
              {filteredInstallments.map((item, index) => {
                const daysOverdue = getDaysOverdue(item.due_date);
                const daysUntil = getDaysUntil(item.due_date);
                const clientName = item.clients?.name || "Cliente";
                const clientPhone = item.clients?.whatsapp || "";
                const initials = clientName.split(" ").map((n: string) => n[0]).join("").slice(0, 2);

                return (
                  <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.03 }} className="group flex items-center justify-between p-4 hover:bg-secondary/20 transition-colors">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full font-display font-semibold text-sm flex-shrink-0",
                        activeTab === "overdue" ? "bg-destructive/15 text-destructive" : activeTab === "today" ? "bg-warning/15 text-warning" : "bg-secondary text-foreground"
                      )}>{initials}</div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{clientName}</p>
                        <p className="text-xs text-muted-foreground">Parcela {item.installment_number}/{item.total_installments} · {format(parseISO(item.due_date), "dd/MM", { locale: ptBR })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {activeTab === "overdue" ? (
                        <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2.5 py-1 text-xs font-medium text-destructive">{daysOverdue}d atraso</span>
                      ) : activeTab === "today" ? (
                        <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-warning/15 px-2.5 py-1 text-xs font-medium text-warning">Vence hoje</span>
                      ) : (
                        <span className="hidden sm:inline-flex text-xs text-muted-foreground">em {daysUntil}d</span>
                      )}
                      <p className="font-display text-base font-bold text-foreground min-w-[90px] text-right">{fmt(item.amount_due)}</p>
                      <div className="flex gap-1.5">
                        <PermissionGate permission="canProcessPayments">
                          <button onClick={() => handlePayment(item)} className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/15 text-success hover:bg-success/25 transition-colors" aria-label="Registrar pagamento">
                            <DollarSign className="h-4 w-4" />
                          </button>
                        </PermissionGate>
                        <button onClick={() => openWhatsApp(clientPhone)} disabled={!clientPhone} className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-30" aria-label="Enviar WhatsApp">
                          <MessageCircle className="h-4 w-4" />
                        </button>
                        <button onClick={() => navigate(`/clientes/${item.client_id}`)} className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors opacity-0 group-hover:opacity-100" aria-label="Ver dossiê">
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* AI Agent Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={cn("rounded-xl border p-5 flex items-center justify-between gap-4", isAgentActive ? "border-primary/30 bg-primary/5" : "border-border/50 bg-card")}
      >
        <div className="flex items-center gap-4">
          <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", isAgentActive ? "bg-primary/20" : "bg-muted/20")}>
            <Sparkles className={cn("h-5 w-5", isAgentActive ? "text-primary" : "text-muted-foreground")} />
          </div>
          <div>
            <h3 className="font-medium text-foreground">Agente de Cobrança IA</h3>
            <p className="text-xs text-muted-foreground">{isAgentActive ? `Ativo das ${agentStartTime} às ${agentEndTime}` : "Desativado"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isAgentActive ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-3 py-1 text-xs font-medium text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />Ativo
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/30 px-3 py-1 text-xs font-medium text-muted-foreground">Inativo</span>
          )}
          <Link to="/configuracoes?tab=ai-agent" className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary/80 transition-colors">
            <Settings className="h-3.5 w-3.5" />Configurar
          </Link>
        </div>
      </motion.div>

      <PaymentDialog
        open={paymentDialog.open}
        onOpenChange={handlePaymentClose}
        installment={paymentDialog.installment}
        clientName={paymentDialog.installment?.clients?.name}
        clientId={paymentDialog.installment?.client_id}
      />
    </div>
  );
}

// ========== Main Page ==========
const Contratos = () => {
  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">Contratos e Cobrança</h1>
        <p className="text-sm text-muted-foreground mt-1">Gerencie seus contratos e parcelas pendentes</p>
      </div>

      <Tabs defaultValue="contratos">
        <TabsList className="bg-secondary/50 p-1 h-auto">
          <TabsTrigger value="contratos" className="gap-2 data-[state=active]:shadow-md">
            <FileText className="h-4 w-4" />
            Contratos
          </TabsTrigger>
          <TabsTrigger value="cobranca" className="gap-2 data-[state=active]:shadow-md">
            <Phone className="h-4 w-4" />
            Mesa de Cobrança
          </TabsTrigger>
        </TabsList>

        <TabsContent value="contratos" className="mt-6">
          <ContratosTab />
        </TabsContent>

        <TabsContent value="cobranca" className="mt-6">
          <CobrancaTab />
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
};

export default Contratos;

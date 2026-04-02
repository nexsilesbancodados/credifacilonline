import { MainLayout } from "@/components/layout/MainLayout";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  Clock, AlertTriangle, CalendarClock, MessageCircle,
  Check, Sparkles, ChevronRight, Bell, Settings,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePendingInstallments } from "@/hooks/useContracts";
import { useCollectionLogs } from "@/hooks/useCollectionLogs";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { format, isToday, isBefore, isAfter, addDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate, Link } from "react-router-dom";
import { PaymentDialog } from "@/components/client/PaymentDialog";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { QueryErrorState } from "@/components/QueryErrorState";

type TabType = "overdue" | "today" | "upcoming" | "upcoming15" | "upcoming30" | "sent";

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

const tabs = [
  { id: "overdue" as TabType, label: "Atrasados", icon: AlertTriangle, color: "destructive" },
  { id: "today" as TabType, label: "Hoje", icon: Clock, color: "warning" },
  { id: "upcoming" as TabType, label: "7 dias", icon: CalendarClock, color: "success" },
  { id: "upcoming15" as TabType, label: "15 dias", icon: CalendarClock, color: "success" },
  { id: "upcoming30" as TabType, label: "30 dias", icon: CalendarClock, color: "success" },
  { id: "sent" as TabType, label: "Enviadas", icon: MessageCircle, color: "primary" },
];

const MesaCobranca = () => {
  const [activeTab, setActiveTab] = useState<TabType>("overdue");
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const { data: pendingInstallments, isLoading, isError, refetch } = usePendingInstallments();
  const { logs: collectionLogs, isLoading: isLoadingLogs } = useCollectionLogs();
  const { settings } = useCompanySettings();
  const navigate = useNavigate();
  const [paymentDialog, setPaymentDialog] = useState<{ open: boolean; installment: PendingInstallment | null }>({ open: false, installment: null });

  const isAgentActive = settings?.ai_agent_active ?? false;
  const agentStartTime = settings?.ai_agent_start_time ?? "09:00";
  const agentEndTime = settings?.ai_agent_end_time ?? "18:00";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextWeek = addDays(today, 7);
  const next15 = addDays(today, 15);
  const next30 = addDays(today, 30);

  const items = (pendingInstallments || []) as PendingInstallment[];

  const filterByRange = (inst: PendingInstallment, from: Date, to: Date) => {
    const d = parseISO(inst.due_date);
    d.setHours(0, 0, 0, 0);
    return isAfter(d, from) && isBefore(d, to);
  };

  const filteredInstallments = activeTab === "sent" ? [] : items.filter((inst) => {
    const dueDate = parseISO(inst.due_date);
    dueDate.setHours(0, 0, 0, 0);
    switch (activeTab) {
      case "overdue": return isBefore(dueDate, today) && !isToday(dueDate);
      case "today": return isToday(dueDate);
      case "upcoming": return isAfter(dueDate, today) && isBefore(dueDate, nextWeek);
      case "upcoming15": return isAfter(dueDate, today) && isBefore(dueDate, next15);
      case "upcoming30": return isAfter(dueDate, today) && isBefore(dueDate, next30);
      default: return false;
    }
  });

  const counts: Record<TabType, number> = {
    overdue: items.filter((inst) => { const d = parseISO(inst.due_date); d.setHours(0,0,0,0); return isBefore(d, today) && !isToday(d); }).length,
    today: items.filter((inst) => isToday(parseISO(inst.due_date))).length,
    upcoming: items.filter((inst) => filterByRange(inst, today, nextWeek)).length,
    upcoming15: items.filter((inst) => filterByRange(inst, today, next15)).length,
    upcoming30: items.filter((inst) => filterByRange(inst, today, next30)).length,
    sent: collectionLogs?.length || 0,
  };

  const totalOverdueAmount = items.filter((inst) => { const d = parseISO(inst.due_date); d.setHours(0,0,0,0); return isBefore(d, today) && !isToday(d); }).reduce((sum, i) => sum + Number(i.amount_due), 0);

  const getDaysOverdue = (dueDate: string) => { const due = parseISO(dueDate); return Math.ceil((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)); };
  const getDaysUntil = (dueDate: string) => { const due = parseISO(dueDate); return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)); };

  const handlePayment = (installment: PendingInstallment) => setPaymentDialog({ open: true, installment });
  const handlePaymentClose = (open: boolean) => { if (!open) setPaymentDialog({ open: false, installment: null }); };
  const openWhatsApp = (phone: string) => { const clean = phone?.replace(/\D/g, "") || ""; if (clean) window.open(`https://wa.me/55${clean}`, "_blank"); };

  const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">Mesa de Cobrança</h1>
          <p className="text-sm text-muted-foreground mt-1" aria-live="polite">
            {items.length} parcelas pendentes · {counts.overdue > 0 && <span className="text-destructive font-medium">{counts.overdue} em atraso</span>}
          </p>
        </div>
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
        <div className="grid grid-cols-3 gap-3 mb-6" aria-live="polite">
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

      {/* Tabs */}
      <div className="mb-6 flex gap-2" role="tablist">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const count = counts[tab.id];
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all",
                isActive ? "bg-card border border-primary/30 text-foreground shadow-sm" : "bg-secondary/30 text-muted-foreground hover:bg-secondary/50"
              )}
            >
              <Icon className={cn("h-4 w-4", isActive && (tab.color === "destructive" ? "text-destructive" : tab.color === "warning" ? "text-warning" : tab.color === "primary" ? "text-primary" : "text-success"))} />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className={cn(
                "flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold",
                isActive
                  ? tab.color === "destructive" ? "bg-destructive/20 text-destructive" : tab.color === "warning" ? "bg-warning/20 text-warning" : tab.color === "primary" ? "bg-primary/20 text-primary" : "bg-success/20 text-success"
                  : "bg-muted text-muted-foreground"
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Error */}
      {isError && (
        <QueryErrorState message="Erro ao carregar cobranças" onRetry={refetch} />
      )}

      {/* Loading */}
      {!isError && isLoading && (
        <div aria-busy="true">
          <div className="mb-6 flex gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-10 w-32 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
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

      {/* Empty State */}
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

      {/* Installments List */}
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
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.03 }}
                    className="group flex items-center justify-between p-4 hover:bg-secondary/20 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={cn(
                        "flex h-10 w-10 items-center justify-center rounded-full font-display font-semibold text-sm flex-shrink-0",
                        activeTab === "overdue" ? "bg-destructive/15 text-destructive" : activeTab === "today" ? "bg-warning/15 text-warning" : "bg-secondary text-foreground"
                      )}>
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">{clientName}</p>
                        <p className="text-xs text-muted-foreground">
                          Parcela {item.installment_number}/{item.total_installments} · {format(parseISO(item.due_date), "dd/MM", { locale: ptBR })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {activeTab === "overdue" ? (
                        <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-destructive/15 px-2.5 py-1 text-xs font-medium text-destructive">
                          {daysOverdue}d atraso
                        </span>
                      ) : activeTab === "today" ? (
                        <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-warning/15 px-2.5 py-1 text-xs font-medium text-warning">
                          Vence hoje
                        </span>
                      ) : (
                        <span className="hidden sm:inline-flex text-xs text-muted-foreground">em {daysUntil}d</span>
                      )}

                      <p className="font-display text-base font-bold text-foreground min-w-[90px] text-right">
                        {fmt(item.amount_due)}
                      </p>

                      <div className="flex gap-1.5">
                        <PermissionGate permission="canProcessPayments">
                          <button
                            onClick={() => handlePayment(item)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/15 text-success hover:bg-success/25 transition-colors"
                            aria-label="Registrar pagamento"
                          >
                            <DollarSign className="h-4 w-4" />
                          </button>
                        </PermissionGate>
                        <button
                          onClick={() => openWhatsApp(clientPhone)}
                          disabled={!clientPhone}
                          className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-30"
                          aria-label="Enviar WhatsApp"
                        >
                          <MessageCircle className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/clientes/${item.client_id}`)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
                          aria-label="Ver dossiê"
                        >
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
        className={cn(
          "mt-8 rounded-xl border p-5 flex items-center justify-between gap-4",
          isAgentActive ? "border-primary/30 bg-primary/5" : "border-border/50 bg-card"
        )}
      >
        <div className="flex items-center gap-4">
          <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", isAgentActive ? "bg-primary/20" : "bg-muted/20")}>
            <Sparkles className={cn("h-5 w-5", isAgentActive ? "text-primary" : "text-muted-foreground")} />
          </div>
          <div>
            <h3 className="font-medium text-foreground">Agente de Cobrança IA</h3>
            <p className="text-xs text-muted-foreground">
              {isAgentActive ? `Ativo das ${agentStartTime} às ${agentEndTime}` : "Desativado"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isAgentActive ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-3 py-1 text-xs font-medium text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
              Ativo
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted/30 px-3 py-1 text-xs font-medium text-muted-foreground">Inativo</span>
          )}
          <Link to="/configuracoes?tab=ai-agent" className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-xs font-medium text-foreground hover:bg-secondary/80 transition-colors">
            <Settings className="h-3.5 w-3.5" />
            Configurar
          </Link>
        </div>
      </motion.div>

      {/* Payment Dialog */}
      <PaymentDialog
        open={paymentDialog.open}
        onOpenChange={handlePaymentClose}
        installment={paymentDialog.installment}
        clientName={paymentDialog.installment?.clients?.name}
        clientId={paymentDialog.installment?.client_id}
      />
    </MainLayout>
  );
};

export default MesaCobranca;

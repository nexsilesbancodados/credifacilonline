import { MainLayout } from "@/components/layout/MainLayout";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  Clock,
  AlertTriangle,
  CalendarClock,
  Phone,
  MessageCircle,
  Check,
  Sparkles,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { usePendingInstallments, useInstallments } from "@/hooks/useContracts";
import { format, isToday, isBefore, isAfter, addDays, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { PaymentDialog } from "@/components/client/PaymentDialog";

type TabType = "overdue" | "today" | "upcoming";

const tabs = [
  {
    id: "overdue" as TabType,
    label: "Atrasados",
    icon: AlertTriangle,
    color: "destructive",
  },
  {
    id: "today" as TabType,
    label: "Vencendo Hoje",
    icon: Clock,
    color: "warning",
  },
  {
    id: "upcoming" as TabType,
    label: "Próximos 7 dias",
    icon: CalendarClock,
    color: "success",
  },
];

const MesaCobranca = () => {
  const [activeTab, setActiveTab] = useState<TabType>("overdue");
  const { data: pendingInstallments, isLoading } = usePendingInstallments();
  const { payInstallment, isPaying } = useInstallments();
  const navigate = useNavigate();
  const [paymentDialog, setPaymentDialog] = useState<{
    open: boolean;
    installment: any | null;
  }>({ open: false, installment: null });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextWeek = addDays(today, 7);

  // Filter installments based on tab
  const filteredInstallments = pendingInstallments?.filter((inst: any) => {
    const dueDate = parseISO(inst.due_date);
    dueDate.setHours(0, 0, 0, 0);

    switch (activeTab) {
      case "overdue":
        return isBefore(dueDate, today) && !isToday(dueDate);
      case "today":
        return isToday(dueDate);
      case "upcoming":
        return isAfter(dueDate, today) && isBefore(dueDate, nextWeek);
      default:
        return false;
    }
  }) || [];

  // Count for tabs
  const counts = {
    overdue: pendingInstallments?.filter((inst: any) => {
      const dueDate = parseISO(inst.due_date);
      dueDate.setHours(0, 0, 0, 0);
      return isBefore(dueDate, today) && !isToday(dueDate);
    }).length || 0,
    today: pendingInstallments?.filter((inst: any) => isToday(parseISO(inst.due_date))).length || 0,
    upcoming: pendingInstallments?.filter((inst: any) => {
      const dueDate = parseISO(inst.due_date);
      dueDate.setHours(0, 0, 0, 0);
      return isAfter(dueDate, today) && isBefore(dueDate, nextWeek);
    }).length || 0,
  };

  const getDaysOverdue = (dueDate: string) => {
    const due = parseISO(dueDate);
    const diffTime = today.getTime() - due.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getDaysUntil = (dueDate: string) => {
    const due = parseISO(dueDate);
    const diffTime = due.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handlePayment = (installment: any) => {
    setPaymentDialog({ open: true, installment });
  };

  const confirmPayment = (amountPaid: number) => {
    if (paymentDialog.installment) {
      payInstallment({
        installmentId: paymentDialog.installment.id,
        amountPaid,
        clientId: paymentDialog.installment.client_id,
      });
      setPaymentDialog({ open: false, installment: null });
    }
  };

  const openWhatsApp = (phone: string) => {
    const cleanPhone = phone?.replace(/\D/g, "") || "";
    if (cleanPhone) {
      window.open(`https://wa.me/55${cleanPhone}`, "_blank");
    }
  };

  return (
    <MainLayout>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Mesa de Cobrança
            </h1>
            <p className="mt-1 text-muted-foreground">
              Gerencie todas as parcelas pendentes
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-5 py-3 font-medium text-primary transition-colors hover:bg-primary/20"
          >
            <Sparkles className="h-5 w-5" />
            Agente IA
          </motion.button>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-6 flex gap-3"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const count = counts[tab.id];

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative flex items-center gap-3 rounded-xl px-5 py-3 font-medium transition-all",
                isActive
                  ? "bg-card border border-primary/30 text-foreground"
                  : "bg-secondary/30 text-muted-foreground hover:bg-secondary/50"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5",
                  isActive &&
                    (tab.color === "destructive"
                      ? "text-destructive"
                      : tab.color === "warning"
                      ? "text-warning"
                      : "text-success")
                )}
              />
              <span>{tab.label}</span>
              <span
                className={cn(
                  "flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-bold",
                  isActive
                    ? tab.color === "destructive"
                      ? "bg-destructive/20 text-destructive"
                      : tab.color === "warning"
                      ? "bg-warning/20 text-warning"
                      : "bg-success/20 text-success"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {count}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute bottom-0 left-1/2 h-0.5 w-12 -translate-x-1/2 rounded-full bg-primary"
                />
              )}
            </button>
          );
        })}
      </motion.div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredInstallments.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary mb-4">
            <Check className="h-8 w-8 text-success" />
          </div>
          <h3 className="font-display text-lg font-semibold text-foreground mb-2">
            Nenhuma parcela nesta categoria
          </h3>
          <p className="text-sm text-muted-foreground">
            {activeTab === "overdue" && "Ótimo! Não há parcelas em atraso."}
            {activeTab === "today" && "Não há parcelas vencendo hoje."}
            {activeTab === "upcoming" && "Não há parcelas nos próximos 7 dias."}
          </p>
        </div>
      )}

      {/* Installments List */}
      {!isLoading && filteredInstallments.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          key={activeTab}
          className="space-y-4"
        >
          {filteredInstallments.map((item: any, index: number) => {
            const daysOverdue = getDaysOverdue(item.due_date);
            const daysUntil = getDaysUntil(item.due_date);
            const clientName = item.clients?.name || "Cliente";
            const clientPhone = item.clients?.whatsapp || "";
            const initials = clientName.split(" ").map((n: string) => n[0]).join("").slice(0, 2);

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "group flex items-center justify-between rounded-2xl border p-5 transition-all hover:scale-[1.01]",
                  activeTab === "overdue"
                    ? "border-destructive/30 bg-gradient-to-r from-destructive/10 to-transparent"
                    : activeTab === "today"
                    ? "border-warning/30 bg-gradient-to-r from-warning/10 to-transparent"
                    : "border-border/50 bg-card"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary font-display font-semibold text-foreground">
                    {initials}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{clientName}</p>
                    <p className="text-sm text-muted-foreground">
                      Parcela {item.installment_number}/{item.total_installments} • Vence em{" "}
                      {format(parseISO(item.due_date), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="font-display text-xl font-bold text-foreground">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(item.amount_due)}
                    </p>
                    {activeTab === "overdue" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-destructive/20 px-2 py-0.5 text-xs font-medium text-destructive">
                        <AlertTriangle className="h-3 w-3" />
                        {daysOverdue} dia{daysOverdue !== 1 ? "s" : ""} em atraso
                      </span>
                    ) : activeTab === "today" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-warning/20 px-2 py-0.5 text-xs font-medium text-warning">
                        <Clock className="h-3 w-3" />
                        Vence hoje
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        em {daysUntil} dia{daysUntil !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePayment(item)}
                      disabled={isPaying}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/20 text-success hover:bg-success/30 transition-colors disabled:opacity-50"
                      title="Registrar pagamento"
                    >
                      <Check className="h-5 w-5" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => openWhatsApp(clientPhone)}
                      disabled={!clientPhone}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground transition-colors disabled:opacity-50"
                      title="Ligar"
                    >
                      <Phone className="h-5 w-5" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => openWhatsApp(clientPhone)}
                      disabled={!clientPhone}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary hover:bg-primary/30 transition-colors disabled:opacity-50"
                      title="WhatsApp"
                    >
                      <MessageCircle className="h-5 w-5" />
                    </motion.button>
                  </div>

                  <button
                    onClick={() => navigate(`/clientes/${item.client_id}`)}
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    title="Ver cliente"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* AI Agent Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-8 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-foreground">
                Agente de Cobrança IA
              </h3>
              <p className="text-sm text-muted-foreground">
                Automatize cobranças com mensagens personalizadas via WhatsApp
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Status</p>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success/20 px-3 py-1 text-sm font-medium text-success">
                <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                Ativo
              </span>
            </div>
            <button className="rounded-xl bg-secondary px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors">
              Configurar
            </button>
          </div>
        </div>
      </motion.div>

      {/* Payment Dialog */}
      <PaymentDialog
        open={paymentDialog.open}
        onOpenChange={(open) => setPaymentDialog({ open, installment: null })}
        installment={paymentDialog.installment}
        onConfirm={confirmPayment}
      />
    </MainLayout>
  );
};

export default MesaCobranca;
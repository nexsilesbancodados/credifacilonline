import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  MessageCircle,
  Clock,
  AlertTriangle,
  Check,
  Send,
  Loader2,
  Calendar,
  X,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { usePendingInstallments } from "@/hooks/useContracts";
import { format, parseISO, isToday, isBefore, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "@/contexts/AuthContext";

interface WhatsAppSchedulerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type NotificationTone = "amigavel" | "formal" | "urgente";

interface ScheduledNotification {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  dueDate: string;
  amount: number;
  tone: NotificationTone;
  scheduledFor: "today" | "day_before" | "on_due" | "overdue";
  message?: string;
}

export function WhatsAppScheduler({ open, onOpenChange }: WhatsAppSchedulerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTone, setSelectedTone] = useState<NotificationTone>("amigavel");
  const [autoNotify, setAutoNotify] = useState(false);
  const [notifications, setNotifications] = useState<ScheduledNotification[]>([]);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);

  const { data: pendingInstallments } = usePendingInstallments();
  const { toast } = useToast();
  const { user } = useAuth();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = addDays(today, 1);

  // Build notification list from pending installments
  useEffect(() => {
    if (!pendingInstallments) return;

    const notifs: ScheduledNotification[] = pendingInstallments
      .filter((inst: any) => inst.clients?.whatsapp)
      .map((inst: any) => {
        const dueDate = parseISO(inst.due_date);
        let scheduledFor: ScheduledNotification["scheduledFor"] = "on_due";
        
        if (isBefore(dueDate, today)) {
          scheduledFor = "overdue";
        } else if (isToday(dueDate)) {
          scheduledFor = "today";
        }

        return {
          id: inst.id,
          clientId: inst.client_id,
          clientName: inst.clients?.name || "Cliente",
          clientPhone: inst.clients?.whatsapp || "",
          dueDate: inst.due_date,
          amount: inst.amount_due,
          tone: isBefore(dueDate, today) ? "urgente" : "amigavel",
          scheduledFor,
        };
      });

    setNotifications(notifs);
  }, [pendingInstallments, today]);

  const generateMessage = async (notification: ScheduledNotification) => {
    setGeneratingFor(notification.id);

    try {
      const response = await supabase.functions.invoke("generate-collection-message", {
        body: {
          clientName: notification.clientName,
          pendingAmount: notification.amount,
          tone: notification.tone,
        },
      });

      if (response.error) throw response.error;

      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id ? { ...n, message: response.data.message } : n
        )
      );
    } catch (error) {
      toast({
        title: "Erro ao gerar mensagem",
        description: "Tente novamente em alguns segundos.",
        variant: "destructive",
      });
    } finally {
      setGeneratingFor(null);
    }
  };

  const sendWhatsApp = async (notification: ScheduledNotification) => {
    const phone = notification.clientPhone.replace(/\D/g, "");
    const message = encodeURIComponent(notification.message || `Olá ${notification.clientName}, lembrete sobre sua parcela.`);
    
    window.open(`https://wa.me/55${phone}?text=${message}`, "_blank");

    // Log the activity
    if (user) {
      await supabase.from("activity_log").insert({
        operator_id: user.id,
        client_id: notification.clientId,
        type: "collection",
        description: `Mensagem de cobrança enviada via WhatsApp - ${notification.tone}`,
        metadata: { tone: notification.tone, amount: notification.amount },
      });
    }

    toast({
      title: "WhatsApp aberto",
      description: `Mensagem pronta para ${notification.clientName}`,
    });
  };

  const tones = [
    { value: "amigavel" as const, label: "Amigável", description: "Tom cordial e simpático", icon: "😊" },
    { value: "formal" as const, label: "Formal", description: "Linguagem profissional", icon: "📋" },
    { value: "urgente" as const, label: "Urgente", description: "Tom assertivo", icon: "⚠️" },
  ];

  const overdueNotifs = notifications.filter((n) => n.scheduledFor === "overdue");
  const todayNotifs = notifications.filter((n) => n.scheduledFor === "today");
  const upcomingNotifs = notifications.filter((n) => n.scheduledFor === "on_due" || n.scheduledFor === "day_before");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={() => onOpenChange(false)}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative z-10 w-full max-w-3xl rounded-2xl border border-border/50 bg-card shadow-lg max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10">
              <MessageCircle className="h-5 w-5 text-success" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-foreground">
                Notificações WhatsApp
              </h2>
              <p className="text-sm text-muted-foreground">
                {notifications.length} clientes para notificar
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="p-2 rounded-lg hover:bg-secondary text-muted-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Settings */}
        <div className="p-4 border-b border-border/50 bg-secondary/20">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                Tom padrão das mensagens
              </span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {tones.map((tone) => (
              <button
                key={tone.value}
                onClick={() => setSelectedTone(tone.value)}
                className={`rounded-xl p-3 text-left transition-all border ${
                  selectedTone === tone.value
                    ? "bg-primary/10 border-primary/50"
                    : "bg-card border-border/50 hover:bg-secondary/50"
                }`}
              >
                <span className="text-lg">{tone.icon}</span>
                <p className="font-medium text-sm text-foreground mt-1">{tone.label}</p>
                <p className="text-xs text-muted-foreground">{tone.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Overdue */}
          {overdueNotifs.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium text-destructive">
                  Em atraso ({overdueNotifs.length})
                </span>
              </div>
              <div className="space-y-2">
                {overdueNotifs.slice(0, 5).map((notif) => (
                  <NotificationCard
                    key={notif.id}
                    notification={notif}
                    isGenerating={generatingFor === notif.id}
                    onGenerate={() => generateMessage(notif)}
                    onSend={() => sendWhatsApp(notif)}
                    variant="destructive"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Today */}
          {todayNotifs.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Clock className="h-4 w-4 text-warning" />
                <span className="text-sm font-medium text-warning">
                  Vencendo hoje ({todayNotifs.length})
                </span>
              </div>
              <div className="space-y-2">
                {todayNotifs.map((notif) => (
                  <NotificationCard
                    key={notif.id}
                    notification={notif}
                    isGenerating={generatingFor === notif.id}
                    onGenerate={() => generateMessage(notif)}
                    onSend={() => sendWhatsApp(notif)}
                    variant="warning"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming */}
          {upcomingNotifs.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  Próximos vencimentos ({upcomingNotifs.length})
                </span>
              </div>
              <div className="space-y-2">
                {upcomingNotifs.slice(0, 3).map((notif) => (
                  <NotificationCard
                    key={notif.id}
                    notification={notif}
                    isGenerating={generatingFor === notif.id}
                    onGenerate={() => generateMessage(notif)}
                    onSend={() => sendWhatsApp(notif)}
                    variant="default"
                  />
                ))}
              </div>
            </div>
          )}

          {notifications.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Check className="h-12 w-12 text-success mb-4" />
              <p className="text-lg font-medium text-foreground">
                Nenhuma notificação pendente
              </p>
              <p className="text-sm text-muted-foreground">
                Todos os clientes estão em dia
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function NotificationCard({
  notification,
  isGenerating,
  onGenerate,
  onSend,
  variant,
}: {
  notification: ScheduledNotification;
  isGenerating: boolean;
  onGenerate: () => void;
  onSend: () => void;
  variant: "destructive" | "warning" | "default";
}) {
  const borderColor = {
    destructive: "border-destructive/30",
    warning: "border-warning/30",
    default: "border-border/50",
  }[variant];

  return (
    <div className={`rounded-xl border ${borderColor} bg-card/50 p-4`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-foreground">{notification.clientName}</p>
          <p className="text-sm text-muted-foreground">
            Vence em {format(parseISO(notification.dueDate), "dd/MM/yyyy", { locale: ptBR })}
            {" • "}
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(notification.amount)}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onGenerate}
            disabled={isGenerating}
            className="gap-1"
          >
            {isGenerating ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3" />
            )}
            Gerar
          </Button>
          <Button
            size="sm"
            onClick={onSend}
            className="gap-1 bg-success hover:bg-success/90"
          >
            <Send className="h-3 w-3" />
            Enviar
          </Button>
        </div>
      </div>
      {notification.message && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-3 p-3 rounded-lg bg-secondary/50 text-sm text-muted-foreground"
        >
          {notification.message}
        </motion.div>
      )}
    </div>
  );
}

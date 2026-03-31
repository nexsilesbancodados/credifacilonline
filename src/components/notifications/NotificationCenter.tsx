import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  MessageCircle,
  Calendar,
  Clock,
  Send,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { parseLocalDate } from "@/lib/dateUtils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  installment_id: string;
  client_id: string;
  client_name: string;
  whatsapp: string;
  amount: number;
  due_date: string;
  installment_number: number;
  total_installments: number;
  status: string;
  message: string;
  whatsapp_link: string | null;
}

interface NotificationCenterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NotificationCenter = ({ open, onOpenChange }: NotificationCenterProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [daysAhead, setDaysAhead] = useState(1);
  const [hasChecked, setHasChecked] = useState(false);
  const { toast } = useToast();

  const dayOptions = [
    { value: -3, label: "3 dias atrás", description: "Vencidas há 3 dias" },
    { value: -1, label: "Ontem", description: "Vencidas ontem" },
    { value: 0, label: "Hoje", description: "Vencem hoje" },
    { value: 1, label: "Amanhã", description: "Vencem amanhã" },
    { value: 3, label: "Em 3 dias", description: "Vencem em 3 dias" },
    { value: 7, label: "Em 1 semana", description: "Vencem em 7 dias" },
  ];

  const checkNotifications = async () => {
    setIsLoading(true);
    setNotifications([]);

    try {
      const { data, error } = await supabase.functions.invoke("check-due-notifications", {
        body: { daysAhead, dryRun: true },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      setNotifications(data.notifications || []);
      setHasChecked(true);

      if (data.count === 0) {
        toast({
          title: "Nenhuma parcela encontrada",
          description: `Não há parcelas para a data selecionada.`,
        });
      }
    } catch (error) {
      console.error("Error checking notifications:", error);
      toast({
        title: "Erro ao verificar",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openWhatsApp = (notification: Notification) => {
    if (notification.whatsapp_link) {
      window.open(notification.whatsapp_link, "_blank");
    }
  };

  const openAllWhatsApp = () => {
    notifications.forEach((n, index) => {
      if (n.whatsapp_link) {
        setTimeout(() => {
          window.open(n.whatsapp_link!, "_blank");
        }, index * 500); // Stagger opening to avoid browser blocking
      }
    });
    toast({
      title: "Abrindo WhatsApp",
      description: `${notifications.filter(n => n.whatsapp_link).length} conversas sendo abertas...`,
    });
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
          className="relative z-10 w-full max-w-2xl max-h-[85vh] overflow-hidden rounded-2xl border border-border/50 bg-card shadow-lg flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-foreground">
                  Central de Notificações
                </h2>
                <p className="text-sm text-muted-foreground">
                  Lembretes de vencimento via WhatsApp
                </p>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Day Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-muted-foreground mb-3">
                <Calendar className="inline h-4 w-4 mr-1" />
                Verificar parcelas que vencem:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {dayOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setDaysAhead(option.value)}
                    className={cn(
                      "rounded-xl p-3 text-left transition-all border",
                      daysAhead === option.value
                        ? "bg-primary/10 border-primary/50 text-primary"
                        : "bg-secondary/50 border-border/50 text-muted-foreground hover:bg-secondary"
                    )}
                  >
                    <p className="font-medium text-sm">{option.label}</p>
                    <p className="text-xs opacity-70">{option.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Check Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={checkNotifications}
              disabled={isLoading}
              className="w-full mb-6 flex items-center justify-center gap-2 rounded-xl bg-gradient-gold px-4 py-3 font-medium text-primary-foreground shadow-gold transition-all hover:shadow-gold disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <Bell className="h-5 w-5" />
                  Verificar Parcelas
                </>
              )}
            </motion.button>

            {/* Results */}
            {hasChecked && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-success" />
                    <p className="font-medium">Nenhuma parcela encontrada</p>
                    <p className="text-sm">Não há parcelas para a data selecionada</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-sm text-muted-foreground">
                        <strong className="text-foreground">{notifications.length}</strong> parcela(s) encontrada(s)
                      </p>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={openAllWhatsApp}
                        className="flex items-center gap-2 rounded-lg bg-success px-3 py-1.5 text-xs font-medium text-success-foreground hover:bg-success/90"
                      >
                        <Send className="h-3 w-3" />
                        Enviar Todos
                      </motion.button>
                    </div>

                    <div className="space-y-3">
                      {notifications.map((notification) => (
                        <div
                          key={notification.installment_id}
                          className="rounded-xl border border-border/50 bg-secondary/30 p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-medium text-foreground truncate">
                                  {notification.client_name}
                                </h4>
                                <span
                                  className={cn(
                                    "rounded-full px-2 py-0.5 text-xs font-medium",
                                    notification.status === "Atrasado"
                                      ? "bg-destructive/20 text-destructive"
                                      : "bg-warning/20 text-warning"
                                  )}
                                >
                                  {notification.status}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Parcela {notification.installment_number}/{notification.total_installments} •{" "}
                                {new Intl.NumberFormat("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                }).format(notification.amount)}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                <Clock className="inline h-3 w-3 mr-1" />
                                Vencimento: {parseLocalDate(notification.due_date).toLocaleDateString("pt-BR")}
                              </p>
                            </div>
                            <button
                              onClick={() => openWhatsApp(notification)}
                              disabled={!notification.whatsapp_link}
                              className="flex items-center gap-1 rounded-lg bg-success px-3 py-2 text-sm font-medium text-success-foreground hover:bg-success/90 disabled:opacity-50 transition-colors"
                            >
                              <MessageCircle className="h-4 w-4" />
                              <ExternalLink className="h-3 w-3" />
                            </button>
                          </div>

                          {/* Message Preview */}
                          <details className="mt-3">
                            <summary className="text-xs text-primary cursor-pointer hover:underline">
                              Ver mensagem
                            </summary>
                            <div className="mt-2 rounded-lg bg-background/50 p-3 text-xs text-muted-foreground whitespace-pre-wrap">
                              {notification.message}
                            </div>
                          </details>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border/50 bg-secondary/20">
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <p>
                Ao clicar em "Enviar", o WhatsApp será aberto com a mensagem pronta. 
                Você precisa confirmar o envio manualmente para cada cliente.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

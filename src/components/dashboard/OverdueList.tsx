import { motion } from "framer-motion";
import { AlertTriangle, Phone, MessageCircle, ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useOverdueClients } from "@/hooks/useDashboard";
import { Link } from "react-router-dom";

function getSeverity(days: number): "low" | "medium" | "high" {
  if (days <= 5) return "low";
  if (days <= 10) return "medium";
  return "high";
}

const severityStyles = {
  low: "border-l-warning/50 bg-warning/5",
  medium: "border-l-warning bg-warning/10",
  high: "border-l-destructive bg-destructive/10",
};

const badgeStyles = {
  low: "bg-warning/20 text-warning",
  medium: "bg-warning/30 text-warning",
  high: "bg-destructive/20 text-destructive",
};

export function OverdueList() {
  const { data: overdueClients, isLoading } = useOverdueClients();

  const getInitials = (name: string) => {
    const names = name.trim().split(" ");
    if (names.length === 1) return names[0].slice(0, 2).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/20">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground">
              Pagamentos Atrasados
            </h3>
            <p className="text-sm text-muted-foreground">
              {overdueClients?.length || 0} parcelas precisam de atenção
            </p>
          </div>
        </div>
        
        <Link to="/cobranca" className="flex items-center gap-1 text-sm text-primary hover:underline">
          Ver todos
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-4 space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !overdueClients || overdueClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/20">
              <span className="text-2xl">🎉</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Nenhuma parcela atrasada! Continue assim.
            </p>
          </div>
        ) : (
          overdueClients.slice(0, 4).map((item: any, index: number) => {
            const severity = getSeverity(item.daysOverdue);
            const client = item.clients;
            
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className={cn(
                  "group flex items-center justify-between rounded-xl border-l-4 p-4 transition-all hover:scale-[1.02]",
                  severityStyles[severity]
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center font-display font-semibold text-foreground">
                    {getInitials(client?.name || "")}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{client?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Vencimento: {new Date(item.due_date).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-display font-semibold text-foreground">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format(Number(item.amount_due))}
                    </p>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                        badgeStyles[severity]
                      )}
                    >
                      {item.daysOverdue} dias
                    </span>
                  </div>

                  <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                    {client?.whatsapp && (
                      <a
                        href={`https://wa.me/55${client.whatsapp.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/20 text-success hover:bg-success/30 transition-colors"
                      >
                        <Phone className="h-4 w-4" />
                      </a>
                    )}
                    <Link 
                      to={`/clientes/${item.client_id}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}

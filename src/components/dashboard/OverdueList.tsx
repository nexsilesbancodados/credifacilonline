import { motion } from "framer-motion";
import { AlertTriangle, Phone, MessageCircle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const overdueClients = [
  {
    id: "1",
    name: "Maria Santos",
    daysOverdue: 15,
    amount: 1250.0,
    installment: "4/12",
    phone: "(11) 98765-4321",
  },
  {
    id: "2",
    name: "Carlos Oliveira",
    daysOverdue: 8,
    amount: 890.0,
    installment: "2/6",
    phone: "(11) 91234-5678",
  },
  {
    id: "3",
    name: "Ana Paula",
    daysOverdue: 5,
    amount: 2100.0,
    installment: "7/24",
    phone: "(11) 99876-5432",
  },
  {
    id: "4",
    name: "Roberto Lima",
    daysOverdue: 3,
    amount: 650.0,
    installment: "1/3",
    phone: "(11) 94567-8901",
  },
];

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
              {overdueClients.length} clientes precisam de atenção
            </p>
          </div>
        </div>
        
        <button className="flex items-center gap-1 text-sm text-primary hover:underline">
          Ver todos
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {overdueClients.map((client, index) => {
          const severity = getSeverity(client.daysOverdue);
          
          return (
            <motion.div
              key={client.id}
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
                  {client.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="font-medium text-foreground">{client.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Parcela {client.installment}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-display font-semibold text-foreground">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(client.amount)}
                  </p>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                      badgeStyles[severity]
                    )}
                  >
                    {client.daysOverdue} dias
                  </span>
                </div>

                <div className="flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                  <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/20 text-success hover:bg-success/30 transition-colors">
                    <Phone className="h-4 w-4" />
                  </button>
                  <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors">
                    <MessageCircle className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

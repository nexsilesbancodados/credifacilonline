import { motion } from "framer-motion";
import { CheckCircle2, Clock, AlertTriangle, Calendar, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";

type InstallmentStatus = "Pago" | "Pendente" | "Atrasado" | "Agendado";

interface Installment {
  id: string;
  number: number;
  dueDate: string;
  amount: number;
  amountPaid?: number;
  status: InstallmentStatus;
  paymentDate: string | null;
  fine: number;
}

interface InstallmentScheduleProps {
  installments: Installment[];
  onPayment: (installment: Installment) => void;
}

const statusConfig = {
  Pago: {
    icon: CheckCircle2,
    color: "text-success",
    bgColor: "bg-success/10",
    borderColor: "border-success/30",
    label: "Pago",
  },
  Pendente: {
    icon: Clock,
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/30",
    label: "Pendente",
  },
  Atrasado: {
    icon: AlertTriangle,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
    borderColor: "border-destructive/30",
    label: "Atrasado",
  },
  Agendado: {
    icon: Calendar,
    color: "text-muted-foreground",
    bgColor: "bg-secondary/50",
    borderColor: "border-border/50",
    label: "Agendado",
  },
};

export const InstallmentSchedule = ({ installments, onPayment }: InstallmentScheduleProps) => {
  const calculateDaysOverdue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
      {installments.map((installment, index) => {
        const config = statusConfig[installment.status];
        const Icon = config.icon;
        const daysOverdue = installment.status === "Atrasado" ? calculateDaysOverdue(installment.dueDate) : 0;

        return (
          <motion.div
            key={installment.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.03 }}
            className={cn(
              "flex items-center justify-between rounded-xl border p-4 transition-all hover:bg-secondary/20",
              config.borderColor
            )}
          >
            <div className="flex items-center gap-4">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", config.bgColor)}>
                <Icon className={cn("h-5 w-5", config.color)} />
              </div>
              
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground">
                    Parcela {installment.number}
                  </p>
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-xs font-medium",
                    config.bgColor,
                    config.color
                  )}>
                    {config.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span>Venc: {new Date(installment.dueDate).toLocaleDateString("pt-BR")}</span>
                  {installment.paymentDate && (
                    <span className="text-success">
                      Pago em: {new Date(installment.paymentDate).toLocaleDateString("pt-BR")}
                    </span>
                  )}
                  {daysOverdue > 0 && (
                    <span className="text-destructive font-medium">
                      {daysOverdue} dias em atraso
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-display font-semibold text-foreground">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(installment.amount)}
                </p>
                {(installment.amountPaid ?? 0) > 0 && installment.status !== "Pago" && (
                  <p className="text-xs text-success">
                    Pago: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(installment.amountPaid || 0)}
                  </p>
                )}
                {(installment.amountPaid ?? 0) > 0 && installment.status !== "Pago" && (
                  <p className="text-xs text-warning">
                    Resta: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(installment.amount - (installment.amountPaid || 0))}
                  </p>
                )}
                {installment.fine > 0 && (
                  <p className="text-xs text-destructive">
                    + {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(installment.fine)} multa
                  </p>
                )}
              </div>

              {(installment.status === "Pendente" || installment.status === "Atrasado") && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onPayment(installment)}
                  className="flex h-9 items-center gap-2 rounded-lg bg-success px-3 text-sm font-medium text-success-foreground hover:bg-success/90 transition-colors"
                >
                  <DollarSign className="h-4 w-4" />
                  Pagar
                </motion.button>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

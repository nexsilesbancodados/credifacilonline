import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, DollarSign, Calendar, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Installment {
  id: string;
  number: number;
  dueDate: string;
  amount: number;
  status: string;
  fine: number;
}

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  installment: Installment | null;
  clientName: string;
}

export const PaymentDialog = ({ open, onOpenChange, installment, clientName }: PaymentDialogProps) => {
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [amountPaid, setAmountPaid] = useState(installment ? installment.amount + installment.fine : 0);
  const [paymentMethod, setPaymentMethod] = useState("pix");

  if (!open) return null;

  const totalDue = installment ? installment.amount + installment.fine : 0;
  const isPartialPayment = amountPaid < totalDue;
  const isOverPayment = amountPaid > totalDue;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => onOpenChange(false)}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        />

        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative z-10 w-full max-w-md rounded-2xl border border-border/50 bg-card p-6 shadow-lg"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-xl font-bold text-foreground">
                Registrar Pagamento
              </h2>
              <p className="text-sm text-muted-foreground">
                {clientName} {installment ? `- Parcela ${installment.number}` : ""}
              </p>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {installment && (
            <>
              {/* Installment Info */}
              <div className="mb-6 rounded-xl bg-secondary/50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Vencimento</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {new Date(installment.dueDate).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">Valor da Parcela</span>
                  <span className="font-display font-semibold text-foreground">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(installment.amount)}
                  </span>
                </div>
                {installment.fine > 0 && (
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-destructive">Multa/Juros</span>
                    <span className="font-display font-semibold text-destructive">
                      + {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(installment.fine)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                  <span className="text-sm font-medium text-foreground">Total a Pagar</span>
                  <span className="font-display text-lg font-bold text-primary">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalDue)}
                  </span>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Data do Pagamento
                  </label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full h-11 rounded-xl border border-border bg-secondary/50 px-4 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Valor Recebido
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="number"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(Number(e.target.value))}
                      step={0.01}
                      className="w-full h-11 rounded-xl border border-border bg-secondary/50 pl-10 pr-4 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  {isPartialPayment && (
                    <p className="mt-1 text-xs text-warning flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Pagamento parcial - restará{" "}
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalDue - amountPaid)}
                    </p>
                  )}
                  {isOverPayment && (
                    <p className="mt-1 text-xs text-success flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Pagamento excedente - abater do próximo vencimento
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Forma de Pagamento
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: "pix", label: "PIX" },
                      { value: "dinheiro", label: "Dinheiro" },
                      { value: "transferencia", label: "TED/DOC" },
                    ].map((method) => (
                      <button
                        key={method.value}
                        onClick={() => setPaymentMethod(method.value)}
                        className={cn(
                          "rounded-lg px-3 py-2 text-sm font-medium transition-all",
                          paymentMethod === method.value
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                        )}
                      >
                        {method.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => onOpenChange(false)}
                  className="flex-1 rounded-xl border border-border bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
                >
                  Cancelar
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-success px-4 py-3 text-sm font-medium text-success-foreground hover:bg-success/90 transition-colors"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Confirmar Pagamento
                </motion.button>
              </div>
            </>
          )}

          {!installment && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Selecione uma parcela para registrar o pagamento.</p>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

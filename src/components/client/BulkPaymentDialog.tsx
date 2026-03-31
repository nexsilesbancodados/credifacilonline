import { useState, useEffect, useMemo } from "react";
import { formatLocalDate, parseLocalDate } from "@/lib/dateUtils";
import { motion, AnimatePresence } from "framer-motion";
import { X, DollarSign, Calendar, CheckCircle2, AlertCircle, Printer, Banknote, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { calculateFine } from "@/lib/calculateFine";
import { generatePaymentReceipt } from "@/lib/generateReceipt";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useActivityLogger } from "@/hooks/useActivityLogger";

interface Installment {
  id: string;
  installment_number: number;
  due_date: string;
  amount_due: number;
  amount_paid: number | null;
  status: string;
  fine?: number;
  contract_id: string;
  client_id: string;
}

interface BulkPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  installments: Installment[];
  clientName: string;
  clientId: string;
}

interface PaymentAllocation {
  installmentId: string;
  installmentNumber: number;
  dueDate: string;
  amountDue: number;
  amountToPay: number;
  remainingAfter: number;
  status: "full" | "partial" | "none";
}

export const BulkPaymentDialog = ({ 
  open, 
  onOpenChange, 
  installments, 
  clientName,
  clientId 
}: BulkPaymentDialogProps) => {
  const [paymentDate, setPaymentDate] = useState(formatLocalDate(new Date()));
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { profile, user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { logActivity } = useActivityLogger();

  // Filter only pending/overdue installments, sorted by due date
  const pendingInstallments = useMemo(() => {
    return installments
      .filter(i => i.status === "Pendente" || i.status === "Atrasado")
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  }, [installments]);

  // Calculate total debt with fines
  const totalDebt = useMemo(() => {
    return pendingInstallments.reduce((sum, inst) => {
      const fine = calculateFine(inst.amount_due, inst.due_date).totalFine;
      const alreadyPaid = inst.amount_paid || 0;
      return sum + (inst.amount_due + fine - alreadyPaid);
    }, 0);
  }, [pendingInstallments]);

  // Calculate payment allocation
  const paymentAllocation = useMemo((): PaymentAllocation[] => {
    let remainingPayment = paymentAmount;
    
    return pendingInstallments.map(inst => {
      const fine = calculateFine(inst.amount_due, inst.due_date).totalFine;
      const alreadyPaid = inst.amount_paid || 0;
      const totalDue = inst.amount_due + fine - alreadyPaid;
      
      let amountToPay = 0;
      let status: "full" | "partial" | "none" = "none";
      
      if (remainingPayment >= totalDue) {
        amountToPay = totalDue;
        remainingPayment -= totalDue;
        status = "full";
      } else if (remainingPayment > 0) {
        amountToPay = remainingPayment;
        remainingPayment = 0;
        status = "partial";
      }
      
      return {
        installmentId: inst.id,
        installmentNumber: inst.installment_number,
        dueDate: inst.due_date,
        amountDue: totalDue,
        amountToPay,
        remainingAfter: totalDue - amountToPay,
        status,
      };
    });
  }, [pendingInstallments, paymentAmount]);

  // Summary
  const summary = useMemo(() => {
    const fullPayments = paymentAllocation.filter(p => p.status === "full").length;
    const partialPayment = paymentAllocation.find(p => p.status === "partial");
    const remainingDebt = totalDebt - paymentAmount;
    
    return {
      fullPayments,
      partialPayment,
      remainingDebt: Math.max(0, remainingDebt),
      change: remainingDebt < 0 ? Math.abs(remainingDebt) : 0,
    };
  }, [paymentAllocation, totalDebt, paymentAmount]);

  // Reset on open
  useEffect(() => {
    if (open) {
      setPaymentAmount(0);
      setShowSuccess(false);
    }
  }, [open]);

  const handleConfirm = async () => {
    if (paymentAmount <= 0) {
      toast({
        title: "Valor inválido",
        description: "Digite um valor maior que zero.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      // Process each allocation
      for (const allocation of paymentAllocation) {
        if (allocation.amountToPay <= 0) continue;

        const installment = pendingInstallments.find(i => i.id === allocation.installmentId);
        if (!installment) continue;

        const previousPaid = installment.amount_paid || 0;
        const newAmountPaid = previousPaid + allocation.amountToPay;
        const fine = calculateFine(installment.amount_due, installment.due_date).totalFine;
        const totalWithFine = installment.amount_due + fine;
        
        // Determine new status
        const newStatus = newAmountPaid >= totalWithFine ? "Pago" : installment.status;

        // Update installment
        const { error: updateError } = await supabase
          .from("installments")
          .update({
            amount_paid: newAmountPaid,
            status: newStatus,
            payment_date: newStatus === "Pago" ? paymentDate : null,
            fine: fine,
          })
          .eq("id", allocation.installmentId);

        if (updateError) throw updateError;

        // Register treasury transaction for each payment
        if (user) {
          await supabase.from("treasury_transactions").insert({
            operator_id: user.id,
            date: paymentDate,
            description: `Pagamento ${allocation.status === "partial" ? "parcial " : ""}parcela ${allocation.installmentNumber} - ${clientName}`,
            category: "Recebimento",
            type: "entrada",
            amount: allocation.amountToPay,
            reference_id: allocation.installmentId,
            reference_type: "installment",
          });
        }
      }

      // Log activity
      await logActivity({
        type: "payment_received",
        description: `Pagamento de R$ ${paymentAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} registrado${summary.partialPayment ? " (inclui parcial)" : ""}`,
        clientId,
        metadata: {
          amount: paymentAmount,
          fullPayments: summary.fullPayments,
          hasPartial: !!summary.partialPayment,
          paymentMethod,
        },
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["installments"] });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["treasury"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      queryClient.invalidateQueries({ queryKey: ["activity-history"] });

      setShowSuccess(true);
      toast({
        title: "Pagamento registrado!",
        description: `${summary.fullPayments} parcela(s) quitada(s)${summary.partialPayment ? ", 1 parcial" : ""}.`,
      });
    } catch (error) {
      console.error("Error processing payment:", error);
      toast({
        title: "Erro ao processar pagamento",
        description: "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    setShowSuccess(false);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        />

        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative z-10 w-full max-w-lg rounded-2xl border border-border/50 bg-card p-6 shadow-lg max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-xl font-bold text-foreground flex items-center gap-2">
                <Banknote className="h-5 w-5 text-primary" />
                Pagamento Parcial / Em Lote
              </h2>
              <p className="text-sm text-muted-foreground">
                {clientName} - {pendingInstallments.length} parcela(s) pendente(s)
              </p>
            </div>
            <button
              onClick={handleClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {showSuccess ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3 p-6 rounded-xl bg-success/10 border border-success/30">
                <CheckCircle2 className="h-8 w-8 text-success" />
                <div>
                  <p className="font-medium text-foreground">Pagamento Processado!</p>
                  <p className="text-sm text-muted-foreground">
                    {summary.fullPayments} parcela(s) quitada(s)
                    {summary.partialPayment && `, 1 pagamento parcial`}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Fechar
              </button>
            </div>
          ) : (
            <>
              {/* Total Debt */}
              <div className="mb-6 rounded-xl bg-gradient-to-r from-destructive/10 to-warning/10 border border-destructive/20 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Dívida Total (com multas)</span>
                  <span className="font-display text-xl font-bold text-foreground">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalDebt)}
                  </span>
                </div>
              </div>

              {/* Payment Input */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-2">
                    Valor Recebido
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="number"
                      value={paymentAmount || ""}
                      onChange={(e) => setPaymentAmount(Number(e.target.value))}
                      placeholder="0,00"
                      step={0.01}
                      className="w-full h-14 rounded-xl border border-border bg-secondary/50 pl-12 pr-4 text-xl font-display font-bold text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="flex gap-2 mt-2">
                    {[100, 200, 500].map((value) => (
                      <button
                        key={value}
                        onClick={() => setPaymentAmount(prev => prev + value)}
                        className="px-3 py-1 text-xs rounded-lg bg-secondary hover:bg-secondary/80 text-muted-foreground"
                      >
                        +R$ {value}
                      </button>
                    ))}
                    <button
                      onClick={() => setPaymentAmount(totalDebt)}
                      className="px-3 py-1 text-xs rounded-lg bg-primary/10 hover:bg-primary/20 text-primary"
                    >
                      Total
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
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
                      Forma de Pagamento
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full h-11 rounded-xl border border-border bg-secondary/50 px-4 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="pix">PIX</option>
                      <option value="dinheiro">Dinheiro</option>
                      <option value="transferencia">TED/DOC</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Allocation Preview */}
              {paymentAmount > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3 flex items-center gap-2">
                    <ArrowRight className="h-4 w-4" />
                    Distribuição do Pagamento
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {paymentAllocation.map((allocation) => (
                      <div
                        key={allocation.installmentId}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border transition-all",
                          allocation.status === "full" && "bg-success/10 border-success/30",
                          allocation.status === "partial" && "bg-warning/10 border-warning/30",
                          allocation.status === "none" && "bg-secondary/30 border-border/30 opacity-50"
                        )}
                      >
                        <div>
                          <p className="text-sm font-medium">
                            Parcela {allocation.installmentNumber}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Venc: {new Date(allocation.dueDate).toLocaleDateString("pt-BR")}
                          </p>
                        </div>
                        <div className="text-right">
                          {allocation.status !== "none" && (
                            <p className={cn(
                              "text-sm font-semibold",
                              allocation.status === "full" && "text-success",
                              allocation.status === "partial" && "text-warning"
                            )}>
                              {allocation.status === "full" ? "✓ Quitada" : `Parcial`}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {allocation.status === "none" 
                              ? `Pendente: ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(allocation.amountDue)}`
                              : allocation.status === "partial"
                                ? `Pago: ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(allocation.amountToPay)} | Resta: ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(allocation.remainingAfter)}`
                                : `${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(allocation.amountToPay)}`
                            }
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Summary */}
              {paymentAmount > 0 && (
                <div className="mb-6 rounded-xl bg-secondary/50 p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Parcelas quitadas</span>
                    <span className="font-medium text-success">{summary.fullPayments}</span>
                  </div>
                  {summary.partialPayment && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Pagamento parcial</span>
                      <span className="font-medium text-warning">
                        Parcela {summary.partialPayment.installmentNumber} (resta {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(summary.partialPayment.remainingAfter)})
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm pt-2 border-t border-border/50">
                    <span className="font-medium text-foreground">Dívida restante</span>
                    <span className={cn(
                      "font-display font-bold",
                      summary.remainingDebt === 0 ? "text-success" : "text-destructive"
                    )}>
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(summary.remainingDebt)}
                    </span>
                  </div>
                  {summary.change > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Troco/Crédito</span>
                      <span className="font-medium text-primary">
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(summary.change)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  disabled={isProcessing}
                  className="flex-1 rounded-xl border border-border bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfirm}
                  disabled={paymentAmount <= 0 || isProcessing}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-success px-4 py-3 text-sm font-medium text-success-foreground hover:bg-success/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full"
                      />
                      Processando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Confirmar Pagamento
                    </>
                  )}
                </motion.button>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

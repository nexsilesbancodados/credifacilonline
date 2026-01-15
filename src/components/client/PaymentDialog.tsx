import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, DollarSign, Calendar, CheckCircle2, AlertCircle, Printer, Loader2 } from "lucide-react";
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
  installment_number?: number;
  number?: number;
  due_date?: string;
  dueDate?: string;
  amount_due?: number;
  amount?: number;
  amount_paid?: number;
  amountPaid?: number;
  status: string;
  fine?: number;
  client_id?: string;
  contract_id?: string;
  clients?: {
    name?: string;
    cpf?: string;
  };
}

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  installment: Installment | null;
  clientName?: string;
  clientId?: string;
  onConfirm?: (amountPaid: number) => void;
}

export const PaymentDialog = ({ open, onOpenChange, installment, clientName, clientId, onConfirm }: PaymentDialogProps) => {
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [showPrintOption, setShowPrintOption] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { logActivity } = useActivityLogger();

  // Normalize installment data (support both formats)
  const normalizedInstallment = installment ? {
    id: installment.id,
    number: installment.installment_number || installment.number || 1,
    totalInstallments: (installment as any).total_installments || 12,
    dueDate: installment.due_date || installment.dueDate || "",
    amount: installment.amount_due || installment.amount || 0,
    amountPaid: installment.amount_paid || installment.amountPaid || 0,
    status: installment.status,
    fine: installment.fine || 0,
    clientId: installment.client_id || clientId,
    contractId: installment.contract_id,
  } : null;

  // Calculate remaining amount (total - already paid)
  const remainingAmount = normalizedInstallment 
    ? normalizedInstallment.amount - normalizedInstallment.amountPaid
    : 0;

  // Calculate fine automatically if overdue
  const calculatedFine = normalizedInstallment 
    ? calculateFine(remainingAmount, normalizedInstallment.dueDate)
    : { totalFine: 0, daysOverdue: 0 };
  
  const actualFine = normalizedInstallment?.fine || calculatedFine.totalFine;

  const resolvedClientName = clientName || installment?.clients?.name || "Cliente";
  
  // Total due is remaining amount + fine
  const totalDue = remainingAmount + actualFine;

  const [amountPaid, setAmountPaid] = useState(totalDue);

  // Reset amount when installment changes
  useEffect(() => {
    if (normalizedInstallment) {
      const remaining = normalizedInstallment.amount - normalizedInstallment.amountPaid;
      const fine = normalizedInstallment.fine || calculateFine(remaining, normalizedInstallment.dueDate).totalFine;
      setAmountPaid(remaining + fine);
    }
  }, [installment]);

  if (!open) return null;

  const isPartialPayment = amountPaid < totalDue;
  const isOverPayment = amountPaid > totalDue;

  const handleConfirm = async () => {
    if (!normalizedInstallment || !user) return;

    setIsProcessing(true);

    try {
      // Calculate new total paid
      const newTotalPaid = normalizedInstallment.amountPaid + amountPaid;
      const isFullyPaid = newTotalPaid >= normalizedInstallment.amount;

      // Update installment
      const { error: updateError } = await supabase
        .from("installments")
        .update({
          amount_paid: newTotalPaid,
          status: isFullyPaid ? "Pago" : normalizedInstallment.status,
          payment_date: isFullyPaid ? paymentDate : null,
          fine: actualFine,
          updated_at: new Date().toISOString(),
        })
        .eq("id", normalizedInstallment.id);

      if (updateError) throw updateError;

      // Register treasury transaction
      const { error: treasuryError } = await supabase
        .from("treasury_transactions")
        .insert({
          operator_id: user.id,
          type: "entrada",
          category: "recebimento",
          amount: amountPaid,
          description: `Pagamento parcela ${normalizedInstallment.number} - ${resolvedClientName}`,
          reference_type: "installment",
          reference_id: normalizedInstallment.id,
          date: paymentDate,
        });

      if (treasuryError) throw treasuryError;

      // Log activity
      await logActivity({
        type: "payment_received",
        description: `Pagamento de ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amountPaid)} - Parcela ${normalizedInstallment.number}`,
        clientId: normalizedInstallment.clientId,
        contractId: normalizedInstallment.contractId,
        metadata: { 
          amount: amountPaid, 
          installment_number: normalizedInstallment.number,
          payment_method: paymentMethod,
          is_partial: !isFullyPaid,
        },
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["installments"] });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["treasury"] });
      queryClient.invalidateQueries({ queryKey: ["activity_log"] });

      toast({
        title: isFullyPaid ? "Pagamento registrado!" : "Pagamento parcial registrado!",
        description: isFullyPaid 
          ? `Parcela ${normalizedInstallment.number} quitada com sucesso.`
          : `Pago ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(amountPaid)}. Resta ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(normalizedInstallment.amount - newTotalPaid)}.`,
      });

      if (onConfirm) {
        onConfirm(amountPaid);
      }

      setShowPrintOption(true);
    } catch (error: any) {
      console.error("Error processing payment:", error);
      toast({
        title: "Erro ao registrar pagamento",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrintReceipt = () => {
    if (!normalizedInstallment) return;
    
    generatePaymentReceipt({
      clientName: resolvedClientName,
      clientCpf: (installment as any)?.clients?.cpf || "000.000.000-00",
      installmentNumber: normalizedInstallment.number,
      totalInstallments: normalizedInstallment.totalInstallments,
      dueDate: normalizedInstallment.dueDate,
      paymentDate,
      amountDue: normalizedInstallment.amount,
      amountPaid: normalizedInstallment.amountPaid + amountPaid,
      fine: actualFine,
      paymentMethod,
      operatorName: profile?.name,
    });
    
    onOpenChange(false);
    setShowPrintOption(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    setShowPrintOption(false);
  };

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
                {resolvedClientName} {normalizedInstallment ? `- Parcela ${normalizedInstallment.number}` : ""}
              </p>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {normalizedInstallment && (
            <>
              {/* Installment Info */}
              <div className="mb-6 rounded-xl bg-secondary/50 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Vencimento</span>
                  </div>
                  <span className="text-sm font-medium text-foreground">
                    {new Date(normalizedInstallment.dueDate).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">Valor da Parcela</span>
                  <span className="font-display font-semibold text-foreground">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(normalizedInstallment.amount)}
                  </span>
                </div>
                {normalizedInstallment.amountPaid > 0 && (
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-success">Já Pago</span>
                    <span className="font-display font-semibold text-success">
                      - {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(normalizedInstallment.amountPaid)}
                    </span>
                  </div>
                )}
                {actualFine > 0 && (
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-destructive">
                      Multa/Juros {calculatedFine.daysOverdue > 0 && `(${calculatedFine.daysOverdue} dias)`}
                    </span>
                    <span className="font-display font-semibold text-destructive">
                      + {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(actualFine)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-border/50">
                  <span className="text-sm font-medium text-foreground">Restante a Pagar</span>
                  <span className="font-display text-lg font-bold text-primary">
                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalDue)}
                  </span>
                </div>
              </div>

              {/* Print option after confirmation */}
              {showPrintOption ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-3 p-6 rounded-xl bg-success/10 border border-success/30">
                    <CheckCircle2 className="h-8 w-8 text-success" />
                    <div>
                      <p className="font-medium text-foreground">Pagamento Registrado!</p>
                      <p className="text-sm text-muted-foreground">Deseja imprimir o comprovante?</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleClose}
                      className="flex-1 rounded-xl border border-border bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
                    >
                      Fechar
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handlePrintReceipt}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      <Printer className="h-4 w-4" />
                      Imprimir Recibo
                    </motion.button>
                  </div>
                </div>
              ) : (
                <>
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
                        Valor a Pagar
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
                            type="button"
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
                      disabled={isProcessing}
                      className="flex-1 rounded-xl border border-border bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleConfirm}
                      disabled={isProcessing || amountPaid <= 0}
                      className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-success px-4 py-3 text-sm font-medium text-success-foreground hover:bg-success/90 transition-colors disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                      {isProcessing ? "Processando..." : "Confirmar Pagamento"}
                    </motion.button>
                  </div>
                </>
              )}
            </>
          )}

          {!normalizedInstallment && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Selecione uma parcela para registrar o pagamento.</p>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

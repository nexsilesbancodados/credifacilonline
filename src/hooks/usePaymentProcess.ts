import { useState, useEffect } from "react";
import { formatLocalDate } from "@/lib/dateUtils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useActivityLogger } from "@/hooks/useActivityLogger";
import { useCompanySettings } from "@/hooks/useCompanySettings";
import { calculateFine, FineConfig, DEFAULT_FINE_CONFIG } from "@/lib/calculateFine";

export type PaymentType = "full" | "partial" | "interest_only";

export interface NormalizedInstallment {
  id: string;
  number: number;
  totalInstallments: number;
  dueDate: string;
  amount: number;
  amountPaid: number;
  status: string;
  fine: number;
  clientId: string | undefined;
  contractId: string | undefined;
}

export interface ContractData {
  id: string;
  capital: number;
  interest_rate: number;
  frequency: string;
  installment_value: number;
}

interface PaymentInstallment {
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
  total_installments?: number;
  clients?: { name?: string; cpf?: string };
}

export function usePaymentProcess(
  installment: PaymentInstallment | null,
  open: boolean,
  clientId?: string,
) {
  const [paymentDate, setPaymentDate] = useState(formatLocalDate(new Date()));
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [paymentType, setPaymentType] = useState<PaymentType>("full");
  const [showPrintOption, setShowPrintOption] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [contractData, setContractData] = useState<ContractData | null>(null);
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { logActivity } = useActivityLogger();
  const { settings: companySettings } = useCompanySettings();

  const fineConfig: FineConfig = {
    baseFinePercent: companySettings?.default_fine_percentage ?? DEFAULT_FINE_CONFIG.baseFinePercent,
    dailyInterestPercent: companySettings?.default_daily_interest ?? DEFAULT_FINE_CONFIG.dailyInterestPercent,
    maxFinePercent: 20,
  };

  const normalized: NormalizedInstallment | null = installment ? {
    id: installment.id,
    number: installment.installment_number || installment.number || 1,
    totalInstallments: installment.total_installments || 12,
    dueDate: installment.due_date || installment.dueDate || "",
    amount: installment.amount_due || installment.amount || 0,
    amountPaid: installment.amount_paid || installment.amountPaid || 0,
    status: installment.status,
    fine: installment.fine || 0,
    clientId: installment.client_id || clientId,
    contractId: installment.contract_id,
  } : null;

  useEffect(() => {
    const fetchContractData = async () => {
      if (normalized?.contractId) {
        const { data, error } = await supabase.from("contracts").select("id, capital, interest_rate, frequency, installment_value").eq("id", normalized.contractId).single();
        if (!error && data) setContractData(data);
      }
    };
    if (open && normalized?.contractId) fetchContractData();
  }, [open, normalized?.contractId]);

  const remainingAmount = normalized ? normalized.amount - normalized.amountPaid : 0;
  const calculatedFine = normalized ? calculateFine(remainingAmount, normalized.dueDate, fineConfig) : { totalFine: 0, daysOverdue: 0, baseFine: 0, dailyInterest: 0 };
  const actualFine = normalized?.fine || calculatedFine.totalFine;
  const totalDue = remainingAmount + actualFine;
  const interestOnlyAmount = contractData ? (contractData.capital * contractData.interest_rate / 100) : 0;
  const isMonthlyLoan = contractData?.frequency === "mensal";

  const [amountPaid, setAmountPaid] = useState(totalDue);

  useEffect(() => {
    if (normalized) {
      if (paymentType === "interest_only" && isMonthlyLoan) {
        setAmountPaid(interestOnlyAmount);
      } else {
        const remaining = normalized.amount - normalized.amountPaid;
        const fine = normalized.fine || calculateFine(remaining, normalized.dueDate, fineConfig).totalFine;
        setAmountPaid(remaining + fine);
        setPaymentType("full");
      }
    }
  }, [installment, paymentType, isMonthlyLoan, interestOnlyAmount]);

  const isPartialPayment = amountPaid < totalDue;
  const isOverPayment = amountPaid > totalDue;

  const handleConfirm = async (clientName: string, onConfirm?: (amount: number) => void) => {
    if (!normalized || !user) return;
    setIsProcessing(true);
    const formatCurrency = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

    try {
      const isInterestOnlyPayment = paymentType === "interest_only" && isMonthlyLoan;

      if (isInterestOnlyPayment && contractData) {
        await supabase.from("treasury_transactions").insert({
          operator_id: user.id, type: "entrada", category: "Juros", amount: amountPaid,
          description: `Pagamento de juros - Parcela ${normalized.number} - ${clientName}`,
          reference_type: "installment", reference_id: normalized.id, date: paymentDate,
        });
        await supabase.from("installments").update({ amount_paid: amountPaid, status: "Pago", payment_date: paymentDate, fine: 0, updated_at: new Date().toISOString() }).eq("id", normalized.id);

        const { data: nextInstallments } = await supabase.from("installments").select("*").eq("contract_id", normalized.contractId!).in("status", ["Pendente", "Atrasado"]).neq("id", normalized.id).order("due_date", { ascending: true }).limit(1);
        if (nextInstallments && nextInstallments.length > 0) {
          const newAmountDue = contractData.capital + (contractData.capital * contractData.interest_rate / 100);
          await supabase.from("installments").update({ amount_due: newAmountDue, updated_at: new Date().toISOString() }).eq("id", nextInstallments[0].id);
        }

        await logActivity({ type: "payment_received", description: `Pagamento de juros: ${formatCurrency(amountPaid)} - Parcela ${normalized.number}`, clientId: normalized.clientId, contractId: normalized.contractId, metadata: { amount: amountPaid, installment_number: normalized.number, payment_method: paymentMethod, payment_type: "interest_only", capital_rolled: contractData.capital } });
        toast({ title: "Juros pagos!", description: `Juros de ${formatCurrency(amountPaid)} registrados. Capital de ${formatCurrency(contractData.capital)} rolado para próxima parcela.` });
      } else {
        const newTotalPaid = normalized.amountPaid + amountPaid;
        const isFullyPaid = newTotalPaid >= normalized.amount;
        await supabase.from("installments").update({ amount_paid: newTotalPaid, status: isFullyPaid ? "Pago" : normalized.status, payment_date: isFullyPaid ? paymentDate : null, fine: actualFine, updated_at: new Date().toISOString() }).eq("id", normalized.id);
        await supabase.from("treasury_transactions").insert({ operator_id: user.id, type: "entrada", category: "Recebimento", amount: amountPaid, description: `Pagamento parcela ${normalized.number} - ${clientName}`, reference_type: "installment", reference_id: normalized.id, date: paymentDate });
        await logActivity({ type: "payment_received", description: `Pagamento de ${formatCurrency(amountPaid)} - Parcela ${normalized.number}`, clientId: normalized.clientId, contractId: normalized.contractId, metadata: { amount: amountPaid, installment_number: normalized.number, payment_method: paymentMethod, is_partial: !isFullyPaid } });
        toast({ title: isFullyPaid ? "Pagamento registrado!" : "Pagamento parcial registrado!", description: isFullyPaid ? `Parcela ${normalized.number} quitada com sucesso.` : `Pago ${formatCurrency(amountPaid)}. Resta ${formatCurrency(normalized.amount - newTotalPaid)}.` });
      }

      queryClient.invalidateQueries({ queryKey: ["installments"] });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["treasury"] });
      queryClient.invalidateQueries({ queryKey: ["activity_log"] });
      onConfirm?.(amountPaid);
      setShowPrintOption(true);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Tente novamente.";
      console.error("Error processing payment:", error);
      toast({ title: "Erro ao registrar pagamento", description: message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    paymentDate, setPaymentDate, paymentMethod, setPaymentMethod,
    paymentType, setPaymentType, showPrintOption, setShowPrintOption,
    isProcessing, contractData, normalized, amountPaid, setAmountPaid,
    remainingAmount, calculatedFine, actualFine, totalDue,
    interestOnlyAmount, isMonthlyLoan, isPartialPayment, isOverPayment,
    handleConfirm, profile,
  };
}

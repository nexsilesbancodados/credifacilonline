import { useMemo } from "react";
import { useInstallments, useContracts } from "@/hooks/useContracts";
import { differenceInDays, parseISO, subMonths } from "date-fns";

export interface ClientScore {
  score: number;          // 0-100
  rating: "A" | "B" | "C" | "D" | "E";
  ratingLabel: string;
  color: string;
  factors: ScoreFactor[];
}

interface ScoreFactor {
  name: string;
  impact: "positive" | "negative" | "neutral";
  weight: number;
  description: string;
}

interface UseClientScoreParams {
  clientId: string;
}

export function useClientScore({ clientId }: UseClientScoreParams): ClientScore | null {
  const { installments } = useInstallments(clientId);
  const { contracts } = useContracts(clientId);

  return useMemo(() => {
    if (!installments || installments.length === 0) {
      return null;
    }

    const factors: ScoreFactor[] = [];
    let score = 50; // Start with neutral score

    // Factor 1: Payment history (40% weight)
    const paidInstallments = installments.filter((i) => i.status === "Pago");
    const totalDue = installments.filter((i) => 
      i.status === "Pago" || i.status === "Atrasado" || 
      (i.status === "Pendente" && parseISO(i.due_date) <= new Date())
    );
    
    if (totalDue.length > 0) {
      const paymentRate = paidInstallments.length / totalDue.length;
      const paymentScore = paymentRate * 40;
      score += paymentScore - 20; // Adjust from neutral
      
      factors.push({
        name: "Histórico de Pagamentos",
        impact: paymentRate >= 0.8 ? "positive" : paymentRate >= 0.5 ? "neutral" : "negative",
        weight: 40,
        description: `${Math.round(paymentRate * 100)}% das parcelas pagas em dia`,
      });
    }

    // Factor 2: Current overdue status (30% weight)
    const overdueInstallments = installments.filter((i) => i.status === "Atrasado");
    const overdueAmount = overdueInstallments.reduce((sum, i) => sum + Number(i.amount_due), 0);
    
    if (overdueInstallments.length === 0) {
      score += 15;
      factors.push({
        name: "Situação Atual",
        impact: "positive",
        weight: 30,
        description: "Nenhuma parcela em atraso",
      });
    } else {
      const avgDaysOverdue = overdueInstallments.reduce((sum, i) => {
        return sum + differenceInDays(new Date(), parseISO(i.due_date));
      }, 0) / overdueInstallments.length;
      
      const overdueImpact = Math.min(avgDaysOverdue / 30, 1) * 30;
      score -= overdueImpact;
      
      factors.push({
        name: "Situação Atual",
        impact: "negative",
        weight: 30,
        description: `${overdueInstallments.length} parcela(s) em atraso (média ${Math.round(avgDaysOverdue)} dias)`,
      });
    }

    // Factor 3: Contract history (15% weight)
    const activeContracts = contracts?.filter((c) => c.status === "Ativo") || [];
    const completedContracts = contracts?.filter((c) => c.status === "Quitado") || [];
    const renegotiatedContracts = contracts?.filter((c) => c.status === "Renegociado") || [];
    
    if (completedContracts.length > 0) {
      score += 10;
      factors.push({
        name: "Contratos Quitados",
        impact: "positive",
        weight: 15,
        description: `${completedContracts.length} contrato(s) quitado(s)`,
      });
    } else if (renegotiatedContracts.length > 0) {
      score -= 5;
      factors.push({
        name: "Renegociações",
        impact: "negative",
        weight: 15,
        description: `${renegotiatedContracts.length} contrato(s) renegociado(s)`,
      });
    } else {
      factors.push({
        name: "Histórico de Contratos",
        impact: "neutral",
        weight: 15,
        description: "Primeiro contrato",
      });
    }

    // Factor 4: Payment punctuality (15% weight)
    const paidOnTime = paidInstallments.filter((i) => {
      if (!i.payment_date) return false;
      const paymentDate = parseISO(i.payment_date);
      const dueDate = parseISO(i.due_date);
      return differenceInDays(paymentDate, dueDate) <= 0;
    });
    
    if (paidInstallments.length > 0) {
      const punctualityRate = paidOnTime.length / paidInstallments.length;
      const punctualityScore = punctualityRate * 15;
      score += punctualityScore - 7.5;
      
      factors.push({
        name: "Pontualidade",
        impact: punctualityRate >= 0.8 ? "positive" : punctualityRate >= 0.5 ? "neutral" : "negative",
        weight: 15,
        description: `${Math.round(punctualityRate * 100)}% dos pagamentos antes do vencimento`,
      });
    }

    // Clamp score between 0 and 100
    score = Math.max(0, Math.min(100, Math.round(score)));

    // Determine rating
    let rating: ClientScore["rating"];
    let ratingLabel: string;
    let color: string;

    if (score >= 80) {
      rating = "A";
      ratingLabel = "Excelente";
      color = "hsl(142, 71%, 45%)"; // success
    } else if (score >= 60) {
      rating = "B";
      ratingLabel = "Bom";
      color = "hsl(45, 90%, 50%)"; // primary/gold
    } else if (score >= 40) {
      rating = "C";
      ratingLabel = "Regular";
      color = "hsl(38, 92%, 50%)"; // warning
    } else if (score >= 20) {
      rating = "D";
      ratingLabel = "Ruim";
      color = "hsl(25, 80%, 50%)"; // orange
    } else {
      rating = "E";
      ratingLabel = "Crítico";
      color = "hsl(0, 72%, 51%)"; // destructive
    }

    return {
      score,
      rating,
      ratingLabel,
      color,
      factors,
    };
  }, [installments, contracts]);
}

// Simple score calculation for list views
export function calculateQuickScore(
  paidCount: number,
  overdueCount: number,
  totalCount: number
): { score: number; rating: "A" | "B" | "C" | "D" | "E" } {
  if (totalCount === 0) {
    return { score: 50, rating: "C" };
  }

  const paidRate = paidCount / totalCount;
  const overdueRate = overdueCount / totalCount;

  let score = 50 + (paidRate * 40) - (overdueRate * 50);
  score = Math.max(0, Math.min(100, Math.round(score)));

  let rating: "A" | "B" | "C" | "D" | "E";
  if (score >= 80) rating = "A";
  else if (score >= 60) rating = "B";
  else if (score >= 40) rating = "C";
  else if (score >= 20) rating = "D";
  else rating = "E";

  return { score, rating };
}

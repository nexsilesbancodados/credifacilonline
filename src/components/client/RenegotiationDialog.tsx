import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Calculator, TrendingDown, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useRenegotiation } from "@/hooks/useRenegotiation";
import { useToast } from "@/hooks/use-toast";

interface Client {
  id: string;
  name: string;
  status: string;
  contractId?: string;
  financialSummary: {
    pendingAmount: number;
    totalInstallments: number;
    paidInstallments: number;
    interestRate: number;
    installmentValue: number;
  };
}

interface RenegotiationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client;
}

export const RenegotiationDialog = ({ open, onOpenChange, client }: RenegotiationDialogProps) => {
  const [newInstallments, setNewInstallments] = useState(6);
  const [newRate, setNewRate] = useState(client.financialSummary.interestRate);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{ installments: number; rate: number; reason: string } | null>(null);
  
  const { renegotiate, isRenegotiating } = useRenegotiation();
  const { toast } = useToast();

  const remainingAmount = client.financialSummary.pendingAmount;
  
  // Simple calculation for new installment value
  const calculateNewInstallment = () => {
    const monthlyRate = newRate / 100;
    const totalWithInterest = remainingAmount * (1 + monthlyRate * newInstallments);
    return totalWithInterest / newInstallments;
  };

  const newInstallmentValue = calculateNewInstallment();
  const totalNewAmount = newInstallmentValue * newInstallments;
  const difference = totalNewAmount - remainingAmount;

  const handleAISuggestion = async () => {
    setIsGeneratingAI(true);
    setAiSuggestion(null);
    
    try {
      const { data, error } = await supabase.functions.invoke("suggest-renegotiation", {
        body: {
          clientName: client.name,
          pendingAmount: remainingAmount,
          totalInstallments: client.financialSummary.totalInstallments,
          paidInstallments: client.financialSummary.paidInstallments,
          currentRate: client.financialSummary.interestRate,
          clientStatus: client.status,
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      const suggestion = {
        installments: data.installments || 8,
        rate: data.rate || 8,
        reason: data.reason || "Sugestão baseada no perfil do cliente.",
      };

      setAiSuggestion(suggestion);
      setNewInstallments(suggestion.installments);
      setNewRate(suggestion.rate);
    } catch (error) {
      console.error("Error getting AI suggestion:", error);
      // Fallback suggestion
      const fallbackSuggestion = {
        installments: Math.min(12, client.financialSummary.totalInstallments - client.financialSummary.paidInstallments + 4),
        rate: Math.max(5, client.financialSummary.interestRate - 2),
        reason: "Sugestão baseada no perfil: estender prazo e reduzir taxa para aumentar probabilidade de quitação.",
      };
      setAiSuggestion(fallbackSuggestion);
      setNewInstallments(fallbackSuggestion.installments);
      setNewRate(fallbackSuggestion.rate);
      
      toast({
        title: "Sugestão gerada localmente",
        description: "Não foi possível conectar à IA, usando sugestão padrão.",
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleConfirmRenegotiation = async () => {
    if (!client.contractId) {
      toast({
        title: "Erro",
        description: "ID do contrato não encontrado.",
        variant: "destructive",
      });
      return;
    }

    try {
      await renegotiate({
        clientId: client.id,
        originalContractId: client.contractId,
        pendingAmount: remainingAmount,
        newInstallments,
        newRate,
        newInstallmentValue,
        totalNewAmount,
      });
      onOpenChange(false);
    } catch (error) {
      // Error handled in hook
    }
  };

  if (!open) return null;

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
          className="relative z-10 w-full max-w-lg rounded-2xl border border-border/50 bg-card p-6 shadow-lg"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-display text-xl font-bold text-foreground">
                Renegociar Dívida
              </h2>
              <p className="text-sm text-muted-foreground">
                Cliente: {client.name}
              </p>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Current Situation */}
          <div className="mb-6 rounded-xl bg-destructive/10 border border-destructive/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">Saldo Devedor Atual</span>
            </div>
            <p className="font-display text-2xl font-bold text-foreground">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(remainingAmount)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {client.financialSummary.totalInstallments - client.financialSummary.paidInstallments} parcelas restantes de{" "}
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(client.financialSummary.installmentValue)}
            </p>
          </div>

          {/* AI Suggestion Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAISuggestion}
            disabled={isGeneratingAI}
            className="w-full mb-6 flex items-center justify-center gap-2 rounded-xl bg-gradient-gold px-4 py-3 font-medium text-primary-foreground shadow-gold transition-all hover:shadow-gold disabled:opacity-50"
          >
            {isGeneratingAI ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="h-5 w-5" />
                </motion.div>
                Gerando sugestão...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Sugerir Renegociação com IA
              </>
            )}
          </motion.button>

          {/* AI Suggestion Result */}
          {aiSuggestion && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-xl border border-primary/30 bg-primary/5 p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-primary">Sugestão da IA</span>
              </div>
              <p className="text-sm text-foreground mb-3">{aiSuggestion.reason}</p>
              <div className="flex gap-4 text-sm">
                <span className="text-muted-foreground">
                  <strong className="text-foreground">{aiSuggestion.installments}</strong> parcelas
                </span>
                <span className="text-muted-foreground">
                  <strong className="text-foreground">{aiSuggestion.rate}%</strong> a.m.
                </span>
              </div>
            </motion.div>
          )}

          {/* Form Fields */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                <Clock className="inline h-4 w-4 mr-1" />
                Novas Parcelas
              </label>
              <input
                type="number"
                value={newInstallments}
                onChange={(e) => setNewInstallments(Number(e.target.value))}
                min={1}
                max={24}
                className="w-full h-11 rounded-xl border border-border bg-secondary/50 px-4 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                <TrendingDown className="inline h-4 w-4 mr-1" />
                Nova Taxa (% a.m.)
              </label>
              <input
                type="number"
                value={newRate}
                onChange={(e) => setNewRate(Number(e.target.value))}
                step={0.5}
                min={0}
                className="w-full h-11 rounded-xl border border-border bg-secondary/50 px-4 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* New Terms Summary */}
          <div className="rounded-xl bg-secondary/50 p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Novos Termos</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor da Parcela</span>
                <span className="font-display font-semibold text-foreground">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(newInstallmentValue)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total a Receber</span>
                <span className="font-display font-semibold text-foreground">
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalNewAmount)}
                </span>
              </div>
              <div className="flex justify-between border-t border-border/50 pt-2 mt-2">
                <span className="text-muted-foreground">Diferença (Juros)</span>
                <span className={cn(
                  "font-display font-semibold",
                  difference >= 0 ? "text-success" : "text-destructive"
                )}>
                  {difference >= 0 ? "+" : ""}{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(difference)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => onOpenChange(false)}
              disabled={isRenegotiating}
              className="flex-1 rounded-xl border border-border bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleConfirmRenegotiation}
              disabled={isRenegotiating || !client.contractId}
              className="flex-1 rounded-xl bg-success px-4 py-3 text-sm font-medium text-success-foreground hover:bg-success/90 transition-colors disabled:opacity-50"
            >
              {isRenegotiating ? "Processando..." : "Confirmar Renegociação"}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

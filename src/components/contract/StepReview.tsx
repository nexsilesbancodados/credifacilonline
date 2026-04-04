import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Check, Loader2, Calendar, TrendingUp, AlertTriangle, ChevronDown } from "lucide-react";
import { ContractFormData, frequencies, dailyTypes } from "@/hooks/useContractForm";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { advanceDateStrByFrequency, addDaysToDateStr, addMonthsToDateStr } from "@/lib/dateUtils";
import { getDay } from "date-fns";

interface StepReviewProps {
  formData: ContractFormData;
  avatarPreview: string | null;
  effectiveInstallments: number;
  installmentResult: number;
  rateResult: number;
  totalAmount: number;
  totalProfit: number;
  isSaving: boolean;
  isUploadingAvatar: boolean;
  onSave: () => void;
  isFormValid?: boolean;
  validationErrors?: string[];
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

function generateSchedulePreview(formData: ContractFormData, installmentResult: number, effectiveInstallments: number): Array<{ number: number; date: string; amount: number; isPaid: boolean }> {
  if (effectiveInstallments <= 0 || installmentResult <= 0 || !formData.startDate) return [];
  
  const paidCount = Number(formData.paidInstallments) || 0;
  const items: Array<{ number: number; date: string; amount: number; isPaid: boolean }> = [];

  if (formData.frequency === "programada" && formData.scheduledDays.length > 0) {
    const sortedDays = [...formData.scheduledDays].sort((a, b) => a - b);
    const [year, month, day] = formData.startDate.split("-").map(Number);
    let currentMonth = month - 1;
    let currentYear = year;
    let dayIndex = sortedDays.findIndex(d => d >= day);
    if (dayIndex === -1) { dayIndex = 0; currentMonth++; if (currentMonth > 11) { currentMonth = 0; currentYear++; } }

    for (let i = 1; i <= effectiveInstallments; i++) {
      const d = sortedDays[dayIndex];
      const maxDay = new Date(currentYear, currentMonth + 1, 0).getDate();
      const clampedDay = Math.min(d, maxDay);
      const date = new Date(currentYear, currentMonth, clampedDay);
      items.push({
        number: i,
        date: date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }),
        amount: installmentResult,
        isPaid: i <= paidCount,
      });
      dayIndex++;
      if (dayIndex >= sortedDays.length) { dayIndex = 0; currentMonth++; if (currentMonth > 11) { currentMonth = 0; currentYear++; } }
    }
  } else {
    const firstDueDate = formData.firstDueDate || formData.startDate;
    let dueDateStr = firstDueDate;

    for (let i = 1; i <= effectiveInstallments; i++) {
      const [y, m, d] = dueDateStr.split("-").map(Number);
      const date = new Date(y, m - 1, d);
      items.push({
        number: i,
        date: date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }),
        amount: installmentResult,
        isPaid: i <= paidCount,
      });

      if (formData.frequency === "diario") {
        let next = addDaysToDateStr(dueDateStr, 1);
        if (formData.dailyType && formData.dailyType !== "seg-seg") {
          const isValidDay = (ds: string) => {
            const [yy, mm, dd] = ds.split("-").map(Number);
            const dayOfWeek = getDay(new Date(yy, mm - 1, dd));
            if (formData.dailyType === "seg-sex") return dayOfWeek >= 1 && dayOfWeek <= 5;
            if (formData.dailyType === "seg-sab") return dayOfWeek >= 1 && dayOfWeek <= 6;
            return true;
          };
          while (!isValidDay(next)) next = addDaysToDateStr(next, 1);
        }
        dueDateStr = next;
      } else if (formData.frequency === "semanal") {
        dueDateStr = addDaysToDateStr(dueDateStr, 7);
      } else if (formData.frequency === "quinzenal") {
        dueDateStr = addDaysToDateStr(dueDateStr, 14);
      } else {
        dueDateStr = addMonthsToDateStr(dueDateStr, 1);
      }
    }
  }

  return items;
}

export function StepReview({
  formData, avatarPreview, effectiveInstallments,
  installmentResult, rateResult, totalAmount, totalProfit,
  isSaving, isUploadingAvatar, onSave,
  isFormValid = true, validationErrors = [],
}: StepReviewProps) {
  const [showSchedule, setShowSchedule] = useState(false);
  const capitalNum = Number(formData.capital) || 0;
  const profitMargin = capitalNum > 0 ? (totalProfit / capitalNum) * 100 : 0;

  const isDisabled = isSaving || isUploadingAvatar || !isFormValid;

  const schedule = generateSchedulePreview(formData, installmentResult, effectiveInstallments);
  const maxPreview = 50;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="lg:sticky lg:top-8 h-fit"
    >
      <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <h2 className="font-display text-lg font-semibold text-foreground">Resumo do Contrato</h2>
        </div>

        {/* Client Preview */}
        {formData.name && (
          <div className="flex items-center gap-3 mb-6 p-3 rounded-xl bg-secondary/30">
            {avatarPreview ? (
              <img src={avatarPreview} alt={formData.name} className="h-12 w-12 rounded-full object-cover" />
            ) : (
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                {formData.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-medium text-foreground">{formData.name}</p>
              <p className="text-xs text-muted-foreground">{formData.cpf || "CPF não informado"}</p>
            </div>
          </div>
        )}

        {/* Summary Rows */}
        <div className="space-y-3">
          <SummaryRow label="Capital" value={formatCurrency(capitalNum)} />
          <SummaryRow label="Taxa de Juros" value={`${rateResult.toFixed(2)}%`} />
          <SummaryRow label="Frequência" value={
            `${frequencies.find(f => f.value === formData.frequency)?.label || ""}` +
            (formData.frequency === "diario" ? ` (${dailyTypes.find(d => d.value === formData.dailyType)?.label})` : "") +
            (formData.frequency === "programada" && formData.scheduledDays.length > 0 ? ` (dias ${formData.scheduledDays.join(", ")})` : "")
          } />
          <SummaryRow label="Parcelas" value={`${effectiveInstallments}x`} />
          
          {/* Highlight: Installment Value */}
          <div className="flex justify-between items-center py-3 border-b border-border/50">
            <span className="text-muted-foreground">Valor da Parcela</span>
            <span className="font-display font-semibold text-primary text-xl">{formatCurrency(installmentResult)}</span>
          </div>
          
          <SummaryRow label="Valor Total" value={formatCurrency(totalAmount)} />

          {/* Fine & Interest */}
          <SummaryRow 
            label="Multa / Juros" 
            value={`${formData.finePercentage}% + ${formData.dailyInterestRate}%/dia`} 
          />

          {/* Paid installments */}
          {Number(formData.paidInstallments) > 0 && (
            <SummaryRow 
              label="Já Pagas" 
              value={`${formData.paidInstallments} de ${effectiveInstallments}`} 
            />
          )}

          {/* Profit */}
          <div className={cn(
            "flex justify-between items-center py-3 rounded-xl px-4 -mx-2",
            totalProfit >= 0 ? "bg-emerald-500/10" : "bg-destructive/10"
          )}>
            <div className="flex items-center gap-2">
              {totalProfit >= 0 ? (
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-destructive" />
              )}
              <span className={cn("font-medium", totalProfit >= 0 ? "text-emerald-500" : "text-destructive")}>
                {totalProfit >= 0 ? "Lucro Esperado" : "Prejuízo"}
              </span>
            </div>
            <div className="text-right">
              <span className={cn("font-display font-bold text-xl", totalProfit >= 0 ? "text-emerald-500" : "text-destructive")}>
                {formatCurrency(totalProfit)}
              </span>
              {profitMargin !== 0 && (
                <p className={cn("text-xs", totalProfit >= 0 ? "text-emerald-500/70" : "text-destructive/70")}>
                  {profitMargin.toFixed(1)}% sobre o capital
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Schedule Preview Toggle */}
        {schedule.length > 0 && (
          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowSchedule(!showSchedule)}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-secondary/30 border border-border/50 hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">Cronograma de Parcelas</span>
              </div>
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", showSchedule && "rotate-180")} />
            </button>
            <AnimatePresence>
              {showSchedule && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 p-3 rounded-xl bg-secondary/20 border border-border/30 max-h-60 overflow-y-auto">
                    <div className="space-y-1">
                      {schedule.slice(0, maxPreview).map((item) => (
                        <div
                          key={item.number}
                          className={cn(
                            "flex justify-between items-center text-xs py-1.5 px-2 rounded-lg",
                            item.isPaid ? "bg-emerald-500/10 text-emerald-600" : "hover:bg-secondary/50"
                          )}
                        >
                          <span className={cn("text-muted-foreground", item.isPaid && "text-emerald-600")}>
                            {item.isPaid ? "✓ " : ""}{item.number}ª — {item.date}
                          </span>
                          <span className={cn("font-semibold", item.isPaid ? "text-emerald-600 line-through" : "text-foreground")}>
                            {formatCurrency(item.amount)}
                          </span>
                        </div>
                      ))}
                      {schedule.length > maxPreview && (
                        <p className="text-xs text-muted-foreground text-center pt-2">
                          + {schedule.length - maxPreview} parcelas adicionais
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Validation Errors */}
        <AnimatePresence>
          {validationErrors.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-4 p-3 rounded-xl bg-destructive/5 border border-destructive/20"
            >
              <p className="text-xs font-medium text-destructive mb-1">Pendências:</p>
              <ul className="space-y-0.5">
                {validationErrors.slice(0, 3).map((err, i) => (
                  <li key={i} className="text-xs text-destructive/80 flex items-center gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-destructive/60 flex-shrink-0" />
                    {err}
                  </li>
                ))}
                {validationErrors.length > 3 && (
                  <li className="text-xs text-destructive/60">+{validationErrors.length - 3} outros</li>
                )}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Save Button */}
        <motion.button
          whileHover={{ scale: isDisabled ? 1 : 1.02 }}
          whileTap={{ scale: isDisabled ? 1 : 0.98 }}
          disabled={isDisabled}
          onClick={onSave}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-gold py-4 font-display font-semibold text-primary-foreground shadow-gold transition-all hover:shadow-gold-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving || isUploadingAvatar ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
          {isSaving ? "Salvando..." : isUploadingAvatar ? "Enviando foto..." : "Criar Contrato"}
        </motion.button>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Ao criar o contrato, as parcelas serão geradas automaticamente
        </p>
      </div>
    </motion.div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-border/30">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-display font-semibold text-foreground text-sm">{value}</span>
    </div>
  );
}

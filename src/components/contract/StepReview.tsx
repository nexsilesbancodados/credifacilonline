import { motion } from "framer-motion";
import { Sparkles, Check, Loader2 } from "lucide-react";
import { ContractFormData, frequencies, dailyTypes } from "@/hooks/useContractForm";

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
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export function StepReview({
  formData, avatarPreview, effectiveInstallments,
  installmentResult, rateResult, totalAmount, totalProfit,
  isSaving, isUploadingAvatar, onSave,
}: StepReviewProps) {
  const isDisabled = isSaving || isUploadingAvatar || !formData.name || !formData.cpf || !formData.startDate
    || (formData.frequency !== "programada" && !formData.firstDueDate)
    || (formData.frequency === "programada" && formData.scheduledDays.length === 0);

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

        <div className="space-y-4">
          <SummaryRow label="Capital" value={formatCurrency(formData.capital || 0)} />
          <SummaryRow label="Taxa de Juros" value={`${rateResult.toFixed(2)}%`} />
          <SummaryRow label="Frequência" value={
            `${frequencies.find(f => f.value === formData.frequency)?.label || ""}` +
            (formData.frequency === "diario" ? ` (${dailyTypes.find(d => d.value === formData.dailyType)?.label})` : "") +
            (formData.frequency === "programada" && formData.scheduledDays.length > 0 ? ` (dias ${formData.scheduledDays.join(", ")})` : "")
          } />
          <SummaryRow label="Parcelas" value={`${effectiveInstallments}x`} />
          <div className="flex justify-between items-center py-3 border-b border-border/50">
            <span className="text-muted-foreground">Valor da Parcela</span>
            <span className="font-display font-semibold text-primary text-xl">{formatCurrency(installmentResult)}</span>
          </div>
          <SummaryRow label="Valor Total" value={formatCurrency(totalAmount)} />
          <div className="flex justify-between items-center py-3 bg-success/10 rounded-xl px-4 -mx-2">
            <span className="text-success font-medium">Lucro Esperado</span>
            <span className="font-display font-bold text-success text-xl">{formatCurrency(totalProfit)}</span>
          </div>

          {/* Schedule Preview */}
          {formData.frequency === "programada" && formData.scheduledDays.length > 0 && formData.startDate && installmentResult > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-secondary/30 border border-border/50">
              <p className="text-xs font-medium text-foreground mb-2">📅 Cronograma de Parcelas</p>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {(() => {
                  const sortedDays = [...formData.scheduledDays].sort((a, b) => a - b);
                  const [year, month] = formData.startDate.split("-").map(Number);
                  let currentMonth = month - 1;
                  let currentYear = year;
                  const startDay = new Date(year, month - 1, Number(formData.startDate.split("-")[2])).getDate();
                  let dayIndex = sortedDays.findIndex(d => d >= startDay);
                  if (dayIndex === -1) { dayIndex = 0; currentMonth++; if (currentMonth > 11) { currentMonth = 0; currentYear++; } }
                  return sortedDays.map((_, i) => {
                    const day = sortedDays[dayIndex];
                    const maxDay = new Date(currentYear, currentMonth + 1, 0).getDate();
                    const clampedDay = Math.min(day, maxDay);
                    const date = new Date(currentYear, currentMonth, clampedDay);
                    const formatted = date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
                    dayIndex++;
                    if (dayIndex >= sortedDays.length) { dayIndex = 0; currentMonth++; if (currentMonth > 11) { currentMonth = 0; currentYear++; } }
                    return (
                      <div key={i} className="flex justify-between items-center text-xs py-1 px-2 rounded-lg hover:bg-secondary/50">
                        <span className="text-muted-foreground">{i + 1}ª parcela — {formatted}</span>
                        <span className="font-semibold text-foreground">{formatCurrency(installmentResult)}</span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          )}
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={isDisabled}
          onClick={onSave}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-gold py-4 font-display font-semibold text-primary-foreground shadow-gold transition-shadow hover:shadow-gold-lg disabled:opacity-50"
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
    <div className="flex justify-between items-center py-3 border-b border-border/50">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-display font-semibold text-foreground">{value}</span>
    </div>
  );
}

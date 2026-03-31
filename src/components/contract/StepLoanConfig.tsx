import { motion } from "framer-motion";
import { Calculator, DollarSign, Percent, Calendar, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ContractFormData, CalculationMode, frequencies, dailyTypes } from "@/hooks/useContractForm";
import { Client } from "@/hooks/useClients";

interface StepLoanConfigProps {
  formData: ContractFormData;
  setFormData: React.Dispatch<React.SetStateAction<ContractFormData>>;
  mode: CalculationMode;
  setMode: (mode: CalculationMode) => void;
  existingClient: Client | null | undefined;
  installmentResult: number;
}

export function StepLoanConfig({ formData, setFormData, mode, setMode, existingClient, installmentResult }: StepLoanConfigProps) {
  return (
    <>
      {/* Calculator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: existingClient ? 0.1 : 0.3 }}
        className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">
            {existingClient ? 1 : 3}
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
            <Calculator className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">Valores do Empréstimo</h2>
            <p className="text-sm text-muted-foreground">Escolha como calcular o contrato</p>
          </div>
        </div>

        <div className="flex gap-3 mb-6">
          <button onClick={() => setMode("rate")} className={cn("flex-1 rounded-xl border p-4 transition-all", mode === "rate" ? "border-primary bg-primary/10" : "border-border/50 hover:border-border")}>
            <div className="flex items-center gap-3">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", mode === "rate" ? "bg-primary text-primary-foreground" : "bg-secondary")}>
                <Percent className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">Taxa de Juros</p>
                <p className="text-xs text-muted-foreground">Calcular parcela pela taxa</p>
              </div>
            </div>
          </button>
          <button onClick={() => setMode("installment")} className={cn("flex-1 rounded-xl border p-4 transition-all", mode === "installment" ? "border-primary bg-primary/10" : "border-border/50 hover:border-border")}>
            <div className="flex items-center gap-3">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", mode === "installment" ? "bg-primary text-primary-foreground" : "bg-secondary")}>
                <DollarSign className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">Parcela Fixa</p>
                <p className="text-xs text-muted-foreground">Calcular taxa pela parcela</p>
              </div>
            </div>
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-muted-foreground">Capital (R$) *</label>
            <input type="number" value={formData.capital === 0 ? "" : formData.capital} onChange={(e) => setFormData(prev => ({ ...prev, capital: e.target.value === "" ? "" as unknown as number : Number(e.target.value) }))} placeholder="0" className="h-12 w-full rounded-xl border border-border bg-secondary/50 px-4 font-display text-lg font-semibold text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          {mode === "rate" ? (
            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Taxa de Juros (%) *</label>
              <input type="number" value={formData.interestRate === 0 ? "" : formData.interestRate} onChange={(e) => setFormData(prev => ({ ...prev, interestRate: e.target.value === "" ? "" as unknown as number : Number(e.target.value) }))} placeholder="0" className="h-12 w-full rounded-xl border border-border bg-secondary/50 px-4 font-display text-lg font-semibold text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          ) : (
            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Valor da Parcela (R$) *</label>
              <input type="number" value={formData.installmentValue === 0 ? "" : formData.installmentValue} onChange={(e) => setFormData(prev => ({ ...prev, installmentValue: e.target.value === "" ? "" as unknown as number : Number(e.target.value) }))} placeholder="0" className="h-12 w-full rounded-xl border border-border bg-secondary/50 px-4 font-display text-lg font-semibold text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          )}
          {formData.frequency !== "programada" && (
            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Nº de Parcelas *</label>
              <input type="number" value={formData.installments === 0 ? "" : formData.installments} onChange={(e) => setFormData(prev => ({ ...prev, installments: e.target.value === "" ? "" as unknown as number : Number(e.target.value) }))} placeholder="0" className="h-12 w-full rounded-xl border border-border bg-secondary/50 px-4 font-display text-lg font-semibold text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          )}
          {formData.frequency === "programada" && (
            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Nº de Parcelas</label>
              <div className="h-12 w-full rounded-xl border border-border bg-secondary/30 px-4 flex items-center font-display text-lg font-semibold text-muted-foreground">
                {formData.scheduledDays.length || "—"}
                <span className="ml-2 text-xs font-normal">(definido pelos dias selecionados)</span>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Contract Details */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: existingClient ? 0.2 : 0.4 }}
        className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-sm">{existingClient ? 2 : 4}</div>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">Detalhes do Contrato</h2>
            <p className="text-sm text-muted-foreground">Configurações de pagamento</p>
          </div>
        </div>

        {/* Frequency Selection */}
        <div className="mb-4">
          <label className="mb-3 block text-sm font-medium text-muted-foreground">Frequência de Pagamento</label>
          <div className="flex flex-wrap gap-2">
            {frequencies.map((freq) => (
              <button key={freq.value} type="button" onClick={() => setFormData(prev => ({ ...prev, frequency: freq.value }))} className={cn("rounded-xl px-4 py-2 text-sm font-medium transition-all", formData.frequency === freq.value ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-foreground hover:bg-secondary border border-border")}>
                {freq.label}
              </button>
            ))}
          </div>
        </div>

        {/* Daily Sub-options */}
        {formData.frequency === "diario" && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-4">
            <label className="mb-3 block text-sm font-medium text-muted-foreground">Dias de Cobrança</label>
            <div className="grid gap-2 sm:grid-cols-3">
              {dailyTypes.map((type) => (
                <button key={type.value} type="button" onClick={() => setFormData(prev => ({ ...prev, dailyType: type.value }))} className={cn("rounded-xl p-3 text-left transition-all border", formData.dailyType === type.value ? "border-primary bg-primary/10" : "border-border/50 bg-secondary/30 hover:border-border")}>
                  <p className="font-medium text-foreground text-sm">{type.label}</p>
                  <p className="text-xs text-muted-foreground">{type.description}</p>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Scheduled Days */}
        {formData.frequency === "programada" && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-muted-foreground">Dias do mês para pagamento</label>
              {formData.scheduledDays.length > 0 && (
                <button type="button" onClick={() => setFormData(prev => ({ ...prev, scheduledDays: [], installments: 0 as unknown as number }))} className="text-xs text-destructive hover:text-destructive/80 transition-colors font-medium">Limpar todos</button>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-3">Selecione os dias em que o cliente fará os pagamentos.</p>
            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                const isSelected = formData.scheduledDays.includes(day);
                return (
                  <button key={day} type="button" onClick={() => {
                    const newDays = isSelected ? formData.scheduledDays.filter(d => d !== day) : [...formData.scheduledDays, day].sort((a, b) => a - b);
                    setFormData(prev => ({ ...prev, scheduledDays: newDays, installments: newDays.length as unknown as number }));
                  }} className={cn("h-10 w-full rounded-lg text-sm font-medium transition-all", isSelected ? "bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/30" : "bg-secondary/50 text-foreground hover:bg-secondary border border-border/50")}>
                    {day}
                  </button>
                );
              })}
            </div>
            {formData.scheduledDays.length > 0 && (
              <div className="mt-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-foreground">Dias selecionados</span>
                  <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{formData.scheduledDays.length} parcela{formData.scheduledDays.length > 1 ? "s" : ""}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {formData.scheduledDays.map(day => (
                    <span key={day} className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-xs font-semibold">
                      {day}
                      <button type="button" onClick={() => { const newDays = formData.scheduledDays.filter(d => d !== day); setFormData(prev => ({ ...prev, scheduledDays: newDays, installments: newDays.length as unknown as number })); }} className="ml-0.5 hover:text-destructive transition-colors">×</button>
                    </span>
                  ))}
                </div>
                {installmentResult > 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Cada parcela: <span className="font-semibold text-primary">{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(installmentResult)}</span>
                  </p>
                )}
              </div>
            )}
          </motion.div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-muted-foreground">Data de Início *</label>
            <input type="date" value={formData.startDate} onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))} className="h-11 w-full rounded-xl border border-border bg-secondary/50 px-4 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          {formData.frequency !== "programada" ? (
            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Primeiro Vencimento *</label>
              <input type="date" value={formData.firstDueDate} onChange={(e) => setFormData(prev => ({ ...prev, firstDueDate: e.target.value }))} className="h-11 w-full rounded-xl border border-border bg-secondary/50 px-4 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          ) : (
            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Dias de pagamento</label>
              <div className="h-11 w-full rounded-xl border border-border bg-secondary/30 px-4 flex items-center text-sm text-muted-foreground">
                {formData.scheduledDays.length > 0 ? formData.scheduledDays.map(d => `dia ${d}`).join(", ") : "Selecione os dias acima"}
              </div>
            </div>
          )}
          <div>
            <label className="mb-2 block text-sm font-medium text-muted-foreground">Parcelas Já Pagas</label>
            <input type="number" value={formData.paidInstallments === 0 ? "" : formData.paidInstallments} onChange={(e) => setFormData(prev => ({ ...prev, paidInstallments: e.target.value === "" ? "" as unknown as number : Number(e.target.value) }))} min={0} max={formData.installments ? Number(formData.installments) - 1 : undefined} placeholder="0" className="h-11 w-full rounded-xl border border-border bg-secondary/50 px-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
        </div>
      </motion.div>
    </>
  );
}

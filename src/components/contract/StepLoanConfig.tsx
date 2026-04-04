import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, DollarSign, Percent, Calendar, X, Shield, TrendingUp, AlertTriangle, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ContractFormData, CalculationMode, frequencies, dailyTypes } from "@/hooks/useContractForm";
import { Client } from "@/hooks/useClients";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface StepLoanConfigProps {
  formData: ContractFormData;
  setFormData: React.Dispatch<React.SetStateAction<ContractFormData>>;
  mode: CalculationMode;
  setMode: (mode: CalculationMode) => void;
  existingClient: Client | null | undefined;
  installmentResult: number;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export function StepLoanConfig({ formData, setFormData, mode, setMode, existingClient, installmentResult }: StepLoanConfigProps) {
  const capitalNum = Number(formData.capital) || 0;
  const effectiveInstallments = formData.frequency === "programada" ? formData.scheduledDates.length : (Number(formData.installments) || 0);
  const totalAmount = installmentResult * effectiveInstallments;
  const totalProfit = totalAmount - capitalNum;
  const profitMargin = capitalNum > 0 ? (totalProfit / capitalNum) * 100 : 0;

  // Month navigator state for programada
  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth()); // 0-11
  const [viewYear, setViewYear] = useState(now.getFullYear());

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfWeek = (year: number, month: number) => new Date(year, month, 1).getDay(); // 0=Sun

  const toDateStr = (year: number, month: number, day: number) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const toggleDate = (dateStr: string) => {
    setFormData(prev => {
      const exists = prev.scheduledDates.includes(dateStr);
      const newDates = exists
        ? prev.scheduledDates.filter(d => d !== dateStr)
        : [...prev.scheduledDates, dateStr].sort();
      return { ...prev, scheduledDates: newDates };
    });
  };

  const clearAllDates = () => {
    setFormData(prev => ({ ...prev, scheduledDates: [], installments: 0 as unknown as number }));
  };

  // Group dates by month for display
  const datesByMonth = formData.scheduledDates.reduce<Record<string, string[]>>((acc, d) => {
    const key = d.substring(0, 7); // "YYYY-MM"
    if (!acc[key]) acc[key] = [];
    acc[key].push(d);
    return acc;
  }, {});

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const daysInView = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfWeek(viewYear, viewMonth);
  const datesInViewMonth = formData.scheduledDates.filter(d => d.startsWith(toDateStr(viewYear, viewMonth, 1).substring(0, 7)));

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

        {/* Mode Toggle */}
        <div className="flex gap-3 mb-6">
          <button onClick={() => setMode("rate")} className={cn("flex-1 rounded-xl border p-4 transition-all", mode === "rate" ? "border-primary bg-primary/10 shadow-sm shadow-primary/10" : "border-border/50 hover:border-border")}>
            <div className="flex items-center gap-3">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg transition-colors", mode === "rate" ? "bg-primary text-primary-foreground" : "bg-secondary")}>
                <Percent className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">Taxa de Juros</p>
                <p className="text-xs text-muted-foreground">Calcular parcela pela taxa</p>
              </div>
            </div>
          </button>
          <button onClick={() => setMode("installment")} className={cn("flex-1 rounded-xl border p-4 transition-all", mode === "installment" ? "border-primary bg-primary/10 shadow-sm shadow-primary/10" : "border-border/50 hover:border-border")}>
            <div className="flex items-center gap-3">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg transition-colors", mode === "installment" ? "bg-primary text-primary-foreground" : "bg-secondary")}>
                <DollarSign className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground">Parcela Fixa</p>
                <p className="text-xs text-muted-foreground">Calcular taxa pela parcela</p>
              </div>
            </div>
          </button>
        </div>

        {/* Main Fields */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium text-muted-foreground">Capital (R$) *</label>
            <input
              type="number"
              inputMode="decimal"
              value={formData.capital === 0 ? "" : formData.capital}
              onChange={(e) => setFormData(prev => ({ ...prev, capital: e.target.value === "" ? "" as unknown as number : Number(e.target.value) }))}
              placeholder="Ex: 1000"
              min={0}
              className="h-12 w-full rounded-xl border border-border bg-secondary/50 px-4 font-display text-lg font-semibold text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          {mode === "rate" ? (
            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Taxa de Juros (%) *</label>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                value={formData.interestRate === 0 ? "" : formData.interestRate}
                onChange={(e) => setFormData(prev => ({ ...prev, interestRate: e.target.value === "" ? "" as unknown as number : Number(e.target.value) }))}
                placeholder="Ex: 20"
                min={0}
                className="h-12 w-full rounded-xl border border-border bg-secondary/50 px-4 font-display text-lg font-semibold text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          ) : (
            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Valor da Parcela (R$) *</label>
              <input
                type="number"
                inputMode="decimal"
                value={formData.installmentValue === 0 ? "" : formData.installmentValue}
                onChange={(e) => setFormData(prev => ({ ...prev, installmentValue: e.target.value === "" ? "" as unknown as number : Number(e.target.value) }))}
                placeholder="Ex: 150"
                min={0}
                className="h-12 w-full rounded-xl border border-border bg-secondary/50 px-4 font-display text-lg font-semibold text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          )}
          {formData.frequency !== "programada" ? (
            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Nº de Parcelas *</label>
              <input
                type="number"
                inputMode="numeric"
                value={formData.installments === 0 ? "" : formData.installments}
                onChange={(e) => setFormData(prev => ({ ...prev, installments: e.target.value === "" ? "" as unknown as number : Number(e.target.value) }))}
                placeholder="Ex: 10"
                min={1}
                max={360}
                className="h-12 w-full rounded-xl border border-border bg-secondary/50 px-4 font-display text-lg font-semibold text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          ) : (
            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Total de Parcelas</label>
              <div className="h-12 w-full rounded-xl border border-border bg-secondary/30 px-4 flex items-center font-display text-lg font-semibold text-muted-foreground">
                {(formData.scheduledDays.length * (Number(formData.scheduledMonths) || 1)) || "—"}
                <span className="ml-2 text-xs font-normal">
                  ({formData.scheduledDays.length || 0}/mês × {formData.scheduledMonths || 1}m)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Live Calculation Preview */}
        <AnimatePresence>
          {capitalNum > 0 && installmentResult > 0 && effectiveInstallments > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 overflow-hidden"
            >
              <div className={cn(
                "rounded-xl p-4 border",
                totalProfit >= 0
                  ? "bg-emerald-500/5 border-emerald-500/20"
                  : "bg-destructive/5 border-destructive/20"
              )}>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Parcela</p>
                    <p className="font-display font-bold text-primary">{formatCurrency(installmentResult)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Total a Receber</p>
                    <p className="font-display font-bold text-foreground">{formatCurrency(totalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Lucro</p>
                    <p className={cn("font-display font-bold", totalProfit >= 0 ? "text-emerald-500" : "text-destructive")}>
                      {formatCurrency(totalProfit)}
                      {profitMargin !== 0 && (
                        <span className="text-xs font-normal ml-1">({profitMargin.toFixed(1)}%)</span>
                      )}
                    </p>
                  </div>
                </div>
                {totalProfit < 0 && (
                  <div className="flex items-center gap-2 mt-3 text-xs text-destructive">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>Atenção: este contrato gera prejuízo!</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
            <p className="text-sm text-muted-foreground">Configurações de pagamento e penalidades</p>
          </div>
        </div>

        {/* Frequency Selection */}
        <div className="mb-5">
          <label className="mb-3 block text-sm font-medium text-muted-foreground">Frequência de Pagamento</label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {frequencies.map((freq) => (
              <button
                key={freq.value}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, frequency: freq.value }))}
                className={cn(
                  "rounded-xl p-3 text-center transition-all border",
                  formData.frequency === freq.value
                    ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20"
                    : "bg-secondary/50 text-foreground hover:bg-secondary border-border/50 hover:border-border"
                )}
              >
                <span className="text-lg block mb-0.5">{freq.icon}</span>
                <span className="text-xs font-medium block">{freq.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Daily Sub-options */}
        <AnimatePresence>
          {formData.frequency === "diario" && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-5 overflow-hidden">
              <label className="mb-3 block text-sm font-medium text-muted-foreground">Dias de Cobrança</label>
              <div className="grid gap-2 sm:grid-cols-3">
                {dailyTypes.map((type) => (
                  <button key={type.value} type="button" onClick={() => setFormData(prev => ({ ...prev, dailyType: type.value }))} className={cn("rounded-xl p-3 text-left transition-all border", formData.dailyType === type.value ? "border-primary bg-primary/10 shadow-sm shadow-primary/10" : "border-border/50 bg-secondary/30 hover:border-border")}>
                    <p className="font-medium text-foreground text-sm">{type.label}</p>
                    <p className="text-xs text-muted-foreground">{type.description}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scheduled Dates - Per Month Calendar */}
        <AnimatePresence>
          {formData.frequency === "programada" && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mb-5 overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-muted-foreground">Datas de pagamento</label>
                {formData.scheduledDates.length > 0 && (
                  <button type="button" onClick={clearAllDates} className="text-xs text-destructive hover:text-destructive/80 transition-colors font-medium">Limpar todas</button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-3">Navegue entre os meses e selecione os dias exatos de cada parcela.</p>

              {/* Month Navigator */}
              <div className="flex items-center justify-between mb-3 p-2 rounded-xl bg-secondary/30 border border-border/50">
                <button type="button" onClick={prevMonth} className="h-8 w-8 rounded-lg bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors">
                  <ChevronLeft className="h-4 w-4 text-foreground" />
                </button>
                <div className="text-center">
                  <span className="font-display font-semibold text-foreground">{monthNames[viewMonth]} {viewYear}</span>
                  {datesInViewMonth.length > 0 && (
                    <span className="ml-2 text-xs text-primary font-medium">({datesInViewMonth.length} selecionado{datesInViewMonth.length > 1 ? "s" : ""})</span>
                  )}
                </div>
                <button type="button" onClick={nextMonth} className="h-8 w-8 rounded-lg bg-secondary hover:bg-secondary/80 flex items-center justify-center transition-colors">
                  <ChevronRight className="h-4 w-4 text-foreground" />
                </button>
              </div>

              {/* Day-of-week headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(d => (
                  <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells for offset */}
                {Array.from({ length: firstDay }, (_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {Array.from({ length: daysInView }, (_, i) => {
                  const day = i + 1;
                  const dateStr = toDateStr(viewYear, viewMonth, day);
                  const isSelected = formData.scheduledDates.includes(dateStr);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDate(dateStr)}
                      className={cn(
                        "h-9 w-full rounded-lg text-sm font-medium transition-all",
                        isSelected
                          ? "bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/30"
                          : "bg-secondary/50 text-foreground hover:bg-secondary border border-border/50"
                      )}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              {/* Selected dates summary */}
              {formData.scheduledDates.length > 0 && (
                <div className="mt-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-foreground">Datas selecionadas</span>
                    <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {formData.scheduledDates.length} parcela{formData.scheduledDates.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {Object.entries(datesByMonth).sort(([a], [b]) => a.localeCompare(b)).map(([monthKey, dates]) => {
                      const [y, m] = monthKey.split("-").map(Number);
                      return (
                        <div key={monthKey} className="flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground w-24 shrink-0">
                            {monthNames[m - 1]} {y}
                          </span>
                          <div className="flex items-center gap-1 flex-wrap">
                            {dates.map(d => {
                              const dayNum = Number(d.split("-")[2]);
                              return (
                                <span key={d} className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-semibold">
                                  {dayNum}
                                  <button type="button" onClick={() => toggleDate(d)} className="ml-0.5 hover:text-destructive transition-colors">
                                    <X className="h-3 w-3" />
                                  </button>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {installmentResult > 0 && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Cada parcela: <span className="font-semibold text-primary">{formatCurrency(installmentResult)}</span>
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dates */}
        <div className="grid gap-4 sm:grid-cols-2 mb-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-muted-foreground">Data de Início *</label>
            <input type="date" value={formData.startDate} onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))} className="h-11 w-full rounded-xl border border-border bg-secondary/50 px-4 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          {formData.frequency !== "programada" ? (
            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Primeiro Vencimento (automático)</label>
              <input type="date" value={formData.firstDueDate} readOnly className="h-11 w-full rounded-xl border border-border bg-muted/50 px-4 text-foreground cursor-not-allowed opacity-70" />
            </div>
          ) : (
            <div>
              <label className="mb-2 block text-sm font-medium text-muted-foreground">Dias de pagamento</label>
              <div className="h-11 w-full rounded-xl border border-border bg-secondary/30 px-4 flex items-center text-sm text-muted-foreground">
                {formData.scheduledDays.length > 0 ? formData.scheduledDays.map(d => `dia ${d}`).join(", ") : "Selecione os dias acima"}
              </div>
            </div>
          )}
        </div>

        {/* Fine & Interest Settings */}
        <div className="rounded-xl border border-border/50 bg-secondary/20 p-4 mb-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Multa e Juros por Atraso</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs max-w-[200px]">Multa é aplicada uma vez no atraso. Juros diários são cobrados a cada dia de atraso adicional.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-medium text-muted-foreground">Multa por Atraso (%)</label>
              <input
                type="number"
                inputMode="decimal"
                step="0.1"
                value={formData.finePercentage}
                onChange={(e) => setFormData(prev => ({ ...prev, finePercentage: e.target.value === "" ? 0 : Number(e.target.value) }))}
                placeholder="10"
                min={0}
                max={100}
                className="h-10 w-full rounded-xl border border-border bg-secondary/50 px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-medium text-muted-foreground">Juros Diários (%)</label>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                value={formData.dailyInterestRate}
                onChange={(e) => setFormData(prev => ({ ...prev, dailyInterestRate: e.target.value === "" ? 0 : Number(e.target.value) }))}
                placeholder="2"
                min={0}
                max={100}
                className="h-10 w-full rounded-xl border border-border bg-secondary/50 px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
        </div>

        {/* Paid Installments */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="block text-sm font-medium text-muted-foreground">Parcelas Já Pagas</label>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs max-w-[200px]">Para contratos já em andamento, informe quantas parcelas já foram pagas.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <input
            type="number"
            inputMode="numeric"
            value={formData.paidInstallments === 0 ? "" : formData.paidInstallments}
            onChange={(e) => setFormData(prev => ({ ...prev, paidInstallments: e.target.value === "" ? "" as unknown as number : Number(e.target.value) }))}
            min={0}
            max={effectiveInstallments > 0 ? effectiveInstallments - 1 : undefined}
            placeholder="0"
            className="h-11 w-full sm:w-1/2 rounded-xl border border-border bg-secondary/50 px-4 text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </motion.div>
    </>
  );
}

import { MainLayout } from "@/components/layout/MainLayout";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  Calculator,
  DollarSign,
  Percent,
  Hash,
  TrendingUp,
  Clock,
  Calendar,
  Sparkles,
  ArrowRight,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

type CalculationMode = "rate" | "installment";

interface SimulationResult {
  frequency: string;
  frequencyLabel: string;
  installmentValue: number;
  totalAmount: number;
  totalProfit: number;
  totalInstallments: number;
  periodDescription: string;
  interestRate: number;
}

const Simulador = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<CalculationMode>("rate");
  const [formData, setFormData] = useState({
    capital: 1000,
    interestRate: 10,
    installments: 10,
    installmentValue: 110,
  });

  // Juros simples: Total = Capital × (1 + Taxa)
  const calculateSimulation = (): SimulationResult[] => {
    const { capital, interestRate, installments, installmentValue } = formData;
    
    let finalInstallmentValue: number;
    let finalTotalAmount: number;
    let finalTotalProfit: number;
    let finalInterestRate: number;

    if (mode === "rate") {
      // Calculate by rate
      const rate = interestRate / 100;
      finalTotalAmount = capital * (1 + rate);
      finalInstallmentValue = finalTotalAmount / installments;
      finalTotalProfit = finalTotalAmount - capital;
      finalInterestRate = interestRate;
    } else {
      // Calculate by installment value
      finalInstallmentValue = installmentValue;
      finalTotalAmount = installmentValue * installments;
      finalTotalProfit = finalTotalAmount - capital;
      finalInterestRate = capital > 0 ? (finalTotalProfit / capital) * 100 : 0;
    }

    const frequencies = [
      {
        value: "diario",
        label: "Diário",
        periodDescription: `${installments} dias`,
      },
      {
        value: "semanal",
        label: "Semanal",
        periodDescription: `${installments} semanas (~${Math.ceil(installments / 4)} meses)`,
      },
      {
        value: "quinzenal",
        label: "Quinzenal",
        periodDescription: `${installments} quinzenas (~${Math.ceil(installments / 2)} meses)`,
      },
      {
        value: "mensal",
        label: "Mensal",
        periodDescription: `${installments} meses`,
      },
    ];

    return frequencies.map((freq) => ({
      frequency: freq.value,
      frequencyLabel: freq.label,
      installmentValue: finalInstallmentValue,
      totalAmount: finalTotalAmount,
      totalProfit: finalTotalProfit,
      totalInstallments: installments,
      periodDescription: freq.periodDescription,
      interestRate: finalInterestRate,
    }));
  };

  const simulations = calculateSimulation();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleInputChange = (field: string, value: number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <MainLayout>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
            <Calculator className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Simulador de Empréstimo
            </h1>
            <p className="text-muted-foreground">
              Compare todas as modalidades de pagamento
            </p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calculator Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-1"
        >
          <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold text-foreground">
                  Parâmetros
                </h2>
              </div>
            </div>

            {/* Mode Toggle */}
            <div className="mb-6">
              <div className="flex rounded-xl bg-muted/50 p-1">
                <button
                  onClick={() => setMode("rate")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                    mode === "rate"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Percent className="h-4 w-4" />
                  Por Taxa
                </button>
                <button
                  onClick={() => setMode("installment")}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                    mode === "installment"
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <DollarSign className="h-4 w-4" />
                  Por Parcela
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {/* Capital */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <DollarSign className="h-4 w-4 text-success" />
                  Capital (R$)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.capital}
                    onChange={(e) =>
                      handleInputChange("capital", Number(e.target.value))
                    }
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-lg font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    min={0}
                  />
                </div>
                <input
                  type="range"
                  min={100}
                  max={100000}
                  step={100}
                  value={formData.capital}
                  onChange={(e) =>
                    handleInputChange("capital", Number(e.target.value))
                  }
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>R$ 100</span>
                  <span>R$ 100.000</span>
                </div>
              </div>

              {/* Interest Rate - shown only in rate mode */}
              {mode === "rate" && (
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Percent className="h-4 w-4 text-warning" />
                    Taxa de Juros (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.interestRate}
                      onChange={(e) =>
                        handleInputChange("interestRate", Number(e.target.value))
                      }
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-lg font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      min={0}
                      max={100}
                      step={0.5}
                    />
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={50}
                    step={0.5}
                    value={formData.interestRate}
                    onChange={(e) =>
                      handleInputChange("interestRate", Number(e.target.value))
                    }
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>1%</span>
                    <span>50%</span>
                  </div>
                </div>
              )}

              {/* Installment Value - shown only in installment mode */}
              {mode === "installment" && (
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <DollarSign className="h-4 w-4 text-warning" />
                    Valor da Parcela (R$)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.installmentValue}
                      onChange={(e) =>
                        handleInputChange("installmentValue", Number(e.target.value))
                      }
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-lg font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      min={1}
                      step={1}
                    />
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={10000}
                    step={10}
                    value={formData.installmentValue}
                    onChange={(e) =>
                      handleInputChange("installmentValue", Number(e.target.value))
                    }
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>R$ 10</span>
                    <span>R$ 10.000</span>
                  </div>
                </div>
              )}

              {/* Installments */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Hash className="h-4 w-4 text-info" />
                  Número de Parcelas
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={formData.installments}
                    onChange={(e) =>
                      handleInputChange("installments", Number(e.target.value))
                    }
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-lg font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    min={1}
                    max={360}
                  />
                </div>
                <input
                  type="range"
                  min={1}
                  max={60}
                  step={1}
                  value={formData.installments}
                  onChange={(e) =>
                    handleInputChange("installments", Number(e.target.value))
                  }
                  className="w-full accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>1</span>
                  <span>60</span>
                </div>
              </div>

              {/* Summary Box */}
              <div className="rounded-xl bg-primary/10 p-4 border border-primary/20">
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Total a Receber
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(simulations[0]?.totalAmount || 0)}
                  </p>
                  <div className="flex justify-between text-xs pt-2 border-t border-primary/20">
                    <span className="text-muted-foreground">Lucro:</span>
                    <span className="text-success font-medium">
                      {formatCurrency(simulations[0]?.totalProfit || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Taxa:</span>
                    <span className="text-warning font-medium">
                      {(simulations[0]?.interestRate || 0).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Parcela:</span>
                    <span className="text-foreground font-medium">
                      {formatCurrency(simulations[0]?.installmentValue || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Results Section */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="lg:col-span-2"
        >
          <div className="rounded-2xl border border-border/50 bg-card p-6 shadow-lg">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">
                Comparativo de Modalidades
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {simulations.map((sim, index) => (
                <motion.div
                  key={sim.frequency}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 * index }}
                  className={cn(
                    "rounded-xl border p-5 transition-all hover:shadow-lg cursor-pointer group",
                    sim.frequency === "mensal"
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-border/50 bg-background hover:border-primary/50"
                  )}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-lg",
                          sim.frequency === "diario" && "bg-warning/20 text-warning",
                          sim.frequency === "semanal" && "bg-info/20 text-info",
                          sim.frequency === "quinzenal" && "bg-success/20 text-success",
                          sim.frequency === "mensal" && "bg-primary/20 text-primary"
                        )}
                      >
                        {sim.frequency === "diario" && <Clock className="h-5 w-5" />}
                        {sim.frequency === "semanal" && <Calendar className="h-5 w-5" />}
                        {sim.frequency === "quinzenal" && <Calendar className="h-5 w-5" />}
                        {sim.frequency === "mensal" && <Calendar className="h-5 w-5" />}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {sim.frequencyLabel}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {sim.periodDescription}
                        </p>
                      </div>
                    </div>
                    {sim.frequency === "mensal" && (
                      <span className="px-2 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                        Popular
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Valor da Parcela
                      </span>
                      <span className="text-lg font-bold text-foreground">
                        {formatCurrency(sim.installmentValue)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Nº de Parcelas
                      </span>
                      <span className="font-semibold text-foreground">
                        {sim.totalInstallments}x
                      </span>
                    </div>
                    <div className="h-px bg-border/50" />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Total a Receber
                      </span>
                      <span className="font-semibold text-primary">
                        {formatCurrency(sim.totalAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Lucro
                      </span>
                      <span className="font-semibold text-success">
                        {formatCurrency(sim.totalProfit)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">
                        Taxa
                      </span>
                      <span className="font-semibold text-warning">
                        {sim.interestRate.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <Button
                    className="w-full mt-4 group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                    variant="outline"
                    onClick={() => navigate("/contratos/novo")}
                  >
                    Criar Contrato
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </motion.div>
              ))}
            </div>

            {/* Info Box */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mt-6 rounded-xl bg-muted/50 p-4 border border-border/30"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-info/20 text-info shrink-0">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-1">
                    Como funciona o cálculo?
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Utilizamos <strong>juros simples</strong>: Total = Capital × (1 + Taxa).
                    Por exemplo, R$ 1.000 a 10% resulta em R$ 1.100 total. 
                    Em 10 parcelas, cada parcela será de R$ 110.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </MainLayout>
  );
};

export default Simulador;

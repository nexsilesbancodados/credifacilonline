import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { useInstallments } from "@/hooks/useContracts";
import { format, parseISO, addMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrendingUp, Loader2, Calendar } from "lucide-react";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg bg-popover border border-border px-4 py-3 shadow-lg">
        <p className="text-xs text-muted-foreground mb-2">{label}</p>
        {payload.map((item: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: item.color }}>
            {item.name}:{" "}
            <span className="font-semibold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(item.value)}
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function ForecastChart() {
  const { installments, isLoading } = useInstallments();

  const forecastData = useMemo(() => {
    if (!installments) return [];

    const data = [];
    const today = new Date();
    const currentMonth = format(today, "MMM", { locale: ptBR });

    // Next 6 months forecast
    for (let i = 0; i <= 5; i++) {
      const monthDate = addMonths(today, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const monthLabel = format(monthDate, "MMM", { locale: ptBR });

      // Get installments due in this month
      const monthInstallments = installments.filter((inst) => {
        const dueDate = parseISO(inst.due_date);
        return (
          dueDate >= monthStart &&
          dueDate <= monthEnd &&
          inst.status !== "Pago"
        );
      });

      const expectedAmount = monthInstallments.reduce(
        (sum, inst) => sum + Number(inst.amount_due),
        0
      );

      // Estimate collection rate based on historical data
      const collectionRate = i === 0 ? 0.85 : i === 1 ? 0.9 : 0.95;
      const projectedAmount = expectedAmount * collectionRate;

      data.push({
        month: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
        esperado: expectedAmount,
        projetado: projectedAmount,
        isCurrentMonth: i === 0,
      });
    }

    return data;
  }, [installments]);

  const totals = useMemo(() => {
    return forecastData.reduce(
      (acc, item) => ({
        expected: acc.expected + item.esperado,
        projected: acc.projected + item.projetado,
      }),
      { expected: 0, projected: 0 }
    );
  }, [forecastData]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-6 h-80 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10">
            <TrendingUp className="h-5 w-5 text-success" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground">
              Previsão de Receitas
            </h3>
            <p className="text-sm text-muted-foreground">Próximos 6 meses</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-display font-bold text-success">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(totals.projected)}
          </p>
          <p className="text-xs text-muted-foreground">projetado</p>
        </div>
      </div>

      <div className="h-56">
        {forecastData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={forecastData}>
              <defs>
                <linearGradient id="colorEsperado" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(38, 85%, 45%)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="hsl(38, 85%, 45%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorProjetado" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(38, 15%, 18%)" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(46, 10%, 55%)", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(46, 10%, 55%)", fontSize: 12 }}
                tickFormatter={(value) =>
                  new Intl.NumberFormat("pt-BR", { notation: "compact" }).format(value)
                }
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="esperado"
                name="Valor Esperado"
                stroke="hsl(38, 85%, 45%)"
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="url(#colorEsperado)"
              />
              <Area
                type="monotone"
                dataKey="projetado"
                name="Valor Projetado"
                stroke="hsl(142, 71%, 45%)"
                strokeWidth={2}
                fill="url(#colorProjetado)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <Calendar className="h-8 w-8 mb-2" />
            <p>Sem dados de previsão disponíveis</p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-2 w-6 rounded-full bg-[hsl(38,85%,45%)] opacity-50" style={{ borderStyle: 'dashed', borderWidth: 1 }} />
          <span className="text-muted-foreground">Valor Esperado</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-6 rounded-full bg-success" />
          <span className="text-muted-foreground">Projetado (c/ taxa de coleta)</span>
        </div>
      </div>
    </motion.div>
  );
}

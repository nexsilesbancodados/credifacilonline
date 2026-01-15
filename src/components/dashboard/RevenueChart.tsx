import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from "recharts";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useTreasury } from "@/hooks/useTreasury";
import { format, parseISO, startOfMonth, subMonths, startOfWeek, subWeeks, subDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Loader2 } from "lucide-react";

const periods = [
  { label: "Diário", value: "daily" },
  { label: "Semanal", value: "weekly" },
  { label: "Mensal", value: "monthly" },
];

interface ChartDataPoint {
  name: string;
  value: number;
}

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg bg-popover border border-border px-4 py-3 shadow-lg">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-lg font-display font-bold text-primary">
          {new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(payload[0].value || 0)}
        </p>
      </div>
    );
  }
  return null;
}

export function RevenueChart() {
  const [activePeriod, setActivePeriod] = useState("monthly");
  const { transactions, isLoading } = useTreasury();

  const chartData = useMemo(() => {
    // Filter only income transactions
    const incomeTransactions = transactions.filter((t) => t.type === "entrada");

    if (activePeriod === "monthly") {
      // Last 12 months
      const months: ChartDataPoint[] = [];
      for (let i = 11; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(new Date(), i));
        const monthName = format(monthStart, "MMM", { locale: ptBR });
        const monthYear = format(monthStart, "yyyy-MM");
        
        const total = incomeTransactions
          .filter((t) => t.date.startsWith(monthYear))
          .reduce((acc, t) => acc + Number(t.amount), 0);
        
        months.push({ name: monthName.charAt(0).toUpperCase() + monthName.slice(1), value: total });
      }
      return months;
    } else if (activePeriod === "weekly") {
      // Last 8 weeks
      const weeks: ChartDataPoint[] = [];
      for (let i = 7; i >= 0; i--) {
        const weekStart = startOfWeek(subWeeks(new Date(), i), { weekStartsOn: 0 });
        const weekEnd = subDays(startOfWeek(subWeeks(new Date(), i - 1), { weekStartsOn: 0 }), 1);
        const weekLabel = `${format(weekStart, "dd/MM")}`;
        
        const total = incomeTransactions
          .filter((t) => {
            const date = parseISO(t.date);
            return date >= weekStart && date <= weekEnd;
          })
          .reduce((acc, t) => acc + Number(t.amount), 0);
        
        weeks.push({ name: weekLabel, value: total });
      }
      return weeks;
    } else {
      // Last 14 days
      const days: ChartDataPoint[] = [];
      for (let i = 13; i >= 0; i--) {
        const day = startOfDay(subDays(new Date(), i));
        const dayLabel = format(day, "dd/MM");
        const dayISO = format(day, "yyyy-MM-dd");
        
        const total = incomeTransactions
          .filter((t) => t.date === dayISO)
          .reduce((acc, t) => acc + Number(t.amount), 0);
        
        days.push({ name: dayLabel, value: total });
      }
      return days;
    }
  }, [transactions, activePeriod]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-lg font-semibold text-foreground">
            Evolução de Recebimentos
          </h3>
          <p className="text-sm text-muted-foreground">
            Acompanhe seus recebimentos ao longo do tempo
          </p>
        </div>

        <div className="flex gap-1 rounded-lg bg-secondary/50 p-1">
          {periods.map((period) => (
            <button
              key={period.value}
              onClick={() => setActivePeriod(period.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                activePeriod === period.value
                  ? "bg-primary text-primary-foreground shadow-gold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 h-72">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(45, 90%, 50%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(45, 90%, 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(38, 15%, 18%)"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(46, 10%, 55%)", fontSize: 12 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(46, 10%, 55%)", fontSize: 12 }}
                tickFormatter={(value) =>
                  new Intl.NumberFormat("pt-BR", {
                    notation: "compact",
                    compactDisplay: "short",
                  }).format(value)
                }
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="hsl(45, 90%, 50%)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorValue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}

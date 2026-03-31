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
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { useInstallments } from "@/hooks/useContracts";
import { format, parseISO, addDays, startOfDay, endOfDay, isBefore, isAfter, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarDays, TrendingUp, AlertTriangle, Loader2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg bg-popover border border-border px-4 py-3 shadow-lg">
        <p className="text-xs text-muted-foreground mb-2">{label}</p>
        {payload.map((item, index: number) => (
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

export function ReceivableForecastWidget() {
  const { installments, isLoading } = useInstallments();

  // Data for next 30 days - daily breakdown
  const next30DaysData = useMemo(() => {
    if (!installments) return [];

    const data = [];
    const today = startOfDay(new Date());

    for (let i = 0; i < 30; i++) {
      const currentDate = addDays(today, i);
      const dayStart = startOfDay(currentDate);
      const dayEnd = endOfDay(currentDate);

      // Get installments due on this day
      const dayInstallments = installments.filter((inst) => {
        const dueDate = parseISO(inst.due_date);
        return (
          dueDate >= dayStart &&
          dueDate <= dayEnd &&
          inst.status !== "Pago"
        );
      });

      const amount = dayInstallments.reduce(
        (sum, inst) => sum + Number(inst.amount_due),
        0
      );

      const overdueAmount = dayInstallments
        .filter((inst) => inst.status === "Atrasado")
        .reduce((sum, inst) => sum + Number(inst.amount_due), 0);

      data.push({
        date: format(currentDate, "dd/MM", { locale: ptBR }),
        fullDate: format(currentDate, "dd 'de' MMMM", { locale: ptBR }),
        valor: amount,
        atrasado: overdueAmount,
        isToday: i === 0,
      });
    }

    return data;
  }, [installments]);

  // Monthly comparison data
  const monthlyComparison = useMemo(() => {
    if (!installments) return [];

    const data = [];
    const today = new Date();

    for (let i = 2; i >= 0; i--) {
      const monthDate = subMonths(today, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const monthLabel = format(monthDate, "MMM/yy", { locale: ptBR });

      // Get installments for this month
      const monthInstallments = installments.filter((inst) => {
        const dueDate = parseISO(inst.due_date);
        return dueDate >= monthStart && dueDate <= monthEnd;
      });

      const totalExpected = monthInstallments.reduce(
        (sum, inst) => sum + Number(inst.amount_due),
        0
      );

      const totalReceived = monthInstallments
        .filter((inst) => inst.status === "Pago")
        .reduce((sum, inst) => sum + Number(inst.amount_paid || 0), 0);

      data.push({
        month: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
        esperado: totalExpected,
        recebido: totalReceived,
        taxa: totalExpected > 0 ? (totalReceived / totalExpected) * 100 : 0,
      });
    }

    // Add current month projection
    const currentMonthStart = startOfMonth(today);
    const currentMonthEnd = endOfMonth(today);
    const futureInstallments = installments.filter((inst) => {
      const dueDate = parseISO(inst.due_date);
      return (
        dueDate > today &&
        dueDate <= currentMonthEnd &&
        inst.status !== "Pago"
      );
    });

    const remainingInMonth = futureInstallments.reduce(
      (sum, inst) => sum + Number(inst.amount_due),
      0
    );

    if (data.length > 0) {
      data[data.length - 1].restante = remainingInMonth;
    }

    return data;
  }, [installments]);

  // Summary metrics
  const metrics = useMemo(() => {
    if (!installments) return { next30Days: 0, overdue: 0, overdueCount: 0 };

    const today = startOfDay(new Date());
    const in30Days = addDays(today, 30);

    // Next 30 days receivables
    const next30DaysInstallments = installments.filter((inst) => {
      const dueDate = parseISO(inst.due_date);
      return (
        dueDate >= today &&
        dueDate <= in30Days &&
        inst.status !== "Pago"
      );
    });

    const next30Days = next30DaysInstallments.reduce(
      (sum, inst) => sum + Number(inst.amount_due),
      0
    );

    // Overdue installments
    const overdueInstallments = installments.filter(
      (inst) => inst.status === "Atrasado"
    );

    const overdue = overdueInstallments.reduce(
      (sum, inst) => sum + Number(inst.amount_due),
      0
    );

    return {
      next30Days,
      overdue,
      overdueCount: overdueInstallments.length,
    };
  }, [installments]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-6 h-96 flex items-center justify-center">
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10">
            <CalendarDays className="h-5 w-5 text-success" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground">
              Previsão de Recebimentos
            </h3>
            <p className="text-sm text-muted-foreground">Próximos 30 dias</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-display font-bold text-success">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(metrics.next30Days)}
          </p>
          <p className="text-xs text-muted-foreground">a receber</p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-success/10 border border-success/20">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-success" />
            <span className="text-xs text-muted-foreground">30 dias</span>
          </div>
          <p className="text-lg font-display font-bold text-success">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
              notation: "compact",
            }).format(metrics.next30Days)}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="text-xs text-muted-foreground">Em atraso</span>
          </div>
          <p className="text-lg font-display font-bold text-destructive">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
              notation: "compact",
            }).format(metrics.overdue)}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-muted/30 border border-border/30">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Parcelas atrasadas</span>
          </div>
          <p className="text-lg font-display font-bold text-foreground">
            {metrics.overdueCount}
          </p>
        </div>
      </div>

      {/* Daily Chart */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-muted-foreground mb-3">
          Recebimentos Diários (30 dias)
        </h4>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={next30DaysData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(38, 15%, 18%)" />
              <XAxis
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(46, 10%, 55%)", fontSize: 10 }}
                interval={4}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(46, 10%, 55%)", fontSize: 10 }}
                tickFormatter={(value) =>
                  new Intl.NumberFormat("pt-BR", { notation: "compact" }).format(value)
                }
                width={50}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="rounded-lg bg-popover border border-border px-4 py-3 shadow-lg">
                        <p className="text-xs text-muted-foreground mb-1">{data.fullDate}</p>
                        <p className="text-sm font-semibold text-foreground">
                          {new Intl.NumberFormat("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }).format(data.valor)}
                        </p>
                        {data.atrasado > 0 && (
                          <p className="text-xs text-destructive mt-1">
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(data.atrasado)}{" "}
                            em atraso
                          </p>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="valor" name="Valor" radius={[2, 2, 0, 0]}>
                {next30DaysData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.isToday
                        ? "hsl(45, 90%, 50%)"
                        : entry.atrasado > 0
                        ? "hsl(0, 84%, 60%)"
                        : "hsl(142, 71%, 45%)"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Comparison */}
      <div className="border-t border-border/30 pt-4">
        <h4 className="text-sm font-medium text-muted-foreground mb-3">
          Comparação Mensal
        </h4>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyComparison} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(38, 15%, 18%)" />
              <XAxis
                type="number"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(46, 10%, 55%)", fontSize: 10 }}
                tickFormatter={(value) =>
                  new Intl.NumberFormat("pt-BR", { notation: "compact" }).format(value)
                }
              />
              <YAxis
                type="category"
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(46, 10%, 55%)", fontSize: 12 }}
                width={60}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="esperado"
                name="Esperado"
                fill="hsl(38, 85%, 45%)"
                radius={[0, 4, 4, 0]}
                opacity={0.5}
              />
              <Bar
                dataKey="recebido"
                name="Recebido"
                fill="hsl(142, 71%, 45%)"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="h-2 w-4 rounded-full bg-[hsl(45,90%,50%)]" />
          <span className="text-muted-foreground">Hoje</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-4 rounded-full bg-success" />
          <span className="text-muted-foreground">A receber</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-4 rounded-full bg-destructive" />
          <span className="text-muted-foreground">Atrasado</span>
        </div>
      </div>
    </motion.div>
  );
}
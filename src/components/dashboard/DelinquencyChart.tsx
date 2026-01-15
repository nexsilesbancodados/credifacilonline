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
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { useInstallments } from "@/hooks/useContracts";
import { useClients } from "@/hooks/useClients";
import { format, parseISO, startOfMonth, endOfMonth, subMonths, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertTriangle, TrendingDown, Users, Clock, Loader2 } from "lucide-react";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg bg-popover border border-border px-4 py-3 shadow-lg">
        <p className="text-xs text-muted-foreground mb-2">{label}</p>
        {payload.map((item: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: item.color }}>
            {item.name}:{" "}
            <span className="font-semibold">
              {item.name.includes("R$") || item.name.includes("Valor")
                ? new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(item.value)
                : item.value}
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function DelinquencyChart() {
  const { installments, isLoading: isLoadingInstallments } = useInstallments();
  const { clients, isLoading: isLoadingClients } = useClients();

  const isLoading = isLoadingInstallments || isLoadingClients;

  // Monthly delinquency trend (last 6 months)
  const monthlyTrend = useMemo(() => {
    if (!installments) return [];

    const data = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const monthLabel = format(monthDate, "MMM", { locale: ptBR });

      const overdueInMonth = installments.filter((inst) => {
        const dueDate = parseISO(inst.due_date);
        return (
          inst.status === "Atrasado" &&
          dueDate >= monthStart &&
          dueDate <= monthEnd
        );
      });

      const totalOverdue = overdueInMonth.reduce(
        (sum, inst) => sum + Number(inst.amount_due),
        0
      );
      const count = overdueInMonth.length;

      data.push({
        month: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
        valor: totalOverdue,
        quantidade: count,
      });
    }
    return data;
  }, [installments]);

  // Days overdue distribution
  const overdueDistribution = useMemo(() => {
    if (!installments) return [];

    const today = new Date();
    const ranges = [
      { label: "1-7 dias", min: 1, max: 7, color: "hsl(45, 90%, 50%)", count: 0 },
      { label: "8-15 dias", min: 8, max: 15, color: "hsl(38, 85%, 45%)", count: 0 },
      { label: "16-30 dias", min: 16, max: 30, color: "hsl(25, 80%, 45%)", count: 0 },
      { label: "31-60 dias", min: 31, max: 60, color: "hsl(15, 75%, 45%)", count: 0 },
      { label: "60+ dias", min: 61, max: Infinity, color: "hsl(0, 72%, 51%)", count: 0 },
    ];

    installments
      .filter((inst) => inst.status === "Atrasado")
      .forEach((inst) => {
        const dueDate = parseISO(inst.due_date);
        const daysOverdue = differenceInDays(today, dueDate);

        const range = ranges.find(
          (r) => daysOverdue >= r.min && daysOverdue <= r.max
        );
        if (range) range.count++;
      });

    return ranges.filter((r) => r.count > 0);
  }, [installments]);

  // Top delinquent clients
  const topDelinquents = useMemo(() => {
    if (!installments || !clients) return [];

    const clientDelinquency: Record<string, { amount: number; count: number; name: string }> = {};

    installments
      .filter((inst) => inst.status === "Atrasado")
      .forEach((inst) => {
        if (!clientDelinquency[inst.client_id]) {
          const client = clients.find((c) => c.id === inst.client_id);
          clientDelinquency[inst.client_id] = {
            amount: 0,
            count: 0,
            name: client?.name || "Desconhecido",
          };
        }
        clientDelinquency[inst.client_id].amount += Number(inst.amount_due);
        clientDelinquency[inst.client_id].count++;
      });

    return Object.values(clientDelinquency)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [installments, clients]);

  // Summary stats
  const stats = useMemo(() => {
    if (!installments) return { total: 0, count: 0, avgDays: 0 };

    const overdueInstallments = installments.filter((i) => i.status === "Atrasado");
    const totalAmount = overdueInstallments.reduce(
      (sum, i) => sum + Number(i.amount_due),
      0
    );
    const today = new Date();
    const avgDays =
      overdueInstallments.length > 0
        ? overdueInstallments.reduce((sum, i) => {
            return sum + differenceInDays(today, parseISO(i.due_date));
          }, 0) / overdueInstallments.length
        : 0;

    return {
      total: totalAmount,
      count: overdueInstallments.length,
      avgDays: Math.round(avgDays),
    };
  }, [installments]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-destructive/30 bg-gradient-to-br from-destructive/10 to-transparent p-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/20">
              <TrendingDown className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(stats.total)}
              </p>
              <p className="text-sm text-muted-foreground">Total em atraso</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-warning/30 bg-gradient-to-br from-warning/10 to-transparent p-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/20">
              <AlertTriangle className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.count}</p>
              <p className="text-sm text-muted-foreground">Parcelas atrasadas</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-border/50 bg-gradient-to-br from-card to-transparent p-4"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
              <Clock className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.avgDays} dias</p>
              <p className="text-sm text-muted-foreground">Média de atraso</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly Trend */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-6"
        >
          <h3 className="font-display text-lg font-semibold text-foreground mb-4">
            Evolução da Inadimplência
          </h3>
          <div className="h-56">
            {monthlyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrend}>
                  <defs>
                    <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(0, 72%, 51%)" stopOpacity={0} />
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
                    dataKey="valor"
                    name="Valor em Atraso"
                    stroke="hsl(0, 72%, 51%)"
                    strokeWidth={2}
                    fill="url(#colorValor)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Sem dados de inadimplência
              </div>
            )}
          </div>
        </motion.div>

        {/* Days Overdue Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-6"
        >
          <h3 className="font-display text-lg font-semibold text-foreground mb-4">
            Distribuição por Dias de Atraso
          </h3>
          <div className="h-56">
            {overdueDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={overdueDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(38, 15%, 18%)" />
                  <XAxis
                    type="number"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(46, 10%, 55%)", fontSize: 12 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "hsl(46, 10%, 55%)", fontSize: 12 }}
                    width={80}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" name="Parcelas" radius={[0, 4, 4, 0]}>
                    {overdueDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                Sem parcelas em atraso
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Top Delinquent Clients */}
      {topDelinquents.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-destructive" />
            <h3 className="font-display text-lg font-semibold text-foreground">
              Clientes com Maior Inadimplência
            </h3>
          </div>
          <div className="space-y-3">
            {topDelinquents.map((client, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-destructive/20 text-sm font-bold text-destructive">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-foreground">{client.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {client.count} parcela{client.count !== 1 ? "s" : ""} em atraso
                    </p>
                  </div>
                </div>
                <p className="font-display font-bold text-destructive">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(client.amount)}
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

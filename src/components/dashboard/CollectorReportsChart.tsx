import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useCollectors } from "@/hooks/useCollectors";
import { useInstallments } from "@/hooks/useContracts";
import { useAllClients } from "@/hooks/useClients";
import { Users, TrendingUp, AlertTriangle, Trophy, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CollectorStats {
  id: string;
  name: string;
  totalCollected: number;
  clientsCount: number;
  overdueCount: number;
  overdueRate: number;
  performance: "excellent" | "good" | "average" | "poor";
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg bg-popover border border-border px-4 py-3 shadow-lg">
        <p className="text-sm font-medium text-foreground mb-2">{label}</p>
        {payload.map((item: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: item.color }}>
            {item.name}:{" "}
            <span className="font-semibold">
              {item.dataKey === "totalCollected"
                ? new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(item.value)
                : item.dataKey === "overdueRate"
                ? `${item.value.toFixed(1)}%`
                : item.value}
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const getPerformanceColor = (performance: string) => {
  switch (performance) {
    case "excellent":
      return "hsl(142, 71%, 45%)";
    case "good":
      return "hsl(45, 90%, 50%)";
    case "average":
      return "hsl(38, 85%, 45%)";
    case "poor":
      return "hsl(0, 84%, 60%)";
    default:
      return "hsl(38, 15%, 30%)";
  }
};

const getPerformanceLabel = (performance: string) => {
  switch (performance) {
    case "excellent":
      return "Excelente";
    case "good":
      return "Bom";
    case "average":
      return "Regular";
    case "poor":
      return "Baixo";
    default:
      return "N/A";
  }
};

const getPerformanceBadgeVariant = (performance: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (performance) {
    case "excellent":
      return "default";
    case "good":
      return "secondary";
    case "average":
      return "outline";
    case "poor":
      return "destructive";
    default:
      return "outline";
  }
};

export function CollectorReportsChart() {
  const { collectorsWithClients, isLoading: isLoadingCollectors } = useCollectors();
  const { installments, isLoading: isLoadingInstallments } = useInstallments();
  const { clients, isLoading: isLoadingClients } = useClients();

  const isLoading = isLoadingCollectors || isLoadingInstallments || isLoadingClients;

  const collectorStats = useMemo<CollectorStats[]>(() => {
    if (!collectorsWithClients || !installments || !clients) return [];

    return collectorsWithClients.map((collector) => {
      // Get clients assigned to this collector
      const collectorClients = clients.filter((c) => c.collector_id === collector.id);
      const clientIds = collectorClients.map((c) => c.id);

      // Get installments for these clients
      const collectorInstallments = installments.filter((inst) =>
        clientIds.includes(inst.client_id)
      );

      // Calculate total collected
      const totalCollected = collectorInstallments
        .filter((inst) => inst.status === "Pago")
        .reduce((sum, inst) => sum + Number(inst.amount_paid || 0), 0);

      // Calculate overdue count
      const overdueInstallments = collectorInstallments.filter(
        (inst) => inst.status === "Atrasado"
      );
      const overdueCount = overdueInstallments.length;

      // Calculate overdue rate
      const totalPendingOrOverdue = collectorInstallments.filter(
        (inst) => inst.status === "Pendente" || inst.status === "Atrasado"
      ).length;
      const overdueRate =
        totalPendingOrOverdue > 0 ? (overdueCount / totalPendingOrOverdue) * 100 : 0;

      // Determine performance based on overdue rate
      let performance: "excellent" | "good" | "average" | "poor";
      if (overdueRate <= 5) {
        performance = "excellent";
      } else if (overdueRate <= 15) {
        performance = "good";
      } else if (overdueRate <= 30) {
        performance = "average";
      } else {
        performance = "poor";
      }

      return {
        id: collector.id,
        name: collector.name,
        totalCollected,
        clientsCount: collectorClients.length,
        overdueCount,
        overdueRate,
        performance,
      };
    }).sort((a, b) => b.totalCollected - a.totalCollected);
  }, [collectorsWithClients, installments, clients]);

  const totals = useMemo(() => {
    return collectorStats.reduce(
      (acc, stat) => ({
        totalCollected: acc.totalCollected + stat.totalCollected,
        totalClients: acc.totalClients + stat.clientsCount,
        totalOverdue: acc.totalOverdue + stat.overdueCount,
      }),
      { totalCollected: 0, totalClients: 0, totalOverdue: 0 }
    );
  }, [collectorStats]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-6 h-96 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (collectorStats.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground">
              Relatório de Cobradores
            </h3>
            <p className="text-sm text-muted-foreground">Performance da equipe</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
          <Users className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-center">
            Nenhum cobrador cadastrado.
            <br />
            Cadastre cobradores para ver o relatório.
          </p>
        </div>
      </motion.div>
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground">
              Relatório de Cobradores
            </h3>
            <p className="text-sm text-muted-foreground">Performance da equipe</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-muted/30 border border-border/30">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-success" />
            <span className="text-xs text-muted-foreground">Total Arrecadado</span>
          </div>
          <p className="text-xl font-display font-bold text-foreground">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
              notation: "compact",
            }).format(totals.totalCollected)}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-muted/30 border border-border/30">
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">Clientes Atribuídos</span>
          </div>
          <p className="text-xl font-display font-bold text-foreground">
            {totals.totalClients}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-muted/30 border border-border/30">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span className="text-xs text-muted-foreground">Parcelas em Atraso</span>
          </div>
          <p className="text-xl font-display font-bold text-foreground">
            {totals.totalOverdue}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={collectorStats} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(38, 15%, 18%)" />
            <XAxis
              type="number"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(46, 10%, 55%)", fontSize: 12 }}
              tickFormatter={(value) =>
                new Intl.NumberFormat("pt-BR", { notation: "compact" }).format(value)
              }
            />
            <YAxis
              type="category"
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(46, 10%, 55%)", fontSize: 12 }}
              width={100}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="totalCollected" name="Arrecadado" radius={[0, 4, 4, 0]}>
              {collectorStats.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getPerformanceColor(entry.performance)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Ranking Table */}
      <div className="border-t border-border/30 pt-4">
        <div className="flex items-center gap-2 mb-3">
          <Trophy className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Ranking de Desempenho</span>
        </div>
        <div className="space-y-2">
          {collectorStats.map((stat, index) => (
            <div
              key={stat.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                    index === 0
                      ? "bg-primary text-primary-foreground"
                      : index === 1
                      ? "bg-muted text-foreground"
                      : index === 2
                      ? "bg-muted/50 text-muted-foreground"
                      : "bg-transparent text-muted-foreground"
                  }`}
                >
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium text-foreground">{stat.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {stat.clientsCount} clientes • {stat.overdueCount} em atraso
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-display font-semibold text-foreground">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(stat.totalCollected)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {stat.overdueRate.toFixed(1)}% inadimplência
                  </p>
                </div>
                <Badge variant={getPerformanceBadgeVariant(stat.performance)}>
                  {getPerformanceLabel(stat.performance)}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
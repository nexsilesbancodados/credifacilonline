import { MainLayout } from "@/components/layout/MainLayout";
import { motion } from "framer-motion";
import {
  Download,
  FileText,
  Loader2,
  AlertTriangle,
  Users,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Shield,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend,
} from "recharts";
import { useContracts, useInstallments } from "@/hooks/useContracts";
import { useTreasury } from "@/hooks/useTreasury";
import { useAllClients } from "@/hooks/useClients";
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMemo, useState } from "react";
import { ExportReports } from "@/components/reports/ExportReports";
import { AnalyticsCards, PeriodSelector } from "@/components/dashboard/AnalyticsCards";
import { useAnalyticsStats, PeriodFilter, CustomDateRange } from "@/hooks/useAnalyticsStats";
import { DelinquencyChart } from "@/components/dashboard/DelinquencyChart";
import { PortfolioAgingChart } from "@/components/dashboard/PortfolioAgingChart";
import { PerformanceMetrics } from "@/components/dashboard/PerformanceMetrics";
import { ScoreDistributionChart } from "@/components/dashboard/ScoreDistributionChart";
import { CollectorReportsChart } from "@/components/dashboard/CollectorReportsChart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadItem[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl bg-popover border border-border px-4 py-3 shadow-xl">
        <p className="text-xs font-medium text-muted-foreground mb-2">{label}</p>
        {payload.map((item: TooltipPayloadItem, index: number) => (
          <p key={index} className="text-sm flex items-center gap-2" style={{ color: item.color }}>
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
            {item.name}:{" "}
            <span className="font-semibold">
              {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(item.value)}
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const reports = [
  { id: "clients", name: "Lista de Clientes", description: "Todos os clientes com dados de contato e status", icon: Users, color: "text-blue-500" },
  { id: "contracts", name: "Extrato de Contratos", description: "Detalhamento completo de todos os contratos", icon: FileText, color: "text-primary" },
  { id: "treasury", name: "Extrato do Caixa", description: "Histórico completo de transações financeiras", icon: TrendingUp, color: "text-success" },
  { id: "installments", name: "Cronograma de Parcelas", description: "Todas as parcelas com status de pagamento", icon: BarChart3, color: "text-amber-500" },
  { id: "delinquency", name: "Relatório de Inadimplência", description: "Parcelas atrasadas com dias e multas", icon: AlertTriangle, color: "text-destructive" },
];

const Analises = () => {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [period, setPeriod] = useState<PeriodFilter>("all");
  const [customRange, setCustomRange] = useState<CustomDateRange | undefined>();
  const { contracts, isLoading: isLoadingContracts } = useContracts();
  const { installments, isLoading: isLoadingInstallments } = useInstallments();
  const { transactions, isLoading: isLoadingTreasury } = useTreasury();
  const { data: clients = [], isLoading: isLoadingClients } = useAllClients();
  const analyticsStats = useAnalyticsStats(period, customRange);

  const isLoading = isLoadingContracts || isLoadingInstallments || isLoadingTreasury || isLoadingClients;

  // Monthly performance data (last 6 months)
  const monthlyData = useMemo(() => {
    if (!transactions || !contracts) return [];
    const data = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const monthLabel = format(monthDate, "MMM", { locale: ptBR });

      const monthTransactions = transactions.filter((t) => {
        const tDate = parseISO(t.date);
        return tDate >= monthStart && tDate <= monthEnd;
      });

      const emprestado = monthTransactions
        .filter((t) => t.type === "saida" && t.category === "Empréstimo")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const recebido = monthTransactions
        .filter((t) => t.type === "entrada")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const lucro = monthTransactions
        .filter((t) => t.type === "entrada" && t.category === "Recebimento")
        .reduce((sum, t) => sum + Number(t.amount) * 0.1, 0);

      data.push({
        month: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
        emprestado,
        recebido,
        lucro,
      });
    }
    return data;
  }, [transactions, contracts]);

  // Portfolio distribution
  const portfolioDistribution = useMemo(() => {
    if (!contracts || contracts.length === 0) {
      return [{ name: "Sem dados", value: 100, color: "hsl(var(--muted))" }];
    }
    const ranges = {
      "Até R$5k": { count: 0, color: "hsl(45, 90%, 55%)" },
      "R$5k-10k": { count: 0, color: "hsl(45, 90%, 42%)" },
      "R$10k-20k": { count: 0, color: "hsl(38, 85%, 48%)" },
      "R$20k+": { count: 0, color: "hsl(30, 75%, 38%)" },
    };
    contracts.forEach((c) => {
      const capital = Number(c.capital);
      if (capital <= 5000) ranges["Até R$5k"].count++;
      else if (capital <= 10000) ranges["R$5k-10k"].count++;
      else if (capital <= 20000) ranges["R$10k-20k"].count++;
      else ranges["R$20k+"].count++;
    });
    const total = contracts.length;
    return Object.entries(ranges).map(([name, data]) => ({
      name,
      value: total > 0 ? Math.round((data.count / total) * 100) : 0,
      count: data.count,
      color: data.color,
    })).filter(item => item.value > 0);
  }, [contracts]);

  // Status distribution for contracts
  const statusDistribution = useMemo(() => {
    if (!contracts || contracts.length === 0) return [];
    const statuses = {
      Ativo: { count: 0, color: "hsl(142, 71%, 45%)" },
      Atraso: { count: 0, color: "hsl(0, 84%, 60%)" },
      Quitado: { count: 0, color: "hsl(217, 91%, 60%)" },
      Renegociado: { count: 0, color: "hsl(38, 85%, 48%)" },
    };
    contracts.forEach((c) => {
      const key = c.status as keyof typeof statuses;
      if (statuses[key]) statuses[key].count++;
    });
    return Object.entries(statuses)
      .map(([name, data]) => ({ name, value: data.count, color: data.color }))
      .filter(item => item.value > 0);
  }, [contracts]);

  // Cumulative revenue trend
  const revenueTrend = useMemo(() => {
    if (!transactions) return [];
    const data = [];
    let cumulative = 0;
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const monthLabel = format(monthDate, "MMM", { locale: ptBR });

      const monthRecebido = transactions
        .filter((t) => {
          const tDate = parseISO(t.date);
          return tDate >= monthStart && tDate <= monthEnd && t.type === "entrada";
        })
        .reduce((sum, t) => sum + Number(t.amount), 0);

      cumulative += monthRecebido;
      data.push({
        month: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
        recebido: monthRecebido,
        acumulado: cumulative,
      });
    }
    return data;
  }, [transactions]);

  // Risk vs Return
  const riskReturnData = useMemo(() => {
    if (!clients || !contracts) return [];
    return clients.slice(0, 8).map((client) => {
      const clientContracts = contracts.filter((c) => c.client_id === client.id);
      const avgRate = clientContracts.length
        ? clientContracts.reduce((sum, c) => sum + Number(c.interest_rate), 0) / clientContracts.length
        : 5;
      const risk = client.status === "Atraso" ? 6 : 2 + Math.random() * 3;
      return { risk: Number(risk.toFixed(1)), return: avgRate || 10, name: client.name.split(" ")[0] };
    });
  }, [clients, contracts]);

  return (
    <MainLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">Análises e Relatórios</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Métricas de performance e insights da sua carteira
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsExportOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-gold px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-gold transition-shadow hover:shadow-gold-lg"
          >
            <Download className="h-4 w-4" />
            Exportar Relatórios
          </motion.button>
        </div>

        <ExportReports open={isExportOpen} onOpenChange={setIsExportOpen} />

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Carregando análises...</p>
          </div>
        ) : (
          <>
            {/* Period Filter */}
            <div className="mb-6">
              <PeriodSelector value={period} onChange={setPeriod} customRange={customRange} onCustomRangeChange={setCustomRange} />
            </div>

            {/* Full Analytics Cards */}
            <AnalyticsCards stats={analyticsStats} variant="full" />

            {/* Tabs */}
            <Tabs defaultValue="performance" className="mt-8">
              <TabsList className="bg-secondary/50 p-1 h-auto flex-wrap">
                <TabsTrigger value="performance" className="gap-2 data-[state=active]:shadow-md">
                  <Activity className="h-4 w-4" />
                  Performance
                </TabsTrigger>
                <TabsTrigger value="delinquency" className="gap-2 data-[state=active]:shadow-md">
                  <AlertTriangle className="h-4 w-4" />
                  Inadimplência
                </TabsTrigger>
                <TabsTrigger value="aging" className="gap-2 data-[state=active]:shadow-md">
                  <BarChart3 className="h-4 w-4" />
                  Aging
                </TabsTrigger>
                <TabsTrigger value="score" className="gap-2 data-[state=active]:shadow-md">
                  <Shield className="h-4 w-4" />
                  Score
                </TabsTrigger>
                <TabsTrigger value="collectors" className="gap-2 data-[state=active]:shadow-md">
                  <Users className="h-4 w-4" />
                  Cobradores
                </TabsTrigger>
              </TabsList>

              {/* Performance Tab */}
              <TabsContent value="performance" className="mt-6 space-y-6">
                {/* Row 1: Revenue Trend + Monthly Performance */}
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Revenue Trend (Area Chart) */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-6"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="font-display text-lg font-semibold text-foreground">Evolução de Receitas</h3>
                        <p className="text-xs text-muted-foreground mt-1">Recebimentos mensais e acumulado</p>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10">
                        <TrendingUp className="h-5 w-5 text-success" />
                      </div>
                    </div>
                    <div className="h-72">
                      {revenueTrend.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={revenueTrend}>
                            <defs>
                              <linearGradient id="colorAcumulado" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="hsl(142, 71%, 45%)" stopOpacity={0} />
                              </linearGradient>
                              <linearGradient id="colorRecebido" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} tickFormatter={(v) => new Intl.NumberFormat("pt-BR", { notation: "compact" }).format(v)} />
                            <Tooltip content={<CustomTooltip />} />
                            <Area type="monotone" dataKey="acumulado" name="Acumulado" stroke="hsl(142, 71%, 45%)" fill="url(#colorAcumulado)" strokeWidth={2} />
                            <Area type="monotone" dataKey="recebido" name="Mensal" stroke="hsl(217, 91%, 60%)" fill="url(#colorRecebido)" strokeWidth={2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">Sem dados para exibir</div>
                      )}
                    </div>
                  </motion.div>

                  {/* Monthly Performance (Bar Chart) */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-6"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="font-display text-lg font-semibold text-foreground">Performance Mensal</h3>
                        <p className="text-xs text-muted-foreground mt-1">Emprestado vs Recebido vs Lucro</p>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <BarChart3 className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <div className="h-72">
                      {monthlyData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={monthlyData} barGap={4}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} tickFormatter={(v) => new Intl.NumberFormat("pt-BR", { notation: "compact" }).format(v)} />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }} />
                            <Bar dataKey="emprestado" name="Emprestado" fill="hsl(217, 91%, 60%)" radius={[6, 6, 0, 0]} />
                            <Bar dataKey="recebido" name="Recebido" fill="hsl(142, 71%, 45%)" radius={[6, 6, 0, 0]} />
                            <Bar dataKey="lucro" name="Lucro" fill="hsl(45, 90%, 50%)" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">Sem dados para exibir</div>
                      )}
                    </div>
                  </motion.div>
                </div>

                {/* Row 2: Pie charts */}
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Portfolio Distribution */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-6"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="font-display text-lg font-semibold text-foreground">Distribuição por Valor</h3>
                        <p className="text-xs text-muted-foreground mt-1">Faixas de capital emprestado</p>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                        <PieChartIcon className="h-5 w-5 text-amber-500" />
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="h-52 w-52 flex-shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <RechartsPieChart>
                            <Pie data={portfolioDistribution} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none">
                              {portfolioDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  const data = payload[0].payload;
                                  return (
                                    <div className="rounded-xl bg-popover border border-border px-3 py-2 shadow-xl">
                                      <p className="font-medium text-foreground text-sm">{data.name}</p>
                                      <p className="text-xs text-muted-foreground">{data.value}% · {data.count} contrato(s)</p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                          </RechartsPieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex-1 space-y-3">
                        {portfolioDistribution.map((item) => (
                          <div key={item.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                              <span className="text-sm text-muted-foreground">{item.name}</span>
                            </div>
                            <div className="text-right">
                              <span className="font-display font-semibold text-foreground">{item.value}%</span>
                              {"count" in item && (
                                <span className="text-xs text-muted-foreground ml-2">({item.count})</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>

                  {/* Status Distribution */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-6"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="font-display text-lg font-semibold text-foreground">Status dos Contratos</h3>
                        <p className="text-xs text-muted-foreground mt-1">Distribuição por situação atual</p>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
                        <FileText className="h-5 w-5 text-blue-500" />
                      </div>
                    </div>
                    {statusDistribution.length > 0 ? (
                      <div className="space-y-4">
                        {statusDistribution.map((item) => {
                          const total = statusDistribution.reduce((sum, i) => sum + i.value, 0);
                          const pct = total > 0 ? (item.value / total) * 100 : 0;
                          return (
                            <div key={item.name}>
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                  <span className="text-sm font-medium text-foreground">{item.name}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-semibold text-foreground">{item.value}</span>
                                  <span className="text-xs text-muted-foreground w-12 text-right">{pct.toFixed(0)}%</span>
                                </div>
                              </div>
                              <div className="h-2 rounded-full bg-secondary/50 overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{ duration: 0.8, ease: "easeOut" }}
                                  className="h-full rounded-full"
                                  style={{ backgroundColor: item.color }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-40 text-muted-foreground">Sem dados</div>
                    )}
                  </motion.div>
                </div>

                {/* Risk vs Return */}
                {riskReturnData.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-6"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="font-display text-lg font-semibold text-foreground">Risco vs. Retorno</h3>
                        <p className="text-xs text-muted-foreground mt-1">Análise de risco por cliente</p>
                      </div>
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10">
                        <AlertTriangle className="h-5 w-5 text-destructive" />
                      </div>
                    </div>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={riskReturnData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.3} />
                          <XAxis dataKey="risk" name="Risco" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} label={{ value: "Risco", position: "bottom", fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                          <YAxis dataKey="return" name="Retorno" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} label={{ value: "Retorno %", angle: -90, position: "insideLeft", fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="rounded-xl bg-popover border border-border px-4 py-3 shadow-xl">
                                    <p className="font-medium text-foreground">{data.name}</p>
                                    <p className="text-sm text-muted-foreground">Risco: {data.risk} · Retorno: {data.return}%</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Line type="monotone" dataKey="return" stroke="hsl(45, 90%, 50%)" strokeWidth={2.5} dot={{ fill: "hsl(45, 90%, 50%)", strokeWidth: 0, r: 6 }} activeDot={{ fill: "hsl(45, 90%, 50%)", strokeWidth: 2, stroke: "hsl(var(--background))", r: 8 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </motion.div>
                )}
              </TabsContent>

              <TabsContent value="delinquency" className="mt-6">
                <DelinquencyChart />
              </TabsContent>

              <TabsContent value="aging" className="mt-6 space-y-6">
                <PortfolioAgingChart />
                <PerformanceMetrics />
              </TabsContent>

              <TabsContent value="score" className="mt-6">
                <ScoreDistributionChart />
              </TabsContent>

              <TabsContent value="collectors" className="mt-6">
                <CollectorReportsChart />
              </TabsContent>
            </Tabs>

            {/* Reports Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-6 mt-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-display text-lg font-semibold text-foreground">Central de Relatórios</h3>
                  <p className="text-xs text-muted-foreground mt-1">Exporte dados detalhados em múltiplos formatos</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {reports.map((report, i) => {
                  const Icon = report.icon;
                  return (
                    <motion.button
                      key={report.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 + i * 0.05 }}
                      whileHover={{ y: -2 }}
                      onClick={() => setIsExportOpen(true)}
                      className="flex flex-col items-start gap-3 rounded-xl border border-border/50 bg-secondary/20 p-4 text-left transition-all hover:bg-secondary/40 hover:border-primary/30 hover:shadow-md group"
                    >
                      <div className={cn("rounded-lg bg-secondary/50 p-2.5 group-hover:bg-primary/10 transition-colors")}>
                        <Icon className={cn("h-5 w-5 transition-colors", report.color)} />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">{report.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{report.description}</p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </motion.div>
    </MainLayout>
  );
};

export default Analises;

import { MainLayout } from "@/components/layout/MainLayout";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Target,
  PieChart,
  BarChart3,
  Download,
  FileText,
  Loader2,
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
} from "recharts";
import { useContracts, useInstallments } from "@/hooks/useContracts";
import { useTreasury } from "@/hooks/useTreasury";
import { useClients } from "@/hooks/useClients";
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useMemo, useState } from "react";
import { ExportReports } from "@/components/reports/ExportReports";

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

const reports = [
  {
    id: "clients",
    name: "Lista de Clientes",
    description: "Todos os clientes com dados de contato",
    icon: FileText,
  },
  {
    id: "contracts",
    name: "Extrato de Contratos",
    description: "Detalhamento de todos os contratos",
    icon: FileText,
  },
  {
    id: "treasury",
    name: "Extrato do Caixa",
    description: "Histórico de transações financeiras",
    icon: FileText,
  },
];

const Analises = () => {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const { contracts, isLoading: isLoadingContracts } = useContracts();
  const { installments, isLoading: isLoadingInstallments } = useInstallments();
  const { transactions, isLoading: isLoadingTreasury } = useTreasury();
  const { clients, isLoading: isLoadingClients } = useClients();

  const isLoading = isLoadingContracts || isLoadingInstallments || isLoadingTreasury || isLoadingClients;

  // Calculate monthly performance data (last 6 months)
  const monthlyData = useMemo(() => {
    if (!transactions || !contracts) return [];

    const data = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const monthLabel = format(monthDate, "MMM", { locale: ptBR });

      // Filter transactions for this month
      const monthTransactions = transactions.filter((t) => {
        const tDate = parseISO(t.date);
        return tDate >= monthStart && tDate <= monthEnd;
      });

      // Calculate totals
      const emprestado = monthTransactions
        .filter((t) => t.type === "saida" && t.category === "Empréstimo")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const recebido = monthTransactions
        .filter((t) => t.type === "entrada")
        .reduce((sum, t) => sum + Number(t.amount), 0);

      // Calculate profit (received - original capital proportion)
      const lucro = monthTransactions
        .filter((t) => t.type === "entrada" && t.category === "Recebimento")
        .reduce((sum, t) => sum + Number(t.amount) * 0.1, 0); // Approximate 10% profit

      data.push({
        month: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
        emprestado,
        recebido,
        lucro,
      });
    }
    return data;
  }, [transactions, contracts]);

  // Calculate portfolio distribution by contract value range
  const portfolioDistribution = useMemo(() => {
    if (!contracts || contracts.length === 0) {
      return [
        { name: "Sem dados", value: 100, color: "hsl(38, 15%, 30%)" },
      ];
    }

    const ranges = {
      "0-5k": { count: 0, color: "hsl(45, 90%, 50%)" },
      "5k-10k": { count: 0, color: "hsl(45, 90%, 40%)" },
      "10k-20k": { count: 0, color: "hsl(38, 85%, 45%)" },
      "20k+": { count: 0, color: "hsl(38, 75%, 35%)" },
    };

    contracts.forEach((c) => {
      const capital = Number(c.capital);
      if (capital <= 5000) ranges["0-5k"].count++;
      else if (capital <= 10000) ranges["5k-10k"].count++;
      else if (capital <= 20000) ranges["10k-20k"].count++;
      else ranges["20k+"].count++;
    });

    const total = contracts.length;
    return Object.entries(ranges).map(([name, data]) => ({
      name,
      value: total > 0 ? Math.round((data.count / total) * 100) : 0,
      color: data.color,
    })).filter(item => item.value > 0);
  }, [contracts]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const totalCapital = contracts?.reduce((sum, c) => sum + Number(c.capital), 0) || 0;
    const totalProfit = contracts?.reduce((sum, c) => sum + Number(c.total_profit), 0) || 0;
    const avgRate = contracts?.length
      ? contracts.reduce((sum, c) => sum + Number(c.interest_rate), 0) / contracts.length
      : 0;
    const avgTicket = contracts?.length ? totalCapital / contracts.length : 0;
    const roi = totalCapital > 0 ? (totalProfit / totalCapital) * 100 : 0;

    // Growth calculation (compare last 2 months)
    const thisMonth = subMonths(new Date(), 0);
    const lastMonth = subMonths(new Date(), 1);
    const thisMonthContracts = contracts?.filter((c) => {
      const cDate = parseISO(c.created_at);
      return cDate >= startOfMonth(thisMonth);
    }).length || 0;
    const lastMonthContracts = contracts?.filter((c) => {
      const cDate = parseISO(c.created_at);
      return cDate >= startOfMonth(lastMonth) && cDate < startOfMonth(thisMonth);
    }).length || 0;
    const growth = lastMonthContracts > 0 
      ? ((thisMonthContracts - lastMonthContracts) / lastMonthContracts) * 100 
      : 0;

    return {
      roi: roi.toFixed(1),
      avgRate: avgRate.toFixed(1),
      avgTicket: new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(avgTicket),
      growth: (growth >= 0 ? "+" : "") + growth.toFixed(0),
    };
  }, [contracts]);

  // Risk vs Return data (based on actual clients)
  const riskReturnData = useMemo(() => {
    if (!clients || !contracts) return [];

    return clients.slice(0, 8).map((client, index) => {
      const clientContracts = contracts.filter((c) => c.client_id === client.id);
      const avgRate = clientContracts.length
        ? clientContracts.reduce((sum, c) => sum + Number(c.interest_rate), 0) / clientContracts.length
        : 5;
      // Risk based on client status
      const risk = client.status === "Atraso" ? 6 : 2 + Math.random() * 3;

      return {
        risk: Number(risk.toFixed(1)),
        return: avgRate || 10,
        name: client.name.split(" ")[0],
      };
    });
  }, [clients, contracts]);

  return (
    <MainLayout>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">
            Análises e Relatórios
          </h1>
          <p className="mt-1 text-muted-foreground">
            Métricas de performance e insights da sua carteira
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setIsExportOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-gold px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-gold transition-shadow hover:shadow-gold"
        >
          <Download className="h-4 w-4" />
          Exportar Relatórios
        </motion.button>
      </motion.div>

      <ExportReports open={isExportOpen} onOpenChange={setIsExportOpen} />

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {!isLoading && (
        <>
          {/* KPI Cards */}
          <div className="grid gap-6 md:grid-cols-4 mb-8">
            {[
              { label: "ROI Médio", value: `${kpis.roi}%`, icon: TrendingUp, color: "success" },
              { label: "Taxa Média", value: `${kpis.avgRate}%`, icon: Target, color: "primary" },
              { label: "Ticket Médio", value: kpis.avgTicket, icon: PieChart, color: "warning" },
              { label: "Crescimento", value: `${kpis.growth}%`, icon: BarChart3, color: "success" },
            ].map((kpi, index) => {
              const Icon = kpi.icon;
              return (
                <motion.div
                  key={kpi.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-5"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{kpi.label}</p>
                    <Icon className={`h-5 w-5 text-${kpi.color}`} />
                  </div>
                  <p className="mt-2 font-display text-2xl font-bold text-foreground">
                    {kpi.value}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Charts Grid */}
          <div className="grid gap-6 lg:grid-cols-2 mb-8">
            {/* Monthly Performance Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-6"
            >
              <h3 className="font-display text-lg font-semibold text-foreground mb-6">
                Performance Mensal
              </h3>
              <div className="h-72">
                {monthlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyData}>
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
                          new Intl.NumberFormat("pt-BR", {
                            notation: "compact",
                          }).format(value)
                        }
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey="emprestado"
                        name="Emprestado"
                        fill="hsl(217, 91%, 60%)"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="recebido"
                        name="Recebido"
                        fill="hsl(142, 71%, 45%)"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="lucro"
                        name="Lucro"
                        fill="hsl(45, 90%, 50%)"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    Sem dados para exibir
                  </div>
                )}
              </div>
            </motion.div>

            {/* Portfolio Distribution */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-6"
            >
              <h3 className="font-display text-lg font-semibold text-foreground mb-6">
                Distribuição por Faixa de Valor
              </h3>
              <div className="flex items-center gap-8">
                <div className="h-56 w-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={portfolioDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {portfolioDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-3">
                  {portfolioDistribution.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-sm text-muted-foreground">{item.name}</span>
                      </div>
                      <span className="font-display font-semibold text-foreground">
                        {item.value}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          {/* Risk vs Return Chart */}
          {riskReturnData.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-6 mb-8"
            >
              <h3 className="font-display text-lg font-semibold text-foreground mb-6">
                Análise de Risco vs. Retorno
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={riskReturnData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(38, 15%, 18%)" />
                    <XAxis
                      dataKey="risk"
                      name="Risco"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "hsl(46, 10%, 55%)", fontSize: 12 }}
                      label={{
                        value: "Risco",
                        position: "bottom",
                        fill: "hsl(46, 10%, 55%)",
                      }}
                    />
                    <YAxis
                      dataKey="return"
                      name="Retorno"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "hsl(46, 10%, 55%)", fontSize: 12 }}
                      label={{
                        value: "Retorno %",
                        angle: -90,
                        position: "insideLeft",
                        fill: "hsl(46, 10%, 55%)",
                      }}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="rounded-lg bg-popover border border-border px-4 py-3 shadow-lg">
                              <p className="font-medium text-foreground">{data.name}</p>
                              <p className="text-sm text-muted-foreground">
                                Risco: {data.risk} | Retorno: {data.return}%
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="return"
                      stroke="hsl(45, 90%, 50%)"
                      strokeWidth={2}
                      dot={{
                        fill: "hsl(45, 90%, 50%)",
                        strokeWidth: 0,
                        r: 6,
                      }}
                      activeDot={{
                        fill: "hsl(45, 90%, 50%)",
                        strokeWidth: 2,
                        stroke: "hsl(38, 22%, 8%)",
                        r: 8,
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {/* Reports Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-6"
          >
            <h3 className="font-display text-lg font-semibold text-foreground mb-6">
              Central de Relatórios
            </h3>
            <div className="grid gap-4 md:grid-cols-3">
              {reports.map((report) => {
                const Icon = report.icon;
                return (
                  <motion.button
                    key={report.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center gap-4 rounded-xl border border-border/50 bg-secondary/30 p-4 text-left transition-colors hover:border-primary/30 hover:bg-secondary/50"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{report.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {report.description}
                      </p>
                    </div>
                    <Download className="h-5 w-5 text-muted-foreground" />
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </MainLayout>
  );
};

export default Analises;
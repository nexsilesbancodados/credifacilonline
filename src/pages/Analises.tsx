import { MainLayout } from "@/components/layout/MainLayout";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Target,
  PieChart,
  BarChart3,
  Download,
  FileText,
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

const monthlyData = [
  { month: "Jul", emprestado: 85000, recebido: 42000, lucro: 12000 },
  { month: "Ago", emprestado: 92000, recebido: 48000, lucro: 14500 },
  { month: "Set", emprestado: 78000, recebido: 52000, lucro: 15200 },
  { month: "Out", emprestado: 105000, recebido: 58000, lucro: 17800 },
  { month: "Nov", emprestado: 118000, recebido: 65000, lucro: 19500 },
  { month: "Dez", emprestado: 142000, recebido: 72000, lucro: 22100 },
];

const portfolioDistribution = [
  { name: "0-5k", value: 25, color: "hsl(45, 90%, 50%)" },
  { name: "5k-10k", value: 35, color: "hsl(45, 90%, 40%)" },
  { name: "10k-20k", value: 28, color: "hsl(38, 85%, 45%)" },
  { name: "20k+", value: 12, color: "hsl(38, 75%, 35%)" },
];

const riskReturnData = [
  { risk: 2, return: 8, name: "Cliente A" },
  { risk: 3, return: 10, name: "Cliente B" },
  { risk: 4, return: 12, name: "Cliente C" },
  { risk: 5, return: 15, name: "Cliente D" },
  { risk: 2.5, return: 9, name: "Cliente E" },
  { risk: 6, return: 18, name: "Cliente F" },
  { risk: 3.5, return: 11, name: "Cliente G" },
  { risk: 7, return: 22, name: "Cliente H" },
];

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
  return (
    <MainLayout>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="font-display text-3xl font-bold text-foreground">
          Análises e Relatórios
        </h1>
        <p className="mt-1 text-muted-foreground">
          Métricas de performance e insights da sua carteira
        </p>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-4 mb-8">
        {[
          { label: "ROI Médio", value: "32.5%", icon: TrendingUp, color: "success" },
          { label: "Taxa Média", value: "8.2%", icon: Target, color: "primary" },
          { label: "Ticket Médio", value: "R$ 12.450", icon: PieChart, color: "warning" },
          { label: "Crescimento", value: "+18%", icon: BarChart3, color: "success" },
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
          {reports.map((report, index) => {
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
    </MainLayout>
  );
};

export default Analises;

import { useState, useCallback } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { OverdueList } from "@/components/dashboard/OverdueList";
import { AnalyticsCards, PeriodSelector } from "@/components/dashboard/AnalyticsCards";
import { GoalsDashboard } from "@/components/dashboard/GoalsDashboard";
import { ForecastChart } from "@/components/dashboard/ForecastChart";
import { ReceivableForecastWidget } from "@/components/dashboard/ReceivableForecastWidget";
import { LoanFrequencyChart } from "@/components/dashboard/LoanFrequencyChart";
import { OnboardingTour, useOnboardingTour } from "@/components/tour/OnboardingTour";
import { Link } from "react-router-dom";
import {
  Sparkles, Users, Calculator, BarChart3,
  TrendingUp, DollarSign, AlertTriangle, FileText,
} from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboard";
import { useAnalyticsStats, PeriodFilter, CustomDateRange } from "@/hooks/useAnalyticsStats";
import { useRealtimeDashboard } from "@/hooks/useRealtimeDashboard";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { QueryErrorState } from "@/components/QueryErrorState";
import { SkeletonMetricCards, SkeletonChart } from "@/components/ui/skeleton-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";

const quickActions = [
  { icon: Sparkles, label: "Novo Contrato", path: "/contratos/novo", primary: true },
  { icon: Users, label: "Clientes", path: "/clientes" },
  { icon: Calculator, label: "Simulador", path: "/simulador" },
  { icon: BarChart3, label: "Análises", path: "/analises" },
];

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

const staggerContainer = {
  animate: { transition: { staggerChildren: 0.05 } },
};

const staggerItem = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
};

const Dashboard = () => {
  const [period, setPeriod] = useState<PeriodFilter>("all");
  const [customRange, setCustomRange] = useState<CustomDateRange | undefined>();
  const { profile } = useAuth();
  const { data: dashboardStats, isLoading: isLoadingDashboard, isError, refetch } = useDashboardStats();
  const analyticsStats = useAnalyticsStats(period, customRange);
  const { isOpen: isTourOpen, setIsOpen: setTourOpen } = useOnboardingTour();

  useRealtimeDashboard();

  const isLoading = isLoadingDashboard || analyticsStats.isLoading;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const totalCapital = dashboardStats?.capitalOnStreet || 0;
  const totalProfit = dashboardStats?.realizedProfit || 0;
  const overdueCount = dashboardStats?.overdueContracts || 0;
  const activeContracts = dashboardStats?.activeContracts || 0;

  return (
    <MainLayout>
      <motion.div variants={pageVariants} initial="initial" animate="animate" transition={{ duration: 0.4 }}>
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
              {getGreeting()}{profile?.name ? `, ${profile.name.split(" ")[0]}` : ""}! 👋
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Aqui está o resumo da sua carteira de hoje.
            </p>
          </div>
          <PeriodSelector value={period} onChange={setPeriod} customRange={customRange} onCustomRangeChange={setCustomRange} />
        </div>

        {/* Quick Actions */}
        <motion.div className="mb-6 flex flex-wrap gap-2" variants={staggerContainer} initial="initial" animate="animate">
          {quickActions.map((action) => (
            <motion.div key={action.path} variants={staggerItem}>
              <Link
                to={action.path}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]",
                  "primary" in action && action.primary
                    ? "bg-gradient-gold text-primary-foreground shadow-gold"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                )}
              >
                <action.icon className="h-4 w-4" />
                {action.label}
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Summary Strip */}
        {isLoading ? (
          <div className="mb-6">
            <SkeletonMetricCards />
          </div>
        ) : (
          <motion.div
            className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3"
            variants={staggerContainer}
            initial="initial"
            animate="animate"
          >
            {[
              { icon: DollarSign, label: "Capital Ativo", value: fmt(totalCapital), color: "text-primary", border: "" },
              { icon: TrendingUp, label: "Lucro Total", value: fmt(totalProfit), color: "text-success", border: "" },
              { icon: FileText, label: "Contratos", value: activeContracts, color: "text-primary", border: "" },
              { icon: AlertTriangle, label: "Atrasados", value: overdueCount, color: overdueCount > 0 ? "text-destructive" : "text-foreground", border: overdueCount > 0 ? "border-destructive/30 bg-destructive/5" : "" },
            ].map((card) => (
              <motion.div
                key={card.label}
                variants={staggerItem}
                className={cn("glass-card rounded-xl p-3.5", card.border || "")}
              >
                <div className="flex items-center gap-2 mb-1">
                  <card.icon className={cn("h-3.5 w-3.5", card.color)} />
                  <span className="text-xs text-muted-foreground">{card.label}</span>
                </div>
                <p className={cn("font-display text-lg font-bold", card.color)}>{card.value}</p>
              </motion.div>
            ))}
          </motion.div>
        )}

        {isError ? (
          <QueryErrorState message="Erro ao carregar dashboard" onRetry={refetch} />
        ) : isLoading ? (
          <div className="space-y-6">
            <SkeletonChart />
            <div className="grid gap-6 lg:grid-cols-2">
              <SkeletonChart />
              <SkeletonChart />
            </div>
          </div>
        ) : (
          <>
            <AnalyticsCards stats={analyticsStats} variant="compact" />

            {/* Tabbed Sections */}
            <Tabs defaultValue="overview" className="mt-8">
              <TabsList className="bg-secondary/50">
                <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                <TabsTrigger value="analysis">Análise</TabsTrigger>
                <TabsTrigger value="goals">Metas</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6">
                <div className="grid gap-6 lg:grid-cols-3">
                  <div className="lg:col-span-2">
                    <RevenueChart />
                  </div>
                  <LoanFrequencyChart />
                </div>
              </TabsContent>

              <TabsContent value="analysis" className="mt-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  <ForecastChart />
                  <ReceivableForecastWidget />
                </div>
              </TabsContent>

              <TabsContent value="goals" className="mt-6">
                <GoalsDashboard />
              </TabsContent>
            </Tabs>

            <div className="mt-8">
              <OverdueList />
            </div>
          </>
        )}

        <OnboardingTour
          isOpen={isTourOpen}
          onClose={() => setTourOpen(false)}
          onComplete={() => setTourOpen(false)}
        />
      </motion.div>
    </MainLayout>
  );
};

export default Dashboard;

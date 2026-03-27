import { useState } from "react";
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
import { motion } from "framer-motion";
import {
  Sparkles, Loader2, Users, FileText, Calculator, BarChart3,
  TrendingUp, DollarSign, AlertTriangle,
} from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboard";
import { useAnalyticsStats, PeriodFilter } from "@/hooks/useAnalyticsStats";
import { useRealtimeDashboard } from "@/hooks/useRealtimeDashboard";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const quickActions = [
  { icon: Sparkles, label: "Novo Contrato", path: "/contratos/novo", primary: true },
  { icon: Users, label: "Clientes", path: "/clientes", primary: false },
  { icon: Calculator, label: "Simulador", path: "/simulador", primary: false },
  { icon: BarChart3, label: "Análises", path: "/analises", primary: false },
];

const Dashboard = () => {
  const [period, setPeriod] = useState<PeriodFilter>("all");
  const { profile } = useAuth();
  const { data: dashboardStats, isLoading: isLoadingDashboard } = useDashboardStats();
  const analyticsStats = useAnalyticsStats(period);
  const { isOpen: isTourOpen, setIsOpen: setTourOpen } = useOnboardingTour();

  useRealtimeDashboard();

  const isLoading = isLoadingDashboard || analyticsStats.isLoading;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };

  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  // Quick summary stats from dashboardStats
  const totalCapital = dashboardStats?.capitalOnStreet || 0;
  const totalProfit = dashboardStats?.realizedProfit || 0;
  const overdueCount = dashboardStats?.overdueContracts || 0;
  const activeContracts = dashboardStats?.activeContracts || 0;

  return (
    <MainLayout>
      {/* Header with greeting */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-2xl md:text-3xl font-bold text-foreground"
          >
            {getGreeting()}{profile?.name ? `, ${profile.name.split(" ")[0]}` : ""}! 👋
          </motion.h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Aqui está o resumo da sua carteira de hoje.
          </p>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      {/* Quick Actions */}
      <div className="mb-6 flex flex-wrap gap-2">
        {quickActions.map((action) => (
          <Link
            key={action.path}
            to={action.path}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98]",
              action.primary
                ? "bg-gradient-gold text-primary-foreground shadow-gold"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            <action.icon className="h-4 w-4" />
            {action.label}
          </Link>
        ))}
      </div>

      {/* Quick Summary Strip */}
      {!isLoading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          <div className="rounded-xl border border-border/50 bg-card p-3.5">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs text-muted-foreground">Capital Ativo</span>
            </div>
            <p className="font-display text-lg font-bold text-foreground">{fmt(totalCapital)}</p>
          </div>
          <div className="rounded-xl border border-border/50 bg-card p-3.5">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-3.5 w-3.5 text-success" />
              <span className="text-xs text-muted-foreground">Lucro Total</span>
            </div>
            <p className="font-display text-lg font-bold text-success">{fmt(totalProfit)}</p>
          </div>
          <div className="rounded-xl border border-border/50 bg-card p-3.5">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs text-muted-foreground">Contratos</span>
            </div>
            <p className="font-display text-lg font-bold text-foreground">{activeContracts}</p>
          </div>
          <div className={cn(
            "rounded-xl border p-3.5",
            overdueCount > 0 ? "border-destructive/30 bg-destructive/5" : "border-border/50 bg-card"
          )}>
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className={cn("h-3.5 w-3.5", overdueCount > 0 ? "text-destructive" : "text-muted-foreground")} />
              <span className="text-xs text-muted-foreground">Atrasados</span>
            </div>
            <p className={cn("font-display text-lg font-bold", overdueCount > 0 ? "text-destructive" : "text-foreground")}>{overdueCount}</p>
          </div>
        </motion.div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <AnalyticsCards stats={analyticsStats} variant="compact" />

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <RevenueChart />
            </div>
            <LoanFrequencyChart />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <ForecastChart />
            <ReceivableForecastWidget />
          </div>

          <div className="mt-8">
            <GoalsDashboard />
          </div>

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
    </MainLayout>
  );
};

export default Dashboard;

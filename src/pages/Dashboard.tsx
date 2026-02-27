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
import { Sparkles, Loader2, Users, FileText, Calculator, BarChart3 } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboard";
import { useAnalyticsStats, PeriodFilter } from "@/hooks/useAnalyticsStats";
import { useRealtimeDashboard } from "@/hooks/useRealtimeDashboard";
import { useAuth } from "@/contexts/AuthContext";

const quickActions = [
  { icon: Sparkles, label: "Novo Contrato", path: "/contratos/novo", color: "bg-gradient-gold text-primary-foreground shadow-gold" },
  { icon: Users, label: "Clientes", path: "/clientes", color: "bg-secondary text-secondary-foreground" },
  { icon: Calculator, label: "Simulador", path: "/simulador", color: "bg-secondary text-secondary-foreground" },
  { icon: BarChart3, label: "Análises", path: "/analises", color: "bg-secondary text-secondary-foreground" },
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

  return (
    <MainLayout>
      {/* Header with greeting */}
      <div className="mb-6">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
          {getGreeting()}{profile?.name ? `, ${profile.name.split(" ")[0]}` : ""}! 👋
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Aqui está o resumo da sua carteira de hoje.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="mb-6 flex flex-wrap gap-2">
        {quickActions.map((action) => (
          <Link
            key={action.path}
            to={action.path}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all hover:scale-[1.02] active:scale-[0.98] ${action.color}`}
          >
            <action.icon className="h-4 w-4" />
            {action.label}
          </Link>
        ))}
      </div>

      {/* Period Filter */}
      <div className="mb-6">
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

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

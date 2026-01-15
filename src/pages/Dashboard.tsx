import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { PortfolioHealthChart } from "@/components/dashboard/PortfolioHealthChart";
import { OverdueList } from "@/components/dashboard/OverdueList";
import { AnalyticsCards, PeriodSelector } from "@/components/dashboard/AnalyticsCards";
import { GoalsDashboard } from "@/components/dashboard/GoalsDashboard";
import { ForecastChart } from "@/components/dashboard/ForecastChart";
import { OnboardingTour, useOnboardingTour } from "@/components/tour/OnboardingTour";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Sparkles, Loader2 } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboard";
import { useAnalyticsStats, PeriodFilter } from "@/hooks/useAnalyticsStats";
import { useAuth } from "@/contexts/AuthContext";

const Dashboard = () => {
  const [period, setPeriod] = useState<PeriodFilter>("all");
  const { profile } = useAuth();
  const { data: dashboardStats, isLoading: isLoadingDashboard } = useDashboardStats();
  const analyticsStats = useAnalyticsStats(period);
  const { isOpen: isTourOpen, setIsOpen: setTourOpen } = useOnboardingTour();

  const isLoading = isLoadingDashboard || analyticsStats.isLoading;

  return (
    <MainLayout>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Dashboard
            </h1>
            <p className="mt-1 text-muted-foreground">
              Bem-vindo de volta{profile?.name ? `, ${profile.name.split(" ")[0]}` : ""}! Aqui está o resumo da sua carteira.
            </p>
          </div>
          
          <Link to="/contratos/novo">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 rounded-xl bg-gradient-gold px-5 py-3 font-medium text-primary-foreground shadow-gold transition-shadow hover:shadow-gold-lg"
            >
              <Sparkles className="h-5 w-5" />
              Novo Contrato
            </motion.button>
          </Link>
        </div>
      </motion.div>

      {/* Period Filter & KPI Cards */}
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

          {/* Charts Row */}
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <RevenueChart />
            </div>
            <PortfolioHealthChart 
              data={dashboardStats?.clientsByStatus || { ativo: 0, atraso: 0, quitado: 0 }}
            />
          </div>

          {/* Forecast Chart */}
          <div className="mt-8">
            <ForecastChart />
          </div>

          {/* Goals Dashboard */}
          <div className="mt-8">
            <GoalsDashboard />
          </div>

          {/* Overdue List */}
          <div className="mt-8">
            <OverdueList />
          </div>
        </>
      )}
      
      {/* Onboarding Tour */}
      <OnboardingTour 
        isOpen={isTourOpen} 
        onClose={() => setTourOpen(false)} 
        onComplete={() => setTourOpen(false)} 
      />
    </MainLayout>
  );
};

export default Dashboard;

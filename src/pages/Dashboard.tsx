import { MainLayout } from "@/components/layout/MainLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { PortfolioHealthChart } from "@/components/dashboard/PortfolioHealthChart";
import { OverdueList } from "@/components/dashboard/OverdueList";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Wallet,
  TrendingUp,
  AlertTriangle,
  FileText,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboard";
import { useAuth } from "@/contexts/AuthContext";

const Dashboard = () => {
  const { profile } = useAuth();
  const { data: stats, isLoading } = useDashboardStats();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

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

      {/* KPI Cards */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Capital na Rua"
              value={stats?.capitalOnStreet || 0}
              prefix="R$"
              icon={Wallet}
              variant="primary"
              delay={0}
            />
            <MetricCard
              title="Lucro Realizado"
              value={stats?.realizedProfit || 0}
              prefix="R$"
              icon={TrendingUp}
              variant="success"
              delay={0.1}
            />
            <MetricCard
              title="Taxa de Inadimplência"
              value={stats?.defaultRate || 0}
              suffix="%"
              icon={AlertTriangle}
              variant="warning"
              delay={0.2}
            />
            <MetricCard
              title="Contratos Ativos"
              value={stats?.activeContracts || 0}
              icon={FileText}
              variant="default"
              delay={0.3}
            />
          </div>

          {/* Charts Row */}
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <RevenueChart />
            </div>
            <PortfolioHealthChart 
              data={stats?.clientsByStatus || { ativo: 0, atraso: 0, quitado: 0 }}
            />
          </div>

          {/* Overdue List */}
          <div className="mt-8">
            <OverdueList />
          </div>
        </>
      )}
    </MainLayout>
  );
};

export default Dashboard;

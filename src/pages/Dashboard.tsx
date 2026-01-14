import { MainLayout } from "@/components/layout/MainLayout";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { PortfolioHealthChart } from "@/components/dashboard/PortfolioHealthChart";
import { OverdueList } from "@/components/dashboard/OverdueList";
import { motion } from "framer-motion";
import {
  Wallet,
  TrendingUp,
  AlertTriangle,
  FileText,
  Sparkles,
} from "lucide-react";

const Dashboard = () => {
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
              Bem-vindo de volta! Aqui está o resumo da sua carteira.
            </p>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 rounded-xl bg-gradient-gold px-5 py-3 font-medium text-primary-foreground shadow-gold transition-shadow hover:shadow-gold-lg"
          >
            <Sparkles className="h-5 w-5" />
            Novo Contrato
          </motion.button>
        </div>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Capital na Rua"
          value={284750}
          prefix="R$"
          icon={Wallet}
          trend={{ value: 12.5, isPositive: true }}
          variant="primary"
          delay={0}
        />
        <MetricCard
          title="Lucro Realizado"
          value={42380}
          prefix="R$"
          icon={TrendingUp}
          trend={{ value: 8.2, isPositive: true }}
          variant="success"
          delay={0.1}
        />
        <MetricCard
          title="Taxa de Inadimplência"
          value={4.8}
          suffix="%"
          icon={AlertTriangle}
          trend={{ value: 1.2, isPositive: false }}
          variant="warning"
          delay={0.2}
        />
        <MetricCard
          title="Contratos Ativos"
          value={127}
          icon={FileText}
          trend={{ value: 15, isPositive: true }}
          variant="default"
          delay={0.3}
        />
      </div>

      {/* Charts Row */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <PortfolioHealthChart />
      </div>

      {/* Overdue List */}
      <div className="mt-8">
        <OverdueList />
      </div>
    </MainLayout>
  );
};

export default Dashboard;

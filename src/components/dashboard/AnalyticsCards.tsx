import { motion } from "framer-motion";
import {
  FileText,
  FileCheck,
  FileClock,
  FileX,
  FileWarning,
  Users,
  UserCheck,
  UserX,
  UserPlus,
  Wallet,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  DollarSign,
  Percent,
  Target,
  BarChart3,
  ShieldAlert,
  Receipt,
  CheckCircle,
  XCircle,
  RefreshCw,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PeriodFilter } from "@/hooks/useAnalyticsStats";

const periodLabels: Record<PeriodFilter, string> = {
  "7d": "7 dias",
  "month": "Este mês",
  "quarter": "Trimestre",
  "year": "Este ano",
  "all": "Todo período",
};

interface PeriodSelectorProps {
  value: PeriodFilter;
  onChange: (period: PeriodFilter) => void;
}

export const PeriodSelector = ({ value, onChange }: PeriodSelectorProps) => {
  const periods: PeriodFilter[] = ["7d", "month", "quarter", "year", "all"];
  
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Calendar className="h-4 w-4" />
        <span className="text-sm font-medium">Período:</span>
      </div>
      <div className="flex gap-1 flex-wrap">
        {periods.map((period) => (
          <Button
            key={period}
            variant={value === period ? "default" : "outline"}
            size="sm"
            onClick={() => onChange(period)}
            className={cn(
              "h-8 px-3 text-xs font-medium transition-all",
              value === period && "shadow-md"
            )}
          >
            {periodLabels[period]}
          </Button>
        ))}
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "primary";
  delay?: number;
  size?: "sm" | "md";
}

const variantStyles = {
  default: "from-card to-card/50 border-border/50",
  success: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/30",
  warning: "from-amber-500/10 to-amber-500/5 border-amber-500/30",
  danger: "from-red-500/10 to-red-500/5 border-red-500/30",
  info: "from-blue-500/10 to-blue-500/5 border-blue-500/30",
  primary: "from-primary/10 to-primary/5 border-primary/30",
};

const iconStyles = {
  default: "text-muted-foreground",
  success: "text-emerald-500",
  warning: "text-amber-500",
  danger: "text-red-500",
  info: "text-blue-500",
  primary: "text-primary",
};

export const StatCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  variant = "default",
  delay = 0,
  size = "md"
}: StatCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={cn(
        "rounded-xl border bg-gradient-to-br p-4 transition-all hover:shadow-lg",
        variantStyles[variant],
        size === "sm" && "p-3"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-muted-foreground truncate",
            size === "sm" ? "text-xs" : "text-sm"
          )}>
            {title}
          </p>
          <p className={cn(
            "font-display font-bold text-foreground mt-1",
            size === "sm" ? "text-lg" : "text-2xl"
          )}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div className={cn(
          "rounded-lg p-2",
          variant === "default" ? "bg-secondary" : `bg-${variant}/10`
        )}>
          <Icon className={cn(
            size === "sm" ? "h-4 w-4" : "h-5 w-5",
            iconStyles[variant]
          )} />
        </div>
      </div>
    </motion.div>
  );
};

interface AnalyticsCardsProps {
  stats: {
    // Contratos
    totalContracts: number;
    activeContracts: number;
    inactiveContracts: number;
    completedContracts: number;
    overdueContracts: number;
    renegotiatedContracts: number;
    // Clientes
    totalClients: number;
    activeClients: number;
    overdueClients: number;
    settledClients: number;
    newClientsThisMonth: number;
    // Financeiro
    totalCapital: number;
    capitalOnStreet: number;
    totalProfit: number;
    realizedProfit: number;
    pendingProfit: number;
    averageTicket: number;
    averageRate: number;
    roi: number;
    // Parcelas
    totalInstallments: number;
    paidInstallments: number;
    pendingInstallments: number;
    overdueInstallments: number;
    // Inadimplência
    defaultRate: number;
    defaultValue: number;
    avgDaysOverdue: number;
    highRiskClients: number;
    // Crescimento
    contractsThisMonth: number;
    growthRate: number;
  };
  variant?: "full" | "compact";
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const AnalyticsCards = ({ stats, variant = "full" }: AnalyticsCardsProps) => {
  if (variant === "compact") {
    return (
      <div className="space-y-6">
        {/* Resumo Principal */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <StatCard
            title="Aporte na Rua"
            value={formatCurrency(stats.capitalOnStreet)}
            subtitle="Empréstimos ativos"
            icon={Wallet}
            variant="primary"
            delay={0}
          />
          <StatCard
            title="Lucro Recebido"
            value={formatCurrency(stats.realizedProfit)}
            subtitle="Contratos quitados"
            icon={TrendingUp}
            variant="success"
            delay={0.05}
          />
          <StatCard
            title="Lucro a Receber"
            value={formatCurrency(stats.pendingProfit)}
            subtitle="Contratos ativos"
            icon={DollarSign}
            variant="info"
            delay={0.1}
          />
          <StatCard
            title="Taxa Inadimplência"
            value={`${stats.defaultRate.toFixed(1)}%`}
            icon={AlertTriangle}
            variant={stats.defaultRate > 10 ? "danger" : stats.defaultRate > 5 ? "warning" : "success"}
            delay={0.15}
          />
        </div>

        {/* Cards Secundários */}
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-6">
          <StatCard
            title="Contratos"
            value={stats.totalContracts}
            icon={FileText}
            size="sm"
            delay={0.2}
          />
          <StatCard
            title="Em Atraso"
            value={stats.overdueContracts}
            icon={FileWarning}
            variant={stats.overdueContracts > 0 ? "danger" : "default"}
            size="sm"
            delay={0.25}
          />
          <StatCard
            title="Clientes"
            value={stats.totalClients}
            icon={Users}
            size="sm"
            delay={0.3}
          />
          <StatCard
            title="Devedores"
            value={stats.overdueClients}
            icon={UserX}
            variant={stats.overdueClients > 0 ? "warning" : "default"}
            size="sm"
            delay={0.35}
          />
          <StatCard
            title="Parcelas Pagas"
            value={stats.paidInstallments}
            icon={CheckCircle}
            variant="success"
            size="sm"
            delay={0.4}
          />
          <StatCard
            title="Parcelas Atrasadas"
            value={stats.overdueInstallments}
            icon={Clock}
            variant={stats.overdueInstallments > 0 ? "danger" : "default"}
            size="sm"
            delay={0.45}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Seção: Contratos */}
      <div>
        <h3 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Contratos
        </h3>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <StatCard
            title="Total"
            value={stats.totalContracts}
            icon={FileText}
            delay={0}
          />
          <StatCard
            title="Ativos"
            value={stats.activeContracts}
            icon={FileCheck}
            variant="success"
            delay={0.05}
          />
          <StatCard
            title="Em Atraso"
            value={stats.overdueContracts}
            icon={FileWarning}
            variant={stats.overdueContracts > 0 ? "danger" : "default"}
            delay={0.1}
          />
          <StatCard
            title="Quitados"
            value={stats.completedContracts}
            icon={CheckCircle}
            variant="info"
            delay={0.15}
          />
          <StatCard
            title="Inativos"
            value={stats.inactiveContracts}
            icon={FileX}
            delay={0.2}
          />
          <StatCard
            title="Renegociados"
            value={stats.renegotiatedContracts}
            icon={RefreshCw}
            variant="warning"
            delay={0.25}
          />
        </div>
      </div>

      {/* Seção: Clientes */}
      <div>
        <h3 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Clientes
        </h3>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          <StatCard
            title="Total"
            value={stats.totalClients}
            icon={Users}
            delay={0.3}
          />
          <StatCard
            title="Ativos"
            value={stats.activeClients}
            icon={UserCheck}
            variant="success"
            delay={0.35}
          />
          <StatCard
            title="Devedores"
            value={stats.overdueClients}
            subtitle={stats.overdueClients > 0 ? "Atenção necessária" : ""}
            icon={UserX}
            variant={stats.overdueClients > 0 ? "danger" : "default"}
            delay={0.4}
          />
          <StatCard
            title="Quitados"
            value={stats.settledClients}
            icon={CheckCircle}
            variant="info"
            delay={0.45}
          />
          <StatCard
            title="Novos (mês)"
            value={stats.newClientsThisMonth}
            icon={UserPlus}
            variant="primary"
            delay={0.5}
          />
        </div>
      </div>

      {/* Seção: Financeiro */}
      <div>
        <h3 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Financeiro
        </h3>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          <StatCard
            title="Aporte Total"
            value={formatCurrency(stats.totalCapital)}
            icon={Wallet}
            variant="primary"
            delay={0.55}
          />
          <StatCard
            title="Aporte na Rua"
            value={formatCurrency(stats.capitalOnStreet)}
            subtitle="Empréstimos ativos"
            icon={TrendingUp}
            variant="warning"
            delay={0.6}
          />
          <StatCard
            title="Lucro Recebido"
            value={formatCurrency(stats.realizedProfit)}
            subtitle="Contratos quitados"
            icon={TrendingUp}
            variant="success"
            delay={0.65}
          />
          <StatCard
            title="Lucro a Receber"
            value={formatCurrency(stats.pendingProfit)}
            subtitle="Contratos ativos"
            icon={DollarSign}
            variant="info"
            delay={0.7}
          />
          <StatCard
            title="Ticket Médio"
            value={formatCurrency(stats.averageTicket)}
            icon={Target}
            delay={0.75}
          />
          <StatCard
            title="Taxa Média"
            value={`${stats.averageRate.toFixed(1)}%`}
            icon={Percent}
            delay={0.8}
          />
          <StatCard
            title="ROI"
            value={`${stats.roi.toFixed(1)}%`}
            icon={BarChart3}
            variant={stats.roi > 0 ? "success" : "danger"}
            delay={0.85}
          />
          <StatCard
            title="Crescimento"
            value={`${stats.growthRate >= 0 ? "+" : ""}${stats.growthRate.toFixed(0)}%`}
            subtitle={`${stats.contractsThisMonth} contratos este mês`}
            icon={stats.growthRate >= 0 ? TrendingUp : TrendingDown}
            variant={stats.growthRate > 0 ? "success" : stats.growthRate < 0 ? "danger" : "default"}
            delay={0.9}
          />
        </div>
      </div>

      {/* Seção: Parcelas */}
      <div>
        <h3 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Receipt className="h-5 w-5 text-primary" />
          Parcelas
        </h3>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <StatCard
            title="Total"
            value={stats.totalInstallments}
            icon={Receipt}
            delay={0.95}
          />
          <StatCard
            title="Pagas"
            value={stats.paidInstallments}
            icon={CheckCircle}
            variant="success"
            delay={1}
          />
          <StatCard
            title="Pendentes"
            value={stats.pendingInstallments}
            icon={Clock}
            variant="info"
            delay={1.05}
          />
          <StatCard
            title="Atrasadas"
            value={stats.overdueInstallments}
            icon={XCircle}
            variant={stats.overdueInstallments > 0 ? "danger" : "default"}
            delay={1.1}
          />
        </div>
      </div>

      {/* Seção: Inadimplência */}
      <div>
        <h3 className="font-display text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-primary" />
          Inadimplência
        </h3>
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <StatCard
            title="Taxa de Inadimplência"
            value={`${stats.defaultRate.toFixed(1)}%`}
            icon={AlertTriangle}
            variant={stats.defaultRate > 10 ? "danger" : stats.defaultRate > 5 ? "warning" : "success"}
            delay={1.15}
          />
          <StatCard
            title="Valor em Atraso"
            value={formatCurrency(stats.defaultValue)}
            icon={DollarSign}
            variant={stats.defaultValue > 0 ? "danger" : "default"}
            delay={1.2}
          />
          <StatCard
            title="Média Dias Atraso"
            value={`${Math.round(stats.avgDaysOverdue)} dias`}
            icon={Clock}
            variant={stats.avgDaysOverdue > 30 ? "danger" : stats.avgDaysOverdue > 15 ? "warning" : "default"}
            delay={1.25}
          />
          <StatCard
            title="Alto Risco"
            value={stats.highRiskClients}
            subtitle="+30 dias de atraso"
            icon={ShieldAlert}
            variant={stats.highRiskClients > 0 ? "danger" : "success"}
            delay={1.3}
          />
        </div>
      </div>
    </div>
  );
};

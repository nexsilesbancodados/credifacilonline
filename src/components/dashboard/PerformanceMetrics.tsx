import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useContracts, useInstallments } from "@/hooks/useContracts";
import { useClients } from "@/hooks/useClients";
import {
  TrendingUp,
  Target,
  Clock,
  DollarSign,
  Users,
  BarChart3,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react";
import { differenceInDays, subMonths, isAfter } from "date-fns";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: string;
}

function MetricCard({ title, value, subtitle, icon, trend, trendValue, color = 'text-primary' }: MetricCardProps) {
  const TrendIcon = trend === 'up' ? ArrowUp : trend === 'down' ? ArrowDown : Minus;
  const trendColor = trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-muted-foreground';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-lg border bg-card"
    >
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-lg ${color.replace('text-', 'bg-')}/10`}>
          <div className={color}>{icon}</div>
        </div>
        {trend && trendValue && (
          <Badge variant="outline" className={trendColor}>
            <TrendIcon className="h-3 w-3 mr-1" />
            {trendValue}
          </Badge>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{title}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </div>
    </motion.div>
  );
}

export function PerformanceMetrics() {
  const { contracts = [] } = useContracts();
  const { installments = [] } = useInstallments();
  const { clients = [] } = useClients();

  const metrics = useMemo(() => {
    const now = new Date();
    const lastMonth = subMonths(now, 1);
    const twoMonthsAgo = subMonths(now, 2);

    // ROI Calculation - use 'capital' instead of 'principal_amount'
    const totalLent = contracts.reduce((sum, c) => sum + c.capital, 0);
    const totalReceived = installments
      .filter(i => i.status === 'Pago')
      .reduce((sum, i) => sum + i.amount_due + (i.fine || 0), 0);
    const expectedInterest = contracts.reduce((sum, c) => {
      const totalExpected = c.installment_value * c.installments;
      return sum + (totalExpected - c.capital);
    }, 0);
    const roi = totalLent > 0 ? ((totalReceived - totalLent) / totalLent) * 100 : 0;

    // Average Ticket
    const activeContracts = contracts.filter(c => c.status === 'Ativo');
    const averageTicket = activeContracts.length > 0 
      ? activeContracts.reduce((sum, c) => sum + c.capital, 0) / activeContracts.length 
      : 0;

    // Average Days Overdue
    const overdueInstallments = installments.filter(
      i => i.status === 'Atrasado' || 
      (i.status === 'Pendente' && new Date(i.due_date) < now)
    );
    const totalDaysOverdue = overdueInstallments.reduce((sum, i) => {
      return sum + differenceInDays(now, new Date(i.due_date));
    }, 0);
    const avgDaysOverdue = overdueInstallments.length > 0 
      ? totalDaysOverdue / overdueInstallments.length 
      : 0;

    // Recovery Rate
    const paidThisMonth = installments.filter(
      i => i.status === 'Pago' && i.payment_date && isAfter(new Date(i.payment_date), lastMonth)
    );
    const overdueLastMonth = installments.filter(
      i => new Date(i.due_date) < lastMonth && new Date(i.due_date) > twoMonthsAgo
    );
    const recoveryRate = overdueLastMonth.length > 0
      ? (paidThisMonth.filter(p => 
          overdueLastMonth.some(o => o.id === p.id)
        ).length / overdueLastMonth.length) * 100
      : 0;

    // Active Clients Ratio
    const activeClients = clients.filter(c => c.status === 'Ativo').length;
    const clientsRatio = clients.length > 0 
      ? (activeClients / clients.length) * 100 
      : 0;

    // Default Rate (Inadimplência) - uses 'Atraso' status
    const defaultedContracts = contracts.filter(c => c.status === 'Atraso').length;
    const defaultRate = contracts.length > 0 
      ? (defaultedContracts / contracts.length) * 100 
      : 0;

    // Collections Efficiency
    const totalDue = installments
      .filter(i => new Date(i.due_date) <= now)
      .reduce((sum, i) => sum + i.amount_due, 0);
    const totalPaid = installments
      .filter(i => i.status === 'Pago' && new Date(i.due_date) <= now)
      .reduce((sum, i) => sum + i.amount_due, 0);
    const collectionEfficiency = totalDue > 0 ? (totalPaid / totalDue) * 100 : 100;

    return {
      roi,
      averageTicket,
      avgDaysOverdue: Math.round(avgDaysOverdue),
      recoveryRate,
      clientsRatio,
      defaultRate,
      collectionEfficiency,
      totalLent,
      totalReceived,
    };
  }, [contracts, installments, clients]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Métricas de Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            title="ROI Acumulado"
            value={`${metrics.roi.toFixed(1)}%`}
            subtitle={`${formatCurrency(metrics.totalReceived)} recebido`}
            icon={<TrendingUp className="h-5 w-5" />}
            trend={metrics.roi > 0 ? 'up' : metrics.roi < 0 ? 'down' : 'neutral'}
            color="text-green-500"
          />

          <MetricCard
            title="Ticket Médio"
            value={formatCurrency(metrics.averageTicket)}
            subtitle="Por contrato ativo"
            icon={<DollarSign className="h-5 w-5" />}
            color="text-primary"
          />

          <MetricCard
            title="Dias em Atraso"
            value={`${metrics.avgDaysOverdue} dias`}
            subtitle="Média das parcelas"
            icon={<Clock className="h-5 w-5" />}
            trend={metrics.avgDaysOverdue > 30 ? 'down' : metrics.avgDaysOverdue < 15 ? 'up' : 'neutral'}
            color="text-orange-500"
          />

          <MetricCard
            title="Taxa Recuperação"
            value={`${metrics.recoveryRate.toFixed(0)}%`}
            subtitle="Último mês"
            icon={<Target className="h-5 w-5" />}
            trend={metrics.recoveryRate > 50 ? 'up' : 'down'}
            color="text-blue-500"
          />

          <MetricCard
            title="Clientes Ativos"
            value={`${metrics.clientsRatio.toFixed(0)}%`}
            subtitle="Da base total"
            icon={<Users className="h-5 w-5" />}
            color="text-purple-500"
          />

          <MetricCard
            title="Taxa Inadimplência"
            value={`${metrics.defaultRate.toFixed(1)}%`}
            subtitle="Contratos em default"
            icon={<TrendingUp className="h-5 w-5" />}
            trend={metrics.defaultRate < 5 ? 'up' : 'down'}
            trendValue={metrics.defaultRate < 5 ? 'Baixa' : 'Alta'}
            color="text-red-500"
          />

          <MetricCard
            title="Eficiência Cobrança"
            value={`${metrics.collectionEfficiency.toFixed(0)}%`}
            subtitle="Recebido vs vencido"
            icon={<BarChart3 className="h-5 w-5" />}
            trend={metrics.collectionEfficiency > 80 ? 'up' : 'down'}
            color="text-emerald-500"
          />

          <MetricCard
            title="Capital Emprestado"
            value={formatCurrency(metrics.totalLent)}
            subtitle="Total acumulado"
            icon={<DollarSign className="h-5 w-5" />}
            color="text-amber-500"
          />
        </div>
      </CardContent>
    </Card>
  );
}

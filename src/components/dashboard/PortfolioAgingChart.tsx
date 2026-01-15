import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useContracts } from "@/hooks/useContracts";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { Clock, AlertTriangle, TrendingDown } from "lucide-react";
import { differenceInDays } from "date-fns";

interface AgingBucket {
  name: string;
  range: string;
  value: number;
  amount: number;
  color: string;
  percentage: number;
}

export function PortfolioAgingChart() {
  const { installments = [] } = useContracts();

  const agingData = useMemo(() => {
    const overdueInstallments = installments.filter(
      inst => inst.status === 'overdue' || 
      (inst.status === 'pending' && new Date(inst.due_date) < new Date())
    );

    const buckets: Record<string, { count: number; amount: number }> = {
      '0-30': { count: 0, amount: 0 },
      '31-60': { count: 0, amount: 0 },
      '61-90': { count: 0, amount: 0 },
      '90+': { count: 0, amount: 0 },
    };

    overdueInstallments.forEach(inst => {
      const daysOverdue = differenceInDays(new Date(), new Date(inst.due_date));
      const amount = inst.amount + (inst.fine_amount || 0);

      if (daysOverdue <= 30) {
        buckets['0-30'].count++;
        buckets['0-30'].amount += amount;
      } else if (daysOverdue <= 60) {
        buckets['31-60'].count++;
        buckets['31-60'].amount += amount;
      } else if (daysOverdue <= 90) {
        buckets['61-90'].count++;
        buckets['61-90'].amount += amount;
      } else {
        buckets['90+'].count++;
        buckets['90+'].amount += amount;
      }
    });

    const totalAmount = Object.values(buckets).reduce((sum, b) => sum + b.amount, 0);

    const data: AgingBucket[] = [
      { 
        name: '0-30 dias', 
        range: '0-30',
        value: buckets['0-30'].count, 
        amount: buckets['0-30'].amount,
        color: '#22c55e',
        percentage: totalAmount > 0 ? (buckets['0-30'].amount / totalAmount) * 100 : 0
      },
      { 
        name: '31-60 dias', 
        range: '31-60',
        value: buckets['31-60'].count, 
        amount: buckets['31-60'].amount,
        color: '#eab308',
        percentage: totalAmount > 0 ? (buckets['31-60'].amount / totalAmount) * 100 : 0
      },
      { 
        name: '61-90 dias', 
        range: '61-90',
        value: buckets['61-90'].count, 
        amount: buckets['61-90'].amount,
        color: '#f97316',
        percentage: totalAmount > 0 ? (buckets['61-90'].amount / totalAmount) * 100 : 0
      },
      { 
        name: '90+ dias', 
        range: '90+',
        value: buckets['90+'].count, 
        amount: buckets['90+'].amount,
        color: '#ef4444',
        percentage: totalAmount > 0 ? (buckets['90+'].amount / totalAmount) * 100 : 0
      },
    ];

    return { buckets: data, totalAmount, totalCount: overdueInstallments.length };
  }, [installments]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  // Calculate PDD (Provisão para Devedores Duvidosos)
  const pdd = useMemo(() => {
    // Standard PDD percentages by aging
    const pddRates = {
      '0-30': 0.01, // 1%
      '31-60': 0.10, // 10%
      '61-90': 0.30, // 30%
      '90+': 0.50, // 50%
    };

    return agingData.buckets.reduce((sum, bucket) => {
      const rate = pddRates[bucket.range as keyof typeof pddRates] || 0;
      return sum + (bucket.amount * rate);
    }, 0);
  }, [agingData]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {data.value} parcela{data.value !== 1 ? 's' : ''}
          </p>
          <p className="text-sm font-medium text-primary">
            {formatCurrency(data.amount)}
          </p>
          <p className="text-xs text-muted-foreground">
            {data.percentage.toFixed(1)}% do total
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Aging de Carteira
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Chart */}
          <div className="h-[250px]">
            {agingData.totalCount > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={agingData.buckets.filter(b => b.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="amount"
                  >
                    {agingData.buckets.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Clock className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>Nenhum atraso registrado</p>
                </div>
              </div>
            )}
          </div>

          {/* Legend & Stats */}
          <div className="space-y-4">
            {/* Buckets */}
            <div className="space-y-2">
              {agingData.buckets.map((bucket, index) => (
                <motion.div
                  key={bucket.range}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: bucket.color }}
                    />
                    <span className="text-sm font-medium">{bucket.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(bucket.amount)}</p>
                    <p className="text-xs text-muted-foreground">
                      {bucket.value} parcela{bucket.value !== 1 ? 's' : ''}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* PDD */}
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-4 w-4 text-destructive" />
                <span className="text-sm font-medium">Provisão (PDD)</span>
              </div>
              <p className="text-xl font-bold text-destructive">
                {formatCurrency(pdd)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Estimativa de perdas baseada no aging
              </p>
            </div>

            {/* Total */}
            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">Total em Atraso</span>
              </div>
              <p className="text-xl font-bold">
                {formatCurrency(agingData.totalAmount)}
              </p>
              <p className="text-xs text-muted-foreground">
                {agingData.totalCount} parcela{agingData.totalCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

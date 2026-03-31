import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { useAllClients } from "@/hooks/useClients";
import { parseLocalDate } from "@/lib/dateUtils";
import { useInstallments } from "@/hooks/useContracts";
import { Award, Loader2 } from "lucide-react";

// Score calculation helper
function calculateClientScore(
  installments: any[],
  clientId: string
): { score: number; rating: string } {
  const clientInstallments = installments.filter((i) => i.client_id === clientId);

  if (clientInstallments.length === 0) {
    return { score: 50, rating: "C" };
  }

  const paidInstallments = clientInstallments.filter((i) => i.status === "Pago");
  const overdueInstallments = clientInstallments.filter((i) => i.status === "Atrasado");

  // Payment rate (40 points)
  const paymentRate = clientInstallments.length > 0 
    ? (paidInstallments.length / clientInstallments.length) * 40 
    : 20;

  // Overdue penalty (30 points max deduction)
  const overduePenalty = Math.min(overdueInstallments.length * 10, 30);

  // On-time payments bonus (30 points)
  const onTimePayments = paidInstallments.filter((i) => {
    if (!i.payment_date) return false;
    return parseLocalDate(i.payment_date) <= parseLocalDate(i.due_date);
  });
  const onTimeBonus = paidInstallments.length > 0 
    ? (onTimePayments.length / paidInstallments.length) * 30 
    : 15;

  const score = Math.round(Math.max(0, Math.min(100, paymentRate + onTimeBonus - overduePenalty)));

  let rating: string;
  if (score >= 90) rating = "A";
  else if (score >= 75) rating = "B";
  else if (score >= 50) rating = "C";
  else if (score >= 25) rating = "D";
  else rating = "E";

  return { score, rating };
}

export function ScoreDistributionChart() {
  const { data: clients = [], isLoading: isLoadingClients } = useAllClients();
  const { installments, isLoading: isLoadingInstallments } = useInstallments();

  const isLoading = isLoadingClients || isLoadingInstallments;

  const scoreData = useMemo(() => {
    if (!clients || !installments) return { distribution: [], averageScore: 0 };

    const ratings: Record<string, { count: number; color: string }> = {
      A: { count: 0, color: "hsl(142, 71%, 45%)" },
      B: { count: 0, color: "hsl(142, 71%, 55%)" },
      C: { count: 0, color: "hsl(45, 90%, 50%)" },
      D: { count: 0, color: "hsl(25, 80%, 50%)" },
      E: { count: 0, color: "hsl(0, 72%, 51%)" },
    };

    let totalScore = 0;

    clients.forEach((client) => {
      const { score, rating } = calculateClientScore(installments, client.id);
      ratings[rating].count++;
      totalScore += score;
    });

    const distribution = Object.entries(ratings).map(([rating, data]) => ({
      rating,
      count: data.count,
      color: data.color,
      percentage: clients.length > 0 ? Math.round((data.count / clients.length) * 100) : 0,
    }));

    return {
      distribution,
      averageScore: clients.length > 0 ? Math.round(totalScore / clients.length) : 0,
    };
  }, [clients, installments]);

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-6 h-80 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const ratingColors: Record<string, string> = {
    A: "text-success",
    B: "text-success/80",
    C: "text-warning",
    D: "text-orange-500",
    E: "text-destructive",
  };

  const getAverageRating = (score: number) => {
    if (score >= 90) return "A";
    if (score >= 75) return "B";
    if (score >= 50) return "C";
    if (score >= 25) return "D";
    return "E";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Award className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground">
              Distribuição de Score
            </h3>
            <p className="text-sm text-muted-foreground">
              Classificação dos clientes
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-2">
            <p className="text-2xl font-display font-bold text-foreground">
              {scoreData.averageScore}
            </p>
            <span
              className={`text-lg font-bold ${ratingColors[getAverageRating(scoreData.averageScore)]}`}
            >
              ({getAverageRating(scoreData.averageScore)})
            </span>
          </div>
          <p className="text-xs text-muted-foreground">média geral</p>
        </div>
      </div>

      <div className="flex items-center gap-8">
        {/* Pie Chart */}
        <div className="h-44 w-44 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={scoreData.distribution.filter((d) => d.count > 0)}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={70}
                paddingAngle={3}
                dataKey="count"
              >
                {scoreData.distribution
                  .filter((d) => d.count > 0)
                  .map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2">
          {scoreData.distribution.map((item) => (
            <div
              key={item.rating}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg font-display font-bold text-sm"
                  style={{ backgroundColor: item.color + "30", color: item.color }}
                >
                  {item.rating}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Rating {item.rating}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.rating === "A"
                      ? "Excelente"
                      : item.rating === "B"
                      ? "Bom"
                      : item.rating === "C"
                      ? "Regular"
                      : item.rating === "D"
                      ? "Atenção"
                      : "Crítico"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-display font-semibold text-foreground">
                  {item.count}
                </p>
                <p className="text-xs text-muted-foreground">{item.percentage}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

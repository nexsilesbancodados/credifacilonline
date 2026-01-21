import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useContracts } from "@/hooks/useContracts";
import { Loader2 } from "lucide-react";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

const FREQUENCY_LABELS: Record<string, string> = {
  mensal: "Mensal",
  diario: "Diário",
  semanal: "Semanal",
  quinzenal: "Quinzenal",
};

export function LoanFrequencyChart() {
  const { contracts, isLoading } = useContracts();

  const data = useMemo(() => {
    if (!contracts || contracts.length === 0) return [];

    const activeContracts = contracts.filter(
      (c) => c.status === "Ativo" || c.status === "Atraso"
    );

    const frequencyCounts: Record<string, number> = {};
    
    activeContracts.forEach((contract) => {
      const freq = contract.frequency || "mensal";
      frequencyCounts[freq] = (frequencyCounts[freq] || 0) + 1;
    });

    const total = activeContracts.length;
    
    return Object.entries(frequencyCounts).map(([frequency, count]) => ({
      name: FREQUENCY_LABELS[frequency] || frequency,
      value: count,
      percentage: total > 0 ? ((count / total) * 100).toFixed(1) : "0",
    }));
  }, [contracts]);

  if (isLoading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Distribuição por Frequência</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Distribuição por Frequência</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center">
          <p className="text-muted-foreground">Nenhum contrato ativo encontrado</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Distribuição por Frequência</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={4}
              dataKey="value"
              label={({ name, percentage }) => `${name}: ${percentage}%`}
              labelLine={false}
            >
              {data.map((_, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]}
                  className="stroke-background"
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload;
                  return (
                    <div className="rounded-lg border bg-background p-3 shadow-lg">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.value} contratos ({item.percentage}%)
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value) => (
                <span className="text-sm text-foreground">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

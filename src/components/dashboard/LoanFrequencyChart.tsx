import { useMemo, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useContracts } from "@/hooks/useContracts";
import { Loader2, User, Calendar, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

const COLORS = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

const FREQUENCY_LABELS: Record<string, string> = {
  mensal: "Mensal",
  diario: "Diário",
  semanal: "Semanal",
  quinzenal: "Quinzenal",
};

interface ContractWithClient {
  id: string;
  client_id: string;
  capital: number;
  total_amount: number;
  installments: number;
  frequency: string;
  status: string;
  created_at: string;
  clients?: {
    name: string;
    cpf: string;
  };
}

export function LoanFrequencyChart() {
  const { contracts, isLoading } = useContracts();
  const [selectedFrequency, setSelectedFrequency] = useState<string | null>(null);

  const { data, contractsByFrequency } = useMemo(() => {
    if (!contracts || contracts.length === 0) return { data: [], contractsByFrequency: {} };

    const activeContracts = contracts.filter(
      (c) => c.status === "Ativo" || c.status === "Atraso"
    ) as ContractWithClient[];

    const frequencyCounts: Record<string, number> = {};
    const grouped: Record<string, ContractWithClient[]> = {};
    
    activeContracts.forEach((contract) => {
      const freq = contract.frequency || "mensal";
      frequencyCounts[freq] = (frequencyCounts[freq] || 0) + 1;
      if (!grouped[freq]) grouped[freq] = [];
      grouped[freq].push(contract);
    });

    const total = activeContracts.length;
    
    const chartData = Object.entries(frequencyCounts).map(([frequency, count]) => ({
      name: FREQUENCY_LABELS[frequency] || frequency,
      frequency,
      value: count,
      percentage: total > 0 ? ((count / total) * 100).toFixed(1) : "0",
    }));

    return { data: chartData, contractsByFrequency: grouped };
  }, [contracts]);

  const handlePieClick = (entry: { frequency: string }) => {
    setSelectedFrequency(prev => prev === entry.frequency ? null : entry.frequency);
  };

  const selectedContracts = selectedFrequency ? contractsByFrequency[selectedFrequency] || [] : [];
  const selectedLabel = selectedFrequency ? FREQUENCY_LABELS[selectedFrequency] : "";

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
    <Card className="glass-card overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold">Distribuição por Frequência</CardTitle>
        <p className="text-xs text-muted-foreground">Clique em uma seção para ver os contratos</p>
      </CardHeader>
      <CardContent className="pb-4">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
              onClick={(_, index) => handlePieClick(data[index])}
              className="cursor-pointer"
              label={({ name, percentage }) => `${percentage}%`}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]}
                  className="stroke-background transition-all hover:opacity-80"
                  strokeWidth={2}
                  style={{
                    filter: selectedFrequency === entry.frequency ? "brightness(1.2)" : undefined,
                    transform: selectedFrequency === entry.frequency ? "scale(1.05)" : undefined,
                    transformOrigin: "center",
                  }}
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
                      <p className="mt-1 text-xs text-primary">Clique para expandir</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              onClick={(e) => {
                const freq = data.find(d => d.name === e.value)?.frequency;
                if (freq) setSelectedFrequency(prev => prev === freq ? null : freq);
              }}
              formatter={(value) => (
                <span className="cursor-pointer text-sm text-foreground hover:text-primary transition-colors">
                  {value}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Expanded Section */}
        <AnimatePresence>
          {selectedFrequency && selectedContracts.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-4 rounded-lg border bg-muted/30 p-3">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="font-medium">
                      {selectedLabel}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {selectedContracts.length} contrato{selectedContracts.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <button 
                    onClick={() => setSelectedFrequency(null)}
                    className="rounded-full p-1 hover:bg-muted transition-colors"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>

                <ScrollArea className="max-h-[200px]">
                  <div className="space-y-2">
                    {selectedContracts.map((contract) => (
                      <Link
                        key={contract.id}
                        to={`/clientes/${contract.client_id}`}
                        className="block"
                      >
                        <motion.div
                          initial={{ x: -10, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          className="flex items-center justify-between rounded-lg bg-background p-3 transition-all hover:bg-accent hover:shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                {contract.clients?.name || "Cliente"}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {format(new Date(contract.created_at), "dd/MM/yyyy", { locale: ptBR })}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-sm text-primary">
                              {contract.capital.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {contract.installments}x
                            </p>
                          </div>
                        </motion.div>
                      </Link>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

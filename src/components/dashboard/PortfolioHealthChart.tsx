import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const data = [
  { name: "Em Dia", value: 68, color: "hsl(142, 71%, 45%)" },
  { name: "Atraso", value: 22, color: "hsl(45, 90%, 50%)" },
  { name: "Quitados", value: 10, color: "hsl(46, 14%, 50%)" },
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg bg-popover border border-border px-3 py-2 shadow-lg">
        <p className="text-sm font-medium text-foreground">{payload[0].name}</p>
        <p className="text-lg font-bold text-primary">{payload[0].value}%</p>
      </div>
    );
  }
  return null;
};

export function PortfolioHealthChart() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-6"
    >
      <h3 className="font-display text-lg font-semibold text-foreground">
        Saúde da Carteira
      </h3>
      <p className="text-sm text-muted-foreground">Distribuição atual dos clientes</p>

      <div className="mt-4 flex items-center gap-6">
        <div className="h-48 w-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={4}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    className="transition-opacity hover:opacity-80"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-3">
          {data.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-muted-foreground">{item.name}</span>
              </div>
              <span className="font-display font-semibold text-foreground">
                {item.value}%
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

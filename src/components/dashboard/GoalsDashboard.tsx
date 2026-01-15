import { motion } from "framer-motion";
import { useState } from "react";
import { 
  Target, 
  TrendingUp, 
  Edit2, 
  Check,
  DollarSign,
} from "lucide-react";
import { useGoals, GoalProgress } from "@/hooks/useGoals";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GoalCardProps {
  goal: GoalProgress;
  onUpdateTarget: (target: number) => void;
}

function GoalCard({ goal, onUpdateTarget }: GoalCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(goal.target.toString());

  const handleSave = () => {
    const value = parseFloat(editValue);
    if (!isNaN(value) && value > 0) {
      onUpdateTarget(value);
    }
    setIsEditing(false);
  };

  const formatValue = (value: number, type: GoalProgress["type"]) => {
    if (type === "clients") {
      return value.toString();
    }
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      notation: "compact",
    }).format(value);
  };

  const isCompleted = goal.percentage >= 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl border p-5 transition-all",
        isCompleted 
          ? "border-success/50 bg-gradient-to-br from-success/10 to-transparent" 
          : "border-border/50 bg-gradient-to-br from-card to-card/50"
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{goal.icon}</span>
          <div>
            <p className="font-medium text-foreground">{goal.label}</p>
            {isEditing ? (
              <div className="flex items-center gap-2 mt-1">
                <Input
                  type="number"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="h-8 w-28 text-sm"
                  autoFocus
                />
                <Button size="sm" variant="ghost" onClick={handleSave}>
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Meta: {formatValue(goal.target, goal.type)}
                <button
                  onClick={() => setIsEditing(true)}
                  className="ml-2 text-primary hover:text-primary/80"
                >
                  <Edit2 className="h-3 w-3 inline" />
                </button>
              </p>
            )}
          </div>
        </div>
        {isCompleted && (
          <span className="flex items-center gap-1 text-xs font-medium text-success bg-success/20 px-2 py-1 rounded-full">
            <Check className="h-3 w-3" />
            Atingida!
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(goal.percentage, 100)}%` }}
            transition={{ duration: 1, delay: 0.2 }}
            className="absolute left-0 top-0 h-full rounded-full"
            style={{ backgroundColor: goal.color }}
          />
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {formatValue(goal.current, goal.type)}
          </span>
          <span 
            className="font-medium"
            style={{ color: goal.percentage >= 100 ? "hsl(142, 71%, 45%)" : goal.color }}
          >
            {goal.percentage}%
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export function GoalsDashboard() {
  const { goals, isLoading, updateGoal } = useGoals();

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-40 bg-secondary rounded" />
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-secondary/50 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const totalProgress = goals.length > 0
    ? Math.round(goals.reduce((sum, g) => sum + g.percentage, 0) / goals.length)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground">
              Metas do Mês
            </h3>
            <p className="text-sm text-muted-foreground">
              Progresso geral: {totalProgress}%
            </p>
          </div>
        </div>
        
        {/* Overall progress ring */}
        <div className="relative h-16 w-16">
          <svg className="h-16 w-16 -rotate-90 transform">
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="6"
              fill="transparent"
              className="text-secondary"
            />
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={`${totalProgress * 1.76} 176`}
              className="text-primary transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-foreground">{totalProgress}%</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {goals.map((goal) => (
          <GoalCard
            key={goal.type}
            goal={goal}
            onUpdateTarget={(target) => updateGoal({ type: goal.type, target })}
          />
        ))}
      </div>
    </motion.div>
  );
}

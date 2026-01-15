import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClientScoreBadgeProps {
  score: number;
  rating: "A" | "B" | "C" | "D" | "E";
  showScore?: boolean;
  size?: "sm" | "md" | "lg";
}

const ratingConfig = {
  A: { 
    label: "Excelente", 
    color: "bg-success/20 text-success border-success/30",
    bgColor: "bg-success",
  },
  B: { 
    label: "Bom", 
    color: "bg-primary/20 text-primary border-primary/30",
    bgColor: "bg-primary",
  },
  C: { 
    label: "Regular", 
    color: "bg-warning/20 text-warning border-warning/30",
    bgColor: "bg-warning",
  },
  D: { 
    label: "Ruim", 
    color: "bg-orange-500/20 text-orange-500 border-orange-500/30",
    bgColor: "bg-orange-500",
  },
  E: { 
    label: "Crítico", 
    color: "bg-destructive/20 text-destructive border-destructive/30",
    bgColor: "bg-destructive",
  },
};

const sizeConfig = {
  sm: "h-6 w-6 text-xs",
  md: "h-8 w-8 text-sm",
  lg: "h-12 w-12 text-lg",
};

export function ClientScoreBadge({ 
  score, 
  rating, 
  showScore = false,
  size = "md" 
}: ClientScoreBadgeProps) {
  const config = ratingConfig[rating];
  const sizeClass = sizeConfig[size];

  return (
    <div className="flex items-center gap-2">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={cn(
          "rounded-full font-bold flex items-center justify-center",
          config.bgColor,
          sizeClass,
          "text-white"
        )}
      >
        {rating}
      </motion.div>
      {showScore && (
        <div className="text-sm">
          <span className="font-medium text-foreground">{score}</span>
          <span className="text-muted-foreground">/100</span>
        </div>
      )}
    </div>
  );
}

interface ClientScoreCardProps {
  score: number;
  rating: "A" | "B" | "C" | "D" | "E";
  ratingLabel: string;
  factors: Array<{
    name: string;
    impact: "positive" | "negative" | "neutral";
    description: string;
  }>;
}

export function ClientScoreCard({ score, rating, ratingLabel, factors }: ClientScoreCardProps) {
  const config = ratingConfig[rating];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-5"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Score do Cliente
        </h3>
        <span className={cn("px-2 py-1 rounded-full text-xs font-medium border", config.color)}>
          {ratingLabel}
        </span>
      </div>

      {/* Score visualization */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative h-20 w-20">
          <svg className="h-20 w-20 -rotate-90 transform">
            <circle
              cx="40"
              cy="40"
              r="34"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-secondary"
            />
            <motion.circle
              cx="40"
              cy="40"
              r="34"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray="214"
              initial={{ strokeDashoffset: 214 }}
              animate={{ strokeDashoffset: 214 - (score / 100) * 214 }}
              transition={{ duration: 1, delay: 0.3 }}
              className={cn(
                rating === "A" && "text-success",
                rating === "B" && "text-primary",
                rating === "C" && "text-warning",
                rating === "D" && "text-orange-500",
                rating === "E" && "text-destructive"
              )}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-foreground">{score}</span>
          </div>
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={cn("text-3xl font-bold", config.bgColor.replace("bg-", "text-"))}>
              {rating}
            </span>
            <span className="text-lg text-muted-foreground">{ratingLabel}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {score >= 80 && "Cliente com excelente histórico"}
            {score >= 60 && score < 80 && "Cliente confiável"}
            {score >= 40 && score < 60 && "Cliente requer atenção"}
            {score >= 20 && score < 40 && "Cliente de alto risco"}
            {score < 20 && "Cliente em situação crítica"}
          </p>
        </div>
      </div>

      {/* Factors */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Fatores
        </p>
        {factors.map((factor, index) => (
          <div
            key={index}
            className="flex items-center gap-3 p-2 rounded-lg bg-secondary/30"
          >
            <div className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full",
              factor.impact === "positive" && "bg-success/20 text-success",
              factor.impact === "negative" && "bg-destructive/20 text-destructive",
              factor.impact === "neutral" && "bg-muted text-muted-foreground"
            )}>
              {factor.impact === "positive" && <TrendingUp className="h-3 w-3" />}
              {factor.impact === "negative" && <TrendingDown className="h-3 w-3" />}
              {factor.impact === "neutral" && <Minus className="h-3 w-3" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {factor.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {factor.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

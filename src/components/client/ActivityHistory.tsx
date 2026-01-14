import { motion } from "framer-motion";
import { 
  DollarSign, 
  MessageCircle, 
  Phone, 
  RefreshCw, 
  FileText,
  ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

type ActivityType = "payment" | "message" | "call" | "renegotiation" | "contract";

interface Activity {
  id: string;
  type: ActivityType;
  date: string;
  description: string;
  amount?: number;
}

interface ActivityHistoryProps {
  activities: Activity[];
}

const typeConfig = {
  payment: {
    icon: DollarSign,
    color: "text-success",
    bgColor: "bg-success/10",
    borderColor: "border-success/30",
  },
  message: {
    icon: MessageCircle,
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/30",
  },
  call: {
    icon: Phone,
    color: "text-accent",
    bgColor: "bg-accent/10",
    borderColor: "border-accent/30",
  },
  renegotiation: {
    icon: RefreshCw,
    color: "text-warning",
    bgColor: "bg-warning/10",
    borderColor: "border-warning/30",
  },
  contract: {
    icon: FileText,
    color: "text-muted-foreground",
    bgColor: "bg-secondary",
    borderColor: "border-border/50",
  },
};

export const ActivityHistory = ({ activities }: ActivityHistoryProps) => {
  return (
    <div className="relative max-h-[500px] overflow-y-auto pr-2">
      {/* Timeline line */}
      <div className="absolute left-5 top-0 bottom-0 w-px bg-border/50" />

      <div className="space-y-4">
        {activities.map((activity, index) => {
          const config = typeConfig[activity.type];
          const Icon = config.icon;

          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative flex gap-4 pl-2"
            >
              {/* Icon */}
              <div className={cn(
                "relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
                config.bgColor,
                config.borderColor
              )}>
                <Icon className={cn("h-4 w-4", config.color)} />
              </div>

              {/* Content */}
              <div className="flex-1 rounded-xl border border-border/50 bg-secondary/30 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm text-foreground">{activity.description}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(activity.date).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  {activity.amount && (
                    <p className={cn(
                      "font-display font-semibold",
                      activity.type === "payment" ? "text-success" : "text-foreground"
                    )}>
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(activity.amount)}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

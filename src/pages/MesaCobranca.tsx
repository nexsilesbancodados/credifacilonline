import { MainLayout } from "@/components/layout/MainLayout";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  Clock,
  AlertTriangle,
  CalendarClock,
  Phone,
  MessageCircle,
  Check,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TabType = "overdue" | "today" | "upcoming";

const mockInstallments = {
  overdue: [
    {
      id: "1",
      clientName: "Maria Santos",
      clientPhone: "(11) 98765-4321",
      dueDate: "10/01/2025",
      daysOverdue: 4,
      amount: 1250.0,
      installment: "4/12",
    },
    {
      id: "2",
      clientName: "Carlos Oliveira",
      clientPhone: "(11) 91234-5678",
      dueDate: "08/01/2025",
      daysOverdue: 6,
      amount: 890.0,
      installment: "2/6",
    },
    {
      id: "3",
      clientName: "José Pereira",
      clientPhone: "(11) 96789-0123",
      dueDate: "02/01/2025",
      daysOverdue: 12,
      amount: 1800.0,
      installment: "5/18",
    },
  ],
  today: [
    {
      id: "4",
      clientName: "Ana Paula",
      clientPhone: "(11) 99876-5432",
      dueDate: "14/01/2025",
      daysOverdue: 0,
      amount: 2100.0,
      installment: "7/24",
    },
    {
      id: "5",
      clientName: "Fernanda Costa",
      clientPhone: "(11) 95678-9012",
      dueDate: "14/01/2025",
      daysOverdue: 0,
      amount: 960.0,
      installment: "2/12",
    },
  ],
  upcoming: [
    {
      id: "6",
      clientName: "Roberto Lima",
      clientPhone: "(11) 94567-8901",
      dueDate: "15/01/2025",
      daysUntil: 1,
      amount: 650.0,
      installment: "2/3",
    },
    {
      id: "7",
      clientName: "Lucas Mendes",
      clientPhone: "(11) 93456-7890",
      dueDate: "17/01/2025",
      daysUntil: 3,
      amount: 1450.0,
      installment: "6/15",
    },
    {
      id: "8",
      clientName: "Patricia Souza",
      clientPhone: "(11) 92345-6789",
      dueDate: "20/01/2025",
      daysUntil: 6,
      amount: 780.0,
      installment: "3/8",
    },
  ],
};

const tabs = [
  {
    id: "overdue" as TabType,
    label: "Atrasados",
    icon: AlertTriangle,
    count: mockInstallments.overdue.length,
    color: "destructive",
  },
  {
    id: "today" as TabType,
    label: "Vencendo Hoje",
    icon: Clock,
    count: mockInstallments.today.length,
    color: "warning",
  },
  {
    id: "upcoming" as TabType,
    label: "Próximos",
    icon: CalendarClock,
    count: mockInstallments.upcoming.length,
    color: "success",
  },
];

const MesaCobranca = () => {
  const [activeTab, setActiveTab] = useState<TabType>("overdue");

  const currentData = mockInstallments[activeTab];

  return (
    <MainLayout>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Mesa de Cobrança
            </h1>
            <p className="mt-1 text-muted-foreground">
              Gerencie todas as parcelas pendentes
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-5 py-3 font-medium text-primary transition-colors hover:bg-primary/20"
          >
            <Sparkles className="h-5 w-5" />
            Agente IA
          </motion.button>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-6 flex gap-3"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative flex items-center gap-3 rounded-xl px-5 py-3 font-medium transition-all",
                isActive
                  ? "bg-card border border-primary/30 text-foreground"
                  : "bg-secondary/30 text-muted-foreground hover:bg-secondary/50"
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5",
                  isActive &&
                    (tab.color === "destructive"
                      ? "text-destructive"
                      : tab.color === "warning"
                      ? "text-warning"
                      : "text-success")
                )}
              />
              <span>{tab.label}</span>
              <span
                className={cn(
                  "flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-xs font-bold",
                  isActive
                    ? tab.color === "destructive"
                      ? "bg-destructive/20 text-destructive"
                      : tab.color === "warning"
                      ? "bg-warning/20 text-warning"
                      : "bg-success/20 text-success"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {tab.count}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute bottom-0 left-1/2 h-0.5 w-12 -translate-x-1/2 rounded-full bg-primary"
                />
              )}
            </button>
          );
        })}
      </motion.div>

      {/* Installments List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        key={activeTab}
        className="space-y-4"
      >
        {currentData.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
              "group flex items-center justify-between rounded-2xl border p-5 transition-all hover:scale-[1.01]",
              activeTab === "overdue"
                ? "border-destructive/30 bg-gradient-to-r from-destructive/10 to-transparent"
                : activeTab === "today"
                ? "border-warning/30 bg-gradient-to-r from-warning/10 to-transparent"
                : "border-border/50 bg-card"
            )}
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary font-display font-semibold text-foreground">
                {item.clientName.split(" ").map((n) => n[0]).join("")}
              </div>
              <div>
                <p className="font-medium text-foreground">{item.clientName}</p>
                <p className="text-sm text-muted-foreground">
                  Parcela {item.installment} • Vence em {item.dueDate}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-right">
                <p className="font-display text-xl font-bold text-foreground">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(item.amount)}
                </p>
                {"daysOverdue" in item && item.daysOverdue > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-destructive/20 px-2 py-0.5 text-xs font-medium text-destructive">
                    <AlertTriangle className="h-3 w-3" />
                    {item.daysOverdue} dias em atraso
                  </span>
                ) : "daysUntil" in item ? (
                  <span className="text-sm text-muted-foreground">
                    em {item.daysUntil} dia{item.daysUntil > 1 ? "s" : ""}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-warning/20 px-2 py-0.5 text-xs font-medium text-warning">
                    <Clock className="h-3 w-3" />
                    Vence hoje
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/20 text-success hover:bg-success/30 transition-colors"
                >
                  <Check className="h-5 w-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground transition-colors"
                >
                  <Phone className="h-5 w-5" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
                >
                  <MessageCircle className="h-5 w-5" />
                </motion.button>
              </div>

              <button className="flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* AI Agent Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mt-8 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 p-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold text-foreground">
                Agente de Cobrança IA
              </h3>
              <p className="text-sm text-muted-foreground">
                Automatize cobranças com mensagens personalizadas via WhatsApp
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Status</p>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-success/20 px-3 py-1 text-sm font-medium text-success">
                <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                Ativo
              </span>
            </div>
            <button className="rounded-xl bg-secondary px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary/80 transition-colors">
              Configurar
            </button>
          </div>
        </div>
      </motion.div>
    </MainLayout>
  );
};

export default MesaCobranca;

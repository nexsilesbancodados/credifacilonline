import { MainLayout } from "@/components/layout/MainLayout";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  Filter,
  Download,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TransactionCategory =
  | "Investimento"
  | "Dividendos"
  | "Aporte"
  | "Sangria"
  | "Pessoal"
  | "Marketing"
  | "Infraestrutura";

interface Transaction {
  id: string;
  date: string;
  description: string;
  category: TransactionCategory;
  amount: number;
  type: "income" | "expense";
}

const mockTransactions: Transaction[] = [
  {
    id: "1",
    date: "14/01/2025",
    description: "Pagamento - Maria Santos (Parcela 4/12)",
    category: "Dividendos",
    amount: 1250.0,
    type: "income",
  },
  {
    id: "2",
    date: "14/01/2025",
    description: "Novo empréstimo - Carlos Oliveira",
    category: "Investimento",
    amount: 8000.0,
    type: "expense",
  },
  {
    id: "3",
    date: "13/01/2025",
    description: "Aporte de capital",
    category: "Aporte",
    amount: 15000.0,
    type: "income",
  },
  {
    id: "4",
    date: "12/01/2025",
    description: "Pagamento - Ana Paula (Parcela 6/24)",
    category: "Dividendos",
    amount: 2100.0,
    type: "income",
  },
  {
    id: "5",
    date: "12/01/2025",
    description: "Retirada para despesas pessoais",
    category: "Sangria",
    amount: 3000.0,
    type: "expense",
  },
  {
    id: "6",
    date: "11/01/2025",
    description: "Novo empréstimo - Fernanda Costa",
    category: "Investimento",
    amount: 12000.0,
    type: "expense",
  },
];

const categoryColors: Record<TransactionCategory, string> = {
  Investimento: "bg-blue-500/20 text-blue-400",
  Dividendos: "bg-success/20 text-success",
  Aporte: "bg-primary/20 text-primary",
  Sangria: "bg-destructive/20 text-destructive",
  Pessoal: "bg-purple-500/20 text-purple-400",
  Marketing: "bg-pink-500/20 text-pink-400",
  Infraestrutura: "bg-cyan-500/20 text-cyan-400",
};

const Tesouraria = () => {
  const [showAddModal, setShowAddModal] = useState<"aporte" | "sangria" | null>(
    null
  );

  const cashInHand = 45780.0;
  const cashOnStreet = 284750.0;
  const totalProfit = 42380.0;

  const todayIncome = mockTransactions
    .filter((t) => t.type === "income" && t.date === "14/01/2025")
    .reduce((acc, t) => acc + t.amount, 0);

  const todayExpense = mockTransactions
    .filter((t) => t.type === "expense" && t.date === "14/01/2025")
    .reduce((acc, t) => acc + t.amount, 0);

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
              Tesouraria
            </h1>
            <p className="mt-1 text-muted-foreground">
              Controle seu fluxo de caixa
            </p>
          </div>

          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAddModal("aporte")}
              className="flex items-center gap-2 rounded-xl bg-success/20 px-5 py-3 font-medium text-success transition-colors hover:bg-success/30"
            >
              <Plus className="h-5 w-5" />
              Aporte
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAddModal("sangria")}
              className="flex items-center gap-2 rounded-xl bg-destructive/20 px-5 py-3 font-medium text-destructive transition-colors hover:bg-destructive/30"
            >
              <Minus className="h-5 w-5" />
              Sangria
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0 }}
          className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 to-primary/5 p-6"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Dinheiro em Caixa
            </p>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
          </div>
          <p className="mt-3 font-display text-3xl font-bold text-foreground">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(cashInHand)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Disponível para uso
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-6"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Dinheiro na Rua
            </p>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
              <TrendingUp className="h-5 w-5 text-foreground" />
            </div>
          </div>
          <p className="mt-3 font-display text-3xl font-bold text-foreground">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(cashOnStreet)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Capital emprestado</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="rounded-2xl border border-success/30 bg-gradient-to-br from-success/15 to-success/5 p-6"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Entradas Hoje
            </p>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/20">
              <ArrowUpRight className="h-5 w-5 text-success" />
            </div>
          </div>
          <p className="mt-3 font-display text-3xl font-bold text-success">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(todayIncome)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Recebimentos do dia
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="rounded-2xl border border-destructive/30 bg-gradient-to-br from-destructive/15 to-destructive/5 p-6"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Saídas Hoje
            </p>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/20">
              <ArrowDownRight className="h-5 w-5 text-destructive" />
            </div>
          </div>
          <p className="mt-3 font-display text-3xl font-bold text-destructive">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(todayExpense)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Empréstimos e saques
          </p>
        </motion.div>
      </div>

      {/* Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50"
      >
        <div className="flex items-center justify-between border-b border-border/50 p-6">
          <h2 className="font-display text-lg font-semibold text-foreground">
            Histórico de Transações
          </h2>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 rounded-xl bg-secondary/50 px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
              <Filter className="h-4 w-4" />
              Filtrar
            </button>
            <button className="flex items-center gap-2 rounded-xl bg-secondary/50 px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
              <Download className="h-4 w-4" />
              Exportar
            </button>
          </div>
        </div>

        <div className="divide-y divide-border/50">
          {mockTransactions.map((transaction, index) => (
            <motion.div
              key={transaction.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.05 }}
              className="flex items-center justify-between p-5 hover:bg-secondary/20 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-xl",
                    transaction.type === "income"
                      ? "bg-success/20"
                      : "bg-destructive/20"
                  )}
                >
                  {transaction.type === "income" ? (
                    <ArrowUpRight className="h-5 w-5 text-success" />
                  ) : (
                    <ArrowDownRight className="h-5 w-5 text-destructive" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {transaction.description}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {transaction.date}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium",
                    categoryColors[transaction.category]
                  )}
                >
                  {transaction.category}
                </span>
                <p
                  className={cn(
                    "font-display text-lg font-bold",
                    transaction.type === "income"
                      ? "text-success"
                      : "text-destructive"
                  )}
                >
                  {transaction.type === "income" ? "+" : "-"}
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(transaction.amount)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </MainLayout>
  );
};

export default Tesouraria;

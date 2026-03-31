import { MainLayout } from "@/components/layout/MainLayout";
import { motion } from "framer-motion";
import { useState } from "react";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { exportToExcel } from "@/lib/exportToExcel";
import {
  Wallet,
  TrendingUp,
  Plus,
  Minus,
  Filter,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Trash2,
  Target,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTreasury, CreateTransactionData } from "@/hooks/useTreasury";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO, isToday } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PermissionGate } from "@/components/auth/PermissionGate";

type TransactionCategory =
  | "Investimento"
  | "Dividendos"
  | "Aporte"
  | "Sangria"
  | "Pessoal"
  | "Marketing"
  | "Infraestrutura"
  | "Recebimento"
  | "Empréstimo"
  | "Legal"
  | "Outros";

const categoryColors: Record<string, string> = {
  Investimento: "bg-blue-500/20 text-blue-400",
  Dividendos: "bg-success/20 text-success",
  Aporte: "bg-primary/20 text-primary",
  Sangria: "bg-destructive/20 text-destructive",
  Pessoal: "bg-purple-500/20 text-purple-400",
  Marketing: "bg-pink-500/20 text-pink-400",
  Infraestrutura: "bg-cyan-500/20 text-cyan-400",
  Recebimento: "bg-success/20 text-success",
  Empréstimo: "bg-blue-500/20 text-blue-400",
  Legal: "bg-orange-500/20 text-orange-400",
  Outros: "bg-gray-500/20 text-gray-400",
};

const incomeCategories: TransactionCategory[] = ["Aporte", "Recebimento", "Dividendos", "Outros"];
const expenseCategories: TransactionCategory[] = ["Sangria", "Empréstimo", "Investimento", "Pessoal", "Marketing", "Infraestrutura", "Legal", "Outros"];

const Tesouraria = () => {
  const [showAddModal, setShowAddModal] = useState<"aporte" | "sangria" | null>(null);
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "",
    date: format(new Date(), "yyyy-MM-dd"),
  });

  const { 
    transactions, 
    summary, 
    capitalOnStreet, 
    pendingProfit,
    totalToReceive,
    isLoading, 
    isError,
    refetch,
    page,
    setPage,
    totalPages,
    createTransaction, 
    deleteTransaction,
    isCreating 
  } = useTreasury();
  const { toast } = useToast();

  const todayIncome = transactions
    .filter((t) => t.type === "entrada" && isToday(parseISO(t.date)))
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const todayExpense = transactions
    .filter((t) => t.type === "saida" && isToday(parseISO(t.date)))
    .reduce((acc, t) => acc + Number(t.amount), 0);

  const handleSubmit = () => {
    if (!formData.description || !formData.amount || !formData.category) return;

    const data: CreateTransactionData = {
      description: formData.description,
      amount: parseFloat(formData.amount),
      category: formData.category,
      type: showAddModal === "aporte" ? "entrada" : "saida",
      date: formData.date,
    };

    createTransaction(data);
    setShowAddModal(null);
    setFormData({
      description: "",
      amount: "",
      category: "",
      date: format(new Date(), "yyyy-MM-dd"),
    });
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  return (
    <MainLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">Tesouraria</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Saldo: <span className="font-semibold text-foreground">{isLoading ? "..." : formatCurrency(summary.balance)}</span> · 
            A receber: <span className="font-semibold text-success">{isLoading ? "..." : formatCurrency(totalToReceive)}</span>
          </p>
        </div>
        <PermissionGate permission="canManageTreasury">
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAddModal("aporte")}
              className="flex items-center gap-2 rounded-xl bg-success px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-success/20"
            >
              <Plus className="h-4 w-4" />
              Aporte
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAddModal("sangria")}
              className="flex items-center gap-2 rounded-xl bg-destructive px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-destructive/20"
            >
              <Minus className="h-4 w-4" />
              Sangria
            </motion.button>
          </div>
        </PermissionGate>
      </div>

      {/* Summary Cards - Principal */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0 }}
          className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 to-primary/5 p-6"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Carteira
            </p>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
          </div>
          <p className="mt-3 font-display text-3xl font-bold text-foreground">
            {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : formatCurrency(summary.balance)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Disponível para uso
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-2xl border-2 border-amber-500/50 bg-gradient-to-br from-amber-500/15 to-amber-500/5 p-6"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Total Emprestado (Aporte)
            </p>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20">
              <TrendingUp className="h-5 w-5 text-amber-500" />
            </div>
          </div>
          <p className="mt-3 font-display text-3xl font-bold text-amber-500">
            {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : formatCurrency(capitalOnStreet)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">Valor principal em contratos ativos</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="rounded-2xl border-2 border-emerald-500/50 bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 p-6"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Total a Receber
            </p>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20">
              <Target className="h-5 w-5 text-emerald-500" />
            </div>
          </div>
          <p className="mt-3 font-display text-3xl font-bold text-emerald-500">
            {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : formatCurrency(totalToReceive)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Aporte ({formatCurrency(capitalOnStreet)}) + Lucro ({formatCurrency(pendingProfit)})
          </p>
        </motion.div>
      </div>

      {/* Cards Secundários */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-500/15 to-blue-500/5 p-6"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Lucro a Receber
            </p>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20">
              <DollarSign className="h-5 w-5 text-blue-500" />
            </div>
          </div>
          <p className="mt-3 font-display text-2xl font-bold text-blue-500">
            {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : formatCurrency(pendingProfit)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">De contratos ativos</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
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
          <p className="mt-3 font-display text-2xl font-bold text-success">
            {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : formatCurrency(todayIncome)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Recebimentos do dia
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
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
          <p className="mt-3 font-display text-2xl font-bold text-destructive">
            {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : formatCurrency(todayExpense)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Empréstimos e saques
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-6"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Total Entradas
            </p>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
              <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
          <p className="mt-3 font-display text-2xl font-bold text-foreground">
            {isLoading ? <Loader2 className="h-8 w-8 animate-spin" /> : formatCurrency(summary.totalIn)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Desde o início
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
            <button 
              onClick={() => {
                const data = transactions.map(t => ({
                  Data: format(parseISO(t.date), "dd/MM/yyyy"),
                  Tipo: t.type === "entrada" ? "Entrada" : "Saída",
                  Categoria: t.category,
                  Descrição: t.description,
                  Valor: Number(t.amount),
                }));
                exportToExcel(data, "tesouraria", "Transações");
                toast({ title: "Exportado!", description: "Arquivo Excel gerado com sucesso." });
              }}
              className="flex items-center gap-2 rounded-xl bg-secondary/50 px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <Download className="h-4 w-4" />
              Exportar
            </button>
          </div>
        </div>

        <div className="divide-y divide-border/50">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Wallet className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Nenhuma transação encontrada</p>
              <p className="text-sm text-muted-foreground/70">
                Clique em "Aporte" ou "Sangria" para adicionar uma transação
              </p>
            </div>
          ) : (
            transactions.map((transaction, index) => (
              <motion.div
                key={transaction.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.03 }}
                className="flex items-center justify-between p-5 hover:bg-secondary/20 transition-colors group"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-xl",
                      transaction.type === "entrada"
                        ? "bg-success/20"
                        : "bg-destructive/20"
                    )}
                  >
                    {transaction.type === "entrada" ? (
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
                      {format(parseISO(transaction.date), "dd/MM/yyyy")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium",
                      categoryColors[transaction.category] || categoryColors.Outros
                    )}
                  >
                    {transaction.category}
                  </span>
                  <p
                    className={cn(
                      "font-display text-lg font-bold min-w-[120px] text-right",
                      transaction.type === "entrada"
                        ? "text-success"
                        : "text-destructive"
                    )}
                  >
                    {transaction.type === "entrada" ? "+" : "-"}
                    {formatCurrency(Number(transaction.amount))}
                  </p>
                  <button
                    onClick={() => deleteTransaction(transaction.id)}
                    className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      {/* Pagination */}
      <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />


      {/* Add Transaction Modal */}
      <Dialog open={showAddModal !== null} onOpenChange={() => setShowAddModal(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {showAddModal === "aporte" ? "Registrar Aporte" : "Registrar Sangria"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                placeholder="Ex: Aporte de capital inicial"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0,00"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {(showAddModal === "aporte" ? incomeCategories : expenseCategories).map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowAddModal(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isCreating || !formData.description || !formData.amount || !formData.category}
              className={showAddModal === "aporte" ? "bg-success hover:bg-success/90" : "bg-destructive hover:bg-destructive/90"}
            >
              {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      </motion.div>
    </MainLayout>
  );
};

export default Tesouraria;

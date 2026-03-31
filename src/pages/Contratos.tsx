import { MainLayout } from "@/components/layout/MainLayout";
import { motion } from "framer-motion";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useDebounce } from "@/hooks/useDebounce";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { exportToExcel } from "@/lib/exportToExcel";
import { format } from "date-fns";
import {
  Search, Plus, FileText, Calendar, DollarSign, TrendingUp,
  ChevronRight, RefreshCw, Clock, CheckCircle2,
  AlertTriangle, Download,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useContracts } from "@/hooks/useContracts";
import { useClients } from "@/hooks/useClients";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { Progress } from "@/components/ui/progress";
import { QueryErrorState } from "@/components/QueryErrorState";

const statusConfig = {
  Ativo: { style: "bg-success/15 text-success border-success/30", icon: CheckCircle2, label: "Ativo" },
  Atraso: { style: "bg-destructive/15 text-destructive border-destructive/30", icon: AlertTriangle, label: "Atraso" },
  Quitado: { style: "bg-accent/15 text-accent-foreground border-accent/30", icon: CheckCircle2, label: "Quitado" },
  Renegociado: { style: "bg-muted/20 text-muted-foreground border-border", icon: RefreshCw, label: "Renegociado" },
};

const frequencyLabels: Record<string, string> = {
  diario: "Diário", semanal: "Semanal", quinzenal: "Quinzenal", mensal: "Mensal",
};

type SortKey = "date" | "amount" | "client";

const Contratos = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<SortKey>("date");
  const { contracts, isLoading, isError, refetch } = useContracts();
  const { clients } = useClients();

  const clientsMap = clients.reduce((acc, client) => {
    acc[client.id] = client;
    return acc;
  }, {} as Record<string, typeof clients[0]>);

  const filteredContracts = contracts
    .filter((contract) => {
      const client = clientsMap[contract.client_id];
      const matchesSearch =
        client?.name.toLowerCase().includes(search.toLowerCase()) ||
        contract.id.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || contract.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "date") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === "amount") return b.total_amount - a.total_amount;
      const nameA = clientsMap[a.client_id]?.name || "";
      const nameB = clientsMap[b.client_id]?.name || "";
      return nameA.localeCompare(nameB, "pt-BR");
    });

  const stats = {
    total: contracts.length,
    ativos: contracts.filter((c) => c.status === "Ativo").length,
    atraso: contracts.filter((c) => c.status === "Atraso").length,
    quitados: contracts.filter((c) => c.status === "Quitado").length,
    renegociados: contracts.filter((c) => c.status === "Renegociado").length,
    totalCapital: contracts.reduce((sum, c) => sum + c.capital, 0),
    totalLucro: contracts.reduce((sum, c) => sum + c.total_profit, 0),
    totalAmount: contracts.reduce((sum, c) => sum + c.total_amount, 0),
  };

  const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact" }).format(v);
  const fmtFull = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  const statusButtons = [
    { key: "all", label: "Todos", count: stats.total },
    { key: "Ativo", label: "Ativos", count: stats.ativos },
    { key: "Atraso", label: "Atraso", count: stats.atraso },
    { key: "Quitado", label: "Quitados", count: stats.quitados },
  ];

  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">Contratos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {stats.total} contratos · {fmt(stats.totalCapital)} em capital
          </p>
        </div>
        <PermissionGate permission="canCreateContracts">
          <Link to="/contratos/novo">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 rounded-xl bg-gradient-gold px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-gold transition-shadow hover:shadow-gold-lg"
            >
              <Plus className="h-4 w-4" />
              Novo Contrato
            </motion.button>
          </Link>
        </PermissionGate>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { icon: FileText, label: "Total", value: stats.total, sub: `${stats.ativos} ativos`, color: "text-foreground" },
          { icon: DollarSign, label: "Capital Emprestado", value: fmt(stats.totalCapital), color: "text-primary" },
          { icon: TrendingUp, label: "Lucro Previsto", value: fmt(stats.totalLucro), color: "text-success" },
          { icon: RefreshCw, label: "Renegociados", value: stats.renegociados, sub: `${stats.quitados} quitados`, color: "text-muted-foreground" },
        ].map((card) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border/50 bg-card p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <card.icon className={`h-4 w-4 ${card.color}`} />
              <span className="text-xs text-muted-foreground">{card.label}</span>
            </div>
            <p className={`font-display text-xl font-bold ${card.color}`}>{card.value}</p>
            {card.sub && <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>}
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por cliente ou ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 rounded-xl border border-border bg-secondary/50 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex gap-1 rounded-xl bg-secondary/50 p-1">
          {statusButtons.map((s) => (
            <button
              key={s.key}
              onClick={() => setStatusFilter(s.key)}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-medium transition-all flex items-center gap-1.5",
                statusFilter === s.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {s.label}
              <span className={cn(
                "text-xs rounded-full px-1.5 py-0.5",
                statusFilter === s.key ? "bg-primary-foreground/20" : "bg-secondary"
              )}>
                {s.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex gap-1.5">
          {(["date", "amount", "client"] as SortKey[]).map((key) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={cn(
                "h-10 px-3 rounded-lg text-xs font-medium transition-all border",
                sortBy === key
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border bg-secondary/50 text-muted-foreground hover:text-foreground"
              )}
            >
              {key === "date" ? "Data" : key === "amount" ? "Valor" : "Nome"}
            </button>
          ))}
        </div>
      </div>

      {/* Contracts List */}
      <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
      {isError ? (
          <QueryErrorState message="Erro ao carregar contratos" onRetry={refetch} />
        ) : isLoading ? (
          <div className="divide-y divide-border/30">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4">
                <div className="h-11 w-11 rounded-xl bg-muted animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 rounded bg-muted animate-pulse" />
                  <div className="h-3 w-56 rounded bg-muted animate-pulse" />
                </div>
                <div className="hidden md:block w-24">
                  <div className="h-1.5 rounded bg-muted animate-pulse" />
                </div>
                <div className="text-right space-y-1">
                  <div className="h-5 w-24 rounded bg-muted animate-pulse" />
                  <div className="h-3 w-16 rounded bg-muted animate-pulse ml-auto" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredContracts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary/50 mx-auto">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mt-4 font-medium text-foreground">Nenhum contrato encontrado</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {search ? "Ajuste os filtros de busca" : "Crie seu primeiro contrato para começar"}
            </p>
            {!search && (
              <Link to="/contratos/novo">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-gold px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-gold"
                >
                  <Plus className="h-4 w-4" />
                  Novo Contrato
                </motion.button>
              </Link>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {filteredContracts.map((contract, index) => {
              const client = clientsMap[contract.client_id];
              const config = statusConfig[contract.status as keyof typeof statusConfig] || statusConfig.Ativo;
              const StatusIcon = config.icon;
              const progressPct = contract.status === "Quitado" ? 100 : Math.round((1 - contract.total_profit / contract.total_amount) * 100);

              return (
                <motion.div
                  key={contract.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.03 }}
                  className="group p-4 hover:bg-secondary/20 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl flex-shrink-0", config.style)}>
                      <StatusIcon className="h-5 w-5" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-medium text-foreground truncate">
                          {client?.name || "Cliente não encontrado"}
                        </h3>
                        <span className={cn("rounded-full border px-2 py-0.5 text-xs font-medium flex-shrink-0", config.style)}>
                          {contract.status}
                        </span>
                        {contract.renegotiated_from_id && (
                          <span className="flex items-center gap-1 text-xs text-primary">
                            <RefreshCw className="h-3 w-3" />
                            Renegociado
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(contract.start_date).toLocaleDateString("pt-BR")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {contract.installments}x {frequencyLabels[contract.frequency] || contract.frequency}
                        </span>
                        <span>{contract.interest_rate}% a.m.</span>
                      </div>
                    </div>

                    {/* Progress mini bar (hidden on mobile) */}
                    <div className="hidden md:block w-24">
                      <Progress value={progressPct} className="h-1.5" />
                      <p className="text-xs text-muted-foreground mt-1 text-center">{progressPct}%</p>
                    </div>

                    {/* Values */}
                    <div className="text-right flex-shrink-0">
                      <p className="font-display text-base font-bold text-foreground">
                        {fmtFull(contract.total_amount)}
                      </p>
                      <p className="text-xs text-success font-medium">
                        +{fmtFull(contract.total_profit)} lucro
                      </p>
                    </div>

                    {/* Arrow */}
                    {client && (
                      <Link
                        to={`/clientes/${client.id}`}
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Link>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer count */}
      {filteredContracts.length > 0 && (
        <p className="text-xs text-muted-foreground mt-3 text-center">
          Mostrando {filteredContracts.length} de {contracts.length} contratos
        </p>
      )}
    </MainLayout>
  );
};

export default Contratos;
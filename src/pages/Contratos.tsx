import { MainLayout } from "@/components/layout/MainLayout";
import { motion } from "framer-motion";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Plus,
  FileText,
  Calendar,
  DollarSign,
  TrendingUp,
  Filter,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useContracts } from "@/hooks/useContracts";
import { useClients } from "@/hooks/useClients";
import { PermissionGate } from "@/components/auth/PermissionGate";

const statusStyles = {
  Ativo: "bg-success/20 text-success border-success/30",
  Atraso: "bg-destructive/20 text-destructive border-destructive/30",
  Quitado: "bg-accent/20 text-accent border-accent/30",
  Renegociado: "bg-muted/20 text-muted-foreground border-border",
};

const frequencyLabels = {
  diario: "Diário",
  semanal: "Semanal",
  mensal: "Mensal",
};

const Contratos = () => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { contracts, isLoading } = useContracts();
  const { clients } = useClients();

  const clientsMap = clients.reduce((acc, client) => {
    acc[client.id] = client;
    return acc;
  }, {} as Record<string, typeof clients[0]>);

  const filteredContracts = contracts.filter((contract) => {
    const client = clientsMap[contract.client_id];
    const matchesSearch =
      client?.name.toLowerCase().includes(search.toLowerCase()) ||
      contract.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || contract.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: contracts.length,
    ativos: contracts.filter((c) => c.status === "Ativo").length,
    atraso: contracts.filter((c) => c.status === "Atraso").length,
    quitados: contracts.filter((c) => c.status === "Quitado").length,
    renegociados: contracts.filter((c) => c.status === "Renegociado").length,
    totalCapital: contracts.reduce((sum, c) => sum + c.capital, 0),
    totalLucro: contracts.reduce((sum, c) => sum + c.total_profit, 0),
  };

  return (
    <MainLayout>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Contratos
            </h1>
            <p className="text-muted-foreground">
              Gerencie todos os contratos de empréstimo
            </p>
          </div>
          <PermissionGate permission="canCreateContracts">
            <Link to="/contratos/novo">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 rounded-xl bg-gradient-gold px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-gold transition-shadow hover:shadow-gold"
              >
                <Plus className="h-4 w-4" />
                Novo Contrato
              </motion.button>
            </Link>
          </PermissionGate>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
      >
        <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Total</span>
          </div>
          <p className="font-display text-2xl font-bold text-foreground">{stats.total}</p>
          <div className="flex gap-2 mt-1 text-xs">
            <span className="text-success">{stats.ativos} ativos</span>
            <span className="text-destructive">{stats.atraso} atraso</span>
          </div>
        </div>

        <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">Capital</span>
          </div>
          <p className="font-display text-2xl font-bold text-foreground">
            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact" }).format(stats.totalCapital)}
          </p>
        </div>

        <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-success" />
            <span className="text-xs text-muted-foreground">Lucro Previsto</span>
          </div>
          <p className="font-display text-2xl font-bold text-success">
            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact" }).format(stats.totalLucro)}
          </p>
        </div>

        <div className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Renegociados</span>
          </div>
          <p className="font-display text-2xl font-bold text-foreground">{stats.renegociados}</p>
          <p className="text-xs text-muted-foreground mt-1">{stats.quitados} quitados</p>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-3 mb-6"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por cliente ou ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 rounded-xl border border-border bg-secondary/50 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 rounded-xl border border-border bg-secondary/50 px-4 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">Todos os status</option>
            <option value="Ativo">Ativo</option>
            <option value="Atraso">Atraso</option>
            <option value="Quitado">Quitado</option>
            <option value="Renegociado">Renegociado</option>
          </select>
        </div>
      </motion.div>

      {/* Contracts List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 overflow-hidden"
      >
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Carregando...</div>
        ) : filteredContracts.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            Nenhum contrato encontrado
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {filteredContracts.map((contract, index) => {
              const client = clientsMap[contract.client_id];
              return (
                <motion.div
                  key={contract.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="p-4 hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-foreground truncate">
                            {client?.name || "Cliente não encontrado"}
                          </h3>
                          <span
                            className={cn(
                              "rounded-full border px-2 py-0.5 text-xs font-medium",
                              statusStyles[contract.status as keyof typeof statusStyles]
                            )}
                          >
                            {contract.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(contract.start_date).toLocaleDateString("pt-BR")}
                          </span>
                          <span>
                            {contract.installments}x {frequencyLabels[contract.frequency as keyof typeof frequencyLabels]}
                          </span>
                          <span>{contract.interest_rate}% a.m.</span>
                          {contract.renegotiated_from_id && (
                            <span className="text-primary">Renegociado</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="font-display text-lg font-bold text-foreground">
                          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(contract.total_amount)}
                        </p>
                        <p className="text-xs text-success">
                          +{new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(contract.total_profit)}
                        </p>
                      </div>

                      {client && (
                        <Link
                          to={`/clientes/${client.id}`}
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </MainLayout>
  );
};

export default Contratos;

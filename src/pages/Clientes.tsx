import { MainLayout } from "@/components/layout/MainLayout";
import { motion } from "framer-motion";
import { useState } from "react";
import {
  Search,
  Filter,
  Grid3X3,
  List,
  Plus,
  Phone,
  Mail,
  MoreVertical,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "Todos" | "Ativo" | "Atraso" | "Quitado";
type ViewMode = "grid" | "list";

const mockClients = [
  {
    id: "1",
    name: "Maria Santos",
    cpf: "123.456.789-00",
    email: "maria@email.com",
    phone: "(11) 98765-4321",
    status: "Ativo" as const,
    totalLoan: 15000,
    pendingAmount: 8500,
    progress: 43,
    avatar: "MS",
  },
  {
    id: "2",
    name: "Carlos Oliveira",
    cpf: "987.654.321-00",
    email: "carlos@email.com",
    phone: "(11) 91234-5678",
    status: "Atraso" as const,
    totalLoan: 8000,
    pendingAmount: 5200,
    progress: 35,
    avatar: "CO",
  },
  {
    id: "3",
    name: "Ana Paula Silva",
    cpf: "456.789.123-00",
    email: "ana@email.com",
    phone: "(11) 99876-5432",
    status: "Ativo" as const,
    totalLoan: 25000,
    pendingAmount: 12000,
    progress: 52,
    avatar: "AP",
  },
  {
    id: "4",
    name: "Roberto Lima",
    cpf: "321.654.987-00",
    email: "roberto@email.com",
    phone: "(11) 94567-8901",
    status: "Quitado" as const,
    totalLoan: 5000,
    pendingAmount: 0,
    progress: 100,
    avatar: "RL",
  },
  {
    id: "5",
    name: "Fernanda Costa",
    cpf: "789.123.456-00",
    email: "fernanda@email.com",
    phone: "(11) 95678-9012",
    status: "Ativo" as const,
    totalLoan: 12000,
    pendingAmount: 9600,
    progress: 20,
    avatar: "FC",
  },
  {
    id: "6",
    name: "José Pereira",
    cpf: "654.321.987-00",
    email: "jose@email.com",
    phone: "(11) 96789-0123",
    status: "Atraso" as const,
    totalLoan: 18000,
    pendingAmount: 14400,
    progress: 20,
    avatar: "JP",
  },
];

const statusStyles = {
  Ativo: "bg-success/20 text-success border-success/30",
  Atraso: "bg-destructive/20 text-destructive border-destructive/30",
  Quitado: "bg-accent/20 text-accent border-accent/30",
};

const Clientes = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<Status>("Todos");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const filters: Status[] = ["Todos", "Ativo", "Atraso", "Quitado"];

  const filteredClients = mockClients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.cpf.includes(searchQuery);
    const matchesFilter =
      activeFilter === "Todos" || client.status === activeFilter;
    return matchesSearch && matchesFilter;
  });

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
              Clientes
            </h1>
            <p className="mt-1 text-muted-foreground">
              Gerencie todos os seus clientes em um só lugar
            </p>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 rounded-xl bg-gradient-gold px-5 py-3 font-medium text-primary-foreground shadow-gold transition-shadow hover:shadow-gold-lg"
          >
            <Plus className="h-5 w-5" />
            Novo Cliente
          </motion.button>
        </div>
      </motion.div>

      {/* Filters Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nome ou CPF..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-64 rounded-xl border border-border bg-secondary/50 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Status Filters */}
          <div className="flex gap-1 rounded-xl bg-secondary/50 p-1">
            {filters.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={cn(
                  "rounded-lg px-4 py-2 text-sm font-medium transition-all",
                  activeFilter === filter
                    ? "bg-primary text-primary-foreground shadow-gold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
              viewMode === "grid"
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:bg-secondary"
            )}
          >
            <Grid3X3 className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
              viewMode === "list"
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:bg-secondary"
            )}
          >
            <List className="h-5 w-5" />
          </button>
        </div>
      </motion.div>

      {/* Client Grid/List */}
      {viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client, index) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ y: -4 }}
              className="group relative cursor-pointer rounded-2xl border border-border/50 bg-gradient-to-br from-card to-card/50 p-5 transition-all hover:border-primary/30"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-gold font-display font-bold text-primary-foreground">
                    {client.avatar}
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{client.name}</h3>
                    <p className="text-sm text-muted-foreground">{client.cpf}</p>
                  </div>
                </div>
                <span
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                    statusStyles[client.status]
                  )}
                >
                  {client.status}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Valor Pendente</span>
                  <span className="font-display font-semibold text-foreground">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(client.pendingAmount)}
                  </span>
                </div>

                <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${client.progress}%` }}
                    transition={{ duration: 1, delay: index * 0.1 }}
                    className={cn(
                      "absolute left-0 top-0 h-full rounded-full",
                      client.status === "Quitado"
                        ? "bg-success"
                        : client.status === "Atraso"
                        ? "bg-destructive"
                        : "bg-primary"
                    )}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-right">
                  {client.progress}% pago
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-4">
                <div className="flex gap-2">
                  <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                    <Phone className="h-4 w-4" />
                  </button>
                  <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                    <Mail className="h-4 w-4" />
                  </button>
                </div>
                <button className="flex items-center gap-1 text-sm text-primary hover:underline">
                  Ver Dossiê
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Hover glow */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent" />
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
          <table className="w-full">
            <thead className="bg-secondary/30">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Cliente
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  CPF
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-sm font-medium text-muted-foreground">
                  Valor Pendente
                </th>
                <th className="px-6 py-4 text-center text-sm font-medium text-muted-foreground">
                  Progresso
                </th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredClients.map((client, index) => (
                <motion.tr
                  key={client.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-secondary/20 transition-colors cursor-pointer"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-gold font-display font-bold text-sm text-primary-foreground">
                        {client.avatar}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{client.name}</p>
                        <p className="text-xs text-muted-foreground">{client.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {client.cpf}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                        statusStyles[client.status]
                      )}
                    >
                      {client.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-display font-semibold text-foreground">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(client.pendingAmount)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="relative h-2 w-20 overflow-hidden rounded-full bg-secondary">
                        <div
                          className={cn(
                            "absolute left-0 top-0 h-full rounded-full",
                            client.status === "Quitado"
                              ? "bg-success"
                              : client.status === "Atraso"
                              ? "bg-destructive"
                              : "bg-primary"
                          )}
                          style={{ width: `${client.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {client.progress}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </MainLayout>
  );
};

export default Clientes;

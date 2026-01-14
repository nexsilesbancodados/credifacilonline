import { MainLayout } from "@/components/layout/MainLayout";
import { motion } from "framer-motion";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Grid3X3,
  List,
  Plus,
  Phone,
  Mail,
  MoreVertical,
  ChevronRight,
  Loader2,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useClients, Client } from "@/hooks/useClients";

type Status = "Todos" | "Ativo" | "Atraso" | "Quitado";
type ViewMode = "grid" | "list";

const statusStyles = {
  Ativo: "bg-success/20 text-success border-success/30",
  Atraso: "bg-destructive/20 text-destructive border-destructive/30",
  Quitado: "bg-accent/20 text-accent border-accent/30",
};

const getInitials = (name: string) => {
  const names = name.trim().split(" ");
  if (names.length === 1) return names[0].slice(0, 2).toUpperCase();
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

const Clientes = () => {
  const { clients, isLoading } = useClients();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<Status>("Todos");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const filters: Status[] = ["Todos", "Ativo", "Atraso", "Quitado"];

  const filteredClients = clients.filter((client) => {
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

          <Link to="/contratos/novo">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 rounded-xl bg-gradient-gold px-5 py-3 font-medium text-primary-foreground shadow-gold transition-shadow hover:shadow-gold-lg"
            >
              <Plus className="h-5 w-5" />
              Novo Cliente
            </motion.button>
          </Link>
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

      {/* Loading State */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Carregando clientes...</p>
        </div>
      ) : filteredClients.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary/50">
            <Users className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-foreground">
            {searchQuery || activeFilter !== "Todos"
              ? "Nenhum cliente encontrado"
              : "Nenhum cliente cadastrado"}
          </h3>
          <p className="mt-2 text-muted-foreground">
            {searchQuery || activeFilter !== "Todos"
              ? "Tente ajustar os filtros de busca"
              : "Crie um novo contrato para cadastrar seu primeiro cliente"}
          </p>
          <Link to="/contratos/novo">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="mt-6 flex items-center gap-2 rounded-xl bg-gradient-gold px-5 py-3 font-medium text-primary-foreground shadow-gold"
            >
              <Plus className="h-5 w-5" />
              Novo Contrato
            </motion.button>
          </Link>
        </motion.div>
      ) : viewMode === "grid" ? (
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
                    {getInitials(client.name)}
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

              <div className="mt-4 space-y-2">
                {client.city && client.state && (
                  <p className="text-sm text-muted-foreground">
                    {client.city}, {client.state}
                  </p>
                )}
                {client.whatsapp && (
                  <p className="text-sm text-muted-foreground">{client.whatsapp}</p>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-4">
                <div className="flex gap-2">
                  {client.whatsapp && (
                    <a
                      href={`https://wa.me/55${client.whatsapp.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Phone className="h-4 w-4" />
                    </a>
                  )}
                  {client.email && (
                    <a
                      href={`mailto:${client.email}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Mail className="h-4 w-4" />
                    </a>
                  )}
                </div>
                <Link 
                  to={`/clientes/${client.id}`}
                  className="flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  Ver Dossiê
                  <ChevronRight className="h-4 w-4" />
                </Link>
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
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Cidade
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Contato
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
                    <Link to={`/clientes/${client.id}`} className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-gold font-display font-bold text-sm text-primary-foreground">
                        {getInitials(client.name)}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{client.name}</p>
                        <p className="text-xs text-muted-foreground">{client.email}</p>
                      </div>
                    </Link>
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
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {client.city && client.state ? `${client.city}, ${client.state}` : "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {client.whatsapp || "-"}
                  </td>
                  <td className="px-6 py-4">
                    <Link to={`/clientes/${client.id}`}>
                      <button className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </Link>
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

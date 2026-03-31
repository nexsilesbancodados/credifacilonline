import { motion } from "framer-motion";
import { Search, Grid3X3, List, Archive, ArchiveRestore } from "lucide-react";
import { cn } from "@/lib/utils";
import { Status, ViewMode } from "@/hooks/useClientFilters";

const filters: Status[] = ["Todos", "Ativo", "Atraso", "Quitado"];

interface ClientFiltersProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeFilter: Status;
  setActiveFilter: (filter: Status) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  showArchived: boolean;
  setShowArchived: (show: boolean) => void;
  archivedCount: number;
  clientStats: { total: number; ativos: number; atraso: number; quitados: number };
}

export function ClientFilters({
  searchQuery, setSearchQuery, activeFilter, setActiveFilter,
  viewMode, setViewMode, showArchived, setShowArchived,
  archivedCount, clientStats,
}: ClientFiltersProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-center gap-3">
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

        <div className="flex gap-1 rounded-xl bg-secondary/50 p-1">
          {filters.map((filter) => {
            const count = filter === "Todos" ? clientStats.total : clientStats[filter.toLowerCase() === "ativo" ? "ativos" : filter.toLowerCase() === "atraso" ? "atraso" : "quitados"];
            return (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-all flex items-center gap-1.5",
                  activeFilter === filter
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {filter}
                <span className={cn("text-xs rounded-full px-1.5 py-0.5", activeFilter === filter ? "bg-primary-foreground/20" : "bg-secondary")}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {archivedCount > 0 && (
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all",
              showArchived
                ? "bg-warning/20 text-warning border border-warning/30"
                : "bg-secondary/50 text-muted-foreground hover:text-foreground"
            )}
          >
            {showArchived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
            {showArchived ? "Ver Ativos" : `Arquivados (${archivedCount})`}
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setViewMode("grid")}
          aria-label="Visualizar em grid"
          className={cn("flex h-10 w-10 items-center justify-center rounded-lg transition-colors", viewMode === "grid" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-secondary")}
        >
          <Grid3X3 className="h-5 w-5" />
        </button>
        <button
          onClick={() => setViewMode("list")}
          aria-label="Visualizar em lista"
          className={cn("flex h-10 w-10 items-center justify-center rounded-lg transition-colors", viewMode === "list" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-secondary")}
        >
          <List className="h-5 w-5" />
        </button>
      </div>
    </motion.div>
  );
}

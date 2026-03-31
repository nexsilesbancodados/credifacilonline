import { useState, useMemo } from "react";
import { useDebounce } from "@/hooks/useDebounce";
import { Client } from "@/hooks/useClients";

export type Status = "Todos" | "Ativo" | "Atraso" | "Quitado";
export type ViewMode = "grid" | "list";

export function useClientFilters(clients: Client[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);
  const [activeFilter, setActiveFilter] = useState<Status>("Todos");
  const [showArchived, setShowArchived] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  const archivedCount = clients.filter(c => !!c.archived_at).length;
  const activeClients = clients.filter(c => !c.archived_at);

  const clientStats = useMemo(() => ({
    total: activeClients.length,
    ativos: activeClients.filter(c => c.status === "Ativo").length,
    atraso: activeClients.filter(c => c.status === "Atraso").length,
    quitados: activeClients.filter(c => c.status === "Quitado").length,
  }), [activeClients]);

  const filteredClients = useMemo(() =>
    clients
      .filter((client) => {
        const matchesSearch =
          client.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
          client.cpf.includes(debouncedSearch);
        const matchesFilter = activeFilter === "Todos" || client.status === activeFilter;
        const matchesArchived = showArchived ? !!client.archived_at : !client.archived_at;
        return matchesSearch && matchesFilter && matchesArchived;
      })
      .sort((a, b) => a.name.localeCompare(b.name, "pt-BR")),
    [clients, debouncedSearch, activeFilter, showArchived]
  );

  return {
    searchQuery, setSearchQuery,
    activeFilter, setActiveFilter,
    showArchived, setShowArchived,
    viewMode, setViewMode,
    filteredClients, clientStats, archivedCount,
  };
}

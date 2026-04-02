import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronRight, CheckSquare, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { ClientScoreBadge } from "@/components/client/ClientScoreBadge";
import { Client } from "@/hooks/useClients";

const statusStyles: Record<string, string> = {
  Ativo: "bg-success/20 text-success border-success/30",
  Atraso: "bg-destructive/20 text-destructive border-destructive/30",
  Quitado: "bg-accent/20 text-accent border-accent/30",
};

const getInitials = (name: string) => {
  const names = name.trim().split(" ");
  if (names.length === 1) return names[0].slice(0, 2).toUpperCase();
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

interface ClientListViewProps {
  clients: Client[];
  selectionMode: boolean;
  selectedClients: Set<string>;
  toggleSelection: (id: string) => void;
  toggleSelectAll: () => void;
}

export function ClientListView({ clients, selectionMode, selectedClients, toggleSelection, toggleSelectAll }: ClientListViewProps) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
      {/* Header */}
      <div className="bg-secondary/30 px-4 py-3 flex items-center gap-4 text-sm font-medium text-muted-foreground border-b border-border/50">
        {selectionMode && (
          <button onClick={toggleSelectAll} className="flex-shrink-0" aria-label="Selecionar todos">
            {selectedClients.size === clients.length ? <CheckSquare className="h-5 w-5 text-primary" /> : <Square className="h-5 w-5 text-muted-foreground" />}
          </button>
        )}
        <span className="flex-1 min-w-[200px]">Cliente</span>
        <span className="w-32 hidden md:block">CPF</span>
        <span className="w-20 hidden lg:block">Score</span>
        <span className="w-20">Status</span>
        <span className="w-32 hidden lg:block">Cidade</span>
        <span className="w-32 hidden md:block">Contato</span>
        <span className="w-8"></span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-border/30">
        {clients.map((client, index) => {
          const rowContent = (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: Math.min(index * 0.03, 0.5) }}
              onClick={() => selectionMode && toggleSelection(client.id)}
              className={cn(
                "group flex items-center gap-4 px-4 py-3 transition-colors",
                selectionMode ? "cursor-pointer" : "cursor-pointer hover:bg-secondary/20",
                selectedClients.has(client.id) ? "bg-primary/10" : ""
              )}
            >
              {selectionMode && (
                <div className="flex-shrink-0">
                  {selectedClients.has(client.id) ? <CheckSquare className="h-5 w-5 text-primary" /> : <Square className="h-5 w-5 text-muted-foreground" />}
                </div>
              )}

              {/* Client info */}
              <div className="flex items-center gap-3 flex-1 min-w-[200px]">
                {client.avatar_url ? (
                  <img
                    src={client.avatar_url}
                    alt={client.name}
                    className="h-10 w-10 rounded-full object-cover border-2 border-border/50 flex-shrink-0"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-gold font-display font-bold text-sm text-primary-foreground flex-shrink-0">
                    {getInitials(client.name)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{client.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{client.email || client.whatsapp || "—"}</p>
                </div>
              </div>

              <span className="w-32 text-sm text-muted-foreground font-mono hidden md:block">{client.cpf}</span>
              <div className="w-20 hidden lg:block"><ClientScoreBadge clientId={client.id} size="sm" /></div>
              <div className="w-20">
                <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-medium", statusStyles[client.status] || statusStyles.Ativo)}>{client.status}</span>
              </div>
              <span className="w-32 text-sm text-muted-foreground hidden lg:block truncate">{client.city && client.state ? `${client.city}, ${client.state}` : "—"}</span>
              <span className="w-32 text-sm text-muted-foreground hidden md:block truncate">{client.whatsapp || "—"}</span>

              {!selectionMode && (
                <div className="w-8 flex items-center justify-center">
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              )}
            </motion.div>
          );

          if (selectionMode) return <div key={client.id}>{rowContent}</div>;

          return (
            <Link key={client.id} to={`/clientes/${client.id}`} className="block">
              {rowContent}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

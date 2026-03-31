import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { MoreVertical, CheckSquare, Square } from "lucide-react";
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
    <div className="rounded-2xl border border-border/50 bg-card overflow-hidden" role="table">
      <table className="w-full">
        <thead className="bg-secondary/30">
          <tr role="row">
            {selectionMode && (
              <th className="px-4 py-4 w-12">
                <button onClick={toggleSelectAll} aria-label="Selecionar todos">
                  {selectedClients.size === clients.length ? <CheckSquare className="h-5 w-5 text-primary" /> : <Square className="h-5 w-5 text-muted-foreground" />}
                </button>
              </th>
            )}
            <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Cliente</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">CPF</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Score</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Status</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Cidade</th>
            <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">Contato</th>
            <th className="px-6 py-4"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {clients.map((client, index) => (
            <motion.tr
              key={client.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => selectionMode && toggleSelection(client.id)}
              role="row"
              className={cn(
                "transition-colors",
                selectionMode ? "cursor-pointer" : "cursor-default",
                selectedClients.has(client.id) ? "bg-primary/10" : "odd:bg-muted/30 hover:bg-secondary/30"
              )}
            >
              {selectionMode && (
                <td className="px-4 py-4">
                  {selectedClients.has(client.id) ? <CheckSquare className="h-5 w-5 text-primary" /> : <Square className="h-5 w-5 text-muted-foreground" />}
                </td>
              )}
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-gold font-display font-bold text-sm text-primary-foreground">
                    {getInitials(client.name)}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{client.name}</p>
                    <p className="text-xs text-muted-foreground">{client.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-muted-foreground">{client.cpf}</td>
              <td className="px-6 py-4"><ClientScoreBadge clientId={client.id} size="sm" /></td>
              <td className="px-6 py-4">
                <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-medium", statusStyles[client.status])}>{client.status}</span>
              </td>
              <td className="px-6 py-4 text-sm text-muted-foreground">{client.city && client.state ? `${client.city}, ${client.state}` : "-"}</td>
              <td className="px-6 py-4 text-sm text-muted-foreground">{client.whatsapp || "-"}</td>
              <td className="px-6 py-4">
                {!selectionMode && (
                  <Link to={`/clientes/${client.id}`}>
                    <button className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors" aria-label="Ver detalhes">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </Link>
                )}
              </td>
            </motion.tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

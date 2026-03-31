import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Phone, Mail, ChevronRight, CheckSquare, Square } from "lucide-react";
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

interface ClientGridViewProps {
  clients: Client[];
  selectionMode: boolean;
  selectedClients: Set<string>;
  toggleSelection: (id: string) => void;
}

export function ClientGridView({ clients, selectionMode, selectedClients, toggleSelection }: ClientGridViewProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {clients.map((client, index) => (
        <motion.div
          key={client.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
          whileHover={{ y: -4, scale: 1.02 }}
          onClick={() => selectionMode && toggleSelection(client.id)}
          className={cn(
            "group relative rounded-2xl border bg-gradient-to-br from-card to-card/50 p-5 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5",
            selectionMode ? "cursor-pointer" : "cursor-default",
            selectedClients.has(client.id) ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/30"
          )}
        >
          {selectionMode && (
            <div className="absolute top-3 right-3 z-10">
              {selectedClients.has(client.id) ? <CheckSquare className="h-5 w-5 text-primary" /> : <Square className="h-5 w-5 text-muted-foreground" />}
            </div>
          )}

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
            {!selectionMode && (
              <div className="flex items-center gap-2">
                <ClientScoreBadge clientId={client.id} size="sm" />
                <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-medium", statusStyles[client.status])}>
                  {client.status}
                </span>
              </div>
            )}
          </div>

          <div className="mt-4 space-y-2">
            {client.city && client.state && <p className="text-sm text-muted-foreground">{client.city}, {client.state}</p>}
            {client.whatsapp && <p className="text-sm text-muted-foreground">{client.whatsapp}</p>}
          </div>

          {!selectionMode && (
            <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-4">
              <div className="flex gap-2">
                {client.whatsapp && (
                  <a href={`https://wa.me/55${client.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors" onClick={(e) => e.stopPropagation()} aria-label="WhatsApp">
                    <Phone className="h-4 w-4" />
                  </a>
                )}
                {client.email && (
                  <a href={`mailto:${client.email}`} className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors" onClick={(e) => e.stopPropagation()} aria-label="Email">
                    <Mail className="h-4 w-4" />
                  </a>
                )}
              </div>
              <Link to={`/clientes/${client.id}`} className="flex items-center gap-1 text-sm text-primary hover:underline">
                Ver Dossiê
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          )}

          <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

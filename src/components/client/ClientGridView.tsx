import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Phone, Mail, ChevronRight, CheckSquare, Square, MapPin, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { ClientScoreBadge } from "@/components/client/ClientScoreBadge";
import { Client } from "@/hooks/useClients";
import { format } from "date-fns";

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
      {clients.map((client, index) => {
        const cardContent = (
          <motion.div
            key={client.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: Math.min(index * 0.04, 0.5) }}
            whileHover={{ y: -4 }}
            onClick={() => selectionMode && toggleSelection(client.id)}
            className={cn(
              "group relative rounded-2xl border bg-gradient-to-br from-card to-card/50 p-5 transition-all duration-200 hover:shadow-lg hover:shadow-primary/5 h-full",
              selectionMode ? "cursor-pointer" : "",
              selectedClients.has(client.id) ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border/50 hover:border-primary/30"
            )}
          >
            {selectionMode && (
              <div className="absolute top-3 right-3 z-10">
                {selectedClients.has(client.id) ? <CheckSquare className="h-5 w-5 text-primary" /> : <Square className="h-5 w-5 text-muted-foreground" />}
              </div>
            )}

            {/* Header with avatar and status */}
            <div className="flex items-start gap-3">
              {client.avatar_url ? (
                <img
                  src={client.avatar_url}
                  alt={client.name}
                  className="h-12 w-12 rounded-full object-cover border-2 border-border/50 flex-shrink-0"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-gold font-display font-bold text-primary-foreground flex-shrink-0">
                  {getInitials(client.name)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-foreground truncate">{client.name}</h3>
                <p className="text-sm text-muted-foreground font-mono">{client.cpf}</p>
              </div>
              {!selectionMode && (
                <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-medium flex-shrink-0", statusStyles[client.status] || statusStyles.Ativo)}>
                  {client.status}
                </span>
              )}
            </div>

            {/* Details */}
            <div className="mt-4 space-y-1.5">
              {client.city && client.state && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="truncate">{client.city}, {client.state}</span>
                </div>
              )}
              {client.whatsapp && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{client.whatsapp}</span>
                </div>
              )}
              {!client.city && !client.whatsapp && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>Desde {format(new Date(client.created_at), "dd/MM/yyyy")}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            {!selectionMode && (
              <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-4">
                <div className="flex items-center gap-2">
                  <ClientScoreBadge clientId={client.id} size="sm" />
                  <div className="flex gap-1">
                    {client.whatsapp && (
                      <a href={`https://wa.me/55${client.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/50 text-muted-foreground hover:bg-success/20 hover:text-success transition-colors" onClick={(e) => e.stopPropagation()} aria-label="WhatsApp">
                        <Phone className="h-3.5 w-3.5" />
                      </a>
                    )}
                    {client.email && (
                      <a href={`mailto:${client.email}`} className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/50 text-muted-foreground hover:bg-primary/20 hover:text-primary transition-colors" onClick={(e) => e.stopPropagation()} aria-label="Email">
                        <Mail className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm text-primary font-medium group-hover:gap-2 transition-all">
                  Dossiê
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>
            )}

            {/* Hover overlay */}
            <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent" />
            </div>
          </motion.div>
        );

        if (selectionMode) return <div key={client.id}>{cardContent}</div>;

        return (
          <Link key={client.id} to={`/clientes/${client.id}`} className="block">
            {cardContent}
          </Link>
        );
      })}
    </div>
  );
}

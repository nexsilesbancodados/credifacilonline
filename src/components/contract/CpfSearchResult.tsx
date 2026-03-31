import { motion, AnimatePresence } from "framer-motion";
import { User, AlertCircle } from "lucide-react";
import { Client } from "@/hooks/useClients";

interface CpfSearchResultProps {
  show: boolean;
  foundClient: Client | null;
  onUseClient: (client: Client) => void;
  onDismiss: () => void;
}

export function CpfSearchResult({ show, foundClient, onUseClient, onDismiss }: CpfSearchResultProps) {
  return (
    <AnimatePresence>
      {show && foundClient && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          className="absolute z-50 left-0 right-0 mt-2 rounded-xl border border-accent bg-card shadow-lg overflow-hidden"
        >
          <div className="p-3 bg-accent/10 border-b border-accent/30">
            <div className="flex items-center gap-2 text-accent">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Cliente encontrado!</span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onUseClient(foundClient)}
            className="w-full p-4 flex items-center gap-4 hover:bg-accent/5 transition-colors text-left"
          >
            {foundClient.avatar_url ? (
              <img src={foundClient.avatar_url} alt={foundClient.name} className="h-12 w-12 rounded-full object-cover border-2 border-accent/30" />
            ) : (
              <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center">
                <User className="h-6 w-6 text-accent" />
              </div>
            )}
            <div className="flex-1">
              <p className="font-medium text-foreground">{foundClient.name}</p>
              <p className="text-sm text-muted-foreground">
                {foundClient.whatsapp || "Sem WhatsApp"}
                {foundClient.city && ` • ${foundClient.city}/${foundClient.state}`}
              </p>
            </div>
            <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded-full">Usar este cliente</span>
          </button>
          <div className="p-2 bg-secondary/30 border-t border-border">
            <button
              type="button"
              onClick={onDismiss}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-center py-1"
            >
              Ignorar e cadastrar novo cliente
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

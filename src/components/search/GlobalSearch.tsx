import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, User, FileText, DollarSign, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useClients } from "@/hooks/useClients";
import { useContracts } from "@/hooks/useContracts";
import { cn } from "@/lib/utils";

interface SearchResult {
  id: string;
  type: "client" | "contract";
  title: string;
  subtitle: string;
  path: string;
}

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { clients } = useClients();
  const { contracts } = useContracts();

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Search logic
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchQuery = query.toLowerCase();
    const searchResults: SearchResult[] = [];

    // Search clients
    clients
      .filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery) ||
          c.cpf.includes(searchQuery) ||
          c.email?.toLowerCase().includes(searchQuery)
      )
      .slice(0, 5)
      .forEach((c) => {
        searchResults.push({
          id: c.id,
          type: "client",
          title: c.name,
          subtitle: `CPF: ${c.cpf} • ${c.status}`,
          path: `/clientes/${c.id}`,
        });
      });

    // Search contracts
    contracts
      .filter((c) => c.id.includes(searchQuery))
      .slice(0, 3)
      .forEach((c) => {
        const client = clients.find((cl) => cl.id === c.client_id);
        searchResults.push({
          id: c.id,
          type: "contract",
          title: `Contrato #${c.id.slice(0, 8)}`,
          subtitle: `${client?.name || "Cliente"} • ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(c.total_amount)}`,
          path: `/clientes/${c.client_id}`,
        });
      });

    setResults(searchResults);
    setSelectedIndex(0);
  }, [query, clients, contracts]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((i) => (i < results.length - 1 ? i + 1 : 0));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((i) => (i > 0 ? i - 1 : results.length - 1));
          break;
        case "Enter":
          e.preventDefault();
          if (results[selectedIndex]) {
            navigate(results[selectedIndex].path);
            onClose();
            setQuery("");
          }
          break;
        case "Escape":
          onClose();
          setQuery("");
          break;
      }
    },
    [results, selectedIndex, navigate, onClose]
  );

  const handleSelect = (result: SearchResult) => {
    navigate(result.path);
    onClose();
    setQuery("");
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        />

        {/* Search Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          className="relative z-10 w-full max-w-xl rounded-2xl border border-border/50 bg-card shadow-lg overflow-hidden"
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
            <Search className="h-5 w-5 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar clientes, contratos..."
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="p-1 rounded-lg hover:bg-secondary text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded border border-border bg-secondary px-1.5 font-mono text-xs text-muted-foreground">
              ESC
            </kbd>
          </div>

          {/* Results */}
          {query && (
            <div className="max-h-80 overflow-y-auto p-2">
              {results.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Search className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Nenhum resultado para "{query}"
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {results.map((result, index) => {
                    const Icon = result.type === "client" ? User : FileText;
                    return (
                      <button
                        key={`${result.type}-${result.id}`}
                        onClick={() => handleSelect(result)}
                        className={cn(
                          "w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                          selectedIndex === index
                            ? "bg-primary/10 text-foreground"
                            : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-lg",
                            result.type === "client"
                              ? "bg-primary/10"
                              : "bg-success/10"
                          )}
                        >
                          <Icon
                            className={cn(
                              "h-4 w-4",
                              result.type === "client"
                                ? "text-primary"
                                : "text-success"
                            )}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {result.title}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {result.subtitle}
                          </p>
                        </div>
                        {selectedIndex === index && (
                          <kbd className="h-5 rounded bg-secondary px-1.5 font-mono text-xs text-muted-foreground">
                            ↵
                          </kbd>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Hints */}
          {!query && (
            <div className="p-4 text-center text-sm text-muted-foreground">
              <p>Digite para buscar clientes ou contratos</p>
              <div className="flex items-center justify-center gap-4 mt-2">
                <span className="flex items-center gap-1">
                  <kbd className="h-5 rounded bg-secondary px-1.5 font-mono text-xs">↑</kbd>
                  <kbd className="h-5 rounded bg-secondary px-1.5 font-mono text-xs">↓</kbd>
                  navegar
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="h-5 rounded bg-secondary px-1.5 font-mono text-xs">↵</kbd>
                  selecionar
                </span>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// Hook for keyboard shortcut
export function useGlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return { isOpen, setIsOpen };
}

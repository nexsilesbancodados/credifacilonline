import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Shield,
  User,
  FileText,
  DollarSign,
  RefreshCw,
  MessageCircle,
  Loader2,
  Filter,
  Calendar,
  Download,
} from "lucide-react";
import { useActivityHistory, ActivityType, DateRange } from "@/hooks/useActivityHistory";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarPicker } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface AuditLogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const typeIcons: Record<string, React.ReactNode> = {
  client: <User className="h-4 w-4" />,
  contract: <FileText className="h-4 w-4" />,
  payment: <DollarSign className="h-4 w-4" />,
  renegotiation: <RefreshCw className="h-4 w-4" />,
  collection: <MessageCircle className="h-4 w-4" />,
  system: <Shield className="h-4 w-4" />,
};

const typeColors: Record<string, string> = {
  client: "text-blue-500 bg-blue-500/10",
  contract: "text-primary bg-primary/10",
  payment: "text-success bg-success/10",
  renegotiation: "text-warning bg-warning/10",
  collection: "text-purple-500 bg-purple-500/10",
  system: "text-muted-foreground bg-secondary",
};

const typeLabels: Record<string, string> = {
  all: "Todas",
  client: "Clientes",
  contract: "Contratos",
  payment: "Pagamentos",
  renegotiation: "Renegociações",
  collection: "Cobranças",
  system: "Sistema",
};

export function AuditLog({ open, onOpenChange }: AuditLogProps) {
  const [filter, setFilter] = useState<ActivityType>("all");
  const [page, setPage] = useState(1);
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });

  const { data, isLoading } = useActivityHistory(filter, "", page, 20, dateRange);

  const handleExport = () => {
    if (!data?.activities) return;

    const csvContent = [
      ["Data", "Tipo", "Descrição", "Cliente"].join(","),
      ...data.activities.map((a) =>
        [
          format(parseISO(a.created_at), "dd/MM/yyyy HH:mm"),
          typeLabels[a.type] || a.type,
          `"${a.description}"`,
          a.client_name || "-",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `audit_log_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => onOpenChange(false)}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative z-10 w-full max-w-4xl max-h-[85vh] rounded-2xl border border-border/50 bg-card shadow-lg overflow-hidden flex flex-col mx-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-foreground">
                  Log de Auditoria
                </h2>
                <p className="text-sm text-muted-foreground">
                  {data?.totalCount || 0} registros encontrados
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
              <button
                onClick={() => onOpenChange(false)}
                className="p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="px-6 py-3 border-b border-border/50 bg-secondary/20">
            <div className="flex items-center justify-between gap-4">
              <div className="flex gap-2 flex-wrap">
                {(Object.keys(typeLabels) as ActivityType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      setFilter(type);
                      setPage(1);
                    }}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
                      filter === type
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    {typeLabels[type]}
                  </button>
                ))}
              </div>

              {/* Date Range Picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Calendar className="h-4 w-4" />
                    {dateRange.from
                      ? dateRange.to
                        ? `${format(dateRange.from, "dd/MM")} - ${format(dateRange.to, "dd/MM")}`
                        : format(dateRange.from, "dd/MM/yyyy")
                      : "Filtrar por data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <CalendarPicker
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => {
                      setDateRange({ from: range?.from, to: range?.to });
                      setPage(1);
                    }}
                    numberOfMonths={2}
                  />
                  {(dateRange.from || dateRange.to) && (
                    <div className="p-3 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={() => setDateRange({ from: undefined, to: undefined })}
                      >
                        Limpar filtro
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Activity List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : data?.activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-foreground">
                  Nenhum registro encontrado
                </p>
                <p className="text-sm text-muted-foreground">
                  Tente ajustar os filtros de busca
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {data?.activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-4 hover:bg-secondary/30 transition-colors"
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                        typeColors[activity.type] || typeColors.system
                      )}
                    >
                      {typeIcons[activity.type] || typeIcons.system}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">{activity.description}</p>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span>
                          {format(parseISO(activity.created_at), "dd/MM/yyyy 'às' HH:mm", {
                            locale: ptBR,
                          })}
                        </span>
                        {activity.client_name && (
                          <>
                            <span>•</span>
                            <span>Cliente: {activity.client_name}</span>
                          </>
                        )}
                        <span>•</span>
                        <span className="capitalize">{typeLabels[activity.type] || activity.type}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {data && data.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-border/50 bg-secondary/20">
              <p className="text-sm text-muted-foreground">
                Página {data.currentPage} de {data.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === data.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

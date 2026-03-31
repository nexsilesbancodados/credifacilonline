import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function PaginationControls({ page, totalPages, onPageChange, className }: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  return (
    <div className={cn("flex items-center justify-center gap-3 py-4", className)}>
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="h-4 w-4" />
        Anterior
      </button>
      <span className="text-sm text-muted-foreground">
        Página <strong className="text-foreground">{page}</strong> de <strong className="text-foreground">{totalPages}</strong>
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Próxima
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

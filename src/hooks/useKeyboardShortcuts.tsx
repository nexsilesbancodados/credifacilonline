import { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface ShortcutAction {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(additionalShortcuts?: ShortcutAction[]) {
  const navigate = useNavigate();
  const { toast } = useToast();

  const defaultShortcuts: ShortcutAction[] = [
    // Navigation shortcuts
    {
      key: "d",
      alt: true,
      action: () => navigate("/"),
      description: "Ir para Dashboard",
    },
    {
      key: "c",
      alt: true,
      action: () => navigate("/clientes"),
      description: "Ir para Clientes",
    },
    {
      key: "t",
      alt: true,
      action: () => navigate("/contratos"),
      description: "Ir para Contratos",
    },
    {
      key: "b",
      alt: true,
      action: () => navigate("/cobranca"),
      description: "Ir para Mesa de Cobrança",
    },
    {
      key: "f",
      alt: true,
      action: () => navigate("/tesouraria"),
      description: "Ir para Tesouraria",
    },
    {
      key: "a",
      alt: true,
      action: () => navigate("/analises"),
      description: "Ir para Análises",
    },
    // Action shortcuts
    {
      key: "n",
      ctrl: true,
      action: () => navigate("/contratos/novo"),
      description: "Novo Contrato",
    },
    // Help shortcut
    {
      key: "/",
      ctrl: true,
      action: () => {
        toast({
          title: "Atalhos de Teclado",
          description: "Alt+D: Dashboard | Alt+C: Clientes | Alt+T: Contratos | Ctrl+K: Busca | Ctrl+N: Novo Contrato",
          duration: 5000,
        });
      },
      description: "Mostrar atalhos",
    },
  ];

  const shortcuts = [...defaultShortcuts, ...(additionalShortcuts || [])];

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? e.ctrlKey || e.metaKey : !e.ctrlKey && !e.metaKey;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = shortcut.alt ? e.altKey : !e.altKey;
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
          e.preventDefault();
          shortcut.action();
          return;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return {
    shortcuts,
  };
}

// Component to show available shortcuts
export function ShortcutsList() {
  const shortcuts = [
    { keys: ["Ctrl", "K"], description: "Busca global" },
    { keys: ["Ctrl", "N"], description: "Novo contrato" },
    { keys: ["Alt", "D"], description: "Dashboard" },
    { keys: ["Alt", "C"], description: "Clientes" },
    { keys: ["Alt", "T"], description: "Contratos" },
    { keys: ["Alt", "B"], description: "Mesa de Cobrança" },
    { keys: ["Alt", "F"], description: "Tesouraria" },
    { keys: ["Alt", "A"], description: "Análises" },
    { keys: ["Ctrl", "/"], description: "Mostrar atalhos" },
  ];

  return (
    <div className="space-y-2">
      {shortcuts.map((shortcut, index) => (
        <div
          key={index}
          className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-secondary/50"
        >
          <span className="text-sm text-muted-foreground">{shortcut.description}</span>
          <div className="flex gap-1">
            {shortcut.keys.map((key, i) => (
              <kbd
                key={i}
                className="h-6 min-w-[24px] flex items-center justify-center rounded bg-secondary px-1.5 font-mono text-xs text-muted-foreground border border-border/50"
              >
                {key}
              </kbd>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

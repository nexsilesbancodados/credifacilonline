import { ReactNode, useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { Menu, Search, X, ChevronRight, Home } from "lucide-react";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import { useLocation, Link } from "react-router-dom";

interface MainLayoutProps {
  children: ReactNode;
}

const routeLabels: Record<string, string> = {
  "/": "Dashboard",
  "/clientes": "Clientes",
  "/contratos": "Contratos e Cobrança",
  "/contratos/novo": "Novo Contrato",
  "/cobranca": "Contratos e Cobrança",
  "/cobradores": "Cobradores",
  "/tesouraria": "Tesouraria",
  "/analises": "Análises",
  "/historico": "Histórico e Auditoria",
  "/auditoria": "Histórico e Auditoria",
  "/simulador": "Simulador",
  "/qrcode": "WhatsApp",
  "/agente-ia": "Agente IA",
  "/configuracoes": "Configurações",
};

export function MainLayout({ children }: MainLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { isOpen: isSearchOpen, setIsOpen: setIsSearchOpen } = useGlobalSearch();
  const location = useLocation();

  useKeyboardShortcuts();

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const currentLabel = routeLabels[location.pathname];

  return (
    <div className="flex min-h-screen bg-background">
      <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Mobile Header */}
      {isMobile && (
        <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-border/50 bg-background/95 backdrop-blur-sm">
          <div className="flex h-full items-center justify-between px-4">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <span className="font-display font-bold text-gradient-gold text-sm">
              {currentLabel || "Credifacil"}
            </span>
            <button
              onClick={() => setIsSearchOpen(true)}
              className="p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              <Search className="h-5 w-5" />
            </button>
          </div>
        </header>
      )}

      {/* Desktop Top Bar */}
      {!isMobile && (
        <div className="fixed top-0 left-64 right-0 z-30 h-12 flex items-center justify-between px-6 bg-background/80 backdrop-blur-sm border-b border-border/30">
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">
              <Home className="h-3.5 w-3.5" />
            </Link>
            {location.pathname !== "/" && (
              <>
                <ChevronRight className="h-3 w-3" />
                <span className="text-foreground font-medium">{currentLabel || "Página"}</span>
              </>
            )}
          </nav>
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground text-sm"
          >
            <Search className="h-3.5 w-3.5" />
            <span>Buscar</span>
            <kbd className="ml-1 text-[10px] bg-background/50 px-1.5 py-0.5 rounded border border-border/50">⌘K</kbd>
          </button>
        </div>
      )}

      {/* Mobile Overlay */}
      {isMobile && isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      {(!isMobile || isMobileMenuOpen) && (
        <div className={isMobile ? "fixed z-40" : undefined}>
          <Sidebar />
        </div>
      )}

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-200 ${isMobile ? "pt-14" : "ml-64 pt-12"}`}>
        <div className="min-h-screen p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

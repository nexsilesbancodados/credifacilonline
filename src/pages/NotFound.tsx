import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, RefreshCw } from "lucide-react";

const VALID_ROUTES = [
  "/", "/login", "/signup", "/forgot-password", "/portal",
  "/clientes", "/contratos", "/contratos/novo", "/novo-contrato",
  "/cobranca", "/mesa-cobranca", "/cobradores", "/tesouraria",
  "/analises", "/historico", "/simulador", "/auditoria",
  "/configuracoes", "/qrcode", "/agente-ia",
];

const NotFound = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPage, setShowPage] = useState(false);

  useEffect(() => {
    // Check if this is a valid route that might have been hit during chunk loading
    const isKnownRoute = VALID_ROUTES.some(
      (r) => location.pathname === r || location.pathname.startsWith("/clientes/") || location.pathname.startsWith("/cobrador/")
    );

    if (isKnownRoute) {
      // This is a known route - likely a chunk load race condition. Retry navigation.
      const timer = setTimeout(() => {
        navigate(location.pathname + location.search, { replace: true });
      }, 500);
      return () => clearTimeout(timer);
    }

    // For truly unknown routes, show the 404 after a brief delay
    const timer = setTimeout(() => setShowPage(true), 300);
    return () => clearTimeout(timer);
  }, [location.pathname, location.search, navigate]);

  if (!showPage) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-muted-foreground text-sm">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="text-center space-y-6 max-w-md">
        <div className="text-8xl font-bold text-primary/20">404</div>
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Página não encontrada
          </h1>
          <p className="text-muted-foreground">
            A página <code className="text-xs bg-muted px-2 py-1 rounded">{location.pathname}</code> não existe.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <Button onClick={() => navigate("/")}>
            <Home className="h-4 w-4 mr-2" />
            Início
          </Button>
          <Button variant="ghost" onClick={() => window.location.reload()}>
            <RefreshCw className="h-4 w-4 mr-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;

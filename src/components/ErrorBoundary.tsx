import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

const isChunkError = (msg?: string) =>
  !!msg &&
  (msg.includes("Failed to fetch dynamically imported module") ||
    msg.includes("Loading chunk") ||
    msg.includes("Loading CSS chunk") ||
    msg.includes("Importing a module script failed") ||
    msg.includes("error loading dynamically imported module"));

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, _errorInfo: ErrorInfo) {
    if (isChunkError(error.message)) {
      const reloadKey = "error_boundary_reload_v2";
      const lastReload = sessionStorage.getItem(reloadKey);
      const now = Date.now();
      if (!lastReload || now - Number(lastReload) > 15000) {
        sessionStorage.setItem(reloadKey, String(now));
        window.location.reload();
        return;
      }
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleHome = () => {
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      const chunk = isChunkError(this.state.error?.message);

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                {chunk ? "Atualização disponível" : "Algo deu errado"}
              </h2>
              <p className="text-sm text-muted-foreground">
                {chunk
                  ? "Uma nova versão do app foi publicada. Recarregue a página para continuar."
                  : "Ocorreu um erro inesperado. Tente recarregar a página."}
              </p>
            </div>
            <div className="flex gap-3 justify-center flex-wrap">
              <Button onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Recarregar página
              </Button>
              <Button variant="outline" onClick={this.handleHome}>
                <Home className="h-4 w-4 mr-2" />
                Ir ao Início
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

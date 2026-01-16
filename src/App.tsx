import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { queryClient } from "@/lib/queryClient";

// Lazy load pages for code splitting
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Clientes = lazy(() => import("./pages/Clientes"));
const Cobradores = lazy(() => import("./pages/Cobradores"));
const CobradorExterno = lazy(() => import("./pages/CobradorExterno"));
const ClienteDossie = lazy(() => import("./pages/ClienteDossie"));
const NovoContrato = lazy(() => import("./pages/NovoContrato"));
const Simulador = lazy(() => import("./pages/Simulador"));
const Contratos = lazy(() => import("./pages/Contratos"));
const MesaCobranca = lazy(() => import("./pages/MesaCobranca"));
const Tesouraria = lazy(() => import("./pages/Tesouraria"));
const Analises = lazy(() => import("./pages/Analises"));
const Historico = lazy(() => import("./pages/Historico"));
const Auditoria = lazy(() => import("./pages/Auditoria"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const Configuracoes = lazy(() => import("./pages/Configuracoes"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <span className="text-muted-foreground text-sm">Carregando...</span>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/cobrador/:token" element={<CobradorExterno />} />
              
              {/* Protected routes */}
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/clientes" element={<ProtectedRoute><Clientes /></ProtectedRoute>} />
              <Route path="/clientes/:id" element={<ProtectedRoute><ClienteDossie /></ProtectedRoute>} />
              <Route path="/contratos" element={<ProtectedRoute><Contratos /></ProtectedRoute>} />
              <Route path="/contratos/novo" element={<ProtectedRoute><NovoContrato /></ProtectedRoute>} />
              <Route path="/cobranca" element={<ProtectedRoute><MesaCobranca /></ProtectedRoute>} />
              <Route path="/cobradores" element={<ProtectedRoute><Cobradores /></ProtectedRoute>} />
              <Route path="/tesouraria" element={<ProtectedRoute><Tesouraria /></ProtectedRoute>} />
              <Route path="/analises" element={<ProtectedRoute><Analises /></ProtectedRoute>} />
              <Route path="/historico" element={<ProtectedRoute><Historico /></ProtectedRoute>} />
              <Route path="/simulador" element={<ProtectedRoute><Simulador /></ProtectedRoute>} />
              <Route path="/auditoria" element={<ProtectedRoute><Auditoria /></ProtectedRoute>} />
              <Route path="/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

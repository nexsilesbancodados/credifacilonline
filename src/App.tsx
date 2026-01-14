import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import ClienteDossie from "./pages/ClienteDossie";
import NovoContrato from "./pages/NovoContrato";
import MesaCobranca from "./pages/MesaCobranca";
import Tesouraria from "./pages/Tesouraria";
import Analises from "./pages/Analises";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/clientes/:id" element={<ClienteDossie />} />
          <Route path="/contratos/novo" element={<NovoContrato />} />
          <Route path="/cobranca" element={<MesaCobranca />} />
          <Route path="/tesouraria" element={<Tesouraria />} />
          <Route path="/analises" element={<Analises />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

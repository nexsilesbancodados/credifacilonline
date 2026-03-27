import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  User,
  MapPin,
  Calendar,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  MessageCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ClientData {
  id: string;
  name: string;
  whatsapp: string | null;
  street: string | null;
  number: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  cep: string | null;
  installments: {
    id: string;
    amount_due: number;
    due_date: string;
    status: string;
    installment_number: number;
    total_installments: number;
  }[];
}

interface CollectorData {
  name: string;
  clients: ClientData[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const CobradorExterno = () => {
  const { token } = useParams<{ token: string }>();
  const [collectorData, setCollectorData] = useState<CollectorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setError("Token inválido");
        setIsLoading(false);
        return;
      }

      try {
        // Create a custom fetch function with the token header
        const fetchWithToken = async (table: string, query: string) => {
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/${table}?${query}`,
            {
              headers: {
                apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
                Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
                "x-collector-token": token,
                "Content-Type": "application/json",
              },
            }
          );
          if (!response.ok) {
            throw new Error(`Failed to fetch ${table}`);
          }
          return response.json();
        };

        // Fetch collector by token
        const collectors = await fetchWithToken(
          "collectors",
          `access_token=eq.${token}&select=id,name,is_active,operator_id`
        );

        if (!collectors || collectors.length === 0) {
          setError("Cobrador não encontrado ou link inválido");
          setIsLoading(false);
          return;
        }

        const collectorResult = collectors[0];

        if (!collectorResult.is_active) {
          setError("Este cobrador está desativado");
          setIsLoading(false);
          return;
        }

        // Fetch clients assigned to this collector
        const clientsData = await fetchWithToken(
          "clients",
          `collector_id=eq.${collectorResult.id}&archived_at=is.null&select=id,name,whatsapp,street,number,neighborhood,city,state,cep`
        );

        const clientsWithInstallments: ClientData[] = [];

        for (const client of clientsData || []) {
          const installmentsData = await fetchWithToken(
            "installments",
            `client_id=eq.${client.id}&status=in.(Pendente,Atrasado)&order=due_date.asc&select=id,amount_due,due_date,status,installment_number,total_installments`
          );

          if (installmentsData && installmentsData.length > 0) {
            clientsWithInstallments.push({
              ...client,
              installments: installmentsData,
            });
          }
        }

        setCollectorData({
          name: collectorResult.name,
          clients: clientsWithInstallments,
        });
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Erro ao carregar dados");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const formatAddress = (client: ClientData) => {
    const parts = [];
    if (client.street) {
      parts.push(client.street);
      if (client.number) parts[0] += `, ${client.number}`;
    }
    if (client.neighborhood) parts.push(client.neighborhood);
    if (client.city) {
      let cityState = client.city;
      if (client.state) cityState += ` - ${client.state}`;
      parts.push(cityState);
    }
    if (client.cep) parts.push(`CEP: ${client.cep}`);
    return parts.length > 0 ? parts.join(" • ") : "Endereço não informado";
  };

  const openWhatsApp = (phone: string | null, clientName: string) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, "");
    const message = encodeURIComponent(`Olá ${clientName}, vim fazer a cobrança.`);
    window.open(`https://wa.me/55${cleanPhone}?text=${message}`, "_blank");
  };

  const openMaps = (client: ClientData) => {
    const address = `${client.street || ""} ${client.number || ""}, ${client.neighborhood || ""}, ${client.city || ""} ${client.state || ""}`;
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, "_blank");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-xl font-bold text-foreground mb-2">Acesso Negado</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (!collectorData) return null;

  const totalPendingAmount = collectorData.clients.reduce((sum, client) => {
    return sum + client.installments.reduce((s, i) => s + i.amount_due, 0);
  }, 0);

  const overdueCount = collectorData.clients.reduce((sum, client) => {
    return sum + client.installments.filter((i) => i.status === "Atrasado").length;
  }, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-xl font-bold text-foreground">
                Olá, {collectorData.name}!
              </h1>
              <p className="text-sm text-muted-foreground">
                {collectorData.clients.length} cliente(s) para cobrar
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Total a receber</p>
              <p className="text-lg font-bold text-primary">
                {formatCurrency(totalPendingAmount)}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Summary Cards */}
      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-xl bg-card border border-border p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <User className="h-4 w-4" />
              <span className="text-xs">Clientes</span>
            </div>
            <p className="text-2xl font-bold text-foreground">
              {collectorData.clients.length}
            </p>
          </div>
          <div className="rounded-xl bg-destructive/10 border border-destructive/30 p-4">
            <div className="flex items-center gap-2 text-destructive mb-1">
              <AlertCircle className="h-4 w-4" />
              <span className="text-xs">Atrasadas</span>
            </div>
            <p className="text-2xl font-bold text-destructive">{overdueCount}</p>
          </div>
        </div>

        {/* Client List */}
        {collectorData.clients.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="h-16 w-16 text-success mx-auto mb-4" />
            <h2 className="text-lg font-medium text-foreground mb-2">
              Tudo em dia!
            </h2>
            <p className="text-muted-foreground">
              Nenhum cliente com parcelas pendentes no momento.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {collectorData.clients.map((client, index) => (
              <motion.div
                key={client.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="rounded-2xl border border-border bg-card overflow-hidden"
              >
                {/* Client Header */}
                <div className="p-4 border-b border-border/50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold">
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{client.name}</h3>
                        {client.whatsapp && (
                          <p className="text-sm text-muted-foreground">{client.whatsapp}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {client.whatsapp && (
                        <button
                          onClick={() => openWhatsApp(client.whatsapp, client.name)}
                          className="h-10 w-10 rounded-lg bg-success/10 text-success flex items-center justify-center hover:bg-success/20 transition-colors"
                        >
                          <MessageCircle className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={() => openMaps(client)}
                        className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
                      >
                        <MapPin className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  {/* Address */}
                  <div
                    onClick={() => openMaps(client)}
                    className="flex items-start gap-2 p-3 rounded-xl bg-secondary/30 cursor-pointer hover:bg-secondary/50 transition-colors"
                  >
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-muted-foreground">{formatAddress(client)}</p>
                  </div>
                </div>

                {/* Installments */}
                <div className="divide-y divide-border/50">
                  {client.installments.map((installment) => {
                    const isOverdue = installment.status === "Atrasado";
                    const dueDate = new Date(installment.due_date);

                    return (
                      <div
                        key={installment.id}
                        className={cn(
                          "p-4 flex items-center justify-between",
                          isOverdue && "bg-destructive/5"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "h-10 w-10 rounded-lg flex items-center justify-center",
                              isOverdue
                                ? "bg-destructive/10 text-destructive"
                                : "bg-warning/10 text-warning"
                            )}
                          >
                            {isOverdue ? (
                              <AlertCircle className="h-5 w-5" />
                            ) : (
                              <Clock className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              Parcela {installment.installment_number}/{installment.total_installments}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {format(dueDate, "dd/MM/yyyy", { locale: ptBR })}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={cn(
                              "font-bold",
                              isOverdue ? "text-destructive" : "text-foreground"
                            )}
                          >
                            {formatCurrency(installment.amount_due)}
                          </p>
                          <span
                            className={cn(
                              "text-xs font-medium",
                              isOverdue ? "text-destructive" : "text-warning"
                            )}
                          >
                            {installment.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Client Total */}
                <div className="p-4 bg-secondary/20 flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Total do cliente
                  </span>
                  <span className="font-bold text-foreground">
                    {formatCurrency(
                      client.installments.reduce((s, i) => s + i.amount_due, 0)
                    )}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-8 py-6 text-center text-xs text-muted-foreground">
        <p>Atualizado em {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}</p>
      </footer>
    </div>
  );
};

export default CobradorExterno;

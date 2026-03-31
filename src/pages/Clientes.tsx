import { MainLayout } from "@/components/layout/MainLayout";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Link } from "react-router-dom";
import { PaginationControls } from "@/components/ui/pagination-controls";
import { exportToExcel } from "@/lib/exportToExcel";
import { format } from "date-fns";
import {
  Plus, Loader2, Check, AlertCircle, Zap, Users, Download,
  CheckSquare, MessageCircle, Send, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useClients } from "@/hooks/useClients";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { QueryErrorState } from "@/components/QueryErrorState";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { useClientFilters } from "@/hooks/useClientFilters";
import { ClientFilters } from "@/components/client/ClientFilters";
import { ClientGridView } from "@/components/client/ClientGridView";
import { ClientListView } from "@/components/client/ClientListView";

const toneOptions = [
  { value: "amigavel", label: "Amigável", emoji: "😊" },
  { value: "formal", label: "Formal", emoji: "📋" },
  { value: "urgente", label: "Urgente", emoji: "⚠️" },
];

interface GeneratedMessage {
  client_id: string;
  client_name: string;
  whatsapp: string;
  whatsapp_clean?: string;
  whatsapp_link?: string;
  message: string;
}

const Clientes = () => {
  const { clients, isLoading, isError, refetch, page, setPage, totalPages } = useClients();
  const { toast } = useToast();

  const {
    searchQuery, setSearchQuery,
    activeFilter, setActiveFilter,
    showArchived, setShowArchived,
    viewMode, setViewMode,
    filteredClients, clientStats, archivedCount,
  } = useClientFilters(clients);

  // Selection state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());

  // Bulk action state
  const [showBulkAction, setShowBulkAction] = useState(false);
  const [selectedTone, setSelectedTone] = useState("amigavel");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMessages, setGeneratedMessages] = useState<GeneratedMessage[]>([]);

  // Direct send state
  const [isSending, setIsSending] = useState(false);
  const [sendingProgress, setSendingProgress] = useState({ current: 0, total: 0 });
  const [sendResults, setSendResults] = useState<{ clientId: string; success: boolean; error?: string }[]>([]);

  const toggleSelection = (clientId: string) => {
    const newSelection = new Set(selectedClients);
    if (newSelection.has(clientId)) newSelection.delete(clientId);
    else newSelection.add(clientId);
    setSelectedClients(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedClients.size === filteredClients.length) setSelectedClients(new Set());
    else setSelectedClients(new Set(filteredClients.map((c) => c.id)));
  };

  const cancelSelection = () => {
    setSelectionMode(false);
    setSelectedClients(new Set());
    setShowBulkAction(false);
    setGeneratedMessages([]);
  };

  const generateBulkMessages = async () => {
    if (selectedClients.size === 0) {
      toast({ title: "Nenhum cliente selecionado", description: "Selecione pelo menos um cliente.", variant: "destructive" });
      return;
    }
    setIsGenerating(true);
    setGeneratedMessages([]);
    try {
      const { data, error } = await supabase.functions.invoke("n8n-webhook", {
        body: { action: "generate_messages", client_ids: Array.from(selectedClients), tone: selectedTone },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      setGeneratedMessages(data.messages || []);
      setShowBulkAction(true);
    } catch (error) {
      console.error("Error generating messages:", error);
      toast({ title: "Erro ao gerar mensagens", description: error instanceof Error ? error.message : "Tente novamente", variant: "destructive" });
    } finally {
      setIsGenerating(false);
    }
  };

  const openWhatsApp = (msg: GeneratedMessage) => {
    if (msg.whatsapp_link) window.open(msg.whatsapp_link, "_blank");
  };

  const openAllWhatsApp = () => {
    generatedMessages.forEach((msg, index) => {
      if (msg.whatsapp_link) setTimeout(() => window.open(msg.whatsapp_link, "_blank"), index * 500);
    });
    toast({ title: "Abrindo WhatsApp", description: `${generatedMessages.filter((m) => m.whatsapp_link).length} conversas...` });
  };

  const sendDirectMessage = async (msg: GeneratedMessage) => {
    if (!msg.whatsapp_clean) return { success: false, error: "Sem WhatsApp" };
    try {
      const { data, error } = await supabase.functions.invoke("n8n-webhook", {
        body: { action: "send_whatsapp", phone: msg.whatsapp_clean, message: msg.message },
      });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.message || "Erro desconhecido");
      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : "Erro" };
    }
  };

  const sendSingleDirect = async (msg: GeneratedMessage) => {
    const result = await sendDirectMessage(msg);
    setSendResults(prev => [...prev, { clientId: msg.client_id, ...result }]);
    toast(result.success
      ? { title: "Mensagem enviada", description: `Cobrança enviada para ${msg.client_name}` }
      : { title: "Erro ao enviar", description: result.error, variant: "destructive" }
    );
  };

  const sendAllDirect = async () => {
    const messagesToSend = generatedMessages.filter(m => m.whatsapp_clean);
    if (messagesToSend.length === 0) {
      toast({ title: "Nenhum WhatsApp válido", description: "Nenhum cliente tem WhatsApp cadastrado", variant: "destructive" });
      return;
    }
    setIsSending(true);
    setSendingProgress({ current: 0, total: messagesToSend.length });
    setSendResults([]);
    let successCount = 0, errorCount = 0;
    for (let i = 0; i < messagesToSend.length; i++) {
      setSendingProgress({ current: i + 1, total: messagesToSend.length });
      const result = await sendDirectMessage(messagesToSend[i]);
      setSendResults(prev => [...prev, { clientId: messagesToSend[i].client_id, ...result }]);
      if (result.success) successCount++;
      else errorCount++;
      if (i < messagesToSend.length - 1) await new Promise(resolve => setTimeout(resolve, 1000));
    }
    setIsSending(false);
    toast({
      title: "Envio concluído",
      description: `${successCount} enviada(s) com sucesso${errorCount > 0 ? `, ${errorCount} erro(s)` : ""}`,
      variant: errorCount > 0 ? "destructive" : "default",
    });
  };

  const getMessageStatus = (clientId: string) => {
    const result = sendResults.find(r => r.clientId === clientId);
    return result ? (result.success ? "success" : "error") : null;
  };

  return (
    <MainLayout>
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">Clientes</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {clientStats.total} clientes · {clientStats.ativos} ativos · {clientStats.atraso > 0 ? <span className="text-destructive">{clientStats.atraso} em atraso</span> : "0 em atraso"}
            </p>
          </div>
          <div className="flex gap-2">
            <PermissionGate permission="canExportData">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  const data = clients.map(c => ({
                    Nome: c.name, CPF: c.cpf, WhatsApp: c.whatsapp || "", Status: c.status,
                    Cidade: c.city || "", "Data Cadastro": format(new Date(c.created_at), "dd/MM/yyyy"),
                  }));
                  exportToExcel(data, "clientes", "Clientes");
                  toast({ title: "Exportado!", description: "Arquivo Excel gerado com sucesso." });
                }}
                className="flex items-center gap-2 rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
              >
                <Download className="h-4 w-4" />
                Exportar
              </motion.button>
            </PermissionGate>
            {!selectionMode ? (
              <>
                <PermissionGate permission="canEditClients">
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setSelectionMode(true)}
                    className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20">
                    <CheckSquare className="h-4 w-4" /> Selecionar
                  </motion.button>
                </PermissionGate>
                <PermissionGate permission="canCreateContracts">
                  <Link to="/contratos/novo">
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      className="flex items-center gap-2 rounded-xl bg-gradient-gold px-5 py-2.5 font-medium text-primary-foreground shadow-gold transition-shadow hover:shadow-gold-lg">
                      <Plus className="h-5 w-5" /> Novo Cliente
                    </motion.button>
                  </Link>
                </PermissionGate>
              </>
            ) : (
              <>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={cancelSelection}
                  className="flex items-center gap-2 rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm font-medium text-secondary-foreground">
                  <X className="h-4 w-4" /> Cancelar
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={toggleSelectAll}
                  className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary">
                  {selectedClients.size === filteredClients.length ? "Desmarcar Todos" : "Selecionar Todos"}
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={generateBulkMessages}
                  disabled={selectedClients.size === 0 || isGenerating}
                  className="flex items-center gap-2 rounded-xl bg-gradient-gold px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-gold disabled:opacity-50">
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                  Gerar Cobrança ({selectedClients.size})
                </motion.button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Selection Bar */}
      {selectionMode && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-center justify-between rounded-xl bg-primary/10 border border-primary/30 p-3">
          <p className="text-sm text-primary"><strong>{selectedClients.size}</strong> cliente(s) selecionado(s)</p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Tom:</span>
            <div className="flex gap-1">
              {toneOptions.map((tone) => (
                <button key={tone.value} onClick={() => setSelectedTone(tone.value)}
                  className={cn("rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
                    selectedTone === tone.value ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                  )}>
                  {tone.emoji} {tone.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Bulk Action Modal */}
      <AnimatePresence>
        {showBulkAction && generatedMessages.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setShowBulkAction(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative z-10 w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-2xl border border-border/50 bg-card shadow-lg flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-border/50">
                <div>
                  <h3 className="font-display text-lg font-bold text-foreground">Mensagens Geradas</h3>
                  <p className="text-sm text-muted-foreground">
                    {isSending ? `Enviando ${sendingProgress.current}/${sendingProgress.total}...` : `${generatedMessages.length} mensagem(ns) prontas para envio`}
                  </p>
                </div>
                <div className="flex gap-2">
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={sendAllDirect} disabled={isSending}
                    className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
                    {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                    Envio Direto
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={openAllWhatsApp} disabled={isSending}
                    className="flex items-center gap-2 rounded-lg bg-success px-3 py-2 text-sm font-medium text-success-foreground disabled:opacity-50">
                    <Send className="h-4 w-4" /> WhatsApp Web
                  </motion.button>
                  <button onClick={() => { setShowBulkAction(false); setSendResults([]); }}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary">
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {isSending && (
                <div className="px-4 pt-2">
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div className="h-full bg-primary transition-all duration-300" style={{ width: `${(sendingProgress.current / sendingProgress.total) * 100}%` }} />
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {generatedMessages.map((msg) => {
                  const status = getMessageStatus(msg.client_id);
                  return (
                    <div key={msg.client_id} className={cn("rounded-xl border p-4 transition-all",
                      status === "success" ? "border-success/50 bg-success/10" : status === "error" ? "border-destructive/50 bg-destructive/10" : "border-border/50 bg-secondary/30"
                    )}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {status === "success" && <Check className="h-4 w-4 text-success" />}
                            {status === "error" && <AlertCircle className="h-4 w-4 text-destructive" />}
                            <h4 className="font-medium text-foreground">{msg.client_name}</h4>
                            <span className="text-xs text-muted-foreground">{msg.whatsapp}</span>
                          </div>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">{msg.message}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => sendSingleDirect(msg)} disabled={!msg.whatsapp_clean || isSending || status === "success"}
                            className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50" title="Enviar direto">
                            <Zap className="h-4 w-4" />
                          </button>
                          <button onClick={() => openWhatsApp(msg)} disabled={!msg.whatsapp_link || isSending}
                            className="flex items-center gap-1 rounded-lg bg-success px-3 py-2 text-sm font-medium text-success-foreground hover:bg-success/90 disabled:opacity-50" title="Abrir WhatsApp Web">
                            <MessageCircle className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters Bar */}
      <ClientFilters
        searchQuery={searchQuery} setSearchQuery={setSearchQuery}
        activeFilter={activeFilter} setActiveFilter={setActiveFilter}
        viewMode={viewMode} setViewMode={setViewMode}
        showArchived={showArchived} setShowArchived={setShowArchived}
        archivedCount={archivedCount} clientStats={clientStats}
      />

      {/* Content */}
      {isError ? (
        <QueryErrorState message="Erro ao carregar clientes" onRetry={refetch} />
      ) : isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-border/50 bg-card p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-28 rounded bg-muted animate-pulse" />
                  <div className="h-3 w-20 rounded bg-muted animate-pulse" />
                </div>
                <div className="h-5 w-14 rounded-full bg-muted animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="h-3 w-36 rounded bg-muted animate-pulse" />
                <div className="h-3 w-28 rounded bg-muted animate-pulse" />
              </div>
              <div className="border-t border-border/50 pt-4 flex justify-between">
                <div className="flex gap-2">
                  <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
                  <div className="h-8 w-8 rounded-lg bg-muted animate-pulse" />
                </div>
                <div className="h-4 w-20 rounded bg-muted animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredClients.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary/50">
            <Users className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-foreground">
            {searchQuery || activeFilter !== "Todos" ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
          </h3>
          <p className="mt-2 text-muted-foreground">
            {searchQuery || activeFilter !== "Todos" ? "Tente ajustar os filtros de busca" : "Crie um novo contrato para cadastrar seu primeiro cliente"}
          </p>
          <Link to="/contratos/novo">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="mt-6 flex items-center gap-2 rounded-xl bg-gradient-gold px-5 py-3 font-medium text-primary-foreground shadow-gold">
              <Plus className="h-5 w-5" /> Novo Contrato
            </motion.button>
          </Link>
        </motion.div>
      ) : viewMode === "grid" ? (
        <ClientGridView clients={filteredClients} selectionMode={selectionMode} selectedClients={selectedClients} toggleSelection={toggleSelection} />
      ) : (
        <ClientListView clients={filteredClients} selectionMode={selectionMode} selectedClients={selectedClients} toggleSelection={toggleSelection} toggleSelectAll={toggleSelectAll} />
      )}

      <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
    </MainLayout>
  );
};

export default Clientes;

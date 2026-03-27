import { MainLayout } from "@/components/layout/MainLayout";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Grid3X3,
  List,
  Plus,
  Phone,
  Mail,
  MoreVertical,
  ChevronRight,
  Loader2,
  Check,
  AlertCircle,
  Zap,
  Users,
  CheckSquare,
  Square,
  MessageCircle,
  Send,
  X,
  Archive,
  ArchiveRestore,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useClients } from "@/hooks/useClients";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ClientScoreBadge } from "@/components/client/ClientScoreBadge";
import { PermissionGate } from "@/components/auth/PermissionGate";

type Status = "Todos" | "Ativo" | "Atraso" | "Quitado";
type ViewMode = "grid" | "list";

const statusStyles = {
  Ativo: "bg-success/20 text-success border-success/30",
  Atraso: "bg-destructive/20 text-destructive border-destructive/30",
  Quitado: "bg-accent/20 text-accent border-accent/30",
};

const getInitials = (name: string) => {
  const names = name.trim().split(" ");
  if (names.length === 1) return names[0].slice(0, 2).toUpperCase();
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

const toneOptions = [
  { value: "amigavel", label: "Amigável", emoji: "😊" },
  { value: "formal", label: "Formal", emoji: "📋" },
  { value: "urgente", label: "Urgente", emoji: "⚠️" },
];

const Clientes = () => {
  const { clients, isLoading } = useClients();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<Status>("Todos");
  const [showArchived, setShowArchived] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  
  // Selection state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedClients, setSelectedClients] = useState<Set<string>>(new Set());
  
  // Bulk action state
  const [showBulkAction, setShowBulkAction] = useState(false);
  const [selectedTone, setSelectedTone] = useState("amigavel");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMessages, setGeneratedMessages] = useState<any[]>([]);
  
  // Direct send state
  const [isSending, setIsSending] = useState(false);
  const [sendingProgress, setSendingProgress] = useState({ current: 0, total: 0 });
  const [sendResults, setSendResults] = useState<{ clientId: string; success: boolean; error?: string }[]>([]);

  const filters: Status[] = ["Todos", "Ativo", "Atraso", "Quitado"];

  const filteredClients = clients
    .filter((client) => {
      const matchesSearch =
        client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.cpf.includes(searchQuery);
      const matchesFilter =
        activeFilter === "Todos" || client.status === activeFilter;
      const matchesArchived = showArchived 
        ? !!client.archived_at 
        : !client.archived_at;
      return matchesSearch && matchesFilter && matchesArchived;
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

  const archivedCount = clients.filter(c => !!c.archived_at).length;
  const activeClients = clients.filter(c => !c.archived_at);
  const clientStats = {
    total: activeClients.length,
    ativos: activeClients.filter(c => c.status === "Ativo").length,
    atraso: activeClients.filter(c => c.status === "Atraso").length,
    quitados: activeClients.filter(c => c.status === "Quitado").length,
  };

  const toggleSelection = (clientId: string) => {
    const newSelection = new Set(selectedClients);
    if (newSelection.has(clientId)) {
      newSelection.delete(clientId);
    } else {
      newSelection.add(clientId);
    }
    setSelectedClients(newSelection);
  };

  const toggleSelectAll = () => {
    if (selectedClients.size === filteredClients.length) {
      setSelectedClients(new Set());
    } else {
      setSelectedClients(new Set(filteredClients.map((c) => c.id)));
    }
  };

  const cancelSelection = () => {
    setSelectionMode(false);
    setSelectedClients(new Set());
    setShowBulkAction(false);
    setGeneratedMessages([]);
  };

  const generateBulkMessages = async () => {
    if (selectedClients.size === 0) {
      toast({
        title: "Nenhum cliente selecionado",
        description: "Selecione pelo menos um cliente.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGeneratedMessages([]);

    try {
      const { data, error } = await supabase.functions.invoke("n8n-webhook", {
        body: {
          action: "generate_messages",
          client_ids: Array.from(selectedClients),
          tone: selectedTone,
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      setGeneratedMessages(data.messages || []);
      setShowBulkAction(true);
    } catch (error) {
      console.error("Error generating messages:", error);
      toast({
        title: "Erro ao gerar mensagens",
        description: error instanceof Error ? error.message : "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const openWhatsApp = (msg: any) => {
    if (msg.whatsapp_link) {
      window.open(msg.whatsapp_link, "_blank");
    }
  };

  const openAllWhatsApp = () => {
    generatedMessages.forEach((msg, index) => {
      if (msg.whatsapp_link) {
        setTimeout(() => {
          window.open(msg.whatsapp_link, "_blank");
        }, index * 500);
      }
    });
    toast({
      title: "Abrindo WhatsApp",
      description: `${generatedMessages.filter((m) => m.whatsapp_link).length} conversas...`,
    });
  };

  // Enviar mensagem diretamente via Evolution API
  const sendDirectMessage = async (msg: any) => {
    if (!msg.whatsapp_clean) {
      return { success: false, error: "Sem WhatsApp" };
    }

    try {
      const { data, error } = await supabase.functions.invoke("n8n-webhook", {
        body: {
          action: "send_whatsapp",
          phone: msg.whatsapp_clean,
          message: msg.message,
        },
      });

      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.message || "Erro desconhecido");

      return { success: true };
    } catch (error) {
      console.error("Error sending message:", error);
      return { success: false, error: error instanceof Error ? error.message : "Erro" };
    }
  };

  const sendSingleDirect = async (msg: any) => {
    const result = await sendDirectMessage(msg);
    
    setSendResults(prev => [...prev, { clientId: msg.client_id, ...result }]);
    
    if (result.success) {
      toast({
        title: "Mensagem enviada",
        description: `Cobrança enviada para ${msg.client_name}`,
      });
    } else {
      toast({
        title: "Erro ao enviar",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  const sendAllDirect = async () => {
    const messagesToSend = generatedMessages.filter(m => m.whatsapp_clean);
    
    if (messagesToSend.length === 0) {
      toast({
        title: "Nenhum WhatsApp válido",
        description: "Nenhum cliente tem WhatsApp cadastrado",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    setSendingProgress({ current: 0, total: messagesToSend.length });
    setSendResults([]);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < messagesToSend.length; i++) {
      const msg = messagesToSend[i];
      setSendingProgress({ current: i + 1, total: messagesToSend.length });

      const result = await sendDirectMessage(msg);
      setSendResults(prev => [...prev, { clientId: msg.client_id, ...result }]);

      if (result.success) {
        successCount++;
      } else {
        errorCount++;
      }

      // Delay entre mensagens para evitar rate limiting
      if (i < messagesToSend.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
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
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
              Clientes
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {clientStats.total} clientes · {clientStats.ativos} ativos · {clientStats.atraso > 0 ? <span className="text-destructive">{clientStats.atraso} em atraso</span> : "0 em atraso"}
            </p>
          </div>

          <div className="flex gap-2">
            {!selectionMode ? (
              <>
                <PermissionGate permission="canEditClients">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectionMode(true)}
                    className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
                  >
                    <CheckSquare className="h-4 w-4" />
                    Selecionar
                  </motion.button>
                </PermissionGate>
                <PermissionGate permission="canCreateContracts">
                  <Link to="/contratos/novo">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex items-center gap-2 rounded-xl bg-gradient-gold px-5 py-2.5 font-medium text-primary-foreground shadow-gold transition-shadow hover:shadow-gold-lg"
                    >
                      <Plus className="h-5 w-5" />
                      Novo Cliente
                    </motion.button>
                  </Link>
                </PermissionGate>
              </>
            ) : (
              <>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={cancelSelection}
                  className="flex items-center gap-2 rounded-xl border border-border bg-secondary px-4 py-2.5 text-sm font-medium text-secondary-foreground"
                >
                  <X className="h-4 w-4" />
                  Cancelar
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={toggleSelectAll}
                  className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2.5 text-sm font-medium text-primary"
                >
                  {selectedClients.size === filteredClients.length ? "Desmarcar Todos" : "Selecionar Todos"}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={generateBulkMessages}
                  disabled={selectedClients.size === 0 || isGenerating}
                  className="flex items-center gap-2 rounded-xl bg-gradient-gold px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-gold disabled:opacity-50"
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <MessageCircle className="h-4 w-4" />
                  )}
                  Gerar Cobrança ({selectedClients.size})
                </motion.button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Selection Bar */}
      {selectionMode && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 flex items-center justify-between rounded-xl bg-primary/10 border border-primary/30 p-3"
        >
          <p className="text-sm text-primary">
            <strong>{selectedClients.size}</strong> cliente(s) selecionado(s)
          </p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Tom:</span>
            <div className="flex gap-1">
              {toneOptions.map((tone) => (
                <button
                  key={tone.value}
                  onClick={() => setSelectedTone(tone.value)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
                    selectedTone === tone.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                  )}
                >
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
              onClick={() => setShowBulkAction(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative z-10 w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-2xl border border-border/50 bg-card shadow-lg flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-border/50">
                <div>
                  <h3 className="font-display text-lg font-bold text-foreground">
                    Mensagens Geradas
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {isSending 
                      ? `Enviando ${sendingProgress.current}/${sendingProgress.total}...`
                      : `${generatedMessages.length} mensagem(ns) prontas para envio`
                    }
                  </p>
                </div>
                <div className="flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={sendAllDirect}
                    disabled={isSending}
                    className="flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
                  >
                    {isSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Zap className="h-4 w-4" />
                    )}
                    Envio Direto
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={openAllWhatsApp}
                    disabled={isSending}
                    className="flex items-center gap-2 rounded-lg bg-success px-3 py-2 text-sm font-medium text-success-foreground disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    WhatsApp Web
                  </motion.button>
                  <button
                    onClick={() => {
                      setShowBulkAction(false);
                      setSendResults([]);
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              {isSending && (
                <div className="px-4 pt-2">
                  <div className="h-2 rounded-full bg-secondary overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${(sendingProgress.current / sendingProgress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {generatedMessages.map((msg) => {
                  const status = getMessageStatus(msg.client_id);
                  return (
                    <div
                      key={msg.client_id}
                      className={cn(
                        "rounded-xl border p-4 transition-all",
                        status === "success" 
                          ? "border-success/50 bg-success/10" 
                          : status === "error" 
                            ? "border-destructive/50 bg-destructive/10"
                            : "border-border/50 bg-secondary/30"
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {status === "success" && <Check className="h-4 w-4 text-success" />}
                            {status === "error" && <AlertCircle className="h-4 w-4 text-destructive" />}
                            <h4 className="font-medium text-foreground">{msg.client_name}</h4>
                            <span className="text-xs text-muted-foreground">{msg.whatsapp}</span>
                          </div>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-3">
                            {msg.message}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => sendSingleDirect(msg)}
                            disabled={!msg.whatsapp_clean || isSending || status === "success"}
                            className="flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                            title="Enviar direto"
                          >
                            <Zap className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openWhatsApp(msg)}
                            disabled={!msg.whatsapp_link || isSending}
                            className="flex items-center gap-1 rounded-lg bg-success px-3 py-2 text-sm font-medium text-success-foreground hover:bg-success/90 disabled:opacity-50"
                            title="Abrir WhatsApp Web"
                          >
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar por nome ou CPF..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-64 rounded-xl border border-border bg-secondary/50 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Status Filters */}
          <div className="flex gap-1 rounded-xl bg-secondary/50 p-1">
            {filters.map((filter) => {
              const count = filter === "Todos" ? clientStats.total : clientStats[filter.toLowerCase() === "ativo" ? "ativos" : filter.toLowerCase() === "atraso" ? "atraso" : "quitados"];
              return (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium transition-all flex items-center gap-1.5",
                    activeFilter === filter
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {filter}
                  <span className={cn(
                    "text-xs rounded-full px-1.5 py-0.5",
                    activeFilter === filter ? "bg-primary-foreground/20" : "bg-secondary"
                  )}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Archive Toggle */}
          {archivedCount > 0 && (
            <button
              onClick={() => setShowArchived(!showArchived)}
              className={cn(
                "flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all",
                showArchived
                  ? "bg-warning/20 text-warning border border-warning/30"
                  : "bg-secondary/50 text-muted-foreground hover:text-foreground"
              )}
            >
              {showArchived ? (
                <ArchiveRestore className="h-4 w-4" />
              ) : (
                <Archive className="h-4 w-4" />
              )}
              {showArchived ? "Ver Ativos" : `Arquivados (${archivedCount})`}
            </button>
          )}
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
              viewMode === "grid"
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:bg-secondary"
            )}
          >
            <Grid3X3 className="h-5 w-5" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
              viewMode === "list"
                ? "bg-primary/20 text-primary"
                : "text-muted-foreground hover:bg-secondary"
            )}
          >
            <List className="h-5 w-5" />
          </button>
        </div>
      </motion.div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Carregando clientes...</p>
        </div>
      ) : filteredClients.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary/50">
            <Users className="h-10 w-10 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-foreground">
            {searchQuery || activeFilter !== "Todos"
              ? "Nenhum cliente encontrado"
              : "Nenhum cliente cadastrado"}
          </h3>
          <p className="mt-2 text-muted-foreground">
            {searchQuery || activeFilter !== "Todos"
              ? "Tente ajustar os filtros de busca"
              : "Crie um novo contrato para cadastrar seu primeiro cliente"}
          </p>
          <Link to="/contratos/novo">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="mt-6 flex items-center gap-2 rounded-xl bg-gradient-gold px-5 py-3 font-medium text-primary-foreground shadow-gold"
            >
              <Plus className="h-5 w-5" />
              Novo Contrato
            </motion.button>
          </Link>
        </motion.div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredClients.map((client, index) => (
            <motion.div
              key={client.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              whileHover={{ y: -4 }}
              onClick={() => selectionMode && toggleSelection(client.id)}
              className={cn(
                "group relative rounded-2xl border bg-gradient-to-br from-card to-card/50 p-5 transition-all",
                selectionMode ? "cursor-pointer" : "cursor-default",
                selectedClients.has(client.id)
                  ? "border-primary bg-primary/5"
                  : "border-border/50 hover:border-primary/30"
              )}
            >
              {/* Selection Checkbox */}
              {selectionMode && (
                <div className="absolute top-3 right-3 z-10">
                  {selectedClients.has(client.id) ? (
                    <CheckSquare className="h-5 w-5 text-primary" />
                  ) : (
                    <Square className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              )}

              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-gold font-display font-bold text-primary-foreground">
                    {getInitials(client.name)}
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{client.name}</h3>
                    <p className="text-sm text-muted-foreground">{client.cpf}</p>
                  </div>
                </div>
                {!selectionMode && (
                  <div className="flex items-center gap-2">
                    <ClientScoreBadge clientId={client.id} size="sm" />
                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                        statusStyles[client.status]
                      )}
                    >
                      {client.status}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-4 space-y-2">
                {client.city && client.state && (
                  <p className="text-sm text-muted-foreground">
                    {client.city}, {client.state}
                  </p>
                )}
                {client.whatsapp && (
                  <p className="text-sm text-muted-foreground">{client.whatsapp}</p>
                )}
              </div>

              {!selectionMode && (
                <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-4">
                  <div className="flex gap-2">
                    {client.whatsapp && (
                      <a
                        href={`https://wa.me/55${client.whatsapp.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Phone className="h-4 w-4" />
                      </a>
                    )}
                    {client.email && (
                      <a
                        href={`mailto:${client.email}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/50 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Mail className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                  <Link
                    to={`/clientes/${client.id}`}
                    className="flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    Ver Dossiê
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              )}

              {/* Hover glow */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent" />
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
          <table className="w-full">
            <thead className="bg-secondary/30">
              <tr>
                {selectionMode && (
                  <th className="px-4 py-4 w-12">
                    <button onClick={toggleSelectAll}>
                      {selectedClients.size === filteredClients.length ? (
                        <CheckSquare className="h-5 w-5 text-primary" />
                      ) : (
                        <Square className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>
                  </th>
                )}
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Cliente
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  CPF
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Score
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Cidade
                </th>
                <th className="px-6 py-4 text-left text-sm font-medium text-muted-foreground">
                  Contato
                </th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {filteredClients.map((client, index) => (
                <motion.tr
                  key={client.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => selectionMode && toggleSelection(client.id)}
                  className={cn(
                    "transition-colors",
                    selectionMode ? "cursor-pointer" : "cursor-default",
                    selectedClients.has(client.id)
                      ? "bg-primary/10"
                      : "hover:bg-secondary/20"
                  )}
                >
                  {selectionMode && (
                    <td className="px-4 py-4">
                      {selectedClients.has(client.id) ? (
                        <CheckSquare className="h-5 w-5 text-primary" />
                      ) : (
                        <Square className="h-5 w-5 text-muted-foreground" />
                      )}
                    </td>
                  )}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-gold font-display font-bold text-sm text-primary-foreground">
                        {getInitials(client.name)}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{client.name}</p>
                        <p className="text-xs text-muted-foreground">{client.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {client.cpf}
                  </td>
                  <td className="px-6 py-4">
                    <ClientScoreBadge clientId={client.id} size="sm" />
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 text-xs font-medium",
                        statusStyles[client.status]
                      )}
                    >
                      {client.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {client.city && client.state ? `${client.city}, ${client.state}` : "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {client.whatsapp || "-"}
                  </td>
                  <td className="px-6 py-4">
                    {!selectionMode && (
                      <Link to={`/clientes/${client.id}`}>
                        <button className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </Link>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </MainLayout>
  );
};

export default Clientes;

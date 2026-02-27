import { useState, useRef, useEffect, useCallback } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Bot,
  Send,
  User,
  Loader2,
  Wrench,
  MessageSquare,
  Sparkles,
  Trash2,
  Phone,
  DollarSign,
  History,
  AlertTriangle,
  Users,
  CheckCircle2,
  XCircle,
  BarChart3,
  Clock,
  Zap,
  TrendingUp,
  Activity,
  LayoutDashboard,
  Plus,
  MessagesSquare,
  Copy,
  Check,
  Search,
  CreditCard,
  Brain,
  BookMarked,
  FileBarChart,
  Target,
  CalendarClock,
  FileText,
  ScrollText,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  toolCalls?: ToolCallResult[];
  usage?: { tokens: number; response_time_ms: number; tool_iterations: number };
}

interface ToolCallResult {
  tool: string;
  args: Record<string, unknown>;
  result: unknown;
}

interface AgentMetrics {
  total_conversations: number;
  total_messages: number;
  total_tool_calls: number;
  total_tokens: number;
  avg_response_time_ms: number;
  successful_tool_calls: number;
  failed_tool_calls: number;
  escalations: number;
  promises_registered: number;
  messages_sent_whatsapp: number;
}

interface AIReport {
  id: string;
  title: string;
  report_type: string;
  content: string;
  insights: string[];
  period_start: string;
  period_end: string;
  created_at: string;
}

const TOOL_ICONS: Record<string, typeof Phone> = {
  get_client_info: Users,
  search_client_by_name: Search,
  get_client_contracts: ScrollText,
  get_renegotiation_options: DollarSign,
  register_payment_promise: CheckCircle2,
  mark_installment_paid: CreditCard,
  get_conversation_history: History,
  send_whatsapp_message: Phone,
  escalate_to_human: AlertTriangle,
  get_pending_by_tier: Users,
  bulk_send_collection: Zap,
  get_dashboard_summary: LayoutDashboard,
  get_client_memory: Brain,
  save_client_memory: BookMarked,
  predict_defaults: Target,
  generate_report: FileBarChart,
  schedule_followup: CalendarClock,
};

const TOOL_LABELS: Record<string, string> = {
  get_client_info: "Consultar Cliente",
  search_client_by_name: "Buscar por Nome",
  get_client_contracts: "Contratos do Cliente",
  get_renegotiation_options: "Renegociação",
  register_payment_promise: "Promessa de Pagamento",
  mark_installment_paid: "Registrar Pagamento",
  get_conversation_history: "Histórico",
  send_whatsapp_message: "Enviar WhatsApp",
  escalate_to_human: "Escalar para Humano",
  get_pending_by_tier: "Inadimplentes por Faixa",
  bulk_send_collection: "Cobrança em Lote",
  get_dashboard_summary: "Resumo Dashboard",
  get_client_memory: "Memória do Cliente",
  save_client_memory: "Salvar Memória",
  predict_defaults: "Análise Preditiva",
  generate_report: "Gerar Relatório",
  schedule_followup: "Agendar Follow-up",
};

const QUICK_ACTIONS = [
  { label: "📊 Resumo da carteira", message: "Me dê um resumo completo da carteira de clientes" },
  { label: "🔮 Análise preditiva", message: "Faça uma análise preditiva e identifique os clientes com maior risco de inadimplência" },
  { label: "📈 Relatório semanal", message: "Gere um relatório semanal com insights e recomendações" },
  { label: "🟡 Atrasos leves", message: "Liste os clientes com atraso de 1 a 7 dias" },
  { label: "🔴 Atrasos críticos", message: "Liste os clientes com mais de 30 dias de atraso" },
  { label: "🔍 Buscar cliente", message: "Busque o cliente pelo nome " },
  { label: "💳 Registrar pagamento", message: "Registre o pagamento da parcela do cliente com WhatsApp " },
  { label: "🧠 Memória do cliente", message: "Consulte a memória e histórico do cliente com WhatsApp " },
  { label: "📋 Ver contratos", message: "Liste os contratos do cliente com WhatsApp " },
  { label: "📅 Agendar follow-up", message: "Agende um follow-up para o cliente com WhatsApp " },
];

const MetricCard = ({ icon: Icon, label, value, sub }: { icon: typeof Activity; label: string; value: string | number; sub?: string }) => (
  <div className="rounded-lg border border-border/50 bg-card p-3 space-y-1">
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon className="h-4 w-4" />
      <span className="text-xs">{label}</span>
    </div>
    <p className="text-xl font-bold text-foreground">{value}</p>
    {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
  </div>
);

interface ConversationItem {
  id: string;
  title: string;
  created_at: string;
  total_messages: number;
}

const TypingIndicator = () => (
  <div className="flex gap-1 items-center px-2">
    <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} className="w-2 h-2 rounded-full bg-primary/60" />
    <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }} className="w-2 h-2 rounded-full bg-primary/60" />
    <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }} className="w-2 h-2 rounded-full bg-primary/60" />
  </div>
);

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted/50" title="Copiar">
      {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
    </button>
  );
};

const AgenteIA = () => {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState<AgentMetrics | null>(null);
  const [activeTab, setActiveTab] = useState("chat");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [reports, setReports] = useState<AIReport[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMetrics = useCallback(async () => {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("ai_agent_metrics")
      .select("*")
      .eq("date", today)
      .limit(1);
    if (data?.[0]) setMetrics(data[0] as unknown as AgentMetrics);
  }, []);

  const fetchConversations = useCallback(async () => {
    if (!profile?.user_id) return;
    const { data } = await supabase
      .from("ai_conversations")
      .select("id, title, created_at, total_messages")
      .eq("operator_id", profile.user_id)
      .eq("status", "active")
      .order("updated_at", { ascending: false })
      .limit(20);
    if (data) setConversations(data as unknown as ConversationItem[]);
  }, [profile?.user_id]);

  const fetchReports = useCallback(async () => {
    if (!profile?.user_id) return;
    const { data } = await supabase
      .from("ai_reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setReports(data as unknown as AIReport[]);
  }, [profile?.user_id]);

  useEffect(() => {
    fetchMetrics();
    fetchConversations();
    fetchReports();
  }, [fetchMetrics, fetchConversations, fetchReports]);

  const createConversation = async (title?: string): Promise<string | null> => {
    if (!profile?.user_id) return null;
    const { data, error } = await supabase
      .from("ai_conversations")
      .insert({ operator_id: profile.user_id, title: title || "Nova Conversa" })
      .select("id")
      .single();
    if (error || !data) { console.error("Create conversation error:", error); return null; }
    return data.id;
  };

  const loadConversation = async (convId: string) => {
    const { data } = await supabase
      .from("ai_messages")
      .select("id, role, content, tool_calls, tokens_used, response_time_ms, created_at")
      .eq("conversation_id", convId)
      .order("created_at", { ascending: true });

    if (data) {
      setMessages(data.map((m: any) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
        timestamp: new Date(m.created_at),
        toolCalls: m.tool_calls as ToolCallResult[] | undefined,
        usage: m.tokens_used ? { tokens: m.tokens_used, response_time_ms: m.response_time_ms || 0, tool_iterations: 0 } : undefined,
      })));
    }
    setConversationId(convId);
    setShowHistory(false);
  };

  const deleteConversation = async (convId: string) => {
    await supabase.from("ai_messages").delete().eq("conversation_id", convId);
    await supabase.from("ai_conversations").delete().eq("id", convId);
    if (conversationId === convId) {
      setMessages([]);
      setConversationId(null);
    }
    fetchConversations();
    toast.success("Conversa excluída");
  };

  const saveMessage = async (convId: string, role: string, content: string, toolCalls?: ToolCallResult[], tokensUsed?: number, responseTimeMs?: number) => {
    await supabase.from("ai_messages").insert({
      conversation_id: convId,
      role,
      content,
      tool_calls: toolCalls ? (toolCalls as any) : null,
      tokens_used: tokensUsed || 0,
      response_time_ms: responseTimeMs || 0,
    });
  };

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    let activeConvId = conversationId;
    if (!activeConvId) {
      const autoTitle = text.length > 50 ? text.substring(0, 47) + "..." : text;
      activeConvId = await createConversation(autoTitle);
      if (!activeConvId) { toast.error("Erro ao criar conversa"); return; }
      setConversationId(activeConvId);
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    saveMessage(activeConvId, "user", text);

    try {
      const conversationMessages = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const { data, error } = await supabase.functions.invoke("ai-agent-chat", {
        body: {
          messages: conversationMessages,
          conversation_id: activeConvId,
          operator_id: profile?.user_id || "system",
        },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.response || "Desculpe, não consegui processar.",
        timestamp: new Date(),
        toolCalls: data.tool_calls,
        usage: data.usage,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      fetchMetrics();
      fetchConversations();
      // Refresh reports if generate_report was called
      if (data.tool_calls?.some((tc: any) => tc.tool === "generate_report")) {
        fetchReports();
      }
    } catch (err: any) {
      console.error("AI Agent error:", err);
      toast.error("Erro: " + (err.message || "Erro desconhecido"));
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: "❌ Erro ao processar. Tente novamente.", timestamp: new Date() },
      ]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const newChat = () => {
    setMessages([]);
    setConversationId(null);
    toast.success("Nova conversa iniciada");
  };

  const clearChat = () => {
    setMessages([]);
    setConversationId(null);
    toast.success("Conversa limpa");
  };

  const renderToolCall = (tc: ToolCallResult, index: number) => {
    const Icon = TOOL_ICONS[tc.tool] || Wrench;
    const label = TOOL_LABELS[tc.tool] || tc.tool;
    const resultData = tc.result as Record<string, unknown>;
    const success = resultData?.success !== false;
    const execTime = resultData?.execution_time_ms;

    return (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="flex items-start gap-2 rounded-lg border border-border/50 bg-muted/30 p-2.5 text-xs"
      >
        <div className={`mt-0.5 rounded-md p-1 ${success ? "bg-primary/10" : "bg-destructive/10"}`}>
          <Icon className={`h-3.5 w-3.5 ${success ? "text-primary" : "text-destructive"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-foreground">{label}</span>
            {success ? <CheckCircle2 className="h-3 w-3 text-primary" /> : <XCircle className="h-3 w-3 text-destructive" />}
            {execTime && (
              <span className="text-muted-foreground flex items-center gap-0.5">
                <Clock className="h-2.5 w-2.5" /> {Number(execTime)}ms
              </span>
            )}
          </div>
          {Object.keys(tc.args).length > 0 && (
            <p className="text-muted-foreground mt-0.5 truncate">
              {Object.entries(tc.args).map(([k, v]) => `${k}: ${v}`).join(" • ")}
            </p>
          )}
        </div>
      </motion.div>
    );
  };

  const renderReport = (report: AIReport) => {
    let parsed: any = {};
    try { parsed = JSON.parse(report.content); } catch {}
    const insights = (report.insights || parsed.insights || []) as string[];

    return (
      <motion.div
        key={report.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="mb-3">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <FileBarChart className="h-4 w-4 text-primary" />
                {report.title}
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {report.report_type === "weekly" ? "Semanal" : report.report_type === "monthly" ? "Mensal" : "Personalizado"}
              </Badge>
            </div>
            <CardDescription className="text-xs">
              {new Date(report.period_start).toLocaleDateString("pt-BR")} — {new Date(report.period_end).toLocaleDateString("pt-BR")}
              {" • "}Gerado em {new Date(report.created_at).toLocaleDateString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {parsed.metricas && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                {Object.entries(parsed.metricas).map(([key, val]) => (
                  <div key={key} className="rounded-md border border-border/40 bg-muted/20 p-2 text-center">
                    <p className="text-xs text-muted-foreground">{key.replace(/_/g, " ")}</p>
                    <p className="text-sm font-semibold text-foreground">{String(val)}</p>
                  </div>
                ))}
              </div>
            )}
            {insights.length > 0 && (
              <div className="space-y-1">
                {insights.map((insight, i) => (
                  <p key={i} className="text-xs text-foreground">{String(insight)}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <MainLayout>
      <div className="flex flex-col h-[calc(100vh-6rem)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Bot className="h-7 w-7 text-primary" />
              Agente IA de Cobrança
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              GPT-5 Mini • 17 ferramentas • Memória + Predição + Relatórios
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Sparkles className="h-3 w-3" /> GPT-5 Mini
            </Badge>
            <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)}>
              <MessagesSquare className="h-4 w-4 mr-1" /> Histórico
            </Button>
            <Button variant="outline" size="sm" onClick={newChat}>
              <Plus className="h-4 w-4 mr-1" /> Nova
            </Button>
            {messages.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearChat}>
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="w-fit">
            <TabsTrigger value="chat" className="gap-1"><MessageSquare className="h-4 w-4" /> Chat</TabsTrigger>
            <TabsTrigger value="metrics" className="gap-1"><BarChart3 className="h-4 w-4" /> Métricas</TabsTrigger>
            <TabsTrigger value="reports" className="gap-1"><FileText className="h-4 w-4" /> Relatórios</TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden mt-3">
            <div className="flex flex-1 gap-3 overflow-hidden">
              <AnimatePresence>
                {showHistory && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 256, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="shrink-0 overflow-hidden"
                  >
                    <Card className="w-64 h-full flex flex-col overflow-hidden">
                      <div className="p-3 border-b border-border/50">
                        <p className="text-sm font-medium text-foreground">Conversas</p>
                      </div>
                      <ScrollArea className="flex-1">
                        {conversations.length === 0 ? (
                          <p className="text-xs text-muted-foreground p-3">Nenhuma conversa salva</p>
                        ) : (
                          <div className="p-1 space-y-0.5">
                            {conversations.map((conv) => (
                              <div
                                key={conv.id}
                                className={`group flex items-center rounded-md hover:bg-muted/50 transition-colors ${
                                  conversationId === conv.id ? "bg-muted" : ""
                                }`}
                              >
                                <button
                                  onClick={() => loadConversation(conv.id)}
                                  className="flex-1 text-left px-2.5 py-2 text-xs min-w-0"
                                >
                                  <p className="font-medium text-foreground truncate">{conv.title || "Nova Conversa"}</p>
                                  <p className="text-muted-foreground mt-0.5">
                                    {new Date(conv.created_at).toLocaleDateString("pt-BR")} • {conv.total_messages} msgs
                                  </p>
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                                  className="opacity-0 group-hover:opacity-100 p-1.5 mr-1 rounded hover:bg-destructive/10 transition-all"
                                  title="Excluir conversa"
                                >
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </ScrollArea>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>

              <Card className="flex-1 flex flex-col overflow-hidden">
                <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="rounded-full bg-primary/10 p-5 mb-4"
                      >
                        <Bot className="h-10 w-10 text-primary" />
                      </motion.div>
                      <h3 className="text-lg font-semibold text-foreground mb-1">Agente IA Pronto</h3>
                      <p className="text-muted-foreground text-sm max-w-md mb-6">
                        17 ferramentas: consulta, contratos, pagamento, cobrança, renegociação, WhatsApp, memória, predição, relatórios e mais.
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 max-w-4xl w-full">
                        {QUICK_ACTIONS.map((action, i) => (
                          <motion.div
                            key={action.label}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.04 }}
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs h-auto py-2.5 justify-start text-left w-full hover:border-primary/50 hover:bg-primary/5 transition-colors"
                              onClick={() => sendMessage(action.message)}
                            >
                              {action.label}
                            </Button>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <AnimatePresence initial={false}>
                        {messages.map((msg) => (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`group flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                          >
                            {msg.role === "assistant" && (
                              <div className="shrink-0 rounded-full bg-primary/10 p-2 h-8 w-8 flex items-center justify-center">
                                <Bot className="h-4 w-4 text-primary" />
                              </div>
                            )}
                            <div className={`max-w-[75%] space-y-2 ${msg.role === "user" ? "order-1" : ""}`}>
                              <div className={`rounded-2xl px-4 py-3 relative ${
                                msg.role === "user"
                                  ? "bg-primary text-primary-foreground rounded-br-md"
                                  : "bg-muted rounded-bl-md"
                              }`}>
                                {msg.role === "assistant" ? (
                                  <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                  </div>
                                ) : (
                                  <p className="text-sm">{msg.content}</p>
                                )}
                                {msg.role === "assistant" && (
                                  <div className="absolute -top-2 -right-2">
                                    <CopyButton text={msg.content} />
                                  </div>
                                )}
                              </div>

                              {msg.toolCalls && msg.toolCalls.length > 0 && (
                                <div className="space-y-1.5">
                                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Wrench className="h-3 w-3" /> {msg.toolCalls.length} ferramenta(s):
                                  </p>
                                  {msg.toolCalls.map((tc, i) => renderToolCall(tc, i))}
                                </div>
                              )}

                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{msg.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                                {msg.usage && (
                                  <>
                                    <span>•</span>
                                    <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" /> {msg.usage.response_time_ms}ms</span>
                                    <span>•</span>
                                    <span>{msg.usage.tokens} tokens</span>
                                    {msg.usage.tool_iterations > 0 && (
                                      <>
                                        <span>•</span>
                                        <span>{msg.usage.tool_iterations} iterações</span>
                                      </>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>

                            {msg.role === "user" && (
                              <div className="shrink-0 rounded-full bg-secondary p-2 h-8 w-8 flex items-center justify-center order-2">
                                <User className="h-4 w-4 text-secondary-foreground" />
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>

                      {isLoading && (
                        <motion.div
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex gap-3 justify-start"
                        >
                          <div className="shrink-0 rounded-full bg-primary/10 p-2 h-8 w-8 flex items-center justify-center">
                            <Bot className="h-4 w-4 text-primary" />
                          </div>
                          <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <TypingIndicator />
                              <span className="text-xs">Analisando...</span>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}
                </ScrollArea>

                <Separator />

                <div className="p-3">
                  <div className="flex gap-2">
                    <Input
                      ref={inputRef}
                      placeholder="Ex: Busque o cliente João e envie uma cobrança..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                      disabled={isLoading}
                      className="flex-1"
                    />
                    <Button onClick={() => sendMessage()} disabled={isLoading || !input.trim()} size="icon">
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="metrics" className="mt-3 space-y-4 overflow-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Métricas do Agente — Hoje
                </CardTitle>
                <CardDescription>Performance e atividade do agente de IA em tempo real</CardDescription>
              </CardHeader>
              <CardContent>
                {metrics ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    <MetricCard icon={MessageSquare} label="Mensagens" value={metrics.total_messages} />
                    <MetricCard icon={Wrench} label="Ferramentas" value={metrics.total_tool_calls} sub={`${metrics.successful_tool_calls} ok / ${metrics.failed_tool_calls} falhas`} />
                    <MetricCard icon={Clock} label="Tempo Médio" value={`${metrics.avg_response_time_ms}ms`} />
                    <MetricCard icon={Zap} label="Tokens" value={metrics.total_tokens.toLocaleString()} />
                    <MetricCard icon={Phone} label="WhatsApp" value={metrics.messages_sent_whatsapp} />
                    <MetricCard icon={CheckCircle2} label="Promessas" value={metrics.promises_registered} />
                    <MetricCard icon={AlertTriangle} label="Escalações" value={metrics.escalations} />
                    <MetricCard icon={Activity} label="Conversas" value={metrics.total_conversations} />
                    <MetricCard
                      icon={TrendingUp}
                      label="Taxa Sucesso"
                      value={metrics.total_tool_calls > 0 ? `${Math.round((metrics.successful_tool_calls / metrics.total_tool_calls) * 100)}%` : "N/A"}
                    />
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>Nenhuma métrica registrada hoje. Inicie uma conversa com o agente.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-primary" />
                  Ferramentas Disponíveis ({Object.keys(TOOL_LABELS).length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {Object.entries(TOOL_LABELS).map(([key, label]) => {
                    const Icon = TOOL_ICONS[key] || Wrench;
                    return (
                      <div key={key} className="flex items-center gap-3 rounded-lg border border-border/50 p-3">
                        <div className="rounded-md bg-primary/10 p-2">
                          <Icon className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{label}</p>
                          <p className="text-xs text-muted-foreground">{key}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="mt-3 overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <FileBarChart className="h-5 w-5 text-primary" />
                  Relatórios Gerados pela IA
                </h2>
                <p className="text-sm text-muted-foreground">Histórico de relatórios com insights e métricas</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => { setActiveTab("chat"); sendMessage("Gere um relatório semanal com insights e recomendações"); }}>
                <Plus className="h-4 w-4 mr-1" /> Novo Relatório
              </Button>
            </div>

            {reports.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <FileBarChart className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>Nenhum relatório gerado ainda.</p>
                  <p className="text-sm mt-1">Use o chat para pedir um relatório semanal ou mensal.</p>
                </CardContent>
              </Card>
            ) : (
              <div>
                {reports.map(renderReport)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default AgenteIA;

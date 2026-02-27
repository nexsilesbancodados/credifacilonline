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
} from "lucide-react";
import ReactMarkdown from "react-markdown";

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

const TOOL_ICONS: Record<string, typeof Phone> = {
  get_client_info: Users,
  get_renegotiation_options: DollarSign,
  register_payment_promise: CheckCircle2,
  get_conversation_history: History,
  send_whatsapp_message: Phone,
  escalate_to_human: AlertTriangle,
  get_pending_by_tier: Users,
  bulk_send_collection: Zap,
  get_dashboard_summary: LayoutDashboard,
};

const TOOL_LABELS: Record<string, string> = {
  get_client_info: "Consultar Cliente",
  get_renegotiation_options: "Renegociação",
  register_payment_promise: "Promessa de Pagamento",
  get_conversation_history: "Histórico",
  send_whatsapp_message: "Enviar WhatsApp",
  escalate_to_human: "Escalar para Humano",
  get_pending_by_tier: "Inadimplentes por Faixa",
  bulk_send_collection: "Cobrança em Lote",
  get_dashboard_summary: "Resumo Dashboard",
};

const QUICK_ACTIONS = [
  { label: "📊 Resumo da carteira", message: "Me dê um resumo completo da carteira de clientes" },
  { label: "🟡 Atrasos leves (1-7d)", message: "Liste os clientes com atraso de 1 a 7 dias e sugira a melhor abordagem" },
  { label: "🟠 Atrasos moderados", message: "Quais clientes estão com 8 a 30 dias de atraso? Sugira ações." },
  { label: "🔴 Atrasos críticos", message: "Liste os clientes com mais de 30 dias de atraso com análise de risco" },
  { label: "🔍 Consultar cliente", message: "Consulte as informações e dívidas do cliente com WhatsApp " },
  { label: "💰 Renegociar dívida", message: "Quais opções de renegociação temos para o cliente " },
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

const AgenteIA = () => {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState<AgentMetrics | null>(null);
  const [activeTab, setActiveTab] = useState("chat");
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

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const conversationMessages = [...messages, userMessage].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const { data, error } = await supabase.functions.invoke("ai-agent-chat", {
        body: {
          messages: conversationMessages,
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
      fetchMetrics(); // Refresh metrics after each interaction
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

  const clearChat = () => {
    setMessages([]);
    toast.success("Conversa limpa");
  };

  const renderToolCall = (tc: ToolCallResult, index: number) => {
    const Icon = TOOL_ICONS[tc.tool] || Wrench;
    const label = TOOL_LABELS[tc.tool] || tc.tool;
    const resultData = tc.result as Record<string, unknown>;
    const success = resultData?.success !== false;
    const execTime = resultData?.execution_time_ms;

    return (
      <div key={index} className="flex items-start gap-2 rounded-lg border border-border/50 bg-muted/30 p-2.5 text-xs">
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
      </div>
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
              DeepSeek + Evolution API • 9 ferramentas • Cobrança inteligente
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Sparkles className="h-3 w-3" /> DeepSeek V3
            </Badge>
            {messages.length > 0 && (
              <Button variant="outline" size="sm" onClick={clearChat}>
                <Trash2 className="h-4 w-4 mr-1" /> Limpar
              </Button>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="w-fit">
            <TabsTrigger value="chat" className="gap-1"><MessageSquare className="h-4 w-4" /> Chat</TabsTrigger>
            <TabsTrigger value="metrics" className="gap-1"><BarChart3 className="h-4 w-4" /> Métricas</TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden mt-3">
            <Card className="flex-1 flex flex-col overflow-hidden">
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                    <div className="rounded-full bg-primary/10 p-5 mb-4">
                      <Bot className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-1">Agente IA Pronto</h3>
                    <p className="text-muted-foreground text-sm max-w-md mb-6">
                      9 ferramentas: consulta, cobrança, renegociação, WhatsApp em lote, escalação e mais.
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-w-2xl w-full">
                      {QUICK_ACTIONS.map((action) => (
                        <Button
                          key={action.label}
                          variant="outline"
                          size="sm"
                          className="text-xs h-auto py-2 justify-start text-left"
                          onClick={() => sendMessage(action.message)}
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        {msg.role === "assistant" && (
                          <div className="shrink-0 rounded-full bg-primary/10 p-2 h-8 w-8 flex items-center justify-center">
                            <Bot className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        <div className={`max-w-[75%] space-y-2 ${msg.role === "user" ? "order-1" : ""}`}>
                          <div className={`rounded-2xl px-4 py-3 ${
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
                      </div>
                    ))}

                    {isLoading && (
                      <div className="flex gap-3 justify-start">
                        <div className="shrink-0 rounded-full bg-primary/10 p-2 h-8 w-8 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                        <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Analisando e executando ferramentas...
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>

              <Separator />

              <div className="p-3">
                <div className="flex gap-2">
                  <Input
                    ref={inputRef}
                    placeholder="Ex: Consulte o cliente 11999999999 e envie uma cobrança..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button onClick={() => sendMessage()} disabled={isLoading || !input.trim()}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </Card>
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

            {/* Capabilities Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-primary" />
                  Ferramentas Disponíveis
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
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default AgenteIA;

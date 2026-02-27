import { useState, useRef, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
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
} from "lucide-react";
import ReactMarkdown from "react-markdown";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  toolCalls?: ToolCallResult[];
}

interface ToolCallResult {
  tool: string;
  args: Record<string, unknown>;
  result: unknown;
}

const TOOL_ICONS: Record<string, typeof Phone> = {
  get_client_info: Users,
  get_renegotiation_options: DollarSign,
  register_payment_promise: CheckCircle2,
  get_conversation_history: History,
  send_whatsapp_message: Phone,
  escalate_to_human: AlertTriangle,
  get_pending_by_tier: Users,
};

const TOOL_LABELS: Record<string, string> = {
  get_client_info: "Consultar Cliente",
  get_renegotiation_options: "Opções de Renegociação",
  register_payment_promise: "Registrar Promessa",
  get_conversation_history: "Histórico",
  send_whatsapp_message: "Enviar WhatsApp",
  escalate_to_human: "Escalar para Humano",
  get_pending_by_tier: "Listar Inadimplentes",
};

const QUICK_ACTIONS = [
  { label: "Inadimplentes leves", message: "Liste os clientes com atraso de 1 a 7 dias" },
  { label: "Inadimplentes moderados", message: "Liste os clientes com atraso de 8 a 30 dias" },
  { label: "Inadimplentes críticos", message: "Liste os clientes com mais de 30 dias de atraso" },
  { label: "Consultar cliente", message: "Consulte as informações do cliente com WhatsApp " },
];

const AgenteIA = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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
        body: { messages: conversationMessages },
      });

      if (error) throw error;

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.response || "Desculpe, não consegui processar sua solicitação.",
        timestamp: new Date(),
        toolCalls: data.tool_calls,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err: any) {
      console.error("AI Agent error:", err);
      toast.error("Erro ao comunicar com o agente: " + (err.message || "Erro desconhecido"));

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "❌ Ocorreu um erro ao processar sua mensagem. Tente novamente.",
          timestamp: new Date(),
        },
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

    return (
      <div key={index} className="flex items-start gap-2 rounded-lg border border-border/50 bg-muted/30 p-3 text-xs">
        <div className={`mt-0.5 rounded-md p-1 ${success ? "bg-primary/10" : "bg-destructive/10"}`}>
          <Icon className={`h-3.5 w-3.5 ${success ? "text-primary" : "text-destructive"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">{label}</span>
            {success ? (
              <CheckCircle2 className="h-3 w-3 text-primary" />
            ) : (
              <XCircle className="h-3 w-3 text-destructive" />
            )}
          </div>
          {Object.keys(tc.args).length > 0 && (
            <p className="text-muted-foreground mt-0.5">
              {Object.entries(tc.args)
                .map(([k, v]) => `${k}: ${v}`)
                .join(" • ")}
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
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Bot className="h-7 w-7 text-primary" />
              Agente IA de Cobrança
            </h1>
            <p className="text-muted-foreground mt-1">
              Assistente inteligente com DeepSeek para cobrança e atendimento via WhatsApp
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1">
              <Sparkles className="h-3 w-3" /> DeepSeek
            </Badge>
            {messages.length > 0 && (
              <Button variant="outline" size="sm" onClick={clearChat}>
                <Trash2 className="h-4 w-4 mr-1" /> Limpar
              </Button>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <Card className="flex-1 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                <div className="rounded-full bg-primary/10 p-6 mb-4">
                  <Bot className="h-12 w-12 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Agente IA Pronto
                </h3>
                <p className="text-muted-foreground max-w-md mb-6">
                  Consulte clientes, envie cobranças, negocie dívidas e gerencie atendimentos automaticamente.
                </p>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-2 max-w-lg w-full">
                  {QUICK_ACTIONS.map((action) => (
                    <Button
                      key={action.label}
                      variant="outline"
                      size="sm"
                      className="text-xs h-auto py-2 justify-start"
                      onClick={() => sendMessage(action.message)}
                    >
                      <MessageSquare className="h-3 w-3 mr-1.5 shrink-0" />
                      {action.label}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="shrink-0 rounded-full bg-primary/10 p-2 h-8 w-8 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    )}

                    <div
                      className={`max-w-[75%] space-y-2 ${
                        msg.role === "user" ? "order-1" : ""
                      }`}
                    >
                      <div
                        className={`rounded-2xl px-4 py-3 ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted rounded-bl-md"
                        }`}
                      >
                        {msg.role === "assistant" ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-sm">{msg.content}</p>
                        )}
                      </div>

                      {/* Tool Calls */}
                      {msg.toolCalls && msg.toolCalls.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Wrench className="h-3 w-3" /> Ferramentas utilizadas:
                          </p>
                          {msg.toolCalls.map((tc, i) => renderToolCall(tc, i))}
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground">
                        {msg.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
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
                        Processando...
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          <Separator />

          {/* Input Area */}
          <div className="p-4">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                placeholder="Digite sua mensagem... (ex: consulte o cliente 11999999999)"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                disabled={isLoading}
                className="flex-1"
              />
              <Button onClick={() => sendMessage()} disabled={isLoading || !input.trim()}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
};

export default AgenteIA;

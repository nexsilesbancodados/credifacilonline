import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bot, Loader2, Wrench, MessageSquare, Sparkles, Trash2, Phone,
  History, AlertTriangle, Plus, MessagesSquare, BarChart3, Clock, Zap,
  TrendingUp, Activity, FileBarChart, FileText, CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAIChat, AIReport } from "@/hooks/useAIChat";
import { ChatMessageBubble, TOOL_ICONS, TOOL_LABELS } from "@/components/ai/ChatMessageBubble";
import { AIChatInput } from "@/components/ai/AIChatInput";

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

const TypingIndicator = () => (
  <div className="flex gap-1 items-center px-2">
    <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} className="w-2 h-2 rounded-full bg-primary/60" />
    <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }} className="w-2 h-2 rounded-full bg-primary/60" />
    <motion.div animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }} className="w-2 h-2 rounded-full bg-primary/60" />
  </div>
);

const AgenteIA = () => {
  const {
    messages, input, setInput, isLoading, metrics, reports,
    conversationId, conversations, showHistory, setShowHistory,
    scrollRef, inputRef,
    sendMessage, newChat, clearChat, loadConversation, deleteConversation,
    fetchReports,
  } = useAIChat();

  const [activeTab, setActiveTab] = useState("chat");

  const renderReport = (report: AIReport) => {
    let parsed: Record<string, unknown> = {};
    try { parsed = JSON.parse(report.content); } catch { /* empty */ }
    const insights = (report.insights || (parsed.insights as string[]) || []) as string[];

    return (
      <motion.div key={report.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
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
            {(parsed.metricas as Record<string, unknown>) && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
                {Object.entries(parsed.metricas as Record<string, unknown>).map(([key, val]) => (
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
                                className={`group flex items-center rounded-md hover:bg-muted/50 transition-colors ${conversationId === conv.id ? "bg-muted" : ""}`}
                              >
                                <button onClick={() => loadConversation(conv.id)} className="flex-1 text-left px-2.5 py-2 text-xs min-w-0">
                                  <p className="font-medium text-foreground truncate">{conv.title || "Nova Conversa"}</p>
                                  <p className="text-muted-foreground mt-0.5">
                                    {new Date(conv.created_at).toLocaleDateString("pt-BR")} • {conv.total_messages} msgs
                                  </p>
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                                  className="opacity-0 group-hover:opacity-100 p-1.5 mr-1 rounded hover:bg-destructive/10 transition-all"
                                  title="Excluir conversa"
                                  aria-label="Excluir conversa"
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
                      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-full bg-primary/10 p-5 mb-4">
                        <Bot className="h-10 w-10 text-primary" />
                      </motion.div>
                      <h3 className="text-lg font-semibold text-foreground mb-1">Agente IA Pronto</h3>
                      <p className="text-muted-foreground text-sm max-w-md mb-6">
                        17 ferramentas: consulta, contratos, pagamento, cobrança, renegociação, WhatsApp, memória, predição, relatórios e mais.
                      </p>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 max-w-4xl w-full">
                        {QUICK_ACTIONS.map((action, i) => (
                          <motion.div key={action.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                            <Button
                              variant="outline" size="sm"
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
                          <ChatMessageBubble key={msg.id} msg={msg} />
                        ))}
                      </AnimatePresence>

                      {isLoading && (
                        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 justify-start">
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
                <AIChatInput input={input} setInput={setInput} isLoading={isLoading} onSend={() => sendMessage()} inputRef={inputRef} />
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
              <div>{reports.map(renderReport)}</div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default AgenteIA;

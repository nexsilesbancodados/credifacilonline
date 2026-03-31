import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  toolCalls?: ToolCallResult[];
  usage?: { tokens: number; response_time_ms: number; tool_iterations: number };
}

export interface ToolCallResult {
  tool: string;
  args: Record<string, unknown>;
  result: unknown;
}

export interface AgentMetrics {
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

export interface AIReport {
  id: string;
  title: string;
  report_type: string;
  content: string;
  insights: string[];
  period_start: string;
  period_end: string;
  created_at: string;
}

export interface ConversationItem {
  id: string;
  title: string;
  created_at: string;
  total_messages: number;
}

export function useAIChat() {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [metrics, setMetrics] = useState<AgentMetrics | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [reports, setReports] = useState<AIReport[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const fetchMetrics = useCallback(async () => {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase.from("ai_agent_metrics").select("*").eq("date", today).limit(1);
    if (data?.[0]) setMetrics(data[0] as unknown as AgentMetrics);
  }, []);

  const fetchConversations = useCallback(async () => {
    if (!profile?.user_id) return;
    const { data } = await supabase.from("ai_conversations").select("id, title, created_at, total_messages").eq("operator_id", profile.user_id).eq("status", "active").order("updated_at", { ascending: false }).limit(20);
    if (data) setConversations(data as unknown as ConversationItem[]);
  }, [profile?.user_id]);

  const fetchReports = useCallback(async () => {
    if (!profile?.user_id) return;
    const { data } = await supabase.from("ai_reports").select("*").order("created_at", { ascending: false }).limit(20);
    if (data) setReports(data as unknown as AIReport[]);
  }, [profile?.user_id]);

  useEffect(() => { fetchMetrics(); fetchConversations(); fetchReports(); }, [fetchMetrics, fetchConversations, fetchReports]);

  const createConversation = async (title?: string): Promise<string | null> => {
    if (!profile?.user_id) return null;
    const { data, error } = await supabase.from("ai_conversations").insert({ operator_id: profile.user_id, title: title || "Nova Conversa" }).select("id").single();
    if (error || !data) { console.error("Create conversation error:", error); return null; }
    return data.id;
  };

  const loadConversation = async (convId: string) => {
    const { data } = await supabase.from("ai_messages").select("id, role, content, tool_calls, tokens_used, response_time_ms, created_at").eq("conversation_id", convId).order("created_at", { ascending: true });
    if (data) {
      setMessages(data.map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
        timestamp: new Date(m.created_at),
        toolCalls: m.tool_calls as unknown as ToolCallResult[] | undefined,
        usage: m.tokens_used ? { tokens: m.tokens_used, response_time_ms: m.response_time_ms || 0, tool_iterations: 0 } : undefined,
      })));
    }
    setConversationId(convId);
    setShowHistory(false);
  };

  const deleteConversation = async (convId: string) => {
    await supabase.from("ai_messages").delete().eq("conversation_id", convId);
    await supabase.from("ai_conversations").delete().eq("id", convId);
    if (conversationId === convId) { setMessages([]); setConversationId(null); }
    fetchConversations();
    toast.success("Conversa excluída");
  };

  const saveMessage = async (convId: string, role: string, content: string, toolCalls?: ToolCallResult[], tokensUsed?: number, responseTimeMs?: number) => {
    await supabase.from("ai_messages").insert([{
      conversation_id: convId, role, content,
      tool_calls: toolCalls ? JSON.parse(JSON.stringify(toolCalls)) : null,
      tokens_used: tokensUsed || 0, response_time_ms: responseTimeMs || 0,
    }]);
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

    const userMessage: Message = { id: crypto.randomUUID(), role: "user", content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    saveMessage(activeConvId, "user", text);

    try {
      const conversationMessages = [...messages, userMessage].map(m => ({ role: m.role, content: m.content }));
      const { data, error } = await supabase.functions.invoke("ai-agent-chat", {
        body: { messages: conversationMessages, conversation_id: activeConvId, operator_id: profile?.user_id || "system" },
      });
      if (error) throw error;

      const assistantMessage: Message = {
        id: crypto.randomUUID(), role: "assistant",
        content: data.response || "Desculpe, não consegui processar.",
        timestamp: new Date(), toolCalls: data.tool_calls, usage: data.usage,
      };
      setMessages(prev => [...prev, assistantMessage]);
      fetchMetrics();
      fetchConversations();
      if (data.tool_calls?.some((tc: ToolCallResult) => tc.tool === "generate_report")) fetchReports();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro desconhecido";
      console.error("AI Agent error:", err);
      toast.error("Erro: " + message);
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: "assistant", content: "❌ Erro ao processar. Tente novamente.", timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const newChat = () => { setMessages([]); setConversationId(null); toast.success("Nova conversa iniciada"); };
  const clearChat = () => { setMessages([]); setConversationId(null); toast.success("Conversa limpa"); };

  return {
    messages, input, setInput, isLoading, metrics, reports,
    conversationId, conversations, showHistory, setShowHistory,
    scrollRef, inputRef,
    sendMessage, newChat, clearChat, loadConversation, deleteConversation,
    fetchReports,
  };
}

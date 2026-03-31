import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, User, Wrench, CheckCircle2, XCircle, Clock, Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Message, ToolCallResult } from "@/hooks/useAIChat";
import {
  Phone, Search, DollarSign, History, AlertTriangle, Users, Zap,
  LayoutDashboard, Brain, BookMarked, Target, CalendarClock, CreditCard,
  FileBarChart, ScrollText,
} from "lucide-react";

const TOOL_ICONS: Record<string, typeof Phone> = {
  get_client_info: Users, search_client_by_name: Search, get_client_contracts: ScrollText,
  get_renegotiation_options: DollarSign, register_payment_promise: CheckCircle2,
  mark_installment_paid: CreditCard, get_conversation_history: History,
  send_whatsapp_message: Phone, escalate_to_human: AlertTriangle,
  get_pending_by_tier: Users, bulk_send_collection: Zap, get_dashboard_summary: LayoutDashboard,
  get_client_memory: Brain, save_client_memory: BookMarked, predict_defaults: Target,
  generate_report: FileBarChart, schedule_followup: CalendarClock,
};

const TOOL_LABELS: Record<string, string> = {
  get_client_info: "Consultar Cliente", search_client_by_name: "Buscar por Nome",
  get_client_contracts: "Contratos do Cliente", get_renegotiation_options: "Renegociação",
  register_payment_promise: "Promessa de Pagamento", mark_installment_paid: "Registrar Pagamento",
  get_conversation_history: "Histórico", send_whatsapp_message: "Enviar WhatsApp",
  escalate_to_human: "Escalar para Humano", get_pending_by_tier: "Inadimplentes por Faixa",
  bulk_send_collection: "Cobrança em Lote", get_dashboard_summary: "Resumo Dashboard",
  get_client_memory: "Memória do Cliente", save_client_memory: "Salvar Memória",
  predict_defaults: "Análise Preditiva", generate_report: "Gerar Relatório",
  schedule_followup: "Agendar Follow-up",
};

export { TOOL_ICONS, TOOL_LABELS };

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <button onClick={handleCopy} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted/50" title="Copiar" aria-label="Copiar mensagem">
      {copied ? <Check className="h-3 w-3 text-primary" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
    </button>
  );
}

function ToolCallBadge({ tc, index }: { tc: ToolCallResult; index: number }) {
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
          {execTime && <span className="text-muted-foreground flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" /> {Number(execTime)}ms</span>}
        </div>
        {Object.keys(tc.args).length > 0 && (
          <p className="text-muted-foreground mt-0.5 truncate">{Object.entries(tc.args).map(([k, v]) => `${k}: ${v}`).join(" • ")}</p>
        )}
      </div>
    </motion.div>
  );
}

export function ChatMessageBubble({ msg }: { msg: Message }) {
  return (
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
        <div className={`rounded-2xl px-4 py-3 relative ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-md" : "bg-muted rounded-bl-md"}`}>
          {msg.role === "assistant" ? (
            <div className="prose prose-sm dark:prose-invert max-w-none text-sm"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
          ) : (
            <p className="text-sm">{msg.content}</p>
          )}
          {msg.role === "assistant" && <div className="absolute -top-2 -right-2"><CopyButton text={msg.content} /></div>}
        </div>
        {msg.toolCalls && msg.toolCalls.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground flex items-center gap-1"><Wrench className="h-3 w-3" /> {msg.toolCalls.length} ferramenta(s):</p>
            {msg.toolCalls.map((tc, i) => <ToolCallBadge key={i} tc={tc} index={i} />)}
          </div>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{msg.timestamp.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
          {msg.usage && (
            <>
              <span>•</span>
              <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" /> {msg.usage.response_time_ms}ms</span>
              <span>•</span><span>{msg.usage.tokens} tokens</span>
              {msg.usage.tool_iterations > 0 && <><span>•</span><span>{msg.usage.tool_iterations} iterações</span></>}
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
  );
}

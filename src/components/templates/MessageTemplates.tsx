import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Plus,
  Edit2,
  Trash2,
  MessageCircle,
  Copy,
  Check,
  Save,
  FileText,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  tone: "amigavel" | "formal" | "urgente";
  category: "cobranca" | "lembrete" | "confirmacao" | "outro";
  createdAt: string;
}

const defaultTemplates: MessageTemplate[] = [
  {
    id: "1",
    name: "Lembrete Amigável",
    content:
      "Olá {nome}! 😊 Passando para lembrar que sua parcela de {valor} vence em {data_vencimento}. Qualquer dúvida, estou à disposição!",
    tone: "amigavel",
    category: "lembrete",
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    name: "Cobrança Formal",
    content:
      "Prezado(a) {nome}, informamos que a parcela no valor de {valor} encontra-se vencida desde {data_vencimento}. Solicitamos a regularização do pagamento o mais breve possível.",
    tone: "formal",
    category: "cobranca",
    createdAt: new Date().toISOString(),
  },
  {
    id: "3",
    name: "Urgente - Atraso",
    content:
      "⚠️ ATENÇÃO {nome}! Sua parcela de {valor} está com {dias_atraso} dias de atraso. A multa atual é de {multa}. Entre em contato URGENTE para negociação.",
    tone: "urgente",
    category: "cobranca",
    createdAt: new Date().toISOString(),
  },
  {
    id: "4",
    name: "Confirmação de Pagamento",
    content:
      "✅ {nome}, confirmamos o recebimento do pagamento de {valor} referente à parcela {numero_parcela}. Obrigado pela pontualidade!",
    tone: "amigavel",
    category: "confirmacao",
    createdAt: new Date().toISOString(),
  },
];

interface MessageTemplatesProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect?: (template: MessageTemplate) => void;
}

export function MessageTemplates({ open, onOpenChange, onSelect }: MessageTemplatesProps) {
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | MessageTemplate["category"]>("all");
  const { toast } = useToast();

  // Load templates from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("message_templates");
    if (saved) {
      setTemplates(JSON.parse(saved));
    } else {
      setTemplates(defaultTemplates);
      localStorage.setItem("message_templates", JSON.stringify(defaultTemplates));
    }
  }, []);

  // Save templates to localStorage
  const saveTemplates = (newTemplates: MessageTemplate[]) => {
    setTemplates(newTemplates);
    localStorage.setItem("message_templates", JSON.stringify(newTemplates));
  };

  const handleCopy = (template: MessageTemplate) => {
    navigator.clipboard.writeText(template.content);
    setCopiedId(template.id);
    setTimeout(() => setCopiedId(null), 2000);
    toast({
      title: "Copiado!",
      description: "Modelo copiado para a área de transferência.",
    });
  };

  const handleDelete = (id: string) => {
    const newTemplates = templates.filter((t) => t.id !== id);
    saveTemplates(newTemplates);
    toast({
      title: "Modelo excluído",
      description: "O modelo foi removido com sucesso.",
    });
  };

  const handleSave = (template: MessageTemplate) => {
    if (templates.some((t) => t.id === template.id)) {
      const newTemplates = templates.map((t) => (t.id === template.id ? template : t));
      saveTemplates(newTemplates);
    } else {
      saveTemplates([...templates, { ...template, id: Date.now().toString() }]);
    }
    setEditingTemplate(null);
    toast({
      title: "Modelo salvo!",
      description: "Suas alterações foram salvas com sucesso.",
    });
  };

  const handleCreate = () => {
    setEditingTemplate({
      id: "",
      name: "",
      content: "",
      tone: "amigavel",
      category: "cobranca",
      createdAt: new Date().toISOString(),
    });
  };

  const filteredTemplates = templates.filter(
    (t) => filter === "all" || t.category === filter
  );

  const toneLabels = {
    amigavel: { label: "Amigável", emoji: "😊" },
    formal: { label: "Formal", emoji: "📋" },
    urgente: { label: "Urgente", emoji: "⚠️" },
  };

  const categoryLabels = {
    cobranca: "Cobrança",
    lembrete: "Lembrete",
    confirmacao: "Confirmação",
    outro: "Outro",
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => onOpenChange(false)}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative z-10 w-full max-w-3xl max-h-[85vh] rounded-2xl border border-border/50 bg-card shadow-lg overflow-hidden flex flex-col mx-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-foreground">
                  Modelos de Mensagem
                </h2>
                <p className="text-sm text-muted-foreground">
                  {templates.length} modelo(s) disponível(is)
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreate}
                className="flex items-center gap-2 rounded-xl bg-gradient-gold px-4 py-2 text-sm font-medium text-primary-foreground shadow-gold"
              >
                <Plus className="h-4 w-4" />
                Novo Modelo
              </motion.button>
              <button
                onClick={() => onOpenChange(false)}
                className="p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="px-6 py-3 border-b border-border/50 bg-secondary/20">
            <div className="flex gap-2">
              {(["all", "cobranca", "lembrete", "confirmacao", "outro"] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-medium transition-all",
                    filter === cat
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  {cat === "all" ? "Todos" : categoryLabels[cat]}
                </button>
              ))}
            </div>
          </div>

          {/* Template List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredTemplates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium text-foreground">
                  Nenhum modelo encontrado
                </p>
                <p className="text-sm text-muted-foreground">
                  Crie seu primeiro modelo de mensagem
                </p>
              </div>
            ) : (
              filteredTemplates.map((template) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl border border-border/50 bg-secondary/30 p-4 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-foreground">{template.name}</h3>
                        <span className="text-sm">
                          {toneLabels[template.tone].emoji}
                        </span>
                        <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                          {categoryLabels[template.category]}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {template.content}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Variáveis: {"{nome}"}, {"{valor}"}, {"{data_vencimento}"}, etc.
                      </p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => handleCopy(template)}
                        className="p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                        title="Copiar"
                      >
                        {copiedId === template.id ? (
                          <Check className="h-4 w-4 text-success" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => setEditingTemplate(template)}
                        className="p-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="p-2 rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      {onSelect && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            onSelect(template);
                            onOpenChange(false);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
                        >
                          Usar
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Edit Modal */}
          <AnimatePresence>
            {editingTemplate && (
              <TemplateEditor
                template={editingTemplate}
                onSave={handleSave}
                onCancel={() => setEditingTemplate(null)}
              />
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function TemplateEditor({
  template,
  onSave,
  onCancel,
}: {
  template: MessageTemplate;
  onSave: (t: MessageTemplate) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(template);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-card/95 backdrop-blur-sm flex flex-col"
    >
      <div className="flex items-center justify-between p-6 border-b border-border/50">
        <h3 className="font-display text-lg font-bold text-foreground">
          {template.id ? "Editar Modelo" : "Novo Modelo"}
        </h3>
        <button
          onClick={onCancel}
          className="p-2 rounded-lg text-muted-foreground hover:bg-secondary"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Nome do Modelo
          </label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Ex: Lembrete de Vencimento"
            className="w-full h-11 rounded-xl border border-border bg-secondary/50 px-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Tom
            </label>
            <select
              value={form.tone}
              onChange={(e) => setForm({ ...form, tone: e.target.value as MessageTemplate["tone"] })}
              className="w-full h-11 rounded-xl border border-border bg-secondary/50 px-4 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="amigavel">😊 Amigável</option>
              <option value="formal">📋 Formal</option>
              <option value="urgente">⚠️ Urgente</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Categoria
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as MessageTemplate["category"] })}
              className="w-full h-11 rounded-xl border border-border bg-secondary/50 px-4 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="cobranca">Cobrança</option>
              <option value="lembrete">Lembrete</option>
              <option value="confirmacao">Confirmação</option>
              <option value="outro">Outro</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Conteúdo da Mensagem
          </label>
          <textarea
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="Use variáveis: {nome}, {valor}, {data_vencimento}, {dias_atraso}, {multa}, {numero_parcela}"
            rows={5}
            className="w-full rounded-xl border border-border bg-secondary/50 px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Variáveis disponíveis: {"{nome}"}, {"{valor}"}, {"{data_vencimento}"},{" "}
            {"{dias_atraso}"}, {"{multa}"}, {"{numero_parcela}"}
          </p>
        </div>
      </div>

      <div className="flex gap-3 p-6 border-t border-border/50">
        <button
          onClick={onCancel}
          className="flex-1 rounded-xl border border-border bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
        >
          Cancelar
        </button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSave(form)}
          disabled={!form.name || !form.content}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-gold px-4 py-3 text-sm font-medium text-primary-foreground shadow-gold disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          Salvar Modelo
        </motion.button>
      </div>
    </motion.div>
  );
}

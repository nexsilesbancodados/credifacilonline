import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Copy, MessageCircle, Check, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface Client {
  name: string;
  whatsApp: string;
  financialSummary: {
    pendingAmount: number;
  };
}

interface AIMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client;
}

const toneOptions = [
  { value: "amigavel", label: "Amigável", description: "Tom leve e cordial" },
  { value: "formal", label: "Formal", description: "Tom profissional" },
  { value: "urgente", label: "Urgente", description: "Tom mais assertivo" },
];

export const AIMessageDialog = ({ open, onOpenChange, client }: AIMessageDialogProps) => {
  const [selectedTone, setSelectedTone] = useState("amigavel");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const generateMessage = async () => {
    setIsGenerating(true);
    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 1500));

    const messages = {
      amigavel: `Olá ${client.name}! 😊

Espero que esteja tudo bem com você! Passando para lembrar que temos um pagamento em aberto no valor de ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(client.financialSummary.pendingAmount)}.

Sei que imprevistos acontecem, então se precisar de alguma flexibilidade, é só me avisar que encontramos uma solução juntos.

Qualquer dúvida, estou à disposição! 🙏`,

      formal: `Prezado(a) ${client.name},

Conforme nosso contrato, informamos que existe um débito pendente no valor de ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(client.financialSummary.pendingAmount)}.

Solicitamos a regularização do pagamento para evitar a incidência de encargos adicionais.

Em caso de dúvidas ou necessidade de renegociação, favor entrar em contato.

Atenciosamente.`,

      urgente: `${client.name}, ATENÇÃO!

Identificamos um débito vencido de ${new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(client.financialSummary.pendingAmount)} em seu nome.

É fundamental que você regularize essa pendência HOJE para evitar:
- Acúmulo de multas e juros
- Restrição de crédito
- Medidas de cobrança

Entre em contato AGORA para resolver.`,
    };

    setGeneratedMessage(messages[selectedTone as keyof typeof messages]);
    setIsGenerating(false);
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(generatedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openWhatsApp = () => {
    const phone = client.whatsApp.replace(/\D/g, "");
    const encodedMessage = encodeURIComponent(generatedMessage);
    window.open(`https://wa.me/55${phone}?text=${encodedMessage}`, "_blank");
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => onOpenChange(false)}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        />

        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative z-10 w-full max-w-lg rounded-2xl border border-border/50 bg-card p-6 shadow-lg"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-gold">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-foreground">
                  Mensagem de Cobrança IA
                </h2>
                <p className="text-sm text-muted-foreground">
                  Para: {client.name}
                </p>
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tone Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-muted-foreground mb-3">
              Escolha o tom da mensagem
            </label>
            <div className="grid grid-cols-3 gap-2">
              {toneOptions.map((tone) => (
                <button
                  key={tone.value}
                  onClick={() => setSelectedTone(tone.value)}
                  className={cn(
                    "rounded-xl p-3 text-left transition-all border",
                    selectedTone === tone.value
                      ? "bg-primary/10 border-primary/50 text-primary"
                      : "bg-secondary/50 border-border/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  )}
                >
                  <p className="font-medium text-sm">{tone.label}</p>
                  <p className="text-xs opacity-70">{tone.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={generateMessage}
            disabled={isGenerating}
            className="w-full mb-6 flex items-center justify-center gap-2 rounded-xl bg-gradient-gold px-4 py-3 font-medium text-primary-foreground shadow-gold transition-all hover:shadow-gold disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <RefreshCw className="h-5 w-5" />
                </motion.div>
                Gerando mensagem...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                {generatedMessage ? "Regenerar Mensagem" : "Gerar Mensagem com IA"}
              </>
            )}
          </motion.button>

          {/* Generated Message */}
          {generatedMessage && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground">
                  Mensagem Gerada
                </span>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      Copiar
                    </>
                  )}
                </button>
              </div>
              <div className="rounded-xl bg-secondary/50 p-4 max-h-48 overflow-y-auto">
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {generatedMessage}
                </p>
              </div>
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-xl border border-border bg-secondary px-4 py-3 text-sm font-medium text-secondary-foreground hover:bg-secondary/80 transition-colors"
            >
              Fechar
            </button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={openWhatsApp}
              disabled={!generatedMessage}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-success px-4 py-3 text-sm font-medium text-success-foreground hover:bg-success/90 transition-colors disabled:opacity-50"
            >
              <MessageCircle className="h-4 w-4" />
              Enviar via WhatsApp
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

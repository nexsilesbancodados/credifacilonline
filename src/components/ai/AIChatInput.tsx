import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";

interface AIChatInputProps {
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  onSend: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

export function AIChatInput({ input, setInput, isLoading, onSend, inputRef }: AIChatInputProps) {
  return (
    <div className="p-3">
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          placeholder="Ex: Busque o cliente João e envie uma cobrança..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && onSend()}
          disabled={isLoading}
          className="flex-1"
          aria-label="Mensagem para o agente IA"
        />
        <Button onClick={onSend} disabled={isLoading || !input.trim()} size="icon" aria-label="Enviar mensagem">
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}

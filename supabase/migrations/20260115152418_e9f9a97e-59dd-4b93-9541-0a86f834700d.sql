-- Tabela de cobradores
CREATE TABLE public.collectors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  operator_id UUID NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  access_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar collector_id na tabela clients
ALTER TABLE public.clients ADD COLUMN collector_id UUID REFERENCES public.collectors(id);

-- Enable RLS para collectors
ALTER TABLE public.collectors ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para collectors
CREATE POLICY "Operators can view their own collectors"
ON public.collectors FOR SELECT
USING (auth.uid() = operator_id);

CREATE POLICY "Operators can insert their own collectors"
ON public.collectors FOR INSERT
WITH CHECK (auth.uid() = operator_id);

CREATE POLICY "Operators can update their own collectors"
ON public.collectors FOR UPDATE
USING (auth.uid() = operator_id);

CREATE POLICY "Operators can delete their own collectors"
ON public.collectors FOR DELETE
USING (auth.uid() = operator_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_collectors_updated_at
BEFORE UPDATE ON public.collectors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índice para busca por token (acesso externo)
CREATE INDEX idx_collectors_access_token ON public.collectors(access_token);
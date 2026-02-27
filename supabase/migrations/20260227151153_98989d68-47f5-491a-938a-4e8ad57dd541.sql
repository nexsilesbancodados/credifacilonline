
-- Create client_memory table for AI context persistence
CREATE TABLE public.client_memory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  operator_id UUID NOT NULL,
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(client_id, key)
);

-- Enable RLS
ALTER TABLE public.client_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Operators can view their client memories"
  ON public.client_memory FOR SELECT
  USING (auth.uid() = operator_id);

CREATE POLICY "Operators can insert client memories"
  ON public.client_memory FOR INSERT
  WITH CHECK (auth.uid() = operator_id);

CREATE POLICY "Operators can update client memories"
  ON public.client_memory FOR UPDATE
  USING (auth.uid() = operator_id);

CREATE POLICY "Operators can delete client memories"
  ON public.client_memory FOR DELETE
  USING (auth.uid() = operator_id);

-- Service role policy for edge functions
CREATE POLICY "Service role full access to client_memory"
  ON public.client_memory FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create ai_reports table for generated reports
CREATE TABLE public.ai_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  operator_id UUID NOT NULL,
  report_type TEXT NOT NULL DEFAULT 'weekly',
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  insights JSONB DEFAULT '[]'::jsonb,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Operators can view their reports"
  ON public.ai_reports FOR SELECT
  USING (auth.uid() = operator_id);

CREATE POLICY "Operators can insert reports"
  ON public.ai_reports FOR INSERT
  WITH CHECK (auth.uid() = operator_id);

CREATE POLICY "Service role full access to ai_reports"
  ON public.ai_reports FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trigger for updated_at on client_memory
CREATE TRIGGER update_client_memory_updated_at
  BEFORE UPDATE ON public.client_memory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

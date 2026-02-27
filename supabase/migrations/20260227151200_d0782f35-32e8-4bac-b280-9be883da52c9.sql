
-- Drop overly permissive service role policies 
DROP POLICY "Service role full access to client_memory" ON public.client_memory;
DROP POLICY "Service role full access to ai_reports" ON public.ai_reports;


-- Fix RLS policies to be auth-scoped
DROP POLICY "Users can create conversations" ON public.ai_conversations;
DROP POLICY "Users can update their conversations" ON public.ai_conversations;
DROP POLICY "Users can delete their conversations" ON public.ai_conversations;
DROP POLICY "Users can create messages" ON public.ai_messages;
DROP POLICY "Users can upsert metrics" ON public.ai_agent_metrics;
DROP POLICY "Users can update metrics" ON public.ai_agent_metrics;

CREATE POLICY "Authenticated users can create conversations" ON public.ai_conversations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update conversations" ON public.ai_conversations FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete conversations" ON public.ai_conversations FOR DELETE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can create messages" ON public.ai_messages FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can upsert metrics" ON public.ai_agent_metrics FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update metrics" ON public.ai_agent_metrics FOR UPDATE USING (auth.uid() IS NOT NULL);

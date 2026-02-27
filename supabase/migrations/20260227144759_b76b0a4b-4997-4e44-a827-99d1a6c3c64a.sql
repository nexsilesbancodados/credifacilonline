
-- Table for AI agent conversations
CREATE TABLE public.ai_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  operator_id TEXT NOT NULL,
  title TEXT DEFAULT 'Nova Conversa',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  total_messages INT DEFAULT 0,
  total_tool_calls INT DEFAULT 0,
  total_tokens_used INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for AI agent messages
CREATE TABLE public.ai_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  tool_calls JSONB DEFAULT NULL,
  tokens_used INT DEFAULT 0,
  response_time_ms INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for agent performance metrics
CREATE TABLE public.ai_agent_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  operator_id TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  total_conversations INT DEFAULT 0,
  total_messages INT DEFAULT 0,
  total_tool_calls INT DEFAULT 0,
  total_tokens INT DEFAULT 0,
  avg_response_time_ms INT DEFAULT 0,
  successful_tool_calls INT DEFAULT 0,
  failed_tool_calls INT DEFAULT 0,
  escalations INT DEFAULT 0,
  promises_registered INT DEFAULT 0,
  messages_sent_whatsapp INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(operator_id, date)
);

-- Enable RLS
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_agent_metrics ENABLE ROW LEVEL SECURITY;

-- RLS policies for ai_conversations
CREATE POLICY "Users can view their own conversations" ON public.ai_conversations FOR SELECT USING (true);
CREATE POLICY "Users can create conversations" ON public.ai_conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update their conversations" ON public.ai_conversations FOR UPDATE USING (true);
CREATE POLICY "Users can delete their conversations" ON public.ai_conversations FOR DELETE USING (true);

-- RLS policies for ai_messages
CREATE POLICY "Users can view messages" ON public.ai_messages FOR SELECT USING (true);
CREATE POLICY "Users can create messages" ON public.ai_messages FOR INSERT WITH CHECK (true);

-- RLS policies for ai_agent_metrics
CREATE POLICY "Users can view metrics" ON public.ai_agent_metrics FOR SELECT USING (true);
CREATE POLICY "Users can upsert metrics" ON public.ai_agent_metrics FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update metrics" ON public.ai_agent_metrics FOR UPDATE USING (true);

-- Indexes
CREATE INDEX idx_ai_messages_conversation ON public.ai_messages(conversation_id);
CREATE INDEX idx_ai_conversations_operator ON public.ai_conversations(operator_id);
CREATE INDEX idx_ai_metrics_operator_date ON public.ai_agent_metrics(operator_id, date);

-- Triggers for updated_at
CREATE TRIGGER update_ai_conversations_updated_at
  BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_metrics_updated_at
  BEFORE UPDATE ON public.ai_agent_metrics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for conversations
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_messages;

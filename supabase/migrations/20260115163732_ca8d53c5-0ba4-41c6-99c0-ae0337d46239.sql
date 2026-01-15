-- Add individual WhatsApp, N8N, and AI Agent settings per user
ALTER TABLE company_settings 
ADD COLUMN IF NOT EXISTS whatsapp_api_token TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_phone_number_id TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_display_phone TEXT,
ADD COLUMN IF NOT EXISTS n8n_webhook_url TEXT,
ADD COLUMN IF NOT EXISTS n8n_active_events JSONB DEFAULT '{"newContract":true,"payment":true,"overdue":false,"renegotiation":true}',
ADD COLUMN IF NOT EXISTS ai_agent_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ai_agent_start_time TEXT DEFAULT '09:00',
ADD COLUMN IF NOT EXISTS ai_agent_end_time TEXT DEFAULT '18:00',
ADD COLUMN IF NOT EXISTS ai_agent_triggers JSONB DEFAULT '{"day1":true,"day3":true,"day7":true,"day15":false,"day30":false}';
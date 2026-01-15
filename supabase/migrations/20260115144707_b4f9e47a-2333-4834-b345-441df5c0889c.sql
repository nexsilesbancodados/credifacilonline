-- Adicionar campos de configuração de multa/juros na tabela contracts
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS fine_percentage numeric DEFAULT 2;
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS daily_interest_rate numeric DEFAULT 0.033;

-- Tabela de configurações da empresa/operador
CREATE TABLE IF NOT EXISTS company_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id uuid NOT NULL UNIQUE,
  company_name text,
  cnpj text,
  default_fine_percentage numeric DEFAULT 2,
  default_daily_interest numeric DEFAULT 0.033,
  default_frequency text DEFAULT 'mensal',
  logo_url text,
  theme text DEFAULT 'dark',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies para company_settings
CREATE POLICY "Users can view their own settings" 
ON company_settings 
FOR SELECT 
USING (auth.uid() = operator_id);

CREATE POLICY "Users can insert their own settings" 
ON company_settings 
FOR INSERT 
WITH CHECK (auth.uid() = operator_id);

CREATE POLICY "Users can update their own settings" 
ON company_settings 
FOR UPDATE 
USING (auth.uid() = operator_id);

-- Trigger para updated_at
CREATE TRIGGER update_company_settings_updated_at
BEFORE UPDATE ON company_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Create clients table (UserProfile from original spec)
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  operator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cpf TEXT NOT NULL,
  email TEXT,
  whatsapp TEXT,
  avatar_url TEXT,
  cep TEXT,
  street TEXT,
  number TEXT,
  complement TEXT,
  neighborhood TEXT,
  city TEXT,
  state TEXT,
  status TEXT NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Atraso', 'Quitado')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contracts table
CREATE TABLE public.contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  operator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  capital NUMERIC NOT NULL,
  interest_rate NUMERIC NOT NULL,
  installments INTEGER NOT NULL,
  installment_value NUMERIC NOT NULL,
  total_amount NUMERIC NOT NULL,
  total_profit NUMERIC NOT NULL,
  frequency TEXT NOT NULL DEFAULT 'mensal' CHECK (frequency IN ('diario', 'semanal', 'quinzenal', 'mensal')),
  start_date DATE NOT NULL,
  first_due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Atraso', 'Quitado', 'Renegociado')),
  renegotiated_from_id UUID REFERENCES public.contracts(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create installments table
CREATE TABLE public.installments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  operator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,
  total_installments INTEGER NOT NULL,
  due_date DATE NOT NULL,
  amount_due NUMERIC NOT NULL,
  amount_paid NUMERIC DEFAULT 0,
  payment_date DATE,
  status TEXT NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Pago', 'Atrasado', 'Agendado')),
  fine NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create treasury transactions table
CREATE TABLE public.treasury_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  operator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Investimento', 'Dividendos', 'Aporte', 'Sangria', 'Recebimento', 'Empréstimo', 'Pessoal', 'Marketing', 'Infraestrutura', 'Legal', 'Outros')),
  type TEXT NOT NULL CHECK (type IN ('entrada', 'saida')),
  amount NUMERIC NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create activity log table for client history
CREATE TABLE public.activity_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  operator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treasury_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clients
CREATE POLICY "Operators can view their own clients" ON public.clients FOR SELECT USING (auth.uid() = operator_id);
CREATE POLICY "Operators can insert their own clients" ON public.clients FOR INSERT WITH CHECK (auth.uid() = operator_id);
CREATE POLICY "Operators can update their own clients" ON public.clients FOR UPDATE USING (auth.uid() = operator_id);
CREATE POLICY "Operators can delete their own clients" ON public.clients FOR DELETE USING (auth.uid() = operator_id);

-- RLS Policies for contracts
CREATE POLICY "Operators can view their own contracts" ON public.contracts FOR SELECT USING (auth.uid() = operator_id);
CREATE POLICY "Operators can insert their own contracts" ON public.contracts FOR INSERT WITH CHECK (auth.uid() = operator_id);
CREATE POLICY "Operators can update their own contracts" ON public.contracts FOR UPDATE USING (auth.uid() = operator_id);
CREATE POLICY "Operators can delete their own contracts" ON public.contracts FOR DELETE USING (auth.uid() = operator_id);

-- RLS Policies for installments
CREATE POLICY "Operators can view their own installments" ON public.installments FOR SELECT USING (auth.uid() = operator_id);
CREATE POLICY "Operators can insert their own installments" ON public.installments FOR INSERT WITH CHECK (auth.uid() = operator_id);
CREATE POLICY "Operators can update their own installments" ON public.installments FOR UPDATE USING (auth.uid() = operator_id);
CREATE POLICY "Operators can delete their own installments" ON public.installments FOR DELETE USING (auth.uid() = operator_id);

-- RLS Policies for treasury_transactions
CREATE POLICY "Operators can view their own transactions" ON public.treasury_transactions FOR SELECT USING (auth.uid() = operator_id);
CREATE POLICY "Operators can insert their own transactions" ON public.treasury_transactions FOR INSERT WITH CHECK (auth.uid() = operator_id);
CREATE POLICY "Operators can update their own transactions" ON public.treasury_transactions FOR UPDATE USING (auth.uid() = operator_id);
CREATE POLICY "Operators can delete their own transactions" ON public.treasury_transactions FOR DELETE USING (auth.uid() = operator_id);

-- RLS Policies for activity_log
CREATE POLICY "Operators can view their own activity" ON public.activity_log FOR SELECT USING (auth.uid() = operator_id);
CREATE POLICY "Operators can insert their own activity" ON public.activity_log FOR INSERT WITH CHECK (auth.uid() = operator_id);

-- Triggers for updated_at
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_contracts_updated_at BEFORE UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_installments_updated_at BEFORE UPDATE ON public.installments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update installment status based on due date
CREATE OR REPLACE FUNCTION public.update_overdue_installments()
RETURNS void AS $$
BEGIN
  UPDATE public.installments
  SET status = 'Atrasado'
  WHERE status = 'Pendente' AND due_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to update client status based on installments
CREATE OR REPLACE FUNCTION public.update_client_status()
RETURNS TRIGGER AS $$
DECLARE
  has_overdue BOOLEAN;
  all_paid BOOLEAN;
BEGIN
  -- Check if client has any overdue installments
  SELECT EXISTS (
    SELECT 1 FROM public.installments 
    WHERE client_id = COALESCE(NEW.client_id, OLD.client_id) 
    AND status = 'Atrasado'
  ) INTO has_overdue;
  
  -- Check if all installments are paid
  SELECT NOT EXISTS (
    SELECT 1 FROM public.installments 
    WHERE client_id = COALESCE(NEW.client_id, OLD.client_id) 
    AND status IN ('Pendente', 'Atrasado')
  ) INTO all_paid;
  
  -- Update client status
  IF all_paid THEN
    UPDATE public.clients SET status = 'Quitado' WHERE id = COALESCE(NEW.client_id, OLD.client_id);
  ELSIF has_overdue THEN
    UPDATE public.clients SET status = 'Atraso' WHERE id = COALESCE(NEW.client_id, OLD.client_id);
  ELSE
    UPDATE public.clients SET status = 'Ativo' WHERE id = COALESCE(NEW.client_id, OLD.client_id);
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_client_status_on_installment_change
AFTER INSERT OR UPDATE OR DELETE ON public.installments
FOR EACH ROW EXECUTE FUNCTION public.update_client_status();
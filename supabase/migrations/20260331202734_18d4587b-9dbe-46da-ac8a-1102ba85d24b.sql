-- Drop existing triggers to avoid conflicts
DROP TRIGGER IF EXISTS check_installment_status_trigger ON public.installments;
DROP TRIGGER IF EXISTS update_client_status_trigger ON public.installments;
DROP TRIGGER IF EXISTS update_installments_updated_at ON public.installments;
DROP TRIGGER IF EXISTS update_contracts_updated_at ON public.contracts;
DROP TRIGGER IF EXISTS update_clients_updated_at ON public.clients;
DROP TRIGGER IF EXISTS update_collectors_updated_at ON public.collectors;
DROP TRIGGER IF EXISTS update_collection_rules_updated_at ON public.collection_rules;
DROP TRIGGER IF EXISTS update_company_settings_updated_at ON public.company_settings;
DROP TRIGGER IF EXISTS update_client_memory_updated_at ON public.client_memory;

-- 1. Auto-check installment status
CREATE TRIGGER check_installment_status_trigger
  BEFORE INSERT OR UPDATE ON public.installments
  FOR EACH ROW
  EXECUTE FUNCTION public.check_installment_status();

-- 2. Auto-update client status
CREATE TRIGGER update_client_status_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.installments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_client_status();

-- 3. updated_at triggers
CREATE TRIGGER update_installments_updated_at
  BEFORE UPDATE ON public.installments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_collectors_updated_at
  BEFORE UPDATE ON public.collectors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_collection_rules_updated_at
  BEFORE UPDATE ON public.collection_rules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_settings_updated_at
  BEFORE UPDATE ON public.company_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_memory_updated_at
  BEFORE UPDATE ON public.client_memory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Enable realtime (ignore if already added)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.installments;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.contracts;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.clients;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.treasury_transactions;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.collection_logs;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
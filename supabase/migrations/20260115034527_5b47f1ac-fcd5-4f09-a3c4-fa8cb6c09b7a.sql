-- Corrigir search_path da função para evitar ataques
CREATE OR REPLACE FUNCTION check_installment_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'Pendente' AND NEW.due_date < CURRENT_DATE THEN
    NEW.status := 'Atrasado';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;
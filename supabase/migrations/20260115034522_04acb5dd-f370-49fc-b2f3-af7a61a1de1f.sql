-- Trigger que atualiza automaticamente status de parcelas vencidas
CREATE OR REPLACE FUNCTION check_installment_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'Pendente' AND NEW.due_date < CURRENT_DATE THEN
    NEW.status := 'Atrasado';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em INSERT e UPDATE
DROP TRIGGER IF EXISTS trigger_check_installment_status ON installments;
CREATE TRIGGER trigger_check_installment_status
BEFORE INSERT OR UPDATE ON installments
FOR EACH ROW
EXECUTE FUNCTION check_installment_status();

-- Atualizar parcelas existentes que já estão vencidas
UPDATE installments
SET status = 'Atrasado', updated_at = now()
WHERE status = 'Pendente'
  AND due_date < CURRENT_DATE;
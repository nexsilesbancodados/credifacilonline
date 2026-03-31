
-- Remove duplicate installments, keeping the one with the most payment data
DELETE FROM installments
WHERE id IN (
  SELECT id FROM (
    SELECT id,
      ROW_NUMBER() OVER (
        PARTITION BY contract_id, installment_number
        ORDER BY 
          CASE WHEN status = 'Pago' THEN 0 ELSE 1 END,
          amount_paid DESC NULLS LAST,
          created_at ASC
      ) as rn
    FROM installments
  ) ranked
  WHERE rn > 1
);

-- Add unique constraint to prevent future duplicates
ALTER TABLE installments ADD CONSTRAINT unique_contract_installment UNIQUE (contract_id, installment_number);

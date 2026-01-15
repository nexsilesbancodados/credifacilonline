-- Permitir acesso público para buscar collectors por token (para a página externa)
CREATE POLICY "Public can view collectors by token"
ON public.collectors FOR SELECT
USING (true);

-- Permitir acesso público para buscar clientes por collector_id (para a página externa)
CREATE POLICY "Public can view clients by collector"
ON public.clients FOR SELECT
USING (collector_id IS NOT NULL);

-- Permitir acesso público para buscar installments dos clientes (para a página externa)
CREATE POLICY "Public can view installments for collector clients"
ON public.installments FOR SELECT
USING (true);
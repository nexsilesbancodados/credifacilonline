-- Remove overly permissive public policies
DROP POLICY IF EXISTS "Public can view clients by collector" ON public.clients;
DROP POLICY IF EXISTS "Public can view collectors by token" ON public.collectors;
DROP POLICY IF EXISTS "Public can view installments by collector" ON public.installments;

-- Create proper policies that only allow access via valid collector token
-- The external page will use a service role or anon key with specific token validation

-- For collectors: only allow viewing own collectors OR via valid token match in the request
CREATE POLICY "Public can view collector by token" 
ON public.collectors 
FOR SELECT 
USING (
  auth.uid() = operator_id 
  OR access_token = current_setting('request.headers', true)::json->>'x-collector-token'
);

-- For clients: only allow viewing by operator OR if collector_id matches a valid collector token
CREATE POLICY "Public can view clients by collector token" 
ON public.clients 
FOR SELECT 
USING (
  auth.uid() = operator_id
  OR (
    collector_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM collectors 
      WHERE collectors.id = clients.collector_id 
      AND collectors.access_token = current_setting('request.headers', true)::json->>'x-collector-token'
    )
  )
);

-- For installments: only allow viewing by operator OR via collector token
CREATE POLICY "Public can view installments by collector token" 
ON public.installments 
FOR SELECT 
USING (
  auth.uid() = operator_id
  OR (
    EXISTS (
      SELECT 1 FROM clients 
      WHERE clients.id = installments.client_id 
      AND clients.collector_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM collectors 
        WHERE collectors.id = clients.collector_id 
        AND collectors.access_token = current_setting('request.headers', true)::json->>'x-collector-token'
      )
    )
  )
);
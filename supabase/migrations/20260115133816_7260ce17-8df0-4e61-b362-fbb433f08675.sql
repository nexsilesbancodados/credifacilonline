-- Add archived_at column to clients table
ALTER TABLE public.clients 
ADD COLUMN archived_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add index for better performance when filtering archived clients
CREATE INDEX idx_clients_archived_at ON public.clients(archived_at);

-- Comment for documentation
COMMENT ON COLUMN public.clients.archived_at IS 'Timestamp when client was archived. NULL means client is active.';
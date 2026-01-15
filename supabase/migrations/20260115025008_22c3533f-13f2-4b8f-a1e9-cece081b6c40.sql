
-- Create collection_rules table for automated collection scheduling
CREATE TABLE public.collection_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  trigger_days INTEGER NOT NULL, -- e.g., -3 for 3 days before, 7 for 7 days after
  message_template TEXT NOT NULL,
  tone TEXT NOT NULL DEFAULT 'friendly', -- friendly, formal, urgent
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create document_files table for storing document metadata
CREATE TABLE public.document_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL, -- document, payment_proof, contract, photo
  file_size INTEGER,
  mime_type TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create collection_logs table for tracking sent messages
CREATE TABLE public.collection_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  installment_id UUID REFERENCES public.installments(id) ON DELETE SET NULL,
  rule_id UUID REFERENCES public.collection_rules(id) ON DELETE SET NULL,
  message_sent TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'whatsapp', -- whatsapp, sms, email
  status TEXT NOT NULL DEFAULT 'sent', -- sent, delivered, read, failed
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on all new tables
ALTER TABLE public.collection_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collection_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for collection_rules
CREATE POLICY "Users can view their own collection rules" 
ON public.collection_rules FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own collection rules" 
ON public.collection_rules FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collection rules" 
ON public.collection_rules FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collection rules" 
ON public.collection_rules FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for document_files
CREATE POLICY "Users can view their own documents" 
ON public.document_files FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can upload their own documents" 
ON public.document_files FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" 
ON public.document_files FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" 
ON public.document_files FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for collection_logs
CREATE POLICY "Users can view their own collection logs" 
ON public.collection_logs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own collection logs" 
ON public.collection_logs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for documents bucket
CREATE POLICY "Users can view their own documents in storage" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own documents to storage" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own documents in storage" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own documents in storage" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create trigger for updated_at on collection_rules
CREATE TRIGGER update_collection_rules_updated_at
BEFORE UPDATE ON public.collection_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

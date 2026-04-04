
CREATE TABLE public.whatsapp_instances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  operator_id UUID NOT NULL,
  instance_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (operator_id, instance_name)
);

ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own instances"
  ON public.whatsapp_instances FOR SELECT
  TO authenticated
  USING (operator_id = auth.uid());

CREATE POLICY "Users can create their own instances"
  ON public.whatsapp_instances FOR INSERT
  TO authenticated
  WITH CHECK (operator_id = auth.uid());

CREATE POLICY "Users can delete their own instances"
  ON public.whatsapp_instances FOR DELETE
  TO authenticated
  USING (operator_id = auth.uid());

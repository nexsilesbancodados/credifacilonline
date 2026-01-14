-- Add daily_type column to contracts for daily frequency options
ALTER TABLE public.contracts
ADD COLUMN daily_type text DEFAULT NULL;

-- Add a comment explaining the column
COMMENT ON COLUMN public.contracts.daily_type IS 'For daily frequency loans: seg-seg (all days), seg-sex (Mon-Fri), seg-sab (Mon-Sat)';
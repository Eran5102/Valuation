-- Drop the clients table as we're consolidating everything into the companies table
-- This ensures we have a single source of truth for client/company data

-- First, ensure all data has been migrated (this is a safety check)
-- The previous migration should have already done this
UPDATE public.companies c
SET
  contact_name = COALESCE(c.contact_name, cl.contact_name),
  email = COALESCE(c.email, cl.email),
  phone = COALESCE(c.phone, cl.phone)
FROM public.clients cl
WHERE c.id = cl.company_id
  AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients');

-- Drop the clients table if it exists
DROP TABLE IF EXISTS public.clients CASCADE;

-- Add a comment to document the consolidation
COMMENT ON TABLE public.companies IS 'Consolidated table for all client/company information including contact details';
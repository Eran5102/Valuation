-- Add contact fields to companies table to consolidate all client/company data in one place
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS contact_name TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS zip_code TEXT;

-- Migrate any existing data from clients table to companies table (if needed)
-- This will copy the first client contact for each company as the primary contact
UPDATE public.companies c
SET
  contact_name = cl.contact_name,
  email = cl.email,
  phone = cl.phone
FROM (
  SELECT DISTINCT ON (company_id)
    company_id,
    contact_name,
    email,
    phone
  FROM public.clients
  ORDER BY company_id, created_at ASC
) cl
WHERE c.id = cl.company_id
  AND c.contact_name IS NULL;

-- Note: We're not dropping the clients table yet in case you want to review the data first
-- You can drop it later with: DROP TABLE IF EXISTS public.clients CASCADE;
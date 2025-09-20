-- Clean up old assumptions data in valuations table
-- This will remove obsolete categories and fields from stored assumptions

UPDATE public.valuations
SET assumptions = NULL
WHERE assumptions IS NOT NULL
AND (
  -- Check if assumptions contains old structure
  assumptions::text LIKE '%"id":"shares"%'
  OR assumptions::text LIKE '%"id":"funding"%'
  OR assumptions::text LIKE '%"id":"company_ein"%'
  OR assumptions::text LIKE '%Pre-Seed%'
  OR assumptions::text LIKE '%Series A%'
);

-- Add comment to document the cleanup
COMMENT ON COLUMN public.valuations.assumptions IS 'Cleaned up old assumptions data - removed shares, funding categories and EIN field';
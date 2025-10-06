-- Fix the update trigger to remove metadata reference
-- The report_templates table doesn't have a metadata column

CREATE OR REPLACE FUNCTION update_report_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Simply update the updated_at timestamp
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS update_report_templates_updated_at_trigger ON public.report_templates;

CREATE TRIGGER update_report_templates_updated_at_trigger
  BEFORE UPDATE ON public.report_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_report_templates_updated_at();

-- ============================================
-- ADD MISSING COLUMNS TO VALUATIONS TABLE
-- ============================================

-- Add assumptions column (JSONB for storing assumptions data)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'valuations' AND column_name = 'assumptions'
  ) THEN
    ALTER TABLE public.valuations
    ADD COLUMN assumptions JSONB DEFAULT '{}'::jsonb;
    RAISE NOTICE '✓ Added assumptions column to valuations';
  ELSE
    RAISE NOTICE '  assumptions column already exists';
  END IF;
END $$;

-- Add notes column (TEXT for general notes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'valuations' AND column_name = 'notes'
  ) THEN
    ALTER TABLE public.valuations
    ADD COLUMN notes TEXT;
    RAISE NOTICE '✓ Added notes column to valuations';
  ELSE
    RAISE NOTICE '  notes column already exists';
  END IF;
END $$;

-- Add purpose column (for valuation purpose like 409a, etc)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'valuations' AND column_name = 'purpose'
  ) THEN
    ALTER TABLE public.valuations
    ADD COLUMN purpose TEXT;
    RAISE NOTICE '✓ Added purpose column to valuations';
  ELSE
    RAISE NOTICE '  purpose column already exists';
  END IF;
END $$;

-- Add project_type column if missing (should already exist as valuation_type)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'valuations' AND column_name = 'project_type'
  ) THEN
    ALTER TABLE public.valuations
    ADD COLUMN project_type TEXT;
    RAISE NOTICE '✓ Added project_type column to valuations';
  ELSE
    RAISE NOTICE '  project_type column already exists';
  END IF;
END $$;

-- Ensure assigned_to column exists (for team assignments)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'valuations' AND column_name = 'assigned_to'
  ) THEN
    ALTER TABLE public.valuations
    ADD COLUMN assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL;
    RAISE NOTICE '✓ Added assigned_to column to valuations';
  ELSE
    RAISE NOTICE '  assigned_to column already exists';
  END IF;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_valuations_assumptions ON public.valuations USING GIN (assumptions);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '  VALUATION COLUMNS ADDED';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Columns available:';
  RAISE NOTICE '  ✓ assumptions (JSONB)';
  RAISE NOTICE '  ✓ notes (TEXT)';
  RAISE NOTICE '  ✓ purpose (TEXT)';
  RAISE NOTICE '  ✓ project_type (TEXT)';
  RAISE NOTICE '  ✓ assigned_to (UUID)';
  RAISE NOTICE '';
  RAISE NOTICE 'Valuation creation should now work!';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;
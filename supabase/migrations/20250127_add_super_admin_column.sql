-- Add is_super_admin column to profiles table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'profiles'
        AND column_name = 'is_super_admin'
    ) THEN
        ALTER TABLE public.profiles
        ADD COLUMN is_super_admin BOOLEAN DEFAULT FALSE;

        -- Create an index for faster lookups
        CREATE INDEX IF NOT EXISTS idx_profiles_super_admin
        ON public.profiles(is_super_admin)
        WHERE is_super_admin = true;
    END IF;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.is_super_admin IS 'Flag to indicate if user has super admin privileges to see all organizations and their data';
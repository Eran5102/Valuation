-- Fix authentication issues
-- Run this in Supabase SQL editor to fix login problems

-- 1. Check if your user exists in auth.users
SELECT id, email, created_at
FROM auth.users
WHERE email = 'eran@bridgeland-advisors.com';

-- 2. Ensure profiles/user_profiles RLS doesn't block authentication
-- Drop problematic policies that might block login
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create permissive policy for profiles during auth
CREATE POLICY "Allow all operations on profiles for authenticated users" ON public.profiles
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 3. Ensure user_profiles table doesn't block access
DROP POLICY IF EXISTS "All operations on user_profiles" ON public.user_profiles;
CREATE POLICY "Allow all operations on user_profiles" ON public.user_profiles
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 4. Check if handle_new_user trigger is working
-- This should create a profile when you sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Try to insert into profiles table if it exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        INSERT INTO public.profiles (id, email, full_name)
        VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name')
        ON CONFLICT (id) DO NOTHING;
    END IF;

    -- Also insert into user_profiles table
    INSERT INTO public.user_profiles (id, email)
    VALUES (new.id, new.email)
    ON CONFLICT (id) DO NOTHING;

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Manually ensure your profile exists in both tables
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Get your user ID
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'eran@bridgeland-advisors.com' LIMIT 1;

    IF v_user_id IS NOT NULL THEN
        -- Ensure profile exists in profiles table if it exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
            INSERT INTO public.profiles (id, email)
            VALUES (v_user_id, 'eran@bridgeland-advisors.com')
            ON CONFLICT (id) DO UPDATE SET email = 'eran@bridgeland-advisors.com';
        END IF;

        -- Ensure profile exists in user_profiles table
        INSERT INTO public.user_profiles (id, email, is_super_admin)
        VALUES (v_user_id, 'eran@bridgeland-advisors.com', true)
        ON CONFLICT (id) DO UPDATE SET
            email = 'eran@bridgeland-advisors.com',
            is_super_admin = true;

        RAISE NOTICE 'Profile ensured for user %', v_user_id;
    ELSE
        RAISE NOTICE 'User not found in auth.users table';
    END IF;
END $$;

-- 7. Verify the fix
SELECT
    'Auth Check' as check_type,
    (SELECT COUNT(*) FROM auth.users WHERE email = 'eran@bridgeland-advisors.com') as auth_users_count,
    (SELECT COUNT(*) FROM public.user_profiles WHERE email = 'eran@bridgeland-advisors.com') as user_profiles_count,
    (SELECT COUNT(*) FROM public.profiles WHERE email = 'eran@bridgeland-advisors.com') as profiles_count;
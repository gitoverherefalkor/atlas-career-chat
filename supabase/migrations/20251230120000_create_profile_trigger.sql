-- Create a function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, auth_provider, first_name, last_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email'),
    COALESCE(NEW.raw_user_meta_data->>'given_name', NEW.raw_user_meta_data->>'first_name', split_part(NEW.raw_user_meta_data->>'full_name', ' ', 1), split_part(NEW.raw_user_meta_data->>'name', ' ', 1)),
    COALESCE(NEW.raw_user_meta_data->>'family_name', NEW.raw_user_meta_data->>'last_name',
      CASE
        WHEN NEW.raw_user_meta_data->>'full_name' IS NOT NULL AND position(' ' in NEW.raw_user_meta_data->>'full_name') > 0
        THEN substring(NEW.raw_user_meta_data->>'full_name' from position(' ' in NEW.raw_user_meta_data->>'full_name') + 1)
        WHEN NEW.raw_user_meta_data->>'name' IS NOT NULL AND position(' ' in NEW.raw_user_meta_data->>'name') > 0
        THEN substring(NEW.raw_user_meta_data->>'name' from position(' ' in NEW.raw_user_meta_data->>'name') + 1)
        ELSE NULL
      END
    ),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill: Create profiles for any existing users who don't have one
INSERT INTO public.profiles (id, email, auth_provider, first_name, last_name, created_at, updated_at)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_app_meta_data->>'provider', 'email'),
  COALESCE(u.raw_user_meta_data->>'given_name', u.raw_user_meta_data->>'first_name', split_part(u.raw_user_meta_data->>'full_name', ' ', 1), split_part(u.raw_user_meta_data->>'name', ' ', 1)),
  COALESCE(u.raw_user_meta_data->>'family_name', u.raw_user_meta_data->>'last_name',
    CASE
      WHEN u.raw_user_meta_data->>'full_name' IS NOT NULL AND position(' ' in u.raw_user_meta_data->>'full_name') > 0
      THEN substring(u.raw_user_meta_data->>'full_name' from position(' ' in u.raw_user_meta_data->>'full_name') + 1)
      WHEN u.raw_user_meta_data->>'name' IS NOT NULL AND position(' ' in u.raw_user_meta_data->>'name') > 0
      THEN substring(u.raw_user_meta_data->>'name' from position(' ' in u.raw_user_meta_data->>'name') + 1)
      ELSE NULL
    END
  ),
  NOW(),
  NOW()
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

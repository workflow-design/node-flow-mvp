-- Fix user credits creation by allowing inserts for the trigger
-- The trigger runs with SECURITY DEFINER but RLS was blocking inserts

-- Drop existing insert policy if it exists
DROP POLICY IF EXISTS "Allow user creation inserts" ON user_credits;

-- Allow inserts for new user creation (trigger needs this)
CREATE POLICY "Allow user creation inserts"
  ON user_credits FOR INSERT
  WITH CHECK (true);

-- Update the trigger function with better error logging
CREATE OR REPLACE FUNCTION public.create_user_credits()
RETURNS TRIGGER AS $$
DECLARE
  insert_error TEXT;
BEGIN
  BEGIN
    INSERT INTO public.user_credits (user_id, balance)
    VALUES (NEW.id, 10.00) -- Give new users $10 to start
    ON CONFLICT (user_id) DO NOTHING;
  EXCEPTION
    WHEN OTHERS THEN
      insert_error := SQLERRM;
      RAISE LOG 'Error creating user credits for user %: %', NEW.id, insert_error;
      RAISE EXCEPTION 'Database error saving new user: %', insert_error;
  END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

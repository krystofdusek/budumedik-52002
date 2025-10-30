-- Make subscription creation idempotent to avoid duplicate key errors
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert new users as premium with unlimited tests during testing period
  INSERT INTO public.user_subscriptions (user_id, subscription_type, tests_remaining, reset_date)
  VALUES (NEW.id, 'premium', 999999, NULL)
  ON CONFLICT (user_id) DO NOTHING;  -- prevent duplicate key violations
  RETURN NEW;
END;
$$;
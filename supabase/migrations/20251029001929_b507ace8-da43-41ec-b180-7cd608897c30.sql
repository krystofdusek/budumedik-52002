-- Allow reset_date to be null initially (will be set on first test)
ALTER TABLE public.user_subscriptions 
ALTER COLUMN reset_date DROP NOT NULL;

-- Update existing subscriptions to have null reset_date
UPDATE public.user_subscriptions
SET reset_date = NULL
WHERE subscription_type = 'free' AND tests_remaining = 3;

-- Update the handle_new_user_subscription function to not set reset_date initially
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_subscriptions (user_id, subscription_type, tests_remaining, reset_date)
  VALUES (NEW.id, 'free', 3, NULL);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update reset function to work with 30-day cycle
CREATE OR REPLACE FUNCTION public.reset_monthly_test_limit()
RETURNS void AS $$
BEGIN
  UPDATE public.user_subscriptions
  SET tests_remaining = 3,
      reset_date = NULL,
      updated_at = now()
  WHERE subscription_type = 'free' 
    AND reset_date IS NOT NULL
    AND reset_date <= now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
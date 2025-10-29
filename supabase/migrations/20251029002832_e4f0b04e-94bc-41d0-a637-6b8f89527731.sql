-- Add premium_until column to track when premium expires
ALTER TABLE public.user_subscriptions
ADD COLUMN premium_until timestamp with time zone;

-- Function to expire premium subscriptions
CREATE OR REPLACE FUNCTION public.expire_premium_subscriptions()
RETURNS void AS $$
BEGIN
  UPDATE public.user_subscriptions
  SET subscription_type = 'free',
      tests_remaining = 3,
      reset_date = NULL,
      premium_until = NULL,
      updated_at = now()
  WHERE subscription_type = 'premium' 
    AND premium_until IS NOT NULL
    AND premium_until <= now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
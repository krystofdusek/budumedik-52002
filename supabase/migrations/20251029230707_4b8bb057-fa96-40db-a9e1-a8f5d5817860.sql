-- Update the handle_new_user_subscription function to automatically set users as premium during testing period
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert new users as premium with unlimited tests during testing period
  INSERT INTO public.user_subscriptions (user_id, subscription_type, tests_remaining, reset_date)
  VALUES (NEW.id, 'premium', 999999, NULL);
  RETURN NEW;
END;
$function$;
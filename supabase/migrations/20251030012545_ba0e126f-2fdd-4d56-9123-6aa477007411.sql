-- Configure Supabase Auth to use custom email hook
-- This will trigger our send-verification-email function for all auth emails

-- First, we need to configure the auth hook in the auth.config table
-- Note: This is a system configuration, Auth Hooks might need to be configured via dashboard or auth settings

-- For now, we'll set up a trigger on auth.users to send verification emails
CREATE OR REPLACE FUNCTION public.send_verification_email_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_site_url text;
BEGIN
  -- Only send email if email is not confirmed
  IF NEW.email_confirmed_at IS NULL THEN
    v_site_url := current_setting('app.settings.site_url', true);
    IF v_site_url IS NULL THEN
      v_site_url := 'https://jcabdfmvjblzulnvvuso.supabase.co';
    END IF;
    
    -- Call the edge function to send verification email
    PERFORM net.http_post(
      url := v_site_url || '/functions/v1/send-verification-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'email', NEW.email,
        'redirectTo', v_site_url || '/email-verified'
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users (if we have permission)
-- Note: This might need to be done via Supabase dashboard as auth schema is protected
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW
--   EXECUTE FUNCTION public.send_verification_email_on_signup();
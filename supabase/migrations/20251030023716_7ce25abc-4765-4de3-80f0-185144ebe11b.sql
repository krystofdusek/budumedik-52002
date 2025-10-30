-- Remove the trigger and function that causes duplicate emails
DROP FUNCTION IF EXISTS public.send_verification_email_on_signup() CASCADE;

-- This will remove any triggers associated with this function
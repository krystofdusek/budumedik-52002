-- Set all non-admin users to free subscription if they don't have one
INSERT INTO public.user_subscriptions (user_id, subscription_type, tests_remaining)
SELECT 
  u.id,
  'free',
  3
FROM auth.users u
LEFT JOIN public.user_subscriptions us ON u.id = us.user_id
WHERE us.user_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = u.id AND ur.role = 'admin'
  );
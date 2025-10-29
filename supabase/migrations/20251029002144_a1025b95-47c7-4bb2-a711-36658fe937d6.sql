-- Allow admins to view all user subscriptions
CREATE POLICY "Admins can view all subscriptions"
ON public.user_subscriptions
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

-- Allow admins to update all subscriptions
CREATE POLICY "Admins can update all subscriptions"
ON public.user_subscriptions
FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()));

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));
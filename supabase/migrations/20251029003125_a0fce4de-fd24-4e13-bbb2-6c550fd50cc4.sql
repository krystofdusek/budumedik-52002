-- Allow admins to delete user subscriptions (cascade will be handled by app logic)
CREATE POLICY "Admins can delete subscriptions"
ON public.user_subscriptions
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));

-- Allow admins to delete profiles
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));
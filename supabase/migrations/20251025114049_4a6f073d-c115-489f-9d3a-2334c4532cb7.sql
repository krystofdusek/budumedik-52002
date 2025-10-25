-- Fix user_statistics RLS policy - restrict to own data only
DROP POLICY IF EXISTS "Anyone can view statistics" ON public.user_statistics;

CREATE POLICY "Users can view own statistics" 
ON public.user_statistics 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create a security definer function for leaderboard access
-- This allows controlled access to aggregated statistics without exposing individual data
CREATE OR REPLACE FUNCTION public.get_leaderboard()
RETURNS TABLE (
  rank BIGINT,
  user_id UUID,
  activity_score INTEGER,
  total_questions_answered INTEGER,
  total_tests_completed INTEGER,
  total_correct_answers INTEGER,
  is_current_user BOOLEAN
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    ROW_NUMBER() OVER (ORDER BY us.activity_score DESC) as rank,
    us.user_id,
    us.activity_score,
    us.total_questions_answered,
    us.total_tests_completed,
    us.total_correct_answers,
    (us.user_id = auth.uid()) as is_current_user
  FROM user_statistics us
  ORDER BY us.activity_score DESC
$$;
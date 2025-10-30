-- Add privacy control for leaderboard visibility
ALTER TABLE public.profiles 
ADD COLUMN show_on_leaderboard BOOLEAN NOT NULL DEFAULT false;

-- Update get_leaderboard function to respect privacy settings
CREATE OR REPLACE FUNCTION public.get_leaderboard()
RETURNS TABLE(
  rank bigint,
  user_id uuid,
  activity_score integer,
  total_questions_answered integer,
  total_tests_completed integer,
  total_correct_answers integer,
  is_current_user boolean
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
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
  INNER JOIN profiles p ON us.user_id = p.id
  WHERE p.show_on_leaderboard = true OR us.user_id = auth.uid()
  ORDER BY us.activity_score DESC
$$;
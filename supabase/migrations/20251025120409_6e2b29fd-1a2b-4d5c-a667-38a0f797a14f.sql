-- Fix search_path for recalculate_user_statistics function
DROP FUNCTION IF EXISTS public.recalculate_user_statistics();

CREATE OR REPLACE FUNCTION public.recalculate_user_statistics()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update statistics based on actual user_answers data
  INSERT INTO public.user_statistics (user_id, total_questions_answered, total_correct_answers)
  SELECT 
    ua.user_id,
    COUNT(*) as total_questions,
    COUNT(*) FILTER (WHERE ua.is_correct = true) as correct_answers
  FROM public.user_answers ua
  GROUP BY ua.user_id
  ON CONFLICT (user_id)
  DO UPDATE SET
    total_questions_answered = EXCLUDED.total_questions_answered,
    total_correct_answers = EXCLUDED.total_correct_answers,
    updated_at = now();
END;
$$;
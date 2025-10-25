-- Drop all triggers first
DROP TRIGGER IF EXISTS on_user_answer_insert ON public.user_answers;
DROP TRIGGER IF EXISTS update_statistics_on_answer ON public.user_answers;

-- Drop and recreate the trigger function to fix statistics counting
DROP FUNCTION IF EXISTS public.update_user_statistics() CASCADE;

CREATE OR REPLACE FUNCTION public.update_user_statistics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert or update user statistics
  INSERT INTO public.user_statistics (user_id, total_questions_answered, total_correct_answers)
  VALUES (
    NEW.user_id,
    1,
    CASE WHEN NEW.is_correct THEN 1 ELSE 0 END
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    total_questions_answered = user_statistics.total_questions_answered + 1,
    total_correct_answers = user_statistics.total_correct_answers + CASE WHEN NEW.is_correct THEN 1 ELSE 0 END,
    updated_at = now();
  
  RETURN NEW;
END;
$$;

-- Recreate trigger
CREATE TRIGGER on_user_answer_insert
  AFTER INSERT ON public.user_answers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_statistics();

-- Function to recalculate statistics for all users
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

-- Recalculate existing statistics
SELECT public.recalculate_user_statistics();
-- Fix function search_path security issue
-- Add SET search_path = public to calculate_activity_score function

CREATE OR REPLACE FUNCTION public.calculate_activity_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_activity_score integer;
BEGIN
  -- Calculate activity score based on:
  -- - Total questions answered (1 point each)
  -- - Tests completed (10 points each)
  -- - Success rate bonus (up to 50 points)
  
  SELECT 
    COALESCE(COUNT(DISTINCT ua.id), 0) + 
    COALESCE((SELECT COUNT(*) * 10 FROM public.test_results WHERE user_id = NEW.user_id), 0) +
    CASE 
      WHEN COUNT(DISTINCT ua.id) > 0 THEN
        LEAST(50, (COUNT(DISTINCT ua.id) FILTER (WHERE ua.is_correct = true) * 50 / COUNT(DISTINCT ua.id)))
      ELSE 0
    END
  INTO v_activity_score
  FROM public.user_answers ua
  WHERE ua.user_id = NEW.user_id;
  
  NEW.activity_score = v_activity_score;
  RETURN NEW;
END;
$$;
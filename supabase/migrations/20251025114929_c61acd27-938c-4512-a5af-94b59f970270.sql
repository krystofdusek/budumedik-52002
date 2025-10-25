-- Drop the existing function
DROP FUNCTION IF EXISTS public.get_faculty_comparison(uuid, uuid);

-- Recreate with proper aggregation
CREATE OR REPLACE FUNCTION public.get_faculty_comparison(p_user_id uuid, p_faculty_id uuid)
RETURNS TABLE(
  your_success_rate integer,
  faculty_average integer,
  subject_comparisons jsonb
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_your_correct INTEGER := 0;
  v_your_total INTEGER := 0;
  v_faculty_correct INTEGER := 0;
  v_faculty_total INTEGER := 0;
  v_faculty_avg INTEGER := 0;
  v_your_rate INTEGER := 0;
  v_subject_comp jsonb := '[]'::jsonb;
BEGIN
  -- Get user's statistics
  SELECT 
    COALESCE(total_correct_answers, 0),
    COALESCE(total_questions_answered, 0)
  INTO v_your_correct, v_your_total
  FROM user_statistics
  WHERE user_id = p_user_id;

  -- Calculate user's success rate
  IF v_your_total > 0 THEN
    v_your_rate := ROUND((v_your_correct::numeric / v_your_total::numeric) * 100)::INTEGER;
  END IF;

  -- Get faculty statistics from all users with same favorite faculty
  SELECT 
    COALESCE(SUM(us.total_correct_answers), 0),
    COALESCE(SUM(us.total_questions_answered), 0)
  INTO v_faculty_correct, v_faculty_total
  FROM user_statistics us
  INNER JOIN profiles p ON us.user_id = p.id
  WHERE p.favorite_faculty_id = p_faculty_id;

  -- Calculate faculty average
  IF v_faculty_total > 0 THEN
    v_faculty_avg := ROUND((v_faculty_correct::numeric / v_faculty_total::numeric) * 100)::INTEGER;
  END IF;

  -- Get subject comparison
  WITH faculty_users AS (
    SELECT id FROM profiles WHERE favorite_faculty_id = p_faculty_id
  ),
  subject_stats AS (
    SELECT 
      s.name as subject_name,
      -- User stats
      COUNT(CASE WHEN ua.user_id = p_user_id THEN 1 END) as user_total,
      COUNT(CASE WHEN ua.user_id = p_user_id AND ua.is_correct THEN 1 END) as user_correct,
      -- Faculty stats
      COUNT(*) as faculty_total,
      COUNT(CASE WHEN ua.is_correct THEN 1 END) as faculty_correct
    FROM user_answers ua
    INNER JOIN questions q ON ua.question_id = q.id
    INNER JOIN subjects s ON q.subject_id = s.id
    INNER JOIN faculty_users fu ON ua.user_id = fu.id
    GROUP BY s.id, s.name
  )
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'subjectName', ss.subject_name,
        'yourRate', CASE 
          WHEN ss.user_total > 0 
          THEN ROUND((ss.user_correct::numeric / ss.user_total::numeric) * 100)::INTEGER
          ELSE 0
        END,
        'facultyRate', CASE 
          WHEN ss.faculty_total > 0 
          THEN ROUND((ss.faculty_correct::numeric / ss.faculty_total::numeric) * 100)::INTEGER
          ELSE 0
        END
      )
    ),
    '[]'::jsonb
  )
  INTO v_subject_comp
  FROM subject_stats ss;

  -- Return the results
  RETURN QUERY SELECT v_your_rate, v_faculty_avg, v_subject_comp;
END;
$$;
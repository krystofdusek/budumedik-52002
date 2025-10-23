-- Add favorite_faculty_id to profiles
ALTER TABLE public.profiles 
ADD COLUMN favorite_faculty_id uuid REFERENCES public.faculties(id);

-- Create index for better performance
CREATE INDEX idx_profiles_favorite_faculty ON public.profiles(favorite_faculty_id);

-- Create a table for user statistics (for leaderboard)
CREATE TABLE public.user_statistics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  total_questions_answered integer DEFAULT 0 NOT NULL,
  total_tests_completed integer DEFAULT 0 NOT NULL,
  total_correct_answers integer DEFAULT 0 NOT NULL,
  activity_score integer DEFAULT 0 NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on user_statistics
ALTER TABLE public.user_statistics ENABLE ROW LEVEL SECURITY;

-- Users can view all statistics (for leaderboard and comparison)
CREATE POLICY "Anyone can view statistics"
ON public.user_statistics
FOR SELECT
USING (true);

-- Users can insert their own statistics
CREATE POLICY "Users can insert their own statistics"
ON public.user_statistics
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own statistics
CREATE POLICY "Users can update their own statistics"
ON public.user_statistics
FOR UPDATE
USING (auth.uid() = user_id);

-- Create function to update statistics
CREATE OR REPLACE FUNCTION public.update_user_statistics()
RETURNS TRIGGER
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

-- Create trigger to update statistics when user answers
CREATE TRIGGER update_statistics_on_answer
AFTER INSERT ON public.user_answers
FOR EACH ROW
EXECUTE FUNCTION public.update_user_statistics();

-- Create function to update test completion statistics
CREATE OR REPLACE FUNCTION public.update_test_statistics()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update test completion count
  INSERT INTO public.user_statistics (user_id, total_tests_completed)
  VALUES (NEW.user_id, 1)
  ON CONFLICT (user_id) 
  DO UPDATE SET
    total_tests_completed = user_statistics.total_tests_completed + 1,
    updated_at = now();
  
  RETURN NEW;
END;
$$;

-- Create trigger to update statistics when test is completed
CREATE TRIGGER update_statistics_on_test
AFTER INSERT ON public.test_results
FOR EACH ROW
EXECUTE FUNCTION public.update_test_statistics();

-- Create function to calculate activity score
CREATE OR REPLACE FUNCTION public.calculate_activity_score()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  success_rate numeric;
BEGIN
  -- Calculate success rate
  IF NEW.total_questions_answered > 0 THEN
    success_rate := (NEW.total_correct_answers::numeric / NEW.total_questions_answered::numeric) * 100;
  ELSE
    success_rate := 0;
  END IF;
  
  -- Calculate activity score: 
  -- (questions * 1) + (tests * 10) + (success_rate * 2)
  -- This rewards both activity and accuracy
  NEW.activity_score := (NEW.total_questions_answered * 1) + 
                        (NEW.total_tests_completed * 10) + 
                        (success_rate * 2)::integer;
  
  RETURN NEW;
END;
$$;

-- Create trigger to calculate activity score
CREATE TRIGGER calculate_score_on_update
BEFORE INSERT OR UPDATE ON public.user_statistics
FOR EACH ROW
EXECUTE FUNCTION public.calculate_activity_score();
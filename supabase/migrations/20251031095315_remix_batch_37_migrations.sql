
-- Migration: 20251021233552
-- Create enum types
CREATE TYPE app_role AS ENUM ('admin', 'user');
CREATE TYPE faculty_type AS ENUM ('2LF', 'LF_BRNO', '3LF', 'LFHK');
CREATE TYPE subject_type AS ENUM ('PHYSICS', 'CHEMISTRY', 'BIOLOGY');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = is_admin.user_id
      AND role = 'admin'
  )
$$;

-- Create subjects table
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  type subject_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view subjects"
  ON public.subjects FOR SELECT
  TO authenticated
  USING (true);

-- Create categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(name, subject_id)
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view categories"
  ON public.categories FOR SELECT
  TO authenticated
  USING (true);

-- Create faculties table
CREATE TABLE public.faculties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  code faculty_type NOT NULL UNIQUE,
  allows_multiple_correct BOOLEAN NOT NULL DEFAULT false,
  has_option_e BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.faculties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view faculties"
  ON public.faculties FOR SELECT
  TO authenticated
  USING (true);

-- Create questions table
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  option_e TEXT,
  correct_answers TEXT[] NOT NULL,
  explanation TEXT,
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  faculty_id UUID NOT NULL REFERENCES public.faculties(id) ON DELETE CASCADE,
  year INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view questions"
  ON public.questions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert questions"
  ON public.questions FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update questions"
  ON public.questions FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete questions"
  ON public.questions FOR DELETE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Create question_reports table
CREATE TABLE public.question_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.profiles(id)
);

ALTER TABLE public.question_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reports"
  ON public.question_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create reports"
  ON public.question_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all reports"
  ON public.question_reports FOR SELECT
  TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update reports"
  ON public.question_reports FOR UPDATE
  TO authenticated
  USING (public.is_admin(auth.uid()));

-- Create test_results table
CREATE TABLE public.test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  test_type TEXT NOT NULL,
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  subject_id UUID REFERENCES public.subjects(id),
  category_id UUID REFERENCES public.categories(id),
  faculty_id UUID REFERENCES public.faculties(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own test results"
  ON public.test_results FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create test results"
  ON public.test_results FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create user_answers table
CREATE TABLE public.user_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  selected_answers TEXT[] NOT NULL,
  is_correct BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own answers"
  ON public.user_answers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create answers"
  ON public.user_answers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create trigger function for updating timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_questions_updated_at
  BEFORE UPDATE ON public.questions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Insert default subjects
INSERT INTO public.subjects (name, type) VALUES
  ('Fyzika', 'PHYSICS'),
  ('Chemie', 'CHEMISTRY'),
  ('Biologie', 'BIOLOGY');

-- Insert physics categories
INSERT INTO public.categories (name, subject_id)
SELECT 'Mechanika', id FROM public.subjects WHERE name = 'Fyzika'
UNION ALL
SELECT 'Hydrostatika a hydrodynamika', id FROM public.subjects WHERE name = 'Fyzika'
UNION ALL
SELECT 'Termika a termodynamika', id FROM public.subjects WHERE name = 'Fyzika'
UNION ALL
SELECT 'Mechanické vlnění a akustika', id FROM public.subjects WHERE name = 'Fyzika'
UNION ALL
SELECT 'Elektřina a magnetismus', id FROM public.subjects WHERE name = 'Fyzika'
UNION ALL
SELECT 'Elektromagnetické vlnění', id FROM public.subjects WHERE name = 'Fyzika'
UNION ALL
SELECT 'Optika', id FROM public.subjects WHERE name = 'Fyzika'
UNION ALL
SELECT 'Atomová a jaderná fyzika', id FROM public.subjects WHERE name = 'Fyzika'
UNION ALL
SELECT 'Základy fyzikální měření', id FROM public.subjects WHERE name = 'Fyzika';

-- Insert chemistry categories
INSERT INTO public.categories (name, subject_id)
SELECT 'Obecná chemie', id FROM public.subjects WHERE name = 'Chemie'
UNION ALL
SELECT 'Anorganická chemie', id FROM public.subjects WHERE name = 'Chemie'
UNION ALL
SELECT 'Fyzikální chemie', id FROM public.subjects WHERE name = 'Chemie'
UNION ALL
SELECT 'Roztoky a koncentrace', id FROM public.subjects WHERE name = 'Chemie'
UNION ALL
SELECT 'Chemická rovnováha', id FROM public.subjects WHERE name = 'Chemie'
UNION ALL
SELECT 'Kyseliny, zásady a pufry', id FROM public.subjects WHERE name = 'Chemie'
UNION ALL
SELECT 'Redoxní děje a elektrochemie', id FROM public.subjects WHERE name = 'Chemie'
UNION ALL
SELECT 'Organická chemie', id FROM public.subjects WHERE name = 'Chemie'
UNION ALL
SELECT 'Biochemie', id FROM public.subjects WHERE name = 'Chemie';

-- Insert biology categories
INSERT INTO public.categories (name, subject_id)
SELECT 'Cytologie', id FROM public.subjects WHERE name = 'Biologie'
UNION ALL
SELECT 'Genetika', id FROM public.subjects WHERE name = 'Biologie'
UNION ALL
SELECT 'Mikrobiologie a virologie', id FROM public.subjects WHERE name = 'Biologie'
UNION ALL
SELECT 'Biologie člověka', id FROM public.subjects WHERE name = 'Biologie'
UNION ALL
SELECT 'Evoluce', id FROM public.subjects WHERE name = 'Biologie'
UNION ALL
SELECT 'Významné osobnosti biologie', id FROM public.subjects WHERE name = 'Biologie';

-- Insert faculties
INSERT INTO public.faculties (name, code, allows_multiple_correct, has_option_e) VALUES
  ('2. lékařská fakulta UK', '2LF', true, false),
  ('Lékařská fakulta MU Brno', 'LF_BRNO', false, true),
  ('3. lékařská fakulta UK', '3LF', false, false),
  ('Lékařská fakulta UK Hradec Králové', 'LFHK', false, false);

-- Migration: 20251023075752
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

-- Migration: 20251023081221
-- Add new faculty types to enum (must be in separate transaction)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = '1LF' AND enumtypid = 'faculty_type'::regtype) THEN
    ALTER TYPE faculty_type ADD VALUE '1LF';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'LFPLZEN' AND enumtypid = 'faculty_type'::regtype) THEN
    ALTER TYPE faculty_type ADD VALUE 'LFPLZEN';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'LFOL' AND enumtypid = 'faculty_type'::regtype) THEN
    ALTER TYPE faculty_type ADD VALUE 'LFOL';
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'LFOSTRAVA' AND enumtypid = 'faculty_type'::regtype) THEN
    ALTER TYPE faculty_type ADD VALUE 'LFOSTRAVA';
  END IF;
END $$;

-- Migration: 20251023081236
-- Add missing Czech medical faculties
INSERT INTO faculties (name, code, has_option_e, allows_multiple_correct) VALUES
  ('1. lékařská fakulta UK', '1LF', false, false),
  ('Lékařská fakulta UK Plzeň', 'LFPLZEN', false, false),
  ('Lékařská fakulta UP Olomouc', 'LFOL', false, false),
  ('Lékařská fakulta OU Ostrava', 'LFOSTRAVA', false, false)
ON CONFLICT DO NOTHING;

-- Migration: 20251024193323
-- Add columns to questions table for AI tracking and active status
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS is_ai_generated boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Make explanation required for new questions (existing nulls stay)
-- We'll handle this in application logic for now

-- Create favorite_questions table
CREATE TABLE IF NOT EXISTS public.favorite_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, question_id)
);

-- Enable RLS on favorite_questions
ALTER TABLE public.favorite_questions ENABLE ROW LEVEL SECURITY;

-- RLS policies for favorite_questions
CREATE POLICY "Users can view their own favorites"
ON public.favorite_questions FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can add their own favorites"
ON public.favorite_questions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove their own favorites"
ON public.favorite_questions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Update questions RLS policy to hide inactive (reported) questions
DROP POLICY IF EXISTS "Anyone can view questions" ON public.questions;

CREATE POLICY "Users can view active questions"
ON public.questions FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Admins can view all questions"
ON public.questions FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

-- Update question_reports to handle approval workflow
ALTER TABLE public.question_reports
ADD COLUMN IF NOT EXISTS admin_notes text;

-- When a report is created, mark the question as inactive
CREATE OR REPLACE FUNCTION public.handle_question_report()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Mark question as inactive when reported
  UPDATE public.questions
  SET is_active = false
  WHERE id = NEW.question_id;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_question_reported
  AFTER INSERT ON public.question_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_question_report();

-- Function to handle admin resolution
CREATE OR REPLACE FUNCTION public.resolve_question_report(
  report_id uuid,
  resolution_status text,
  notes text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_question_id uuid;
BEGIN
  -- Check if user is admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can resolve reports';
  END IF;

  -- Get the question_id
  SELECT question_id INTO v_question_id
  FROM public.question_reports
  WHERE id = report_id;

  -- Update report status
  UPDATE public.question_reports
  SET 
    status = resolution_status,
    resolved_by = auth.uid(),
    resolved_at = now(),
    admin_notes = notes
  WHERE id = report_id;

  -- Handle based on resolution
  IF resolution_status = 'approved' THEN
    -- Reactivate the question
    UPDATE public.questions
    SET is_active = true
    WHERE id = v_question_id;
  ELSIF resolution_status = 'deleted' THEN
    -- Delete the question permanently
    DELETE FROM public.questions
    WHERE id = v_question_id;
  END IF;
END;
$$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_questions_active ON public.questions(is_active);
CREATE INDEX IF NOT EXISTS idx_favorite_questions_user ON public.favorite_questions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_user_correct ON public.user_answers(user_id, is_correct);

-- Migration: 20251025114044
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

-- Migration: 20251025114435
-- Create security definer function for faculty comparison
-- This allows users to see aggregated faculty statistics without accessing individual user data
CREATE OR REPLACE FUNCTION public.get_faculty_comparison(p_user_id UUID, p_faculty_id UUID)
RETURNS TABLE (
  your_success_rate INTEGER,
  faculty_average INTEGER,
  subject_comparisons JSONB
)
LANGUAGE PLPGSQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_your_correct INTEGER;
  v_your_total INTEGER;
  v_faculty_correct INTEGER;
  v_faculty_total INTEGER;
BEGIN
  -- Get user's statistics
  SELECT 
    total_correct_answers,
    total_questions_answered
  INTO v_your_correct, v_your_total
  FROM user_statistics
  WHERE user_id = p_user_id;

  -- Get all users with the same favorite faculty
  WITH faculty_users AS (
    SELECT id 
    FROM profiles 
    WHERE favorite_faculty_id = p_faculty_id
  ),
  faculty_stats AS (
    SELECT 
      SUM(us.total_correct_answers) as total_correct,
      SUM(us.total_questions_answered) as total_questions
    FROM user_statistics us
    INNER JOIN faculty_users fu ON us.user_id = fu.id
  ),
  subject_data AS (
    SELECT 
      s.name as subject_name,
      -- User stats per subject
      COUNT(CASE WHEN ua.user_id = p_user_id THEN 1 END) as user_total,
      COUNT(CASE WHEN ua.user_id = p_user_id AND ua.is_correct THEN 1 END) as user_correct,
      -- Faculty stats per subject
      COUNT(*) as faculty_total,
      COUNT(CASE WHEN ua.is_correct THEN 1 END) as faculty_correct
    FROM user_answers ua
    INNER JOIN questions q ON ua.question_id = q.id
    INNER JOIN subjects s ON q.subject_id = s.id
    INNER JOIN faculty_users fu ON ua.user_id = fu.id
    GROUP BY s.id, s.name
  )
  SELECT 
    CASE 
      WHEN COALESCE(v_your_total, 0) > 0 
      THEN ROUND((v_your_correct::numeric / v_your_total::numeric) * 100)::INTEGER
      ELSE 0
    END as your_success_rate,
    CASE 
      WHEN fs.total_questions > 0 
      THEN ROUND((fs.total_correct::numeric / fs.total_questions::numeric) * 100)::INTEGER
      ELSE 0
    END as faculty_average,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'subjectName', sd.subject_name,
          'yourRate', CASE 
            WHEN sd.user_total > 0 
            THEN ROUND((sd.user_correct::numeric / sd.user_total::numeric) * 100)::INTEGER
            ELSE 0
          END,
          'facultyRate', CASE 
            WHEN sd.faculty_total > 0 
            THEN ROUND((sd.faculty_correct::numeric / sd.faculty_total::numeric) * 100)::INTEGER
            ELSE 0
          END
        )
      ) FILTER (WHERE sd.subject_name IS NOT NULL),
      '[]'::jsonb
    ) as subject_comparisons
  INTO your_success_rate, faculty_average, subject_comparisons
  FROM faculty_stats fs, subject_data sd
  GROUP BY fs.total_correct, fs.total_questions;

  RETURN QUERY 
  SELECT your_success_rate, faculty_average, subject_comparisons;
END;
$$;

-- Migration: 20251025114517
-- Fix search_path for existing trigger functions
-- This resolves the security linter warnings

-- Update update_user_statistics function
CREATE OR REPLACE FUNCTION public.update_user_statistics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $function$
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
$function$;

-- Update update_test_statistics function
CREATE OR REPLACE FUNCTION public.update_test_statistics()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $function$
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
$function$;

-- Recreate triggers to ensure they work with updated functions
DROP TRIGGER IF EXISTS on_user_answer_insert ON public.user_answers;
CREATE TRIGGER on_user_answer_insert
  AFTER INSERT ON public.user_answers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_statistics();

DROP TRIGGER IF EXISTS on_test_result_insert ON public.test_results;
CREATE TRIGGER on_test_result_insert
  AFTER INSERT ON public.test_results
  FOR EACH ROW
  EXECUTE FUNCTION public.update_test_statistics();

-- Migration: 20251025114544
-- Fix remaining functions with search_path issues

-- Update handle_question_report function
CREATE OR REPLACE FUNCTION public.handle_question_report()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $function$
BEGIN
  -- Mark question as inactive when reported
  UPDATE public.questions
  SET is_active = false
  WHERE id = NEW.question_id;
  
  RETURN NEW;
END;
$function$;

-- Update calculate_activity_score function
CREATE OR REPLACE FUNCTION public.calculate_activity_score()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO public
AS $function$
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
$function$;

-- Ensure calculate_activity_score trigger exists
DROP TRIGGER IF EXISTS calculate_activity_score ON public.user_statistics;
CREATE TRIGGER calculate_activity_score
  BEFORE INSERT OR UPDATE ON public.user_statistics
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_activity_score();

-- Ensure handle_question_report trigger exists
DROP TRIGGER IF EXISTS on_question_report ON public.question_reports;
CREATE TRIGGER on_question_report
  AFTER INSERT ON public.question_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_question_report();

-- Migration: 20251025114926
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

-- Migration: 20251025114947
-- Fix search_path for all functions without it set
ALTER FUNCTION public.get_leaderboard() SET search_path = public;
ALTER FUNCTION public.resolve_question_report(uuid, text, text) SET search_path = public;
ALTER FUNCTION public.update_user_statistics() SET search_path = public;
ALTER FUNCTION public.update_test_statistics() SET search_path = public;
ALTER FUNCTION public.handle_question_report() SET search_path = public;
ALTER FUNCTION public.calculate_activity_score() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;

-- Migration: 20251025120343
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

-- Migration: 20251025120406
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

-- Migration: 20251028114515
-- Create fun_facts table for displaying random science facts during tests
CREATE TABLE IF NOT EXISTS public.fun_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fact_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fun_facts ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read fun facts
CREATE POLICY "Anyone can view fun facts"
  ON public.fun_facts
  FOR SELECT
  USING (true);

-- Insert 100 fun facts
INSERT INTO public.fun_facts (fact_text) VALUES
('Lidské tělo obsahuje dostatek uhlíku na výrobu 900 tužek.'),
('DNA ve všech buňkách vašeho těla by se natažená dosáhla až na Pluto a zpět.'),
('Srdce vypumpuje za den přibližně 7 570 litrů krve.'),
('Žaludek si každé 3-4 dny obnoví svou sliznici.'),
('Nervové impulsy cestují rychlostí až 430 km/h.'),
('Lidský mozek spotřebuje 20% celkové energie těla.'),
('Za život projde lidským tělem asi 5 milionů litrů krve.'),
('V ústech máme více bakterií než je lidí na Zemi.'),
('Každý člověk má jedinečný otisk jazyka.'),
('Oční čočka je jediná část těla bez krevního zásobení.'),
('Vaše plíce obsahují přes 300 milionů alveol.'),
('Červené krvinky obíhají tělem za 20 sekund.'),
('Každý člověk má asi 100 000 vlasů na hlavě.'),
('Lidská kůže se kompletně obnoví každých 28 dní.'),
('Mozek generuje až 70 000 myšlenek denně.'),
('Vaše nos dokáže rozlišit přes 1 bilion pachů.'),
('Kosti jsou 5x pevnější než ocel stejné tloušťky.'),
('Lidské ucho dokáže rozlišit přes 400 000 zvuků.'),
('Za život vyprodukujeme až 25 000 litrů slin.'),
('Lidské tělo obsahuje 0,2 mg zlata.'),
('Bílé krvinky žijí jen 13-20 dní.'),
('Játra plní více než 500 různých funkcí.'),
('Vaše oko dokáže rozlišit až 10 milionů barev.'),
('Lidský mozek je aktivnější během spánku než během dne.'),
('Kyslík je ve vodě díky hydrogenové vazbě.'),
('Diamanty a grafit jsou tvořeny stejným prvkem - uhlíkem.'),
('Světlo cestuje rychlostí 299 792 km/s.'),
('Atom je z 99,9999% prázdný prostor.'),
('Voda může existovat ve třech skupenstvích současně.'),
('Helium nikdy nezamrzne za normálního tlaku.'),
('Zlato je tak kujné, že 1 gram lze roztáhnout na 3 km.'),
('Nejchladnější místo ve vesmíru má -272°C.'),
('Blesk je pětkrát teplejší než povrch Slunce.'),
('Sklo je ve skutečnosti přechlazená kapalina.'),
('Vesmír se neustále rozpíná rychlostью větší než světlo.'),
('Černé díry mohou mít miliardy násobek hmotnosti Slunce.'),
('Neutronové hvězdy jsou nejhustší objekty ve vesmíru.'),
('Gravitace je nejslabší ze čtyř základních sil.'),
('Vakuum ve vesmíru není úplně prázdné.'),
('Rychlost zvuku ve vodě je 4x vyšší než ve vzduchu.'),
('Magnet ztrácí své vlastnosti při zahřátí nad Curieovu teplotu.'),
('Elektrony se pohybují téměř rychlostí světla.'),
('Radioaktivní prvky se přirozeně rozpadají.'),
('Supravodivost umožňuje vedení elektřiny bez odporu.'),
('Kvantová provázanost funguje okamžitě na jakoukoliv vzdálenost.'),
('Antimoterie okamžitě anihiluje při kontaktu s hmotou.'),
('Planckova konstanta je nejmenší možná jednotka energie.'),
('Nejmenší částice viditelné pouhým okem jsou 0,1 mm.'),
('Lidské oko může zaznamenat jediný foton světla.'),
('Bakterie dokážou přežít tisíce let zmrazené.'),
('Některé stromy žijí přes 5000 let.'),
('Houby nejsou ani rostliny ani živočichové.'),
('DNA všech lidí je z 99,9% identická.'),
('Mitochondrie mají vlastní DNA.'),
('Lidské tělo obsahuje přibližně 37 bilionů buněk.'),
('Bakterie v našem těle převažují lidské buňky 10:1.'),
('První antibiotikum bylo penicilin objevený 1928.'),
('Viry nejsou považovány za živé organismy.'),
('Některé bakterie dokážou žít v kyselině nebo vroucí vodě.'),
('Rostliny provádějí fotosyntézu pomocí chlorofylu.'),
('Lidská genomová sekvence obsahuje 3 miliardy párů bází.'),
('Evoluční změny mohou nastat během několika generací.'),
('Kvasnice jsou jednobuněčné organismy používané při pečení.'),
('Priony jsou infekční proteiny bez genetického materiálu.'),
('Lidské tělo regeneruje kůži rychleji než jiné tkáně.'),
('Embryonální vývoj u lidí trvá přibližně 38 týdnů.'),
('Geny kontrolují vývoj a funkci všech živých organismů.'),
('Biologická rozmanitost na Zemi zahrnuje miliony druhů.'),
('Ekosystémy recyklují živiny neustálým koloběhem.'),
('Kořeny stromů komunikují přes podzemní mykorrhizu.'),
('Kyslík na Zemi vzniká především z mořských řas.'),
('Lidský mozek dokáže ukládat petabyte dat.'),
('Neurony v mozku komunikují elektrochemickými signály.'),
('Synapse spojují neurony a umožňují přenos informací.'),
('Paměť je uložená v síti neuronálních spojení.'),
('Spánek pomáhá konsolidovat vzpomínky.'),
('Endorfiny jsou přirozenou formou úlevy od bolesti.'),
('Adrenalin zvyšuje srdeční frekvenci během stresu.'),
('Serotonin ovlivňuje náladu a emoce.'),
('Dopamin je spojen s pocitem odměny.'),
('Hypofýza řídí mnoho hormonálních funkcí.'),
('Štítná žláza reguluje metabolismus těla.'),
('Inzulin reguluje hladinu cukru v krvi.'),
('Kortizol je hormon uvolňovaný při stresu.'),
('Melatonin reguluje spánkový cyklus.'),
('Testosteron a estrogen jsou pohlavní hormony.'),
('Lidské tělo obsahuje asi 60% vody.'),
('Ledviny filtrují krev až 50x denně.'),
('Játra dokážou regenerovat až 75% své hmotnosti.'),
('Slezina filtruje staré červené krvinky.'),
('Slinivka břišní produkuje trávicí enzymy.'),
('Imunitní systém chrání tělo před patogeny.'),
('Bílé krvinky jsou klíčové pro obranu organismu.'),
('Antibodies specificky rozpoznávají antigeny.'),
('Vakcinace stimuluje imunitní paměť.'),
('Lymfatický systém odvádí přebytečnou tekutinu z tkání.'),
('Kostní dřeň produkuje nové krevní buňky.'),
('Hemoglobin přenáší kyslík v červených krvinkách.'),
('Krevní plazma obsahuje proteiny a elektrolyty.'),
('Srážení krve zabraňuje nadměrné ztrátě krve.'),
('Krevní tlak je měřen v mmHg.'),
('Arterie nesou okysličenou krev od srdce.'),
('Žíly vracejí odkysličenou krev zpět do srdce.');

-- Migration: 20251028131424
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

-- Migration: 20251028131533
-- Fix search_path for update_updated_at_column trigger function
-- This function is used across multiple tables to update timestamps

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Migration: 20251028190435
-- Přesun všech otázek z kategorie "Evoluce" do "Evoluce a fylogeneze"
UPDATE questions 
SET category_id = '638566a7-45a5-4875-b40b-d89e2a0be506'
WHERE category_id = '82a3044e-9475-4252-9539-975b5b57d10f';

-- Smazání staré kategorie "Evoluce"
DELETE FROM categories 
WHERE id = '82a3044e-9475-4252-9539-975b5b57d10f';

-- Migration: 20251028195228
-- Delete all physics questions (subject_id for Physics)
DELETE FROM public.questions 
WHERE subject_id = '65c8e4c6-0257-47f0-8523-663bfefc9d91';

-- Migration: 20251028204148
-- Remove year column from questions table
ALTER TABLE public.questions DROP COLUMN IF EXISTS year;

-- Migration: 20251029000325
-- Create subscription type enum
CREATE TYPE public.subscription_type AS ENUM ('free', 'premium');

-- Create user_subscriptions table
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_type subscription_type NOT NULL DEFAULT 'free',
  tests_remaining INTEGER NOT NULL DEFAULT 3,
  reset_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (date_trunc('month', now()) + interval '1 month'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own subscription"
ON public.user_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscription"
ON public.user_subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscription"
ON public.user_subscriptions
FOR UPDATE
USING (auth.uid() = user_id);

-- Function to reset monthly limits
CREATE OR REPLACE FUNCTION public.reset_monthly_test_limit()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.user_subscriptions
  SET tests_remaining = 3,
      reset_date = date_trunc('month', now()) + interval '1 month',
      updated_at = now()
  WHERE subscription_type = 'free' 
    AND reset_date <= now();
END;
$$;

-- Trigger to auto-create subscription on profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_subscriptions (user_id, subscription_type, tests_remaining)
  VALUES (NEW.id, 'free', 3);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_created_subscription
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_subscription();

-- Migration: 20251029001309
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

-- Migration: 20251029001927
-- Allow reset_date to be null initially (will be set on first test)
ALTER TABLE public.user_subscriptions 
ALTER COLUMN reset_date DROP NOT NULL;

-- Update existing subscriptions to have null reset_date
UPDATE public.user_subscriptions
SET reset_date = NULL
WHERE subscription_type = 'free' AND tests_remaining = 3;

-- Update the handle_new_user_subscription function to not set reset_date initially
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_subscriptions (user_id, subscription_type, tests_remaining, reset_date)
  VALUES (NEW.id, 'free', 3, NULL);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update reset function to work with 30-day cycle
CREATE OR REPLACE FUNCTION public.reset_monthly_test_limit()
RETURNS void AS $$
BEGIN
  UPDATE public.user_subscriptions
  SET tests_remaining = 3,
      reset_date = NULL,
      updated_at = now()
  WHERE subscription_type = 'free' 
    AND reset_date IS NOT NULL
    AND reset_date <= now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Migration: 20251029002143
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

-- Migration: 20251029002555
-- Drop existing overlapping policies first
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Recreate user_subscriptions policies with proper priority
CREATE POLICY "Users can view their own subscription" 
ON public.user_subscriptions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR is_admin(auth.uid()));

-- Recreate profiles policies with proper priority  
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id OR is_admin(auth.uid()));

-- Migration: 20251029002831
-- Add premium_until column to track when premium expires
ALTER TABLE public.user_subscriptions
ADD COLUMN premium_until timestamp with time zone;

-- Function to expire premium subscriptions
CREATE OR REPLACE FUNCTION public.expire_premium_subscriptions()
RETURNS void AS $$
BEGIN
  UPDATE public.user_subscriptions
  SET subscription_type = 'free',
      tests_remaining = 3,
      reset_date = NULL,
      premium_until = NULL,
      updated_at = now()
  WHERE subscription_type = 'premium' 
    AND premium_until IS NOT NULL
    AND premium_until <= now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Migration: 20251029003124
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

-- Migration: 20251029131918
-- Add name column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;

-- Create or replace function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'name'
  );
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to automatically create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Migration: 20251029133848
-- Add DELETE policies allowing users to remove their own data (idempotent via DO blocks)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'user_answers' AND policyname = 'Users can delete their own answers'
  ) THEN
    CREATE POLICY "Users can delete their own answers"
    ON public.user_answers
    FOR DELETE
    USING (auth.uid() = user_id);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'test_results' AND policyname = 'Users can delete their own test results'
  ) THEN
    CREATE POLICY "Users can delete their own test results"
    ON public.test_results
    FOR DELETE
    USING (auth.uid() = user_id);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'user_statistics' AND policyname = 'Users can delete their own statistics'
  ) THEN
    CREATE POLICY "Users can delete their own statistics"
    ON public.user_statistics
    FOR DELETE
    USING (auth.uid() = user_id);
  END IF;
END$$;

-- Migration: 20251029155944
-- Create blog categories table
CREATE TABLE public.blog_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create blog posts table
CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  featured_image TEXT,
  category_id UUID REFERENCES public.blog_categories(id) ON DELETE SET NULL,
  author_id UUID NOT NULL,
  published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for blog_categories
CREATE POLICY "Anyone can view categories"
  ON public.blog_categories
  FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert categories"
  ON public.blog_categories
  FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update categories"
  ON public.blog_categories
  FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete categories"
  ON public.blog_categories
  FOR DELETE
  USING (is_admin(auth.uid()));

-- RLS Policies for blog_posts
CREATE POLICY "Anyone can view published posts"
  ON public.blog_posts
  FOR SELECT
  USING (published = true OR is_admin(auth.uid()));

CREATE POLICY "Admins can insert posts"
  ON public.blog_posts
  FOR INSERT
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update posts"
  ON public.blog_posts
  FOR UPDATE
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete posts"
  ON public.blog_posts
  FOR DELETE
  USING (is_admin(auth.uid()));

-- Create storage bucket for blog images
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true);

-- Storage policies for blog images
CREATE POLICY "Anyone can view blog images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'blog-images');

CREATE POLICY "Admins can upload blog images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'blog-images' AND is_admin(auth.uid()));

CREATE POLICY "Admins can update blog images"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'blog-images' AND is_admin(auth.uid()));

CREATE POLICY "Admins can delete blog images"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'blog-images' AND is_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Migration: 20251029161836
-- Create a trigger to validate option E for Brno faculty
CREATE OR REPLACE FUNCTION public.validate_brno_option_e()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  -- Check if this is Brno faculty (has_option_e = true)
  IF EXISTS (
    SELECT 1 FROM faculties 
    WHERE id = NEW.faculty_id AND has_option_e = true
  ) THEN
    -- If option_e is provided, it must be exactly this text
    IF NEW.option_e IS NOT NULL AND NEW.option_e != 'Žádná odpověď není správná' THEN
      RAISE EXCEPTION 'Pro brněnskou fakultu musí být možnost E) vždy "Žádná odpověď není správná"';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger that runs before insert or update
CREATE TRIGGER validate_brno_option_e_trigger
  BEFORE INSERT OR UPDATE ON public.questions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_brno_option_e();

-- Migration: 20251029162513
-- Fix RLS policies for blog-images storage bucket
-- First, ensure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('blog-images', 'blog-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can view blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update blog images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete blog images" ON storage.objects;

-- Create policies for blog-images bucket
CREATE POLICY "Anyone can view blog images"
ON storage.objects FOR SELECT
USING (bucket_id = 'blog-images');

CREATE POLICY "Admins can upload blog images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'blog-images' AND is_admin(auth.uid()));

CREATE POLICY "Admins can update blog images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'blog-images' AND is_admin(auth.uid()));

CREATE POLICY "Admins can delete blog images"
ON storage.objects FOR DELETE
USING (bucket_id = 'blog-images' AND is_admin(auth.uid()));

-- Migration: 20251029230706
-- Update the handle_new_user_subscription function to automatically set users as premium during testing period
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert new users as premium with unlimited tests during testing period
  INSERT INTO public.user_subscriptions (user_id, subscription_type, tests_remaining, reset_date)
  VALUES (NEW.id, 'premium', 999999, NULL);
  RETURN NEW;
END;
$function$;

-- Migration: 20251030012544
-- Configure Supabase Auth to use custom email hook
-- This will trigger our send-verification-email function for all auth emails

-- First, we need to configure the auth hook in the auth.config table
-- Note: This is a system configuration, Auth Hooks might need to be configured via dashboard or auth settings

-- For now, we'll set up a trigger on auth.users to send verification emails
CREATE OR REPLACE FUNCTION public.send_verification_email_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_site_url text;
BEGIN
  -- Only send email if email is not confirmed
  IF NEW.email_confirmed_at IS NULL THEN
    v_site_url := current_setting('app.settings.site_url', true);
    IF v_site_url IS NULL THEN
      v_site_url := 'https://jcabdfmvjblzulnvvuso.supabase.co';
    END IF;
    
    -- Call the edge function to send verification email
    PERFORM net.http_post(
      url := v_site_url || '/functions/v1/send-verification-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'email', NEW.email,
        'redirectTo', v_site_url || '/email-verified'
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users (if we have permission)
-- Note: This might need to be done via Supabase dashboard as auth schema is protected
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW
--   EXECUTE FUNCTION public.send_verification_email_on_signup();

-- Migration: 20251030023716
-- Remove the trigger and function that causes duplicate emails
DROP FUNCTION IF EXISTS public.send_verification_email_on_signup() CASCADE;

-- This will remove any triggers associated with this function;

-- Migration: 20251030165548
-- Create trigger for user subscriptions
CREATE TRIGGER on_auth_user_created_subscription
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_subscription();

-- Migration: 20251030171235
-- Make subscription creation idempotent to avoid duplicate key errors
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert new users as premium with unlimited tests during testing period
  INSERT INTO public.user_subscriptions (user_id, subscription_type, tests_remaining, reset_date)
  VALUES (NEW.id, 'premium', 999999, NULL)
  ON CONFLICT (user_id) DO NOTHING;  -- prevent duplicate key violations
  RETURN NEW;
END;
$$;

-- Migration: 20251030174929
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

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
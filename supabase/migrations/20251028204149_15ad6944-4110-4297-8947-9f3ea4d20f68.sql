-- Remove year column from questions table
ALTER TABLE public.questions DROP COLUMN IF EXISTS year;
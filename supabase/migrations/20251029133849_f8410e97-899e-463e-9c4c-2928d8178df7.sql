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
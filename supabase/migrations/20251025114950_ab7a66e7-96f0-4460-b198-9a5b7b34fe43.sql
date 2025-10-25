-- Fix search_path for all functions without it set
ALTER FUNCTION public.get_leaderboard() SET search_path = public;
ALTER FUNCTION public.resolve_question_report(uuid, text, text) SET search_path = public;
ALTER FUNCTION public.update_user_statistics() SET search_path = public;
ALTER FUNCTION public.update_test_statistics() SET search_path = public;
ALTER FUNCTION public.handle_question_report() SET search_path = public;
ALTER FUNCTION public.calculate_activity_score() SET search_path = public;
ALTER FUNCTION public.handle_new_user() SET search_path = public;
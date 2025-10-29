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
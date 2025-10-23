-- Add missing Czech medical faculties
INSERT INTO faculties (name, code, has_option_e, allows_multiple_correct) VALUES
  ('1. lékařská fakulta UK', '1LF', false, false),
  ('Lékařská fakulta UK Plzeň', 'LFPLZEN', false, false),
  ('Lékařská fakulta UP Olomouc', 'LFOL', false, false),
  ('Lékařská fakulta OU Ostrava', 'LFOSTRAVA', false, false)
ON CONFLICT DO NOTHING;
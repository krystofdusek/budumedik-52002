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
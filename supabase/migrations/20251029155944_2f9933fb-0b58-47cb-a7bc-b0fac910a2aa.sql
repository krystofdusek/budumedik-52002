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
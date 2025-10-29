import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/Navbar";

export default function BlogPost() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*, blog_categories(name, slug)")
        .eq("slug", slug)
        .eq("published", true)
        .single();
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 mt-20">
          <p>Načítání...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 mt-20">
          <p>Článek nenalezen</p>
          <Button onClick={() => navigate("/blog")} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zpět na blog
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 mt-20">
        <Button
          variant="ghost"
          onClick={() => navigate("/blog")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zpět na blog
        </Button>

        <article className="max-w-4xl mx-auto">
          {post.featured_image && (
            <img
              src={post.featured_image}
              alt={post.title}
              className="w-full h-96 object-cover rounded-lg mb-8"
            />
          )}

          <div className="mb-6">
            <Badge variant="secondary" className="mb-4">
              {post.blog_categories?.name || "Bez kategorie"}
            </Badge>
            <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{new Date(post.created_at).toLocaleDateString("cs-CZ")}</span>
            </div>
          </div>

          {post.excerpt && (
            <p className="text-xl text-muted-foreground mb-8">{post.excerpt}</p>
          )}

          <div className="prose prose-lg max-w-none dark:prose-invert">
            {post.content.split("\n").map((paragraph, index) => (
              <p key={index} className="mb-4">
                {paragraph}
              </p>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}
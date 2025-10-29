import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";

export default function Blog() {
  const navigate = useNavigate();

  const { data: posts, isLoading } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*, blog_categories(name, slug)")
        .eq("published", true)
        .order("created_at", { ascending: false });
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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 mt-20">
        <h1 className="text-4xl font-bold mb-8">Články</h1>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts?.map((post) => (
            <Card
              key={post.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/blog/${post.slug}`)}
            >
              {post.featured_image && (
                <img
                  src={post.featured_image}
                  alt={post.title}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
              )}
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="secondary">
                    {post.blog_categories?.name || "Bez kategorie"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(post.created_at).toLocaleDateString("cs-CZ")}
                  </span>
                </div>
                <CardTitle>{post.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground line-clamp-3">
                  {post.excerpt || post.content.substring(0, 150) + "..."}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {posts?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Zatím nejsou žádné články</p>
          </div>
        )}
      </div>
    </div>
  );
}
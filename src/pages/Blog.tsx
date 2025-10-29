import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Search, Clock } from "lucide-react";
import { useState } from "react";

export default function Blog() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

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

  const { data: categories } = useQuery({
    queryKey: ["blog-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_categories")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const filteredPosts = posts?.filter((post) => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || post.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredPost = filteredPosts?.[0];
  const latestPosts = filteredPosts?.slice(1);

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
        <h1 className="text-4xl font-bold mb-8">Náš Blog</h1>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-12">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
            <Input
              placeholder="Hledat články..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Všechny kategorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Všechny kategorie</SelectItem>
              {categories?.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Featured Post */}
        {featuredPost && (
          <div className="mb-16 bg-card rounded-lg overflow-hidden border shadow-sm">
            <div className="grid md:grid-cols-2 gap-6 p-8">
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Clock size={16} />
                  <span>{new Date(featuredPost.created_at).toLocaleDateString("cs-CZ", { 
                    day: 'numeric', 
                    month: 'short', 
                    year: 'numeric' 
                  })}</span>
                </div>
                <h2 className="text-3xl font-bold mb-4">{featuredPost.title}</h2>
                <p className="text-muted-foreground mb-6 line-clamp-4">
                  {featuredPost.excerpt || featuredPost.content.substring(0, 250) + "..."}
                </p>
                <Button 
                  onClick={() => navigate(`/blog/${featuredPost.slug}`)}
                  variant="outline"
                  className="w-fit"
                >
                  Přečíst více
                </Button>
              </div>
              {featuredPost.featured_image && (
                <div className="order-first md:order-last">
                  <img
                    src={featuredPost.featured_image}
                    alt={featuredPost.title}
                    className="w-full h-[300px] md:h-full object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Latest Posts */}
        {latestPosts && latestPosts.length > 0 && (
          <>
            <h2 className="text-2xl font-bold mb-6">Nejnovější příspěvky</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {latestPosts.map((post) => (
                <div
                  key={post.id}
                  className="cursor-pointer group"
                  onClick={() => navigate(`/blog/${post.slug}`)}
                >
                  {post.featured_image && (
                    <div className="relative overflow-hidden rounded-lg mb-4">
                      <img
                        src={post.featured_image}
                        alt={post.title}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <h3 className="font-semibold mb-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock size={14} />
                    <span>{new Date(post.created_at).toLocaleDateString("cs-CZ", { 
                      day: 'numeric', 
                      month: 'short', 
                      year: 'numeric' 
                    })}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {filteredPosts?.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenalezeny žádné články</p>
          </div>
        )}
      </div>
    </div>
  );
}
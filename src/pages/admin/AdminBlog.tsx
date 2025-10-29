import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Trash2, Edit, Plus } from "lucide-react";
import { Navbar } from "@/components/Navbar";

export default function AdminBlog() {
  const [openPostDialog, setOpenPostDialog] = useState(false);
  const [openCategoryDialog, setOpenCategoryDialog] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const queryClient = useQueryClient();

  // Post form state
  const [postForm, setPostForm] = useState({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    category_id: "",
    published: false,
    featured_image: "",
  });

  // Category form state
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    slug: "",
  });

  const { data: posts } = useQuery({
    queryKey: ["admin-blog-posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*, blog_categories(name)")
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

  const createPostMutation = useMutation({
    mutationFn: async (post: any) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("blog_posts")
        .insert({ ...post, author_id: user?.id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      toast.success("Článek byl vytvořen");
      setOpenPostDialog(false);
      resetPostForm();
    },
  });

  const updatePostMutation = useMutation({
    mutationFn: async ({ id, ...post }: any) => {
      const { error } = await supabase
        .from("blog_posts")
        .update(post)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      toast.success("Článek byl aktualizován");
      setOpenPostDialog(false);
      resetPostForm();
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_posts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-blog-posts"] });
      toast.success("Článek byl smazán");
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (category: any) => {
      const { error } = await supabase.from("blog_categories").insert(category);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-categories"] });
      toast.success("Kategorie byla vytvořena");
      setOpenCategoryDialog(false);
      resetCategoryForm();
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, ...category }: any) => {
      const { error } = await supabase
        .from("blog_categories")
        .update(category)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-categories"] });
      toast.success("Kategorie byla aktualizována");
      setOpenCategoryDialog(false);
      resetCategoryForm();
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blog_categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-categories"] });
      toast.success("Kategorie byla smazána");
    },
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const { error: uploadError, data } = await supabase.storage
      .from("blog-images")
      .upload(fileName, file);

    if (uploadError) {
      toast.error("Chyba při nahrávání obrázku");
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("blog-images")
      .getPublicUrl(fileName);

    setPostForm({ ...postForm, featured_image: publicUrl });
    toast.success("Obrázek byl nahrán");
  };

  const resetPostForm = () => {
    setPostForm({
      title: "",
      slug: "",
      content: "",
      excerpt: "",
      category_id: "",
      published: false,
      featured_image: "",
    });
    setEditingPost(null);
  };

  const resetCategoryForm = () => {
    setCategoryForm({ name: "", slug: "" });
    setEditingCategory(null);
  };

  const handleEditPost = (post: any) => {
    setEditingPost(post);
    setPostForm({
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt || "",
      category_id: post.category_id || "",
      published: post.published,
      featured_image: post.featured_image || "",
    });
    setOpenPostDialog(true);
  };

  const handleEditCategory = (category: any) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      slug: category.slug,
    });
    setOpenCategoryDialog(true);
  };

  const handleSubmitPost = () => {
    if (editingPost) {
      updatePostMutation.mutate({ id: editingPost.id, ...postForm });
    } else {
      createPostMutation.mutate(postForm);
    }
  };

  const handleSubmitCategory = () => {
    if (editingCategory) {
      updateCategoryMutation.mutate({ id: editingCategory.id, ...categoryForm });
    } else {
      createCategoryMutation.mutate(categoryForm);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 mt-20">
        <h1 className="text-4xl font-bold mb-8">Správa blogu</h1>

        <Tabs defaultValue="posts">
          <TabsList>
            <TabsTrigger value="posts">Články</TabsTrigger>
            <TabsTrigger value="categories">Kategorie</TabsTrigger>
          </TabsList>

          <TabsContent value="posts" className="space-y-4">
            <Dialog open={openPostDialog} onOpenChange={setOpenPostDialog}>
              <DialogTrigger asChild>
                <Button onClick={resetPostForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nový článek
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingPost ? "Upravit článek" : "Nový článek"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Název</Label>
                    <Input
                      value={postForm.title}
                      onChange={(e) =>
                        setPostForm({ ...postForm, title: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Slug (URL)</Label>
                    <Input
                      value={postForm.slug}
                      onChange={(e) =>
                        setPostForm({ ...postForm, slug: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Perex</Label>
                    <Textarea
                      value={postForm.excerpt}
                      onChange={(e) =>
                        setPostForm({ ...postForm, excerpt: e.target.value })
                      }
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>Obsah</Label>
                    <Textarea
                      value={postForm.content}
                      onChange={(e) =>
                        setPostForm({ ...postForm, content: e.target.value })
                      }
                      rows={10}
                    />
                  </div>
                  <div>
                    <Label>Kategorie</Label>
                    <Select
                      value={postForm.category_id}
                      onValueChange={(value) =>
                        setPostForm({ ...postForm, category_id: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Vyberte kategorii" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories?.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Hlavní obrázek</Label>
                    <Input type="file" accept="image/*" onChange={handleImageUpload} />
                    {postForm.featured_image && (
                      <img
                        src={postForm.featured_image}
                        alt="Preview"
                        className="mt-2 max-h-48 rounded"
                      />
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={postForm.published}
                      onCheckedChange={(checked) =>
                        setPostForm({ ...postForm, published: checked })
                      }
                    />
                    <Label>Publikováno</Label>
                  </div>
                  <Button onClick={handleSubmitPost}>
                    {editingPost ? "Aktualizovat" : "Vytvořit"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <div className="grid gap-4">
              {posts?.map((post) => (
                <Card key={post.id}>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-start">
                      <div>
                        <div>{post.title}</div>
                        <div className="text-sm text-muted-foreground font-normal">
                          {post.blog_categories?.name} •{" "}
                          {post.published ? "Publikováno" : "Koncept"}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEditPost(post)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => deletePostMutation.mutate(post.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {post.featured_image && (
                      <img
                        src={post.featured_image}
                        alt={post.title}
                        className="w-full h-48 object-cover rounded mb-4"
                      />
                    )}
                    <p className="text-muted-foreground">{post.excerpt}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <Dialog open={openCategoryDialog} onOpenChange={setOpenCategoryDialog}>
              <DialogTrigger asChild>
                <Button onClick={resetCategoryForm}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nová kategorie
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingCategory ? "Upravit kategorii" : "Nová kategorie"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Název</Label>
                    <Input
                      value={categoryForm.name}
                      onChange={(e) =>
                        setCategoryForm({ ...categoryForm, name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label>Slug (URL)</Label>
                    <Input
                      value={categoryForm.slug}
                      onChange={(e) =>
                        setCategoryForm({ ...categoryForm, slug: e.target.value })
                      }
                    />
                  </div>
                  <Button onClick={handleSubmitCategory}>
                    {editingCategory ? "Aktualizovat" : "Vytvořit"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <div className="grid gap-4">
              {categories?.map((category) => (
                <Card key={category.id}>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      <span>{category.name}</span>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEditCategory(category)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => deleteCategoryMutation.mutate(category.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
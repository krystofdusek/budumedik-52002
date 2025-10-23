import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "@/components/ThemeProvider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function Settings() {
  const { theme } = useTheme();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [selectedFaculty, setSelectedFaculty] = useState<string>("");
  const [userId, setUserId] = useState<string>("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    setUserId(user.id);

    const { data: facultiesData } = await supabase.from('faculties').select('*');
    setFaculties(facultiesData || []);

    const { data: profile } = await supabase
      .from('profiles')
      .select('favorite_faculty_id')
      .eq('id', user.id)
      .single();
    
    if (profile?.favorite_faculty_id) {
      setSelectedFaculty(profile.favorite_faculty_id);
    }
  };

  const saveFavoriteFaculty = async () => {
    if (!selectedFaculty) {
      toast({
        title: "Chyba",
        description: "Vyberte prosím fakultu",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ favorite_faculty_id: selectedFaculty })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Uloženo",
        description: "Oblíbená fakulta byla uložena"
      });
    } catch (error) {
      console.error('Error saving faculty:', error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se uložit fakultu",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-8 bg-muted/50">
          <div className="max-w-4xl mx-auto space-y-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Nastavení</h1>
              <p className="text-muted-foreground">
                Upravte si aplikaci podle svých preferencí
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Oblíbená fakulta</CardTitle>
                <CardDescription>
                  Nastavte si oblíbenou fakultu pro personalizované testy a porovnání
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Vyberte fakultu
                    </label>
                    <Select value={selectedFaculty} onValueChange={setSelectedFaculty}>
                      <SelectTrigger>
                        <SelectValue placeholder="Vyberte fakultu" />
                      </SelectTrigger>
                      <SelectContent>
                        {faculties.map(faculty => (
                          <SelectItem key={faculty.id} value={faculty.id}>
                            {faculty.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={saveFavoriteFaculty} disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Ukládání...
                      </>
                    ) : (
                      'Uložit'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Vzhled</CardTitle>
                <CardDescription>
                  Přizpůsobte si vzhled aplikace
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Barevný režim</p>
                    <p className="text-sm text-muted-foreground">
                      Aktuální: {theme === "light" ? "Světlý" : "Tmavý"}
                    </p>
                  </div>
                  <ThemeToggle />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notifikace</CardTitle>
                <CardDescription>
                  Spravujte vaše notifikace
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Emailové notifikace</p>
                    <p className="text-sm text-muted-foreground">
                      Posílejte mi aktualizace o mém pokroku
                    </p>
                  </div>
                  <Button variant="outline">Zapnout</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Účet</CardTitle>
                <CardDescription>
                  Spravujte svůj účet
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Změnit heslo</p>
                    <p className="text-sm text-muted-foreground">
                      Aktualizujte heslo k vašemu účtu
                    </p>
                  </div>
                  <Button variant="outline">Změnit</Button>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <p className="font-medium text-destructive">Smazat účet</p>
                    <p className="text-sm text-muted-foreground">
                      Trvale smazat váš účet a všechna data
                    </p>
                  </div>
                  <Button variant="destructive">Smazat</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

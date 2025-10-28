import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileNav } from "@/components/MobileNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle, Heart, Star } from "lucide-react";
import { sortFacultiesByCity } from "@/lib/facultySort";
import logo from "@/assets/logo.png";

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  option_e: string | null;
  correct_answers: string[];
  explanation: string | null;
  subject: { name: string };
  category: { name: string };
  faculty: { name: string };
}

interface WrongAnswer {
  id: string;
  question_id: string;
  selected_answers: string[];
  created_at: string;
  questions: Question;
}

interface FavoriteQuestion {
  id: string;
  question_id: string;
  created_at: string;
  questions: Question;
}

export default function History() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [wrongAnswers, setWrongAnswers] = useState<WrongAnswer[]>([]);
  const [favorites, setFavorites] = useState<FavoriteQuestion[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedFaculty, setSelectedFaculty] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [currentWrongPage, setCurrentWrongPage] = useState(1);
  const [currentFavPage, setCurrentFavPage] = useState(1);
  const itemsPerPage = 40;

  useEffect(() => {
    loadFilters();
    loadData();
  }, []);

  useEffect(() => {
    loadData();
    setCurrentWrongPage(1);
    setCurrentFavPage(1);
  }, [selectedSubject, selectedCategory, selectedFaculty]);

  const loadFilters = async () => {
    const { data: subjectsData } = await supabase.from("subjects").select("*");
    const { data: categoriesData } = await supabase.from("categories").select("*");
    const { data: facultiesData } = await supabase.from("faculties").select("*");
    
    setSubjects(subjectsData || []);
    setCategories(categoriesData || []);
    setFaculties(sortFacultiesByCity(facultiesData || []));
  };

  const loadData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    // Load wrong answers
    let wrongQuery = supabase
      .from("user_answers")
      .select(`
        id,
        question_id,
        selected_answers,
        created_at,
        questions (
          id,
          question_text,
          option_a,
          option_b,
          option_c,
          option_d,
          option_e,
          correct_answers,
          explanation,
          subject:subjects (name),
          category:categories (name),
          faculty:faculties (name)
        )
      `)
      .eq("user_id", user.id)
      .eq("is_correct", false)
      .order("created_at", { ascending: false });

    const { data: wrongData } = await wrongQuery;

    // Load favorites
    let favQuery = supabase
      .from("favorite_questions")
      .select(`
        id,
        question_id,
        created_at,
        questions (
          id,
          question_text,
          option_a,
          option_b,
          option_c,
          option_d,
          option_e,
          correct_answers,
          explanation,
          subject:subjects (name),
          category:categories (name),
          faculty:faculties (name)
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const { data: favData } = await favQuery;

    // Apply filters
    const filterQuestion = (q: any) => {
      if (selectedSubject !== "all" && q.questions.subject.name !== selectedSubject) return false;
      if (selectedCategory !== "all" && q.questions.category.name !== selectedCategory) return false;
      if (selectedFaculty !== "all" && q.questions.faculty.name !== selectedFaculty) return false;
      return true;
    };

    setWrongAnswers((wrongData || []).filter(filterQuestion));
    setFavorites((favData || []).filter(filterQuestion));
    setLoading(false);
  };

  const removeFavorite = async (favoriteId: string) => {
    const { error } = await supabase
      .from("favorite_questions")
      .delete()
      .eq("id", favoriteId);

    if (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se odebrat z oblíbených",
        variant: "destructive",
      });
    } else {
      toast({ title: "Odebráno z oblíbených" });
      loadData();
    }
  };

  const renderQuestion = (question: Question, type: "wrong" | "favorite", itemId?: string) => (
    <Card key={question.id} className="mb-4">
      <CardHeader className="p-3 sm:p-4 md:p-6">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base sm:text-lg mb-2 break-words">{question.question_text}</CardTitle>
            <div className="flex gap-1 sm:gap-2 flex-wrap">
              <Badge variant="secondary" className="text-xs">{question.subject.name}</Badge>
              <Badge variant="outline" className="text-xs">{question.category.name}</Badge>
              <Badge variant="outline" className="text-xs hidden sm:inline-flex">{question.faculty.name}</Badge>
            </div>
          </div>
          {type === "favorite" && itemId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeFavorite(itemId)}
              className="flex-shrink-0"
            >
              <Heart className="h-4 w-4 fill-primary text-primary" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 md:p-6">
        <div className="space-y-2 mb-4">
          <div className={`text-sm sm:text-base break-words ${question.correct_answers.includes('A') ? 'text-primary font-medium' : ''}`}>A) {question.option_a}</div>
          <div className={`text-sm sm:text-base break-words ${question.correct_answers.includes('B') ? 'text-primary font-medium' : ''}`}>B) {question.option_b}</div>
          <div className={`text-sm sm:text-base break-words ${question.correct_answers.includes('C') ? 'text-primary font-medium' : ''}`}>C) {question.option_c}</div>
          <div className={`text-sm sm:text-base break-words ${question.correct_answers.includes('D') ? 'text-primary font-medium' : ''}`}>D) {question.option_d}</div>
          {question.option_e && (
            <div className={`text-sm sm:text-base break-words ${question.correct_answers.includes('E') ? 'text-primary font-medium' : ''}`}>E) {question.option_e}</div>
          )}
        </div>
        {question.explanation && (
          <div className="mt-4 p-3 sm:p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">Vysvětlení:</p>
            <p className="text-xs sm:text-sm break-words">{question.explanation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-3 sm:p-4 md:p-8 bg-muted/50">
          <div className="md:hidden mb-4 flex items-center justify-between">
            <MobileNav />
            <img 
              src={logo} 
              alt="Logo" 
              className="h-24 w-auto invert dark:invert-0" 
            />
          </div>
          <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 md:space-y-8">
            <div className="px-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Historie</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Zobrazení špatně zodpovězených a oblíbených otázek
              </p>
            </div>

            <div className="flex gap-2 sm:gap-4 flex-wrap px-1">
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="w-full sm:w-[180px] md:w-[200px]">
                  <SelectValue placeholder="Předmět" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všechny předměty</SelectItem>
                  {subjects.map((s) => (
                    <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-[180px] md:w-[200px]">
                  <SelectValue placeholder="Kategorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všechny kategorie</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedFaculty} onValueChange={setSelectedFaculty}>
                <SelectTrigger className="w-full sm:w-[180px] md:w-[200px]">
                  <SelectValue placeholder="Fakulta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Všechny fakulty</SelectItem>
                  {faculties.map((f) => (
                    <SelectItem key={f.id} value={f.name}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Tabs defaultValue="wrong" className="w-full px-1">
              <TabsList>
                <TabsTrigger value="wrong">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Špatně zodpovězené ({wrongAnswers.length})
                </TabsTrigger>
                <TabsTrigger value="favorites">
                  <Heart className="h-4 w-4 mr-2" />
                  Oblíbené ({favorites.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="wrong" className="mt-6">
                {loading ? (
                  <div className="text-center py-8">Načítání...</div>
                ) : wrongAnswers.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8 text-muted-foreground">
                      Žádné špatně zodpovězené otázky
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {wrongAnswers
                      .slice((currentWrongPage - 1) * itemsPerPage, currentWrongPage * itemsPerPage)
                      .map((wa) => renderQuestion(wa.questions, "wrong"))}
                    
                    {wrongAnswers.length > itemsPerPage && (
                      <div className="flex items-center justify-center gap-2 mt-6">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentWrongPage(p => Math.max(1, p - 1))}
                          disabled={currentWrongPage === 1}
                        >
                          Předchozí
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          Stránka {currentWrongPage} z {Math.ceil(wrongAnswers.length / itemsPerPage)}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentWrongPage(p => Math.min(Math.ceil(wrongAnswers.length / itemsPerPage), p + 1))}
                          disabled={currentWrongPage === Math.ceil(wrongAnswers.length / itemsPerPage)}
                        >
                          Další
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="favorites" className="mt-6">
                {loading ? (
                  <div className="text-center py-8">Načítání...</div>
                ) : favorites.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8 text-muted-foreground">
                      Žádné oblíbené otázky
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {favorites
                      .slice((currentFavPage - 1) * itemsPerPage, currentFavPage * itemsPerPage)
                      .map((fav) => renderQuestion(fav.questions, "favorite", fav.id))}
                    
                    {favorites.length > itemsPerPage && (
                      <div className="flex items-center justify-center gap-2 mt-6">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentFavPage(p => Math.max(1, p - 1))}
                          disabled={currentFavPage === 1}
                        >
                          Předchozí
                        </Button>
                        <span className="text-sm text-muted-foreground">
                          Stránka {currentFavPage} z {Math.ceil(favorites.length / itemsPerPage)}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentFavPage(p => Math.min(Math.ceil(favorites.length / itemsPerPage), p + 1))}
                          disabled={currentFavPage === Math.ceil(favorites.length / itemsPerPage)}
                        >
                          Další
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

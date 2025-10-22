import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, FileText, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function TestGenerators() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  
  const [selectedTestType, setSelectedTestType] = useState<'classic' | 'ai' | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedFaculty, setSelectedFaculty] = useState<string>("");
  const [questionCount, setQuestionCount] = useState<number>(10);

  useEffect(() => {
    loadFilters();
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      loadCategories(selectedSubject);
    }
  }, [selectedSubject]);

  const loadFilters = async () => {
    const { data: subjectsData } = await supabase.from('subjects').select('*');
    const { data: facultiesData } = await supabase.from('faculties').select('*');
    
    setSubjects(subjectsData || []);
    setFaculties(facultiesData || []);
  };

  const loadCategories = async (subjectId: string) => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('subject_id', subjectId);
    
    setCategories(data || []);
  };

  const createClassicTest = async () => {
    if (!selectedSubject || !selectedFaculty) {
      toast({
        title: "Chybí informace",
        description: "Vyberte prosím předmět a fakultu",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      let query = supabase
        .from('questions')
        .select('*')
        .eq('subject_id', selectedSubject)
        .eq('faculty_id', selectedFaculty);

      if (selectedCategory && selectedCategory !== 'all') {
        query = query.eq('category_id', selectedCategory);
      }

      const { data: questions, error } = await query.limit(questionCount);

      if (error) throw error;

      if (!questions || questions.length === 0) {
        toast({
          title: "Žádné otázky",
          description: "Pro vybrané filtry nebyly nalezeny žádné otázky",
          variant: "destructive"
        });
        return;
      }

      // Shuffle questions
      const shuffled = questions.sort(() => Math.random() - 0.5);
      
      navigate('/test', { 
        state: { 
          questions: shuffled.slice(0, questionCount),
          testType: 'classic',
          filters: { selectedSubject, selectedCategory, selectedFaculty }
        } 
      });
    } catch (error) {
      console.error('Error creating test:', error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se vytvořit test",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createAITest = async () => {
    if (!selectedSubject || !selectedFaculty) {
      toast({
        title: "Chybí informace",
        description: "Vyberte prosím předmět a fakultu",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-ai-questions', {
        body: {
          subjectId: selectedSubject,
          categoryId: selectedCategory && selectedCategory !== 'all' ? selectedCategory : null,
          facultyId: selectedFaculty,
          count: questionCount
        }
      });

      if (error) throw error;

      if (!data?.questions || data.questions.length === 0) {
        toast({
          title: "Chyba generování",
          description: "Nepodařilo se vygenerovat otázky",
          variant: "destructive"
        });
        return;
      }

      navigate('/test', { 
        state: { 
          questions: data.questions,
          testType: 'ai',
          filters: { selectedSubject, selectedCategory, selectedFaculty }
        } 
      });
    } catch (error: any) {
      console.error('Error creating AI test:', error);
      
      if (error.message?.includes('429')) {
        toast({
          title: "Příliš mnoho požadavků",
          description: "Zkuste to prosím za chvíli",
          variant: "destructive"
        });
      } else if (error.message?.includes('402')) {
        toast({
          title: "Nedostatek kreditů",
          description: "Kontaktujte administrátora",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Chyba",
          description: "Nepodařilo se vytvořit AI test",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  if (selectedTestType) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1 p-8 bg-muted/50">
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  onClick={() => setSelectedTestType(null)}
                >
                  ← Zpět
                </Button>
                <div>
                  <h1 className="text-4xl font-bold mb-2">
                    {selectedTestType === 'classic' ? 'Klasický test' : 'AI Personalizovaný test'}
                  </h1>
                  <p className="text-muted-foreground">
                    Vyplňte parametry testu
                  </p>
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Nastavení testu</CardTitle>
                  <CardDescription>
                    Vyberte předmět, kategorii a fakultu
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Předmět *
                      </label>
                      <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                        <SelectTrigger>
                          <SelectValue placeholder="Vyberte předmět" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map(subject => (
                            <SelectItem key={subject.id} value={subject.id}>
                              {subject.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Kategorie
                      </label>
                      <Select 
                        value={selectedCategory} 
                        onValueChange={setSelectedCategory}
                        disabled={!selectedSubject}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Vyberte kategorii" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Všechny kategorie</SelectItem>
                          {categories.map(category => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Fakulta *
                      </label>
                      <Select value={selectedFaculty} onValueChange={setSelectedFaculty}>
                        <SelectTrigger>
                          <SelectValue placeholder="Vyberte fakultu" />
                        </SelectTrigger>
                        <SelectContent>
                          {faculties.map(faculty => (
                            <SelectItem key={faculty.id} value={faculty.id}>
                              {faculty.name} ({faculty.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Počet otázek
                      </label>
                      <Select 
                        value={questionCount.toString()} 
                        onValueChange={(val) => setQuestionCount(parseInt(val))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10 otázek</SelectItem>
                          <SelectItem value="20">20 otázek</SelectItem>
                          <SelectItem value="30">30 otázek</SelectItem>
                          <SelectItem value="50">50 otázek</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button 
                    className="w-full"
                    size="lg"
                    onClick={selectedTestType === 'classic' ? createClassicTest : createAITest}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {selectedTestType === 'classic' ? 'Vytváření...' : 'Generování...'}
                      </>
                    ) : (
                      selectedTestType === 'classic' ? 'Vytvořit test' : 'Vygenerovat test'
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-8 bg-muted/50">
          <div className="max-w-7xl mx-auto space-y-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Generátory testů</h1>
              <p className="text-muted-foreground">
                Vyberte typ testu, který chcete absolvovat
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedTestType('classic')}>
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Klasický test</CardTitle>
                  <CardDescription>
                    Test z databáze manuálně nahraných otázek
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                    <li>• Filtrování podle předmětu</li>
                    <li>• Výběr kategorie</li>
                    <li>• Specifická fakulta</li>
                    <li>• Otázky z minulých let</li>
                  </ul>
                  <Button className="w-full">
                    Vybrat klasický test
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow border-primary cursor-pointer" onClick={() => setSelectedTestType('ai')}>
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="flex items-center gap-2">
                    AI Personalizovaný test
                    <Badge variant="secondary" className="text-xs">
                      Doporučeno
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Inteligentně generované otázky přizpůsobené vám
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                    <li>• Zaměřené na vaše slabé stránky</li>
                    <li>• Kombinace všech zdrojů otázek</li>
                    <li>• Adaptivní obtížnost</li>
                    <li>• Skutečný formát zkoušky</li>
                  </ul>
                  <Button className="w-full">
                    <Brain className="mr-2 h-4 w-4" />
                    Vybrat AI test
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
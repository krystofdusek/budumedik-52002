import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileNav } from "@/components/MobileNav";
import logo from "@/assets/logo.png";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, FileText, Sparkles, Loader2, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { LoadingWithFacts } from "@/components/LoadingWithFacts";
import { sortFacultiesByCity } from "@/lib/facultySort";
import { UpgradeDialog } from "@/components/UpgradeDialog";
import { useQuery } from "@tanstack/react-query";

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
  const [favoriteFaculty, setFavoriteFaculty] = useState<string>("");
  const [hasHistoricalData, setHasHistoricalData] = useState<boolean | null>(null);
  const [checkingHistory, setCheckingHistory] = useState(false);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);
  const [userId, setUserId] = useState<string>("");

  const { data: subscription, refetch: refetchSubscription } = useQuery({
    queryKey: ["user-subscription", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", userId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  useEffect(() => {
    loadFilters();
  }, []);

  useEffect(() => {
    if (selectedSubject) {
      loadCategories(selectedSubject);
    }
  }, [selectedSubject]);

  useEffect(() => {
    if (selectedTestType === 'ai' && favoriteFaculty) {
      checkHistoricalData();
    }
  }, [selectedTestType, selectedSubject, selectedCategory, favoriteFaculty]);

  const loadFilters = async () => {
    const { data: subjectsData } = await supabase.from('subjects').select('*');
    const { data: facultiesData } = await supabase.from('faculties').select('*');
    setSubjects(subjectsData || []);
    setFaculties(sortFacultiesByCity(facultiesData || []));

    // Load user's favorite faculty and ID
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      const { data: profile } = await supabase
        .from('profiles')
        .select('favorite_faculty_id')
        .eq('id', user.id)
        .single();
      
      if (profile?.favorite_faculty_id) {
        setFavoriteFaculty(profile.favorite_faculty_id);
        setSelectedFaculty(profile.favorite_faculty_id);
      }
    }
  };

  const loadCategories = async (subjectId: string) => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('subject_id', subjectId);
    setCategories(data || []);
  };

  const checkHistoricalData = async () => {
    if (!favoriteFaculty) return;
    
    setCheckingHistory(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let query = supabase
        .from('user_answers')
        .select('id, questions!inner(faculty_id, subject_id, category_id)', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('questions.faculty_id', favoriteFaculty);

      if (selectedSubject && selectedSubject !== 'all') {
        query = query.eq('questions.subject_id', selectedSubject);
      }

      if (selectedCategory && selectedCategory !== 'all') {
        query = query.eq('questions.category_id', selectedCategory);
      }

      const { count } = await query;
      setHasHistoricalData((count || 0) > 0);
    } catch (error) {
      console.error('Error checking historical data:', error);
      setHasHistoricalData(null);
    } finally {
      setCheckingHistory(false);
    }
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

    // Check subscription limits
    if (subscription?.subscription_type === 'free' && subscription?.tests_remaining <= 0) {
      setUpgradeDialogOpen(true);
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

      // Decrement test count for free users and set reset_date on first test
      if (subscription?.subscription_type === 'free') {
        const updateData: any = { 
          tests_remaining: subscription.tests_remaining - 1,
          updated_at: new Date().toISOString()
        };
        
        // If this is the first test (going from 3 to 2), set reset_date to 30 days from now
        if (subscription.tests_remaining === 3 && !subscription.reset_date) {
          const resetDate = new Date();
          resetDate.setDate(resetDate.getDate() + 30);
          updateData.reset_date = resetDate.toISOString();
        }
        
        await supabase
          .from("user_subscriptions")
          .update(updateData)
          .eq("user_id", subscription.user_id);
        await refetchSubscription();
      }

      // Shuffle questions
      const shuffled = questions.sort(() => Math.random() - 0.5);
      navigate('/test', {
        state: {
          questions: shuffled.slice(0, questionCount),
          testType: 'classic',
          filters: {
            selectedSubject,
            selectedCategory,
            selectedFaculty
          }
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
    if (!favoriteFaculty) {
      toast({
        title: "Chybí oblíbená fakulta",
        description: "Nastavte si prosím oblíbenou fakultu v nastavení",
        variant: "destructive"
      });
      return;
    }

    // Check subscription limits
    if (subscription?.subscription_type === 'free' && subscription?.tests_remaining <= 0) {
      setUpgradeDialogOpen(true);
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Chyba autentizace",
          description: "Nejste přihlášeni",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('generate-ai-questions', {
        body: {
          userId: user.id,
          subjectId: selectedSubject || null,
          categoryId: selectedCategory && selectedCategory !== 'all' ? selectedCategory : null,
          facultyId: favoriteFaculty,
          count: questionCount,
          personalizedForUser: hasHistoricalData
        }
      });

      if (error) throw error;

      if (!data?.questions || data.questions.length === 0) {
        toast({
          title: "Chyba generování",
          description: "Nepodařilo se vygenerovat otázky",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Decrement test count for free users and set reset_date on first test
      if (subscription?.subscription_type === 'free') {
        const updateData: any = { 
          tests_remaining: subscription.tests_remaining - 1,
          updated_at: new Date().toISOString()
        };
        
        // If this is the first test (going from 3 to 2), set reset_date to 30 days from now
        if (subscription.tests_remaining === 3 && !subscription.reset_date) {
          const resetDate = new Date();
          resetDate.setDate(resetDate.getDate() + 30);
          updateData.reset_date = resetDate.toISOString();
        }
        
        await supabase
          .from("user_subscriptions")
          .update(updateData)
          .eq("user_id", subscription.user_id);
        await refetchSubscription();
      }

      // Show success message
      if (data.personalized && data.weakAreas) {
        toast({
          title: "✨ Personalizovaný test vytvořen",
          description: `Test zaměřený na vaše slabé oblasti`,
        });
      } else {
        toast({
          title: "AI test vytvořen",
          description: `Vygenerováno ${data.count} otázek`,
        });
      }

      navigate('/test', {
        state: {
          questions: data.questions,
          testType: 'ai',
          filters: {
            selectedSubject,
            selectedCategory,
            selectedFaculty
          }
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
      setLoading(false);
    }
  };

  const isLocked = subscription && subscription.subscription_type === 'free' && subscription.tests_remaining === 0;

  if (!selectedTestType) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1 p-4 md:p-8 bg-muted/50">
            <UpgradeDialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen} />
            
            <div className="md:hidden mb-4 flex items-center justify-between">
              <MobileNav />
              <img 
                src={logo} 
                alt="Logo" 
                className="h-24 w-auto invert dark:invert-0" 
              />
            </div>
            <div className="max-w-7xl mx-auto space-y-8">
              <div>
                <h1 className="text-4xl font-bold mb-2">Generátory testů</h1>
                <p className="text-muted-foreground">
                  Vyberte typ testu, který chcete absolvovat
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <Card 
                  className={`hover:shadow-lg transition-shadow cursor-pointer ${isLocked ? 'opacity-50' : ''}`}
                  onClick={() => isLocked ? setUpgradeDialogOpen(true) : setSelectedTestType('classic')}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      {isLocked && <Lock className="h-5 w-5 text-muted-foreground" />}
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
                  </CardContent>
                </Card>

                <Card 
                  className={`hover:shadow-lg transition-shadow border-primary cursor-pointer ${isLocked ? 'opacity-50' : ''}`}
                  onClick={() => isLocked ? setUpgradeDialogOpen(true) : setSelectedTestType('ai')}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Sparkles className="h-6 w-6 text-primary" />
                      </div>
                      {isLocked && <Lock className="h-5 w-5 text-muted-foreground" />}
                    </div>
                    <CardTitle className="flex items-center gap-2">
                      AI Personalizovaný test
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
                  </CardContent>
                </Card>
              </div>
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
        <main className="flex-1 p-4 md:p-8 bg-muted/50">
          <UpgradeDialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen} />
          
          <div className="md:hidden mb-4 flex items-center justify-between">
            <MobileNav />
            <img 
              src={logo} 
              alt="Logo" 
              className="h-24 w-auto invert dark:invert-0" 
            />
          </div>
          <div className="max-w-4xl mx-auto space-y-8">
            {loading && selectedTestType === 'ai' ? (
              <LoadingWithFacts message="Generujeme AI otázky pro vás..." />
            ) : (
              <>
                <div>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSelectedTestType(null);
                      setSelectedSubject("");
                      setSelectedCategory("");
                      setSelectedFaculty("");
                    }}
                    className="mb-4"
                  >
                    ← Zpět na výběr typu
                  </Button>
                  <h1 className="text-4xl font-bold mb-2">
                    {selectedTestType === 'classic' ? 'Klasický test' : 'AI Personalizovaný test'}
                  </h1>
                  <p className="text-muted-foreground">
                    Nastavte parametry testu
                  </p>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Konfigurace testu</CardTitle>
                    <CardDescription>
                      Vyplňte všechny povinné údaje
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      {selectedTestType === 'ai' && !favoriteFaculty && (
                        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                          <p className="text-sm text-destructive">
                            Pro AI personalizované testy je nutné nastavit oblíbenou fakultu v nastavení
                          </p>
                        </div>
                      )}

                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Předmět {selectedTestType === 'classic' && '*'}
                        </label>
                        <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                          <SelectTrigger>
                            <SelectValue placeholder={selectedTestType === 'ai' ? "Všechny předměty (volitelné)" : "Vyberte předmět"} />
                          </SelectTrigger>
                          <SelectContent>
                            {selectedTestType === 'ai' && <SelectItem value="all">Všechny předměty</SelectItem>}
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
                          disabled={!selectedSubject || selectedSubject === 'all'}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Všechny kategorie (volitelné)" />
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
                      
                      {selectedTestType === 'classic' && (
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
                                  {faculty.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Počet otázek
                        </label>
                        <Select
                          value={questionCount.toString()}
                          onValueChange={val => setQuestionCount(parseInt(val))}
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

                      {selectedTestType === 'ai' && favoriteFaculty && (
                        <div className="p-4 rounded-lg border">
                          {checkingHistory ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Kontrola historických dat...
                            </div>
                          ) : hasHistoricalData === false ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
                                <Brain className="h-5 w-5" />
                                <span className="font-medium">Test bez personalizace</span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Pro vybrané filtry nemáte žádná historická data. Test bude vygenerován bez zaměření na vaše slabé stránky.
                              </p>
                            </div>
                          ) : hasHistoricalData === true ? (
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-primary">
                                <Sparkles className="h-5 w-5" />
                                <span className="font-medium">Personalizovaný test připraven</span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Máme data o vašich odpovědích. Test bude zaměřen na oblasti, kde potřebujete zlepšit.
                              </p>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>

                    <Button 
                      onClick={selectedTestType === 'classic' ? createClassicTest : createAITest}
                      disabled={loading || (selectedTestType === 'classic' && (!selectedSubject || !selectedFaculty))}
                      className="w-full"
                      size="lg"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {selectedTestType === 'ai' ? 'Generuji...' : 'Vytvářím...'}
                        </>
                      ) : (
                        <>
                          {selectedTestType === 'ai' ? (
                            <>
                              <Sparkles className="mr-2 h-4 w-4" />
                              Vygenerovat AI test
                            </>
                          ) : (
                            <>
                              <Brain className="mr-2 h-4 w-4" />
                              Vytvořit test
                            </>
                          )}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

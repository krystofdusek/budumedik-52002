import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileNav } from "@/components/MobileNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { sortFacultiesByCity } from "@/lib/facultySort";
import logo from "@/assets/logo.png";
import { useAdmin } from "@/hooks/useAdmin";

const questionSchema = z.object({
  question_text: z.string().trim().min(10, "Otázka musí mít alespoň 10 znaků").max(1000, "Otázka může mít maximálně 1000 znaků"),
  option_a: z.string().trim().min(1, "Možnost A je povinná").max(500, "Možnost může mít maximálně 500 znaků"),
  option_b: z.string().trim().min(1, "Možnost B je povinná").max(500, "Možnost může mít maximálně 500 znaků"),
  option_c: z.string().trim().min(1, "Možnost C je povinná").max(500, "Možnost může mít maximálně 500 znaků"),
  option_d: z.string().trim().min(1, "Možnost D je povinná").max(500, "Možnost může mít maximálně 500 znaků"),
  option_e: z.string().max(500, "Možnost může mít maximálně 500 znaků").optional().nullable(),
  correct_answers: z.array(z.string()).min(1, "Musí být vybrána alespoň jedna správná odpověď"),
  explanation: z.string().max(2000, "Vysvětlení může mít maximálně 2000 znaků").optional(),
  subject_id: z.string().uuid("Neplatné ID předmětu"),
  category_id: z.string().uuid("Neplatné ID kategorie"),
  faculty_id: z.string().uuid("Neplatné ID fakulty")
});

export default function AdminQuestions() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [questions, setQuestions] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { isAdmin, loading: isLoadingAdmin } = useAdmin();
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  
  // Filter states
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterFaculty, setFilterFaculty] = useState<string>('all');
  const [searchText, setSearchText] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 40;

  const [formData, setFormData] = useState({
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    option_e: '',
    correct_answers: [] as string[],
    explanation: '',
    subject_id: '',
    category_id: '',
    faculty_id: ''
  });

  useEffect(() => {
    if (!isLoadingAdmin) {
      checkAdminAccess();
    }
  }, [isLoadingAdmin, isAdmin]);

  const checkAdminAccess = () => {
    if (!isAdmin) {
      toast({
        title: "Přístup odepřen",
        description: "Nemáte oprávnění k této stránce",
        variant: "destructive",
      });
      navigate("/dashboard");
      return;
    }
    loadData();
  };

  useEffect(() => {
    if (formData.subject_id) {
      loadCategories(formData.subject_id);
    }
  }, [formData.subject_id]);

  useEffect(() => {
    if (filterSubject && filterSubject !== 'all') {
      loadCategoriesForFilter(filterSubject);
    } else {
      // Load all categories when no subject filter is selected
      loadAllCategories();
    }
  }, [filterSubject]);

  const loadData = async () => {
    const { data: subjectsData } = await supabase.from('subjects').select('*');
    const { data: facultiesData } = await supabase.from('faculties').select('*');
    const { data: categoriesData } = await supabase.from('categories').select('*');
    
    // Load all questions without limit
    let allQuestions: any[] = [];
    let from = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data: questionsData } = await supabase
        .from('questions')
        .select(`
          *,
          subjects(name),
          categories(name),
          faculties(name)
        `)
        .order('created_at', { ascending: false })
        .range(from, from + pageSize - 1);

      if (questionsData && questionsData.length > 0) {
        allQuestions = [...allQuestions, ...questionsData];
        from += pageSize;
        hasMore = questionsData.length === pageSize;
      } else {
        hasMore = false;
      }
    }

    setSubjects(subjectsData || []);
    setFaculties(sortFacultiesByCity(facultiesData || []));
    setCategories(categoriesData || []);
    setQuestions(allQuestions);
  };

  const loadCategories = async (subjectId: string) => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('subject_id', subjectId);
    
    setCategories(data || []);
  };

  const loadAllCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*');
    
    setCategories(data || []);
  };

  const loadCategoriesForFilter = async (subjectId: string) => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('subject_id', subjectId);
    
    setCategories(data || []);
    // Reset category filter when subject changes
    setFilterCategory('all');
  };

  // Filter questions based on selected filters
  const filteredQuestions = questions.filter((q) => {
    if (filterSubject && filterSubject !== 'all' && q.subject_id !== filterSubject) return false;
    if (filterCategory && filterCategory !== 'all' && q.category_id !== filterCategory) return false;
    if (filterFaculty && filterFaculty !== 'all' && q.faculty_id !== filterFaculty) return false;
    if (searchText && !q.question_text.toLowerCase().includes(searchText.toLowerCase())) return false;
    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedQuestions = filteredQuestions.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterSubject, filterCategory, filterFaculty, searchText]);

  const handleCheckboxChange = (option: string, checked: boolean) => {
    setFormData({
      ...formData,
      correct_answers: checked
        ? [...formData.correct_answers, option]
        : formData.correct_answers.filter(a => a !== option)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setValidationErrors({});

    try {
      // Validate form data
      const validated = questionSchema.parse({
        ...formData,
        option_e: formData.option_e || null,
        explanation: formData.explanation || undefined
      });

      if (editingQuestion) {
        // Update existing question
        const { error } = await supabase
          .from('questions')
          .update({
            question_text: validated.question_text,
            option_a: validated.option_a,
            option_b: validated.option_b,
            option_c: validated.option_c,
            option_d: validated.option_d,
            option_e: validated.option_e || null,
            correct_answers: validated.correct_answers,
            explanation: validated.explanation || null,
            subject_id: validated.subject_id,
            category_id: validated.category_id,
            faculty_id: validated.faculty_id
          })
          .eq('id', editingQuestion.id);

        if (error) throw error;

        toast({
          title: "Úspěch",
          description: "Otázka byla upravena"
        });
      } else {
        // Insert new question
        const { error } = await supabase
          .from('questions')
          .insert([{
            question_text: validated.question_text,
            option_a: validated.option_a,
            option_b: validated.option_b,
            option_c: validated.option_c,
            option_d: validated.option_d,
            option_e: validated.option_e || null,
            correct_answers: validated.correct_answers,
            explanation: validated.explanation || null,
            subject_id: validated.subject_id,
            category_id: validated.category_id,
            faculty_id: validated.faculty_id
          }]);

        if (error) throw error;

        toast({
          title: "Úspěch",
          description: "Otázka byla přidána"
        });
      }

      setDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setValidationErrors(errors);
        toast({
          title: "Chyba validace",
          description: "Zkontrolujte zadané hodnoty",
          variant: "destructive"
        });
      } else {
        console.error('Error adding question:', error);
        toast({
          title: "Chyba",
          description: "Nepodařilo se přidat otázku",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteQuestion = async (id: string) => {
    if (!confirm('Opravdu chcete smazat tuto otázku?')) return;

    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Úspěch",
        description: "Otázka byla smazána"
      });

      loadData();
    } catch (error) {
      console.error('Error deleting question:', error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se smazat otázku",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      question_text: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      option_e: '',
      correct_answers: [],
      explanation: '',
      subject_id: '',
      category_id: '',
      faculty_id: ''
    });
    setValidationErrors({});
    setEditingQuestion(null);
  };

  const handleEditQuestion = (question: any) => {
    setEditingQuestion(question);
    // Ensure correct_answers are in uppercase format
    const correctAnswers = Array.isArray(question.correct_answers) 
      ? question.correct_answers.map((ans: string) => ans.toUpperCase())
      : [];
    
    setFormData({
      question_text: question.question_text,
      option_a: question.option_a,
      option_b: question.option_b,
      option_c: question.option_c,
      option_d: question.option_d,
      option_e: question.option_e || '',
      correct_answers: correctAnswers,
      explanation: question.explanation || '',
      subject_id: question.subject_id,
      category_id: question.category_id,
      faculty_id: question.faculty_id
    });
    setDialogOpen(true);
  };

  const handleViewQuestion = (question: any) => {
    setSelectedQuestion(question);
    setViewDialogOpen(true);
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar isAdmin={true} />
        <main className="flex-1 p-4 md:p-8 bg-muted/50">
          <div className="md:hidden mb-4 flex items-center justify-between">
            <MobileNav isAdmin={true} />
            <img 
              src={logo} 
              alt="Logo" 
              className="h-24 w-auto invert dark:invert-0" 
            />
          </div>
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">Správa otázek</h1>
                <p className="text-muted-foreground">
                  Spravujte databázi otázek pro přijímací zkoušky
                </p>
              </div>
              
              <Dialog open={dialogOpen} onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Přidat otázku
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingQuestion ? 'Upravit otázku' : 'Přidat novou otázku'}</DialogTitle>
                    <DialogDescription>
                      Vyplňte všechny informace o otázce
                    </DialogDescription>
                  </DialogHeader>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label>Předmět *</Label>
                        <Select
                          value={formData.subject_id}
                          onValueChange={(val) => setFormData({ ...formData, subject_id: val })}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Vyberte" />
                          </SelectTrigger>
                          <SelectContent>
                            {subjects.map(s => (
                              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Kategorie *</Label>
                        <Select
                          value={formData.category_id}
                          onValueChange={(val) => setFormData({ ...formData, category_id: val })}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Vyberte" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map(c => (
                              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Fakulta *</Label>
                        <Select
                          value={formData.faculty_id}
                          onValueChange={(val) => setFormData({ ...formData, faculty_id: val })}
                          required
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Vyberte" />
                          </SelectTrigger>
                          <SelectContent>
                            {faculties.map(f => (
                              <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>Znění otázky *</Label>
                      <Textarea
                        value={formData.question_text}
                        onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                        required
                        rows={3}
                      />
                      {validationErrors.question_text && (
                        <p className="text-sm text-destructive mt-1">{validationErrors.question_text}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Možnosti odpovědí *</Label>
                      {['a', 'b', 'c', 'd', 'e'].map((option) => (
                        <div key={option} className="flex gap-2">
                          <Input
                            placeholder={`Možnost ${option.toUpperCase()}`}
                            value={formData[`option_${option}` as keyof typeof formData] as string}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              [`option_${option}`]: e.target.value 
                            })}
                            required={option !== 'e'}
                          />
                          <div className="flex items-center gap-2 min-w-[120px]">
                            <Checkbox
                              id={`correct-${option}`}
                              checked={formData.correct_answers.includes(option.toUpperCase())}
                              onCheckedChange={(checked) => handleCheckboxChange(option.toUpperCase(), checked as boolean)}
                            />
                            <Label htmlFor={`correct-${option}`}>Správná</Label>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div>
                      <Label>Vysvětlení</Label>
                      <Textarea
                        value={formData.explanation}
                        onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                        rows={3}
                      />
                      {validationErrors.explanation && (
                        <p className="text-sm text-destructive mt-1">{validationErrors.explanation}</p>
                      )}
                    </div>

                    {validationErrors.correct_answers && (
                      <p className="text-sm text-destructive">{validationErrors.correct_answers}</p>
                    )}

                    <Button type="submit" disabled={loading}>
                      {loading ? (editingQuestion ? 'Ukládání...' : 'Přidávání...') : (editingQuestion ? 'Uložit změny' : 'Přidat otázku')}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Seznam otázek ({filteredQuestions.length} z {questions.length})</CardTitle>
                <CardDescription>
                  Zobrazeno {startIndex + 1}-{Math.min(endIndex, filteredQuestions.length)} z {filteredQuestions.length} otázek
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Filter Section */}
                <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Předmět</Label>
                      <Select value={filterSubject} onValueChange={setFilterSubject}>
                        <SelectTrigger>
                          <SelectValue placeholder="Všechny předměty" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Všechny předměty</SelectItem>
                          {subjects.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Kategorie</Label>
                      <Select value={filterCategory} onValueChange={setFilterCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Všechny kategorie" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Všechny kategorie</SelectItem>
                          {categories.map(c => (
                            <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Fakulta</Label>
                      <Select value={filterFaculty} onValueChange={setFilterFaculty}>
                        <SelectTrigger>
                          <SelectValue placeholder="Všechny fakulty" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Všechny fakulty</SelectItem>
                          {faculties.map(f => (
                            <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label>Hledat v textu otázky</Label>
                      <Input
                        placeholder="Zadejte text..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                      />
                    </div>
                  </div>

                  {(filterSubject && filterSubject !== 'all' || filterCategory && filterCategory !== 'all' || filterFaculty && filterFaculty !== 'all' || searchText) && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setFilterSubject('all');
                        setFilterCategory('all');
                        setFilterFaculty('all');
                        setSearchText('');
                      }}
                    >
                      Vymazat filtry
                    </Button>
                  )}
                </div>
                {paginatedQuestions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>{questions.length === 0 ? 'Zatím nebyly přidány žádné otázky' : 'Žádné otázky neodpovídají vybraným filtrům'}</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      {paginatedQuestions.map((q) => (
                      <Card key={q.id}>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1">
                              <p className="font-semibold mb-2">{q.question_text}</p>
                              <div className="text-sm text-muted-foreground space-y-1">
                                <p>Předmět: {q.subjects?.name}</p>
                                <p>Kategorie: {q.categories?.name}</p>
                                <p>Fakulta: {q.faculties?.name}</p>
                                <p>Správné odpovědi: {q.correct_answers.join(', ')}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleViewQuestion(q)}
                              >
                                Zobrazit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditQuestion(q)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteQuestion(q.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        Předchozí
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Stránka {currentPage} z {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Další
                      </Button>
                    </div>
                  )}
                </>
                )}
              </CardContent>
            </Card>

            {/* View Question Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Detail otázky</DialogTitle>
                </DialogHeader>
                {selectedQuestion && (
                  <div className="space-y-4">
                    <div>
                      <Label className="text-base font-semibold">Otázka</Label>
                      <p className="mt-2">{selectedQuestion.question_text}</p>
                    </div>
                    
                    <div>
                      <Label className="text-base font-semibold">Možnosti odpovědí</Label>
                      <div className="mt-2 space-y-2">
                        {['a', 'b', 'c', 'd', 'e'].map((option) => {
                          const optionText = selectedQuestion[`option_${option}`];
                          if (!optionText) return null;
                          const isCorrect = selectedQuestion.correct_answers.includes(option.toUpperCase());
                          return (
                            <div 
                              key={option} 
                              className={`p-3 rounded-lg ${isCorrect ? 'bg-green-100 dark:bg-green-900/30 border-2 border-green-500' : 'bg-muted'}`}
                            >
                              <span className="font-semibold">{option.toUpperCase()})</span> {optionText}
                              {isCorrect && <span className="ml-2 text-green-600 dark:text-green-400 font-semibold">✓ Správná odpověď</span>}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {selectedQuestion.explanation && (
                      <div>
                        <Label className="text-base font-semibold">Vysvětlení</Label>
                        <p className="mt-2 text-muted-foreground">{selectedQuestion.explanation}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                      <div>
                        <Label className="text-sm">Předmět</Label>
                        <p className="text-sm">{selectedQuestion.subjects?.name}</p>
                      </div>
                      <div>
                        <Label className="text-sm">Kategorie</Label>
                        <p className="text-sm">{selectedQuestion.categories?.name}</p>
                      </div>
                      <div>
                        <Label className="text-sm">Fakulta</Label>
                        <p className="text-sm">{selectedQuestion.faculties?.name}</p>
                      </div>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
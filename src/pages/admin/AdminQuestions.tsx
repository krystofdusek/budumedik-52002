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
  faculty_id: z.string().uuid("Neplatné ID fakulty"),
  year: z.number().int().min(2000, "Rok musí být minimálně 2000").max(new Date().getFullYear() + 1, "Rok nemůže být v budoucnosti")
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

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
    faculty_id: '',
    year: new Date().getFullYear()
  });

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roles) {
      toast({
        title: "Přístup odepřen",
        description: "Nemáte oprávnění k této stránce",
        variant: "destructive",
      });
      navigate("/dashboard");
      return;
    }

    setIsAdmin(true);
    loadData();
  };

  useEffect(() => {
    if (formData.subject_id) {
      loadCategories(formData.subject_id);
    }
  }, [formData.subject_id]);

  const loadData = async () => {
    const { data: subjectsData } = await supabase.from('subjects').select('*');
    const { data: facultiesData } = await supabase.from('faculties').select('*');
    const { data: questionsData } = await supabase
      .from('questions')
      .select(`
        *,
        subjects(name),
        categories(name),
        faculties(name)
      `)
      .order('created_at', { ascending: false });

    setSubjects(subjectsData || []);
    setFaculties(sortFacultiesByCity(facultiesData || []));
    setQuestions(questionsData || []);
  };

  const loadCategories = async (subjectId: string) => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('subject_id', subjectId);
    
    setCategories(data || []);
  };

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
          faculty_id: validated.faculty_id,
          year: validated.year
        }]);

      if (error) throw error;

      toast({
        title: "Úspěch",
        description: "Otázka byla přidána"
      });

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
      faculty_id: '',
      year: new Date().getFullYear()
    });
    setValidationErrors({});
  };

  if (!isAdmin) {
    return null;
  }

  return (
    <SidebarProvider>
      <MobileNav />
      <div className="min-h-screen flex w-full">
        <AppSidebar isAdmin={true} />
        <main className="flex-1 p-8 bg-muted/50">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">Správa otázek</h1>
                <p className="text-muted-foreground">
                  Spravujte databázi otázek pro přijímací zkoušky
                </p>
              </div>
              
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Přidat otázku
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Přidat novou otázku</DialogTitle>
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
                      <Label>Rok</Label>
                      <Input
                        type="number"
                        value={formData.year}
                        onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                      />
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
                      {loading ? 'Přidávání...' : 'Přidat otázku'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Seznam otázek ({questions.length})</CardTitle>
                <CardDescription>
                  Všechny otázky v databázi
                </CardDescription>
              </CardHeader>
              <CardContent>
                {questions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>Zatím nebyly přidány žádné otázky</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {questions.map((q) => (
                      <Card key={q.id}>
                        <CardContent className="pt-6">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-semibold mb-2">{q.question_text}</p>
                              <div className="text-sm text-muted-foreground space-y-1">
                                <p>Předmět: {q.subjects?.name}</p>
                                <p>Kategorie: {q.categories?.name}</p>
                                <p>Fakulta: {q.faculties?.name}</p>
                                <p>Správné odpovědi: {q.correct_answers.join(', ')}</p>
                              </div>
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteQuestion(q.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
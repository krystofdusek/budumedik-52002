import { useState, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
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

export default function AdminQuestions() {
  const { toast } = useToast();
  const [questions, setQuestions] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

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
    loadData();
  }, []);

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
    setFaculties(facultiesData || []);
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

    try {
      const { error } = await supabase
        .from('questions')
        .insert([{
          question_text: formData.question_text,
          option_a: formData.option_a,
          option_b: formData.option_b,
          option_c: formData.option_c,
          option_d: formData.option_d,
          option_e: formData.option_e || null,
          correct_answers: formData.correct_answers,
          explanation: formData.explanation,
          subject_id: formData.subject_id,
          category_id: formData.category_id,
          faculty_id: formData.faculty_id,
          year: formData.year
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
      console.error('Error adding question:', error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se přidat otázku",
        variant: "destructive"
      });
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
  };

  return (
    <SidebarProvider>
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
                    </div>

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
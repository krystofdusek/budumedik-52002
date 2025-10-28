import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Flag, Heart } from "lucide-react";
import logo from "@/assets/logo.png";
import { MobileNav } from "@/components/MobileNav";

export default function Test() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { questions, testType, filters } = location.state || {};
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string[]>>({});
  const [showResults, setShowResults] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
  const [favoriteQuestions, setFavoriteQuestions] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);
  const [funFact, setFunFact] = useState<string>("");
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportCategory, setReportCategory] = useState<string>("");
  const [reportNote, setReportNote] = useState<string>("");

  const reportCategories = [
    { value: "wrong_answer", label: "Nesprávná odpověď" },
    { value: "wrong_question", label: "Chyba v zadání" },
    { value: "unclear", label: "Nejasná formulace" },
    { value: "outdated", label: "Zastaralé informace" },
    { value: "other", label: "Jiný důvod" },
  ];

  useEffect(() => {
    if (!questions || questions.length === 0) {
      navigate('/dashboard/tests');
    }
    loadUserData();
    loadRandomFunFact();
  }, [questions, navigate]);

  const loadRandomFunFact = async () => {
    try {
      const { data, error } = await supabase
        .from('fun_facts')
        .select('fact_text')
        .limit(100);
      
      if (!error && data && data.length > 0) {
        const randomFact = data[Math.floor(Math.random() * data.length)];
        setFunFact(randomFact.fact_text);
      }
    } catch (error) {
      console.error('Error loading fun fact:', error);
    }
  };

  const loadUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      const { data: favs } = await supabase
        .from("favorite_questions")
        .select("question_id")
        .eq("user_id", user.id);
      
      if (favs) {
        setFavoriteQuestions(new Set(favs.map(f => f.question_id)));
      }
    }
  };

  if (!questions || questions.length === 0) {
    return null;
  }

  const question = questions[currentQuestion];
  const isMultipleChoice = question.correct_answers?.length > 1;
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleAnswerChange = (option: string, checked: boolean = true) => {
    const current = answers[currentQuestion] || [];
    
    if (isMultipleChoice) {
      setAnswers({
        ...answers,
        [currentQuestion]: checked 
          ? [...current, option]
          : current.filter(a => a !== option)
      });
    } else {
      setAnswers({
        ...answers,
        [currentQuestion]: [option]
      });
    }
  };

  const handleAnswerSubmit = async () => {
    if (!userId || !question.id) return;
    
    const selectedAnswers = answers[currentQuestion] || [];
    if (selectedAnswers.length === 0) {
      toast({
        title: "Vyberte odpověď",
        description: "Před odesláním musíte vybrat alespoň jednu odpověď",
        variant: "destructive",
      });
      return;
    }

    const normalizedSelected = selectedAnswers.map(a => a.toLowerCase());
    const normalizedCorrect = question.correct_answers.map((a: string) => a.toLowerCase());
    const isCorrect = 
      normalizedSelected.length === normalizedCorrect.length &&
      normalizedSelected.every((ans) => normalizedCorrect.includes(ans));

    await supabase.from("user_answers").insert({
      user_id: userId,
      question_id: question.id,
      selected_answers: selectedAnswers,
      is_correct: isCorrect,
    });

    setAnsweredQuestions(new Set([...answeredQuestions, currentQuestion]));
    
    toast({
      title: isCorrect ? "Správně!" : "Špatně",
      description: isCorrect ? "Vaše odpověď je správná" : "Vaše odpověď není správná",
      variant: isCorrect ? "default" : "destructive",
    });
  };

  const toggleFavorite = async () => {
    if (!userId || !question.id) return;
    
    const isFavorite = favoriteQuestions.has(question.id);

    if (isFavorite) {
      await supabase.from("favorite_questions").delete()
        .eq("user_id", userId).eq("question_id", question.id);
      
      const newFavorites = new Set(favoriteQuestions);
      newFavorites.delete(question.id);
      setFavoriteQuestions(newFavorites);
      toast({ title: "Odebráno z oblíbených" });
    } else {
      await supabase.from("favorite_questions")
        .insert({ user_id: userId, question_id: question.id });
      
      setFavoriteQuestions(new Set([...favoriteQuestions, question.id]));
      toast({ title: "Přidáno do oblíbených" });
    }
  };

  const reportQuestion = async () => {
    if (!userId || !question.id) return;
    
    if (!reportCategory) {
      toast({ 
        title: "Chyba", 
        description: "Vyberte prosím kategorii nahlášení", 
        variant: "destructive" 
      });
      return;
    }
    
    const categoryLabel = reportCategories.find(c => c.value === reportCategory)?.label || reportCategory;
    const reason = reportNote 
      ? `${categoryLabel}: ${reportNote}` 
      : categoryLabel;
    
    const { error } = await supabase.from("question_reports").insert({
      user_id: userId,
      question_id: question.id,
      reason: reason,
    });

    if (error) {
      toast({ title: "Chyba", description: "Nepodařilo se nahlásit otázku", variant: "destructive" });
    } else {
      toast({ title: "Otázka nahlášena", description: "Děkujeme za nahlášení" });
      setReportDialogOpen(false);
      setReportCategory("");
      setReportNote("");
    }
  };

  const goToNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const goToPrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const submitTest = async () => {
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let correctCount = 0;
      const userAnswers = [];

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const userAnswer = answers[i] || [];
        const correctAnswer = q.correct_answers || [];
        
        const normalizedUserAnswer = userAnswer.map((a: string) => a.toLowerCase());
        const normalizedCorrectAnswer = correctAnswer.map((a: string) => a.toLowerCase());
        const isCorrect = 
          normalizedUserAnswer.length === normalizedCorrectAnswer.length &&
          normalizedUserAnswer.every((a: string) => normalizedCorrectAnswer.includes(a));

        if (isCorrect) correctCount++;

        if (q.id && !answeredQuestions.has(i)) {
          userAnswers.push({
            user_id: user.id,
            question_id: q.id,
            selected_answers: userAnswer,
            is_correct: isCorrect
          });
        }
      }

      if (userAnswers.length > 0) {
        await supabase.from('user_answers').insert(userAnswers);
      }

      await supabase.from('test_results').insert({
        user_id: user.id,
        test_type: testType,
        score: correctCount,
        total_questions: questions.length,
        subject_id: filters?.selectedSubject || null,
        category_id: filters?.selectedCategory || null,
        faculty_id: filters?.selectedFaculty || null
      });

      setShowResults(true);
      toast({
        title: "Test odevzdán",
        description: `Získali jste ${correctCount} z ${questions.length} bodů`,
      });
    } catch (error) {
      toast({ title: "Chyba", description: "Nepodařilo se odevzdat test", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q: any, i: number) => {
      const userAnswer = answers[i] || [];
      const correctAnswer = q.correct_answers || [];
      
      const normalizedUserAnswer = userAnswer.map((a: string) => a.toLowerCase());
      const normalizedCorrectAnswer = correctAnswer.map((a: string) => a.toLowerCase());
      
      if (
        normalizedUserAnswer.length === normalizedCorrectAnswer.length &&
        normalizedUserAnswer.every((a: string) => normalizedCorrectAnswer.includes(a))
      ) {
        correct++;
      }
    });
    return correct;
  };

  if (showResults) {
    const score = calculateScore();
    const percentage = Math.round((score / questions.length) * 100);

    return (
      <div className="min-h-screen bg-muted/50 p-8">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl text-center">Výsledky testu</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-6xl font-bold text-primary mb-2">
                  {percentage}%
                </div>
                <p className="text-xl text-muted-foreground">
                  {score} z {questions.length} správně
                </p>
              </div>

              <div className="space-y-4">
                {questions.map((q: any, i: number) => {
                  const userAnswer = answers[i] || [];
                  const correctAnswer = q.correct_answers || [];
                  const normalizedUserAnswer = userAnswer.map((a: string) => a.toLowerCase());
                  const normalizedCorrectAnswer = correctAnswer.map((a: string) => a.toLowerCase());
                  const isCorrect = 
                    normalizedUserAnswer.length === normalizedCorrectAnswer.length &&
                    normalizedUserAnswer.every((a: string) => normalizedCorrectAnswer.includes(a));

                  return (
                    <Card key={i} className={isCorrect ? "border-green-500" : "border-red-500"}>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Otázka {i + 1}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <p className="font-medium">{q.question_text}</p>
                        <div className="text-sm">
                          <p className="text-muted-foreground">
                            Vaše odpověď: {userAnswer.join(', ') || 'Nezodpovězeno'}
                          </p>
                          <p className="text-green-600">
                            Správná odpověď: {correctAnswer.join(', ')}
                          </p>
                          {q.explanation && (
                            <p className="mt-2 text-muted-foreground">
                              <strong>Vysvětlení:</strong> {q.explanation}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="flex gap-4">
                <Button 
                  onClick={() => navigate('/dashboard/test-generators')}
                  className="flex-1"
                >
                  Nový test
                </Button>
                <Button 
                  onClick={() => navigate('/dashboard/progress')}
                  variant="outline"
                  className="flex-1"
                >
                  Zobrazit pokrok
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/50 p-4 md:p-8 animate-fade-in">
      <div className="md:hidden mb-4 flex items-center justify-between">
        <MobileNav />
        <img 
          src={logo} 
          alt="Logo" 
          className="h-16 w-auto invert dark:invert-0" 
        />
      </div>
      <div className="max-w-4xl mx-auto space-y-6">
        {funFact && (
          <Card className="bg-primary/5 border-primary/20 animate-scale-in">
            <CardContent className="pt-6">
              <p className="text-sm font-medium text-primary flex items-start gap-2">
                <span className="text-lg">💡</span>
                <span><strong>Věděli jste, že?</strong> {funFact}</span>
              </p>
            </CardContent>
          </Card>
        )}
        <Card className="animate-scale-in">
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <CardTitle>Otázka {currentQuestion + 1} z {questions.length}</CardTitle>
              <div className="flex gap-2">
                {question.id && (
                  <>
                    <Button variant="outline" size="sm" onClick={toggleFavorite}>
                      <Heart className={`h-4 w-4 ${favoriteQuestions.has(question.id) ? 'fill-primary text-primary' : ''}`} />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setReportDialogOpen(true)}>
                      <Flag className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
            <Progress value={progress} className="h-2" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4">{question.question_text}</h3>
              
              {isMultipleChoice ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground mb-2">(Vyberte všechny správné odpovědi)</p>
                  {['A', 'B', 'C', 'D', question.option_e ? 'E' : null].filter(Boolean).map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        id={`option-${option}`}
                        checked={(answers[currentQuestion] || []).includes(option!)}
                        onCheckedChange={(checked) => handleAnswerChange(option!, checked as boolean)}
                      />
                      <Label htmlFor={`option-${option}`} className="text-base cursor-pointer flex-1 py-2">
                        {option}) {question[`option_${option!.toLowerCase()}`]}
                      </Label>
                    </div>
                  ))}
                </div>
              ) : (
                <RadioGroup value={(answers[currentQuestion] || [])[0] || ""} onValueChange={(value) => handleAnswerChange(value)}>
                  {['A', 'B', 'C', 'D', question.option_e ? 'E' : null].filter(Boolean).map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <RadioGroupItem value={option!} id={`option-${option}`} />
                      <Label htmlFor={`option-${option}`} className="text-base cursor-pointer flex-1 py-2">
                        {option}) {question[`option_${option!.toLowerCase()}`]}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </div>

            {answeredQuestions.has(currentQuestion) && question.explanation && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Vysvětlení:</p>
                <p className="text-sm">{question.explanation}</p>
              </div>
            )}

            <div className="flex justify-between items-center pt-4">
              <div className="flex gap-2">
                <Button variant="outline" onClick={goToPrevious} disabled={currentQuestion === 0}>
                  <ChevronLeft className="h-4 w-4 mr-2" />Předchozí
                </Button>
                {!answeredQuestions.has(currentQuestion) && question.id && (
                  <Button onClick={handleAnswerSubmit}>Odpovědět</Button>
                )}
              </div>

              {currentQuestion < questions.length - 1 ? (
                <Button onClick={goToNext}>
                  Další<ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={submitTest} disabled={submitting}>
                  {submitting ? 'Odevzdávání...' : 'Odevzdat test'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-2">
              {questions.map((_: any, i: number) => (
                <Button
                  key={i}
                  variant={i === currentQuestion ? "default" : answers[i] ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setCurrentQuestion(i)}
                  className="w-10 h-10"
                >
                  {i + 1}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Nahlásit otázku</DialogTitle>
              <DialogDescription>
                Pomozte nám zlepšit kvalitu otázek. Vyberte kategorii problému a případně přidejte poznámku.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="category">Kategorie nahlášení *</Label>
                <Select value={reportCategory} onValueChange={setReportCategory}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Vyberte kategorii" />
                  </SelectTrigger>
                  <SelectContent>
                    {reportCategories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="note">Poznámka (volitelné)</Label>
                <Textarea
                  id="note"
                  placeholder="Popište prosím problém..."
                  value={reportNote}
                  onChange={(e) => setReportNote(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
                Zrušit
              </Button>
              <Button onClick={reportQuestion} disabled={!reportCategory}>
                Odeslat nahlášení
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

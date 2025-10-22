import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Flag } from "lucide-react";

export default function Test() {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { questions, testType, filters } = location.state || {};
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string[]>>({});
  const [showResults, setShowResults] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!questions || questions.length === 0) {
      navigate('/dashboard/test-generators');
    }
  }, [questions, navigate]);

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
      
      if (!user) {
        throw new Error('Not authenticated');
      }

      let correctCount = 0;
      const userAnswers = [];

      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        const userAnswer = answers[i] || [];
        const correctAnswer = q.correct_answers || [];
        
        const isCorrect = 
          userAnswer.length === correctAnswer.length &&
          userAnswer.every((a: string) => correctAnswer.includes(a));

        if (isCorrect) correctCount++;

        // Only save answers for questions that are in the database (have an id)
        if (q.id) {
          userAnswers.push({
            user_id: user.id,
            question_id: q.id,
            selected_answers: userAnswer,
            is_correct: isCorrect
          });
        }
      }

      // Save user answers
      if (userAnswers.length > 0) {
        const { error: answersError } = await supabase
          .from('user_answers')
          .insert(userAnswers);

        if (answersError) throw answersError;
      }

      // Save test result
      const { error: resultError } = await supabase
        .from('test_results')
        .insert({
          user_id: user.id,
          test_type: testType,
          score: correctCount,
          total_questions: questions.length,
          subject_id: filters.selectedSubject,
          category_id: filters.selectedCategory || null,
          faculty_id: filters.selectedFaculty
        });

      if (resultError) throw resultError;

      setShowResults(true);
      toast({
        title: "Test odevzdán",
        description: `Získali jste ${correctCount} z ${questions.length} bodů (${Math.round((correctCount / questions.length) * 100)}%)`,
      });

    } catch (error) {
      console.error('Error submitting test:', error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se odevzdat test",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    questions.forEach((q: any, i: number) => {
      const userAnswer = answers[i] || [];
      const correctAnswer = q.correct_answers || [];
      
      if (
        userAnswer.length === correctAnswer.length &&
        userAnswer.every((a: string) => correctAnswer.includes(a))
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
                  const isCorrect = 
                    userAnswer.length === correctAnswer.length &&
                    userAnswer.every((a: string) => correctAnswer.includes(a));

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
    <div className="min-h-screen bg-muted/50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <CardTitle>
                Otázka {currentQuestion + 1} z {questions.length}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (confirm('Opravdu chcete nahlásit tuto otázku?')) {
                    toast({
                      title: "Otázka nahlášena",
                      description: "Děkujeme za zpětnou vazbu"
                    });
                  }
                }}
              >
                <Flag className="h-4 w-4 mr-2" />
                Nahlásit
              </Button>
            </div>
            <Progress value={progress} className="h-2" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4">{question.question_text}</h3>
              
              {isMultipleChoice ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground mb-2">
                    (Vyberte všechny správné odpovědi)
                  </p>
                  {['A', 'B', 'C', 'D', question.option_e ? 'E' : null].filter(Boolean).map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        id={`option-${option}`}
                        checked={(answers[currentQuestion] || []).includes(option!)}
                        onCheckedChange={(checked) => handleAnswerChange(option!, checked as boolean)}
                      />
                      <Label 
                        htmlFor={`option-${option}`}
                        className="text-base cursor-pointer flex-1 py-2"
                      >
                        {option}) {question[`option_${option!.toLowerCase()}`]}
                      </Label>
                    </div>
                  ))}
                </div>
              ) : (
                <RadioGroup
                  value={(answers[currentQuestion] || [])[0] || ""}
                  onValueChange={(value) => handleAnswerChange(value)}
                >
                  {['A', 'B', 'C', 'D', question.option_e ? 'E' : null].filter(Boolean).map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <RadioGroupItem value={option!} id={`option-${option}`} />
                      <Label 
                        htmlFor={`option-${option}`}
                        className="text-base cursor-pointer flex-1 py-2"
                      >
                        {option}) {question[`option_${option!.toLowerCase()}`]}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                variant="outline"
                onClick={goToPrevious}
                disabled={currentQuestion === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Předchozí
              </Button>
              
              {currentQuestion < questions.length - 1 ? (
                <Button onClick={goToNext} className="flex-1">
                  Další
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  onClick={submitTest} 
                  className="flex-1"
                  disabled={submitting}
                >
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
      </div>
    </div>
  );
}
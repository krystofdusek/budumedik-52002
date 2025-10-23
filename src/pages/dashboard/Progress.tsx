import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Target, Award, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

type SubjectStats = {
  subjectName: string;
  totalQuestions: number;
  correctAnswers: number;
  successRate: number;
};

type FacultyComparison = {
  yourSuccessRate: number;
  facultyAverage: number;
  subjectComparison: {
    subjectName: string;
    yourRate: number;
    facultyRate: number;
  }[];
};

export default function Progress() {
  const [stats, setStats] = useState({
    totalQuestions: 0,
    totalTests: 0,
    correctAnswers: 0,
    successRate: 0
  });
  const [subjectStats, setSubjectStats] = useState<SubjectStats[]>([]);
  const [facultyComparison, setFacultyComparison] = useState<FacultyComparison | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load user statistics
      const { data: userStats } = await supabase
        .from('user_statistics')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (userStats) {
        const successRate = userStats.total_questions_answered > 0
          ? (userStats.total_correct_answers / userStats.total_questions_answered) * 100
          : 0;

        setStats({
          totalQuestions: userStats.total_questions_answered,
          totalTests: userStats.total_tests_completed,
          correctAnswers: userStats.total_correct_answers,
          successRate: Math.round(successRate)
        });
      }

      // Load subject-specific stats
      const { data: answers } = await supabase
        .from('user_answers')
        .select(`
          is_correct,
          questions!inner(
            subject_id,
            subjects!inner(name)
          )
        `)
        .eq('user_id', user.id);

      if (answers) {
        const subjectMap: Record<string, { correct: number; total: number; name: string }> = {};
        
        answers.forEach((answer: any) => {
          const subjectId = answer.questions.subject_id;
          const subjectName = answer.questions.subjects.name;
          
          if (!subjectMap[subjectId]) {
            subjectMap[subjectId] = { correct: 0, total: 0, name: subjectName };
          }
          
          subjectMap[subjectId].total++;
          if (answer.is_correct) {
            subjectMap[subjectId].correct++;
          }
        });

        const subjectStatsData: SubjectStats[] = Object.values(subjectMap).map(stat => ({
          subjectName: stat.name,
          totalQuestions: stat.total,
          correctAnswers: stat.correct,
          successRate: stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0
        }));

        setSubjectStats(subjectStatsData);
      }

      // Load faculty comparison
      const { data: profile } = await supabase
        .from('profiles')
        .select('favorite_faculty_id')
        .eq('id', user.id)
        .single();

      if (profile?.favorite_faculty_id) {
        await loadFacultyComparison(user.id, profile.favorite_faculty_id);
      }

    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFacultyComparison = async (userId: string, facultyId: string) => {
    // Get all users with the same favorite faculty
    const { data: facultyUsers } = await supabase
      .from('profiles')
      .select('id')
      .eq('favorite_faculty_id', facultyId);

    if (!facultyUsers || facultyUsers.length === 0) return;

    const userIds = facultyUsers.map(u => u.id);

    // Get statistics for all faculty users
    const { data: facultyStats } = await supabase
      .from('user_statistics')
      .select('*')
      .in('user_id', userIds);

    if (!facultyStats) return;

    // Calculate faculty average
    const totalUsers = facultyStats.length;
    const facultyTotalCorrect = facultyStats.reduce((sum, s) => sum + s.total_correct_answers, 0);
    const facultyTotalQuestions = facultyStats.reduce((sum, s) => sum + s.total_questions_answered, 0);
    const facultyAverage = facultyTotalQuestions > 0 
      ? Math.round((facultyTotalCorrect / facultyTotalQuestions) * 100) 
      : 0;

    // Get user's success rate
    const userStat = facultyStats.find(s => s.user_id === userId);
    const yourSuccessRate = userStat && userStat.total_questions_answered > 0
      ? Math.round((userStat.total_correct_answers / userStat.total_questions_answered) * 100)
      : 0;

    // Calculate subject comparison
    const { data: allAnswers } = await supabase
      .from('user_answers')
      .select(`
        user_id,
        is_correct,
        questions!inner(
          subject_id,
          subjects!inner(name)
        )
      `)
      .in('user_id', userIds);

    if (allAnswers) {
      const subjectMap: Record<string, {
        name: string;
        userCorrect: number;
        userTotal: number;
        facultyCorrect: number;
        facultyTotal: number;
      }> = {};

      allAnswers.forEach((answer: any) => {
        const subjectId = answer.questions.subject_id;
        const subjectName = answer.questions.subjects.name;
        const isUser = answer.user_id === userId;

        if (!subjectMap[subjectId]) {
          subjectMap[subjectId] = {
            name: subjectName,
            userCorrect: 0,
            userTotal: 0,
            facultyCorrect: 0,
            facultyTotal: 0
          };
        }

        if (isUser) {
          subjectMap[subjectId].userTotal++;
          if (answer.is_correct) subjectMap[subjectId].userCorrect++;
        }
        
        subjectMap[subjectId].facultyTotal++;
        if (answer.is_correct) subjectMap[subjectId].facultyCorrect++;
      });

      const subjectComparison = Object.values(subjectMap).map(stat => ({
        subjectName: stat.name,
        yourRate: stat.userTotal > 0 ? Math.round((stat.userCorrect / stat.userTotal) * 100) : 0,
        facultyRate: stat.facultyTotal > 0 ? Math.round((stat.facultyCorrect / stat.facultyTotal) * 100) : 0
      }));

      setFacultyComparison({
        yourSuccessRate,
        facultyAverage,
        subjectComparison
      });
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-8 bg-muted/50">
          <div className="max-w-7xl mx-auto space-y-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Můj pokrok</h1>
              <p className="text-muted-foreground">
                Sledujte svůj pokrok a porovnejte se s ostatními studenty
              </p>
            </div>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Načítání...
              </div>
            ) : (
              <>
                <div className="grid md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-2xl">{stats.successRate}%</CardTitle>
                        <TrendingUp className="h-8 w-8 text-accent" />
                      </div>
                      <CardDescription>Celková úspěšnost</CardDescription>
                    </CardHeader>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-2xl">{stats.totalTests}</CardTitle>
                        <Target className="h-8 w-8 text-primary" />
                      </div>
                      <CardDescription>Dokončené testy</CardDescription>
                    </CardHeader>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-2xl">{stats.totalQuestions}</CardTitle>
                        <Award className="h-8 w-8 text-primary" />
                      </div>
                      <CardDescription>Zodpovězené otázky</CardDescription>
                    </CardHeader>
                  </Card>
                </div>

                {subjectStats.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Pokrok podle předmětů</CardTitle>
                      <CardDescription>
                        Vaše úspěšnost v jednotlivých předmětech
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {subjectStats.map((subject) => (
                        <div key={subject.subjectName}>
                          <div className="flex justify-between mb-2">
                            <span className="font-medium">{subject.subjectName}</span>
                            <span className="text-muted-foreground">
                              {subject.successRate}% ({subject.correctAnswers}/{subject.totalQuestions})
                            </span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary" 
                              style={{ width: `${subject.successRate}%` }} 
                            />
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {facultyComparison && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        <CardTitle>Porovnání s fakultou</CardTitle>
                      </div>
                      <CardDescription>
                        Jak si stojíte oproti ostatním studentům vaší fakulty
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                          <p className="text-sm text-muted-foreground mb-1">Vaše úspěšnost</p>
                          <p className="text-3xl font-bold text-primary">
                            {facultyComparison.yourSuccessRate}%
                          </p>
                        </div>
                        <div className="p-4 rounded-lg bg-muted">
                          <p className="text-sm text-muted-foreground mb-1">Průměr fakulty</p>
                          <p className="text-3xl font-bold">
                            {facultyComparison.facultyAverage}%
                          </p>
                        </div>
                      </div>

                      {facultyComparison.subjectComparison.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-4">Porovnání podle předmětů</h4>
                          <div className="space-y-4">
                            {facultyComparison.subjectComparison.map((subject) => (
                              <div key={subject.subjectName}>
                                <div className="flex justify-between mb-2">
                                  <span className="font-medium">{subject.subjectName}</span>
                                  <div className="flex gap-4 text-sm">
                                    <span className="text-primary">Vy: {subject.yourRate}%</span>
                                    <span className="text-muted-foreground">
                                      Průměr: {subject.facultyRate}%
                                    </span>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-primary" 
                                      style={{ width: `${subject.yourRate}%` }} 
                                    />
                                  </div>
                                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-muted-foreground" 
                                      style={{ width: `${subject.facultyRate}%` }} 
                                    />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

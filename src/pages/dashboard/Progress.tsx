import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileNav } from "@/components/MobileNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Target, Award, Users, Heart, Lock, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { UpgradeDialog } from "@/components/UpgradeDialog";
import { useQuery } from "@tanstack/react-query";
type SubjectStats = {
  subjectName: string;
  totalQuestions: number;
  correctAnswers: number;
  successRate: number;
  favoriteCount: number;
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
  const [userId, setUserId] = useState<string>("");
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);

  const { data: subscription } = useQuery({
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
    loadProgress();
  }, []);
  const loadProgress = async () => {
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) return;
      
      setUserId(user.id);

      // Load user statistics
      const {
        data: userStats
      } = await supabase.from('user_statistics').select('*').eq('user_id', user.id).single();
      if (userStats) {
        const successRate = userStats.total_questions_answered > 0 ? userStats.total_correct_answers / userStats.total_questions_answered * 100 : 0;
        setStats({
          totalQuestions: userStats.total_questions_answered,
          totalTests: userStats.total_tests_completed,
          correctAnswers: userStats.total_correct_answers,
          successRate: Math.round(successRate)
        });
      }

      // Load subject-specific stats
      const {
        data: answers
      } = await supabase.from('user_answers').select(`
          is_correct,
          questions!inner(
            id,
            subject_id,
            subjects!inner(name)
          )
        `).eq('user_id', user.id);

      // Load favorite questions
      const {
        data: favorites
      } = await supabase.from('favorite_questions').select(`
          question_id,
          questions!inner(
            subject_id,
            subjects!inner(name)
          )
        `).eq('user_id', user.id);
      if (answers) {
        const subjectMap: Record<string, {
          correct: number;
          total: number;
          name: string;
          favorites: number;
        }> = {};
        answers.forEach((answer: any) => {
          const subjectId = answer.questions.subject_id;
          const subjectName = answer.questions.subjects.name;
          if (!subjectMap[subjectId]) {
            subjectMap[subjectId] = {
              correct: 0,
              total: 0,
              name: subjectName,
              favorites: 0
            };
          }
          subjectMap[subjectId].total++;
          if (answer.is_correct) {
            subjectMap[subjectId].correct++;
          }
        });

        // Add favorite counts
        if (favorites) {
          favorites.forEach((fav: any) => {
            const subjectId = fav.questions.subject_id;
            const subjectName = fav.questions.subjects.name;
            if (!subjectMap[subjectId]) {
              subjectMap[subjectId] = {
                correct: 0,
                total: 0,
                name: subjectName,
                favorites: 0
              };
            }
            subjectMap[subjectId].favorites++;
          });
        }
        const subjectStatsData: SubjectStats[] = Object.values(subjectMap).map(stat => ({
          subjectName: stat.name,
          totalQuestions: stat.total,
          correctAnswers: stat.correct,
          successRate: stat.total > 0 ? Math.round(stat.correct / stat.total * 100) : 0,
          favoriteCount: stat.favorites
        }));
        setSubjectStats(subjectStatsData);
      }

      // Load faculty comparison
      const {
        data: profile
      } = await supabase.from('profiles').select('favorite_faculty_id').eq('id', user.id).single();
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
    try {
      const {
        data,
        error
      } = await supabase.rpc('get_faculty_comparison', {
        p_user_id: userId,
        p_faculty_id: facultyId
      });
      if (error) {
        console.error('Error loading faculty comparison:', error);
        return;
      }
      if (data && data.length > 0) {
        const result = data[0];
        const subjectComparisons = typeof result.subject_comparisons === 'string' ? JSON.parse(result.subject_comparisons) : result.subject_comparisons;
        setFacultyComparison({
          yourSuccessRate: result.your_success_rate || 0,
          facultyAverage: result.faculty_average || 0,
          subjectComparison: Array.isArray(subjectComparisons) ? subjectComparisons : []
        });
      }
    } catch (error) {
      console.error('Error in loadFacultyComparison:', error);
    }
  };
  const isPremium = subscription?.subscription_type === 'premium';

  return <SidebarProvider>
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
              <h1 className="text-4xl font-bold mb-2">Můj pokrok</h1>
              <p className="text-muted-foreground">
                Sledujte svůj pokrok a porovnejte se s ostatními studenty
              </p>
            </div>

            {loading ? <div className="text-center py-8 text-muted-foreground">
                Načítání...
              </div> : <>
                <div className="grid md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-2xl">{stats.successRate}%</CardTitle>
                        <TrendingUp className="h-8 w-8 text-primary" />
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

                {subjectStats.length > 0 && <>
                    <Card>
                      <CardHeader>
                        <CardTitle>Úspěšnost podle předmětů</CardTitle>
                        <CardDescription>
                          Graf úspěšnosti v jednotlivých předmětech
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                          <BarChart data={subjectStats}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="subjectName" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="successRate" fill="hsl(var(--primary))" name="Úspěšnost (%)" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    
                  </>}

                {isPremium ? (
                  facultyComparison && <Card>
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

                      {facultyComparison.subjectComparison.length > 0 && <div>
                          <h4 className="font-semibold mb-4">Porovnání podle předmětů</h4>
                          <div className="space-y-4">
                            {facultyComparison.subjectComparison.map(subject => <div key={subject.subjectName}>
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
                                    <div className="h-full bg-primary" style={{
                            width: `${subject.yourRate}%`
                          }} />
                                  </div>
                                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-muted-foreground" style={{
                            width: `${subject.facultyRate}%`
                          }} />
                                  </div>
                                </div>
                              </div>)}
                          </div>
                        </div>}
                    </CardContent>
                  </Card>
                ) : (
                  <Card 
                    className="opacity-75 cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setUpgradeDialogOpen(true)}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          <CardTitle>Porovnání s fakultou</CardTitle>
                        </div>
                        <Lock className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <CardDescription>
                        Premium funkce - Porovnejte se s ostatními studenty
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="relative overflow-hidden rounded-lg border bg-muted/50 p-8">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent" />
                        <div className="relative space-y-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Crown className="h-4 w-4" />
                            <span>Dostupné pouze pro Premium členy</span>
                          </div>
                          <ul className="space-y-2 text-sm text-muted-foreground">
                            <li>• Porovnání vaší úspěšnosti s průměrem fakulty</li>
                            <li>• Statistiky podle jednotlivých předmětů</li>
                            <li>• Identifikace slabých oblastí</li>
                            <li>• Sledování vašeho pokroku v čase</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>}
          </div>
        </main>
      </div>
    </SidebarProvider>;
}
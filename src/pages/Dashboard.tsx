import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileNav } from "@/components/MobileNav";
import logo from "@/assets/logo.png";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, FileText, TrendingUp, Crown, Calendar, Users, Sparkles, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { UpgradeDialog } from "@/components/UpgradeDialog";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

type FacultyComparison = {
  yourSuccessRate: number;
  facultyAverage: number;
  subjectComparison: {
    subjectName: string;
    yourRate: number;
    facultyRate: number;
  }[];
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [facultyComparison, setFacultyComparison] = useState<FacultyComparison | null>(null);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setUserId(user.id);

    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();
    
    setIsAdmin(!!roleData);

    // Load faculty comparison
    const { data: profile } = await supabase
      .from('profiles')
      .select('favorite_faculty_id')
      .eq('id', user.id)
      .single();
    
    if (profile?.favorite_faculty_id) {
      await loadFacultyComparison(user.id, profile.favorite_faculty_id);
    }
  };

  const loadFacultyComparison = async (userId: string, facultyId: string) => {
    try {
      const { data, error } = await supabase.rpc('get_faculty_comparison', {
        p_user_id: userId,
        p_faculty_id: facultyId
      });

      if (error) {
        console.error('Error loading faculty comparison:', error);
        return;
      }

      if (data && data.length > 0) {
        const result = data[0];
        const subjectComparisons = typeof result.subject_comparisons === 'string' 
          ? JSON.parse(result.subject_comparisons) 
          : result.subject_comparisons;
        
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

  const { data: statistics } = useQuery({
    queryKey: ["user-statistics", userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from("user_statistics")
        .select("*")
        .eq("user_id", userId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

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

  const successRate = statistics && statistics.total_questions_answered > 0
    ? Math.round((statistics.total_correct_answers / statistics.total_questions_answered) * 100)
    : 0;

  const isPremium = subscription?.subscription_type === 'premium';

  const getDaysUntilReset = () => {
    if (!subscription?.reset_date) return null;
    const resetDate = new Date(subscription.reset_date);
    const now = new Date();
    const diffTime = resetDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const getResetText = () => {
    const days = getDaysUntilReset();
    if (days === null) return "30 dní od prvního testu";
    return `${days} dní do resetu`;
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar isAdmin={isAdmin} />
        <main className="flex-1 p-4 md:p-8 bg-muted/50 animate-fade-in">
          <UpgradeDialog open={upgradeDialogOpen} onOpenChange={setUpgradeDialogOpen} />
          
          <div className="md:hidden mb-4 flex items-center justify-between">
            <MobileNav isAdmin={isAdmin} />
            <img 
              src={logo} 
              alt="Logo" 
              className="h-24 w-auto invert dark:invert-0" 
            />
          </div>
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="animate-scale-in">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-4xl font-bold">Dashboard</h1>
                {subscription && (
                  <Badge variant={subscription.subscription_type === 'premium' ? 'default' : 'secondary'}>
                    {subscription.subscription_type === 'premium' ? (
                      <>
                        <Crown className="h-3 w-3 mr-1" />
                        Premium
                      </>
                    ) : (
                      'Free'
                    )}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">
                Vítejte zpět! Připraveni na další test?
              </p>
            </div>

            {subscription?.subscription_type === 'free' && (
              <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-lg p-6 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-muted-foreground">Měsíční limit testů</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-primary">{subscription.tests_remaining}</span>
                      <span className="text-lg text-muted-foreground">/ 3</span>
                    </div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {getResetText()}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Calendar className="h-8 w-8 text-primary" />
                    </div>
                    {subscription.tests_remaining === 0 && (
                      <Badge variant="destructive" className="text-xs">Vyčerpáno</Badge>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="hover-scale transition-all">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl">
                      {statistics?.total_tests_completed || 0}
                    </CardTitle>
                    <Brain className="h-8 w-8 text-primary" />
                  </div>
                  <CardDescription>Dokončené testy</CardDescription>
                </CardHeader>
              </Card>

              <Card className="hover-scale transition-all">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl">{successRate}%</CardTitle>
                    <TrendingUp className="h-8 w-8 text-primary" />
                  </div>
                  <CardDescription>Průměrná úspěšnost</CardDescription>
                </CardHeader>
              </Card>

              <Card className="hover-scale transition-all">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl">
                      {statistics?.total_questions_answered || 0}
                    </CardTitle>
                    <FileText className="h-8 w-8 text-primary" />
                  </div>
                  <CardDescription>Zodpovězené otázky</CardDescription>
                </CardHeader>
              </Card>
            </div>

            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle>Rychlý start</CardTitle>
                <CardDescription>
                  Vyberte si typ testu a začněte trénovat
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Card 
                    className={`hover:shadow-lg transition-shadow cursor-pointer ${
                      subscription && subscription.subscription_type === 'free' && subscription.tests_remaining === 0
                        ? 'opacity-50' 
                        : ''
                    }`}
                    onClick={() => {
                      if (subscription && subscription.subscription_type === 'free' && subscription.tests_remaining === 0) {
                        setUpgradeDialogOpen(true);
                      } else {
                        navigate('/dashboard/tests');
                      }
                    }}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        {subscription && subscription.subscription_type === 'free' && subscription.tests_remaining === 0 && (
                          <Lock className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <CardTitle className="text-lg">Klasický test</CardTitle>
                      <CardDescription>
                        Test z databáze manuálně nahraných otázek
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  <Card 
                    className={`hover:shadow-lg transition-shadow border-primary cursor-pointer ${
                      subscription && subscription.subscription_type === 'free' && subscription.tests_remaining === 0
                        ? 'opacity-50' 
                        : ''
                    }`}
                    onClick={() => {
                      if (subscription && subscription.subscription_type === 'free' && subscription.tests_remaining === 0) {
                        setUpgradeDialogOpen(true);
                      } else {
                        navigate('/dashboard/tests');
                      }
                    }}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Sparkles className="h-5 w-5 text-primary" />
                        </div>
                        {subscription && subscription.subscription_type === 'free' && subscription.tests_remaining === 0 && (
                          <Lock className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <CardTitle className="text-lg">AI Personalizovaný test</CardTitle>
                      <CardDescription>
                        Inteligentně generované otázky přizpůsobené vám
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </div>
              </CardContent>
            </Card>

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

                  {facultyComparison.subjectComparison.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-4">Porovnání podle předmětů</h4>
                      <div className="space-y-4">
                        {facultyComparison.subjectComparison.map(subject => (
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
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

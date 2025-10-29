import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileNav } from "@/components/MobileNav";
import logo from "@/assets/logo.png";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, FileText, TrendingUp, Crown, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

export default function Dashboard() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

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
                <div className="text-center py-12 text-muted-foreground">
                  Generátory testů budou dostupné v sekci "Generátory testů"
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

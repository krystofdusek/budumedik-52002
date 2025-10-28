import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileNav } from "@/components/MobileNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import logo from "@/assets/logo.png";

type LeaderboardEntry = {
  rank: number;
  username: string;
  activityScore: number;
  questionsAnswered: number;
  testsCompleted: number;
  successRate: number;
};

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const { data: stats, error } = await supabase.rpc('get_leaderboard');

      if (error) throw error;

      if (stats) {
        const leaderboardData: LeaderboardEntry[] = stats.map((stat) => {
          const successRate = stat.total_questions_answered > 0 
            ? (stat.total_correct_answers / stat.total_questions_answered) * 100 
            : 0;
          
          // Generate anonymous username based on rank
          const username = stat.is_current_user ? "Vy" : `Student #${stat.rank}`;
          
          return {
            rank: stat.rank,
            username,
            activityScore: stat.activity_score,
            questionsAnswered: stat.total_questions_answered,
            testsCompleted: stat.total_tests_completed,
            successRate: Math.round(successRate)
          };
        });

        setLeaderboard(leaderboardData);

        // Find current user's rank
        const currentUser = stats.find(s => s.is_current_user);
        if (currentUser) {
          setCurrentUserRank(Number(currentUser.rank));
        }
      }
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Award className="h-6 w-6 text-amber-600" />;
    return null;
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-3 sm:p-4 md:p-8 bg-muted/50">
          <div className="md:hidden mb-4 flex items-center justify-between">
            <MobileNav />
            <img 
              src={logo} 
              alt="Logo" 
              className="h-12 w-auto invert dark:invert-0" 
            />
          </div>
          <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 md:space-y-8">
            <div className="px-1">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Žebříček nejaktivnějších</h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Soutěžte s ostatními studenty a sledujte svůj pokrok
              </p>
            </div>

            {currentUserRank && (
              <Card className="border-primary">
                <CardHeader>
                  <CardTitle>Vaše pozice</CardTitle>
                  <CardDescription>
                    Aktuálně jste na {currentUserRank}. místě
                  </CardDescription>
                </CardHeader>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Top studenti</CardTitle>
                <CardDescription>
                  Body se počítají podle počtu zodpovězených otázek, dokončených testů a úspěšnosti
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Načítání...
                  </div>
                ) : leaderboard.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Zatím žádní uživatelé v žebříčku
                  </div>
                ) : (
                  <div className="space-y-4">
                     {leaderboard.map((entry) => (
                       <div
                         key={entry.rank}
                         className={`flex items-center justify-between p-3 sm:p-4 rounded-lg border ${
                           entry.username === "Vy" 
                             ? "bg-primary/5 border-primary" 
                             : "bg-card"
                         }`}
                       >
                         <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-1 min-w-0">
                           <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-muted flex-shrink-0">
                             {getRankIcon(entry.rank) || (
                               <span className="font-bold text-base sm:text-lg">{entry.rank}</span>
                             )}
                           </div>
                           <div className="min-w-0 flex-1">
                             <p className="font-semibold text-sm sm:text-base truncate">{entry.username}</p>
                             <div className="flex flex-wrap gap-1 sm:gap-2 md:gap-4 text-xs sm:text-sm text-muted-foreground mt-1">
                               <span className="whitespace-nowrap">{entry.questionsAnswered} otázek</span>
                               <span className="hidden sm:inline">•</span>
                               <span className="whitespace-nowrap">{entry.testsCompleted} testů</span>
                               <span className="hidden sm:inline">•</span>
                               <span className="whitespace-nowrap">{entry.successRate}%</span>
                             </div>
                           </div>
                         </div>
                         <div className="text-right flex-shrink-0 ml-2">
                           <p className="text-lg sm:text-xl md:text-2xl font-bold text-primary">
                             {entry.activityScore}
                           </p>
                           <p className="text-xs sm:text-sm text-muted-foreground">bodů</p>
                         </div>
                       </div>
                     ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Jak se počítají body?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  • Každá zodpovězená otázka = 1 bod
                </p>
                <p className="text-sm text-muted-foreground">
                  • Každý dokončený test = 10 bodů
                </p>
                <p className="text-sm text-muted-foreground">
                  • Úspěšnost v % × 2 = bonus body
                </p>
                <p className="text-sm text-muted-foreground mt-4">
                  Systém bodování odměňuje jak aktivitu, tak úspěšnost, aby nemohl být zneužit.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileNav } from "@/components/MobileNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "@/components/ThemeProvider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Loader2, Trash2, Crown, Calendar } from "lucide-react";
import logo from "@/assets/logo.png";
import { sortFacultiesByCity } from "@/lib/facultySort";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function Settings() {
  const { theme } = useTheme();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [faculties, setFaculties] = useState<any[]>([]);
  const [selectedFaculty, setSelectedFaculty] = useState<string>("");
  const [userId, setUserId] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

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
    loadData();
  }, []);

  const loadData = async () => {
    // Load faculties for the dropdown regardless of auth
    const { data: facultiesData, error: facErr } = await supabase.from('faculties').select('*');
    if (!facErr) setFaculties(sortFacultiesByCity(facultiesData || []));

    // Then try to load the current user to preselect favorite faculty
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return; // User might not be logged in in preview/screenshot mode

    setUserId(user.id);

    // Check admin status
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();
    
    setIsAdmin(!!roleData);

    const { data: profile } = await supabase
      .from('profiles')
      .select('favorite_faculty_id')
      .eq('id', user.id)
      .single();
    
    if (profile?.favorite_faculty_id) {
      setSelectedFaculty(profile.favorite_faculty_id);
    }
  };

  const handlePasswordChange = async () => {
    if (!newPassword || !confirmPassword) {
      toast({
        title: "Chyba",
        description: "Vyplňte prosím obě pole",
        variant: "destructive"
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Chyba",
        description: "Hesla se neshodují",
        variant: "destructive"
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Chyba",
        description: "Heslo musí mít alespoň 6 znaků",
        variant: "destructive"
      });
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: "Úspěch",
        description: "Heslo bylo změněno"
      });
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se změnit heslo",
        variant: "destructive"
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleResetStatistics = async () => {
    if (!userId) return;

    setResetLoading(true);
    try {
      // Delete all user data including statistics, answers, test results, and favorites
      await Promise.all([
        supabase.from('user_statistics').delete().eq('user_id', userId),
        supabase.from('user_answers').delete().eq('user_id', userId),
        supabase.from('test_results').delete().eq('user_id', userId),
        supabase.from('favorite_questions').delete().eq('user_id', userId),
      ]);

      toast({
        title: "Úspěch",
        description: "Vaše statistiky a historie byly kompletně resetovány"
      });
      
      // Reload data to reflect changes
      await loadData();
    } catch (error) {
      console.error('Error resetting statistics:', error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se resetovat data",
        variant: "destructive"
      });
    } finally {
      setResetLoading(false);
    }
  };

  const saveFavoriteFaculty = async () => {
    if (!selectedFaculty) {
      toast({
        title: "Chyba",
        description: "Vyberte prosím fakultu",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ favorite_faculty_id: selectedFaculty })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: "Uloženo",
        description: "Oblíbená fakulta byla uložena"
      });
    } catch (error) {
      console.error('Error saving faculty:', error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se uložit fakultu",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

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
    return `Reset za ${days} dní`;
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar isAdmin={isAdmin} />
        <main className="flex-1 p-4 md:p-8 bg-muted/50">
          <div className="md:hidden mb-4 flex items-center justify-between">
            <MobileNav isAdmin={isAdmin} />
            <img 
              src={logo} 
              alt="Logo" 
              className="h-24 w-auto invert dark:invert-0" 
            />
          </div>
          <div className="max-w-4xl mx-auto space-y-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Nastavení</h1>
              <p className="text-muted-foreground">
                Upravte si aplikaci podle svých preferencí
              </p>
            </div>

            {subscription && (
              <Card className="animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    Členství
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
                  </CardTitle>
                  <CardDescription>
                    Informace o vašem členství
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {subscription.subscription_type === 'free' && (
                    <>
                      <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5 text-primary" />
                          <div>
                            <div className="font-medium">Zbývající testy</div>
                            <div className="text-sm text-muted-foreground">
                              {subscription.tests_remaining} z 3 testů zdarma
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{subscription.tests_remaining}</div>
                          <div className="text-xs text-muted-foreground">
                            {getResetText()}
                          </div>
                        </div>
                      </div>
                      <Button 
                        className="w-full" 
                        size="lg"
                        onClick={() => {
                          toast({
                            title: "Připravujeme platební bránu",
                            description: "Platební systém bude brzy dostupný",
                          });
                        }}
                      >
                        <Crown className="mr-2 h-4 w-4" />
                        Upgrade na Premium
                      </Button>
                    </>
                  )}
                  {subscription.subscription_type === 'premium' && (
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/10">
                      <Crown className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium">Premium aktivní</div>
                        <div className="text-sm text-muted-foreground">
                          Máte přístup ke všem funkcím
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Oblíbená fakulta</CardTitle>
                <CardDescription>
                  Nastavte si oblíbenou fakultu pro personalizované testy a porovnání
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Vyberte fakultu
                    </label>
                    <Select value={selectedFaculty} onValueChange={setSelectedFaculty}>
                      <SelectTrigger>
                        <SelectValue placeholder="Vyberte fakultu" />
                      </SelectTrigger>
                      <SelectContent>
                        {faculties.map(faculty => (
                          <SelectItem key={faculty.id} value={faculty.id}>
                            {faculty.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={saveFavoriteFaculty} disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Ukládání...
                      </>
                    ) : (
                      'Uložit'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Vzhled</CardTitle>
                <CardDescription>
                  Přizpůsobte si vzhled aplikace
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Barevný režim</p>
                    <p className="text-sm text-muted-foreground">
                      Aktuální: {theme === "light" ? "Světlý" : "Tmavý"}
                    </p>
                  </div>
                  <ThemeToggle />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notifikace</CardTitle>
                <CardDescription>
                  Spravujte vaše notifikace
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Emailové notifikace</p>
                    <p className="text-sm text-muted-foreground">
                      Posílejte mi aktualizace o mém pokroku
                    </p>
                  </div>
                  <Button variant="outline">Zapnout</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="animate-fade-in">
              <CardHeader>
                <CardTitle>Účet</CardTitle>
                <CardDescription>
                  Spravujte svůj účet
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <p className="font-medium mb-4">Změnit heslo</p>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="new-password">Nové heslo</Label>
                        <Input
                          id="new-password"
                          type="password"
                          placeholder="Zadejte nové heslo"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Potvrdit heslo</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          placeholder="Potvrďte nové heslo"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                      </div>
                      <Button onClick={handlePasswordChange} disabled={passwordLoading}>
                        {passwordLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Měním heslo...
                          </>
                        ) : (
                          'Změnit heslo'
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <p className="font-medium">Resetovat statistiky</p>
                    <p className="text-sm text-muted-foreground">
                      Smazat veškerý pokrok, historii a statistiky
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Resetovat
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Opravdu chcete resetovat statistiky?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tato akce je nevratná. Smažou se všechny vaše odpovědi, výsledky testů a statistiky.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Zrušit</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleResetStatistics}
                          disabled={resetLoading}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {resetLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Resetuji...
                            </>
                          ) : (
                            'Resetovat vše'
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

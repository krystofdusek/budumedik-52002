import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileNav } from "@/components/MobileNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Loader2, Crown, Users, Calendar } from "lucide-react";
import logo from "@/assets/logo.png";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface UserWithSubscription {
  id: string;
  email: string;
  subscription_type: 'free' | 'premium';
  tests_remaining: number;
  reset_date: string;
  premium_until: string | null;
}

export default function AdminUsers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingPremiumDate, setEditingPremiumDate] = useState<{userId: string, date: string} | null>(null);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    setIsAdmin(!!data);
  };

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      // First get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email');
      
      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      // Then fetch all subscriptions
      const { data: subscriptions, error: subsError } = await supabase
        .from('user_subscriptions')
        .select('*');

      if (subsError) {
        console.error('Error fetching subscriptions:', subsError);
        throw subsError;
      }

      // Map them together
      const usersWithSubscriptions: UserWithSubscription[] = (profiles || []).map(profile => {
        const subscription = subscriptions?.find(s => s.user_id === profile.id);

        return {
          id: profile.id,
          email: profile.email,
          subscription_type: subscription?.subscription_type || 'free',
          tests_remaining: subscription?.tests_remaining ?? 0,
          reset_date: subscription?.reset_date || '',
          premium_until: subscription?.premium_until || null,
        };
      });

      return usersWithSubscriptions;
    },
    enabled: isAdmin,
  });

  const updateSubscriptionMutation = useMutation({
    mutationFn: async ({ userId, subscriptionType, testsRemaining, premiumUntil }: { 
      userId: string; 
      subscriptionType: 'free' | 'premium';
      testsRemaining?: number;
      premiumUntil?: string | null;
    }) => {
      const updateData: any = { 
        subscription_type: subscriptionType,
      };

      // For premium users, set unlimited tests; for free users, reset to 3 or use provided value
      if (subscriptionType === 'premium') {
        updateData.tests_remaining = 999999;
        updateData.reset_date = null;
        // If premiumUntil is provided, use it; otherwise keep existing or set to null
        if (premiumUntil !== undefined) {
          updateData.premium_until = premiumUntil;
        }
      } else {
        // When switching to free, clear premium_until
        updateData.premium_until = null;
        if (testsRemaining !== undefined) {
          updateData.tests_remaining = testsRemaining;
        } else {
          updateData.tests_remaining = 3;
        }
      }

      const { error } = await supabase
        .from('user_subscriptions')
        .update(updateData)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: "Úspěch",
        description: "Členství bylo změněno",
      });
    },
    onError: (error) => {
      console.error('Error updating subscription:', error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se změnit členství",
        variant: "destructive",
      });
    },
  });

  const getDaysUntilReset = (resetDate: string) => {
    if (!resetDate) return null;
    const reset = new Date(resetDate);
    const now = new Date();
    const diffTime = reset.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const updateTestsMutation = useMutation({
    mutationFn: async ({ userId, testsRemaining }: { userId: string; testsRemaining: number }) => {
      const updateData: any = { 
        tests_remaining: testsRemaining,
      };

      // If setting from 3, clear reset_date (will be set on first test)
      if (testsRemaining === 3) {
        updateData.reset_date = null;
      }

      const { error } = await supabase
        .from('user_subscriptions')
        .update(updateData)
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({
        title: "Úspěch",
        description: "Počet testů byl změněn",
      });
    },
    onError: (error) => {
      console.error('Error updating tests:', error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se změnit počet testů",
        variant: "destructive",
      });
    },
  });

  const updatePremiumDateMutation = useMutation({
    mutationFn: async ({ userId, premiumUntil }: { userId: string; premiumUntil: string }) => {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ premium_until: premiumUntil })
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setEditingPremiumDate(null);
      toast({
        title: "Úspěch",
        description: "Datum premium členství bylo nastaveno",
      });
    },
    onError: (error) => {
      console.error('Error updating premium date:', error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se nastavit datum",
        variant: "destructive",
      });
    },
  });

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
          <div className="max-w-7xl mx-auto space-y-8">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-2">
                <Users className="h-8 w-8" />
                Správa uživatelů
              </h1>
              <p className="text-muted-foreground">
                Spravujte členství všech uživatelů
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Uživatelé a jejich členství</CardTitle>
                <CardDescription>
                  Změňte typ členství kteréhokoliv uživatele
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Členství</TableHead>
                          <TableHead>Premium do</TableHead>
                          <TableHead>Zbývající testy</TableHead>
                          <TableHead>Reset za</TableHead>
                          <TableHead>Změnit členství</TableHead>
                          <TableHead>Upravit testy</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users?.map((user) => {
                          const daysUntilReset = getDaysUntilReset(user.reset_date);
                          const isEditingDate = editingPremiumDate?.userId === user.id;
                          
                          return (
                            <TableRow key={user.id}>
                              <TableCell className="font-medium">{user.email}</TableCell>
                              <TableCell>
                                <Badge variant={user.subscription_type === 'premium' ? 'default' : 'secondary'}>
                                  {user.subscription_type === 'premium' ? (
                                    <>
                                      <Crown className="h-3 w-3 mr-1" />
                                      Premium
                                    </>
                                  ) : (
                                    'Free'
                                  )}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {user.subscription_type === 'premium' ? (
                                  <div className="space-y-2">
                                    {isEditingDate ? (
                                      <div className="flex gap-2 items-center">
                                        <Input
                                          type="date"
                                          value={editingPremiumDate.date}
                                          onChange={(e) => setEditingPremiumDate({ userId: user.id, date: e.target.value })}
                                          className="w-40"
                                          min={format(new Date(), 'yyyy-MM-dd')}
                                        />
                                        <Button
                                          size="sm"
                                          onClick={() => {
                                            if (editingPremiumDate.date) {
                                              updatePremiumDateMutation.mutate({
                                                userId: user.id,
                                                premiumUntil: new Date(editingPremiumDate.date).toISOString()
                                              });
                                            }
                                          }}
                                          disabled={updatePremiumDateMutation.isPending}
                                        >
                                          {updatePremiumDateMutation.isPending ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                          ) : (
                                            'Uložit'
                                          )}
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => setEditingPremiumDate(null)}
                                        >
                                          Zrušit
                                        </Button>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        {user.premium_until ? (
                                          <>
                                            <span className="text-sm">
                                              {format(new Date(user.premium_until), 'dd.MM.yyyy')}
                                            </span>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              onClick={() => setEditingPremiumDate({
                                                userId: user.id,
                                                date: format(new Date(user.premium_until!), 'yyyy-MM-dd')
                                              })}
                                            >
                                              <Calendar className="h-4 w-4" />
                                            </Button>
                                          </>
                                        ) : (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setEditingPremiumDate({
                                              userId: user.id,
                                              date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
                                            })}
                                          >
                                            <Calendar className="h-4 w-4 mr-1" />
                                            Nastavit datum
                                          </Button>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  '-'
                                )}
                              </TableCell>
                              <TableCell>
                                {user.subscription_type === 'free' ? user.tests_remaining : '∞'}
                              </TableCell>
                              <TableCell>
                                {user.subscription_type === 'free' 
                                  ? (daysUntilReset !== null ? `${daysUntilReset} dní` : '30 dní od 1. testu') 
                                  : '-'}
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={user.subscription_type}
                                  onValueChange={(value: 'free' | 'premium') => 
                                    updateSubscriptionMutation.mutate({ userId: user.id, subscriptionType: value })
                                  }
                                  disabled={updateSubscriptionMutation.isPending}
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="free">Free</SelectItem>
                                    <SelectItem value="premium">Premium</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                {user.subscription_type === 'free' && (
                                  <Select
                                    value={user.tests_remaining.toString()}
                                    onValueChange={(value) => 
                                      updateTestsMutation.mutate({ userId: user.id, testsRemaining: parseInt(value) })
                                    }
                                    disabled={updateTestsMutation.isPending}
                                  >
                                    <SelectTrigger className="w-20">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="0">0</SelectItem>
                                      <SelectItem value="1">1</SelectItem>
                                      <SelectItem value="2">2</SelectItem>
                                      <SelectItem value="3">3</SelectItem>
                                    </SelectContent>
                                  </Select>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
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

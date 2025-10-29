import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileNav } from "@/components/MobileNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { Loader2, Crown, Users } from "lucide-react";
import logo from "@/assets/logo.png";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
}

export default function AdminUsers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAdmin, setIsAdmin] = useState(false);

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
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email');
      
      if (profilesError) throw profilesError;

      const usersWithSubscriptions: UserWithSubscription[] = [];
      
      for (const profile of profiles || []) {
        const { data: subscription } = await supabase
          .from('user_subscriptions')
          .select('*')
          .eq('user_id', profile.id)
          .single();

        usersWithSubscriptions.push({
          id: profile.id,
          email: profile.email,
          subscription_type: subscription?.subscription_type || 'free',
          tests_remaining: subscription?.tests_remaining || 0,
          reset_date: subscription?.reset_date || '',
        });
      }

      return usersWithSubscriptions;
    },
    enabled: isAdmin,
  });

  const updateSubscriptionMutation = useMutation({
    mutationFn: async ({ userId, subscriptionType }: { userId: string; subscriptionType: 'free' | 'premium' }) => {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({ 
          subscription_type: subscriptionType,
          tests_remaining: subscriptionType === 'premium' ? 999999 : 3
        })
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
    if (!resetDate) return 0;
    const reset = new Date(resetDate);
    const now = new Date();
    const diffTime = reset.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
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
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Členství</TableHead>
                        <TableHead>Zbývající testy</TableHead>
                        <TableHead>Reset za</TableHead>
                        <TableHead>Akce</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users?.map((user) => (
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
                            {user.subscription_type === 'free' ? user.tests_remaining : '∞'}
                          </TableCell>
                          <TableCell>
                            {user.subscription_type === 'free' ? `${getDaysUntilReset(user.reset_date)} dní` : '-'}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={user.subscription_type}
                              onValueChange={(value: 'free' | 'premium') => 
                                updateSubscriptionMutation.mutate({ userId: user.id, subscriptionType: value })
                              }
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
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileNav } from "@/components/MobileNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Loader2, Crown, Users, Calendar, Trash2 } from "lucide-react";
import logo from "@/assets/logo.png";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useAdmin } from "@/hooks/useAdmin";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  name: string | null;
  subscription_type: 'free' | 'premium';
  tests_remaining: number;
  premium_until: string | null;
}

export default function AdminUsers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdmin } = useAdmin();
  const [editingPremiumDate, setEditingPremiumDate] = useState<{userId: string, date: string} | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<{id: string, email: string} | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithSubscription | null>(null);

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      // First get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, name');
      
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
          name: profile.name,
          subscription_type: subscription?.subscription_type || 'free',
          tests_remaining: subscription?.tests_remaining ?? 0,
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

  // Filter users based on search query
  const filteredUsers = users?.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (error) throw error;
      if (!data?.success) throw new Error('Failed to delete user');
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      toast({
        title: "Úspěch",
        description: "Uživatel byl smazán",
      });
    },
    onError: (error: any) => {
      console.error('Error deleting user:', error);
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se smazat uživatele",
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
                <div className="mb-4">
                  <Input
                    placeholder="Hledat podle jména nebo emailu..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-sm"
                  />
                </div>
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : !filteredUsers || filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchQuery ? 'Žádní uživatelé nenalezeni' : 'Zatím žádní uživatelé'}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Jméno</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Členství</TableHead>
                          <TableHead>Akce</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers?.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.name || '-'}</TableCell>
                            <TableCell>{user.email}</TableCell>
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
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingUser(user);
                                    setEditDialogOpen(true);
                                  }}
                                >
                                  Upravit
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => {
                                    setUserToDelete({ id: user.id, email: user.email });
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Edit User Dialog */}
            <AlertDialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Upravit uživatele</AlertDialogTitle>
                  <AlertDialogDescription>
                    {editingUser?.email}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                {editingUser && (
                  <div className="space-y-4 py-4">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Typ členství</Label>
                      <Select
                        value={editingUser.subscription_type}
                        onValueChange={(value: 'free' | 'premium') => {
                          setEditingUser({
                            ...editingUser,
                            subscription_type: value,
                            tests_remaining: value === 'premium' ? 999999 : editingUser.tests_remaining
                          });
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="premium">Premium</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {editingUser.subscription_type === 'premium' && (
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Premium do</Label>
                        <Input
                          type="date"
                          value={editingUser.premium_until ? format(new Date(editingUser.premium_until), 'yyyy-MM-dd') : ''}
                          onChange={(e) => setEditingUser({
                            ...editingUser,
                            premium_until: e.target.value ? new Date(e.target.value).toISOString() : null
                          })}
                          min={format(new Date(), 'yyyy-MM-dd')}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Nechte prázdné pro neomezené premium
                        </p>
                      </div>
                    )}

                    {editingUser.subscription_type === 'free' && (
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Zbývající testy</Label>
                        <Input
                          type="number"
                          min="0"
                          max="999"
                          value={editingUser.tests_remaining}
                          onChange={(e) => setEditingUser({
                            ...editingUser,
                            tests_remaining: parseInt(e.target.value) || 0
                          })}
                        />
                      </div>
                    )}
                  </div>
                )}
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => {
                    setEditDialogOpen(false);
                    setEditingUser(null);
                  }}>
                    Zrušit
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      if (editingUser) {
                        updateSubscriptionMutation.mutate({
                          userId: editingUser.id,
                          subscriptionType: editingUser.subscription_type,
                          testsRemaining: editingUser.tests_remaining,
                          premiumUntil: editingUser.premium_until
                        });
                        setEditDialogOpen(false);
                        setEditingUser(null);
                      }
                    }}
                  >
                    Uložit změny
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Opravdu chcete smazat tento účet?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tato akce je nevratná. Účet {userToDelete?.email} bude trvale smazán včetně všech jeho dat.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setUserToDelete(null)}>
                    Zrušit
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      if (userToDelete) {
                        deleteUserMutation.mutate(userToDelete.id);
                      }
                    }}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    {deleteUserMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Smazat účet'
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

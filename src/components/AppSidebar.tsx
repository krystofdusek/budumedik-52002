import { Home, FileText, BarChart3, Settings, Shield, LogOut, Trophy, History, Upload, MessageCircle, Newspaper } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "./ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdmin } from "@/hooks/useAdmin";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Generátory testů", url: "/dashboard/tests", icon: FileText },
  { title: "Můj pokrok", url: "/dashboard/progress", icon: BarChart3 },
  { title: "Žebříček", url: "/dashboard/leaderboard", icon: Trophy },
  { title: "Historie", url: "/dashboard/history", icon: History },
  { title: "Nastavení", url: "/dashboard/settings", icon: Settings },
];

const adminItems = [
  { title: "Správa otázek", url: "/admin/questions", icon: Shield },
  { title: "Nahlášené otázky", url: "/admin/reported", icon: FileText },
  { title: "Správa uživatelů", url: "/admin/users", icon: Upload },
  { title: "Správa blogu", url: "/admin/blog", icon: Newspaper },
];

export function AppSidebar({ isAdmin: isAdminProp }: { isAdmin?: boolean } = {}) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin: isAdminFromHook, loading: isLoadingAdmin } = useAdmin();
  const [isPremium, setIsPremium] = useState(false);

  // Use prop if provided, otherwise use hook
  const isAdmin = isAdminProp !== undefined ? isAdminProp : isAdminFromHook;
  const isLoading = isAdminProp !== undefined ? false : isLoadingAdmin;

  useEffect(() => {
    checkPremiumStatus();
  }, []);

  const checkPremiumStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('user_subscriptions')
      .select('subscription_type')
      .eq('user_id', user.id)
      .single();

    setIsPremium(data?.subscription_type === 'premium');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Odhlášení",
      description: "Byli jste úspěšně odhlášeni",
    });
    navigate("/auth");
  };

  return (
    <Sidebar className="border-r border-border hidden md:flex">
      <SidebarHeader className="border-b border-border p-4">
        <div className="flex items-center justify-center">
          <img 
            src={logo} 
            alt="Logo" 
            className="h-32 w-auto invert dark:invert-0 transition-transform hover:scale-105" 
          />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-blue-500/20"
                          : ""
                      }
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isLoading ? (
          <SidebarGroup>
            <SidebarGroupLabel>
              <Skeleton className="h-4 w-16" />
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="space-y-2 px-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : isAdmin ? (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        className={({ isActive }) =>
                          isActive
                            ? "bg-blue-500/20"
                            : ""
                        }
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}

        {isPremium && (
          <SidebarGroup>
            <SidebarGroupLabel>Komunita</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={(e) => {
                      e.preventDefault();
                      window.open('https://discord.gg/ZnvARNdzM6', '_blank', 'noopener,noreferrer');
                    }}
                  >
                    <MessageCircle className="mr-2 h-4 w-4" />
                    <span>Discord Server</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <div className="px-2 py-2">
                  <ThemeToggle />
                </div>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Odhlásit se</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

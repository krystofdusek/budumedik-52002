import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Menu, X, Home, FileText, BarChart3, Settings, Trophy, History, LogOut, Shield, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo.png";

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
];

interface MobileNavProps {
  isAdmin?: boolean;
}

export function MobileNav({ isAdmin = false }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Odhlášení",
      description: "Byli jste úspěšně odhlášeni",
    });
    navigate("/auth");
    setIsOpen(false);
  };

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative z-50"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 animate-fade-in"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed top-0 left-0 h-full w-64 bg-background border-r border-border z-40 animate-slide-in-right shadow-lg">
            <div className="p-4 border-b border-border">
              <img 
                src={logo} 
                alt="Logo" 
                className="h-28 w-auto mx-auto invert dark:invert-0" 
              />
            </div>

            <nav className="p-4 space-y-2">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground px-3 mb-2">MENU</p>
                {items.map((item) => (
                  <NavLink
                    key={item.title}
                    to={item.url}
                    end={item.url === "/dashboard"}
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                        isActive
                          ? "bg-blue-500/20"
                          : "hover:bg-muted"
                      }`
                    }
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </NavLink>
                ))}
              </div>

              {isAdmin && (
                <div className="space-y-1 pt-4 border-t border-border">
                  <p className="text-xs font-semibold text-muted-foreground px-3 mb-2">ADMIN</p>
                  {adminItems.map((item) => (
                    <NavLink
                      key={item.title}
                      to={item.url}
                      onClick={() => setIsOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                          isActive
                            ? "bg-blue-500/20"
                            : "hover:bg-muted"
                        }`
                      }
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </NavLink>
                  ))}
                </div>
              )}

              <div className="pt-4 border-t border-border space-y-2">
                <div className="px-3 py-2">
                  <ThemeToggle />
                </div>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={handleLogout}
                >
                  <LogOut className="mr-2 h-5 w-5" />
                  Odhlásit se
                </Button>
              </div>
            </nav>
          </div>
        </>
      )}
    </div>
  );
}

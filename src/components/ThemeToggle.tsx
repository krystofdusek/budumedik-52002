import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative h-14 w-28 rounded-full bg-gradient-to-r from-primary/20 to-primary/10 border-2 border-primary/30 p-1 transition-all duration-500 hover:scale-105 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20"
      aria-label="Toggle theme"
    >
      <div
        className={`absolute inset-1 flex items-center justify-center w-12 h-12 rounded-full bg-background border-2 border-primary/40 shadow-lg transition-all duration-500 ${
          theme === "light" ? "translate-x-0" : "translate-x-12"
        }`}
      >
        {theme === "light" ? (
          <Sun className="h-6 w-6 text-primary animate-scale-in" />
        ) : (
          <Moon className="h-6 w-6 text-primary animate-scale-in" />
        )}
      </div>
      <div className="flex items-center justify-between px-2 h-full relative z-0">
        <Sun className={`h-5 w-5 transition-opacity duration-300 ${theme === "light" ? "opacity-0" : "opacity-40 text-primary"}`} />
        <Moon className={`h-5 w-5 transition-opacity duration-300 ${theme === "dark" ? "opacity-0" : "opacity-40 text-primary"}`} />
      </div>
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}

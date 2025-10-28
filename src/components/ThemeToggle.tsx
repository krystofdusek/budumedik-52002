import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative h-8 w-16 rounded-full bg-muted border border-border p-0.5 transition-all duration-300 hover:bg-muted/80"
      aria-label="Toggle theme"
    >
      <div
        className={`absolute top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-full bg-background border border-border shadow-sm transition-all duration-300 ${
          theme === "light" ? "left-0.5" : "left-[calc(100%-1.875rem)]"
        }`}
      >
        {theme === "light" ? (
          <Sun className="h-3.5 w-3.5 text-foreground" />
        ) : (
          <Moon className="h-3.5 w-3.5 text-foreground" />
        )}
      </div>
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}

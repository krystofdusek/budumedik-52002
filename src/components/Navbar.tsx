import { Link } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Menu } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/logo.png";

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-6xl">
      <div className="flex h-16 items-center justify-between px-6 rounded-full border border-border/50 bg-background/80 backdrop-blur-xl shadow-lg">
        <Link to="/" className="flex items-center">
          <img 
            src={logo} 
            alt="Logo" 
            className="h-32 w-auto invert dark:invert-0 transition-transform hover:scale-105" 
          />
        </Link>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-2 flex-1 justify-center">
          <Link to="/">
            <Button variant="ghost" className="rounded-full">Domů</Button>
          </Link>
          <Link to="/about">
            <Button variant="ghost" className="rounded-full">O Nás</Button>
          </Link>
        </div>
        
        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          <Link to="/auth">
            <Button className="rounded-full">Přihlásit se</Button>
          </Link>
        </div>

        {/* Mobile Menu */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link to="/" onClick={() => setOpen(false)} className="cursor-pointer">
                  Domů
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/about" onClick={() => setOpen(false)} className="cursor-pointer">
                  O Nás
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/auth" onClick={() => setOpen(false)} className="cursor-pointer">
                  Přihlásit se
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}

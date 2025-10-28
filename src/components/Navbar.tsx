import { Link } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { Menu } from "lucide-react";
import { useState } from "react";
import logo from "@/assets/logo.png";

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center">
          <img 
            src={logo} 
            alt="Logo" 
            className="h-32 w-auto invert dark:invert-0 transition-transform hover:scale-105" 
          />
        </Link>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost">Domů</Button>
          </Link>
          <Link to="/contact">
            <Button variant="ghost">Kontakt</Button>
          </Link>
          <Link to="/auth">
            <Button variant="default">Přihlásit se</Button>
          </Link>
          <ThemeToggle />
        </div>

        {/* Mobile Menu */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <div className="flex flex-col gap-4 mt-8">
                <Link to="/" onClick={() => setOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">Domů</Button>
                </Link>
                <Link to="/contact" onClick={() => setOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start">Kontakt</Button>
                </Link>
                <Link to="/auth" onClick={() => setOpen(false)}>
                  <Button variant="default" className="w-full justify-start">Přihlásit se</Button>
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}

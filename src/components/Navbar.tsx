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
          <Link to="/contact">
            <Button variant="ghost" className="rounded-full">Kontakt</Button>
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

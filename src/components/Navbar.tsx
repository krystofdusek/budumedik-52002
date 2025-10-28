import { Link } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";
import { Button } from "./ui/button";
import logo from "@/assets/logo.png";

export function Navbar() {
  return (
    <nav className="fixed top-0 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center">
          <img 
            src={logo} 
            alt="Logo" 
            className="h-16 w-auto invert dark:invert-0 transition-transform hover:scale-105" 
          />
        </Link>
        
        <div className="flex items-center gap-4">
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
      </div>
    </nav>
  );
}

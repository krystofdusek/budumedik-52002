import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Target, TrendingUp, Zap } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import mockupDark from "@/assets/mockup-dark.png";
import mockupLight from "@/assets/mockup-light.png";
const features = [{
  icon: Brain,
  title: "AI testy",
  description: "Testy přizpůsobené vašim chybám a potřebám díky pokročilé AI technologii"
}, {
  icon: Target,
  title: "Cílená příprava",
  description: "Zaměřte se na konkrétní předměty, kategorie a fakulty podle vašich preferencí"
}, {
  icon: TrendingUp,
  title: "Sledování pokroku",
  description: "Detailní statistiky a analýza vašeho výkonu v jednotlivých oblastech"
}, {
  icon: Zap,
  title: "Skutečné otázky",
  description: "Otázky inspirované skutečnými přijímacími zkouškami z minulých let"
}];
export default function Home() {
  const { theme } = useTheme();
  const mockupImage = theme === "dark" ? mockupDark : mockupLight;
  
  return <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24">
        {/* Hero Section */}
        <section className="relative py-12 overflow-visible">
          <div className="container relative z-10">
            <div className="max-w-5xl mx-auto text-center space-y-8">
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight animate-fade-in">
                Připravte se na medicínu{" "}
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  s pomocí AI
                </span>
              </h1>
              <p className="text-xl text-muted-foreground animate-fade-in" style={{ animationDelay: "0.15s" }}>
                Inteligentní platforma pro přípravu na přijímací zkoušky
                s AI personalizací a skutečnými otázkami z minulých let
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: "0.3s" }}>
                <Link to="/auth">
                  <Button size="lg" className="text-lg rounded-full px-8">
                    Začít se učit
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button size="lg" variant="outline" className="text-lg rounded-full px-8">
                    Kontaktovat nás
                  </Button>
                </Link>
              </div>
              
              {/* App Mockup with fade effect */}
              <div className="mt-32 mb-32 animate-fade-in px-4 md:px-8 relative" style={{ animationDelay: "0.5s" }}>
                <img 
                  src={mockupImage} 
                  alt="BioMed platform mockup" 
                  className="w-full h-auto rounded-3xl transition-all duration-500"
                />
                <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none" />
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-muted/50">
          <div className="container">
            <div className="text-center mb-12 animate-fade-in">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Proč si vybrat naši platformu?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Využijte nejmodernější technologie pro efektivní přípravu
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => <Card 
                  key={feature.title} 
                  className="border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-fade-in"
                  style={{ animationDelay: `${0.1 + index * 0.1}s` }}
                >
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>)}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="container">
            <Card className="bg-gradient-hero border-0 text-primary-foreground animate-fade-in hover:shadow-2xl transition-all duration-500">
              <CardHeader className="text-center space-y-4 py-12">
                <CardTitle className="text-3xl md:text-4xl animate-fade-in" style={{ animationDelay: "0.1s" }}>
                  Připraveni začít?
                </CardTitle>
                <CardDescription className="text-lg text-primary-foreground/90 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: "0.2s" }}>
                  Připojte se k tisícům studentů, kteří už úspěšně používají naši platformu
                </CardDescription>
                <div className="pt-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
                  <Link to="/auth">
                    <Button size="lg" variant="secondary" className="text-lg rounded-full hover:scale-105 transition-transform">
                      Vytvořit účet zdarma
                    </Button>
                  </Link>
                </div>
              </CardHeader>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container text-center text-muted-foreground">
          <p>© 2025. Všechna práva vyhrazena.</p>
        </div>
      </footer>
    </div>;
}
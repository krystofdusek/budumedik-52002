import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Target, TrendingUp, Zap } from "lucide-react";
import logo from "@/assets/logo.png";
const features = [{
  icon: Brain,
  title: "AI Personalizované testy",
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
  return <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-16">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-hero opacity-10" />
          <div className="container relative z-10">
            <div className="max-w-3xl mx-auto text-center space-y-8">
              <div className="flex justify-center mb-8">
                
              </div>
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
                Připravte se na{" "}
                <span className="bg-gradient-primary bg-clip-text text-transparent">
                  medicínu
                </span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Inteligentní platforma pro přípravu na přijímací zkoušky
                s AI personalizací a skutečnými otázkami z minulých let
              </p>
              <div className="flex flex-col gap-4 items-center">
                <Link to="/auth">
                  <Button size="lg" className="text-lg">
                    Začít se učit
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button size="lg" variant="outline" className="text-lg">
                    Kontaktovat nás
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-muted/50">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Proč si vybrat naši platformu?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Využijte nejmodernější technologie pro efektivní přípravu
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map(feature => <Card key={feature.title} className="border-border">
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
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
            <Card className="bg-gradient-hero border-0 text-primary-foreground">
              <CardHeader className="text-center space-y-4 py-12">
                <CardTitle className="text-3xl md:text-4xl">
                  Připraveni začít?
                </CardTitle>
                <CardDescription className="text-lg text-primary-foreground/90 max-w-2xl mx-auto">
                  Připojte se k tisícům studentů, kteří už úspěšně používají naši platformu
                </CardDescription>
                <div className="pt-4">
                  <Link to="/auth">
                    <Button size="lg" variant="secondary" className="text-lg">
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
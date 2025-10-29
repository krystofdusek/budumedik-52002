import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail } from "lucide-react";

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              O Nás
            </h1>
            <p className="text-xl text-muted-foreground">
              Pomáháme studentům připravit se na přijímací zkoušky na medicínu
            </p>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Naše mise</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    MedPrep je moderní platforma využívající umělou inteligenci pro přípravu 
                    na přijímací zkoušky na lékařské fakulty. Naším cílem je poskytnout studentům 
                    efektivní nástroje pro studium a maximalizovat jejich šance na úspěch.
                  </p>
                  <p>
                    Jsme studenti 3. lékařské fakulty Univerzity Karlovy a společně jsme si sami 
                    prošli přijímacími zkouškami na medicínu. Dobře víme, jak náročné dokážou být — 
                    proto jsme vytvořili platformu Budu Medik, která vznikla od studentů pro studenty.
                  </p>
                  <p>
                    Naše testy, otázky a funkce jsou navržené na míru uchazečům o medicínu – vycházíme 
                    z reálných testů, nejčastějších chyb a zkušeností, které jsme sami nasbírali. Cílem 
                    je, abyste se mohli připravovat efektivně, přehledně a s jistotou, že vše odpovídá 
                    skutečným požadavkům přijímaček.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Kontakt</CardTitle>
                <CardDescription>
                  Máte dotaz nebo připomínku? Kontaktujte nás
                </CardDescription>
              </CardHeader>
              <CardContent>
                <a 
                  href="mailto:dusek@czechiainnovation.cz" 
                  className="text-foreground font-medium hover:text-primary transition-colors"
                >
                  dusek@czechiainnovation.cz
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="w-full max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© 2025. Všechna práva vyhrazena.</p>
            <div className="flex gap-4">
              <Link to="/blog" className="hover:text-primary transition-colors">
                Články
              </Link>
              <Link to="/privacy-policy" className="hover:text-primary transition-colors">
                Ochrana osobních údajů
              </Link>
              <Link to="/terms" className="hover:text-primary transition-colors">
                Obchodní podmínky
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

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
                <p className="text-muted-foreground leading-relaxed">
                  MedPrep je moderní platforma využívající umělou inteligenci pro přípravu 
                  na přijímací zkoušky na lékařské fakulty. Naším cílem je poskytnout studentům 
                  efektivní nástroje pro studium a maximalizovat jejich šance na úspěch.
                </p>
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
    </div>
  );
}

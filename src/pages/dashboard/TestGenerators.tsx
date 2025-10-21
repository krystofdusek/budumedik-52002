import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, FileText, Sparkles } from "lucide-react";

export default function TestGenerators() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-8 bg-muted/50">
          <div className="max-w-7xl mx-auto space-y-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Generátory testů</h1>
              <p className="text-muted-foreground">
                Vyberte typ testu, který chcete absolvovat
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Klasický test</CardTitle>
                  <CardDescription>
                    Test z databáze manuálně nahraných otázek
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                    <li>• Filtrování podle předmětu</li>
                    <li>• Výběr kategorie</li>
                    <li>• Specifická fakulta</li>
                    <li>• Otázky z minulých let</li>
                  </ul>
                  <Button className="w-full">
                    Vytvořit klasický test
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow border-primary">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="flex items-center gap-2">
                    AI Personalizovaný test
                    <Badge variant="secondary" className="text-xs">
                      Doporučeno
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Inteligentně generované otázky přizpůsobené vám
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                    <li>• Zaměřené na vaše slabé stránky</li>
                    <li>• Kombinace všech zdrojů otázek</li>
                    <li>• Adaptivní obtížnost</li>
                    <li>• Skutečný formát zkoušky</li>
                  </ul>
                  <Button className="w-full">
                    <Brain className="mr-2 h-4 w-4" />
                    Vytvořit AI test
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Filtry pro testy</CardTitle>
                <CardDescription>
                  Přizpůsobte si test podle svých potřeb
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Předmět
                    </label>
                    <select className="w-full border rounded-md p-2 bg-background">
                      <option>Všechny předměty</option>
                      <option>Fyzika</option>
                      <option>Chemie</option>
                      <option>Biologie</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Fakulta
                    </label>
                    <select className="w-full border rounded-md p-2 bg-background">
                      <option>Všechny fakulty</option>
                      <option>2LF</option>
                      <option>LF Brno</option>
                      <option>3LF</option>
                      <option>LFHK</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Počet otázek
                    </label>
                    <select className="w-full border rounded-md p-2 bg-background">
                      <option>10 otázek</option>
                      <option>20 otázek</option>
                      <option>30 otázek</option>
                      <option>50 otázek</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

function Badge({ children, variant = "default", className = "" }: { children: React.ReactNode; variant?: string; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}

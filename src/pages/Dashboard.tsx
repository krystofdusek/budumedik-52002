import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, FileText, TrendingUp } from "lucide-react";

export default function Dashboard() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-8 bg-muted/50">
          <div className="max-w-7xl mx-auto space-y-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
              <p className="text-muted-foreground">
                Vítejte zpět! Připraveni na další test?
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl">24</CardTitle>
                    <Brain className="h-8 w-8 text-primary" />
                  </div>
                  <CardDescription>Dokončené testy</CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl">87%</CardTitle>
                    <TrendingUp className="h-8 w-8 text-accent" />
                  </div>
                  <CardDescription>Průměrná úspěšnost</CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl">342</CardTitle>
                    <FileText className="h-8 w-8 text-primary" />
                  </div>
                  <CardDescription>Zodpovězené otázky</CardDescription>
                </CardHeader>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Rychlý start</CardTitle>
                <CardDescription>
                  Vyberte si typ testu a začněte trénovat
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center py-12 text-muted-foreground">
                  Generátory testů budou dostupné v sekci "Generátory testů"
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

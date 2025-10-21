import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Target, Award } from "lucide-react";

export default function Progress() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-8 bg-muted/50">
          <div className="max-w-7xl mx-auto space-y-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Můj pokrok</h1>
              <p className="text-muted-foreground">
                Sledujte svůj pokrok a analyzujte výkon
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl">87%</CardTitle>
                    <TrendingUp className="h-8 w-8 text-accent" />
                  </div>
                  <CardDescription>Celková úspěšnost</CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl">24</CardTitle>
                    <Target className="h-8 w-8 text-primary" />
                  </div>
                  <CardDescription>Dokončené testy</CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-2xl">342</CardTitle>
                    <Award className="h-8 w-8 text-primary" />
                  </div>
                  <CardDescription>Zodpovězené otázky</CardDescription>
                </CardHeader>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Pokrok podle předmětů</CardTitle>
                <CardDescription>
                  Vaše úspěšnost v jednotlivých předmětech
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">Fyzika</span>
                    <span className="text-muted-foreground">85%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: "85%" }} />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">Chemie</span>
                    <span className="text-muted-foreground">92%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: "92%" }} />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">Biologie</span>
                    <span className="text-muted-foreground">78%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: "78%" }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Doporučení</CardTitle>
                <CardDescription>
                  Oblasti, na které byste se měli zaměřit
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-destructive mt-2" />
                    <div>
                      <p className="font-medium">Biologie - Genetika</p>
                      <p className="text-sm text-muted-foreground">
                        Úspěšnost 65% - doporučujeme procvičit
                      </p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-accent mt-2" />
                    <div>
                      <p className="font-medium">Fyzika - Termodynamika</p>
                      <p className="text-sm text-muted-foreground">
                        Úspěšnost 98% - skvělá práce!
                      </p>
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

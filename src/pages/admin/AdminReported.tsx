import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function AdminReported() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar isAdmin={true} />
        <main className="flex-1 p-8 bg-muted/50">
          <div className="max-w-7xl mx-auto space-y-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Nahlášené otázky</h1>
              <p className="text-muted-foreground">
                Vyhodnoťte nahlášené otázky od uživatelů
              </p>
            </div>

            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Čekající na vyhodnocení</CardTitle>
                    <Badge variant="secondary">0</Badge>
                  </div>
                  <CardDescription>
                    Nové nahlášení čekající na vaše rozhodnutí
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    Žádné nové nahlášení
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Vyřešené</CardTitle>
                    <Badge variant="secondary">0</Badge>
                  </div>
                  <CardDescription>
                    Historie vyřešených nahlášení
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    Žádná vyřešená nahlášení
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

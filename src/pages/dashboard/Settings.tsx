import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useTheme } from "@/components/ThemeProvider";

export default function Settings() {
  const { theme } = useTheme();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-8 bg-muted/50">
          <div className="max-w-4xl mx-auto space-y-8">
            <div>
              <h1 className="text-4xl font-bold mb-2">Nastavení</h1>
              <p className="text-muted-foreground">
                Upravte si aplikaci podle svých preferencí
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Vzhled</CardTitle>
                <CardDescription>
                  Přizpůsobte si vzhled aplikace
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Barevný režim</p>
                    <p className="text-sm text-muted-foreground">
                      Aktuální: {theme === "light" ? "Světlý" : "Tmavý"}
                    </p>
                  </div>
                  <ThemeToggle />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notifikace</CardTitle>
                <CardDescription>
                  Spravujte vaše notifikace
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Emailové notifikace</p>
                    <p className="text-sm text-muted-foreground">
                      Posílejte mi aktualizace o mém pokroku
                    </p>
                  </div>
                  <Button variant="outline">Zapnout</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Účet</CardTitle>
                <CardDescription>
                  Spravujte svůj účet
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Změnit heslo</p>
                    <p className="text-sm text-muted-foreground">
                      Aktualizujte heslo k vašemu účtu
                    </p>
                  </div>
                  <Button variant="outline">Změnit</Button>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t">
                  <div>
                    <p className="font-medium text-destructive">Smazat účet</p>
                    <p className="text-sm text-muted-foreground">
                      Trvale smazat váš účet a všechna data
                    </p>
                  </div>
                  <Button variant="destructive">Smazat</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

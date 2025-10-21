import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function AdminQuestions() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar isAdmin={true} />
        <main className="flex-1 p-8 bg-muted/50">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold mb-2">Správa otázek</h1>
                <p className="text-muted-foreground">
                  Spravujte databázi otázek pro přijímací zkoušky
                </p>
              </div>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Přidat otázku
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Seznam otázek</CardTitle>
                <CardDescription>
                  Všechny otázky v databázi
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <p>Zatím nebyly přidány žádné otázky</p>
                  <Button variant="outline" className="mt-4">
                    <Plus className="mr-2 h-4 w-4" />
                    Přidat první otázku
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

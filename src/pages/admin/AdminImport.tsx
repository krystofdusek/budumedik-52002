import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AppSidebar } from "@/components/AppSidebar";
import { MobileNav } from "@/components/MobileNav";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Upload, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const FILE_MAPPINGS = [
  { path: '/data/2lf/Biologie_člověka.md', category: 'Biologie člověka' },
  { path: '/data/2lf/Biologie_rostlin_a_hub.md', category: 'Biologie rostlin a hub' },
  { path: '/data/2lf/Biologie_živočichů.md', category: 'Biologie živočichů' },
  { path: '/data/2lf/Buněčná_biologie.md', category: 'Buněčná biologie' },
  { path: '/data/2lf/Ekologie.md', category: 'Ekologie' },
  { path: '/data/2lf/Evoluční_biologie.md', category: 'Evoluční biologie' },
  { path: '/data/2lf/Molekulární_biologie.md', category: 'Molekulární biologie' },
  { path: '/data/2lf/Obecná_a_populační_genetika.md', category: 'Obecná a populační genetika' },
  { path: '/data/2lf/Úvod_do_biologie.md', category: 'Úvod do biologie' },
  { path: '/data/2lf/Historie_medicíny.md', category: 'Historie medicíny' }
];

export default function AdminImport() {
  const [importing, setImporting] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const handleImport = async () => {
    try {
      setImporting(true);
      setStatus("Načítání souborů...");
      setResult(null);

      // Read all files
      const fileContents = await Promise.all(
        FILE_MAPPINGS.map(async (file) => {
          try {
            const response = await fetch(file.path);
            if (!response.ok) throw new Error(`Failed to load ${file.category}`);
            const content = await response.text();
            return { content, categoryName: file.category };
          } catch (error) {
            console.error(`Error loading ${file.category}:`, error);
            return null;
          }
        })
      );

      const validFiles = fileContents.filter(f => f !== null);
      setStatus(`Načteno ${validFiles.length} souborů. Importuji do databáze...`);

      // Call edge function
      const { data, error } = await supabase.functions.invoke('import-2lf-questions', {
        body: { fileContents: validFiles }
      });

      if (error) throw error;

      setResult(data);
      setStatus("Import dokončen!");
      toast({
        title: "Import úspěšný",
        description: `Importováno otázek celkem: ${data.results?.reduce((sum: number, r: any) => sum + (r.questionsImported || 0), 0) || 0}`,
      });
    } catch (error: any) {
      console.error('Import error:', error);
      setStatus(`Chyba: ${error.message}`);
      toast({
        title: "Chyba při importu",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar isAdmin={true} />
        <div className="flex-1">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background px-4 md:px-6">
            <MobileNav isAdmin={true} />
            <h1 className="text-xl font-semibold">Import otázek 2LF</h1>
          </header>

          <main className="p-6">
            <Card>
              <CardHeader>
                <CardTitle>Import otázek z markdown souborů</CardTitle>
                <CardDescription>
                  Importujte otázky 2LF z nahraných souborů do databáze
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Soubory k importu:</h3>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {FILE_MAPPINGS.map((file) => (
                      <li key={file.path} className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {file.category}
                      </li>
                    ))}
                  </ul>
                </div>

                <Button 
                  onClick={handleImport} 
                  disabled={importing}
                  size="lg"
                  className="w-full"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {importing ? "Importuji..." : "Spustit import"}
                </Button>

                {status && (
                  <div className="rounded-lg border border-border bg-muted p-4">
                    <p className="text-sm font-medium">{status}</p>
                  </div>
                )}

                {result && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium">Výsledky importu:</h3>
                    {result.results?.map((r: any, idx: number) => (
                      <div key={idx} className="rounded-lg border border-border p-4">
                        <div className="flex items-start gap-2">
                          {r.error ? (
                            <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
                          ) : (
                            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                          )}
                          <div className="flex-1">
                            <p className="font-medium">{r.category}</p>
                            {r.error ? (
                              <p className="text-sm text-destructive">{r.error}</p>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                Importováno: {r.questionsImported} otázek
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

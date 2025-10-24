import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Trash2 } from "lucide-react";

interface Report {
  id: string;
  reason: string;
  status: string;
  created_at: string;
  resolved_at: string | null;
  admin_notes: string | null;
  questions: {
    id: string;
    question_text: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    option_e: string | null;
    correct_answers: string[];
    explanation: string | null;
    subject: { name: string };
    category: { name: string };
    faculty: { name: string };
  };
  profiles: {
    email: string;
  };
}

export default function AdminReported() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pendingReports, setPendingReports] = useState<Report[]>([]);
  const [resolvedReports, setResolvedReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roles) {
      toast({
        title: "Přístup odepřen",
        description: "Nemáte oprávnění k této stránce",
        variant: "destructive",
      });
      navigate("/dashboard");
      return;
    }

    setIsAdmin(true);
    loadReports();
  };

  const loadReports = async () => {
    setLoading(true);
    
    const { data: pending } = await supabase
      .from("question_reports")
      .select(`
        *,
        questions (
          id,
          question_text,
          option_a,
          option_b,
          option_c,
          option_d,
          option_e,
          correct_answers,
          explanation,
          subject:subjects (name),
          category:categories (name),
          faculty:faculties (name)
        ),
        profiles!question_reports_user_id_fkey (email)
      `)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    const { data: resolved } = await supabase
      .from("question_reports")
      .select(`
        *,
        questions (
          id,
          question_text,
          option_a,
          option_b,
          option_c,
          option_d,
          option_e,
          correct_answers,
          explanation,
          subject:subjects (name),
          category:categories (name),
          faculty:faculties (name)
        ),
        profiles!question_reports_user_id_fkey (email)
      `)
      .neq("status", "pending")
      .order("resolved_at", { ascending: false })
      .limit(20);

    setPendingReports(pending || []);
    setResolvedReports(resolved || []);
    setLoading(false);
  };

  const handleResolve = (report: Report, action: "approved" | "deleted") => {
    setSelectedReport(report);
    setDialogOpen(true);
  };

  const confirmResolve = async (action: "approved" | "deleted") => {
    if (!selectedReport) return;

    try {
      const { error } = await supabase.rpc("resolve_question_report", {
        report_id: selectedReport.id,
        resolution_status: action,
        notes: adminNotes || null,
      });

      if (error) throw error;

      toast({
        title: "Vyřešeno",
        description: action === "approved" 
          ? "Otázka byla schválena a znovu aktivována"
          : "Otázka byla trvale smazána",
      });

      setDialogOpen(false);
      setAdminNotes("");
      setSelectedReport(null);
      loadReports();
    } catch (error) {
      console.error("Error resolving report:", error);
      toast({
        title: "Chyba",
        description: "Nepodařilo se vyřešit nahlášení",
        variant: "destructive",
      });
    }
  };

  const renderReport = (report: Report, isPending: boolean) => (
    <Card key={report.id} className="mb-4">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{report.questions.question_text}</CardTitle>
            <div className="flex gap-2 flex-wrap mb-2">
              <Badge variant="secondary">{report.questions.subject.name}</Badge>
              <Badge variant="outline">{report.questions.category.name}</Badge>
              <Badge variant="outline">{report.questions.faculty.name}</Badge>
              <Badge variant={isPending ? "destructive" : "default"}>
                {isPending ? "Čeká" : report.status === "approved" ? "Schváleno" : "Smazáno"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Nahlásil: {report.profiles.email}
            </p>
            <p className="text-sm text-muted-foreground">
              Důvod: {report.reason}
            </p>
            {report.admin_notes && (
              <p className="text-sm text-muted-foreground mt-2">
                Poznámky admina: {report.admin_notes}
              </p>
            )}
          </div>
          {isPending && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleResolve(report, "approved")}
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Schválit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleResolve(report, "deleted")}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Smazat
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className={report.questions.correct_answers.includes('A') ? 'text-primary font-medium' : ''}>
            A) {report.questions.option_a}
          </div>
          <div className={report.questions.correct_answers.includes('B') ? 'text-primary font-medium' : ''}>
            B) {report.questions.option_b}
          </div>
          <div className={report.questions.correct_answers.includes('C') ? 'text-primary font-medium' : ''}>
            C) {report.questions.option_c}
          </div>
          <div className={report.questions.correct_answers.includes('D') ? 'text-primary font-medium' : ''}>
            D) {report.questions.option_d}
          </div>
          {report.questions.option_e && (
            <div className={report.questions.correct_answers.includes('E') ? 'text-primary font-medium' : ''}>
              E) {report.questions.option_e}
            </div>
          )}
        </div>
        {report.questions.explanation && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">Vysvětlení:</p>
            <p className="text-sm">{report.questions.explanation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (!isAdmin) {
    return null;
  }

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

            {loading ? (
              <div className="text-center py-8">Načítání...</div>
            ) : (
              <div className="grid gap-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Čekající na vyhodnocení</CardTitle>
                      <Badge variant="secondary">{pendingReports.length}</Badge>
                    </div>
                    <CardDescription>
                      Nové nahlášení čekající na vaše rozhodnutí
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {pendingReports.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Žádné nové nahlášení
                      </div>
                    ) : (
                      pendingReports.map((report) => renderReport(report, true))
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Vyřešené</CardTitle>
                      <Badge variant="secondary">{resolvedReports.length}</Badge>
                    </div>
                    <CardDescription>
                      Historie vyřešených nahlášení (poslední 20)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {resolvedReports.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Žádná vyřešená nahlášení
                      </div>
                    ) : (
                      resolvedReports.map((report) => renderReport(report, false))
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Poznámky pro vyřešení</DialogTitle>
            <DialogDescription>
              Přidejte poznámky k vyřešení nahlášení (volitelné)
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Zadejte poznámky..."
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Zrušit
            </Button>
            <Button
              variant="default"
              onClick={() => confirmResolve("approved")}
            >
              Schválit otázku
            </Button>
            <Button
              variant="destructive"
              onClick={() => confirmResolve("deleted")}
            >
              Smazat otázku
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}

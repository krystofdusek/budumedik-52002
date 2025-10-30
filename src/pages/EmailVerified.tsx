import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";

export default function EmailVerified() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we got here from a successful verification
    const hash = window.location.hash;
    
    if (hash.includes("type=signup") || hash.includes("access_token")) {
      setStatus("success");
    } else if (hash.includes("error")) {
      setStatus("error");
    } else {
      // If no hash params, assume success (user was redirected here)
      setStatus("success");
    }
  }, []);

  const handleContinue = () => {
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4 pt-24">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              {status === "loading" && (
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
              )}
              {status === "success" && (
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              )}
              {status === "error" && (
                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                  <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                </div>
              )}
            </div>
            
            <CardTitle className="text-2xl">
              {status === "loading" && "Ověřujeme váš email..."}
              {status === "success" && "Email úspěšně ověřen!"}
              {status === "error" && "Chyba při ověření"}
            </CardTitle>
            
            <CardDescription>
              {status === "loading" && "Prosím počkejte, probíhá ověření vašeho emailu."}
              {status === "success" && "Váš účet byl úspěšně aktivován. Nyní se můžete přihlásit."}
              {status === "error" && "Nepodařilo se ověřit váš email. Zkuste to prosím znovu nebo nás kontaktujte."}
            </CardDescription>
          </CardHeader>
          
          {status !== "loading" && (
            <CardContent>
              <Button 
                onClick={handleContinue} 
                className="w-full"
                variant={status === "success" ? "default" : "outline"}
              >
                {status === "success" ? "Přejít na přihlášení" : "Zkusit znovu"}
              </Button>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}

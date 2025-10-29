import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle } from "lucide-react";

const EmailVerified = () => {
  const navigate = useNavigate();
  const [verificationStatus, setVerificationStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const checkVerification = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error checking session:", error);
          setVerificationStatus("error");
          return;
        }

        if (session) {
          setVerificationStatus("success");
        } else {
          setVerificationStatus("error");
        }
      } catch (error) {
        console.error("Error during verification check:", error);
        setVerificationStatus("error");
      }
    };

    checkVerification();
  }, []);

  const handleContinue = () => {
    if (verificationStatus === "success") {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {verificationStatus === "loading" && (
            <>
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <CardTitle>Ověřování emailu...</CardTitle>
              <CardDescription>Prosím počkejte, ověřujeme váš účet.</CardDescription>
            </>
          )}
          
          {verificationStatus === "success" && (
            <>
              <CheckCircle2 className="mx-auto mb-4 h-16 w-16 text-success" />
              <CardTitle className="text-success">Email úspěšně ověřen!</CardTitle>
              <CardDescription>
                Váš účet byl úspěšně aktivován. Nyní se můžete přihlásit a začít používat MedPrep.
              </CardDescription>
            </>
          )}
          
          {verificationStatus === "error" && (
            <>
              <XCircle className="mx-auto mb-4 h-16 w-16 text-destructive" />
              <CardTitle className="text-destructive">Chyba při ověřování</CardTitle>
              <CardDescription>
                Nepodařilo se ověřit váš email. Link mohl vypršet nebo je neplatný.
                Zkuste se prosím přihlásit nebo se zaregistrovat znovu.
              </CardDescription>
            </>
          )}
        </CardHeader>
        
        <CardContent className="text-center">
          <Button 
            onClick={handleContinue}
            className="w-full"
            disabled={verificationStatus === "loading"}
          >
            {verificationStatus === "success" ? "Pokračovat na dashboard" : "Zpět na přihlášení"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailVerified;

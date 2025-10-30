import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle } from "lucide-react";
import { Navbar } from "@/components/Navbar";

const EmailVerified = () => {
  const navigate = useNavigate();
  const [verificationStatus, setVerificationStatus] = useState<"loading" | "success" | "error">("loading");
  const [countdown, setCountdown] = useState(5);

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
          
          // Start countdown for redirect
          const timer = setInterval(() => {
            setCountdown((prev) => {
              if (prev <= 1) {
                clearInterval(timer);
                navigate("/dashboard");
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
          
          return () => clearInterval(timer);
        } else {
          setVerificationStatus("error");
        }
      } catch (error) {
        console.error("Error during verification check:", error);
        setVerificationStatus("error");
      }
    };

    checkVerification();
  }, [navigate]);

  const handleContinue = () => {
    if (verificationStatus === "success") {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-4">
        <div className="max-w-md w-full">
          {verificationStatus === "loading" && (
            <div className="bg-card border rounded-2xl p-8 shadow-lg text-center space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mx-auto">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
              <div className="space-y-3">
                <h1 className="text-2xl font-bold">Ověřování emailu...</h1>
                <p className="text-muted-foreground">Prosím počkejte, ověřujeme váš účet.</p>
              </div>
            </div>
          )}
          
          {verificationStatus === "success" && (
            <div className="bg-card border rounded-2xl p-8 shadow-lg text-center space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/70 mx-auto">
                <CheckCircle2 className="w-10 h-10 text-primary-foreground" />
              </div>
              
              <div className="space-y-3">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Email ověřen úspěšně!
                </h1>
                <p className="text-muted-foreground text-lg">
                  Váš účet byl aktivován a můžete začít používat Budu Medik 🎉
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="text-sm text-muted-foreground">
                  Přesměrování za <span className="text-primary font-bold text-lg">{countdown}</span> sekund...
                </p>
                <Button 
                  onClick={handleContinue} 
                  className="w-full"
                >
                  Přejít do aplikace hned
                </Button>
              </div>

              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  Nyní máte přístup ke všem funkcím pro přípravu na medicínu
                </p>
              </div>
            </div>
          )}
          
          {verificationStatus === "error" && (
            <div className="bg-card border rounded-2xl p-8 shadow-lg text-center space-y-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10 mx-auto">
                <XCircle className="w-10 h-10 text-destructive" />
              </div>
              
              <div className="space-y-3">
                <h1 className="text-2xl font-bold text-destructive">Chyba při ověřování</h1>
                <p className="text-muted-foreground">
                  Nepodařilo se ověřit váš email. Link mohl vypršet nebo je neplatný.
                </p>
              </div>

              <Button 
                onClick={handleContinue}
                className="w-full"
                variant="outline"
              >
                Zpět na přihlášení
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailVerified;

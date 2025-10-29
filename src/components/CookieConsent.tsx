import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Link } from "react-router-dom";

export function CookieConsent() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      setShow(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setShow(false);
  };

  const rejectCookies = () => {
    localStorage.setItem("cookie-consent", "rejected");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-fade-in">
      <Card className="max-w-4xl mx-auto p-6 bg-background/95 backdrop-blur-xl border-border shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2">Souhlas s používáním cookies</h3>
            <p className="text-sm text-muted-foreground">
              Používáme cookies pro zajištění funkčnosti webu a analýzu návštěvnosti. 
              Více informací najdete v našich{" "}
              <Link to="/privacy-policy" className="underline hover:text-primary">
                zásadách ochrany osobních údajů
              </Link>
              {" "}a{" "}
              <Link to="/terms" className="underline hover:text-primary">
                obchodních podmínkách
              </Link>
              .
            </p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <Button
              variant="outline"
              onClick={rejectCookies}
              className="flex-1 md:flex-none rounded-full"
            >
              Odmítnout
            </Button>
            <Button
              onClick={acceptCookies}
              className="flex-1 md:flex-none rounded-full"
            >
              Přijmout vše
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

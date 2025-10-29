import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Sparkles, TrendingUp, Users } from "lucide-react";

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpgradeDialog({ open, onOpenChange }: UpgradeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <Crown className="h-12 w-12 text-primary" />
          </div>
          <DialogTitle className="text-center text-2xl">
            Vyčerpal jsi svůj měsíční limit 3 testů zdarma
          </DialogTitle>
          <DialogDescription className="text-center text-base pt-2">
            Odemkni plný přístup ke všem testům, statistikám a AI asistenci.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-6 space-y-4">
          <div className="text-center font-semibold text-lg text-primary">
            Investuj do sebe — za cenu 1 kávě měsíčně
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="font-medium">Neomezené AI testy</div>
                <div className="text-sm text-muted-foreground">
                  Personalizované otázky na základě tvých slabých stránek
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <TrendingUp className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="font-medium">Detailní vysvětlení</div>
                <div className="text-sm text-muted-foreground">
                  Pochop každou odpověď s podrobnými vysvětleními
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
              <Users className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="font-medium">Porovnání s ostatními</div>
                <div className="text-sm text-muted-foreground">
                  Žebříček a statistiky proti studentům z tvé fakulty
                </div>
              </div>
            </div>
          </div>
          
          <Button className="w-full" size="lg">
            <Crown className="mr-2 h-4 w-4" />
            Upgrade na Premium
          </Button>
          
          <Button 
            variant="ghost" 
            className="w-full" 
            onClick={() => onOpenChange(false)}
          >
            Možná později
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

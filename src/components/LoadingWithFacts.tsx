import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const scienceFacts = [
  "Věděli jste, že lidské srdce pumpuje přibližně 7 570 litrů krve denně?",
  "Věděli jste, že DNA v jedné lidské buňce, kdyby byla rozložena, měřila by téměř 2 metry?",
  "Věděli jste, že lidský mozek spotřebuje asi 20% celkové energie těla?",
  "Věděli jste, že nervové impulzy v lidském těle cestují rychlostí až 120 m/s?",
  "Věděli jste, že lidské tělo obsahuje přibližně 37,2 bilionu buněk?",
  "Věděli jste, že kostní tkáň je pevnější než ocel stejné hmotnosti?",
  "Věděli jste, že lidský žaludek se kompletně obnovuje každé 3-4 dny?",
  "Věděli jste, že otisky prstů se vytváří již ve třetím měsíci těhotenství?",
  "Věděli jste, že lidské oko dokáže rozlišit přibližně 10 milionů různých barev?",
  "Věděli jste, že dospělý člověk má průměrně 5-6 litrů krve v těle?",
  "Věděli jste, že lidská kůže se kompletně obnovuje každých 28 dní?",
  "Věděli jste, že člověk za život nadýchá asi 600 milionů litrů vzduchu?",
];

interface LoadingWithFactsProps {
  message?: string;
}

export function LoadingWithFacts({ message = "Načítání..." }: LoadingWithFactsProps) {
  const [currentFact, setCurrentFact] = useState(scienceFacts[0]);

  useEffect(() => {
    // Randomly select a fact on mount
    const randomFact = scienceFacts[Math.floor(Math.random() * scienceFacts.length)];
    setCurrentFact(randomFact);

    // Change fact every 5 seconds
    const interval = setInterval(() => {
      const randomFact = scienceFacts[Math.floor(Math.random() * scienceFacts.length)];
      setCurrentFact(randomFact);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8 space-y-6">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <div className="text-center space-y-4">
        <p className="text-lg font-medium">{message}</p>
        <p className="text-sm text-muted-foreground max-w-md">
          Děkujeme za strpení, generování otázek může chvíli trvat...
        </p>
        <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/10">
          <p className="text-sm text-primary font-medium italic">{currentFact}</p>
        </div>
      </div>
    </div>
  );
}

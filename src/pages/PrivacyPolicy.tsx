import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-12">
        <div className="container max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Zásady ochrany osobních údajů</CardTitle>
              <p className="text-sm text-muted-foreground">Účinné od: {new Date().toLocaleDateString('cs-CZ')}</p>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <h2>1. Správce osobních údajů</h2>
              <p>
                Správcem vašich osobních údajů je provozovatel této platformy. Kontaktní údaje naleznete 
                na stránce Kontakt.
              </p>

              <h2>2. Jaké údaje zpracováváme</h2>
              <p>Zpracováváme následující kategorie osobních údajů:</p>
              <ul>
                <li><strong>Identifikační údaje:</strong> jméno, e-mailová adresa</li>
                <li><strong>Studijní údaje:</strong> výsledky testů, pokrok ve studiu, statistiky výkonu</li>
                <li><strong>Technické údaje:</strong> IP adresa, typ prohlížeče, cookies</li>
              </ul>

              <h2>3. Účel zpracování</h2>
              <p>Vaše osobní údaje zpracováváme za těmito účely:</p>
              <ul>
                <li>Poskytování služeb a funkcí platformy</li>
                <li>Správa uživatelského účtu</li>
                <li>Personalizace obsahu a AI testů</li>
                <li>Komunikace s uživateli</li>
                <li>Analýza a zlepšování služeb</li>
                <li>Plnění právních povinností</li>
              </ul>

              <h2>4. Právní základ zpracování</h2>
              <p>Vaše údaje zpracováváme na základě:</p>
              <ul>
                <li>Vašeho souhlasu (čl. 6 odst. 1 písm. a GDPR)</li>
                <li>Plnění smlouvy (čl. 6 odst. 1 písm. b GDPR)</li>
                <li>Oprávněného zájmu (čl. 6 odst. 1 písm. f GDPR)</li>
              </ul>

              <h2>5. Cookies</h2>
              <p>
                Používáme následující typy cookies:
              </p>
              <ul>
                <li><strong>Nezbytné cookies:</strong> Nutné pro fungování webu</li>
                <li><strong>Funkční cookies:</strong> Ukládání preferencí a nastavení</li>
                <li><strong>Analytické cookies:</strong> Měření návštěvnosti a výkonu</li>
              </ul>

              <h2>6. Sdílení údajů</h2>
              <p>
                Vaše osobní údaje nesdílíme s třetími stranami, kromě případů, kdy je to nezbytné 
                pro poskytování služeb (např. hosting, analytické nástroje) nebo vyžadováno zákonem.
              </p>

              <h2>7. Doba uchovávání</h2>
              <p>
                Osobní údaje uchováváme po dobu nezbytnou pro splnění účelu zpracování, 
                obvykle po dobu trvání uživatelského účtu a zákonných archivačních lhůt.
              </p>

              <h2>8. Vaše práva</h2>
              <p>Máte právo na:</p>
              <ul>
                <li>Přístup ke svým osobním údajům</li>
                <li>Opravu nepřesných údajů</li>
                <li>Výmaz údajů ("právo být zapomenut")</li>
                <li>Omezení zpracování</li>
                <li>Přenositelnost údajů</li>
                <li>Námitku proti zpracování</li>
                <li>Odvolání souhlasu</li>
                <li>Podat stížnost u Úřadu pro ochranu osobních údajů</li>
              </ul>

              <h2>9. Zabezpečení</h2>
              <p>
                Implementujeme přiměřená technická a organizační opatření k ochraně vašich 
                osobních údajů před neoprávněným přístupem, ztrátou nebo zneužitím.
              </p>

              <h2>10. Změny těchto zásad</h2>
              <p>
                Tyto zásady můžeme čas od času aktualizovat. O významných změnách vás budeme informovat.
              </p>

              <h2>11. Kontakt</h2>
              <p>
                Pro dotazy ohledně zpracování osobních údajů nás kontaktujte prostřednictvím 
                kontaktního formuláře na našem webu.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t border-border py-8">
        <div className="container text-center text-muted-foreground">
          <p>© 2025. Všechna práva vyhrazena.</p>
        </div>
      </footer>
    </div>
  );
}

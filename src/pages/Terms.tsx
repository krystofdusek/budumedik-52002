import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-12">
        <div className="container max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-3xl">Všeobecné obchodní podmínky</CardTitle>
              <p className="text-sm text-muted-foreground">Účinné od: {new Date().toLocaleDateString('cs-CZ')}</p>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none">
              <h2>1. Úvodní ustanovení</h2>
              <p>
                Tyto všeobecné obchodní podmínky (dále jen "VOP") upravují užívání platformy 
                pro přípravu na přijímací zkoušky na lékařské fakulty.
              </p>

              <h2>2. Vymezení pojmů</h2>
              <ul>
                <li><strong>Poskytovatel:</strong> Provozovatel platformy</li>
                <li><strong>Uživatel:</strong> Osoba užívající služby platformy</li>
                <li><strong>Služby:</strong> Vzdělávací obsah, testy a funkce platformy</li>
                <li><strong>Účet:</strong> Uživatelský účet vytvořený registrací</li>
              </ul>

              <h2>3. Registrace a účet</h2>
              <p>
                Pro plné využívání služeb je nutná registrace. Uživatel se zavazuje poskytovat 
                pravdivé údaje a chránit přístupové údaje před zneužitím.
              </p>
              <ul>
                <li>Registrace je bezplatná</li>
                <li>Jeden uživatel může mít pouze jeden účet</li>
                <li>Uživatel odpovídá za veškeré aktivity na svém účtu</li>
                <li>Sdílení účtu s jinými osobami je zakázáno</li>
              </ul>

              <h2>4. Poskytované služby</h2>
              <p>Platforma poskytuje:</p>
              <ul>
                <li>Přístup k databázi testových otázek</li>
                <li>AI personalizované testy</li>
                <li>Sledování pokroku a statistiky</li>
                <li>Studijní materiály a nástroje</li>
              </ul>

              <h2>5. Práva a povinnosti uživatele</h2>
              <p>Uživatel je oprávněn:</p>
              <ul>
                <li>Využívat služby v souladu s těmito VOP</li>
                <li>Požádat o podporu prostřednictvím kontaktního formuláře</li>
              </ul>
              
              <p>Uživatel se zavazuje:</p>
              <ul>
                <li>Nepokoušet se neoprávněně získat přístup k systémům platformy</li>
                <li>Nezneužívat služby k nezákonným účelům</li>
                <li>Nesdílet obsah platformy bez souhlasu poskytovatele</li>
                <li>Nepoužívat automatizované nástroje k získávání obsahu (web scraping)</li>
              </ul>

              <h2>6. Práva a povinnosti poskytovatele</h2>
              <p>Poskytovatel se zavazuje:</p>
              <ul>
                <li>Poskytovat služby v přiměřené kvalitě</li>
                <li>Chránit osobní údaje dle GDPR</li>
                <li>Informovat o plánovaných odstávkách systému</li>
              </ul>
              
              <p>Poskytovatel má právo:</p>
              <ul>
                <li>Upravovat a aktualizovat obsah a funkce</li>
                <li>Omezit nebo zrušit účet při porušení VOP</li>
                <li>Měnit tyto VOP s předchozím upozorněním</li>
              </ul>

              <h2>7. Duševní vlastnictví</h2>
              <p>
                Veškerý obsah platformy (texty, otázky, software, grafika) je chráněn autorským 
                právem a náleží poskytovateli nebo licenčním partnerům. Uživatel získává pouze 
                nevýhradní licenci k osobnímu, nekomerčnímu použití.
              </p>

              <h2>8. Odpovědnost a záruka</h2>
              <ul>
                <li>Platforma je poskytována "tak jak je" bez záruky úplnosti nebo přesnosti</li>
                <li>Poskytovatel neodpovídá za výsledky přijímacích zkoušek</li>
                <li>Poskytovatel neručí za nepřetržitou dostupnost služeb</li>
                <li>Uživatel používá služby na vlastní riziko</li>
              </ul>

              <h2>9. Ceny a platby</h2>
              <p>
                Základní verze služeb je poskytována bezplatně. Prémiové funkce mohou být 
                zpoplatněny dle aktuálního ceníku zveřejněného na platformě.
              </p>

              <h2>10. Ukončení služeb</h2>
              <p>
                Uživatel může kdykoliv zrušit svůj účet. Poskytovatel může ukončit poskytování 
                služeb uživateli při porušení těchto VOP s okamžitou platností.
              </p>

              <h2>11. Ochrana osobních údajů</h2>
              <p>
                Zpracování osobních údajů je upraveno v samostatných{" "}
                <a href="/privacy-policy" className="text-primary hover:underline">
                  Zásadách ochrany osobních údajů
                </a>
                .
              </p>

              <h2>12. Závěrečná ustanovení</h2>
              <ul>
                <li>Tyto VOP se řídí právním řádem České republiky</li>
                <li>Poskytovatel si vyhrazuje právo změnit tyto VOP</li>
                <li>Změny nabývají účinnosti jejich zveřejněním na platformě</li>
                <li>Pokračováním v užívání služeb vyjadřujete souhlas s aktuálními VOP</li>
              </ul>

              <h2>13. Řešení sporů</h2>
              <p>
                Spory mezi poskytovatelem a uživatelem se řeší přednostně dohodou. 
                Pokud nedojde k dohodě, je příslušný obecný soud dle sídla poskytovatele.
              </p>

              <h2>14. Kontakt</h2>
              <p>
                Pro dotazy ohledně těchto VOP nás kontaktujte prostřednictvím kontaktního 
                formuláře na našem webu.
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

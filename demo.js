// Ukázková databanka ve stejném TXT formátu jako vlastní soubory.
const demoText = "# UKÁZKOVÁ DATABANKA. Nahraď ji skutečnými otázkami svého předmětu.\n" +
    "# Nadpis: číslo kapitoly, tečka, mezera, název.\n" +
    "# Pravdivé tvrzení: OK = ...\n" +
    "# Nepravdivé tvrzení: NOK = ...\n" +
    "# Pro CHOOSE 2 má mít každá kapitola aspoň 2 OK a 3 NOK.\n" +
    "# Pro plnou variabilitu MULTI-CHOICE (1–4 OK ze 4) doporučeno 4 OK a 3 NOK.\n" +
    "\n" +
    "1. Tor a anonymní prohlížení\n" +
    "OK = Tor Browser směruje komunikaci přes síť dobrovolnických uzlů, aby omezil snadné sledování uživatele.\n" +
    "OK = Tor lze využít pro soukromější přístup k běžným webovým stránkám (clearnetu).\n" +
    "OK = Tor mohou používat novináři a oznamovatelé citlivých informací.\n" +
    "OK = Výstupní uzel Tor může u nešifrovaného HTTP přenosu vidět část přenášených dat.\n" +
    "OK = Tor samo o sobě nezaručuje anonymitu, pokud uživatel prozradí identitu přihlášením ke svému účtu.\n" +
    "NOK = Tor standardně šifruje komunikaci end-to-end mezi prohlížečem a libovolným HTTP webem.\n" +
    "NOK = Tor funguje výhradně pro stahování torrentů a běžné webové stránky neotevře.\n" +
    "NOK = Použití Tor vždy automaticky zabrání identifikaci uživatele bez ohledu na jeho chování.\n" +
    "NOK = Tor provozuje jediný centrální server, přes který prochází všechen provoz.\n" +
    "NOK = Tor je totéž co běžná služba VPN.\n" +
    "\n" +
    "2. I2P a interní služby\n" +
    "OK = I2P je anonymizační síť orientovaná primárně na komunikaci a služby uvnitř své sítě.\n" +
    "OK = I2P lze využít pro anonymizovanější sdílení souborů včetně BitTorrentu uvnitř I2P.\n" +
    "OK = Provoz v I2P používá oddělené směrovací tunely.\n" +
    "OK = I2P umožňuje provozovat služby, které jsou dostupné uživatelům příslušné sítě.\n" +
    "OK = Tor a I2P mají rozdílné návrhové priority a nejsou vždy zaměnitelné.\n" +
    "NOK = I2P je primárně běžný vyhledávač pro clearnet bez anonymizačních funkcí.\n" +
    "NOK = I2P automaticky odstraní všechny stopy po identitě uživatele v operačním systému.\n" +
    "NOK = I2P a Tor mají naprosto identickou architekturu a využití.\n" +
    "NOK = I2P pro svůj provoz vyžaduje účet u komerční VPN služby.\n" +
    "NOK = I2P nemůže být využito pro přenos souborů.\n" +
    "\n" +
    "3. VPN a základní volba nástroje\n" +
    "OK = VPN může chránit provoz mezi zařízením a VPN serverem před odposlechem na místní síti.\n" +
    "OK = Provozovatel VPN může mít přehled o části síťové aktivity uživatele.\n" +
    "OK = Použití VPN neznamená automatickou anonymitu vůči všem webům a službám.\n" +
    "OK = Pro skrytí IP adresy před cílovým webem může pomoci VPN i Tor, ale s jinými důvěrovými předpoklady.\n" +
    "OK = HTTPS a VPN řeší odlišné části ochrany komunikace.\n" +
    "NOK = VPN automaticky odstraní cookies i historii v prohlížeči.\n" +
    "NOK = Každá VPN bez výjimky znemožní provozovateli VPN vidět síťová metadata.\n" +
    "NOK = VPN je vždy vhodnější než Tor pro každého whistleblowera bez ohledu na model hrozeb.\n" +
    "NOK = Připojení přes VPN nahradí aktualizace operačního systému.\n" +
    "NOK = VPN automaticky poskytuje end-to-end šifrování všech aplikací až k cílovým službám.\n" +
    "\n" +
    "4. HTTPS, DNS a praktické soukromí\n" +
    "OK = HTTPS šifruje obsah spojení mezi klientem a serverem, se kterým je navázáno TLS.\n" +
    "OK = DNS slouží mimo jiné k překladu doménových názvů na IP adresy.\n" +
    "OK = HTTPS samo o sobě neskrývá před cílovým webem IP adresu návštěvníka.\n" +
    "OK = DNS over HTTPS pomáhá chránit DNS dotazy při přenosu k zvolenému resolveru.\n" +
    "OK = Ochrana soukromí závisí na kombinaci technologií a chování uživatele.\n" +
    "NOK = HTTPS způsobí, že navštívený web nepozná žádné údaje o klientovi.\n" +
    "NOK = DNS nikdy nepracuje s doménovými názvy.\n" +
    "NOK = Pouhé použití HTTPS zaručuje úplnou anonymitu na internetu.\n" +
    "NOK = DNS over HTTPS automaticky skryje všechny navštívené weby před každým dalším účastníkem komunikace.\n" +
    "NOK = HTTPS a Tor jsou dvě označení pro stejný protokol.\n";

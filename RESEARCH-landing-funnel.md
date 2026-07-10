# Orostone landing + lead funnel: rozhodovací report

*Kontext: studená platená Meta/Google návštevnosť, cieľ = kvalifikovaný lead, #1 obmedzenie = closing-to-cash (nie objem leadov). Súčasný /dotaznik má ~83 % abandon (form_start 1297 → 215 leadov). Každé odporúčanie je naviazané na dôkaz alebo výslovne označené ako hypotéza na test.*

> Zdroj: deep-research workflow (task ww725l234, 8 agentov, 6 research lenses → adversarial verify → synthéza). Uložené 2026-07-07.

---

## 1. Executive odporúčanie — blueprint v 5 bodoch

- **Postav landing okolo jedného viackrokového kvízu „Naplánujte si dosku"** s kontaktom na konci a orientačnou cenou/ďalším krokom ako odmenou. Viackrokový formát je najlepšie doložený štrukturálny fix pre dlhé kvalifikačné formuláre (HubSpot, Formstack, Zuko/Venture Harbour — smer istý, magnitúdy nie).
- **Zredukuj tvrdé vstupné polia na 3–5 a telefón daj ako posledný/nepovinný.** Menej polí = vyššie dokončenie je najrobustnejšie doložený smer v celom výskume (Baymard, HubSpot 40k stránok). Toto je pravdepodobne hlavná príčina 83 % abandonu.
- **PRIMÁRNY value-exchange = orientačná cena, nie vzorka.** Vzhľadom na closing-to-cash constraint je cieľ kvalita, nie objem. Cenová orientácia self-selektuje intent; bezplatná vzorka „na adresu" naplní pipeline browsermi, ktorá už teraz nezatvára (378→87→2). Vzorku ponúkni ako sekundárny, kvalifikovaný krok.
- **Nahraď fake Unsplash realizácie skutočnými fotkami inštalácií + dielne v Bošanoch a reálnym Google ratingom pri CTA.** Proof škáluje s cenou: pri €2 000+ nákupe sú recenzie/foto #1 pákou (Spiegel: +380 % na drahších položkách vs +190 % na lacných), a NNG dokázala, že užívatelia aktívne diskontujú stock/filler fotky.
- **Najväčšia páka nie je na landingu — je to speed-to-lead.** MIT (odpoveď do 5 vs 30 min ≈ 21× vyššia šanca kvalifikovať) a HBR (n=2 241; odpoveď do 1 h ≈ 7× kvalifikovať) sú tvrdé štúdie a mapujú presne na Orostone constraint. Zaveď auto-notifikáciu obchodu v momente submitu + SLA na callback v minútach. Toto je cennejšie ako akýkoľvek redizajn formulára.

---

## 2. Formulár: full-screen quiz vs malý embedded formulár

**Rozhodnutie: full-screen, one-question-per-screen kvíz — nie malý embedded formulár.** Pre Orostone konkrétne, a najmä pre mobil.

Prečo decisívne kvíz:
- **Návštevnosť je prevažne mobilná (Meta).** Na malom viewporte je „stena polí" hlavný spúšťač abandonu (Baymard). One-question-per-screen odstraňuje práve tento effort-spike.
- **/dotaznik je genuine dlhý kvalifikačný formulár** (typ projektu, rozmery, kontakt) — presne prípad, kde viackrok poráža jednu dlhú stránku. Pri krátkych 2–5 poľových formulároch by extra kroky len pridali friction; Orostone tam nie je.
- **Otázky sa čítajú ako personalizovaná pomoc, nie data-grab.** Klikateľné single-choice dlaždice nenesú cenu písaného vstupu, takže kvíz môže položiť viac otázok než by formulár mal mať polí — a pritom kvalifikuje.

**Dôkazová disciplína:** Typeform „50 %+ vs 20–30 %" a Interact „40 %/65 %" sú vendor/selekčne skreslené. **Ver smeru, nie magnitúde.** Realistický čistý lift viackroku je jednociferný až nízko-dvojciferný %, nie 300 %.

**Caveat na štatistickú silu:** pri ~215 leadoch/obdobie nemáš traffic dotestovať „kvíz vs formulár" do signifikancie rýchlo. Nasadenie kvízu urob ako **rozhodnutie na základe smeru dôkazov**, nie ako A/B.

---

## 3. Value-exchange: vzorka vs orientačná cena

**Odpoveď na „je dať vzorky do formulára správna stratégia?": Nie ako PRIMÁRNY ask. Orientačná cena má byť primárna; vzorka je sekundárny, kvalifikovaný krok.**

Kľúčové napätie: takmer všetky CRO odporúčania optimalizujú vrchol funnelu (completion, CPL), ale Orostone constraint je spodok (closing-to-cash). Bezplatná vzorka „na adresu" spoľahlivo zdvihne objem a zníži CPL, ale **rozriedi intent** — viac nekvalifikovaných leadov do pipeline, ktorá zo 87 dealov zatvorí 2 cash, problém zhoršuje.

**Prečo orientačná cena ako primárna:** vyšší-commitment ask → self-selektuje kupujúcich s rozpočtom a projektom; odpovedá na audit gap „no orientation price"; dáva dôvod na rýchly callback. Rámuj email ako *„kam vám pošleme odhad"*.

**Prečo vzorka NIE preč, ale druhý krok:** Peck & Shu 2009 (JCR, peer-reviewed) — *mere touch* zvyšuje ochotu platiť ~+24 %. Vzorka teda môže zdvihnúť **close rate a akceptáciu ceny** (nie len počet leadov) — zladené s constraint, AK ide o kvalifikovaného kupca. Ponúkni ju **až kvalifikovanému, timeline-potvrdenému leadu** (po cenovej orientácii), prémiovú, príjemne uchopiteľnú (APPENNINO / ROMAN TRAVERTINE / WILD FOREST).

**Fulfillment:** pri ~84 % marži nie je COGS problém — problém je pick/pack a riziko posielania nekupujúcim. Mitigácia: vratný poplatok **€9–15** (kreditovaný do dealu), cap na počet dekórov, lacnejší mini-formát.

**Poctivá poznámka:** sample-to-CASH pre kameň nie je nikde publikovaný. **Vzorkový funnel je neoverená stávka proti tvojmu bottlenecku, kým ju lokálne neinštrumentuješ** (sample_requested → shipped → measurement_booked → deal → cash).

---

## 4. Trust / proof: realizácie a fotky

**Čo pridať (v poradí dôkaznej sily):**
1. **Reálny agregátny Google rating (hviezdičky + počet) pri hero CTA a zopakovaný pri formulári.** Proof škáluje s cenou (Spiegel: +380 % na drahších vs +190 % na lacnejších).
2. **Nechaj honest priemer (napr. 4,6), nie podozrivú 5,0.** Pásmo 4,0–4,7 konvertuje najlepšie; 5,0 spúšťa podozrenie (~46 % neverí perfektnému hodnoteniu).
3. **Nahraď fake Unsplash realizácie skutočnými inštaláciami** (P0 z auditu). Before/after (stará doska → osadený kameň), slab/fabrikácia, crew. Autenticita > lesk.
4. **Externá validácia > on-site citáty.** Embed živý Google widget; menuj zákazníkov s fotkou + lokalitou + projektom.
5. **Risk-reversal vedľa CTA a pri cene:** materiálová záruka, „fixná cena — žiadne prekvapenia", „bezplatné zameranie, nezáväzne", „vaše dáta nezdieľame".

**Kde = „proximity to doubt":** hero (headline + rating + CTA) → galéria realizácií → menované recenzie → záruka + tváre tímu + dielňa Bošany → **kompaktný proof cluster pri formulári** (najvyššia páka umiestnenia pri 83 % abandone).

**Caveaty:** single-client anekdoty (+133 %/+34 %/+30 %) = hypotézy, nie očakávané lifty. BlendCommerce záruka pri CTA na mobile *underperformovala* — a Orostone je mobile-heavy, takže placement over, nekopíruj z desktop case. Trust badges nie sú free win (Baymard -5 % do +75 %).

---

## 5. Odporúčaná štruktúra landingu (wireframe + quiz flow)

**Sekcie zhora nadol:**
1. **Hero:** benefit headline + Google rating (4,x, počet) + 1–2 proof logá + primárne CTA *„Zistite orientačnú cenu vašej dosky"* (spúšťa kvíz).
2. **Proof strip:** 3–4 ikonové signály — reálne realizácie, zameranie zdarma & nezáväzne, fixná cena, showroom Bošany.
3. **Galéria realizácií (before/after):** skutočné inštalácie, nie stock.
4. **Ako to funguje (3 kroky):** kvíz/odhad → zameranie → osadenie (Orostone dodá materiál, overení kamenári fabrikujú/osádzajú — „kompletná starostlivosť bez hand-off medzery").
5. **Menované recenzie + externý Google widget.**
6. **Záruka / risk-reversal blok.**
7. **Tím + dielňa/showroom (kaštieľ Bošany).**
8. **Sticky CTA na mobile.**

**Quiz flow (one-question-per-screen, progress bar, kontakt posledný):**
1. **Čo riešite?** (doska / ostrovček / zástena / viac) — najľahší prvý krok.
2. **Dekor** (obrázkový picker: APPENNINO / ROMAN TRAVERTINE / WILD FOREST / neviem).
3. **Približná veľkosť / bežné metre** (rozsahové dlaždice, nie presné písanie).
4. **Timeline** (do 1 mes. / 1–3 mes. / len zisťujem) — kvalifikácia mid-flow.
5. **Kontakt (posledný):** email povinný, telefón nepovinný, preferovaný čas kontaktu. „Do minút vám pošleme orientačný odhad."
6. **Výsledok:** orientačná cena/rozsah + „Chcete si dekor ohmatať? Pošleme prémiovú vzorku" (sekundárny sample ask s vratným poplatkom).

Drž tvrdé vstupy na 3–5. Presné m², hrana, presný rozpočet → do post-lead callbacku.

---

## 6. Čo A/B testovať (3–5 experimentov)

*Pri ~215 leadoch/obdobie je štatistická sila nízka. Priorituj testy s veľkým efektom; ostatné nasaď ako rozhodnutie na základe smeru.*

1. **Speed-to-lead SLA (najvyššia priorita).** Zmeraj first-response baseline (dnes NEMERANÝ), auto-notify obchodu pri submite + callback v minútach, sleduj lead→deal→cash. Meraj pred/po na close rate.
2. **Value-exchange: cena vs vzorka ako primárny ask** — meraj **lead-to-CASH, nie lead volume**.
3. **Redukcia polí** na 3–5, telefón nepovinný.
4. **Proof pri formulári:** rating + risk-reversal vedľa formulára vs bez.
5. **Vratný sample poplatok (€9–15) vs zdarma** — na lead-to-deal.

**Pred akýmkoľvek magnitúdovým záverom** inštrumentuj reťazec: sample_requested → shipped → measurement_booked → deal → cash + speed-to-lead baseline.

---

## 7. Zdroje

**Tvrdé / rigorózne:**
- Peck & Shu 2009, *Mere Touch*, JCR — https://www.anderson.ucla.edu/faculty/suzanne.shu/JCR%20touch%20ownership.pdf
- Spiegel/Northwestern, *How Online Reviews Influence Sales* — https://spiegel.medill.northwestern.edu/how-online-reviews-influence-sales/
- Baymard, *Checkout Usability* — https://baymard.com/research/checkout-usability
- Speed-to-lead (MIT/InsideSales + HBR n=2 241) — https://www.workato.com/the-connector/lead-response-time-study/
- NNG, *Trustworthy Design* — https://www.nngroup.com/articles/trustworthy-design/

**Benchmarky / smer (magnitúdy s rezervou):**
- Interact quiz report — https://www.tryinteract.com/blog/quiz-conversion-rate-report/
- HubSpot/WPForms — https://wpforms.com/online-form-statistics-facts/
- Zuko single vs multi-step — https://www.zuko.io/blog/single-page-or-multi-step-form
- KlientBoost (contact-last) — https://www.klientboost.com/cro/lead-generation-form/
- Unbounce lead-gen forms — https://unbounce.com/conversion-rate-optimization/optimize-lead-gen-forms/

**Kategóriové vzory (existence-proof):**
- Caesarstone Find a Fabricator — https://www.caesarstoneus.com/find-a-fabricator/
- Cosentino quote form — https://www.cosentino.com/landings-en-gb/quotation-form/
- Fireclay Tile samples — https://www.fireclaytile.com/samples
- plattenplaner.de konfigurátor — https://plattenplaner.de/pages/wir-konfigurieren-ihre-Arbeitsplatte

---

*Bottom line: štruktúru (full-screen kvíz, menej polí, kontakt posledný, reálne foto, proof pri CTA, speed-to-lead) nasaď ako rozhodnutie — smer je dobre doložený. Vzorkový funnel a všetky konkrétne percentá ber ako hypotézy a inštrumentuj sample-to-CASH lokálne.*

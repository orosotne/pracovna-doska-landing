# Frontend audit — pracovná doska landing (v2)

**Dátum:** 2026-07-09 · **Súbor:** `pracovna-doska-landing/index.html` (1418 riadkov) · **Preview:** localhost:4188
**Cieľ stránky:** luxusný dojem + vysoká konverzia do quizu (orientačná cena) · **Traffic:** Meta ads, prevažne mobil
**Deľba s paralelným copy auditom:** tento audit = dizajn / UX / výkon / konverzná mechanika. Texty a claims = **`COPY-AUDIT-2026-07.md`** (dokončený 10:31). Prieniky označené 🤝. Oba audity vznikli nezávisle nad copy-orostone skillom a **zhodli sa na hlavných nálezoch** — viď sekcia „Zosúladenie" na konci.

---

## Verdikt

| Dimenzia | Skóre | Poznámka |
|---|---|---|
| Luxusný dojem (desktop) | **7,5/10** | Hero, „Ako vzniká" a farebná disciplína sú výborné; detaily ťahajú dole |
| Luxusný dojem (mobil) | **6/10** | Dlhý riedky scroll, quiz krok 2 rozbitý, recyklované fotky |
| Konverzná pripravenosť | **5/10** | Flow quizu je vzorový, ale ponuka nie je viditeľná above fold a lead nikam neodchádza |
| Technická kvalita | **7/10** | Čistý vanilla kód, reveal-engine dobre gateovaný; perf a a11y medzery |

**Čo je skutočne dobré (nechať tak):** tmavá stone+gold paleta s disciplinovaným zlatom (žiadny gýč), sekcia „Ako vzniká" s rotujúcou 3D platňou a line-art patternom (memorabilný prvok!), Typeform-štýl quiz s auto-advance + focus managementom + validáciou, success screen s 3 krokmi a platenou vzorkou 5,90 € presne podľa research reportu, sticky apps sekcia s pinmi, GDPR self-hosted Montserrat s fallback metrikami, reveal-engine bezpečný pre no-JS/reduced-motion/mobil.

---

## P0 — pred spustením kampane (blockery)

### F1 · Lead nikam neodchádza + analytika je len atrapa
- `index.html:1359` — `/* TODO nasadenie: POST na Make webhook */`, lead ide len do `console.log`.
- Na stránke **nie je žiadny GTM/GA4/Meta Pixel runtime** — `dataLayer.push` (`lead_form_start`, `lead_step`, `generate_lead`, `sample_intent`) padá do prázdna, `fbq` je zakomentovaný (`index.html:1322`).
- **Fix:** webhook na Make + GTM kontajner (alebo priamo gtag + Pixel). Bez toho kampaň nemá konverzný signál a speed-to-lead (najväčšia páka z researchu) sa nedá ani merať. Eventy sú pomenované dobre, netreba ich meniť.

### F2 🤝 · Hero nekomunikuje ponuku — value exchange je neviditeľný above fold
- H1 „Povrchy, ktoré definujú každý detail" (`index.html:714`) je brandový slogan; lead odsek je generický. Sľub **„60 sekúnd → orientačná cena do 24 hodín"** sa prvýkrát objaví až v sekcii „Ako to funguje" (~52 % výšky stránky) a v CTA notes nižšie.
- Research aj copy manuál: primárny hák = **orientačná cena**, hierarchia Kontext → riziko → riešenie → ďalší krok.
- **Fix (dizajn, moja časť):** pod hero CTA rad doplniť `cta-note` slot (rovnaký ako na `index.html:935`) — „Nezáväzne · orientačná cena na mieru spravidla do 24 hodín". Je to 1 riadok HTML, štýl už existuje.
- **Fix (copy — už existuje):** copy audit dospel k rovnakému záveru a napísal hotové hero varianty — `COPY-AUDIT-2026-07.md` §3.2–3.4 (Variant A „Cena vopred" = odporúčaný default: „Koľko bude stáť vaša nová pracovná doska? Zistíte to za 60 sekúnd."). Dizajnový slot pod CTA + copy variant A = kompletný fix.

### F3 · Quiz krok 2 (výber dekoru) je vizuálne rozbitý — srdce konverzie
1. **Obrázky dekorov sa ťahajú z `cdn.shopify.com`** (`index.html:1246-1248`, 2048 px originály pre 120 px render). V capture prostredí sa nenačítali vôbec → presne takto vyzerá krok pre používateľa s ad-blockom / pomalým Meta in-app browserom: **tri prázdne sivé karty** v momente, keď sa má zákazník do materiálu zamilovať. Žiadny placeholder, žiadne rozmery.
2. **Natlačené popisky:** `.decor .cap` je flex row — na 375 px má karta 158 px, názov (109 px) + label (63 px) sa dotýkajú s nulovou medzerou, „SVETLÝ MRAMOR" sa láme a oreže.
3. **Karta „Neviem sa rozhodnúť — poraďte mi"** (`index.html:1249`): popis tečie **inline hneď za tučným nadpisom** (small nemá `display:block` — v `.opt .tx` ho blokuje `b{display:block}`, v `.decor.wide .adv` nie).
- **Fix:** (a) self-host 3 mockupy ako ~40 KB webp do `img/` (vzor: `super-white-extra.webp`), (b) `.decor .cap` prepnúť na stĺpec (b nad small) alebo zmenšiť názov na 16 px, (c) v `.adv .tx` doplniť `b{display:block}`.

### F4 · 2,3 MB JPG ako LCP + 4 MB galéria — na Meta mobilnom trafficu neakceptovateľné
- `img/hero-statuario.jpg` = **2,3 MB** (jediný JPG, všetko ostatné webp), je to LCP element bez `fetchpriority="high"`, bez preload, bez `srcset` (`index.html:697`).
- Galéria: real-gold 972 KB, real-navy 912 KB, real-brick 564 KB (nepoužitý!), real-travertine 536 KB, real-oak 528 KB, real-walnut 508 KB.
- **Fix:** hero prekonvertovať na webp/avif v 2 veľkostiach (mobil ~750 px / desktop ~2000 px, cieľ < 250 KB) + `<link rel="preload" as="image" fetchpriority="high">`; galériu stiahnuť pod ~200 KB/kus (sú lazy, ale aj tak); zmazať nepoužitý `real-brick.webp` a `ostrovcek.webp`. Pomalé LCP = horšie Meta delivery aj vyšší abandon — presne metrika, ktorú funnel opravuje.

### F5 · Hamburger je falošné menu — otvára quiz
- `index.html:691` — `<button class="hamburger" data-open-quiz aria-label="Menu">`. Na mobile je to jediný ovládač v headri; používateľ čaká menu, dostane lead formulár. Bait-and-switch pocit, presný opak „pokojnej, presnej" značky. (Desktop nav v HTML vôbec nie je — CSS `.mainnav/.nav-cta/.hdr-note` je mŕtvy kód.)
- **Fix:** hamburger odstrániť (sticky lišta CTA plní jeho úlohu) a na mobile vrátiť do headera kompaktný showroom riadok; alebo z neho spraviť poctivé mini-menu (Realizácie · Ako to funguje · Cenová ponuka). Odporúčam odstrániť — menej je tu viac.

### F6 · Únik z platenej landing — hero pin karta odkazuje na orostone.sk
- `index.html:736` — material karta „Super White Extra → Zobraziť materiál" vedie na produktovú stránku orostone.sk. Zaplatený klik odchádza do e-shopu s úplne iným flow (a iným positioningom — viď pre-translation audit).
- **Fix:** karta nech ostane (krásny detail!), ale ako **vstup do quizu s predvoleným dekorom** (`data-open-quiz` + prednastaviť `state.answers.dekor`), alebo čisto vizuálny label bez linku. Rovnako footer linky na orostone.sk zvážiť (aspoň ich je málo a sú dole).

---

## P1 — konverzia a UX (do týždňa)

### F7 · Sticky CTA lišta svieti od prvej sekundy
- `.sticky` je `display:flex` od načatia (`index.html:545`) — na prvej obrazovke tak mobil vidí **dva** zlaté CTA naraz (hero + lišta) a permanentný „predajný banner" od nuly pôsobí lacno.
- **Fix:** zobraziť až keď hero CTA opustí viewport (IntersectionObserver na `.hero-cta-row`, trieda + `transform/opacity` prechod). ~15 riadkov JS.

### F8 🤝 · Chýba cenová kotva a FAQ — hlavné bariéry visia vo vzduchu
- Copy manuál: bariéry = cena, neistota, odkladanie. Landing nemá sekciu „ako sa tvorí cena" (3 faktory: dekor, rozsah, riešenie) ani mini-FAQ (montáž cez partnerov, ako prebieha zameranie, čo ak neviem dekor).
- **Fix (dizajn):** accordion/3-stĺpec pattern zapadne medzi „Ako to funguje" a apps sekciu. **Texty už existujú:** FAQ copy je hotové v `COPY-AUDIT-2026-07.md` §6.1, cenová kotva §6.2 (čaká biznis rozhodnutie o číslach). Bez cenovej kotvy sa „orientačná cena" hák opiera len o zvedavosť — fóra doslova píšu „nenašli sme nikde orientačné ceny".

### F9 · Success screen nevyužíva horúci moment (speed-to-lead)
- Po odoslaní: „ozveme sa do 24 hodín". Research: speed-to-lead je najväčšia páka a je nemeraná. Lead, ktorý práve vyplnil 5 krokov, je najteplejší presne teraz.
- **Fix:** na `qdone` doplniť priamu linku „Ponáhľate sa? Volajte 0917 588 738" (tel: link, číslo už je vo footri) + interne držať SLA prvého kontaktu. Jednoriadková zmena, veľký efekt.

### F10 🤝 · Recyklácia fotiek podkopáva „reálne realizácie"
- `hero-statuario.jpg` = hero **aj** prvá (feature) dlaždica galérie — tá istá fotka dvakrát v prvých dvoch obrazovkách (`index.html:697` vs `814`). Fotky testimonialov = fotky z galérie (real-travertine/gold/navy/walnut po druhý raz), `real-navy` tretíkrát vo final CTA.
- Sekcia tvrdí „Toto nie sú vizualizácie" — pri render-look fotkách (dokonalé svetlo, herringbone podlaha) a ich recyklácii to čitateľ podvedome spochybní. Pre-translation audit už raz fake fotky vytkol (P0).
- **Fix (dizajn):** každá sekcia unikátna fotka alebo aspoň iný crop (`object-position`); feature dlaždicu galérie vymeniť za inú realizáciu. **Overiť s copy auditom:** autenticita fotiek + súhlasy klientov (testimonial „Právnik, HAVEL & PARTNERS" — menovať zamestnávateľa bez súhlasu je risk).

### F11 · Mobil: 13 600 px scroll s nízkou hustotou
- USP band aj benefity padajú na mobile do 1 stĺpca — 5 + 5 položiek = ~10 obrazoviek ikoniek s dvoma riadkami textu. Pocit „scrollujem a nič sa nedeje".
- **Fix:** na ≤ 520 px dať `usp-row` aj `bgrid` **2 stĺpce** s menšími ikonami (64-78 px) — texty sú krátke, zmestia sa; stránka sa skráti o ~2 500 px. CSS-only zmena.

---

## P2 — polish a luxusné detaily

| # | Nález | Kde | Fix |
|---|---|---|---|
| F12 | Rotujúci badge píše „KRÁSA KAMEŇA · SILA TECHNOLÓGIE" **Arialom** — jediný ne-brandový font na stránke | `index.html:702` | `font-family` v SVG na `Montserrat` (je načítaný) |
| F13 | USP band mieša 2 čísla + 3 ikony rôznej optickej váhy (`ui-ic--big` scale-hack 1.4); risk sekcia rieši veľkosti per-slot hackmi (138/96/130 px) | `:192`, `:273-277` | Zjednotiť artboardy ikon na jeden rozmer; ideálne všetkých 5 USP ako ikony ALEBO ako čísla, nie mix |
| F14 | Kontrast `--muted-2` = **3,97:1** (pod AA 4,5:1) na 12,5 px textoch — a sú to práve reassurance texty (`cta-note` „Nezáväzne · do 24 hodín", `opt-tag`, `slab-dim`) | `:35` | Alpha z .42 na ≥ .55, alebo 13,5 px+. Reassurance text si zaslúži byť čitateľný |
| F15 | Logo Orostone 3× na stránke (header, uprostred nad „Naše realizácie", footer) — mid-page pečiatka pôsobí neisto, luxus sa nepodpisuje na každej stene | `:784` | Section-logo odstrániť; ušetrí sa aj 15 KB (logo SVG je v kóde 3× celé — nahradiť `<symbol>` + `<use>`) |
| F16 | `favicon.ico` 404 + chýba `og:image` — tab bez ikony, WhatsApp/Messenger zdieľanie bez náhľadu (ľudia landing zdieľajú partnerovi/partnerke!) | `<head>` | SVG favicon (zlatý monogram) + og:image 1200×630 z hero fotky |
| F17 | `background-attachment:fixed` na body — na iOS Safari spôsobuje jank/repaint celej stránky pri scrolle (a rozbilo aj headless capture počas auditu) | `:48` | Gradienty presunúť na `position:fixed` pseudo-element, alebo `background-attachment:scroll` na mobile |
| F18 | Reveal-engine race: pri reload/back-navigácii doprostred stránky (napr. návrat z orostone.sk linku) blikne čierna kým dobehne debounce 90 ms + 700 ms fade | `:1377-1409` | Pri `pageshow`/scroll-restore spustiť `check()` okamžite bez debounce; alebo skrývať len `transform`, nie `opacity` |
| F19 | Quiz dialog: chýba focus-trap (Tab utečie na pozadie), po zatvorení sa focus nevracia na trigger; ESC funguje | `:1330-1336` | Mini focus-trap (~10 riadkov) + uložiť/vrátiť `document.activeElement` |
| F20 | Mŕtvy kód: `.mainnav`, `.nav-cta`, `.hdr-note`, `.hero-figure`, `.chips` štýly bez HTML; nepoužité `img/real-brick.webp`, `ostrovcek.webp`, `.bak.svg` | CSS/`img/` | Vyčistiť pri najbližšom prepise |
| F21 | Apps corner obrázky (144+116 KB) bez `loading="lazy"`; dekor obrázky 2048 px pre 120 px slot | `:952`, `:1246` | lazy + zmenšiť |

---

## 🤝 Zosúladenie s copy auditom (`COPY-AUDIT-2026-07.md`)

Oba audity bežali nezávisle a **stretli sa na rovnakých P0 nálezoch** — to je silný signál, že sú správne:

| Téma | Frontend audit (ja) | Copy audit | Stav |
|---|---|---|---|
| Hero nekomunikuje cenu | F2: dizajnový slot pre cta-note + H1 výmena | §3.2 hotový Variant A „Cena vopred" (+ B pre Meta, C renovácia) | ✅ zhoda, riešenie kompletné |
| Únik cez material kartu na orostone.sk | F6: presmerovať do quizu s predvoleným dekorom | §3.1: ten istý nález (P0) | ✅ zhoda |
| Terminológia „cenová ponuka" vs „orientačná cena" | odovzdané copy | §5: zjednotiť na „orientačná cena" všade | ✅ rozhodnuté — pri implementácii F2/F7 použiť „orientačná cena" |
| FAQ + cenová kotva chýbajú | F8: dizajn pattern pripravím | §6.1 FAQ copy HOTOVÉ, §6.2 kotva čaká na čísla od usera | ✅ copy hotové, treba dizajn + biznis čísla |
| Testimonialy (HAVEL & PARTNERS, agentúrny voice) | F10: recyklované fotky + súhlasy | §4.7: nahradiť reálnymi Google textami, drop zamestnávateľa | ✅ zhoda |
| USP band claims („nie fotobanka", „5 rokov") | F13: vizuálna nekonzistencia čísel/ikon | §3.5: „nie fotobanka" preč (obranná negácia), „5 rokov" preč | ✅ komplementárne — band prerobiť naraz (copy+dizajn) |
| Benefit „škvrny" vs „poškriabanie" | — (mimo môj lane) | §4.2: poškriabanie = top obava z fór | prevziať pri úprave benefits |

**Jediné, čo copy audit nepokrýva a ostáva na mne (dizajn/tech):** F1 (webhook+analytika), F3 (rozbitý krok 2), F4 (LCP/váha obrázkov), F5 (hamburger), F7 (sticky timing), F9 (tel. na success screen — copy §6.3 „kto sa vám ozve" s tým ladí), F11–F21.

---

## Quick wins (≈ 2 hodiny, bez rizika)

1. `cta-note` pod hero CTA (F2 dizajnová časť) — 1 riadok
2. Tel. linka na success screen (F9) — 1 riadok
3. Self-host 3 dekor obrázky + fix `.cap` layout (F3) — 30 min
4. Hero webp + preload + fetchpriority (F4 hero časť) — 30 min
5. Sticky CTA až po hero (F7) — 15 min
6. Hamburger von / mini-menu (F5) — 15 min
7. Arial → Montserrat v badge (F12) — 1 min
8. `--muted-2` na .55 (F14) — 1 min
9. Favicon + og:image (F16) — 15 min
10. Hero pin karta → quiz namiesto orostone.sk (F6) — 10 min

*Launch blocker mimo quick wins: webhook + GTM/Pixel (F1).*

---

*Audit vykonaný čítaním celého zdrojáku + interakčným testom quizu (všetkých 5 krokov, validácia, submit, dataLayer) + vizuálnou kontrolou desktop 1440 px / mobil 375 px. Konzola čistá, bez JS chýb. Nič v `index.html` nebolo menené — stránku paralelne upravujú iné sessions.*

# Mobile responsiveness audit — pracovná doska landing
**Dátum:** 2026-07-09 · **Súbor:** `index.html` · **Rozsah:** 320–430 px (+ 768 px tablet, 1280 px desktop sanity)
**Stav:** všetky nálezy OPRAVENÉ v ten istý deň, overené v prehliadači na 320 / 360 / 375 / 390 / 414 / 430 / 768 / 1280 px.

> Pozn.: stránka je statický HTML s vlastným CSS (nie Next.js/Tailwind), takže fixy sú
> v custom CSS + vanilla JS — ekvivalent mobile-first Tailwind postupov.

---

## 1. USP sekcie → vertikálny ticker (hlavná požiadavka)

Tri „USP steny" žrali na mobile obrovskú výšku. Na ≤640 px sa teraz skladajú do
**vertikálneho tickera**: viditeľná je 1 položka, každé 4 s sa vysunie nahor a zdola
nabehne ďalšia (dojem zvislého scrollu), pod pásom sú bodky.

| Sekcia | Predtým (≈výška) | Teraz (obsah + bodky) |
|---|---|---|
| `.usp-row` USP band (5 položiek: 250+, cena 24 h, zameranie…) | ~500 px | **169 px** |
| `.bgrid` Prečo sinterovaný kameň (5 benefitov) | ~700 px | **187 px** |
| `.risk` risk-reversal (4 položky, 118 px ikony v 1 stĺpci) | ~1300 px | **247 px** |

**Správanie:**
- auto-posun beží len keď je pás vo viewporte a tab je viditeľný (`document.hidden` guard);
- ťuknutie na bodku preberie kontrolu a **auto-posun pre daný pás vypne** (WCAG 2.2.2 — používateľ vie rotáciu zastaviť);
- bodky majú cez `::after` **27 px tap target** (vizuálne 7 px);
- `prefers-reduced-motion`: globálny kill-switch vypne transition → okamžité prepnutie bez pohybu;
- **bez JS alebo >640 px ostáva pôvodná mriežka** (progresívne vylepšenie — `.vt-on` pridáva až JS);
- výška pásu = najvyššia položka (meria sa cez dočasnú `.vt-measure` triedu, prepočet pri resize + po načítaní fontov); kratšie položky sú zvislo centrované;
- desktop reveal-engine (stagger) nekonfliktuje — ticker maže jeho inline `transition-delay`;
- prepínanie mriežka↔ticker: `resize` (debounce 120 ms) **aj** `matchMedia('change')` (rotácia bez resize eventu).

**Implementácia:** `data-vt` atribút na troch mriežkach, ~35 riadkov CSS (`.vt-on`, `.vt-out`, `.vt-cur`, `.vt-dots`), 1 JS IIFE (~50 riadkov) — jeden wiederpoužiteľný vzor pre všetky tri sekcie. `.usp-row` sa pre čisté absolútne pozicovanie vyňal z `.wrap` (predtým `class="wrap usp-row"` — absolútne deti by ignorovali 22 px padding).

## 2. Ďalšie nájdené a opravené problémy

| # | Problém | Prečo sa lámal | Fix |
|---|---|---|---|
| 1 | **`.foot-bottom` bez bočného paddingu** — © riadok pätičky sa lepil na okraj, rotovaný diamant vytŕčal 1 px za viewport (jediný reálny horizontal-overflow nález) | element je zároveň `.wrap`; skratka `padding:22px 0 42px` prepísala bočných 22 px z `.wrap` | `padding-top/-bottom` namiesto skratky, bočné z `.wrap` ostávajú |
| 2 | **`.hero-usp` chipy pretekali** na ≤390 px (potreba ~366 px vs. 331 px @ 375) | `display:flex` bez `flex-wrap`, pevný gap 18 px | `flex-wrap:wrap;gap:12px 16px`; deliaca čiarka `.hu-div` skrytá ≤430 px (visela by na konci zalomeného riadku — iPhone 16 Pro má 402 px) |
| 3 | **Lightbox sa nezmestil na nízke displeje** (fotka 60vh + caption + bodky + CTA > 568–667 px; flex-center oreže vrch nedosiahnuteľne) | pevné `max-height:min(60vh,640px)` + veľké gapy/padding | ≤640 px: padding 56/12/14, gap 10, fotka `max-height:min(46dvh,640px)` (vh fallback), šípky 40 px pri okraji, menšie CTA — overené: zmestí sa aj na 320×568 |
| 4 | **Sticky CTA lišta vs. iPhone home-indicator** — lišta rastie o `env(safe-area-inset-bottom)`, ale `body{padding-bottom:76px}` bol fixný → prekrývala spodok pätičky | safe-area nezapočítaná do rezervy | `padding-bottom:calc(76px + env(safe-area-inset-bottom))` s 76px fallbackom |
| 5 | **`.sample-card` CTA pretekal kartu** na ≤520 px (ikona + text + tlačidlo „Objednať vzorku · 5,90 €" v riadku ≈ >280 px obsahu) | pevný `flex` riadok | ≤520 px: `flex-direction:column`, CTA `width:100%` |
| 6 | **Hero „prvá obrazovka" vyššia než viditeľný viewport** (100vh vs. mobilný URL bar) | `min-height:100vh` | `min-height:100svh` s vh fallbackom |
| 7 | **8 px bodky lightboxu = mini tap target** | žiadna dotyková rezerva | `::after{inset:-9px}` → 26 px hit area + gap 8→12 px (platí aj pre nové ticker bodky) |
| 8 | **3D doska „Ako vzniká" naklonená** (nález usera po audite) — os leaní 7° na mobile AJ desktope, s perspektívou vyzerá ešte viac | `rotateZ(-7deg)` v `@keyframes slabspin` + reduced-motion fallbacku sa skladal s `rotateX(-7deg)` na trvalý 7° bočný náklon osi | rotateZ odstránený z oboch transformácií — `rotateX(-7deg) rotateY(θ)` premieta os presne zvislo pri každom uhle (overené maticou: 7,00°→0,00°); popisok `.slab-dim` navyše `text-align:center` (na mobile sa lámal na 2 riadky doľava) |

## 3. Skontrolované a v poriadku (bez zásahu)

- **Žiadny horizontálny scroll** na 320/360/375/390/414/430/768/1280 px — rect-sweep všetkých elementov našiel 0 pretečení (jediný nález = #1, opravený). `overflow-x:hidden` na body ostáva len ako poistka, nie ako fix.
- Recenzie `.tm-rail` — zámerný horizontálny snap-carousel, karta 84vw @ ≤520 px, `min-width:0` na wrapperi ✓.
- Kvíz: inputy `font-size:16px` (iOS nezoomuje), `.decors` 2-stĺpec sa zmestí aj na 320 px, overlay `scrollWidth=320` ✓, opt tlačidlá ~70 px vysoké ✓.
- Dekoratívne absolútne prvky (hero pin/badge, material karta, mstickery, apps piny) — na mobile skryté media queries ✓.
- Apps sekcia ≤760 px: sticky vypnuté, fotky staticky pod sebou ✓.
- `img{max-width:100%}` globálne; galéria `aspect-ratio:3/2` + `loading=lazy`; hero `fetchpriority=high` ✓.
- Typografia cez `clamp()` všade (h1 38→68, h2 30→44…) — na 320 px sa nič nezalamuje po písmenách ✓.
- Reveal-engine na mobile nič neskrýva (JS-gate ≥1025 px + reduced-motion + no-JS fallback) ✓.
- Console bez chýb a warningov na všetkých breakpointoch ✓.

## 4. Mobile testovací checklist (pre budúce zmeny)

1. `python3 -m http.server --directory pracovna-doska-landing` (alebo preview `pracovna-doska`).
2. Šírky **320 / 360 / 375 / 390 / 414 / 430 / 768** — na každej:
   - `document.documentElement.scrollWidth === clientWidth` (žiadny h-scroll),
   - rect-sweep: žiadny element s `right > viewport` mimo `overflow-x:auto` predka,
   - USP tickery: `vt-on` ≤640 px, mriežky >640 px, bodky prepínajú, auto-posun stojí po ťuknutí,
   - lightbox: fotka + caption + bodky + CTA sa zmestia (aj 320×568),
   - kvíz: krok 1→5, sample-card, klávesnica nezooomuje (16px inputy),
   - sticky lišta neprekrýva pätičku (safe-area).
3. Rotácia/resize cez 640 px hranicu — ticker ↔ mriežka sa prepne bez artefaktov.
4. `prefers-reduced-motion` — žiadne animácie, obsah viditeľný.
5. Vypnúť JS — mriežky, galéria bez lightboxu, obsah kompletný.

## 5. Odporúčania proti budúcim responzívnym bugom

- **Nikdy nedávať `padding` skratku na element, ktorý je zároveň `.wrap`** (prípad #1) — vždy `padding-top/-bottom`, alebo obal navyše.
- Nové sekcie s N kartami: na mobile buď 1–2 stĺpce s `minmax(0,1fr)`, alebo rovno `data-vt` ticker (vzor je generický — stačí atribút).
- Fixné šírky len cez `max-width` + `width:100%`; v flex riadkoch vždy zvážiť `flex-wrap` a `min-width:0`.
- Výškové rozpočty modálov počítať v `dvh/svh`, nie `vh`.
- Interaktívne bodky/ikonky < 24 px vždy s `::after` hit-area.
- Pri `viewport-fit=cover` prípadne doplniť `max(22px, env(safe-area-inset-left/right))` na `.wrap`, ak by sa riešil landscape (zatiaľ mimo scope — portrait insety sú 0).
- Pred nasadením zopakovať checklist z bodu 4 (5 min).

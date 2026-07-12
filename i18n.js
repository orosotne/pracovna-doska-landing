/* ============================================================
   OROSTONE · LP2 — runtime prepínač SK/EN (index.html + dakujeme.html)
   ------------------------------------------------------------
   SK je zdroj pravdy priamo v HTML. Tento skript pri prepnutí na EN
   nahradí texty podľa slovníka nižšie a pri návrate na SK obnoví
   pôvodný obsah zo snapshotu. Nemení sa DOM štruktúra s JS listenermi
   (quiz/lightbox fungujú v oboch jazykoch), data-val hodnoty formulára
   ostávajú po slovensky — obchod dostáva konzistentné dáta; jazyk leadu
   nesie pole `jazyk` (dopĺňa ho submit handler v index.html).

   Jazyk: window.OS_LANG nastavuje consent.js (?lang=en|sk → localStorage
   'os_lang' → default sk). Skript sa načítava na konci <body>.

   Typy záznamov v slovníku:
     ['h', selektor, hodnota]        → innerHTML
     ['t', selektor, hodnota]        → prvý neprázdny textový uzol
                                       (tlačidlá s <svg>, spany s ikonou)
     ['a', selektor, atribút, hodn.] → atribút (aria-label, alt, placeholder)
   Hodnota = string (všetky zhody) alebo pole podľa poradia v DOM
   (null v poli = preskočiť).
   ============================================================ */
(function(){
'use strict';

/* ---------------- EN slovník ---------------- */
var EN=[
  /* header (obe stránky) */
  ['a','.brand','aria-label','Orostone — home page'],
  ['h','.hdr-showroom > span:not(.hdr-showroom-pop)','<b>Showroom</b> · Renaissance manor, Bošany'],
  ['t','.hdr-showroom-pop .hsp-cap','Renaissance manor · Bošany'],
  ['a','.hdr-showroom-pop img','alt','Renaissance manor in Bošany — Orostone showroom'],

  /* ===== index: HERO ===== */
  ['h','.hero-copy .eyebrow','Sintered stone'],
  ['h','.hero h1','Get a <em style="font-style:italic;white-space:nowrap">price estimate</em> for your worktop.'],
  ['h','.hero-copy p.lead',[
    '<strong>Four short questions, done in 60 seconds.</strong>',
    'We’ll usually get back to you by the next business day with a no-obligation price estimate, a decor recommendation and advice on what will work best in your kitchen.',
    'We work with sintered stone, sometimes sold as porcelain or ceramic stone, a material that resists heat, stains and scratches, and never needs sealing.'
  ]],
  ['t','button.cta[data-open-quiz]:not(.lb-cta)','Get my price estimate '],
  ['h','.rating > span:not(.stars)','<b>5.0</b> <small>· 5 reviews on Google</small>'],
  ['t','.hu-item',['Durable surface','No sealing needed']],
  ['a','.material-card','aria-label','Super White Extra — get a price estimate'],
  ['a','.mc-thumb','alt','Super White Extra — marble-look sintered stone decor'],
  ['h','.mc-sub','Premium decor'],
  ['t','.mc-link','Get a price '],
  ['a','.hero-bg','alt','Kitchen island and splashback in Bianco Statuario sintered stone'],

  /* ===== index: USP band ===== */
  ['h','.usp-item b',[
    'Completed projects','Price estimate the next business day','Free on-site measurement',
    'Cook directly on the stone','Showroom in a manor house']],
  ['h','.usp-item p',[
    'Real kitchens we’ve delivered.',
    'No obligation, tailored to your project.',
    'No obligation, we come to you.',
    'Truly heat-resistant: an invisible induction hob can be integrated beneath the surface.',
    'See the stone in person in Bošany.']],

  /* ===== index: Realizácie ===== */
  ['a','.real-badge','aria-label','5 years of experience — sintered stone since 2021'],
  /* .real-badge ma dva obluky (hore/dole) -> preklada ich realBadge() funkcia nizsie, nie
     genericky 't' (querySelectorAll by inak nastavil OBA textPath na tu istu hodnotu) */
  ['h','.rb-in span','years'],
  ['h','#realizacie .section-head .eyebrow','Our projects'],
  ['h','#realizacie .section-head h2','Real stone in real kitchens'],
  ['h','#realizacie .section-head p','These aren’t renders. They’re real kitchens we’ve delivered, from light marble to bold, dramatic decors.'],
  ['h','#realizacie .tile .cap small',[
    'Island with a dark frame','Island with a waterfall edge','Walnut kitchen + island',
    'Splashback and worktop','Worktop and splashback','Oak kitchen']],
  ['a','#realizacie .tile','aria-label',[
    'Enlarge: Super White Extra — island with a dark frame',
    'Enlarge: Arden Gold — island with a waterfall edge',
    'Enlarge: Roman Travertine — walnut kitchen with an island',
    'Enlarge: Statuario Diamante — splashback and worktop',
    'Enlarge: Yabo White — worktop and splashback',
    'Enlarge: Super White Extra — oak kitchen']],
  ['a','#realizacie .tile img','alt',[
    'Kitchen island with a dark frame — Super White Extra decor',
    'Kitchen island with a waterfall edge — Arden Gold decor',
    'Walnut kitchen with an island — Roman Travertine decor',
    'Splashback and worktop in a walnut kitchen — Statuario Diamante decor',
    'Worktop and splashback with navy cabinets — Yabo White decor',
    'Oak kitchen — Super White Extra decor']],
  ['h','.gal-trust span',[
    'Fabricated and fitted by experienced stonemasons',
    'Showroom in a manor house in Bošany']],

  /* ===== index: Výhody ===== */
  ['h','.benefits-section .section-head .eyebrow','Why sintered stone'],
  ['h','.benefits-section .section-head h2','Durability you’ll appreciate every day'],
  ['h','.benefits-section .section-head p','A material that takes the worry out of everyday use and keeps its looks for decades.'],
  ['h','.bcard b',['Non-porous surface','Scratch-resistant','Heat-resistant','No sealing needed','Easy to clean']],
  ['h','.bcard p',[
    'Wine, oil and coffee sit on the surface. Nothing soaks into the stone.',
    'Highly scratch-resistant in everyday use. Even the odd careless cut is unlikely to leave a mark.',
    'Hot pots and pans can go straight onto the stone, no trivet required.',
    'The surface never needs sealing, one less thing to maintain.',
    'A quick wipe with an ordinary kitchen cleaner is all it takes.']],
  ['a','.benefits-worktop img','alt','Sintered stone worktop with LED underlighting'],

  /* ===== index: Ako vzniká ===== */
  ['h','.madeof .section-head .eyebrow','How it’s made'],
  ['h','.madeof .section-head h2','Nature, condensed into <span class="hl">12 millimetres</span>'],
  ['h','.madeof .section-head p','Sintered stone isn’t synthetic. It’s made entirely of natural minerals, formed by a process that mirrors how stone is created in nature, just far faster. You may also see it sold as porcelain or ceramic stone; either way, it contains no resins or plastics.'],
  ['a','.slab','aria-label','Rotating sintered stone slab, 1600 × 3200 × 12 mm'],
  ['h','.msticker b',['Minerals','Pressure','Heat','Slab']],
  ['h','.slab-dim','<b>1600 × 3200 × 12 mm</b>, one large-format slab'],
  ['h','.mfact b',['Natural minerals','Immense pressure','Sintered by heat','Large format']],
  ['h','.mfact p',[
    'Quartz, natural sand, clays and mineral oxides, no resins or plastic binders.',
    'Mineral powder is pressed into a compact slab under extreme pressure.',
    'Firing at very high temperatures fuses the particles into a single solid body.',
    'One 1600 × 3200 mm slab covers an island and a splashback with minimal seams.']],

  /* ===== index: Ako to funguje ===== */
  ['h','.how-topbar .eyebrow','How it works'],
  ['h','.how-title','From idea<br />to finished kitchen'],
  ['h','.how-sub','A simple process with clear steps, and people who know the material inside out.'],
  ['h','.how-step h3',['Tell us about your project','Free on-site measurement','Fabrication and fitting']],
  ['h','.how-step p',[
    '60 seconds: project type, decor and timing. Your custom price estimate follows, usually by the next business day.',
    'We come to you, measure the space precisely and fine-tune the details: decor, thickness, edges. Free of charge, no obligation. After the measurement you’ll receive an itemised quote, so you know exactly what you’re paying for before you commit.',
    'We supply the material; fabrication and fitting are handled by experienced stonemasons we’ve worked with for years.']],
  ['a','.how-media figure img','alt',[
    'Decor and floor-plan consultation with stone samples',
    'Kitchen design — idea and planning',
    'Finished kitchen with an Orostone worktop']],
  ['a','.how-step-thumb img','alt',[
    'Project consultation — floor plan and sintered stone samples',
    'Free on-site measurement at the customer’s home',
    'Fabrication and fitting — stonemasons at work on a sintered stone worktop']],

  /* ===== index: CTA note (2×) ===== */
  ['h','.cta-note','No obligation · your custom price estimate, usually by the next business day'],

  /* ===== index: FAQ ===== */
  ['h','#faq .section-head .eyebrow','Common questions'],
  ['h','#faq .section-head h2','The questions we hear most often'],
  ['h','#faq .section-head p','Can’t see your question here? Email or call us, we’re happy to help.'],
  ['t','.faq-item summary',[
    'How much does a sintered stone worktop cost?',
    'Is the estimate binding? Are there any hidden costs?',
    'Do you fit the worktops yourselves?',
    'How is sintered stone different from engineered quartz or Dekton?',
    'Can it take hot pans and chopping?',
    'Where can I see the material in person?']],
  ['h','.faq-item .faq-a',[
    'It depends on the decor, how much material you need and the design of the project, which is why we prepare a custom estimate rather than quoting a single list price. The four questions take about a minute, and your estimate is usually in your inbox by the next business day, with no obligation.',
    'The estimate isn’t binding. It gives you a realistic range to plan around. The exact figure comes after a free on-site measurement, as an itemised quote (cut-outs, edges and all), so you know precisely what you’re paying for before you commit.',
    'Not ourselves, no. We supply the material; fabrication and fitting are done by experienced stonemasons we’ve worked with for years and who know this material well. With stone, the craftsmanship decides the result, so we don’t leave it to chance.',
    'Engineered quartz is bound with resins. Sintered stone is made of nothing but minerals, pressure and heat, no resins, no plastics. In practice that means better heat and UV resistance, and a surface that never needs sealing. Dekton is simply a brand of sintered stone from another manufacturer.',
    'Yes, a hot pot or pan can go straight onto the worktop. The surface is also highly scratch-resistant in everyday use. We’d still suggest a chopping board, though. More for your knives’ sake than the stone’s.',
    'At our showroom in a Renaissance manor in Bošany, you can see and touch the decors and full-size slabs for yourself.']],

  /* ===== index: Aplikačná páska (bežiaci text) ===== */
  ['a','.applband','aria-label','Where sintered stone can be applied'],
  ['t','.applband-item',[
    'Kitchen worktop','Splashback','Kitchen island','Island side panel','Bathroom vanity top','Wall cladding','Window sills',
    'Kitchen worktop','Splashback','Kitchen island','Island side panel','Bathroom vanity top','Wall cladding','Window sills']],

  /* ===== index: Aplikácie ===== */
  ['h','.apps-head .eyebrow','Versatile applications'],
  ['h','.apps-head h2','One stone. The whole kitchen.'],
  ['h','.apps-head p','The same sintered stone handles the entire space: worktop, splashback, island and its side panels.'],
  ['a','.apps-bg','alt','Kitchen in Taj Mahal sintered stone — worktop, island and splashback'],
  ['a','.corner-img','alt',[
    'Kitchen island in sintered stone',
    'Kitchen worktop and splashback in sintered stone']],
  ['h','.pin-card',['Island','Island side panel','Worktop','Splashback']],

  /* ===== index: Recenzie ===== */
  ['h','.tm-head .eyebrow','What clients say'],
  ['h','.tm-head h2','People who already live with the stone'],
  ['h','.tm-head p','Real projects, real people. Rated 5.0 ★ on Google.'],
  ['a','.g-badge','aria-label','Google rating: 5.0 out of 5'],
  ['h','.g-num','5.0'],
  ['h','.g-sub','Reviews on Google'],
  ['a','[data-tm-prev]','aria-label','Previous review'],
  ['a','[data-tm-next]','aria-label','Next review'],
  ['a','.tmc-img','alt',[
    'Kitchen with a Roman Travertine worktop by Orostone',
    'Modern kitchen with an Arden Gold worktop by Orostone',
    'Kitchen with sintered stone by Orostone',
    'Interior with a sintered stone worktop by Orostone']],
  ['h','.tmc blockquote',[
    '“We wanted something special for our new kitchen, and Roman Travertine from Orostone was love at first sight. The whole process, from choosing the decor to measurement and installation, couldn’t have gone more smoothly.”',
    '“We were looking for stone for a modern kitchen, and Arden Gold won us over with its texture and warm tone. We came to Orostone on a recommendation and haven’t regretted it for a second.”',
    '“The Orostone team were thoroughly professional. They explained everything in detail and gave us honest advice. Installation was quick and the result exceeded our expectations. Highly recommended!”',
    '“The surface looks luxurious, is easy to look after and fits our interior perfectly. Thank you for a job well done.”']],
  ['h','.tmc .who b',['Lucia & Tomáš','Marek','Petra','Ján']],
  ['h','.tmc .who small',['Interior stylist & IT analyst','Lawyer, Bratislava','Architect','Entrepreneur']],

  /* ===== index: Risk-reversal ===== */
  ['h','.risk .item b',[
    'Revives an older kitchen','Perfect for a new build',
    'Designed for real life','Looks premium. Works every day.']],
  ['h','.risk .item > span:last-child',[
    'We can replace just the worktop, no need to redo the whole kitchen.',
    'Worktops, islands and splashbacks in one coordinated material.',
    'Stands up to heat, stains and everyday wear.',
    'A slim 12 mm profile and clean lines for a modern interior.']],

  /* ===== index: Final CTA ===== */
  ['h','.finalcta .eyebrow','Next step'],
  ['h','.finalcta h2','Find out what your sintered stone worktop would cost'],
  ['h','.finalcta .band > p','Tell us about your project in 60 seconds and we’ll prepare your custom price estimate. No obligation, usually by the next business day.'],

  /* ===== index: pätička ===== */
  ['a','.foot-logo','aria-label','Orostone — home page'],
  ['h','.foot-tagline','Sintered stone for worktops, cladding and architectural projects. Designed for beauty, made for everyday use.'],
  ['a','.foot-rating','aria-label','Rated 5.0 out of 5 on Google'],
  ['h','.foot-rating b','5.0'],
  ['h','.foot-rating .rsub','· 5 reviews on Google'],
  ['a','nav.foot-col','aria-label','Footer navigation'],
  ['h','.foot-h',['Navigation','Contact']],
  ['h','nav.foot-col ul a',['Projects','How it works','FAQ','Orostone.sk']],
  ['t','.foot-linkbtn','Price estimate'],
  ['h','.foot-contact b',['Showroom','Phone','Email','Address']],
  ['h','.foot-contact a[href^="https://rkb"]','Renaissance manor, Bošany'],
  ['t','.fb-left','© 2026 Orostone · Sintered stone'],
  ['h','.foot-legal a',['Privacy policy','Terms & conditions','Cookie settings']],

  /* ===== index: sticky lišta ===== */
  ['a','#stickyBar','aria-label','Get a price estimate'],
  ['h','.sticky-txt','<b>No-obligation quote</b><span>the next business day</span>'],
  ['t','.sticky-btn','Start '],

  /* ===== index: lightbox ===== */
  ['a','#lbx','aria-label','Project gallery'],
  ['a','#lbClose','aria-label','Close gallery'],
  ['a','#lbPrev','aria-label','Previous project'],
  ['a','#lbNext','aria-label','Next project'],
  ['a','#lbDots','aria-label','Go to project'],
  ['t','.lb-cta','I want a kitchen like this '],
  ['h','.lb-hint','ESC to close · arrow keys to browse'],

  /* ===== index: quiz overlay ===== */
  ['a','#overlay','aria-label','Get a price estimate'],
  ['t','#qback',' Back'],
  ['a','#qclose','aria-label','Close'],
  ['h','.qstep[data-step="1"] .q-label','Your project'],
  ['h','.qstep[data-step="1"] .q','What can we help you with?'],
  ['h','.qstep[data-step="1"] .q-sub','Choose as many as you like, you can always add more later.'],
  ['a','.opts[data-key="aplikacia"]','aria-label','What can we help you with'],
  ['h','.opts[data-key="aplikacia"] .opt .tx b',[
    'Kitchen worktop','Kitchen island','Kitchen splashback','Bathroom or another space']],
  ['h','.opts[data-key="aplikacia"] .opt .tx small',[
    'The most common project','Including waterfall edges','Seamless, one-piece surface','Washbasin, cladding or another project']],
  ['h','#optOther label','What exactly do you need? <span class="opt-tag">optional</span>'],
  ['a','#in-other','placeholder','E.g. bathroom cladding, stairs, a fireplace, a dining table…'],
  ['h','#q1next','Continue'],
  ['h','.qstep[data-step="2"] .q-label','Decor direction'],
  ['h','.qstep[data-step="2"] .q','Which look are you drawn to?'],
  ['h','.qstep[data-step="2"] .q-sub','Nothing binding, it just gives us a sense of your taste.'],
  ['h','.decor .cap small',[
    'Pure white','Soft white','White marble','White marble','Dramatic marble','Cream marble',
    'Warm travertine','Grey stone','Warm gold','Bold dark','Dark gold','Black marble']],
  ['a','.decor img','alt',[
    'Super White Extra — pure white','Yabo White — soft white','Statuario Diamante — white marble',
    'Calacatta Top — white marble','Appennino — dramatic marble','Taj Mahal — cream marble',
    'Roman Travertine — warm travertine','Astrana Grey — grey stone','Givenchy Gold — warm gold',
    'Wild Forest — bold dark','Gothic Gold — dark gold','Nero Margiua — black marble']],
  ['h','.decor.wide .tx b','I can’t decide, help me choose'],
  ['h','.decor.wide .tx small','We’ll recommend decors to suit your kitchen'],
  ['h','.qstep[data-step="3"] .q-label','Timing'],
  ['h','.qstep[data-step="3"] .q','What’s your timeframe?'],
  ['h','.qstep[data-step="3"] .q-sub','So we know how quickly to get back to you.'],
  ['h','.opts[data-key="termin"] .opt .tx b',['As soon as possible','In 1–3 months','Just looking for now']],
  ['h','.opts[data-key="termin"] .opt .tx small',['Within a month','It’s in the works','I’d like a rough price']],
  ['h','.qstep[data-step="4"] .q-label','Last step'],
  ['h','.qstep[data-step="4"] .q','Where should we send your estimate?'],
  ['h','.qstep[data-step="4"] .q-sub','We’ll put together your <b style="color:var(--light);font-weight:600">custom price estimate</b> and send it over, no obligation, usually by the next business day.'],
  ['h','#f-name label','Name'],
  ['a','#in-name','placeholder','E.g. Jane Smith'],
  ['h','#f-name .msg','Please enter your name.'],
  ['h','#f-email label','Email'],
  ['a','#in-email','placeholder','jane@email.com'],
  ['h','#f-email .msg','Please enter a valid email address.'],
  ['h','#f-phone label','Phone <span class="opt-tag">· recommended, you’ll get your estimate sooner</span>'],
  ['h','#f-phone .msg','Please check your phone number.'],
  ['h','#f-consent > span','I agree that Orostone may contact me about my project. No obligation, no spam.'],
  ['t','#leadForm button[type="submit"]','Get my price estimate '],
  ['t','#leadForm .reassure',' No obligation · We never share your details'],

  /* ===== dakujeme.html ===== */
  ['h','.ty .eyebrow','Request received'],
  ['h','.ty > p','We’ll be in touch, usually by the next business day, to confirm the details and send over your custom price estimate.'],
  ['h','.ty .next li > span:last-child',[
    'We’ll contact you to confirm the dimensions, decor and thickness.',
    'We’ll prepare your <b>price estimate</b> and arrange a free on-site measurement.',
    'You can also see the slabs in person at our showroom in Bošany.']],
  ['t','.ty .reassure',' In a hurry? Call '],
  ['h','.ty .visit p','While we work on your estimate, have a look at our decors and completed projects.'],
  ['t','.ty .visit .cta','Visit orostone.sk '],
  ['h','.backlink','← Back to the worktop page'],
  ['h','.foot-in > span','© Orostone · sintered stone for kitchens and interiors'],
  ['t','.foot-in > a','Call us: 0917 588 738'],
  ['a','.foot-in > a','aria-label','Call us on 0917 588 738']
];

/* title + meta description (SK originály sa odložia pri štarte) */
var META_EN = document.getElementById('leadForm')
  ? {title:'Orostone · Sintered Stone Worktops | Custom Price Estimate',
     desc:'Answer 4 short questions in 60 seconds and we’ll prepare a custom price estimate for your sintered stone worktop, usually by the next business day, no obligation. Real projects, showroom in Bošany.'}
  : {title:'Thank you, we’re preparing your estimate | Orostone',
     desc:'Thank you for your enquiry. We’re preparing your custom price estimate and will be in touch, usually by the next business day.'};

/* ---------------- aplikačný engine ---------------- */
var saved=[];            /* snapshoty SK: {kind:'h'|'t'|'a', node, attr?, orig} */
var snapDone=false;
var metaEl=document.querySelector('meta[name="description"]');
var META_SK={title:document.title, desc:metaEl?metaEl.getAttribute('content'):''};

function firstTextNode(el){
  for(var n=el.firstChild;n;n=n.nextSibling){
    if(n.nodeType===3&&n.nodeValue.replace(/\s+/g,'')!=='')return n;
  }
  return null;
}
function forEachEntry(cb){
  for(var i=0;i<EN.length;i++){
    var e=EN[i], kind=e[0], attr=kind==='a'?e[2]:null, val=kind==='a'?e[3]:e[2];
    if(val==null)continue;
    var nodes=document.querySelectorAll(e[1]);
    for(var j=0;j<nodes.length;j++){
      var v=(typeof val==='string')?val:val[j];
      if(v==null)continue;
      cb(kind,nodes[j],attr,v);
    }
  }
}
function snapshot(){
  if(snapDone)return; snapDone=true;
  forEachEntry(function(kind,node,attr){
    if(kind==='h')saved.push({kind:'h',node:node,orig:node.innerHTML});
    else if(kind==='t'){var tn=firstTextNode(node);if(tn)saved.push({kind:'t',node:tn,orig:tn.nodeValue});}
    else saved.push({kind:'a',node:node,attr:attr,orig:node.getAttribute(attr)});
  });
}
function applyEN(){
  snapshot();
  forEachEntry(function(kind,node,attr,v){
    if(kind==='h')node.innerHTML=v;
    else if(kind==='t'){var tn=firstTextNode(node);if(tn)tn.nodeValue=v;}
    else node.setAttribute(attr,v);
  });
}
function restoreSK(){
  for(var i=0;i<saved.length;i++){
    var s=saved[i];
    if(s.kind==='h')s.node.innerHTML=s.orig;
    else if(s.kind==='t')s.node.nodeValue=s.orig;
    else if(s.orig==null)s.node.removeAttribute(s.attr);
    else s.node.setAttribute(s.attr,s.orig);
  }
}

/* rotujúci hero badge — prepnutie prstenca podľa jazyka: SK #hsRing / EN #hsRingEN.
   Stred pečate (#hsSeal, zlatý kruh) je samostatný <use> a NEmení sa — točí sa iba text. */
function heroBadge(lang){
  var u=document.querySelector('.hero-badge .hb-ring use');
  if(u)u.setAttribute('href',lang==='en'?'#hsRingEN':'#hsRing');
}

/* rotujúci „5 rokov" badge (dva symetrické oblúky) — preklad hore/dole textu.
   Dĺžkovo tolerantné: každý oblúk je centrovaný (text-anchor middle), takže EN
   texty inej dĺžky sa iba samy vycentrujú a badge sa nerozbije. */
var realBadgeOrig=null;
function realBadge(lang){
  var tps=document.querySelectorAll('.real-badge textPath');
  if(tps.length<2)return;
  if(!realBadgeOrig)realBadgeOrig={a:tps[0].textContent,b:tps[1].textContent};
  if(lang==='en'){tps[0].textContent='Sintered stone';tps[1].textContent='since 2021';}
  else{tps[0].textContent=realBadgeOrig.a;tps[1].textContent=realBadgeOrig.b;}
}

/* rotujúci footer badge (mobile, rovnaký slogan ako hero) — prepnutie prstenca SK/EN */
function footBadge(lang){
  var u=document.querySelector('.foot-badge .hb-ring use');
  if(u)u.setAttribute('href',lang==='en'?'#hsRingEN':'#hsRing');
}

/* „Krok 1 zo 4" v quiz lište — textové uzly okolo <b id="qnum"> */
function quizStepLabel(lang){
  var k=document.querySelector('.ov-top .k');
  if(!k||!k.firstChild||!k.lastChild)return;
  if(k.firstChild.nodeType===3)k.firstChild.nodeValue=lang==='en'?'Step ':'Krok ';
  if(k.lastChild.nodeType===3)k.lastChild.nodeValue=lang==='en'?' of 4':' zo 4';
}

/* cookie lišta (renderuje ju consent.js; pri prepnutí ju pretextujeme) */
function cookieBar(lang){
  var el=document.getElementById('os-cookiebar');if(!el)return;
  var p=el.querySelector('p'),yes=el.querySelector('.cb-yes'),no=el.querySelector('.cb-no');
  if(!p||!yes||!no)return;
  if(lang==='en'){
    p.innerHTML='We use cookies to measure traffic and ad performance (Google Analytics, Meta Pixel). Click Decline to opt out, you can change your choice at any time. <a href="https://orostone.sk/ochrana-sukromia" target="_blank" rel="noopener">Privacy policy</a>';
    no.textContent='Decline';yes.textContent='OK';
  }else{
    p.innerHTML='Používame cookies na meranie návštevnosti a výkonu reklám (Google Analytics, Meta Pixel). Kliknutím na Odmietnuť ich kedykoľvek vypnete. <a href="https://orostone.sk/ochrana-sukromia" target="_blank" rel="noopener">Ochrana osobných údajov</a>';
    no.textContent='Odmietnuť';yes.textContent='V poriadku';
  }
}

/* nadpis na /dakujeme — drží personalizáciu (meno v data-fn dopĺňa inline skript) */
function tyHeading(lang){
  var h=document.getElementById('ty-h');if(!h)return;
  var fn=h.dataset.fn||'';
  h.textContent=lang==='en'
    ?('Thank you'+(fn?', '+fn:'')+', we’re preparing your estimate.')
    :('Ďakujeme'+(fn?', '+fn:'')+', pripravujeme vašu cenu.');
}

function titleMeta(lang){
  document.title=lang==='en'?META_EN.title:META_SK.title;
  if(metaEl)metaEl.setAttribute('content',lang==='en'?META_EN.desc:META_SK.desc);
}
function syncButtons(lang){
  var btns=document.querySelectorAll('.lang-sw button');
  for(var i=0;i<btns.length;i++)btns[i].setAttribute('aria-pressed',btns[i].dataset.lang===lang?'true':'false');
}

var cur='sk';
function setLang(lang){
  lang=lang==='en'?'en':'sk';
  if(lang===cur)return;
  if(lang==='en')applyEN();else restoreSK();
  cur=lang;window.OS_LANG=lang;
  try{localStorage.setItem('os_lang',lang);}catch(e){}
  /* URL drží jazyk (?lang=en): odkaz je zdieľateľný, GA4 vie segmentovať EN sessions
     a consent.js pri ďalšom načítaní neprepíše voľbu starým parametrom z reklamy
     (bez tohto sa návštevník z ?lang=en reklamy po prepnutí na SK vracal do EN) */
  try{
    var u=new URL(location.href);
    if(lang==='en')u.searchParams.set('lang','en');else u.searchParams.delete('lang');
    var qs=u.searchParams.toString();
    history.replaceState(null,'',u.pathname+(qs?'?'+qs:'')+u.hash);
  }catch(e){}
  document.documentElement.lang=lang;
  titleMeta(lang);heroBadge(lang);realBadge(lang);footBadge(lang);quizStepLabel(lang);cookieBar(lang);tyHeading(lang);
  syncButtons(lang);
  /* mobilný vertikálny ticker si prepočíta výšku pásu na nové texty */
  try{window.dispatchEvent(new Event('resize'));}catch(e){}
}
window.OS_I18N={set:setLang,get:function(){return cur;}};

document.querySelectorAll('.lang-sw button').forEach(function(b){
  b.addEventListener('click',function(){setLang(b.dataset.lang);});
});

/* štart: consent.js už rozhodol jazyk (?lang / localStorage) */
if(window.OS_LANG==='en')setLang('en');
else syncButtons('sk');
})();

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
  ['h','.hdr-showroom > span','<b>Showroom</b> · Renaissance manor, Bošany'],

  /* ===== index: HERO ===== */
  ['h','.hero-copy .eyebrow','Sintered stone worktops'],
  ['h','.hero h1','Get a custom price estimate for your worktop <em style="font-style:italic;white-space:nowrap">today.</em>'],
  ['h','.hero-copy p.lead',[
    '<strong>It takes 60 seconds and 4 short questions.</strong>',
    'Usually within 24 hours, we’ll prepare a no-obligation price estimate, recommend a suitable decor and advise you on the best solution for your kitchen.',
    'We work with sintered stone (also known as technical or ceramic stone) — a material that resists heat, stains and scratches, and never needs sealing.'
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
    'Completed projects','Price estimate within 24 hours','Free on-site measurement',
    'Cook directly on the stone','Showroom in a manor house']],
  ['h','.usp-item p',[
    'Real kitchens we’ve delivered.',
    'No obligation, tailored to your project.',
    'No obligation, at your home.',
    'Sintered stone allows an induction hob to be hidden beneath the surface.',
    'See the stone in person in Bošany.']],

  /* ===== index: Realizácie ===== */
  ['a','.real-badge','aria-label','5 years of experience — sintered stone since 2021'],
  /* .real-badge ma dva obluky (hore/dole) -> preklada ich realBadge() funkcia nizsie, nie
     genericky 't' (querySelectorAll by inak nastavil OBA textPath na tu istu hodnotu) */
  ['h','.rb-in span','years'],
  ['h','#realizacie .section-head .eyebrow','Our projects'],
  ['h','#realizacie .section-head h2','Real stone in real kitchens'],
  ['h','#realizacie .section-head p','These aren’t renders. They’re real kitchens we’ve delivered — from light marble to bold, dramatic decors.'],
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
    'Fabrication and installation by experienced stonemasons',
    'Showroom in a manor house in Bošany']],

  /* ===== index: Výhody ===== */
  ['h','.benefits-section .section-head .eyebrow','Why sintered stone'],
  ['h','.benefits-section .section-head h2','Durability you’ll appreciate every day'],
  ['h','.benefits-section .section-head p','Technical properties that mean less worry in everyday use — and a beautiful result for decades.'],
  ['h','.bcard b',['Non-porous surface','Scratch-resistant','Heat-resistant','No sealing needed','Easy to clean']],
  ['h','.bcard p',[
    'Wine, oil and coffee stay on the surface — stains don’t soak into the slab.',
    'Handles even careless cutting right on the worktop — no permanent marks.',
    'Put a hot pot or pan straight on the surface, no need to worry.',
    'The surface never needs sealing — no extra upkeep.',
    'Just wipe it down with a regular cleaner. Less work, more peace of mind.']],
  ['a','.benefits-worktop img','alt','Sintered stone worktop with LED underlighting'],

  /* ===== index: Ako vzniká ===== */
  ['h','.madeof .section-head .eyebrow','How it’s made'],
  ['h','.madeof .section-head h2','Nature, condensed into <span class="hl">12 millimetres</span>'],
  ['h','.madeof .section-head p','Sintered stone isn’t a synthetic material. It’s a natural mineral material — created by a process that mimics how stone forms in nature, only many times faster. That’s why the market also calls it technical or ceramic stone, even though it contains no resins or plastics.'],
  ['a','.slab','aria-label','Rotating sintered stone slab, 1600 × 3200 × 12 mm'],
  ['h','.msticker b',['Minerals','Pressure','Heat','Slab']],
  ['h','.slab-dim','<b>1600 × 3200 × 12 mm</b> — one large-format slab'],
  ['h','.mfact b',['Natural minerals','Immense pressure','Sintered by heat','Large format']],
  ['h','.mfact p',[
    'Quartz, natural sand, clays and mineral oxides — no resins or plastic binders.',
    'Mineral powder is pressed into a compact slab under extreme pressure.',
    'Firing at very high temperatures fuses the particles into a single solid body.',
    'One 1600 × 3200 mm slab covers an island and a splashback with minimal seams.']],

  /* ===== index: Ako to funguje ===== */
  ['h','.how-topbar .eyebrow','How it works'],
  ['h','.how-title','From idea<br />to finished kitchen'],
  ['h','.how-sub','A simple process with clear steps — and people who understand the material.'],
  ['h','.how-step h3',['Tell us about your project','Free on-site measurement','Fabrication and installation']],
  ['h','.how-step p',[
    '60 seconds: type, decor and timing. We’ll prepare a custom price estimate, usually within 24 hours.',
    'We’ll come to you, measure the space precisely and fine-tune the details — decor, thickness, edges. Free of charge and with no obligation. After the measurement you’ll receive an exact quote — item by item, so you know in advance what you’re paying for.',
    'We supply the material; fabrication and installation are handled by experienced stonemasons we’ve worked with for years.']],
  ['a','.how-media figure img','alt',[
    'Decor and floor-plan consultation with stone samples',
    'Kitchen design — idea and planning',
    'Finished kitchen with an Orostone worktop']],
  ['a','.how-step-thumb img','alt',[
    'Project consultation — floor plan and sintered stone samples',
    'Free on-site measurement at the customer’s home',
    'Fabrication and installation — stonemasons fitting a sintered stone worktop']],

  /* ===== index: CTA note (2×) ===== */
  ['h','.cta-note','No obligation · we’ll prepare your custom price estimate, usually within 24 hours'],

  /* ===== index: FAQ ===== */
  ['h','#faq .section-head .eyebrow','Common questions'],
  ['h','#faq .section-head h2','What clients ask most often'],
  ['h','#faq .section-head p','Can’t find your answer here? Write to us or call — we’re happy to help.'],
  ['t','.faq-item summary',[
    'How much does a sintered stone worktop cost?',
    'Is the estimate binding? Will extra charges appear later?',
    'Do you also do the installation?',
    'How does sintered stone differ from engineered stone or Dekton?',
    'Can it take a hot pot and cutting?',
    'Where can I see the material in person?']],
  ['h','.faq-item .faq-a',[
    'It depends on the decor, the amount of material and the design of your project — so instead of one list price, we prepare a custom estimate. It takes 60 seconds in the configurator, and within 24 hours you’ll have it in your inbox, with no obligation.',
    'The estimate gives you a realistic range to decide with. You’ll receive an exact quote after a free on-site measurement — item by item, including cut-outs and edges, so you know in advance what you’re paying for.',
    'We don’t install directly. We supply the material, while fabrication and fitting are handled by experienced stonemasons we’ve worked with for years and who know this material well. The craftsmanship is what determines the result — so we don’t leave it to chance.',
    'Engineered stone (quartz) is held together by resins. Sintered stone is made purely of minerals, pressure and heat — no resins, no plastics. In practice this means higher heat and UV resistance and a surface that never needs sealing. Dekton is a brand name for the same type of material from another manufacturer.',
    'You can place a hot pot or pan directly on the worktop. The surface is highly scratch-resistant — everyday use won’t damage it. We recommend a cutting board more for the sake of your knives than the worktop.',
    'In our showroom in a Renaissance manor in Bošany — you can see and touch the decors and full-size slabs in person.']],

  /* ===== index: Aplikácie ===== */
  ['h','.apps-head .eyebrow','Versatile applications'],
  ['h','.apps-head h2','One stone. The whole kitchen.'],
  ['h','.apps-head p','The same sintered stone handles the entire space — worktop, splashback, island and its side panels.'],
  ['a','.apps-bg','alt','Kitchen in Taj Mahal sintered stone — worktop, island and splashback'],
  ['a','.corner-img','alt',[
    'Kitchen island in sintered stone',
    'Kitchen worktop and splashback in sintered stone']],
  ['h','.pin-card',['Island','Island side panel','Worktop','Splashback']],

  /* ===== index: Recenzie ===== */
  ['h','.tm-head .eyebrow','What clients say'],
  ['h','.tm-head h2','Customers who already have their worktop'],
  ['h','.tm-head p','Real projects, real people — rated 5.0 ★ on Google.'],
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
    '“We were looking for something special for our new kitchen, and Roman Travertine from Orostone was love at first sight. The whole process — from choosing the decor through measurement to installation — went completely smoothly.”',
    '“We were choosing stone for a modern kitchen and Arden Gold won us over with its texture and warm tone. We reached out to Orostone on a recommendation and haven’t regretted it for a second.”',
    '“The Orostone team was very professional — they explained everything in detail and gave us honest advice. Installation was quick and the result exceeded our expectations. Highly recommended!”',
    '“The surface looks luxurious, is easy to look after and fits our interior perfectly. Thank you for a job well done.”']],
  ['h','.tmc .who b',['Lucia & Tomáš','Marek','Petra','Ján']],
  ['h','.tmc .who small',['Interior stylist & IT analyst','Lawyer, Bratislava','Architect','Entrepreneur']],

  /* ===== index: Risk-reversal ===== */
  ['h','.risk .item b',[
    'Revives an older kitchen','Perfect for a new build',
    'Designed for real life','Premium look. Practical every day.']],
  ['h','.risk .item > span:last-child',[
    'We can replace your worktop without replacing the whole kitchen.',
    'Worktops, islands and splashbacks in one coordinated material.',
    'Resistant to heat, stains and everyday use.',
    'A slim 12 mm profile and clean lines for a modern interior.']],

  /* ===== index: Final CTA ===== */
  ['h','.finalcta .eyebrow','Next step'],
  ['h','.finalcta h2','Find out what your worktop would cost'],
  ['h','.finalcta .band > p','Tell us about your project in 60 seconds and we’ll prepare a custom price estimate. No obligation, usually within 24 hours.'],

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
  ['h','.foot-contact b',['Showroom','Phone','E-mail','Address']],
  ['h','.foot-contact a[href^="https://rkb"]','Renaissance manor, Bošany'],
  ['t','.fb-left','© 2026 Orostone · Sintered stone'],
  ['h','.foot-legal a',['Privacy policy','Terms & conditions','Cookie settings']],

  /* ===== index: sticky lišta ===== */
  ['a','#stickyBar','aria-label','Get a price estimate'],
  ['h','.sticky-txt','<b>Price estimate</b><span>usually within 24 hours</span>'],
  ['t','.sticky-btn','Get it '],

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
  ['h','.qstep[data-step="1"] .q-sub','Select all that apply — combinations are welcome. You can always add more later.'],
  ['a','.opts[data-key="aplikacia"]','aria-label','What can we help you with'],
  ['h','.opts[data-key="aplikacia"] .opt .tx b',[
    'Kitchen worktop','Kitchen island','Kitchen splashback','Bathroom or another space']],
  ['h','.opts[data-key="aplikacia"] .opt .tx small',[
    'The most common project','Including waterfall edges','Seamless, one-piece surface','Washbasin, cladding or another project']],
  ['h','#optOther label','What exactly do you need? <span class="opt-tag">optional</span>'],
  ['a','#in-other','placeholder','E.g. bathroom cladding, stairs, a fireplace, a dining table…'],
  ['h','#q1next','Continue'],
  ['h','.qstep[data-step="2"] .q-label','Decor direction'],
  ['h','.qstep[data-step="2"] .q','Which direction appeals to you?'],
  ['h','.qstep[data-step="2"] .q-sub','It’s not a binding choice — it just gives us a feel for your taste.'],
  ['h','.decor .cap small',[
    'Pure white','Soft white','White marble','White marble','Dramatic marble','Cream marble',
    'Warm travertine','Grey stone','Warm gold','Bold dark','Dark gold','Black marble']],
  ['a','.decor img','alt',[
    'Super White Extra — pure white','Yabo White — soft white','Statuario Diamante — white marble',
    'Calacatta Top — white marble','Appennino — dramatic marble','Taj Mahal — cream marble',
    'Roman Travertine — warm travertine','Astrana Grey — grey stone','Givenchy Gold — warm gold',
    'Wild Forest — bold dark','Gothic Gold — dark gold','Nero Margiua — black marble']],
  ['h','.decor.wide .tx b','I can’t decide — help me choose'],
  ['h','.decor.wide .tx small','We’ll recommend decors to suit your kitchen'],
  ['h','.qstep[data-step="3"] .q-label','Timing'],
  ['h','.qstep[data-step="3"] .q','When are you planning it?'],
  ['h','.qstep[data-step="3"] .q-sub','This tells us how quickly we should get back to you.'],
  ['h','.opts[data-key="termin"] .opt .tx b',['As soon as possible','In 1–3 months','Just looking for now']],
  ['h','.opts[data-key="termin"] .opt .tx small',['Within 1 month','It’s in the works','I want a price estimate']],
  ['h','.qstep[data-step="4"] .q-label','Last step'],
  ['h','.qstep[data-step="4"] .q','Where should we send your price?'],
  ['h','.qstep[data-step="4"] .q-sub','We’ll prepare a <b style="color:var(--light);font-weight:600">custom price estimate</b> and get back to you with no obligation — usually within 24 hours.'],
  ['h','#f-name label','Name'],
  ['a','#in-name','placeholder','E.g. Jane Smith'],
  ['h','#f-name .msg','Please enter your name.'],
  ['h','#f-email label','E-mail'],
  ['a','#in-email','placeholder','jane@email.com'],
  ['h','#f-email .msg','Please enter a valid e-mail address.'],
  ['h','#f-phone label','Phone <span class="opt-tag">· recommended, speeds up your estimate</span>'],
  ['h','#f-phone .msg','Please check the phone number.'],
  ['h','#f-consent > span','I agree that Orostone may contact me about my project. No obligation, no spam.'],
  ['t','#leadForm button[type="submit"]','Get my price estimate '],
  ['t','#leadForm .reassure',' No obligation · We never share your details'],

  /* ===== dakujeme.html ===== */
  ['h','.ty .eyebrow','Request received'],
  ['h','.ty > p','We’ll get back to you, usually within 24 hours, to confirm the details and send your custom price estimate.'],
  ['h','.ty .next li > span:last-child',[
    'We’ll contact you to confirm the dimensions, decor and thickness.',
    'We’ll prepare your <b>price estimate</b> and arrange a free on-site measurement.',
    'You can also see the slabs in person at our showroom in Bošany.']],
  ['t','.ty .reassure',' In a hurry? Call '],
  ['h','.ty .visit p','While we prepare your price, take a look at our decors and completed projects.'],
  ['t','.ty .visit .cta','Visit orostone.sk '],
  ['h','.backlink','← Back to the worktop page'],
  ['h','.foot-in > span','© Orostone — sintered stone for kitchens and interiors'],
  ['t','.foot-in > a','Call us: 0917 588 738'],
  ['a','.foot-in > a','aria-label','Call us on 0917 588 738']
];

/* title + meta description (SK originály sa odložia pri štarte) */
var META_EN = document.getElementById('leadForm')
  ? {title:'Orostone — Sintered Stone Worktops | Custom Price Estimate',
     desc:'Answer 4 short questions in 60 seconds and we’ll prepare a custom price estimate for your sintered stone worktop — usually within 24 hours, no obligation. Real projects, showroom in Bošany.'}
  : {title:'Thank you — we’re preparing your price | Orostone',
     desc:'Thank you for your enquiry. We’ll prepare a custom price estimate and get back to you, usually within 24 hours.'};

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

/* rotujúci hero badge (SVG textPath) — EN texty sú dlhšie, preto menšie písmo */
var badgeOrig=null;
function heroBadge(lang){
  var tps=document.querySelectorAll('.hero-badge textPath');
  if(tps.length<2)return;
  var t1=tps[0].parentNode,t2=tps[1].parentNode;
  if(!badgeOrig)badgeOrig={
    a:tps[0].textContent,b:tps[1].textContent,
    fs1:t1.getAttribute('font-size'),ls1:t1.getAttribute('letter-spacing'),
    fs2:t2.getAttribute('font-size'),ls2:t2.getAttribute('letter-spacing')};
  if(lang==='en'){
    tps[0].textContent='BEAUTY OF STONE';tps[1].textContent='POWER OF TECHNOLOGY';
    t1.setAttribute('font-size','9.5');t1.setAttribute('letter-spacing','1.6');
    t2.setAttribute('font-size','9.5');t2.setAttribute('letter-spacing','1.6');
  }else{
    tps[0].textContent=badgeOrig.a;tps[1].textContent=badgeOrig.b;
    function put(el,n,v){v==null?el.removeAttribute(n):el.setAttribute(n,v);}
    put(t1,'font-size',badgeOrig.fs1);put(t1,'letter-spacing',badgeOrig.ls1);
    put(t2,'font-size',badgeOrig.fs2);put(t2,'letter-spacing',badgeOrig.ls2);
  }
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

/* rotujúci footer badge (rovnaký slogan ako hero) — EN texty dlhšie, menšie písmo */
var footBadgeOrig=null;
function footBadge(lang){
  var tps=document.querySelectorAll('.foot-badge textPath');
  if(tps.length<2)return;
  var t1=tps[0].parentNode,t2=tps[1].parentNode;
  if(!footBadgeOrig)footBadgeOrig={
    a:tps[0].textContent,b:tps[1].textContent,
    fs1:t1.getAttribute('font-size'),ls1:t1.getAttribute('letter-spacing'),
    fs2:t2.getAttribute('font-size'),ls2:t2.getAttribute('letter-spacing')};
  if(lang==='en'){
    tps[0].textContent='BEAUTY OF STONE';tps[1].textContent='POWER OF TECHNOLOGY';
    t1.setAttribute('font-size','9.5');t1.setAttribute('letter-spacing','1.6');
    t2.setAttribute('font-size','9.5');t2.setAttribute('letter-spacing','1.6');
  }else{
    tps[0].textContent=footBadgeOrig.a;tps[1].textContent=footBadgeOrig.b;
    function put(el,n,v){v==null?el.removeAttribute(n):el.setAttribute(n,v);}
    put(t1,'font-size',footBadgeOrig.fs1);put(t1,'letter-spacing',footBadgeOrig.ls1);
    put(t2,'font-size',footBadgeOrig.fs2);put(t2,'letter-spacing',footBadgeOrig.ls2);
  }
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
    p.innerHTML='We use cookies to measure traffic and ad performance (Google Analytics, Meta Pixel). Click Decline to opt out — you can change your choice at any time. <a href="https://orostone.sk/ochrana-sukromia" target="_blank" rel="noopener">Privacy policy</a>';
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
    ?('Thank you'+(fn?', '+fn:'')+' — we’re preparing your price.')
    :('Ďakujeme'+(fn?', '+fn:'')+' — pripravujeme vašu cenu.');
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

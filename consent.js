/* ============================================================
   OROSTONE · cookie lišta + Google Consent Mode v2 + Meta Pixel consent
   ------------------------------------------------------------
   MUSÍ sa načítať synchrónne PRED pixelovým a GA blokom (prvý <script> v <head>).
   Zdieľané index.html aj dakujeme.html — jedna logika, jeden stav.

   REŽIM: OPT-OUT (vedomé rozhodnutie majiteľa 2026-07-10, na vlastnú
   zodpovednosť — nie je to strict-GDPR opt-in!). Tracking beží HNEĎ od
   načítania; „Odmietnuť" ho vypne od toho momentu ďalej (uložené natrvalo).

   Stav: localStorage 'os_consent' = 'granted' | 'denied' (nič = beží default).
   ============================================================ */
/* jazyk stránky (SK default; EN cez ?lang=en alebo uložená voľba) — zdieľané s i18n.js.
   Žije tu, lebo consent.js je prvý skript na oboch stránkach a lišta sa kreslí v správnom jazyku. */
window.OS_LANG=(function(){
  var l='sk';
  try{
    var m=location.search.match(/[?&]lang=(en|sk)\b/);
    if(m){l=m[1];localStorage.setItem('os_lang',l);}
    else if(localStorage.getItem('os_lang')==='en')l='en';
  }catch(e){}
  return l;
})();

(function(){
  var KEY='os_consent', state=null;
  try{state=localStorage.getItem(KEY);}catch(e){}
  if(state!=='granted'&&state!=='denied')state=null;

  /* --- Google Consent Mode v2: default GRANTED (opt-out); denied len ak
         návštevník už skôr klikol Odmietnuť --- */
  window.dataLayer=window.dataLayer||[];
  window.gtag=window.gtag||function(){dataLayer.push(arguments);};
  var G={ad_storage:'granted',ad_user_data:'granted',ad_personalization:'granted',analytics_storage:'granted'};
  var D={ad_storage:'denied', ad_user_data:'denied', ad_personalization:'denied', analytics_storage:'denied'};
  gtag('consent','default', state==='denied'?D:G);
  gtag('set','url_passthrough',true);

  /* --- best-effort výmaz meracích cookies pri Odmietnutí --- */
  function wipeCookies(){
    var names=document.cookie.split(';').map(function(c){return c.split('=')[0].trim()});
    var hosts=[location.hostname, '.'+location.hostname.split('.').slice(-2).join('.')];
    names.forEach(function(n){
      if(!/^(_ga|_gid|_gat|_fbp|_fbc)/.test(n))return;
      hosts.forEach(function(h){
        document.cookie=n+'=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain='+h;
        document.cookie=n+'=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
      });
    });
  }

  /* --- verejné API: OS_CONSENT.onGrant(cb) volajú pixel bloky.
         V opt-out režime beží callback HNEĎ, pokiaľ nie je stav 'denied'. --- */
  var q=[];
  function flush(){var f=q;q=[];for(var i=0;i<f.length;i++){try{f[i]();}catch(e){}}}
  window.OS_CONSENT={
    state:state,
    mode:'opt-out',
    onGrant:function(cb){state==='denied'?q.push(cb):cb();},
    decide:function(granted){
      state=granted?'granted':'denied';
      window.OS_CONSENT.state=state;
      try{localStorage.setItem(KEY,state);}catch(e){}
      if(granted){
        gtag('consent','update',G);
        if(window.fbq)fbq('consent','grant');
        flush();
      }else{
        gtag('consent','update',D);
        if(window.fbq)fbq('consent','revoke');
        wipeCookies();
      }
      hide();
    },
    open:function(){show(true);}
  };

  /* ---------------- cookie lišta (dizajn = stone editorial LP) ---------------- */
  var el=null;
  function hide(){if(el){el.remove();el=null;}}
  function show(force){
    if(el)return;
    if(state!==null&&!force)return;
    el=document.createElement('div');
    el.id='os-cookiebar';
    el.setAttribute('role','dialog');
    el.setAttribute('aria-label','Cookies');
    el.setAttribute('aria-live','polite');
    el.innerHTML=
      '<style>'+
      '#os-cookiebar{position:fixed;left:0;right:0;bottom:0;z-index:99999;background:#1A1A1A;'+
        'border-top:1px solid rgba(236,212,136,.28);color:#F9F9F7;'+
        'font-family:Montserrat,Arial,sans-serif;'+
        'padding:16px 20px calc(16px + env(safe-area-inset-bottom,0px)) 20px;'+
        'box-shadow:0 -12px 34px rgba(0,0,0,.45)}'+
      '#os-cookiebar .cb-in{max-width:1180px;margin:0 auto;display:flex;align-items:center;gap:22px;flex-wrap:wrap}'+
      '#os-cookiebar p{margin:0;flex:1 1 340px;font-size:13px;font-weight:300;line-height:1.55;color:rgba(249,249,247,.78)}'+
      '#os-cookiebar a{color:#ECD488;text-decoration:underline;text-underline-offset:2px}'+
      '#os-cookiebar .cb-btns{display:flex;gap:10px;flex:0 0 auto}'+
      '#os-cookiebar button{cursor:pointer;font-family:inherit;font-size:11px;font-weight:700;'+
        'letter-spacing:.12em;text-transform:uppercase;border-radius:10px;padding:13px 20px;'+
        'transition:opacity .15s ease}'+
      '#os-cookiebar button:hover{opacity:.85}'+
      '#os-cookiebar .cb-yes{background:#ECD488;color:#1A1A1A;border:1px solid #ECD488}'+
      '#os-cookiebar .cb-no{background:transparent;color:#F9F9F7;border:1px solid rgba(249,249,247,.35)}'+
      '@media(max-width:560px){#os-cookiebar .cb-btns{flex:1 1 100%}'+
        '#os-cookiebar button{flex:1;padding:14px 10px}}'+
      '</style>'+
      '<div class="cb-in">'+
        (window.OS_LANG==='en'
          ?'<p>We use cookies to measure traffic and ad performance (Google&nbsp;Analytics, Meta&nbsp;Pixel). '+
           'Click Decline to turn them off at any time. '+
           '<a href="https://orostone.sk/ochrana-sukromia" target="_blank" rel="noopener">Privacy policy</a></p>'+
           '<div class="cb-btns">'+
             '<button type="button" class="cb-no">Decline</button>'+
             '<button type="button" class="cb-yes">OK</button>'+
           '</div>'
          :'<p>Používame cookies na meranie návštevnosti a výkonu reklám (Google&nbsp;Analytics, Meta&nbsp;Pixel). '+
           'Kliknutím na Odmietnuť ich kedykoľvek vypnete. '+
           '<a href="https://orostone.sk/ochrana-sukromia" target="_blank" rel="noopener">Ochrana osobných údajov</a></p>'+
           '<div class="cb-btns">'+
             '<button type="button" class="cb-no">Odmietnuť</button>'+
             '<button type="button" class="cb-yes">V poriadku</button>'+
           '</div>')+
      '</div>';
    document.body.appendChild(el);
    el.querySelector('.cb-yes').addEventListener('click',function(){window.OS_CONSENT.decide(true);});
    el.querySelector('.cb-no').addEventListener('click',function(){window.OS_CONSENT.decide(false);});
  }
  if(document.body){show();}
  else document.addEventListener('DOMContentLoaded',function(){show();});
})();

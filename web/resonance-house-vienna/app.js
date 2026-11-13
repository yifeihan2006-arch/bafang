import { start,end,last,showDate,dates,nights,validDates,rooms,roomBy,plans,events,eventBy,venues,rehearsals,rehearsalBy,roomSlot,mealSlot,practiceSlot,mealTime,weekendPrice,extraPrice,fees,remaining } from './data.js';
const root=document.querySelector('#site');
const siteBase=new URL('.',import.meta.url).pathname;
const path='/'+location.pathname.slice(siteBase.length).replace(/\/$/,'');
const siteHref=url=>url.startsWith('/')?siteBase+url.slice(1):url;
const apiBase='https://api-v2.appdeploy.ai/app/resonance-house-vienna-dpzb5e';
const query=new URLSearchParams(location.search);
let de=false;
try{de=localStorage.getItem('rhv-language')==='de';}catch{}
const t=(en,german)=>de?german:en;
const tr=items=>items[de?1:0];
const locale=()=>t('en-IE','de-AT');
const money=n=>new Intl.NumberFormat(locale(),{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n);
const date=d=>new Intl.DateTimeFormat(t('en-GB','de-AT'),{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(d+'T00:00:00Z'));
const guests=n=>n+' '+t(n===1?'guest':'guests',n===1?'Gast':'Gäste');
const activePlan=id=>plans.find(p=>p.id===id);
const stay={kind:'stay',step:0,a:start,b:end,guests:2,room:roomBy(query.get('room'))?.id||'',access:false,plan:activePlan(query.get('plan'))?.id||'',event:'',count:2,practice:'',extra:''};
const ticket={kind:'tickets',step:0,event:'',count:1};
const dine={kind:'dine',step:0,venue:'restaurant',date:showDate,time:'18:00',guests:2};
let used={}, error='', fail=false, busy=false, openMenu=false, floor='G', programme=showDate, receipt=null, waitRef='';
const pending=new Map();
const navs=[
 ['/','Home','Start'],['/rooms','Rooms','Zimmer'],['/music-culture','Music & Culture','Musik & Kultur'],
 ['/dine','Dine','Kulinarik'],['/location','Location','Lage'],['/explore-in-3d','Explore in 3D','3D-Rundgang'],['/booking','Booking','Buchung']
];
const esc=value=>String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const badge='<span class="badge">Demo</span>';
function linkIcon(url) {
  let direction = 'next';
  if (url.startsWith('#')) direction = 'down';
  else if (/^https?:\/\//.test(url)) direction = 'external';
  else if (url === '/') direction = 'back';
  return `<span class="link-icon link-icon--${direction}" aria-hidden="true"></span>`;
}
const link=(url,words,cls='button',mark=true)=>`<a class="${cls}" href="${siteHref(url)}">${words}${mark ? linkIcon(url) : ''}</a>`;
const button=(action,words,cls='button',value='',disabled=false)=>`<button type="button" class="${cls}" data-action="${action}" data-value="${value}"${disabled?' disabled':''}>${words}</button>`;
const img=(key,alt='',eager=false)=>`<img src="${siteHref('/assets/'+key+'.webp')}" alt="${esc(alt)}" ${eager?'fetchpriority="high"':'loading="lazy"'}>`;
const book=()=>t('Book Your Stay','Aufenthalt buchen');
const music=()=>t('Explore Music &amp; Culture','Musik &amp; Kultur entdecken');
const reserve=()=>t('Reserve a Table','Tisch reservieren');
const demo=()=>t('Hotel development concept · Classroom demo','Hotelentwicklungskonzept · Unterrichtsdemo');
const brand=()=>`<a class="brand" href="${siteHref('/')}" aria-label="Resonance House Vienna"><img src="${siteHref('/assets/mark.png')}" alt="" width="48" height="40"><span>Resonance House<small>VIENNA</small></span></a>`;
const header=()=>`<a href="#main" class="skip">${t('Skip to content','Zum Inhalt')}</a><header class="head"><div class="bar">${brand()}
 <nav class="nav${openMenu?' open':''}" id="nav" aria-label="${t('Main navigation','Hauptnavigation')}">${navs.map(([url,en,german])=>`<a href="${siteHref(url)}"${path===url?' aria-current="page"':''}>${t(en,german)}</a>`).join('')}</nav>
 <div class="bar-actions">${link('/booking',t('Book','Buchen'),'button gold',false)}<button class="icon" data-action="language" aria-label="${t('Switch to German','Auf Englisch umschalten')}">${t('DE','EN')}</button><button class="icon menu" data-action="menu" aria-label="${t('Menu','Menü')}" aria-controls="nav" aria-expanded="${openMenu}"><span class="menu-icon" aria-hidden="true"></span></button></div></div></header>`;
const footer=()=>`<footer class="footer"><div class="wrap"><div class="foot-grid"><div>${brand()}<p>MUSIC TRANSCENDS BORDERS<br>共鳴音樂酒店</p></div>
 <div><strong>${t('PROPOSED LOCATION','GEPLANTER STANDORT')}</strong><p>Ausstellungsstraße · Messe–Prater<br>Leopoldstadt, ${t('Vienna, Austria','Wien, Österreich')}</p></div>
 <div><strong>${t('VISIT & BOOK','BESUCH & BUCHUNG')}</strong><p><a href="${siteHref('/booking')}">${book()}</a><br><a href="${siteHref('/music-culture')}">${t('Event tickets','Veranstaltungskarten')}</a><br><a href="${siteHref('/dine#reserve')}">${reserve()}</a></p></div></div>
 <p class="foot-bottom">${demo()} · ${t('Planned four-star positioning. Plot, classification and opening date pending.','Vier-Sterne-Positionierung geplant. Grundstück, Klassifizierung und Eröffnungstermin stehen noch aus.')}</p></div></footer>`;
const sectionHead=(tag,title,copy='')=>`<div class="section-head"><span class="eyebrow">${tag}</span><h2>${title}</h2>${copy?`<p>${copy}</p>`:''}</div>`;
const mast=(tag,title,copy,photo='',action='')=>`<section class="mast ${photo?'has-photo':'short'}">${photo?img(photo,'',true):''}<div class="wrap"><span class="eyebrow">${tag}</span><h1>${title}</h1><p>${copy}</p>${action?`<div class="actions">${action}</div>`:''}</div></section>`;
const card=(photo,title,copy,action,top='')=>`<article class="card">${img(photo)}<div class="card-body">${top}<h3>${title}</h3><p>${copy}</p>${action}</div></article>`;
const packages=()=>`<section class="compact on-dark"><div class="wrap" id="packages">${sectionHead(t('Accommodation + experiences','Übernachtung und Erlebnisse'),t('Stay packages','Aufenthaltspakete'))}
 <div class="cards">${plans.map(p=>card(p.img,p.name,tr(p.copy),link('/booking?plan='+p.id,t('Choose this package','Paket wählen')),badge)).join('')}</div></div></section>`;
const home=()=>`<section class="hero">${img('hero',t('Resonance House Vienna architectural rendering at dusk','Architekturvisualisierung von Resonance House Vienna in der Abenddämmerung'),true)}
 <div class="wrap"><span class="eyebrow">MUSIC TRANSCENDS BORDERS</span><h1>Resonance House <em>Vienna</em></h1><p>${t('An independent boutique hotel concept in Leopoldstadt, with quiet rooms and music you can discover at your own pace.','Ein unabhängiges Boutiquehotel-Konzept in der Leopoldstadt mit ruhigen Zimmern und Musik, die Sie in Ihrem eigenen Tempo entdecken können.')}</p>
 <div class="actions">${link('/booking',book(),'button gold')}${link('/music-culture',music(),'button light')}${link('/dine#reserve',reserve(),'button light')}</div></div><small class="caption">${t('Architectural concept rendering','Architekturvisualisierung')}</small></section>
 <section class="band"><div class="wrap"><p>${badge} &nbsp;${demo()}</p>${link('/booking?demo=1',t('Try the 50-second booking demo','Buchungsdemo in 50 Sekunden'),'link')}</div></section>
 <section class="section"><div class="wrap"><div class="intro"><div><span class="eyebrow">Leopoldstadt · ${t('Vienna','Wien')}</span><h2>${t('A house for music.<br>A room for quiet.','Ein Haus für Musik.<br>Ein Zimmer für Ruhe.')}</h2></div>
 <p class="lede">${t('Four guest floors take inspiration from piano, strings, winds and rhythm. A small stage, practice rooms and a listening library bring Vienna’s musical culture into conversation with instruments from around the world.','Vier Zimmeretagen greifen Klavier, Streicher, Bläser und Rhythmus auf. Eine kleine Bühne, Proberäume und eine Hörbibliothek bringen Wiener Musikkultur mit Instrumenten aus aller Welt ins Gespräch.')}</p></div>
 <div class="cards">${card('standard',t('Rooms','Zimmer'),t('Four room types across 120 planned rooms on the quiet side.','Vier Zimmertypen in 120 geplanten Zimmern auf der ruhigen Gebäudeseite.'),link('/rooms',t('View the rooms','Zimmer ansehen'),'link'))}
 ${card('concert',t('Music & Culture','Musik & Kultur'),t('Intimate performances, instrument encounters and workshops for first-time players.','Konzerte im kleinen Rahmen, Begegnungen mit Instrumenten und Workshops für Einsteiger.'),link('/music-culture',t('See the programme','Programm ansehen'),'link'))}
 ${card('day',t('Explore in 3D','3D-Rundgang'),t('See how the event wing, public spaces and quiet guest floors fit together.','Entdecken Sie Veranstaltungsflügel, öffentliche Räume und ruhige Zimmeretagen.'),link('/explore-in-3d',t('Start the tour','Rundgang öffnen'),'link'))}</div></div></section>
 <section class="compact cream"><div class="wrap split">${img('dining')}<div><span class="eyebrow">${t('Ground-floor café · L1 restaurant','Café im Erdgeschoss · Restaurant auf L1')}</span><h2>${t('At the table','Zu Tisch')}</h2><p class="lede">${t('Coffee downstairs, seasonal Austrian cooking upstairs. Both spaces welcome local visitors and hotel guests in the concept.','Unten Kaffee, oben österreichische Saisonküche. Beide Bereiche sind für Gäste aus Wien und Hotelgäste gedacht.')}</p><div class="actions">${link('/dine',t('Explore dining','Kulinarik entdecken'))}</div></div></div></section>${packages()}`;
const themes=()=>[
 ['L2','Piano','Klavier',t('Piano-key details and warm timber.','Klaviertastenmotive und warmes Holz.')],
 ['L3','Strings','Streicher',t('Fine lines inspired by string instruments.','Feine Linien, inspiriert von Streichinstrumenten.')],
 ['L4','Winds','Bläser',t('Brass accents and flowing forms.','Messingakzente und fließende Formen.')],
 ['L5','Rhythm','Rhythmus',t('Repeating patterns and tactile finishes.','Wiederkehrende Muster und fühlbare Oberflächen.')]
];
const roomsPage=()=>`${mast(t('120 planned guestrooms','120 geplante Gästezimmer'),t('Rooms','Zimmer'),t('Four room types across four music-inspired floors. Each floor has a mix of room types.','Vier Zimmertypen auf vier von Musik inspirierten Etagen. Jede Etage umfasst mehrere Zimmertypen.'),'superior')}
 <section class="section"><div class="wrap">${sectionHead(t('Room collection','Zimmerkollektion'),t('Find your room','Wählen Sie Ihr Zimmer'),t('Six accessible rooms are planned: four Standard and two Superior.','Sechs barrierefreie Zimmer sind geplant: vier Standard- und zwei Superior-Zimmer.'))}<div class="cards two">
 ${rooms.map(r=>`<article class="card">${img(r.id,tr(r.name))}<div class="card-body">${badge}<h3>${tr(r.name)}</h3><span class="spec">${t('Approx.','Ca.')} ${r.area} m² · ${r.cap} ${t('planned rooms','geplante Zimmer')} · ${t('Up to','Bis zu')} ${guests(r.max)}</span>
 <p>${tr(r.copy)} ${r.access?t(r.access+' planned accessible rooms.',r.access+' barrierefreie Zimmer geplant.'):''}</p><strong>${money(r.rate)} / ${t('night','Nacht')} · ${t('Demo rate','Demo-Preis')}</strong>${link('/booking?room='+r.id,t('Book this room','Dieses Zimmer buchen'))}</div></article>`).join('')}</div></div></section>
 <section class="compact cream"><div class="wrap">${sectionHead(t('Guestroom levels','Zimmeretagen'),t('Four floor themes','Vier Etagenmotive'),t('Each floor has 30 rooms and multiple room types.','Jede Etage hat 30 Zimmer verschiedener Typen.'))}
 <div class="theme-grid">${themes().map(([id,en,german,copy])=>`<article class="theme"><span class="eyebrow">${id}</span><h3>${t(en,german)}</h3><p>${copy}</p></article>`).join('')}</div></div></section>${packages()}`;
const available=n=>n>0?`<span class="avail">${n} ${t('available','verfügbar')}</span>`:`<span class="sold">${t('Sold out','Ausgebucht')}</span>`;
const eventWhen=e=>date(e.date)+' · '+e.time;
const eventMeta=e=>'EN / DE · '+e.minutes+' min · '+money(e.rate)+' / '+t('person','Person');
const musicPage=()=>`${mast(t('Live music in Leopoldstadt','Live-Musik in der Leopoldstadt'),t('Music & Culture','Musik & Kultur'),t('Small performances and hands-on encounters with instruments for local visitors and hotel guests.','Konzerte im kleinen Rahmen und praktische Begegnungen mit Instrumenten für Gäste aus Wien und Hotelgäste.'),'concert',link('#programme',t('See demo sessions','Demo-Termine ansehen'),'button gold'))}
 <section class="compact" id="programme"><div class="wrap">${sectionHead(t('Ground-floor event wing','Veranstaltungsflügel im Erdgeschoss'),t('Programme','Programm'),t('Demo programme in Vienna local time. The small performance hall is designed for 80 seats. Beginner workshops run for 45 minutes with about 12 participants.','Demo-Programm in Wiener Ortszeit. Der kleine Veranstaltungssaal ist für 80 Sitzplätze geplant. Einsteiger-Workshops dauern 45 Minuten und haben etwa 12 Teilnehmende.'))}
 ${networkNote()}<div class="tabs">${[...new Set(events.map(e=>e.date))].map(d=>`<button class="tab" data-action="programme" data-value="${d}" aria-pressed="${programme===d}">${date(d)}</button>`).join('')}</div>
 ${events.filter(e=>e.date===programme).map(e=>{const n=remaining(e,used);return `<article class="event-row"><div><span class="eyebrow">${e.type==='workshop'?'Workshop':t('Performance','Konzert')}</span><strong>${eventWhen(e)}</strong></div><div><h3>${tr(e.name)}</h3><p>${tr(e.copy)}</p></div><div>${badge}<p class="meta">${eventMeta(e)}<br>${e.cap} ${t(e.type==='workshop'?'places':'seats','Plätze')} · ${available(n)}</p></div>
 <div>${n?button('ticket-pick',t('Get tickets','Karten buchen'),'button',e.id):button('wait-pick',t('Demo waitlist','Demo-Warteliste'),'button outline',e.id)}</div></article>`;}).join('')}
 <div id="ticket-flow" class="flow">${ticket.step?ticketPanel():''}</div></div></section>
 <section class="compact cream"><div class="wrap split">${img('rehearsal')}<div><span class="eyebrow">${t('Beyond the stage','Abseits der Bühne')}</span><h2>${t('Exhibitions & rehearsals','Ausstellungen & Proben')}</h2><p class="lede">${t('A rotating exhibition introduces instruments from Vienna and other traditions. Four practice rooms are planned for bookable rehearsals. Exhibition dates and partnerships are pending.','Eine wechselnde Ausstellung stellt Instrumente aus Wien und anderen Traditionen vor. Vier Proberäume sind für buchbare Proben geplant. Ausstellungstermine und Kooperationen stehen noch aus.')}</p><div class="actions">${link('/booking?plan=artist','Artist Stay','button outline')}</div></div></div></section>`;
const dinePage=()=>`${mast(t('Café · Restaurant','Café · Restaurant'),t('Dine','Kulinarik'),t('Viennese coffee and Austrian cooking shaped by local ingredients.','Wiener Kaffee und österreichische Küche mit Zutaten aus der Region.'),'dining',link('#reserve',reserve(),'button gold'))}
 <section class="compact"><div class="wrap"><div class="cards two">
 ${card('lobby',tr(venues.cafe.name),t('Viennese-style coffee and a place to pause before a workshop or a walk.','Kaffee nach Wiener Art und ein Ort zum Verweilen vor einem Workshop oder Spaziergang.'),button('venue-pick',reserve(),'button outline','cafe'),'<span class="eyebrow">G</span>')}
 ${card('dining',tr(venues.restaurant.name),t('Seasonal cooking rooted in Austrian food culture.','Saisonale Küche nach österreichischer Tradition.'),button('venue-pick',reserve(),'button outline','restaurant'),`<span class="eyebrow">L1 · ${t('Approx. 90 seats','Ca. 90 Sitzplätze')}</span>`)}</div>
 <details><summary>${t('Sample menu','Beispielkarte')} &nbsp;${badge}</summary>${rows([
  row(t('Apple strudel with vanilla cream','Apfelstrudel mit Vanillecreme'),money(9)),row(t('Seasonal root vegetable soup','Suppe aus saisonalem Wurzelgemüse'),money(12)),
  row(t('Styrian pumpkin seed risotto','Risotto mit steirischen Kürbiskernen'),money(24)),row(t('Schnitzel with parsley potatoes','Schnitzel mit Petersilkartoffeln'),money(29))
 ])}</details></div></section><section id="reserve" class="compact cream"><div class="wrap"><div class="flow">${dinePanel()}</div></div></section>`;
const map='https://www.openstreetmap.org/?mlat=48.21778&amp;mlon=16.40368#map=17/48.21778/16.40368';
const locationPage=()=>`${mast(t('Vienna’s second district','Wiens zweiter Bezirk'),t('Location','Lage'),t('Proposed along Ausstellungsstraße near Messe–Prater U-Bahn in Leopoldstadt, Vienna.','Geplant an der Ausstellungsstraße bei der U-Bahn-Station Messe–Prater in der Wiener Leopoldstadt.'),'day')}
 <section class="section"><div class="wrap split"><div><span class="eyebrow">${t('Proposed search area','Geplanter Standortbereich')}</span><h2>Ausstellungsstraße</h2><p class="lede">${t('The map marks an entrance to Messe–Prater U-Bahn (U2) as the reference point. The plot, street address, opening date and walking times are pending.','Die Karte markiert einen Eingang der U-Bahn-Station Messe–Prater (U2) zur Orientierung. Grundstück, Adresse, Eröffnungstermin und Gehzeiten stehen noch aus.')}</p><div class="actions">${link(map,t('Open station map','Stationskarte öffnen'),'button outline')}</div></div>
 <iframe class="map" src="https://www.openstreetmap.org/export/embed.html?bbox=16.3975%2C48.2148%2C16.4137%2C48.2219&amp;layer=mapnik&amp;marker=48.21778%2C16.40368" loading="lazy" referrerpolicy="no-referrer" title="${t('Map showing Messe–Prater U-Bahn','Karte mit der U-Bahn-Station Messe–Prater')}"></iframe></div></section>`;
const floorDetails=()=>[
 ...themes().reverse().map(([id,en,german,copy])=>[id,t(en,german),t('30 guestrooms with a mix of room types. ','30 Gästezimmer mit verschiedenen Zimmertypen. ')+copy]),
 ['L1',t('Dining & listening','Restaurant & Hörbibliothek'),t('Restaurant with about 90 seats, meeting spaces and a quiet listening library.','Restaurant mit ca. 90 Sitzplätzen, Besprechungsräume und eine ruhige Hörbibliothek.')],
 ['G',t('Arrival & music','Ankunft & Musik'),t('Lobby, café, low-rise event wing, an approximately 80-seat performance hall, four practice rooms and a rotating instrument exhibition.','Lobby, Café, niedriger Veranstaltungsflügel, Saal mit ca. 80 Sitzplätzen, vier Proberäume und eine wechselnde Instrumentenausstellung.')],
 ['B1',t('Building services','Gebäudetechnik'),t('Mechanical and electrical services, storage, linen and back-of-house operations.','Haustechnik, Lager, Wäsche und betriebliche Nebenräume.')]
];
const floors=()=>{const items=floorDetails();const [,title,copy]=items.find(([id])=>id===floor);return `<div class="stack" aria-label="${t('Select a floor','Etage auswählen')}">${items.map(([id,name])=>`<button class="floor" data-action="floor" data-value="${id}" aria-pressed="${id===floor}"><b>${id}</b>${name}</button>`).join('')}</div><article class="floor-copy" aria-live="polite"><span class="eyebrow">${floor}</span><h3>${title}</h3><p>${copy}</p></article>`;};
const tourPage=()=>`${mast(t('Concept walkthrough','Virtueller Rundgang'),t('Explore in 3D','3D-Rundgang'),t('See the proposed hotel from the street and explore the spaces inside.','Sehen Sie das geplante Hotel von der Straße und erkunden Sie seine Räume.'),'day',link('#film',t('Watch the walkthrough','Rundgang ansehen'),'button gold'))}
 <section class="compact on-dark" id="film"><div class="wrap">${sectionHead(t('Manual playback','Manuelle Wiedergabe'),t('Hotel walkthrough','Hotelrundgang'),t('English and Chinese subtitles. Press play to start the film and its soundtrack.','Englische und chinesische Untertitel. Starten Sie Film und Tonspur per Wiedergabetaste.'))}
 <video class="video" controls playsinline preload="none" poster="${siteHref('/assets/day.webp')}" aria-label="${t('Hotel walkthrough film','Film zum Hotelrundgang')}"><source src="${siteHref('/assets/tour.mp4')}" type="video/mp4"></video><div class="actions">${link('/assets/tour.mp4',t('Open video file','Videodatei öffnen'),'link')}</div></div></section>
 <section class="section"><div class="wrap">${sectionHead(t('Concept floor section','Schematischer Gebäudeschnitt'),t('Explore the floors','Etagen erkunden'),t('About 10,400 m² of total gross floor area including B1. Select a level to see its uses.','Ca. 10.400 m² Bruttogeschossfläche inklusive B1. Wählen Sie eine Etage, um ihre Nutzung zu sehen.'))}<div class="floor-grid" id="floors">${floors()}</div></div></section>
 <section class="compact cream"><div class="wrap split">${img('day')}<div><span class="eyebrow">${t('Circulation & acoustics','Wegeführung & Akustik')}</span><h2>${t('A quieter guest wing','Ein ruhiger Zimmertrakt')}</h2>
 <p>${t('Hotel guests use the lobby and guest lifts. Event visitors use a separate entrance and ticket check in the low-rise wing. Staff and goods use back-of-house routes and a service lift.','Hotelgäste nutzen Lobby und Gästeaufzüge. Veranstaltungsbesucher nutzen einen separaten Eingang und die Kartenkontrolle im niedrigen Flügel. Personal und Waren nutzen Betriebswege und einen Serviceaufzug.')}</p>
 <p>${t('Guestrooms are set back towards the quiet side. A sound lock, vibration-isolated stage, silenced ducts and zoned ventilation are planned to reduce sound transfer.','Die Gästezimmer sind zur ruhigen Seite zurückversetzt. Schallschleuse, schwingungsisolierte Bühne, schallgedämpfte Kanäle und zonierte Lüftung sollen die Schallübertragung reduzieren.')}</p></div></div></section>`;

const noReal=()=>t('Demo confirmation — no booking or payment has been made.','Demo-Bestätigung — es wurde keine Buchung vorgenommen und keine Zahlung ausgelöst.');
const labels=()=>({
 dates:t('Choose valid dates in the demo calendar, with one to seven nights.','Wählen Sie gültige Daten im Demo-Kalender mit einer bis sieben Nächten.'),
 room:t('Choose an available room for your group.','Wählen Sie ein verfügbares Zimmer für Ihre Gruppe.'),
 plan:t('Choose a valid package.','Wählen Sie ein gültiges Paket.'),
 event:t('Choose an available session within your stay or switch to room only.','Wählen Sie einen verfügbaren Termin während Ihres Aufenthalts oder buchen Sie nur das Zimmer.'),
 quantity:t('The selected quantity is unavailable. Try a smaller group or another session.','Die gewünschte Anzahl ist nicht verfügbar. Wählen Sie eine kleinere Gruppe oder einen anderen Termin.'),
 practice:t('Choose an available rehearsal slot during your stay.','Wählen Sie einen verfügbaren Probentermin während Ihres Aufenthalts.'),
 meal:t('Choose a demo date and an available seating time.','Wählen Sie ein Demo-Datum und eine verfügbare Uhrzeit.'),
 availability:t('Availability changed. Choose another option or, for a stay, continue with room only.','Die Verfügbarkeit hat sich geändert. Wählen Sie eine andere Option oder buchen Sie nur das Zimmer.'),
 service:t('The demo service is temporarily unavailable. Please try again.','Der Demo-Dienst ist vorübergehend nicht verfügbar. Bitte versuchen Sie es erneut.'),
 request:t('This demo request could not be completed. Review your selection.','Diese Demo-Anfrage konnte nicht abgeschlossen werden. Prüfen Sie Ihre Auswahl.')
});
const err=()=>error?`<p class="error" role="alert">${labels()[error]||labels().request}</p>`:'';
const networkNote=()=>fail?`<p class="error" role="alert">${labels().service} ${button('reload-inventory',t('Retry','Erneut versuchen'),'link')}</p>`:'';
const heading=(title,copy='')=>`${badge}<h2 tabindex="-1">${title}</h2>${copy?`<p class="lede">${copy}</p>`:''}`;
const option=(v,label,selected,disabled=false)=>`<option value="${v}"${v===selected?' selected':''}${disabled?' disabled':''}>${esc(label)}</option>`;
const select=(name,label,options)=>`<label class="field">${label}<select name="${name}">${options}</select></label>`;
const dateInput=(name,label,value,max)=>`<label class="field">${label}<input type="date" name="${name}" value="${esc(value)}" min="${start}" max="${max}" required></label>`;
const countInput=(name,label,value,max)=>select(name,label,Array.from({length:max},(_,i)=>option(i+1,i+1,value)).join(''));
const choice=(name,v,current,title,desc,price,disabled=false,photo='')=>`<label class="choice"><input type="radio" name="${name}" value="${v}"${v===current?' checked':''}${disabled?' disabled':''}>${photo?img(photo):''}<span><strong>${title}</strong>${desc?`<small>${desc}</small>`:''}</span>${price?`<span class="choice-price">${price}</span>`:''}</label>`;
const actions=(primary,back='',backLabel=t('Back','Zurück'))=>`<div class="actions">${back?button(back,backLabel,'button outline'):''}${primary}</div>`;
const next=(action,words)=>button(action,words,'button gold','',busy);
const confirm=action=>next(action,busy?t('Checking availability…','Verfügbarkeit wird geprüft…'):t('Confirm demo','Demo bestätigen'));
const row=(k,v,grand=false)=>`<div${grand?' class="grand"':''}><dt>${k}</dt><dd>${v}</dd></div>`;
const rows=items=>`<dl class="totals">${items.filter(Boolean).join('')}</dl>`;
const feeRow=()=>row(t('Demo taxes and fees','Demo-Steuern und Gebühren'),money(fees));
const totalRow=total=>row(t('Demo total','Demo-Gesamtpreis'),money(total),true);
const demoGuest=()=>`<p class="note">${t('Demo guest: Classroom Visitor. No personal details are needed.','Demo-Gast: Unterrichtsbesuch. Persönliche Angaben sind nicht erforderlich.')}</p>`;
const terms=kind=>`<details open><summary>${t('Demo cancellation terms','Demo-Stornobedingungen')}</summary><p>${{
 stay:t('Example terms: free cancellation until 18:00 Vienna time one day before arrival. After that, the first night would be charged. The simulation incurs no charges.','Beispielbedingungen: Kostenlose Stornierung bis 18 Uhr Wiener Ortszeit am Vortag der Anreise. Danach würde die erste Nacht berechnet. In der Simulation fallen keine Kosten an.'),
 tickets:t('Example terms: free cancellation up to 24 hours before the session. The simulation incurs no charges.','Beispielbedingungen: Kostenlose Stornierung bis 24 Stunden vor Beginn. In der Simulation fallen keine Kosten an.'),
 dine:t('Example terms: cancel up to two hours before seating. The simulation incurs no charges.','Beispielbedingungen: Stornierung bis zwei Stunden vor dem Termin. In der Simulation fallen keine Kosten an.')
}[kind]}</p></details>`;
const success=(kind,summary,restart)=>`${heading(kind==='waitlist'?t('Demo waitlist saved','Demo-Warteliste gespeichert'):t('Demo confirmation','Demo-Bestätigung'),noReal())}<p class="reference">${t('Demo reference','Demo-Referenz')} ${esc(receipt.reference)}</p>${summary}${actions(restart+link('/',t('Back to home','Zur Startseite'),'button outline'))}`;
const freeRoom=r=>stay.guests<=r.max&&(stay.access?r.access:r.cap-r.access)>0&&nights(stay.a,stay.b).every(d=>(used[roomSlot(r.id,d,stay.access)]||0)<(stay.access?r.access:r.cap-r.access));
const freeMeal=(venue,d,time)=>Math.max(0,venues[venue].cap-(used[mealSlot(venue,d,time)]||0));
const freePractice=p=>p.cap-(used[practiceSlot(p.id)]||0);
const inStay=d=>stay.a<=d&&d<stay.b;
const stayEvents=()=>events.filter(e=>inStay(e.date)&&(stay.plan==='weekend'?e.type==='concert':stay.plan==='discover'?e.type==='workshop':true));
const roomDates=()=>`${heading(t('Dates & guests','Daten & Gäste'),t('Classroom dates and two guests are prefilled. Adjust them to explore the demo calendar.','Die Unterrichtsdaten und zwei Gäste sind vorausgefüllt. Ändern Sie die Auswahl, um den Demo-Kalender zu erkunden.'))}
 ${stay.plan||stay.room?`<p class="note">${stay.plan?activePlan(stay.plan).name:tr(roomBy(stay.room).name)}</p>`:''}
 <div class="fields">${dateInput('a',t('Check-in','Anreise'),stay.a,dates.at(-1))}${dateInput('b',t('Check-out','Abreise'),stay.b,last)}${countInput('guests',t('Number of guests','Anzahl der Gäste'),stay.guests,4)}</div>
 <label class="check"><input type="checkbox" name="access"${stay.access?' checked':''}>${t('Show accessible room options','Barrierefreie Zimmer anzeigen')}</label>
 ${err()}${actions(next('stay-next',t('Choose a room','Zimmer wählen')))}`;
const roomChoices=()=>`${heading(t('Choose your room','Wählen Sie Ihr Zimmer'),date(stay.a)+' – '+date(stay.b)+' · '+guests(stay.guests))}
 <div class="choices">${rooms.map(r=>choice('room',r.id,stay.room,tr(r.name),r.area+' m² · '+t('Up to','Bis zu')+' '+guests(r.max)+(freeRoom(r)?'':' · '+t('Unavailable for this selection','Für diese Auswahl nicht verfügbar')),money(r.rate)+' / '+t('night','Nacht')+'<br>'+badge,!freeRoom(r),r.id)).join('')}</div>
 ${err()}${actions(next('stay-next',t('Continue to music','Weiter zu Musik')),'stay-back')}`;
const artistOptions=()=>{
 const list=rehearsals.filter(p=>inStay(p.date));
 const options=(key)=>option('',key==='extra'?t('No extra rehearsal','Keine Zusatzprobe'):t('Select a time','Uhrzeit auswählen'),stay[key])+list.filter(p=>key==='practice'||p.id!==stay.practice).map(p=>option(p.id,date(p.date)+' · '+p.time+' · '+(freePractice(p)>0?t('Demo available','Demo verfügbar'):t('Sold out','Ausgebucht')),stay[key],freePractice(p)<1)).join('');
 return `<p class="note">${t('Demo equipment: digital piano, music stands and chairs. Bring other instruments. Each rehearsal is 45 minutes, one room per party. Check in at the event desk and finish within your slot.','Demo-Ausstattung: Digitalpiano, Notenständer und Stühle. Andere Instrumente bitte mitbringen. Pro Termin stehen 45 Minuten und ein Raum pro Gruppe zur Verfügung. Melden Sie sich am Veranstaltungsschalter und beenden Sie die Probe pünktlich.')}</p><div class="fields two">${select('practice',t('Included rehearsal','Inklusive Probe'),options('practice'))}${select('extra',t('Optional extra rehearsal','Optionale Zusatzprobe')+' · '+money(extraPrice),options('extra'))}</div>`;
};
const musicChoices=()=>{
 const plan=activePlan(stay.plan),weekend=stay.plan==='weekend';
 const list=stayEvents();
 const ticketChoices=list.map(e=>{
  const n=remaining(e,used),needed=weekend?stay.guests:stay.count;
  const hasMeal=!weekend||freeMeal('restaurant',e.date,mealTime(e))>=stay.guests;
  return '<div>'+choice('event',e.id,stay.event,tr(e.name),eventWhen(e)+' · EN / DE · '+e.minutes+' min · '+available(n)+(weekend?' · '+tr(venues.restaurant.name)+' '+mealTime(e):''),money(weekend?weekendPrice:e.rate)+' / '+t('person','Person')+'<br>'+badge,n<needed||!hasMeal)+(n<needed?button('stay-wait',t('Join demo waitlist','Demo-Warteliste wählen'),'link',e.id,busy):!hasMeal?`<span class="sold meta">${t('Linked restaurant seating unavailable','Zugehöriger Restauranttermin ausgebucht')}</span>`:'')+'</div>';
 }).join('');
 return `${heading(t('Music & extras','Musik & Extras'),plan?tr(plan.copy):t('Add a music experience during your stay or continue with room only.','Fügen Sie ein Musikerlebnis hinzu oder buchen Sie nur das Zimmer.'))}
 ${waitRef?`<p class="note" role="status">${noReal()} ${t('Demo waitlist reference','Demo-Wartelistenreferenz')} ${esc(waitRef)}</p>`:''}
 ${plan?`<div class="actions">${button('room-only',t('Switch to room only','Nur Zimmer buchen'),'button outline')}</div>`:''}
 ${stay.plan==='artist'?artistOptions():`
 ${weekend?'':`<div class="fields two">${countInput('count',t('Participants if adding an activity','Teilnehmende bei einer Zusatzaktivität'),stay.count,stay.guests)}</div>`}
 <div class="choices">${weekend?'':choice('event','',stay.event,t('Room only','Nur Zimmer'),'','')}${ticketChoices}</div>
 ${!list.length?`<p class="note">${t('No scheduled sessions for these demo dates.','Für diesen Demo-Zeitraum sind keine Termine geplant.')}</p>`:''}`}
 ${err()}${actions(next('stay-next',t('Review your stay','Aufenthalt prüfen')),'stay-back')}`;
};
const staySummary=()=>{
 const n=nights(stay.a,stay.b).length,r=roomBy(stay.room),e=eventBy(stay.event),p=rehearsalBy(stay.practice),x=rehearsalBy(stay.extra);
 const plan=activePlan(stay.plan),meal=stay.plan==='weekend'&&e;
 const eventPrice=e?(meal?weekendPrice:e.rate):0;
 return `<p class="lede">${date(stay.a)} – ${date(stay.b)} · ${guests(stay.guests)}${plan&&(e||p)?' · '+plan.name:''}</p>`+rows([
  row(tr(r.name)+(stay.access?' · '+t('Accessible','Barrierefrei'):'')+' · '+n+' '+t(n===1?'night':'nights',n===1?'Nacht':'Nächte')+' × '+money(r.rate),money(r.rate*n)),
  e?row(tr(e.name)+' · '+eventWhen(e)+' · '+stay.count+' × '+money(eventPrice),money(stay.count*eventPrice)):null,
  meal?row(tr(venues.restaurant.name)+' · '+date(e.date)+' · '+mealTime(e),t('Included','Inklusive')):null,
  p?row(t('Rehearsal','Probe')+' · '+date(p.date)+' · '+p.time,t('Included','Inklusive')):null,
  x?row(t('Extra rehearsal','Zusatzprobe')+' · '+date(x.date)+' · '+x.time,money(extraPrice)):null,
  !e&&!p?row(t('Music activities','Musikaktivitäten'),t('Room only','Nur Zimmer')):null,
  feeRow(),totalRow(r.rate*n+stay.count*eventPrice+(x?extraPrice:0)+fees)
 ]);
};
const bookingPanel=()=>{
 const steps=[t('Dates & guests','Daten & Gäste'),t('Room','Zimmer'),t('Music & extras','Musik & Extras'),t('Review','Prüfen'),t('Confirm','Bestätigen')];
 const content=[roomDates,roomChoices,musicChoices,
  ()=>heading(t('Review your stay','Aufenthalt prüfen'))+staySummary()+demoGuest()+terms('stay')+err()+actions(confirm('stay-confirm'),'stay-back'),
  ()=>success('stay',staySummary(),link('/booking',t('Start another demo','Neue Demo starten'),'button gold'))
 ][stay.step]();
 return `<ol class="steps" aria-label="${t('Booking progress','Buchungsfortschritt')}">${steps.map((s,i)=>`<li${i===stay.step?' aria-current="step"':''}>${s}</li>`).join('')}</ol><div class="panel">${networkNote()}${content}</div>`;
};
const bookingPage=()=>`${mast(t('Demo reservations','Demo-Reservierungen'),t('Book your stay','Aufenthalt buchen'),t('Choose your dates, a quiet room and an optional music experience.','Wählen Sie Reisedaten, ein ruhiges Zimmer und auf Wunsch ein Musikerlebnis.'))}<section class="compact cream" id="booking-flow"><div class="wrap"><div class="flow">${bookingPanel()}</div></div></section>`;
const ticketSummary=()=>{
 const e=eventBy(ticket.event),rate=ticket.kind==='waitlist'?0:e.rate;
 return `<p class="lede">${eventWhen(e)} · EN / DE · ${e.minutes} min</p>`+rows([row(tr(e.name)+' · '+ticket.count+(rate?' × '+money(rate):''),money(rate*ticket.count)),feeRow(),totalRow(rate*ticket.count+fees)]);
};
function ticketPanel(){
 const e=eventBy(ticket.event),wait=ticket.kind==='waitlist';
 let inner;
 if(ticket.step===1){
  const options=events.filter(s=>s.date===e.date).map(s=>option(s.id,s.time+' · '+tr(s.name)+' · '+(remaining(s,used)>0?t('Available','Verfügbar'):t('Sold out','Ausgebucht')),ticket.event)).join('');
  inner=heading(wait?t('Join demo waitlist','Demo-Warteliste wählen'):t('Event tickets','Veranstaltungskarten'),tr(e.name)+' · '+eventWhen(e))+
   `<div class="fields two">${select('ticket-event',t('Session','Termin'),options)}${countInput('ticket-count',t('Number of tickets','Anzahl der Karten'),ticket.count,8)}</div>
   <p class="meta">${eventMeta(e)} · ${available(remaining(e,used))} · ${badge}</p>`+
   (wait?`<p class="note">${t('Choose another session above to buy tickets, or continue with the demo waitlist.','Wählen Sie oben einen anderen Termin für Karten oder fahren Sie mit der Demo-Warteliste fort.')}</p>`:'')+err()+
   actions((!wait&&remaining(e,used)<ticket.count?button('wait-pick',t('Demo waitlist','Demo-Warteliste'),'button outline',e.id):'')+next('ticket-review',t('Review selection','Auswahl prüfen')),'ticket-close',t('Close','Schließen'));
 }else if(ticket.step===2){
  inner=heading(wait?t('Review demo waitlist','Demo-Warteliste prüfen'):t('Review your tickets','Karten prüfen'))+ticketSummary()+demoGuest()+(wait?'':terms('tickets'))+err()+actions(confirm('ticket-confirm'),'ticket-back');
 }else{
  inner=success(ticket.kind,ticketSummary(),button('ticket-close',t('Start another demo','Neue Demo starten'),'button gold'));
 }
 return '<div class="panel" style="margin-top:1.2rem">'+inner+'</div>';
}
const dineSummary=()=>`<p class="lede">${tr(venues[dine.venue].name)} · ${date(dine.date)} · ${dine.time}</p>`+
 rows([row(t('Table for','Tisch für'),guests(dine.guests)),row(t('Reservation charge','Reservierungsgebühr'),money(0)),feeRow(),totalRow(fees)])+
 `<p class="meta">${t('The table reservation excludes food and drinks.','Die Tischreservierung umfasst keine Speisen und Getränke.')}</p>`;
function dinePanel(){
 let inner;
 if(!dine.step){
  const options=option('',t('Select a time','Uhrzeit auswählen'),dine.time)+venues[dine.venue].times.map(time=>option(time,time+' · '+(freeMeal(dine.venue,dine.date,time)>=dine.guests?t('Demo available','Demo verfügbar'):t('Sold out','Ausgebucht')),dine.time,freeMeal(dine.venue,dine.date,time)<dine.guests)).join('');
  inner=heading(reserve(),t('Choose a venue, demo date, seating time and party size. Times are local to Vienna.','Wählen Sie einen Ort, ein Demo-Datum, eine Uhrzeit und die Gruppengröße. Die Zeiten sind in Wiener Ortszeit.'))+
  `<div class="fields two">${select('venue',t('Venue','Ort'),Object.entries(venues).map(([id,v])=>option(id,tr(v.name),dine.venue)).join(''))}${dateInput('meal-date',t('Date','Datum'),dine.date,dates.at(-1))}
  ${select('meal-time',t('Demo seating time','Demo-Reservierungszeit'),options)}${countInput('meal-guests',t('Number of guests','Anzahl der Gäste'),dine.guests,8)}</div>`+err()+actions(next('dine-review',t('Review table reservation','Tischreservierung prüfen')));
 }else if(dine.step===1){
  inner=heading(t('Review your table','Tischreservierung prüfen'))+dineSummary()+demoGuest()+terms('dine')+err()+actions(confirm('dine-confirm'),'dine-back');
 }else{
  inner=success('dine',dineSummary(),button('dine-back',t('Start another demo','Neue Demo starten'),'button gold'));
 }
 return '<div class="panel">'+networkNote()+inner+'</div>';
}

const pages={'/':home,'/rooms':roomsPage,'/music-culture':musicPage,'/dine':dinePage,'/location':locationPage,'/explore-in-3d':tourPage,'/booking':bookingPage};
const sectionId=()=>path==='/booking'?'booking-flow':path==='/dine'?'reserve':'ticket-flow';
function render(){
 document.documentElement.lang=t('en','de');
 const item=navs.find(x=>x[0]===path);
 document.title=(path==='/'?'Music Transcends Borders':item?t(item[1],item[2]):t('Page not found','Seite nicht gefunden'))+' | Resonance House Vienna';
 root.innerHTML=header()+'<main id="main">'+(pages[path]||(()=>mast('Resonance House Vienna',t('Page not found','Seite nicht gefunden'),'', '',link('/',t('Back to home','Zur Startseite'),'button gold'))))()+'</main>'+footer();
}
function show(id=sectionId(),focus=true){
 const box=document.getElementById(id);
 if(!box)return;
 box.scrollIntoView({behavior:'instant',block:'start'});
 if(focus)box.querySelector('h2[tabindex]')?.focus({preventScroll:true});
}
function update(){
 const region=document.getElementById(sectionId());
 if(!region)return;
 if(path==='/booking')region.querySelector('.flow').innerHTML=bookingPanel();
 else if(path==='/dine')region.querySelector('.flow').innerHTML=dinePanel();
 else region.innerHTML=ticket.step?ticketPanel():'';
}
function progress(){update();show();}
function requestId(){
 if(crypto.randomUUID)return crypto.randomUUID();
 const bytes=crypto.getRandomValues(new Uint8Array(16));
 bytes[6]=(bytes[6]&15)|64;
 bytes[8]=(bytes[8]&63)|128;
 const hex=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
 return [hex.slice(0,8),hex.slice(8,12),hex.slice(12,16),hex.slice(16,20),hex.slice(20)].join('-');
}
async function hotelApi(endpoint,options){
 const response=await fetch(apiBase+endpoint,{cache:'no-store',credentials:'omit',...options});
 if(!response.ok)throw Error('Demo service unavailable');
 const result=await response.json();
 if(!Number.isInteger(result.status)||!result.payload)throw Error('Invalid demo response');
 return result;
}
async function inventory(){
 try{
  const {status,payload}=await hotelApi('/api/inventory');
  if(status!==200)throw Error();
  used=payload;fail=false;
 }catch{fail=true;}
}
function validateStep(){
 if(stay.step===0){
  if(!validDates(stay.a,stay.b))return 'dates';
  if(stay.room&&!freeRoom(roomBy(stay.room)))stay.room='';
  if(stay.event&&!stayEvents().some(e=>e.id===stay.event))stay.event='';
  if([stay.practice,stay.extra].some(id=>id&&!inStay(rehearsalBy(id).date)))stay.practice=stay.extra='';
 }
 if(stay.step===1&&(!stay.room||!freeRoom(roomBy(stay.room))))return 'room';
 if(stay.step===2){
  if(stay.plan==='artist'){
   if(!stay.practice||stay.practice===stay.extra||[stay.practice,stay.extra].filter(Boolean).map(rehearsalBy).some(p=>!p||!inStay(p.date)||freePractice(p)<1))return 'practice';
  }
  if(stay.plan==='weekend'&&!stay.event)return 'event';
  if(stay.event){
   const e=eventBy(stay.event);
   if(!stayEvents().includes(e))return 'event';
   if(remaining(e,used)<stay.count||(stay.plan==='weekend'&&freeMeal('restaurant',e.date,mealTime(e))<stay.guests))return 'availability';
  }
 }
 return '';
}
async function submit(source,inline=false){
 if(busy)return;
 busy=true;error='';waitRef='';update();
 const {step,...payload}=source;
 const fingerprint=JSON.stringify(payload);
 const id=pending.get(fingerprint)||requestId();
 pending.set(fingerprint,id);
 try{
  const {status,payload:data}=await hotelApi('/api/confirm',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload,id})});
  if(status===200){
   pending.delete(fingerprint);
   if(inline)waitRef=data.reference;
   else{
    receipt=data;
    source.step++;
   }
   await inventory();
  }else{
   error=data.error;
   if(error==='availability'){
    await inventory();
    if(source===stay)stay.step=data.slots.some(slot=>slot.startsWith('room:'))?1:2;
    if(source===ticket)ticket.step=1;
    if(source===dine)dine.step=0;
   }
  }
 }catch{error='service';}
 finally{
  busy=false;
  if(path==='/music-culture')render();
  progress();
 }
}
function resetTickets(event='',kind='tickets'){
 Object.assign(ticket,{event,kind,count:ticket.event===event?ticket.count:1,step:event?1:0});
}
function chooseTime(){
 if(venues[dine.venue].times.includes(dine.time)&&freeMeal(dine.venue,dine.date,dine.time)>=dine.guests)return;
 dine.time=venues[dine.venue].times.find(time=>freeMeal(dine.venue,dine.date,time)>=dine.guests)||'';
}
function focusField(name){document.querySelector(`[name="${name}"]`)?.focus({preventScroll:true});}
root.addEventListener('click',event=>{
 const target=event.target.closest('[data-action]');
 if(!target)return;
 const {action,value}=target.dataset;
 if(busy&&action!=='menu')return;
 if(action==='menu'){
  openMenu=!openMenu;document.querySelector('#nav').classList.toggle('open',openMenu);target.setAttribute('aria-expanded',String(openMenu));return;
 }
 if(action==='language'){
  const position=document.querySelector('video')?.currentTime||0;
  de=!de;try{localStorage.setItem('rhv-language',t('en','de'));}catch{}render();
  if(position&&document.querySelector('video'))document.querySelector('video').currentTime=position;
  document.querySelector('[data-action=language]').focus({preventScroll:true});return;
 }
 if(action==='floor'){
  floor=value;document.querySelector('#floors').innerHTML=floors();
  document.querySelector(`[data-action=floor][data-value="${floor}"]`)?.focus({preventScroll:true});return;
 }
 if(action==='reload-inventory'){
  void inventory().then(()=>path==='/music-culture'?render():update());return;
 }
 if(action==='programme'){
  programme=value;resetTickets();error='';render();
  document.querySelector(`[data-action=programme][data-value="${value}"]`)?.focus({preventScroll:true});return;
 }
 error='';
 switch(action){
  case 'stay-next':error=validateStep();if(!error)stay.step++;break;
  case 'stay-back':stay.step--;break;
  case 'stay-confirm':void submit(stay);return;
  case 'room-only':Object.assign(stay,{plan:'',event:'',practice:'',extra:''});break;
  case 'stay-wait':void submit({kind:'waitlist',event:value,count:stay.plan==='weekend'?stay.guests:stay.count},true);return;
  case 'ticket-pick':resetTickets(value);break;
  case 'wait-pick':resetTickets(value,'waitlist');break;
  case 'ticket-review':
   if(ticket.kind==='tickets'&&remaining(eventBy(ticket.event),used)<ticket.count)error='quantity';
   else ticket.step=2;
   break;
  case 'ticket-back':ticket.step=1;break;
  case 'ticket-confirm':void submit(ticket);return;
  case 'ticket-close':resetTickets();update();show('programme',false);return;
  case 'venue-pick':Object.assign(dine,{venue:value,step:0});chooseTime();break;
  case 'dine-review':
   if(!dates.includes(dine.date)||!venues[dine.venue].times.includes(dine.time))error='meal';
   else if(freeMeal(dine.venue,dine.date,dine.time)<dine.guests)error='availability';
   else dine.step=1;
   break;
  case 'dine-back':dine.step=0;break;
  case 'dine-confirm':void submit(dine);return;
  default:return;
 }
 progress();
});
root.addEventListener('change',event=>{
 const field=event.target,{name,value}=field;
 if(path==='/booking'){
  if(name==='access')stay.access=field.checked;
  else if(name==='guests')stay.count=stay.guests=Number(value);
  else if(name==='count'){stay.count=Number(value);update();focusField(name);}
  else if(['a','b','room','event','practice','extra'].includes(name)){
   stay[name]=value;
   if(name==='practice'){
    if(stay.extra===value)stay.extra='';
    update();focusField(name);
   }
  }
 }else if(path==='/music-culture'){
  if(name==='ticket-count')ticket.count=Number(value);
  if(name==='ticket-event'){
   ticket.event=value;ticket.kind=remaining(eventBy(value),used)>0?'tickets':'waitlist';error='';update();focusField(name);
  }
 }else if(path==='/dine'){
  if(name==='meal-time'){dine.time=value;return;}
  if(name==='venue')dine.venue=value;
  else if(name==='meal-guests')dine.guests=Number(value);
  else if(name==='meal-date')dine.date=value;
  else return;
  chooseTime();error='';update();focusField(name);
 }
});
render();
if(location.hash)requestAnimationFrame(()=>show(location.hash.slice(1),false));
else if(path==='/booking'&&query.get('demo')==='1')requestAnimationFrame(()=>show());
if(['/booking','/music-culture','/dine'].includes(path))void inventory().then(()=>path==='/music-culture'&&!ticket.step?render():update());

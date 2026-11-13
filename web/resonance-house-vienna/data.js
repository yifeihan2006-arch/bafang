export const start='2026-11-20', end='2026-11-22', showDate='2026-11-21';
export const shift=(d,n)=>new Date(Date.parse(d+'T00:00:00Z')+n*86400000).toISOString().slice(0,10);
export const dates=Array.from({length:31},(_,i)=>shift(start,i));
export const last=shift(start,31);
export const nights=(a,b)=>dates.filter(d=>a<=d&&d<b);
export const validDates=(a,b)=>dates.includes(a)&&(dates.includes(b)||b===last)&&a<b&&nights(a,b).length<=7;
export const rooms=[
 {id:'standard',name:['Standard','Standard'],area:32,cap:72,access:4,max:2,rate:168,copy:['Warm oak and soft lighting for a quiet retreat.','Warmes Eichenholz und sanftes Licht für einen ruhigen Rückzugsort.']},
 {id:'superior',name:['Superior','Superior'],area:36,cap:30,access:2,max:2,rate:208,copy:['A little more space and a place to sit and read.','Mehr Platz und ein eigener Lesebereich.']},
 {id:'family',name:['Family','Familienzimmer'],area:42,cap:12,access:0,max:4,rate:258,copy:['Space to settle in together after a day in Vienna.','Platz für die ganze Familie nach einem Tag in Wien.']},
 {id:'suite',name:['Suite','Suite'],area:60,cap:6,access:0,max:3,rate:328,copy:['A separate sitting area for an unhurried stay.','Ein separater Wohnbereich für einen entspannten Aufenthalt.']}
];
export const roomBy=id=>rooms.find(x=>x.id===id);
export const plans=[
 {id:'discover',name:'Stay and Discover',img:'workshop',copy:['Add a beginner instrument workshop, choose a different session, or continue with room only.','Ergänzen Sie einen Einsteiger-Workshop, wählen Sie einen anderen Termin oder buchen Sie nur das Zimmer.']},
 {id:'weekend',name:'Weekend Resonance',img:'concert',copy:['A room, a restaurant seating and a concert ticket for every guest. All three are confirmed together.','Ein Zimmer, ein Restauranttermin und eine Konzertkarte pro Gast. Alle drei Leistungen werden gemeinsam bestätigt.']},
 {id:'artist',name:'Artist Stay',img:'rehearsal',copy:['Stay with one included 45-minute rehearsal. Add a second session for €24 if available.','Aufenthalt mit einer 45-minütigen Probe. Eine weitere Probe ist bei Verfügbarkeit für 24 € buchbar.']}
];
const dialogue=['Violin & Erhu in Dialogue','Violine und Erhu im Dialog'];
export const events=dates.filter(d=>new Date(d+'T00:00:00Z').getUTCDay()===6).flatMap(date=>[
 {id:'workshop-'+date,date,time:'11:00',type:'workshop',name:['First Notes: Instrument Workshop','Erste Töne: Instrumentenworkshop'],copy:['Learn basic bowing and compare the sound of violin and erhu.','Lernen Sie erste Bogenstriche und vergleichen Sie den Klang von Violine und Erhu.'],cap:12,seed:0,minutes:45,rate:18},
 ...['16:00','19:30'].map((time,i)=>({id:(i?'concert-':'matinee-')+date,date,time,type:'concert',name:dialogue,copy:['Two bowed instruments share the stage in an intimate concert.','Zwei Streichinstrumente teilen sich die Bühne in einem Konzert im kleinen Rahmen.'],cap:80,seed:!i&&date===showDate?80:0,minutes:60,rate:32}))
]);
export const eventBy=id=>events.find(x=>x.id===id);
export const venues={
 restaurant:{name:['L1 Restaurant','Restaurant auf L1'],cap:90,times:['12:30','18:00','19:45','20:45']},
 cafe:{name:['Ground-floor Café','Café im Erdgeschoss'],cap:24,times:['10:00','11:30','14:30','16:00']}
};
export const rehearsals=dates.flatMap(date=>['10:00','14:00','16:00'].map(time=>({id:date+'@'+time,date,time,cap:4})));
export const rehearsalBy=id=>rehearsals.find(x=>x.id===id);
export const roomSlot=(id,date,access)=>'room:'+id+':'+date+':'+(access?'access':'regular');
export const eventSlot=id=>'event:'+id;
export const mealSlot=(venue,date,time)=>'meal:'+venue+':'+date+'@'+time;
export const practiceSlot=id=>'rehearsal:'+id;
export const mealTime=e=>e.time==='16:00'?'19:45':'18:00';
export const weekendPrice=48, extraPrice=24, fees=0;
export const remaining=(event,used)=>Math.max(0,event.cap-event.seed-(used[eventSlot(event.id)]||0));

(function(){
const {STAGES,K,W,H,clone,clamp,ez,rng,hexA,ms,Rec,pace,grid,ctr,stateCol,drawNode,edgePts,polyAt,drawEdges,packet,dot,drawPacket,panel,kv,nodeStates,code,SC}=StoryKit;
/* ---------------- F · Kafka replay ---------------- */
SC.push({id:'replay',hall:'kafka',wing:'messaging',letter:'F',title:'Kafka replay: re-reading the log',
 question:'A billing bug produced wrong invoices for three orders. The events are still in the log. Can you just read them again?',
 intuition:'Consuming an event in Kafka does not delete it. Each consumer group has its own position in the log, and you can move that position back. Re-reading is safe. Doing the side effects again, such as sending emails or charging cards, is safe only if the consumer is idempotent.',
 takeaway:'Replaying events is easy: you move a consumer group\'s offset back, and other groups are unaffected. The real design work is making each side effect idempotent, so that processing the same event twice gives the same result as processing it once.',
 next:'order',custom:true,
 nodes:{prod:{x:20,y:196,w:110,h:84,label:'Order service'},log:{x:150,y:190,w:790,h:96,label:'Event log'},kitchen:{x:150,y:46,w:250,h:80,label:'Kitchen group'},billing:{x:150,y:350,w:250,h:84,label:'Billing group'},
  inv:{x:430,y:330,w:510,h:194,label:'Invoices'},mail:{x:20,y:450,w:380,h:74,label:'Emails sent'}},
 options:[{id:'idem',label:'Billing consumer',primary:true,def:'off',choices:[['off','INSERT + send email'],['on','Idempotent: UPSERT by order id']],
  note:'Both versions replay the same events. Only the consumer\'s side effects differ.'}],
 metrics:[['rows','Invoice rows',String,0],['dups','Duplicate invoices',String,-1],['mails','Emails sent',String,0],['dupMail','Duplicate emails',String,-1],['lag','Max billing lag',String,-1]],
 obj:{prod:{what:'Publishes OrderPlaced for every order.',why:'It records facts. It does not know who reads them.',rel:['kafka','pubsub'],state:function(s){return s.log.length+' events published.';}},
  log:{what:'A partition: an ordered, append-only list of events, kept for a retention period.',why:'Events stay after being read, so any group can read them again.',rel:['kafka','delivery'],state:function(s){return 'offsets 0…'+(s.log.length-1)+' retained.';}},
  kitchen:{what:'Consumer group “kitchen”, with its own committed offset.',why:'Each group reads at its own pace, independently of the others.',rel:['kafka','pubsub'],state:function(s){return 'committed offset '+s.k;}},
  billing:{what:'Consumer group “billing”. It is slower, so it lags behind.',why:'Lag is the difference between the end of the log and the group\'s committed offset.',rel:['kafka','tasks'],state:function(s){return 'committed offset '+s.b+' · lag '+(s.log.length-s.b);}},
  inv:{what:'The invoices table that billing writes to.',why:'This is a side effect. Replaying events repeats it.',rel:['delivery','transactions'],state:function(s){return s.inv.length+' rows.';}},
  mail:{what:'Emails to customers. You cannot unsend them.',why:'The side effect that customers actually notice.',rel:['delivery'],state:function(s){return s.mail.length+' sent.';}}},
 build:function(o){
  const idem=o.idem==='on';
  const R=new Rec({log:[],k:0,b:0,inv:[],mail:[],bug:false,maxLag:0,fixed:false,replay:false});
  R.add({type:'setup',src:'log',dst:'log',stage:1,key:'start',hold:true,dur:1.4,pk:{txt:'topic orders · p0'},chapter:'watch',label:'An empty partition',
   say:'Topic <code>orders</code>, partition 0. Two consumer groups read it: <b>kitchen</b> (fast) and <b>billing</b> (slow). Each one keeps its own committed offset.'});
  const proc=function(off,replay){const ord=4711+off,wrong=R.s.bug&&!R.s.fixed;
   const exist=R.s.inv.filter(function(x){return x.o===ord;})[0];
   const dup=!!exist&&!idem;
   R.add({type:'consume',src:'log',dst:'billing',pk:{txt:'@'+off},label:'billing reads @'+off+(replay?' (replay)':''),bad:dup,good:replay&&idem,
    fx:function(s){s.b=off+1;
     if(idem&&exist){exist.tax=wrong?'wrong':'ok';exist.v=(exist.v||1)+1;if(exist.was==='wrong'){s.mail.push({o:ord,k:'corrected'});}exist.was=exist.tax;}
     else{s.inv.push({o:ord,tax:wrong?'wrong':'ok',dup:dup,was:wrong?'wrong':'ok'});s.mail.push({o:ord,k:dup?'DUPLICATE':'invoice',dup:dup});}
     s.maxLag=Math.max(s.maxLag,s.log.length-s.b);},
    say:replay?(idem?'Replay of <b>@'+off+'</b>: UPSERT replaces invoice '+ord+' with the corrected tax. '+(exist&&exist.was==='wrong'?'One “corrected invoice” email is sent.':'Nothing new is sent.'):
     '<b>Replay of @'+off+'</b>: billing runs INSERT again, creating a <b>second invoice</b> for order '+ord+', and emails the customer again.'):
     'Billing processes <b>@'+off+'</b> (order '+ord+')'+(wrong?' with the <b>buggy tax rate</b>.':'.')+' Then it commits offset '+(off+1)+'.',
    changes:['billing committed → '+(off+1)],data:{offset:String(off),order:String(ord),handler:idem?'UPSERT ON CONFLICT (order_id)':'INSERT + send email'}});};
  for(let k=0;k<8;k++){
   R.add({type:'produce',src:'prod',dst:'log',pk:{txt:'OrderPlaced '+(4711+k)},dur:.9,label:'append @'+k,fx:function(s){s.log.push(4711+k);s.maxLag=Math.max(s.maxLag,s.log.length-s.b);},
    say:'The order service appends <b>OrderPlaced '+(4711+k)+'</b> at offset <b>'+k+'</b>. The log only grows.',stage:2,data:{offset:String(k),key:String(4711+k)}});
   R.add({type:'consume',src:'log',dst:'kitchen',pk:{txt:'@'+k},dur:.7,label:'kitchen reads @'+k,fx:function(s){s.k=k+1;},say:'Kitchen reads @'+k+' and commits offset '+(k+1)+'. It keeps up.'});
   if(k%2===1){proc(R.s.b,false);}
   if(k===5)R.add({type:'bug',src:'billing',dst:'billing',warn:true,dur:1.2,pk:{txt:'deploy v2.3 (bug)'},key:'bug',hold:true,label:'A buggy deploy',fx:function(s){s.bug=true;},
    say:'Billing v2.3 is deployed with a <b>wrong tax rate</b>. Nobody notices yet.',chapter:'mech'});
   if(k===5){const lag=R.s.log.length-R.s.b;R.add({type:'observe',src:'billing',dst:'billing',warn:true,dur:1.2,hold:true,key:'lag',stage:3,pk:{txt:'lag '+lag},label:'Billing falls behind',
    say:'Billing is <b>'+lag+' events behind</b> the end of the log. Kitchen is at the end. Neither group affects the other.',
    why:{cause:'Billing processes events more slowly than they arrive.',consequence:'Lag = end offset − committed offset = '+lag+'. The events wait in the log, not in memory.',response:'Add consumers (up to one per partition) or make each event cheaper to process.',tradeoff:'Retention sets how far behind a group can fall before it loses events.'}});}
  }
  while(R.s.b<6)proc(R.s.b,false);
  R.add({type:'fix',src:'billing',dst:'billing',good:true,dur:1.2,pk:{txt:'deploy v2.4 (fix)'},key:'fix',stage:4,label:'Fix deployed',fx:function(s){s.fixed=true;},
   say:'The bug is found: invoices for orders <b>4714–4716</b> (offsets 3–5) used the wrong tax rate. v2.4 fixes it.'});
  R.add({type:'reset',src:'billing',dst:'log',warn:true,dur:1.5,pk:{txt:'reset offset → 3'},key:'reset',hold:true,stage:4,chapter:'code',label:'Rewind billing to offset 3',
   fx:function(s){s.b=3;s.replay=true;},say:'An operator runs <code>kafka-consumer-groups --reset-offsets --to-offset 3 --group billing</code>. <b>Kitchen is not affected</b>: it stays at offset '+R.s.k+'.',
   why:{cause:'The events from offset 3 onwards are still retained in the log.',consequence:'Billing will process offsets 3, 4, 5, 6 and 7 again.',response:'Before replaying, ask whether each side effect is safe to repeat.',tradeoff:'Replay is very useful for recovery, and only as safe as the consumer\'s side effects.'}});
  for(let off=3;off<8;off++){const before=R.s.inv.length;proc(off,off<6);
   if(off===3)R.ev[R.ev.length-1].key='replay',R.ev[R.ev.length-1].hold=true,R.ev[R.ev.length-1].stage=5,R.ev[R.ev.length-1].chapter='trade',
    R.ev[R.ev.length-1].why=idem?{cause:'The handler uses UPSERT on order_id, and emails are keyed by (order, version).',consequence:'Order 4714 now has one invoice, corrected. The customer gets one “corrected invoice” email.',response:'Replaying again later would change nothing.',tradeoff:'You need a natural key and a little more code in every consumer.'}:
     {cause:'The handler uses INSERT and sends an email every time it sees an event.',consequence:'Order 4714 now has two invoices. The customer received a second email that looks like a second charge.',response:'Make the handler idempotent: UPSERT by order id, and de-duplicate emails by a key.',tradeoff:'The bug was only one line, but the duplicate emails cannot be unsent.'};}
  R.add({type:'end',src:'inv',dst:'inv',stage:7,key:'end',hold:true,dur:1.3,chapter:'prod',label:'After the replay',
   say:idem?'Replay complete: <b>8 invoices, all correct</b>, and 3 correction emails.':'Replay complete: <b>'+R.s.inv.length+' invoices for 8 orders</b>, and '+R.s.mail.filter(function(m){return m.dup;}).length+' customers received a duplicate email.'});
  const s=R.s;return{s0:R.s0,events:R.ev,metrics:{rows:s.inv.length,dups:s.inv.filter(function(x){return x.dup;}).length,mails:s.mail.length,dupMail:s.mail.filter(function(m){return m.dup;}).length,lag:s.maxLag}};},
 draw:function(c,X){const s=X.S,N=X.def.nodes,acc=X.acc,st=X.ns;
  const sel=function(id){const n=N[id];if(st[id]==='sel'){rr(c,n.x-4,n.y-4,n.w+8,n.h+8,12);c.strokeStyle=hexA(acc,.7);c.setLineDash([4,4]);c.lineWidth=1;c.stroke();c.setLineDash([]);}
   else if(st[id]!=='idle'&&st[id]!=='dim'){rr(c,n.x,n.y,n.w,n.h,10);c.strokeStyle=stateCol(st[id],acc);c.lineWidth=2;c.stroke();}};
  panel(c,N.prod.x,N.prod.y,N.prod.w,N.prod.h,'Producer');T(c,'Order',N.prod.x+14,N.prod.y+42,FS(600,13),K.ink,'left');T(c,'service',N.prod.x+14,N.prod.y+60,FS(600,13),K.ink,'left');sel('prod');
  const L=N.log;panel(c,L.x,L.y,L.w,L.h,'topic orders · partition 0 · retained 7 days');sel('log');
  const cw=88;for(let k=0;k<8;k++){const x=L.x+18+k*(cw+7),y=L.y+28;const has=k<s.log.length;
   rr(c,x,y,cw,52,7);c.fillStyle=has?hexA(acc,.12):'#0D1424';c.fill();c.strokeStyle=has?hexA(acc,.6):'#1F2C47';c.lineWidth=1;c.stroke();
   T(c,'@'+k,x+8,y+12,FM(600,9),K.faint,'left');if(has)T(c,String(4711+k),x+cw/2,y+32,FM(600,12),'#fff');
   if(has&&k>=3&&k<=5&&s.bug)T(c,'bug window',x+cw/2,y+46,FM(500,8),K.wait);}
  const ptr=function(off,y,up,lbl,col){const x=L.x+18+off*(cw+7)-4;c.fillStyle=col;c.beginPath();
   if(up){c.moveTo(x,y);c.lineTo(x-6,y+10);c.lineTo(x+6,y+10);}else{c.moveTo(x,y);c.lineTo(x-6,y-10);c.lineTo(x+6,y-10);}c.fill();
   T(c,lbl,x+10,up?y+6:y-6,FM(600,10),col,'left');};
  ptr(s.k,L.y-2,false,'kitchen @'+s.k,K.ok);ptr(s.b,L.y+L.h+2,true,'billing @'+s.b+(s.log.length-s.b>0?' · lag '+(s.log.length-s.b):''),s.replay?K.wait:acc);
  panel(c,N.kitchen.x,N.kitchen.y,N.kitchen.w,N.kitchen.h,'Consumer group · kitchen');sel('kitchen');
  T(c,'committed offset '+s.k,N.kitchen.x+14,N.kitchen.y+44,FM(600,11.5),K.ok,'left');T(c,'unaffected by billing',N.kitchen.x+14,N.kitchen.y+62,FS(400,10.5),K.dim,'left');
  panel(c,N.billing.x,N.billing.y,N.billing.w,N.billing.h,'Consumer group · billing');sel('billing');
  T(c,'committed offset '+s.b,N.billing.x+14,N.billing.y+42,FM(600,11.5),s.replay?K.wait:acc,'left');
  T(c,o_(X.opts),N.billing.x+14,N.billing.y+62,FM(500,9.5),K.dim,'left');
  function o_(o){return o.idem==='on'?'UPSERT ON CONFLICT (order_id)':'INSERT + send email';}
  panel(c,N.inv.x,N.inv.y,N.inv.w,N.inv.h,'invoices');sel('inv');
  s.inv.forEach(function(v,i){const col=i<6?0:1,row=i%6,x=N.inv.x+14+col*250,y=N.inv.y+34+row*25;
   rr(c,x,y,236,20,4);c.fillStyle=v.dup?hexA(K.bad,.18):v.tax==='wrong'?hexA(K.wait,.14):'#0D1424';c.fill();
   T(c,'order '+v.o,x+8,y+10,FM(500,10),'#fff','left');T(c,v.dup?'DUPLICATE':v.tax==='wrong'?'tax wrong':(v.v>1?'corrected':'ok'),x+228,y+10,FM(600,9.5),v.dup?K.bad:v.tax==='wrong'?K.wait:K.ok,'right');});
  if(s.inv.length>12)T(c,'+'+(s.inv.length-12)+' more',N.inv.x+N.inv.w-14,N.inv.y+14,FM(600,10),K.bad,'right');
  panel(c,N.mail.x,N.mail.y,N.mail.w,N.mail.h,'Emails sent · '+s.mail.length);sel('mail');
  s.mail.slice(-14).forEach(function(m,i){const x=N.mail.x+14+(i%7)*52,y=N.mail.y+30+Math.floor(i/7)*22;rr(c,x,y,46,17,4);
   c.fillStyle=m.dup?hexA(K.bad,.3):m.k==='corrected'?hexA(K.ok,.2):'#111B30';c.fill();T(c,String(m.o).slice(-3),x+23,y+9,FM(500,9),m.dup?K.bad:m.k==='corrected'?K.ok:K.dim);});
  const E=X.E;if(E&&X.p>0&&E.pk){const col=E.bad?K.bad:E.good?K.ok:E.warn?K.wait:acc;
   if(E.src===E.dst){const n=N[E.src];packet(c,n.x+n.w/2,n.y-12,E.pk.txt,col);}
   else{let a,b;const off=E.data&&E.data.offset!=null?+E.data.offset:null;const cellX=function(k){return L.x+18+k*(cw+7)+cw/2;};
    if(E.type==='produce'){a=ctr(N.prod);b={x:cellX(off),y:L.y+54};}
    else if(E.type==='consume'&&E.dst==='kitchen'){const k=+E.pk.txt.slice(1);a={x:cellX(k),y:L.y+28};b={x:N.kitchen.x+N.kitchen.w/2,y:N.kitchen.y+N.kitchen.h};}
    else if(E.type==='consume'){const k=+E.pk.txt.slice(1);a={x:cellX(k),y:L.y+80};b={x:N.billing.x+N.billing.w/2,y:N.billing.y};}
    else{a=ctr(N[E.src]);b=ctr(N[E.dst]);}
    const q={x:a.x+(b.x-a.x)*ez(X.p),y:a.y+(b.y-a.y)*ez(X.p)};packet(c,q.x,q.y,E.pk.txt,col);}}
 },
 chapters:[
  {id:'problem',n:'The problem',html:'<p>Bugs in consumers are inevitable. When one corrupts derived data such as invoices, a search index or a report, you need a way to rebuild that data from what actually happened.</p>'},
  {id:'intuition',n:'The intuition',html:'<p>The log is the restaurant\'s order book, not a pile of tickets that get thrown away. Each department keeps a bookmark in it. Billing can move its bookmark back three pages and redo its work. Doing that work again is only harmless if the work is idempotent.</p>'},
  {id:'watch',n:'What you are watching',anchor:'start',html:'<p>The strip is the partition, with one cell per offset. The green arrow is kitchen\'s committed offset and the accent arrow is billing\'s. The table at the bottom right is what billing has written, and the bottom-left box is the emails customers received.</p>'},
  {id:'mech',n:'How offsets work',anchor:'lag',html:'<p>Events are appended and kept for the retention period, whether or not anyone has read them. A consumer group <b>commits</b> the offset of the next event it will read. <b>Lag</b> is the end offset minus the committed offset. Groups are independent, so resetting billing does not move kitchen.</p>'},
  {id:'code',n:'Code',anchor:'reset',html:code("# rewind one group (stop its consumers first)\nkafka-consumer-groups --bootstrap-server kafka:9092 \\\n  --group billing --topic orders:0 \\\n  --reset-offsets --to-offset 3 --execute\n\n# idempotent handler: same event twice == once\ndef on_order_placed(evt):\n    db.run(\"\"\"INSERT INTO invoices (order_id, total, tax)\n              VALUES (%s, %s, %s)\n              ON CONFLICT (order_id) DO UPDATE\n              SET total = EXCLUDED.total, tax = EXCLUDED.tax\"\"\", ...)\n    mail.send(key=f\"invoice-{evt.order_id}-v{VERSION}\", ...)  # de-duplicated")},
  {id:'trade',n:'Replay vs repeating side effects',anchor:'replay',html:'<ul><li><b>Replaying</b> (reading again) is always safe. The log does not change.</li><li><b>Repeating side effects</b> is safe only for idempotent operations: UPSERT, “set to X”, and calls with de-duplication keys.</li><li>Non-idempotent effects such as INSERT, “add 1”, sending an email or charging a card need a key and a record of what has already been done.</li></ul>'},
  {id:'fail',n:'Failure modes',html:'<ul><li>Retention expires before a lagging group catches up, and events are lost to that group.</li><li>Committing the offset <b>before</b> doing the work loses events on a crash. Committing after means duplicates on a crash. That is at-least-once delivery, which is why idempotency matters.</li><li>Ordering is only guaranteed within a partition, so use the order id as the message key.</li></ul>'},
  {id:'prod',n:'In production',anchor:'end',html:'<ul><li>Alert on consumer lag measured in time, not just in number of events.</li><li>Practise replays in staging. A replay is a normal recovery tool, so test it before you need it in production.</li><li>Use compacted topics when you only need the latest value for each key.</li></ul>'},
  {id:'rel',n:'Related',rel:['kafka','delivery','pubsub','rabbitmq','transactions']},
  {id:'check',n:'Check yourself',quiz:[
   {q:'After resetting billing to offset 3, where is kitchen?',a:['Also at 3','Still at 8 — groups are independent','At 0'],ok:1,why:'Each consumer group has its own committed offset.'},
   {q:'What made the replay safe in the idempotent version?',a:['A faster consumer','UPSERT by order id and keyed emails','Deleting the log'],ok:1,why:'Processing the same event twice produced the same end state as processing it once.'}]}]
});
})();

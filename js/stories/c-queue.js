(function(){
const {STAGES,K,W,H,clone,clamp,ez,rng,hexA,ms,Rec,pace,grid,ctr,stateCol,drawNode,edgePts,polyAt,drawEdges,packet,dot,drawPacket,panel,kv,nodeStates,code,SC}=StoryKit;
/* ---------------- C · A queue under pressure ---------------- */
SC.push({id:'queue',hall:'tasks',wing:'tasks',letter:'C',title:'A queue under pressure',
 question:'Dinner rush: orders arrive three times faster than the kitchen workers can finish them. What happens to the queue, and what can you do about it?',
 intuition:'A queue absorbs short bursts. If work keeps arriving faster than it is finished, the queue grows for as long as that lasts, and so does the waiting time.',
 takeaway:'Queue depth tells you how much work is waiting, and wait time is depth divided by throughput. You can add capacity (more workers), reduce arrivals, or refuse work at the door (backpressure). Each of these moves the cost somewhere else.',
 next:'race',custom:true,
 nodes:{prod:{x:20,y:60,w:150,h:300,label:'Producers'},queue:{x:200,y:150,w:420,h:110,label:'Queue'},workers:{x:650,y:40,w:180,h:340,label:'Workers'},done:{x:850,y:150,w:96,h:110,label:'Done'},chart:{x:20,y:392,w:920,h:132,label:'Depth over time'}},
 options:[
  {id:'resp',label:'Your response at t = 16 s',primary:true,def:'none',choices:[['none','Do nothing'],['workers','Add 3 workers'],['bp','Backpressure (limit 6)']],
   note:'The surge runs from 10 s to 30 s at 3 orders/s. Two workers finish about 1.25 orders/s.'}],
 metrics:[['maxDepth','Peak queue depth',String,-1],['maxWait','Longest wait',function(v){return v.toFixed(1)+' s';},-1],['p95','p95 wait',function(v){return v.toFixed(1)+' s';},-1],
  ['rej','Rejected (429)',String,-1],['done','Completed',String,1],['workers','Workers at peak',String,-1]],
 obj:{prod:{what:'Table apps creating orders.',why:'Arrivals are driven by customers, not by your capacity.',rel:['tasks','rest'],state:function(s){return 'Arrival rate '+s.rate+'/s.';}},
  queue:{what:'A buffer of jobs waiting for a worker.',why:'Lets producers and consumers run at different speeds.',rel:['tasks','rabbitmq','delivery'],state:function(s){return s.q.length+' waiting'+(s.limit?' (limit '+s.limit+')':'')+'.';}},
  workers:{what:'Processes that take the head of the queue and do the work.',why:'Throughput depends on the number of workers and how long each job takes.',rel:['tasks','orchestration'],
   state:function(s){return s.w.filter(function(w){return w.j!=null;}).length+' of '+s.w.length+' busy.';}},
  done:{what:'Finished orders.',why:'Throughput is what leaves here per second.',rel:['tasks'],state:function(s){return s.done+' done, '+s.rej+' rejected.';}},
  chart:{what:'Queue depth over time.',why:'When depth climbs steadily, arrivals exceed throughput.',rel:['bigo'],state:function(s){return 'Peak depth '+s.maxDepth+'.';}}},
 build:function(o){
  const r=rng(11),SVC=[];for(let i=0;i<200;i++)SVC.push(1.2+r()*.8);
  const arr=[];let t=0;while(t<40){arr.push(+t.toFixed(3));const rate=t<10?1:t<30?3:1;t+=1/rate;}
  const R=new Rec({t:0,q:[],w:[{j:null,s:0,u:0},{j:null,s:0,u:0}],done:0,rej:0,waits:[],hist:[[0,0]],maxDepth:0,rate:1,limit:0,arrAt:{},phase:'balanced'});
  const at=function(x){return x*1000;};
  R.add({at:0,type:'phase',src:'prod',dst:'prod',stage:1,hold:true,key:'start',dur:1.4,label:'Balanced',chapter:'watch',
   say:'Orders arrive at <b>1 per second</b>. Two workers each take about 1.6 s per order, so together they finish about <b>1.25 per second</b>. Capacity is slightly higher than demand.',data:{arrival:'1.0/s',capacity:'≈1.25/s'}});
  let ai=0,id=0,surged=false,sat=false,responded=false,recovered=false,ended=false;
  const S=function(){return R.s;};
  function startFree(now){const s=S();for(let k=0;k<s.w.length;k++){if(s.w[k].j==null&&s.q.length){const j=s.q[0];
   const wait=now-s.arrAt[j];
   R.add({at:at(now),type:'job.start',src:'queue',dst:'workers',pk:{txt:'#'+j},label:'Worker '+(k+1)+' takes #'+j,
    fx:function(s){s.q.shift();s.w[k]={j:j,s:now,u:now+SVC[j%200]};s.waits.push(wait);s.t=now;s.hist.push([now,s.q.length]);},
    say:'Worker '+(k+1)+' takes job <b>#'+j+'</b> from the head of the queue after it waited <b>'+wait.toFixed(1)+' s</b>.',data:{job:'#'+j,waited:wait.toFixed(2)+' s',worker:String(k+1)}});}}}
  while(true){const s=S();
   let nc=Infinity,nk=-1;s.w.forEach(function(w,k){if(w.j!=null&&w.u<nc){nc=w.u;nk=k;}});
   const na=ai<arr.length?arr[ai]:Infinity;
   const marks=[[10,'surge'],[16,'resp'],[30,'calm']].filter(function(m){return (m[1]==='surge'&&!surged)||(m[1]==='resp'&&!responded)||(m[1]==='calm'&&s.rate!==1&&surged);});
   const nm=marks.length?marks[0][0]:Infinity;
   const next=Math.min(nc,na,nm);if(next===Infinity)break;
   if(nm<=next&&nm===next){const m=marks[0][1];
    if(m==='surge'){surged=true;R.add({at:at(10),type:'phase',src:'prod',dst:'queue',stage:2,hold:true,key:'surge',warn:true,dur:1.2,label:'Dinner rush',pk:{txt:'3 / s'},
      fx:function(s){s.rate=3;s.t=10;s.phase='surge';},say:'Dinner rush. Arrivals jump to <b>3 per second</b>, more than twice what the workers can finish.',data:{arrival:'3.0/s',capacity:'≈'+(s.w.length/1.6).toFixed(2)+'/s'},chapter:'mech'});}
    else if(m==='resp'){responded=true;const d=s.q.length;
     if(o.resp==='workers')R.add({at:at(16),type:'scale',src:'workers',dst:'workers',stage:4,hold:true,key:'resp',good:true,dur:1.3,label:'Scale out: +3 workers',pk:{txt:'+3 workers'},chapter:'trade',
      fx:function(s){s.w.push({j:null,s:0,u:0},{j:null,s:0,u:0},{j:null,s:0,u:0});s.t=16;},
      say:'You add <b>3 workers</b>. Capacity rises to about <b>3.1/s</b>, which is above the 3/s arrival rate, so the queue can start shrinking.',
      why:{cause:'Throughput was below the arrival rate.',consequence:'With 5 workers, about 3.1 orders/s leave, more than the 3/s arriving.',response:'The backlog of '+d+' drains slowly. The margin is only about 0.1/s until the rush ends.',tradeoff:'Five workers cost 2.5 times as much, and they now hit the database 2.5 times as hard.'}}),startFree(16);
     else if(o.resp==='bp')R.add({at:at(16),type:'limit',src:'queue',dst:'queue',stage:4,hold:true,key:'resp',good:true,dur:1.3,label:'Backpressure: limit 6',pk:{txt:'limit 6'},chapter:'trade',
      fx:function(s){s.limit=6;s.t=16;},say:'You cap the queue at <b>6</b>. Once it is full, new orders get <code>429 Too Many Requests</code> straight away instead of waiting for minutes.',
      why:{cause:'An unbounded queue turns overload into unbounded waiting.',consequence:'Wait time is capped at about '+(6*1.6/2).toFixed(1)+' s. Some customers are refused instead.',response:'The client shows “busy, try again shortly”, using retries with backoff.',tradeoff:'Refusing work is visible to customers. Hiding overload in a queue is also visible, just later.'}});
     else R.add({at:at(16),type:'none',src:'queue',dst:'queue',stage:4,hold:true,key:'resp',bad:true,dur:1.3,label:'No response',pk:{txt:d+' waiting'},chapter:'trade',
      fx:function(s){s.t=16;},say:'Nothing changes. <b>'+d+' orders</b> are waiting, and the queue keeps growing by about 1.75 per second.',
      why:{cause:'Arrivals (3/s) exceed throughput (≈1.25/s).',consequence:'Depth grows by about 1.75/s for the whole rush. Waits will reach tens of seconds.',response:'Add workers, slow the producers, or refuse work at the door. Try one in the Experiment tab.',tradeoff:'Doing nothing costs nothing until customers leave.'}});}
    else{R.add({at:at(30),type:'phase',src:'prod',dst:'prod',stage:3,key:'calm',dur:1,label:'Rush over',fx:function(s){s.rate=1;s.t=30;},
      say:'The rush ends and arrivals drop back to 1/s. '+(s.q.length?'There are still <b>'+s.q.length+'</b> orders queued, so the backlog outlasts the rush.':'The queue is already clear.')});}
    continue;}
   if(nc<=na){const k=nk,w=s.w[k],j=w.j;
    R.add({at:at(nc),type:'job.done',src:'workers',dst:'done',good:true,pk:{txt:'#'+j+' ✓'},label:'#'+j+' done',
     fx:function(s){s.w[k]={j:null,s:0,u:0};s.done++;s.t=nc;},say:'Worker '+(k+1)+' finishes <b>#'+j+'</b>.'});
    startFree(nc);
   }else{const j=++id;ai++;
    if(s.limit&&s.q.length>=s.limit){R.add({at:at(na),type:'job.reject',src:'prod',dst:'queue',bad:true,pk:{txt:'429'},label:'#'+j+' refused',
      fx:function(s){s.rej++;s.t=na;},say:'Queue full (6). Order <b>#'+j+'</b> is refused immediately with 429, and the client will retry later.'});}
    else{R.add({at:at(na),type:'job.enqueue',src:'prod',dst:'queue',pk:{txt:'#'+j},label:'#'+j+' queued',
      fx:function(s){s.q.push(j);s.arrAt[j]=na;s.t=na;s.hist.push([na,s.q.length]);if(s.q.length>s.maxDepth)s.maxDepth=s.q.length;},
      say:'Order <b>#'+j+'</b> joins the queue at position '+(s.q.length+1)+'.'});
     startFree(na);}}
   const s2=S();
   if(!sat&&s2.q.length>=6){sat=true;const d=s2.q.length,ww=s2.w.length;
    R.add({type:'observe',src:'queue',dst:'queue',warn:true,hold:true,stage:3,key:'sat',dur:1.2,label:'Saturated',pk:{txt:'depth '+d},chapter:'mech',
     say:'The queue is <b>'+d+' deep</b> and climbing. Every worker is busy all the time.',
     why:{cause:'Producers send '+s2.rate+'/s and '+ww+' workers finish about '+(ww/1.6).toFixed(2)+'/s.',consequence:'The newest order will wait about '+(d*1.6/ww).toFixed(1)+' s, and that number grows every second.',response:'Add workers, slow the producers, or apply backpressure.',tradeoff:'More workers cost money and push more load onto whatever they call next.'}});}
   if(responded&&!recovered&&surged&&s2.q.length===0&&s2.t>16){recovered=true;
    R.add({type:'observe',src:'queue',dst:'queue',good:true,stage:3,key:'recovered',dur:1,label:'Queue drained',say:'The queue is empty again at <b>'+s2.t.toFixed(1)+' s</b>.'});}
  }
  const s=R.s;const wl=s.waits.slice().sort(function(a,b){return a-b;});
  R.add({type:'end',src:'done',dst:'done',stage:7,hold:true,key:'end',dur:1.2,chapter:'prod',label:'Summary',
   say:'Done: <b>'+s.done+'</b> completed, <b>'+s.rej+'</b> refused. Peak depth <b>'+s.maxDepth+'</b>, longest wait <b>'+(wl.length?wl[wl.length-1].toFixed(1):0)+' s</b>.'});
  pace(R.ev,.00055,.06,1.2);
  return{s0:R.s0,events:R.ev,metrics:{maxDepth:s.maxDepth,maxWait:wl.length?wl[wl.length-1]:0,p95:wl.length?wl[Math.floor(wl.length*.95)]:0,rej:s.rej,done:s.done,workers:s.w.length}};},
 draw:function(c,X){const s=X.S,acc=X.acc,tn=X.t/1000,N=X.def.nodes,st=X.ns;
  const sel=function(n,id){if(st[id]==='sel'){rr(c,n.x-4,n.y-4,n.w+8,n.h+8,12);c.strokeStyle=hexA(acc,.7);c.setLineDash([4,4]);c.lineWidth=1;c.stroke();c.setLineDash([]);}};
  /* producers */
  panel(c,N.prod.x,N.prod.y,N.prod.w,N.prod.h,'Producers');sel(N.prod,'prod');
  for(let i=0;i<3;i++){const y=N.prod.y+50+i*82;rr(c,N.prod.x+16,y,N.prod.w-32,56,8);c.fillStyle=K.card;c.fill();c.strokeStyle='#2A3958';c.stroke();
   T(c,'Table app '+(i+1),N.prod.x+28,y+20,FS(600,12),K.ink,'left');T(c,'orders',N.prod.x+28,y+38,FM(500,10),K.dim,'left');}
  T(c,'all tables: '+s.rate.toFixed(1)+' / s',N.prod.x+16,N.prod.y+N.prod.h-12,FM(600,10.5),s.rate>1?K.wait:K.dim,'left');
  /* queue */
  panel(c,N.queue.x,N.queue.y,N.queue.w,N.queue.h,'Queue'+(s.limit?' · limit '+s.limit:''));sel(N.queue,'queue');
  const slots=13,sw=28;for(let i=0;i<slots;i++){const x=N.queue.x+N.queue.w-20-sw-(i*(sw+3)),y=N.queue.y+36;
   const has=i<s.q.length;rr(c,x,y,sw,46,5);c.fillStyle=has?hexA(s.q.length>=6?K.wait:acc,.25):'#0D1424';c.fill();
   c.strokeStyle=has?(s.q.length>=6?K.wait:acc):'#1F2C47';c.lineWidth=1;c.stroke();
   if(has)T(c,String(s.q[i]),x+sw/2,y+23,FM(600,9),'#fff');
   if(s.limit&&i===s.limit-1){c.strokeStyle=K.bad;c.setLineDash([3,3]);c.beginPath();c.moveTo(x-2,y-8);c.lineTo(x-2,y+54);c.stroke();c.setLineDash([]);}}
  if(s.q.length>slots)T(c,'+'+(s.q.length-slots)+' more',N.queue.x+20,N.queue.y+59,FM(600,11),K.wait,'left');
  T(c,'head →',N.queue.x+N.queue.w-16,N.queue.y+96,FM(500,9),K.faint,'right');
  T(c,'depth '+s.q.length,N.queue.x+16,N.queue.y+96,FM(600,10.5),s.q.length>=6?K.wait:K.dim,'left');
  /* workers */
  panel(c,N.workers.x,N.workers.y,N.workers.w,N.workers.h,'Workers · '+s.w.length);sel(N.workers,'workers');
  s.w.forEach(function(w,k){const y=N.workers.y+30+k*60,x=N.workers.x+14,ww=N.workers.w-28;rr(c,x,y,ww,48,8);
   const busy=w.j!=null;c.fillStyle=busy?hexA(acc,.13):K.card;c.fill();c.strokeStyle=busy?acc:'#2A3958';c.stroke();
   T(c,'Worker '+(k+1),x+10,y+15,FS(600,11.5),K.ink,'left');T(c,busy?'#'+w.j:'idle',x+ww-10,y+15,FM(500,10),busy?'#fff':K.faint,'right');
   const f=busy?clamp((tn-w.s)/(w.u-w.s),0,1):0;rr(c,x+10,y+30,ww-20,6,3);c.fillStyle='#16203A';c.fill();
   if(busy){rr(c,x+10,y+30,(ww-20)*f,6,3);c.fillStyle=acc;c.fill();}});
  /* done */
  panel(c,N.done.x,N.done.y,N.done.w,N.done.h,'Done');sel(N.done,'done');
  T(c,String(s.done),N.done.x+N.done.w/2,N.done.y+56,FS(700,28),K.ok);
  if(s.rej)T(c,s.rej+' refused',N.done.x+N.done.w/2,N.done.y+88,FM(600,10),K.bad);
  /* packet */
  const E=X.E;if(E&&X.p>0&&E.pk&&E.src!==E.dst){let a,b;
   if(E.type==='job.enqueue'||E.type==='job.reject'){a={x:N.prod.x+N.prod.w-10,y:N.prod.y+78+((+E.pk.txt.slice(1)||0)%3)*82};
    b={x:N.queue.x+N.queue.w-20-sw/2-Math.min(slots-1,s.q.length)*(sw+3),y:N.queue.y+59};
    if(E.type==='job.reject'){const k=X.p<.6?X.p/.6:1-(X.p-.6)/.4;const q={x:a.x+(b.x-a.x)*ez(k),y:a.y+(b.y-a.y)*ez(k)};packet(c,q.x,q.y,'429',K.bad);a=null;}}
   else if(E.type==='job.start'){a={x:N.queue.x+N.queue.w-20-sw/2,y:N.queue.y+59};const k=+(E.data&&E.data.worker||1)-1;b={x:N.workers.x+30,y:N.workers.y+54+k*60};}
   else if(E.type==='job.done'){a={x:N.workers.x+N.workers.w-20,y:N.workers.y+100};b={x:N.done.x+10,y:N.done.y+56};}
   if(a&&b){const q={x:a.x+(b.x-a.x)*ez(X.p),y:a.y+(b.y-a.y)*ez(X.p)};packet(c,q.x,q.y,E.pk.txt,E.good?K.ok:acc);}}
  /* chart */
  const ch=N.chart;panel(c,ch.x,ch.y,ch.w,ch.h,'Queue depth over time');sel(ch,'chart');
  const x0=ch.x+40,x1=ch.x+ch.w-16,y0=ch.y+ch.h-22,y1=ch.y+26,TM=44,DM=Math.max(12,X.run.metrics.maxDepth+2);
  const px=function(t){return x0+(x1-x0)*t/TM;},py=function(d){return y0-(y0-y1)*d/DM;};
  c.fillStyle='rgba(255,198,92,.06)';c.fillRect(px(10),y1,px(30)-px(10),y0-y1);T(c,'rush 3/s',px(20),y1+8,FM(500,9),K.wait);
  c.strokeStyle='#22314F';c.beginPath();c.moveTo(x0,y0);c.lineTo(x1,y0);c.stroke();
  for(let t=0;t<=40;t+=10)T(c,t+'s',px(t),y0+11,FM(400,9),K.faint);
  T(c,String(DM),x0-8,y1,FM(400,9),K.faint,'right');T(c,'0',x0-8,y0,FM(400,9),K.faint,'right');
  c.beginPath();let first=true;s.hist.forEach(function(h){const x=px(h[0]),y=py(h[1]);if(first){c.moveTo(x,y);first=false;}else c.lineTo(x,y);});
  c.strokeStyle=acc;c.lineWidth=2;c.stroke();c.lineWidth=1;
  c.strokeStyle='rgba(255,255,255,.35)';c.beginPath();c.moveTo(px(tn),y1);c.lineTo(px(tn),y0);c.stroke();
  T(c,'λ '+s.rate.toFixed(1)+'/s  vs  μ ≈ '+(s.w.length/1.6).toFixed(2)+'/s',x1,y1-0,FM(600,10),s.rate>s.w.length/1.6?K.bad:K.ok,'right');
 },
 chapters:[
  {id:'problem',n:'The problem',html:'<p>Customers do not order at a steady rate. They arrive in bursts. If the kitchen has to keep up with every burst, it has to be sized for the worst minute of the week.</p>'},
  {id:'intuition',n:'The intuition',html:'<p>The ticket rail in a kitchen holds orders until a cook is free. A few tickets is normal. A rail that keeps getting longer means the kitchen cannot keep up, and every new ticket waits for all the ones ahead of it.</p>'},
  {id:'watch',n:'What you are watching',anchor:'start',html:'<p>Producers on the left, the queue in the middle (the head is on the right), and workers with progress bars. The chart shows depth over time, and the amber band is the rush. Compare λ (arrival rate) with μ (service rate).</p>'},
  {id:'mech',n:'How it works',anchor:'sat',html:'<p>If arrivals λ exceed throughput μ, depth grows at about <b>λ − μ</b> per second. A newly arrived job waits roughly <b>depth ÷ μ</b> (Little\'s law: L = λW). Utilisation near 100% means queueing delay goes up very steeply, even before λ &gt; μ.</p>'},
  {id:'code',n:'Code',html:code("# producer: refuse at the door when the backlog is too deep\nif broker.queue_depth('kitchen') >= LIMIT:\n    return Response(status=429, headers={'Retry-After': '5'})\nprint_ticket.delay(order_id)\n\n# consumer: concurrency is set by how many of these run\n@app.task(acks_late=True, max_retries=5)\ndef print_ticket(order_id):\n    ...\n\n# autoscale on depth, not CPU (KEDA / HPA external metric)\n#   target: queue_depth / workers <= 4")},
  {id:'trade',n:'Trade-offs',anchor:'resp',html:'<ul><li><b>Add workers</b>: it works when the bottleneck is the workers. It costs money, and the next dependency, often the database, has to absorb the extra load.</li><li><b>Backpressure</b> keeps wait time bounded and protects downstream systems. Some customers are refused, and they need a good retry story.</li><li><b>Unbounded queue</b>: nothing is refused, but waits grow without limit, memory grows, and jobs may be worthless by the time they run.</li></ul>'},
  {id:'fail',n:'Failure modes',html:'<ul><li>A <b>poison message</b> crashes the worker forever. Use max retries plus a dead-letter queue.</li><li>Autoscaling on CPU instead of depth reacts too late.</li><li>Retries from refused clients without jitter arrive as a second, synchronised wave.</li></ul>'},
  {id:'prod',n:'In production',anchor:'end',html:'<ul><li>Alert on <b>age of the oldest message</b>, not just depth.</li><li>Expose depth, throughput and wait-time percentiles.</li><li>Decide in advance which work can be shed during an incident.</li></ul>'},
  {id:'rel',n:'Related',rel:['tasks','rabbitmq','retries','orchestration','scaling']},
  {id:'check',n:'Check yourself',quiz:[
   {q:'Arrivals 3/s, two workers at 1.6 s each. Roughly how fast does depth grow?',a:['≈0.5/s','≈1.75/s','It stays flat'],ok:1,why:'μ ≈ 2/1.6 ≈ 1.25/s, so depth grows by about 3 − 1.25 = 1.75 per second.'},
   {q:'What does backpressure trade?',a:['Latency for throughput','Refused requests for bounded waiting','Memory for CPU'],ok:1,why:'Some work is refused at the door so that the work accepted is done in reasonable time.'}]}]
});

})();

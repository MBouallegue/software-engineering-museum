(function(){
const {STAGES,K,W,H,clone,clamp,ez,rng,hexA,ms,Rec,pace,grid,ctr,stateCol,drawNode,edgePts,polyAt,drawEdges,packet,dot,drawPacket,panel,kv,nodeStates,code,SC}=StoryKit;
/* ---------------- E · A distributed failure ---------------- */
SC.push({id:'failure',hall:'retries',wing:'tasks',letter:'E',title:'A distributed failure: the payment provider hangs',
 question:'The payment provider does not go down. It just stops answering for four seconds. What happens to every other customer?',
 intuition:'A dependency that hangs ties up whatever is waiting for it. When the API\'s threads are all waiting on payment, customers who never touch payment have to wait as well.',
 takeaway:'A timeout puts an upper limit on each wait. Retries without backoff add load to a provider that is already struggling. A circuit breaker stops calling the provider until a single test call succeeds, and a fallback gives customers a reduced answer in the meantime.',
 next:'replay',custom:true,
 nodes:{customer:{x:20,y:176,w:140,h:96,label:'Customers'},api:{x:220,y:140,w:250,h:170,label:'API'},breaker:{x:510,y:186,w:130,h:76,label:'Circuit breaker'},payment:{x:690,y:176,w:250,h:96,label:'Payment provider'},strip:{x:20,y:350,w:920,h:174,label:'Requests'}},
 options:[{id:'pol',label:'Resilience policy',primary:true,def:'none',choices:[['none','Wait forever'],['timeout','Timeout 800 ms'],['retry','Timeout + 2 retries'],['breaker','Timeout + circuit breaker']],
  note:'The provider hangs from 1.5 s to 5.5 s. The API has 4 worker threads. Customers give up after 3 s.'}],
 metrics:[['ok','Paid',String,1],['deg','Fallback (“pay at the counter”)',String,0],['fail','Errors',String,-1],['gave','Customers who gave up',String,-1],
  ['lat','Mean time to an answer',function(v){return ms(v);},-1],['calls','Calls sent to the provider',String,0],['peakWait','Peak requests waiting for a thread',String,-1]],
 obj:{customer:{what:'32 customers paying, one every 250 ms.',why:'Each one has a 3 s patience budget.',rel:['rest','delivery'],state:function(s){return s.gave+' have given up so far.';}},
  api:{what:'The API, with a pool of 4 threads. Each request holds a thread until it gets its answer.',why:'Pools bound concurrency. When every thread is waiting, the next request has to queue.',rel:['scaling','tasks'],
   state:function(s){return s.busy.filter(function(b){return b!=null;}).length+'/4 threads busy · '+s.wait.length+' waiting.';}},
  breaker:{what:'Tracks recent failures. Closed lets calls through, Open fails them fast, Half-open lets one test call through.',why:'Stops sending calls to a dependency that is known to be broken.',rel:['retries'],state:function(s){return 'State: '+s.br+(s.br==='open'?' until '+ms(s.openUntil):'');}},
  payment:{what:'Someone else\'s system, reached over a network you do not control.',why:'You cannot fix it, only defend against it.',rel:['retries','delivery'],state:function(s){return s.inc?'Hanging: calls take 6 s.':'Healthy: about 120 ms.';}},
  strip:{what:'One square per request, coloured by outcome.',why:'Shows where the damage landed and how far it spread.',rel:['retries'],state:function(s){return s.done+' answered.';}}},
 build:function(o){
  const POOL=4,N=32,GAP=250,CLIENT=3000,TO=o.pol==='none'?Infinity:800,I0=1500,I1=5500,r=rng(5);
  const lat=function(t){return t>=I0&&t<I1?6000:120;};
  const reqs=[];for(let i=0;i<N;i++)reqs.push({id:i,at:i*GAP,st:'new',tries:0,end:0,gave:false});
  const R=new Rec({busy:[null,null,null,null],wait:[],req:reqs,br:'closed',fails:0,openUntil:0,probe:false,inc:false,calls:0,fl:[],done:0,gave:0,peakWait:0,opens:0});
  const ag=[];let seq=0;const push=function(t,k,d){const x={t:t,k:k,d:d||{},seq:seq++};ag.push(x);ag.sort(function(a,b){return a.t-b.t||a.seq-b.seq;});};
  reqs.forEach(function(q){push(q.at,'arrive',{id:q.id});push(q.at+CLIENT,'patience',{id:q.id});});
  push(I0,'incStart');push(I1,'incEnd');
  R.add({at:0,type:'setup',src:'payment',dst:'payment',stage:1,key:'start',hold:true,dur:1.4,label:'Normal service',pk:{txt:'120 ms'},chapter:'watch',
   say:'Customers pay at a steady rate. The provider answers in about <b>120 ms</b>, and the API needs at most one of its 4 threads at a time.',data:{policy:{none:'no timeout',timeout:'timeout 800 ms',retry:'timeout 800 ms + 2 retries with backoff',breaker:'timeout 800 ms + breaker (3 failures → open 1.5 s)'}[o.pol]}});
  function freeThread(t){
   if(R.s.wait.length){const n=R.s.wait[0];R.add({at:t,type:'pool.acquire',src:'api',dst:'api',pk:{txt:'thread → #'+n},label:'#'+n+' gets a thread',
     fx:function(s){s.wait.shift();s.busy[s.busy.indexOf(null)]=n;s.req[n].st='run';},say:'A thread frees up. Request <b>#'+n+'</b> has waited '+ms(t-reqs[n].at)+' for it.'});attempt(t,n);}}
  function respond(t,id,out,why){const q=R.s.req[id];
   R.add({at:t,type:'http.response',src:'api',dst:'customer',pk:{txt:out==='ok'?'200':out==='deg'?'200 fallback':'503'},good:out==='ok',warn:out==='deg',bad:out==='fail',
    label:'#'+id+' '+(out==='ok'?'paid':out==='deg'?'fallback':'error'),
    fx:function(s){s.req[id].st=out;s.req[id].end=t;s.done++;const b=s.busy.indexOf(id);if(b>=0)s.busy[b]=null;},say:'Request <b>#'+id+'</b> answered after <b>'+ms(t-q.at)+'</b>: '+(out==='ok'?'paid.':out==='deg'?'“we could not reach payment; pay at the counter.”':'error.')+(q.gave?' <b>Too late: the customer had already left.</b>':'')+(why||'')});
   freeThread(t);}
  function attempt(t,id){const s=R.s;
   if(o.pol==='breaker'){
    if(s.br==='open'&&t<s.openUntil){R.add({at:t,type:'breaker.reject',src:'api',dst:'breaker',warn:true,pk:{txt:'fail fast'},label:'#'+id+' fails fast',
      say:'Breaker is <b>open</b>, so the call is not sent. The fallback answers immediately.'});respond(t,id,'deg');return;}
    if(s.br==='open'&&t>=s.openUntil){R.add({at:t,type:'breaker.half',src:'breaker',dst:'breaker',warn:true,pk:{txt:'half-open'},key:R.s.opens===1?'half':null,label:'Half-open: one probe',
      fx:function(s){s.br='half';s.probe=true;},say:'The open period is over. The breaker goes <b>half-open</b> and lets <b>one</b> test call through. Everyone else still gets the fallback.'});
     return send(t,id,true);}
    if(s.br==='half'&&s.probe){R.add({at:t,type:'breaker.reject',src:'api',dst:'breaker',warn:true,pk:{txt:'fail fast'},label:'#'+id+' fails fast',say:'A test call is already in flight, so this request gets the fallback.'});respond(t,id,'deg');return;}}
   send(t,id,false);}
  function send(t,id,probe){const L=lat(t);const tr=R.s.req[id].tries;
   R.add({at:t,type:'call',src:o.pol==='breaker'?'breaker':'api',dst:'payment',pk:{txt:(probe?'probe ':'charge ')+'#'+id},label:'#'+id+' calls payment'+(tr?' (retry '+tr+')':''),key:tr===1&&o.pol==='retry'&&!R.__rk?(R.__rk=1,'retry'):null,
    fx:function(s){s.calls++;s.fl.push({id:id,s:t,r:t+L,e:Math.min(t+L,t+TO)});},say:'Request <b>#'+id+'</b> calls the provider'+(tr?' again (attempt '+(tr+1)+')':'')+'. '+(L>200?'The provider is hanging, so this call will take <b>'+ms(L)+'</b>.':'About 120 ms.'),
    data:{attempt:String(tr+1),timeout:isFinite(TO)?TO+' ms':'none',expected:ms(L)},hold:false});
   if(L<=TO)push(t+L,'reply',{id:id,probe:probe});else push(t+TO,'timeout',{id:id,probe:probe});}
  let firstTO=false,firstWait=false,firstGive=false,firstOpen=false;
  while(ag.length){const a=ag.shift(),t=a.t,id=a.d.id;
   if(a.k==='incStart'){R.add({at:t,type:'incident',src:'payment',dst:'payment',bad:true,hold:true,key:'inc',stage:2,dur:1.3,pk:{txt:'hanging'},chapter:'mech',label:'Provider starts hanging',
     fx:function(s){s.inc=true;},say:'The provider <b>stops answering</b>. Calls do not fail, they just hang for 6 s. Nothing returns an error.'});continue;}
   if(a.k==='incEnd'){R.add({at:t,type:'incident.end',src:'payment',dst:'payment',good:true,key:'recover',dur:1,pk:{txt:'healthy'},label:'Provider recovers',
     fx:function(s){s.inc=false;},say:'The provider is healthy again. Calls take 120 ms once more.'});continue;}
   if(a.k==='arrive'){const free=R.s.busy.indexOf(null);
    if(free>=0){R.add({at:t,type:'http.request',src:'customer',dst:'api',pk:{txt:'#'+id},label:'#'+id+' arrives',fx:function(s){s.busy[free]=id;s.req[id].st='run';},say:'Request <b>#'+id+'</b> arrives and gets a thread.'});attempt(t,id);}
    else{const w1=!firstWait;firstWait=true;R.add({at:t,type:'pool.wait',src:'customer',dst:'api',warn:true,pk:{txt:'#'+id+' waits'},label:'#'+id+' waits for a thread',hold:w1,key:w1?'pool':null,stage:w1?3:undefined,chapter:w1?'trade':null,
      fx:function(s){s.wait.push(id);s.req[id].st='wait';if(s.wait.length>s.peakWait)s.peakWait=s.wait.length;},say:'All 4 threads are busy waiting on payment, so request <b>#'+id+'</b> has to queue for a thread.',
      why:w1?{cause:'Every thread is held by a call to the hanging provider'+(isFinite(TO)?' (for up to '+TO+' ms each)':', with no time limit')+'.',consequence:'New requests wait for a thread. The hang has spread from payment into the API.',response:'Bound every call with a timeout. Stop calling a dependency that is known to be broken.',tradeoff:'A shorter timeout fails some calls that would have succeeded slowly.'}:null});}
    continue;}
   if(a.k==='patience'){const q=R.s.req[id];if(q.end)continue;const g1=!firstGive;firstGive=true;
    R.add({at:t,type:'client.giveup',src:'customer',dst:'customer',bad:true,pk:{txt:'#'+id+' leaves'},label:'#'+id+' gives up',hold:g1,key:g1?'give':null,stage:g1?3:undefined,
     fx:function(s){s.req[id].gave=true;s.gave++;},say:'Customer <b>#'+id+'</b> has waited 3 s and gives up. The server <b>keeps working</b> on a request that nobody is waiting for any more.'});continue;}
   if(a.k==='reply'){if(!R.s.fl.some(function(f){return f.id===id;}))continue;
    R.add({at:t,type:'call.ok',src:'payment',dst:o.pol==='breaker'?'breaker':'api',good:true,pk:{txt:'✓ #'+id},label:'#'+id+' charged',
     fx:function(s){s.fl=s.fl.filter(function(f){return f.id!==id;});if(a.d.probe||s.br==='half'){s.br='closed';s.fails=0;s.probe=false;}else s.fails=0;},
     say:'The provider confirms the charge for <b>#'+id+'</b>.'+(a.d.probe?' The test call succeeded, so the breaker <b>closes</b>.':'')});
    respond(t,id,'ok');continue;}
   if(a.k==='timeout'){const t1=!firstTO;firstTO=true;
    R.add({at:t,type:'call.timeout',src:o.pol==='breaker'?'breaker':'api',dst:o.pol==='breaker'?'breaker':'api',bad:true,pk:{txt:'timeout #'+id},label:'#'+id+' timed out',hold:t1,key:t1?'timeout':null,stage:t1?4:undefined,chapter:t1?'mech':null,
     fx:function(s){s.fl=s.fl.filter(function(f){return f.id!==id;});s.fails++;if(s.br==='half'){s.br='open';s.openUntil=t+1500;s.probe=false;}},
     say:'Request <b>#'+id+'</b> stops waiting after '+TO+' ms. The thread is freed. The provider may still process the charge, which is why idempotency keys matter.',
     why:t1?{cause:'The provider has not answered within '+TO+' ms.',consequence:'The wait is bounded. The thread returns to the pool instead of being held for 6 s.',response:o.pol==='retry'?'Retry with backoff.':o.pol==='breaker'?'Count the failure. Enough failures open the breaker.':'Return an error quickly.',tradeoff:'The charge may still go through at the provider. Retrying without an idempotency key can charge twice.'}:null});
    if(o.pol==='breaker'&&R.s.br==='closed'&&R.s.fails>=3){const f1=!firstOpen;firstOpen=true;
     R.add({at:t,type:'breaker.open',src:'breaker',dst:'breaker',bad:true,pk:{txt:'OPEN'},hold:f1,key:f1?'open':null,stage:4,chapter:'trade',label:'Breaker opens',
      fx:function(s){s.br='open';s.openUntil=t+1500;s.opens++;},say:'Three failures in a row, so the breaker <b>opens</b>. For 1.5 s no calls are sent and every request gets the fallback immediately.',
      why:{cause:'3 consecutive timeouts.',consequence:'No more threads are tied up and the provider gets no load. Customers get “pay at the counter” in milliseconds.',response:'After 1.5 s, one test call checks whether the provider has recovered.',tradeoff:'While it is open, some calls that would have worked are refused. The fallback has to be acceptable to the business.'}});}
    const q=R.s.req[id];
    if(o.pol==='retry'&&q.tries<2){const b=Math.round((200*Math.pow(2,q.tries))*(.5+r()));
     R.add({at:t,type:'retry.wait',src:'api',dst:'api',warn:true,pk:{txt:'backoff '+b+' ms'},label:'#'+id+' backs off '+b+' ms',fx:function(s){s.req[id].tries++;},
      say:'Request <b>#'+id+'</b> will retry after <b>'+b+' ms</b> of jittered backoff. It keeps its thread while it waits.'});push(t+b,'retry',{id:id});}
    else if(o.pol==='breaker')respond(t,id,'deg');
    else respond(t,id,'fail');
    continue;}
   if(a.k==='retry'){attempt(t,id);continue;}
  }
  R.add({type:'end',src:'strip',dst:'strip',stage:7,key:'end',hold:true,dur:1.2,chapter:'prod',label:'Summary',
   say:'Every request has been answered. Look at the strip of squares, then try another policy in the Experiment tab.'});
  pace(R.ev,.0009,.06,1.3);
  const s=R.s,c=function(k){return s.req.filter(function(q){return q.st===k;}).length;};
  const lat2=s.req.map(function(q){return Math.min(q.end-q.at,CLIENT);});
  return{s0:R.s0,events:R.ev,metrics:{ok:c('ok'),deg:c('deg'),fail:c('fail'),gave:s.gave,lat:lat2.reduce(function(a,b){return a+b;},0)/N,calls:s.calls,peakWait:s.peakWait}};},
 draw:function(c,X){const s=X.S,N=X.def.nodes,acc=X.acc,tn=X.t,o=X.opts,st=X.ns;
  const box=function(n,id,title,col){panel(c,n.x,n.y,n.w,n.h,title);if(st[id]==='active'||st[id]==='bad'||st[id]==='ok'||st[id]==='wait'){rr(c,n.x,n.y,n.w,n.h,10);c.strokeStyle=stateCol(st[id],acc);c.lineWidth=2;c.stroke();}
   if(st[id]==='sel'){rr(c,n.x-4,n.y-4,n.w+8,n.h+8,12);c.strokeStyle=hexA(acc,.7);c.setLineDash([4,4]);c.lineWidth=1;c.stroke();c.setLineDash([]);}};
  box(N.customer,'customer','Customers');T(c,'1 every 250 ms',N.customer.x+14,N.customer.y+42,FM(500,10),K.dim,'left');
  T(c,'patience 3 s',N.customer.x+14,N.customer.y+60,FM(500,10),K.dim,'left');if(s.gave)T(c,s.gave+' gave up',N.customer.x+14,N.customer.y+80,FM(600,10.5),K.bad,'left');
  box(N.api,'api','API · 4 threads');
  for(let i=0;i<4;i++){const x=N.api.x+16+i*58,y=N.api.y+34,b=s.busy[i];rr(c,x,y,50,52,7);c.fillStyle=b!=null?hexA(acc,.18):K.card;c.fill();c.strokeStyle=b!=null?acc:'#2A3958';c.lineWidth=1;c.stroke();
   T(c,'T'+(i+1),x+25,y+14,FM(500,8.5),K.faint);T(c,b!=null?'#'+b:'free',x+25,y+34,FM(600,11),b!=null?'#fff':K.faint);}
  T(c,'waiting for a thread: '+s.wait.length,N.api.x+16,N.api.y+106,FM(600,10.5),s.wait.length?K.wait:K.dim,'left');
  for(let i=0;i<Math.min(s.wait.length,18);i++){dot(c,N.api.x+20+i*12,N.api.y+128,4,K.wait);}
  T(c,isFinite(o.pol==='none'?Infinity:800)?'timeout 800 ms':'no timeout',N.api.x+N.api.w-14,N.api.y+150,FM(500,9.5),o.pol==='none'?K.bad:K.dim,'right');
  if(o.pol==='breaker'){const bc=s.br==='closed'?K.ok:s.br==='open'?K.bad:K.wait;box(N.breaker,'breaker','Circuit breaker');
   rr(c,N.breaker.x+14,N.breaker.y+30,N.breaker.w-28,24,12);c.fillStyle=hexA(bc,.2);c.fill();c.strokeStyle=bc;c.stroke();
   T(c,s.br.toUpperCase(),N.breaker.x+N.breaker.w/2,N.breaker.y+42,FM(700,11),bc);T(c,'failures '+s.fails,N.breaker.x+N.breaker.w/2,N.breaker.y+66,FM(500,9),K.faint);}
  else{c.strokeStyle='#22314F';c.setLineDash([4,4]);rr(c,N.breaker.x,N.breaker.y,N.breaker.w,N.breaker.h,10);c.stroke();c.setLineDash([]);T(c,'no breaker',N.breaker.x+N.breaker.w/2,N.breaker.y+N.breaker.h/2,FM(500,10),K.faint);}
  box(N.payment,'payment','Payment provider');
  T(c,s.inc?'HANGING · 6 s per call':'healthy · 120 ms',N.payment.x+14,N.payment.y+44,FS(700,14),s.inc?K.bad:K.ok,'left');
  T(c,'calls received: '+s.calls,N.payment.x+14,N.payment.y+70,FM(500,10),K.dim,'left');
  /* wires + in-flight calls */
  const ax=N.api.x+N.api.w,bx=N.payment.x,wy=N.api.y+N.api.h/2+6;
  c.strokeStyle='#26365A';c.beginPath();c.moveTo(N.customer.x+N.customer.w,N.customer.y+48);c.lineTo(N.api.x,N.customer.y+48);c.moveTo(ax,wy);c.lineTo(bx,wy);c.stroke();
  s.fl.forEach(function(f,i){const k=clamp((tn-f.s)/Math.max(1,f.r-f.s),0,1);const x=ax+(bx-ax)*k,y=wy-18+(i%5)*9;
   dot(c,x,y,4,f.r-f.s>1000?K.bad:acc);if(isFinite(f.e)&&f.e<f.r){const ke=clamp((f.e-f.s)/(f.r-f.s),0,1);c.strokeStyle=hexA(K.wait,.5);c.beginPath();c.moveTo(ax+(bx-ax)*ke,y-5);c.lineTo(ax+(bx-ax)*ke,y+5);c.stroke();}});
  T(c,'in flight: '+s.fl.length,(ax+bx)/2,wy+38,FM(500,9.5),K.faint);
  /* packet */
  const E=X.E;if(E&&X.p>0&&E.pk){const col=E.bad?K.bad:E.good?K.ok:E.warn?K.wait:acc;let a,b;
   const C=function(n){return ctr(N[n]);};
   if(E.src===E.dst){const q=C(E.src);packet(c,q.x,N[E.src].y-14,E.pk.txt,col);}
   else{a=C(E.src);b=C(E.dst);const q={x:a.x+(b.x-a.x)*ez(X.p),y:a.y+(b.y-a.y)*ez(X.p)};packet(c,q.x,q.y,E.pk.txt,col);}}
  /* strip */
  const sp=N.strip;box(sp,'strip','Every request, in arrival order');
  const x0=sp.x+16,y0=sp.y+34;
  s.req.forEach(function(q,i){const x=x0+i*28,y=y0;const col=q.st==='ok'?K.ok:q.st==='deg'?K.wait:q.st==='fail'?K.bad:q.st==='run'?acc:q.st==='wait'?'#6B5A2E':'#1C2740';
   rr(c,x,y,24,24,5);c.fillStyle=q.st==='new'?'#0D1424':hexA(col,q.st==='run'||q.st==='wait'?.35:.85);c.fill();c.strokeStyle=q.gave?K.bad:'#26365A';c.lineWidth=q.gave?2:1;c.stroke();
   if(q.gave){c.strokeStyle=K.bad;c.beginPath();c.moveTo(x+6,y+6);c.lineTo(x+18,y+18);c.stroke();}
   if(i%4===0)T(c,'#'+i,x+12,y+36,FM(400,8.5),K.faint);});
  const px=function(t){return x0+(t/250)*28;};
  c.fillStyle='rgba(255,122,107,.10)';c.fillRect(px(1500),y0+50,px(5500)-px(1500),20);T(c,'provider hanging',(px(1500)+px(5500))/2,y0+60,FM(500,9),K.bad);
  c.strokeStyle='rgba(255,255,255,.35)';const nx=px(Math.min(tn,8000));c.beginPath();c.moveTo(nx,y0-6);c.lineTo(nx,y0+74);c.stroke();
  const L=[['paid',K.ok],['fallback',K.wait],['error',K.bad],['in progress',acc],['waiting',"#6B5A2E"]];
  L.forEach(function(l,i){const x=x0+i*120,y=sp.y+sp.h-22;rr(c,x,y-6,12,12,3);c.fillStyle=l[1];c.fill();T(c,l[0],x+18,y,FS(400,10.5),K.dim,'left');});
  T(c,'✕ = customer gave up',x0+600,sp.y+sp.h-22,FS(400,10.5),K.bad,'left');
 },
 chapters:[
  {id:'problem',n:'The problem',html:'<p>Your system depends on a system you do not run. When it fails cleanly, you get an error and move on. When it <b>hangs</b>, every caller waits, and waiting callers hold threads, connections and memory that other customers need.</p>'},
  {id:'intuition',n:'The intuition',html:'<p>If every waiter stands at the card terminal waiting for a bank that will not answer, nobody takes new orders, including from customers paying in cash.</p>'},
  {id:'watch',n:'What you are watching',anchor:'start',html:'<p>The API\'s four threads are the four boxes. Dots on the wire are calls in flight: red dots are crawling through a hang, and the amber tick marks where a timeout will cut the call off. The strip at the bottom has one square per customer.</p>'},
  {id:'mech',n:'How the failure spreads',anchor:'inc',html:'<p>Hanging calls hold threads, so the pool fills up and new requests queue for a thread. Then customers time out on their side while the server is still working. The failure moves <b>upstream</b> to callers that never touched payment. A timeout stops this by limiting how long a thread can be held.</p>'},
  {id:'code',n:'Code',html:code("breaker = CircuitBreaker(fail_max=3, reset_timeout=1.5)\n\ndef charge(order):\n    try:\n        with breaker:                                   # open → raises fast\n            return provider.charge(order, timeout=0.8,  # ALWAYS bound it\n                       idempotency_key=f\"order-{order.id}\")\n    except (CircuitOpen, Timeout):\n        return Fallback(\"pay at the counter\")\n\n# retries: exponential backoff + full jitter, capped attempts\nfor i in range(3):\n    try: return charge_once()\n    except Timeout: time.sleep(random.uniform(0, 0.2 * 2**i))")},
  {id:'trade',n:'Trade-offs',anchor:'open',html:'<ul><li><b>Timeout</b>: bounds the damage, but some slow successes become failures.</li><li><b>Retries</b>: help with brief glitches, but multiply the load on a provider that is already struggling. Compare “calls sent” in the Experiment tab.</li><li><b>Circuit breaker</b>: protects you and the provider, but refuses some calls that would have worked, and needs a fallback the business accepts.</li></ul>'},
  {id:'fail',n:'Failure modes',html:'<ul><li>No timeout anywhere: a single hanging dependency can take down everything.</li><li>Retries at every layer: 3 × 3 × 3 = 27 calls per click.</li><li>Retrying a charge without an idempotency key charges the customer twice.</li><li>A breaker with no fallback just turns a slow error into a fast one.</li></ul>'},
  {id:'prod',n:'In production',anchor:'end',html:'<ul><li>Set timeout budgets from the top down: an inner timeout must be shorter than the outer one.</li><li>Use bulkheads: a separate pool for each dependency, so payment cannot use up the threads that menu reads need.</li><li>Alert on breaker state changes and on saturation, not just on error rates.</li></ul>'},
  {id:'rel',n:'Related',rel:['retries','delivery','scaling','cap','tasks']},
  {id:'check',n:'Check yourself',quiz:[
   {q:'Why do customers who never touch payment get slow too?',a:['The network is slow','Their requests wait for threads held by hanging payment calls','Payment is called for everyone'],ok:1,why:'Shared pools spread the failure. Bulkheads and timeouts contain it.'},
   {q:'What makes retrying a charge safe?',a:['Waiting longer','An idempotency key the provider de-duplicates on','Using POST'],ok:1,why:'A timed-out call may have succeeded. The key makes the second attempt a no-op.'}]}]
});

})();

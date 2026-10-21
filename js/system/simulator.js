/* ======================================================================
   THE NERVOUS SYSTEM — one event bus
   Everything that happens in the restaurant is an event with a type, a
   source, a destination, a trace id and a timestamp. The floor actors,
   the debugger, the log, the trace waterfall and the time machine all
   read the same events. None of them is a separate fake animation.
   ====================================================================== */
const BUS={
 subs:{},log:[],max:900,seq:0,rate:0,_n:0,_t:0,
 on:function(type,fn){(this.subs[type]=this.subs[type]||[]).push(fn);return fn;},
 emit:function(ev){
  ev.seq=++this.seq;this._n++;
  this.log.push(ev);if(this.log.length>this.max)this.log.shift();
  const a=this.subs[ev.type],b=this.subs['*'];
  if(a)for(let i=0;i<a.length;i++)a[i](ev);
  if(b)for(let i=0;i<b.length;i++)b[i](ev);
  return ev;},
 /* events per simulated second, for the performance readout */
 meter:function(t){if(t-this._t>=1){this.rate=this._n/(t-this._t);this._n=0;this._t=t;}}
};

/* What each event means. The debugger reads WHAT/WHY straight from here,
   and CONCEPT says which hall explains it, so a step in a trace is always
   one click away from the idea behind it. */
const EVT={
 REQUEST_SENT:     {what:'The client sends the request.',why:'A customer tapped "order". The phone serialises the cart as JSON and opens an HTTPS request.',concept:'rest',risk:'The network can drop or delay it before anyone sees it.'},
 ROUTED:           {what:'The load balancer picks an API instance.',why:'Several identical instances exist so no single box is the ceiling. Round-robin or least-connections decides which.',concept:'scaling',risk:'Sticky state on one instance breaks this — instances must be stateless.'},
 REQUEST_RECEIVED: {what:'The API accepts the request and validates it.',why:'The HTTP contract is checked at the door: method, path, headers, body shape.',concept:'rest',risk:'A saturated API queues requests before it ever reads them.'},
 REQUEST_REJECTED: {what:'Validation failed — 400 Bad Request.',why:'The body did not match the contract (a missing field, a quantity of zero). The client must change the request; retrying the same one will never work.',concept:'rest',risk:'Retrying a 400 is a bug in the client.',bad:1},
 RATE_LIMITED:     {what:'The door is closed for now — 429 Too Many Requests.',why:'The rate limiter sheds load at the edge instead of letting every request queue behind a saturated API. Retry-After tells the client when to come back.',concept:'scaling',risk:'Without it, overload turns into latency for everyone.',bad:1},
 AUTH_OK:          {what:'Identity verified.',why:'The bearer token\'s signature and expiry are checked. The order service now knows who is asking.',concept:'rest',risk:'An auth service that is slow makes every request slow.'},
 AUTH_FAILED:      {what:'Identity rejected — 401 Unauthorized.',why:'The token was expired or forged. Nothing behind this point runs.',concept:'rest',risk:'Returning 404 instead is sometimes deliberate: it hides what exists.',bad:1},
 USE_CASE:         {what:'The order service runs PlaceOrder.',why:'The domain logic — the hexagon\'s centre — decides what "placing an order" means, independent of HTTP or SQL.',concept:'architecture',risk:'Business rules leaking into controllers make this step impossible to test alone.'},
 CACHE_HIT:        {what:'Cache hit — the menu was already in memory.',why:'Menu reads outnumber writes by far; the cache answers in about a millisecond and the database never hears about it.',concept:'scaling',risk:'The answer may be stale by up to the TTL.'},
 CACHE_MISS:       {what:'Cache miss — go to the database.',why:'The key expired or was never loaded. The request pays the full database cost, then fills the cache for the next one.',concept:'scaling',risk:'Many simultaneous misses on one hot key is a stampede.'},
 FALLBACK:         {what:'Degraded mode — served from the cache only.',why:'The database is unavailable, and a fallback was configured: accept the order as pending instead of failing.',concept:'scaling',risk:'The customer is told less than a normal confirmation.'},
 DB_QUERY:         {what:'The database executes the query.',why:'INSERT the order and read what the cache did not have. With an index this is a short B-tree descent.',concept:'database',risk:'Latency grows sharply as utilisation approaches 100% — queueing, not failure.'},
 DB_SCAN:          {what:'Full table scan.',why:'There is no usable index, so the database reads every row to find the few it needs.',concept:'indexes',risk:'Cost grows with the table, not with the answer.',bad:1},
 TRANSACTION_COMMIT:{what:'COMMIT — the order is durable.',why:'The write-ahead log is flushed; the row now survives a crash. 201 Created is now a true statement.',concept:'transactions',risk:'Commit latency is disk latency.'},
 DB_REFUSED:       {what:'The database is down — 500.',why:'No connection could be made. Without a fallback, the request has nowhere to go.',concept:'database',risk:'Callers without timeouts hang here.',bad:1},
 DB_SATURATED:     {what:'Database saturated — 503.',why:'Utilisation is above capacity; new work is refused instead of queued forever.',concept:'indexes',risk:'Retries now add load to the thing that is already overloaded.',bad:1},
 NO_QUORUM:        {what:'Partition — the write cannot be confirmed (503).',why:'This side of the network cannot reach a majority. It refuses rather than guess: the CP choice.',concept:'cap',risk:'Availability is what you gave up.',bad:1},
 PAYMENT_CHARGED:  {what:'The payment provider charges the card.',why:'A network call to someone else\'s system — the slowest hop on a healthy day.',concept:'retries',risk:'Their outage becomes yours unless you bound the wait.'},
 CIRCUIT_OPEN:     {what:'Circuit open — payment skipped, charge deferred.',why:'Recent calls failed, so the breaker fails fast instead of waiting. The order continues and the charge is retried later.',concept:'retries',risk:'Deferred work must be reconciled.'},
 TIMEOUT:          {what:'Timed out waiting for payment — 504.',why:'A timeout bounded the wait to one second. The caller is free, but the order failed.',concept:'retries',risk:'Did the charge actually happen? Only an idempotency key makes a retry safe.',bad:1},
 HUNG:             {what:'Hung on payment — no timeout set.',why:'Nothing told this request to stop waiting. It holds a connection and a thread for eight seconds.',concept:'retries',risk:'Enough of these exhaust the pool and take down unrelated requests.',bad:1},
 MESSAGE_PUBLISHED:{what:'A job is published to the queue.',why:'Receipts and kitchen tickets do not need to finish before the customer gets an answer.',concept:'tasks',risk:'If workers cannot keep up, depth grows without bound.'},
 RESPONSE:         {what:'The response returns to the client.',why:'The status code tells the client exactly what happened — and whether retrying could help.',concept:'rest',risk:''},
 WORK_STARTED:     {what:'A worker takes the job.',why:'Workers pull at their own pace; the queue decouples their speed from the customers\'.',concept:'tasks',risk:'A worker can die mid-job and the job will be delivered again.'},
 WORK_COMPLETED:   {what:'The worker finishes and acknowledges.',why:'Ack after the work, not before: at-least-once delivery.',concept:'delivery',risk:''},
 EVENT_APPENDED:   {what:'OrderPlaced is appended to the event log.',why:'The log keeps it; any number of consumers can read it at their own offset.',concept:'kafka',risk:'Consumer lag grows if readers fall behind.'},
 EVENT_CONSUMED:   {what:'Notifications consumes OrderPlaced.',why:'One event, many independent subscribers — the kitchen display, the SMS, the analytics.',concept:'pubsub',risk:''},
 DUPLICATE:        {what:'The same job arrives twice.',why:'At-least-once delivery redelivered it after a lost acknowledgement.',concept:'delivery',risk:'Without an idempotency key, the customer is charged twice.',bad:1},
 DUPLICATE_IGNORED:{what:'Duplicate recognised and ignored.',why:'The idempotency key was already in the processed table. The second delivery is a no-op.',concept:'delivery',risk:''}
};
const STATUS_TEXT={200:'OK',201:'Created',202:'Accepted',400:'Bad Request',401:'Unauthorized',404:'Not Found',
 429:'Too Many Requests',500:'Internal Server Error',503:'Service Unavailable',504:'Gateway Timeout'};

/* ======================================================================
   THE SIMULATOR
   A small queueing model. Latency comes from utilisation, not from a
   random number — so the control room can teach why a system falls over
   at 85% load and not at 50%.
   ====================================================================== */
const SIM={
 t:0, stage:4, paused:false, timeScale:1, headless:false,
 archive:[], snaps:[], jobs:[], running:[],
 knobs:{traffic:40, cache:true, index:true, workers:3, replicas:2, api:2, async:true, cacheTTL:30},
 fail:{}, guard:{},
 reqs:[], nextId:1842, trace:null,
 m:{rps:0,p50:0,p95:0,err:0,hit:0,dbLoad:0,apiLoad:0,queue:0,lag:0,workerLoad:0,ok:0,failed:0},
 hist:[], win:[],

 node:function(id){for(let i=0;i<SYS_NODES.length;i++)if(SYS_NODES[i].id===id)return SYS_NODES[i];return null;},
 off:{},                              /* components the visitor chose not to build */
 live:function(id){const n=this.node(id);if(!n)return false;
  if(this.off&&this.off[id])return false;
  if(n.stage>this.stage)return false;
  if(id==='cache'&&(!this.knobs.cache||this.fail.cacheOut))return false;
  if(id==='replica'&&this.knobs.replicas<1)return false;
  return true;},
 down:function(id){
  if(id==='db'&&this.fail.db)return true;
  if(id==='payment'&&this.fail.payment)return true;
  if(id==='worker'&&this.fail.worker)return true;
  if(id==='cache'&&this.fail.cacheOut)return true;
  if(id==='replica'&&this.fail.partition)return true;
  return false;},

 /* utilisation -> latency. The whole point of the control room. */
 queueing:function(load){return 1/(1-Math.min(.94,Math.max(0,load)));},

 capacity:function(){
  const k=this.knobs;
  const api=k.api*55;                                  /* rps per instance   */
  const dbBase=k.index?260:26;                         /* the index IS the capacity */
  /* The escalation ladder, in one line: index, then replicas for reads,
     then shards when the write path itself runs out. */
  const db=dbBase*(this.stage>=3?(1+k.replicas*.55):1)*Math.max(1,k.shards||1);
  const worker=Math.max(0,k.workers)*30;               /* ~33ms per job      */
  return {api:api,db:db,worker:worker};},

 /* One load model, used by both the router and the control room, so the
    gauges can never disagree with the latency a request actually got.
    Reads outnumber writes — menu, status, history — which is why losing
    the cache multiplies database load instead of merely adding to it. */
 READS:4,
 loads:function(){
  const k=this.knobs,cap=this.capacity();
  const hitRate=(this.live('cache')&&!this.down('cache'))
    ? .82*Math.min(1,k.cacheTTL/30) : 0;
  const dbOps=1+this.READS*(1-hitRate);   /* one write + the reads that missed */
  return {api:k.traffic/Math.max(1,cap.api),
          /* what the rate limiter refuses at the door never reaches the database */
          db:(this.guard.ratelimit?Math.min(k.traffic,cap.api):k.traffic)*dbOps/Math.max(1,cap.db),
          hitRate:hitRate,dbOps:dbOps,cap:cap};},

 reset:function(){this.reqs.length=0;this.win.length=0;this.m.ok=0;this.m.failed=0;
  this.m.queue=0;this.m.lag=0;this.m.dupes=0;this.m.dupRate=0;this.trace=null;
  this.jobs.length=0;this.running.length=0;},

 clearFailures:function(){this.fail={};},
 clearGuards:function(){this.guard={};},

 /* Build the hop list for one request, with a real cost per hop. Every
    hop also names the EVENT it produces, so the same record drives the
    floor, the trace, the log and the debugger. */
 route:function(){
  const k=this.knobs,g=this.guard,L=this.loads(),noisy=!this.headless;
  const hops=[];let status=200,note='';
  const push=function(id,ms,tagText,type){hops.push({node:id,ms:Math.round(ms),note:tagText||'',type:type});};

  push('web',4,'','REQUEST_SENT');
  if(this.live('lb'))push('lb',2,'','ROUTED');

  /* A rate limiter refuses the excess at the door. Without one, every
     request is admitted and every request gets slower. */
  if(g.ratelimit&&L.api>1&&Math.random()<1-1/L.api){
   push('api',2,'429','RATE_LIMITED');
   return this.finish(hops,429,'shed at the door — Retry-After: 2',false);}

  /* the API itself — saturation and the slow-API failure both live here */
  let apiMs=12*this.queueing(g.ratelimit?Math.min(.8,L.api):L.api);
  if(this.fail.slow)apiMs+=310;
  /* a small steady share of client mistakes is part of any real traffic;
     the capstone runs headless and leaves them out so it measures design */
  if(noisy&&Math.random()<.012){
   push('api',apiMs,'400','REQUEST_REJECTED');
   return this.finish(hops,400,'quantity must be ≥ 1',false);}
  push('api',apiMs,L.api>.8?'saturated':'','REQUEST_RECEIVED');

  if(this.live('auth')){
   if(noisy&&Math.random()<.012){
    push('auth',8,'401','AUTH_FAILED');
    return this.finish(hops,401,'token expired',false);}
   push('auth',8,'','AUTH_OK');}
  push('orders',6,'','USE_CASE');

  /* Reading the menu can be served by the cache. Writing the order
     cannot — placing an order always needs the source of truth, which
     is why a database outage is not survivable by caching alone. */
  let hit=false;
  if(this.live('cache')&&!this.down('cache')){
   hit=Math.random()<L.hitRate;
   push('cache',1,hit?'HIT':'MISS',hit?'CACHE_HIT':'CACHE_MISS');}

  if(this.down('db')){
   if(g.fallback){push('cache',1,'read-only mode','FALLBACK');status=202;note='degraded — order queued, not confirmed';}
   else{push('db',g.timeout?800:2400,'refused','DB_REFUSED');status=500;note='database down';}
  }else if(this.fail.partition&&!g.fallback){
   /* CP: refuse the write you cannot confirm (the CAP choice, made live) */
   push('db',g.timeout?900:2600,'no quorum','NO_QUORUM');status=503;note='partitioned — refusing to guess';
  }else{
   const ops=1+(hit?0:1);
   let dbMs=(k.index?11:150)*this.queueing(L.db)*ops;
   push('db',dbMs,k.index?(hit?'write':'read + write'):'full scan',k.index?'DB_QUERY':'DB_SCAN');
   if(this.fail.partition)note='AP: accepted on one side, may conflict';
   else if(this.fail.stale&&hit===false)note='replica lag — this read may be stale';
   /* Saturation refuses work. A fallback does not make the database
      faster — it changes the answer from an error to a worse answer. */
   if(L.db>.94){
    hops[hops.length-1].type='DB_SATURATED';
    if(g.fallback){status=202;note='degraded — serving stale reads';}
    else{status=503;note='database saturated';}}
  }

  /* payment — the dependency you do not own */
  if(this.live('payment')&&status===200){
   if(this.down('payment')){
    if(g.breaker){push('payment',5,'circuit open','CIRCUIT_OPEN');note='payment deferred';}
    else if(g.timeout){push('payment',1000,'timed out','TIMEOUT');status=504;note='payment timeout';}
    else{push('payment',8000,'hung','HUNG');status=504;note='payment hung — no timeout';}
   }else push('payment',90,'','PAYMENT_CHARGED');}

  /* async hand-off: the response can leave before the work is done */
  if(this.live('queue')&&k.async&&status<300){push('queue',2,'enqueued','MESSAGE_PUBLISHED');}

  return this.finish(hops,status,note,hit);},

 /* A POST that succeeded created something: that is 201, not 200. */
 finish:function(hops,status,note,hit){
  if(status===200)status=201;
  let total=0;hops.forEach(function(h){total+=h.ms;});
  return {hops:hops,ms:total,status:status,note:note,hit:hit};},

 /* the request's own timeline, in request-milliseconds from its birth */
 MS_PER_S:2200,
 events:function(req){
  const ev=[];let at=0;
  req.hops.forEach(function(h,i){
   ev.push({at:at,type:h.type,node:h.node,ms:h.ms,note:h.note,hop:i});
   at+=h.ms;
   if(h.type==='DB_QUERY'||h.type==='DB_SCAN')
    ev.push({at:at,type:'TRANSACTION_COMMIT',node:'db',ms:0,note:'WAL flushed',hop:i});});
  ev.push({at:at,type:'RESPONSE',node:'web',ms:0,
   note:req.status+' '+(STATUS_TEXT[req.status]||''),hop:req.hops.length-1});
  return ev;},

 spawn:function(){
  const r=this.route();
  const id=this.nextId++;
  const req={id:'REQ-'+id,order:'#'+id,trace:((id*2654435761)>>>0).toString(16).slice(0,4)+id.toString(16),
   method:'POST',path:'/orders',hops:r.hops,ms:r.ms,status:r.status,
   note:r.note,hit:r.hit,t:0,hop:0,born:this.t,ei:0};
  req.ev=this.events(req);
  this.reqs.push(req);
  if(this.reqs.length>64)this.reqs.shift();
  if(!this.headless){this.archive.push(req);if(this.archive.length>480)this.archive.shift();}
  /* 4xx caused by the client is not the system failing; 429 is */
  const serverBad=r.status>=500||r.status===429;
  const client=r.status>=400&&r.status<500&&r.status!==429;
  this.win.push({ms:r.ms,ok:!serverBad,client:client,hit:r.hit});
  if(this.win.length>140)this.win.shift();
  if(!serverBad&&!client)this.m.ok++;else this.m.failed++;
  return req;},

 /* hand one event to the bus, and let the async half pick up the job */
 fire:function(q,e){
  BUS.emit({type:e.type,node:e.node,trace:q.trace,req:q,t:this.t,ms:e.ms,note:e.note,status:q.status});
  if(e.type==='MESSAGE_PUBLISHED'){
   this.jobs.push({req:q,dup:false});
   if(this.fail.dup)this.jobs.push({req:q,dup:true});
   if(this.jobs.length>80)this.jobs.shift();}},

 /* one worker takes one job — the sampled, visible half of the queue */
 work:function(j){
  const q=j.req,base={trace:q.trace,req:q,t:this.t};
  if(j.dup){
   BUS.emit(Object.assign({type:'DUPLICATE',node:'worker'},base));
   if(this.guard.idem){BUS.emit(Object.assign({type:'DUPLICATE_IGNORED',node:'worker'},base));return;}}
  BUS.emit(Object.assign({type:'WORK_STARTED',node:'worker',dup:j.dup},base));
  this.running.push({req:q,at:this.t+.5,stage:0,dup:j.dup});},

 step:function(dt){
  if(this.paused)return;
  dt*=this.timeScale;
  this.t+=dt;
  const k=this.knobs,cap=this.capacity(),m=this.m,live=!this.headless;

  /* arrivals */
  this.spawnAcc=(this.spawnAcc||0)+dt*Math.min(k.traffic,90)/6;
  while(this.spawnAcc>=1){this.spawnAcc-=1;this.spawn();}

  /* advance in-flight requests along their hops, firing each event as
     the request actually reaches it */
  for(let i=this.reqs.length-1;i>=0;i--){
   const q=this.reqs[i];q.t+=dt*this.MS_PER_S;
   let acc=0,h=0;
   for(;h<q.hops.length;h++){acc+=q.hops[h].ms;if(q.t<acc)break;}
   q.hop=Math.min(h,q.hops.length-1);
   q.done=q.t>=q.ms;
   if(live)while(q.ei<q.ev.length&&q.ev[q.ei].at<=q.t){this.fire(q,q.ev[q.ei]);q.ei++;}
   if(q.t>q.ms+2600)this.reqs.splice(i,1);}

  /* the asynchronous half: queue depth is arrival minus service */
  if(this.live('queue')&&k.async){
   const arrive=k.traffic*(this.fail.dup?2:1);
   const serve=this.down('worker')?0:cap.worker*(this.guard.dlq?1.05:1);
   m.queue=Math.max(0,m.queue+(arrive-serve)*dt);
   if(m.queue>9999)m.queue=9999;
   m.workerLoad=serve>0?Math.min(2,arrive/serve):(arrive>0?2:0);
   /* A duplicate is only a problem if the work is not idempotent.
      This is the whole argument for an idempotency key, as a number. */
   m.dupRate=(this.fail.dup&&!this.guard.idem)?k.traffic:0;
   m.dupes=(m.dupes||0)+m.dupRate*dt;
   /* the visible sample of that queue: workers take jobs at the service rate */
   if(live){
    this.jobAcc=(this.jobAcc||0)+dt*Math.min(serve,90)/6;
    while(this.jobAcc>=1&&this.jobs.length){this.jobAcc-=1;this.work(this.jobs.shift());}
    if(!this.jobs.length)this.jobAcc=Math.min(this.jobAcc,1);}
  }else{m.queue=0;m.workerLoad=0;m.dupRate=0;}

  if(live)for(let i=this.running.length-1;i>=0;i--){
   const w=this.running[i];if(this.t<w.at)continue;
   const base={trace:w.req.trace,req:w.req,t:this.t};
   if(w.stage===0){
    BUS.emit(Object.assign({type:'WORK_COMPLETED',node:'worker'},base));
    if(this.live('broker')){BUS.emit(Object.assign({type:'EVENT_APPENDED',node:'broker'},base));
     w.stage=1;w.at=this.t+.4;continue;}
   }else if(this.live('notify'))BUS.emit(Object.assign({type:'EVENT_CONSUMED',node:'notify'},base));
   this.running.splice(i,1);}

  /* the event log lags when consumers cannot keep up */
  if(this.live('broker')){
   const lagRate=(m.workerLoad>1?(m.workerLoad-1)*14:-26);
   m.lag=Math.max(0,m.lag+lagRate*dt);
  }else m.lag=0;

  /* rolling metrics */
  const w=this.win;
  if(w.length){
   const s=w.map(function(x){return x.ms;}).sort(function(a,b){return a-b;});
   m.p50=s[Math.floor(s.length*.5)]|0;
   m.p95=s[Math.floor(s.length*.95)]|0;
   let bad=0,hits=0,cl=0;
   w.forEach(function(x){if(!x.ok)bad++;if(x.hit)hits++;if(x.client)cl++;});
   m.err=bad/w.length;m.hit=hits/w.length;m.client=cl/w.length;}
  const L=this.loads();
  m.rps=k.traffic;m.apiLoad=L.api;m.dbLoad=L.db;

  /* health, for the room lighting and the control room ring */
  m.health=Math.max(0,Math.min(1,1-(m.err*1.6+Math.max(0,m.apiLoad-.8)*1.4+
   Math.max(0,m.dbLoad-.8)*1.4+Math.min(1,m.queue/600)*.7+
   Math.min(1,m.dupRate/40)*.6)));

  /* the time machine's memory: five frames a second, the last minute */
  if(live){
   this.snapAcc=(this.snapAcc||0)+dt;
   if(this.snapAcc>=.2){this.snapAcc=0;
    this.snaps.push({t:this.t,rps:m.rps,p50:m.p50,p95:m.p95,err:m.err,hit:m.hit,client:m.client||0,
     apiLoad:m.apiLoad,dbLoad:m.dbLoad,queue:m.queue,lag:m.lag,health:m.health,
     dupes:m.dupes||0,dupRate:m.dupRate||0,workerLoad:m.workerLoad});
    if(this.snaps.length>300)this.snaps.shift();}
   BUS.meter(this.t);}},

 /* what the system looked like at simulated time T (the time machine) */
 snapAt:function(T){
  const s=this.snaps;if(!s.length)return this.m;
  let lo=0,hi=s.length-1;
  while(lo<hi){const mid=(lo+hi+1)>>1;if(s[mid].t<=T)lo=mid;else hi=mid-1;}
  return s[lo];},

 /* one trace, for observability and follow-the-request */
 sample:function(){
  if(this.reqs.length)return this.reqs[this.reqs.length-1];
  return this.spawn();},

 applyIncident:function(id){
  const inc=SYS_INCIDENTS.filter(function(x){return x.id===id;})[0];
  if(!inc)return null;
  /* an incident starts undefended — finding the defence is the exercise */
  this.knobs={traffic:40,cache:true,index:true,workers:3,replicas:2,api:2,async:true,cacheTTL:30,shards:1};
  this.clearFailures();this.clearGuards();
  Object.keys(inc.set||{}).forEach(function(k2){SIM.knobs[k2]=inc.set[k2];});
  (inc.fail||[]).forEach(function(f){SIM.fail[f]=true;});
  this.reset();
  return inc;},

 restore:function(){
  this.knobs={traffic:40,cache:true,index:true,workers:3,replicas:2,api:2,async:true,cacheTTL:30,shards:1};
  this.off={};this.stage=4;
  this.clearFailures();this.clearGuards();this.reset();},

 /* Run a configuration headlessly and hand back what happened. The
    capstone is graded by the same model the control room reads, so the
    verdict is never a lookup table — it is a measurement. */
 trial:function(cfg,secs){
  const save={knobs:this.knobs,fail:this.fail,guard:this.guard,off:this.off,
              stage:this.stage,win:this.win,reqs:this.reqs,m:this.m,acc:this.spawnAcc};
  this.headless=true;const ts=this.timeScale,pz=this.paused;this.timeScale=1;this.paused=false;
  this.knobs=cfg.knobs;this.fail=cfg.fail||{};this.guard=cfg.guard||{};
  this.off=cfg.off||{};this.stage=cfg.stage===undefined?4:cfg.stage;
  this.win=[];this.reqs=[];this.spawnAcc=0;
  this.m={rps:0,p50:0,p95:0,err:0,hit:0,dbLoad:0,apiLoad:0,queue:0,lag:0,
          workerLoad:0,ok:0,failed:0,dupes:0,dupRate:0,health:1};
  const n=Math.round((secs||8)*60);
  for(let i=0;i<n;i++)this.step(1/60);
  const out=this.m;
  this.knobs=save.knobs;this.fail=save.fail;this.guard=save.guard;this.off=save.off;
  this.stage=save.stage;this.win=save.win;this.reqs=save.reqs;this.m=save.m;
  this.spawnAcc=save.acc;this.headless=false;this.timeScale=ts;this.paused=pz;
  return out;}
};

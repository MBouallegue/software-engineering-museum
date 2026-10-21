/* ======================================================================
   THE CAPSTONE  —  BUILD THE RESTAURANT
   The visitor assembles an architecture, then the museum opens it for
   business. Every verdict below is computed by running the same
   simulator the control room runs; nothing is a canned answer.
   ====================================================================== */
const CAPPARTS=[
 {id:'index',   name:'Index on orders(customer_id, placed_at)', go:'indexes', on:true,
  note:'Without it, finding one order reads the whole table.'},
 {id:'cache',   name:'Cache in front of menu reads',            go:'scaling',
  note:'Reads outnumber writes four to one. This is what keeps the database idle.'},
 {id:'lb',      name:'Load balancer + three API instances',     go:'scaling',
  note:'One box has a ceiling. Spreading load needs stateless instances.'},
 {id:'replica', name:'Two read replicas',                       go:'cap',
  note:'More read capacity — and a staleness window you now own.'},
 {id:'async',   name:'Queue + six workers for slow work',       go:'tasks',
  note:'The customer stops waiting for the PDF and the three emails.'},
 {id:'log',     name:'Durable event log + notifications',       go:'kafka',
  note:'Consumers read at their own pace, and can replay after a bug.'},
 {id:'timeout', name:'Timeouts on every outbound call',         go:'retries',
  note:'Without one, somebody else’s outage becomes yours.'},
 {id:'breaker', name:'Circuit breaker on payment',              go:'retries',
  note:'Stop calling a dependency that is clearly failing.'},
 {id:'idem',    name:'Idempotency key on charges',              go:'delivery',
  note:'What makes a retry safe instead of a second charge.'},
 {id:'dlq',     name:'Dead-letter queue',                       go:'rabbitmq',
  note:'Poison messages leave instead of blocking everything behind them.'},
 {id:'fallback',name:'Read-only degraded mode',                 go:'scaling',
  note:'A worse answer, served, beats an error page.'},
 {id:'shard',   name:'Shard orders by restaurant',              go:'scaling',
  note:'The last rung. Splits the write path itself — and the shard key is close to irreversible.'}
];

/* Loads are chosen so each night tests ONE thing. The dependency nights
   run at a quiet 30 req/s on purpose: if they ran at peak, every build
   without a cache would fail them for saturation and the actual lesson
   would be lost in the noise. */
const CAPTRIALS=[
 {id:'normal',  name:'A normal Tuesday',       load:40,  fail:[],          secs:6},
 {id:'rush',    name:'Lunch rush — ten times the traffic', load:400, fail:[], secs:8},
 {id:'payout',  name:'The payment provider stops answering', load:30, fail:['payment'], secs:6},
 {id:'dbout',   name:'The database goes down', load:30,  fail:['db'],      secs:6},
 {id:'dupes',   name:'The broker redelivers every event', load:30, fail:['dup'], secs:8},
 {id:'cacheout',name:'The cache evaporates at peak', load:200, fail:['cacheOut'], secs:8}
];

let CAPSEL={index:true};

function capConfig(sel,load,fails){
 const guard={timeout:!!sel.timeout,retry:!!sel.timeout,breaker:!!sel.breaker,
              idem:!!sel.idem,dlq:!!sel.dlq,fallback:!!sel.fallback};
 const off={lb:!sel.lb,cache:!sel.cache,replica:!sel.replica,
            queue:!sel.async,worker:!sel.async,broker:!sel.log,notify:!sel.log,
            search:true};
 const fail={};(fails||[]).forEach(function(f){fail[f]=true;});
 return {knobs:{traffic:load,cache:!!sel.cache,index:!!sel.index,
                workers:sel.async?6:0,replicas:sel.replica?2:0,
                api:sel.lb?3:1,async:!!sel.async,cacheTTL:30,
                shards:sel.shard?3:1},
         guard:guard,off:off,fail:fail,stage:4};}

/* The grader. Each line states what happened, then why, then where to
   go and read about it. */
function capJudge(trial,m,sel){
 const r=[],
  bad =function(t,x,go){r.push({k:'bad', t:t,x:x,go:go});},
  warn=function(t,x,go){r.push({k:'warn',t:t,x:x,go:go});},
  ok  =function(t,x,go){r.push({k:'ok',  t:t,x:x,go:go});};

 const errPct=Math.round(m.err*100),p95=Math.round(m.p95);

 if(m.err>.25)bad('Customers saw errors',errPct+'% of orders failed outright.',null);
 else if(m.err>.02)warn('Some orders failed',errPct+'% returned an error.',null);
 else ok('Orders kept working','Error rate stayed at '+errPct+'%.',null);

 if(p95>2000)bad('Unusable latency','p95 reached '+fmtN(p95)+'ms — people gave up.',null);
 else if(p95>600)warn('Noticeably slow','p95 reached '+fmtN(p95)+'ms.',null);
 else ok('Stayed fast','p95 held at '+p95+'ms.',null);

 /* headroom is a finding in its own right: a system at 80% is one
    marketing email away from being a system at 120% */
 if(m.dbLoad>.94)bad('No database headroom','Database load '+Math.round(m.dbLoad*100)+
   '%. Past saturation, queueing turns every extra request into latency for all of them.','indexes');
 else if(m.dbLoad>.7)warn('Thin database headroom','Database load '+
   Math.round(m.dbLoad*100)+'% with nothing going wrong yet.','scaling');

 switch(trial.id){
  case 'rush':
   if(!sel.lb)bad('One API instance','At '+trial.load+' req/s a single instance ran at '+
     Math.round(m.apiLoad*100)+'% of capacity. Past about 80%, queueing turns a small '+
     'increase in load into a large increase in latency.','scaling');
   else ok('Horizontal scaling held','Three instances carried '+trial.load+
     ' req/s at '+Math.round(m.apiLoad*100)+'% utilisation.','scaling');
   if(!sel.cache)bad('Every read hit the database','Database load reached '+
     Math.round(m.dbLoad*100)+'%. Reads outnumber writes four to one here, so the '+
     'cache is not an optimisation — it is most of your read capacity.','scaling');
   if(!sel.async&&m.p95>400)warn('Slow work stayed in the request','The customer waited '+
     'for work that had no reason to be synchronous.','tasks');
   if(sel.cache&&!sel.shard&&m.dbLoad>.94)bad('The write path ran out',
     'Cache and replicas took the reads down to what they could, and the database still '+
     'reached '+Math.round(m.dbLoad*100)+'%. Replicas only add read capacity — at this '+
     'point the only rung left is splitting the writes.','scaling');
   break;
  case 'payout':
   if(!sel.timeout&&!sel.breaker)bad('You hung with them','Requests waited '+fmtN(p95)+
     'ms on a dependency that was never going to answer. Their outage is now yours, '+
     'and your connection pool is theirs.','retries');
   else if(sel.breaker)ok('The circuit opened','Calls failed fast at '+p95+
     'ms instead of hanging, and the rest of the order still worked.','retries');
   else warn('Timeout only','You stopped waiting, but every request still tried and '+
     'still failed. A breaker would stop trying at all.','retries');
   break;
  case 'dbout':
   if(sel.fallback)ok('You degraded instead of failing','Error rate '+errPct+
     '%. Orders were accepted in a reduced mode rather than refused.','scaling');
   else bad('Total outage',errPct+'% of orders failed. Nothing could reach the source '+
     'of truth, and there was no reduced mode to fall back to.','database');
   break;
  case 'dupes':
   if(!sel.async&&!sel.log)warn('Nothing to redeliver','You built no queue and no log, '+
     'so redelivery cannot happen — but neither can absorbing a spike, retrying a failed '+
     'job, or adding a second consumer later.','tasks');
   else if(sel.idem)ok('Duplicates were harmless','Everything arrived twice and produced '+
     Math.round(m.dupes)+' double charges. That is what an idempotency key buys.','delivery');
   else bad('You charged people twice',Math.round(m.dupes)+' duplicate charges in '+
     trial.secs+' seconds. At-least-once is the guarantee you actually get; '+
     'exactly-once is something you build on top of it.','delivery');
   if(sel.async&&!sel.dlq&&m.queue>200)warn('Nowhere for bad messages to go',
     'Queue depth reached '+Math.round(m.queue)+
     ' and a poison message would sit at the head of it.','rabbitmq');
   break;
  case 'cacheout':
   if(!sel.replica&&m.dbLoad>.9)bad('The database took the whole read load',
     'Database load hit '+Math.round(m.dbLoad*100)+'%. Losing a cache does not add '+
     'load, it multiplies it — the cache was load-bearing.','scaling');
   else if(m.dbLoad>.9)warn('Replicas helped, but not enough','Database load reached '+
     Math.round(m.dbLoad*100)+'%.','cap');
   else ok('Survived a cold cache','Database load peaked at '+
     Math.round(m.dbLoad*100)+'%.','scaling');
   break;
  case 'normal':
   if(!sel.index)bad('No index','Even at '+trial.load+' req/s the database ran at '+
     Math.round(m.dbLoad*100)+'% because every query reads every row.','indexes');
   if(sel.async&&m.queue>40)warn('Queue building at idle','Depth '+Math.round(m.queue)+
     ' with nothing wrong. Service rate is below arrival rate.','tasks');
   break;}
 return r;}

function openCapstone(){
 openSheet('Capstone','#6FD08C','Build the restaurant');sheetMode='capstone';
 $('sheetBody').classList.remove('museum-ref');
 renderCapstone();}

function renderCapstone(results){
 let h='<p class="lede">You have walked the departments. Now build the thing they were '+
  'describing. Choose what goes in, then open for business — the museum will run your '+
  'architecture through six nights and tell you what happened. '+
  '<b>Every verdict is measured, not looked up:</b> it comes from the same simulator the '+
  'control room is running.</p>';

 h+='<div class="mapsec"><h3>The build</h3><p>Nothing here is free. Each part buys you '+
    'something and costs you something.</p><div class="capbuild">';
 CAPPARTS.forEach(function(p){
  h+='<button class="cappart'+(CAPSEL[p.id]?' on':'')+'" data-part="'+p.id+'">'+
     '<i></i><span><b>'+p.name+'</b><em>'+p.note+'</em></span></button>';});
 h+='</div><div class="capacts">'+
    '<button class="ibtn primary" id="capRun">Open for business</button>'+
    '<button class="ibtn" id="capClear">Start from nothing</button></div></div>';

 if(results){
  let passes=0,total=0;
  h+='<div class="mapsec"><h3>Six nights</h3></div>';
  results.forEach(function(R){
   const worst=R.lines.some(function(l){return l.k==='bad';})?'bad':
               R.lines.some(function(l){return l.k==='warn';})?'warn':'ok';
   total++;if(worst==='ok')passes++;
   h+='<div class="captrial '+worst+'"><u>'+R.trial.name+'</u>'+
      '<div class="capmetrics">'+
      '<span>p95 <b>'+fmtN(Math.round(R.m.p95))+'ms</b></span>'+
      '<span>errors <b>'+(R.m.err*100).toFixed(1)+'%</b></span>'+
      '<span>db <b>'+Math.round(R.m.dbLoad*100)+'%</b></span>'+
      '<span>queue <b>'+fmtN(Math.round(R.m.queue))+'</b></span>'+
      (R.m.dupes>0?'<span>double charges <b>'+Math.round(R.m.dupes)+'</b></span>':'')+
      '</div>';
   R.lines.forEach(function(l){
    h+='<div class="capline '+l.k+'"><b>'+l.t+'</b><span>'+l.x+
       (l.go&&BYID[l.go]?' <button class="chip" data-go="'+l.go+'">'+
        BYID[l.go].title+'</button>':'')+'</span></div>';});
   h+='</div>';});
  h+='<div class="inote" style="margin-top:14px"><b>'+passes+' of '+total+
     ' nights came through clean.</b> '+
     (passes===total
      ? 'That is a system that degrades instead of falling over. Notice how much of it is '+
        'not about making anything faster — it is about deciding in advance what to do '+
        'when a part is missing.'
      : 'Read the red lines, add the part each one is asking for, and open again. '+
        'The point is not a perfect score: it is being able to say what each part buys '+
        'you and what it costs.')+'</div>';}

 $('sheetBody').innerHTML=h;
 Array.prototype.forEach.call($('sheetBody').querySelectorAll('[data-part]'),function(b){
  b.addEventListener('click',function(){
   const id=b.getAttribute('data-part');CAPSEL[id]=!CAPSEL[id];
   b.classList.toggle('on',!!CAPSEL[id]);});});
 Array.prototype.forEach.call($('sheetBody').querySelectorAll('[data-go]'),function(b){
  b.addEventListener('click',function(){openExhibit(b.getAttribute('data-go'));});});
 const run=$('capRun');
 if(run)run.addEventListener('click',function(){
  const out=CAPTRIALS.map(function(t){
   const m=SIM.trial(capConfig(CAPSEL,t.load,t.fail),t.secs);
   return {trial:t,m:m,lines:capJudge(t,m,CAPSEL)};});
  renderCapstone(out);
  $('sheetBody').scrollTop=$('sheetBody').scrollHeight*.35;});
 const clr=$('capClear');
 if(clr)clr.addEventListener('click',function(){CAPSEL={};renderCapstone();});}

function openHelp(){
 openSheet('Guide','#43D9E8','How to walk the museum');sheetMode='help';
 $('sheetBody').innerHTML='<p class="lede">The museum is a guided walk through software engineering. <b>Do not start by reading.</b> Walk into a department, watch what the room does, then use the guide to put a name on what you just saw.</p>'+
  '<h3 class="k">Controls</h3><div class="helpgrid">'+
  '<div class="hrow"><kbd>W A S D</kbd><span>Walk (or drag the joystick)</span></div>'+
  '<div class="hrow"><kbd>drag</kbd><span>Look around the room</span></div>'+
  '<div class="hrow"><kbd>E</kbd><span>Explain the nearest object in place; press again for the full guide</span></div>'+
  '<div class="hrow"><kbd>1–9</kbd><span>At an installation: the lab controls in the bar at the bottom</span></div>'+
  '<div class="hrow"><kbd>G</kbd><span>Follow an order: the camera rides along with one live request, and a route bar shows every hop and how long it took</span></div>'+
  '<div class="hrow"><kbd>P</kbd><span>Pause or resume the whole simulation</span></div>'+
  '<div class="hrow"><kbd>[ ]</kbd><span>Slow the simulation down or speed it back up (×0.25 – ×1)</span></div>'+
  '<div class="hrow"><kbd>O</kbd><span>The museum’s own performance readout</span></div>'+
  '<div class="hrow"><kbd>T</kbd><span>Walk to the next exhibit</span></div>'+
  '<div class="hrow"><kbd>rail</kbd><span>Drag the bar on the right edge to ride the spiral up or down — the ticks are the ten departments</span></div>'+
  '<div class="hrow"><kbd>R</kbd><span>Slide all the way back to the lobby</span></div>'+
  '<div class="hrow"><kbd>L</kbd><span>Stories: six guided scenarios. Play, pause, step back, change one decision and compare</span></div>'+
  '<div class="hrow"><kbd>M</kbd><span>Open the journey map, the concept graph and the search</span></div>'+
  '<div class="hrow"><kbd>V</kbd><span>Open the system — the live restaurant in six views</span></div>'+
  '<div class="hrow"><kbd>F</kbd><span>Inside the system: follow one live request</span></div>'+
  '<div class="hrow"><kbd>1–7</kbd><span>Inside the system: switch view — 7 is Debug: the museum freezes, you step through one request and scrub back through time (← → to step)</span></div>'+
  '<div class="hrow"><kbd>Esc</kbd><span>Return to the museum</span></div></div>'+
  '<h3 class="k">There is one system under all of this</h3><ul class="keys">'+
  '<li>Everything in the museum describes <b>one fictional restaurant</b>: a customer, an API, '+
  'an order service, a database, a cache, a queue, workers, an event log, a payment provider. '+
  'The rotunda floor is that system at walking scale.</li>'+
  '<li><b>Press V.</b> The same system appears as an architectural blueprint, as C4 levels you '+
  'can descend, as a live runtime, as data flow, as a failure map, and as a body. '+
  'They are six drawings of one topology, not six diagrams.</li>'+
  '<li>The <b>control room</b> on the right is a queueing simulation. Turn traffic up, drop the '+
  'index, kill the workers — latency, queue depth and error rate all move for real reasons, '+
  'and the restaurant floor downstairs changes with them.</li>'+
  '<li><b>Break it, then defend it.</b> Every failure switch has a matching mechanism: timeout, '+
  'retry, circuit breaker, fallback, idempotency key, dead-letter queue.</li></ul>'+
  '<h3 class="k">Reading, at the depth you want</h3><ul class="keys">'+
  '<li>Every hall opens on a question and one sentence. A control at the top moves you from '+
  '<b>Glance</b> to <b>Working</b> to <b>Deep</b> — code, production notes, the decision record '+
  'and interview recall only appear when you ask for them.</li>'+
  '<li>Each hall begins with <b>problem → pressure → idea → trade-off</b>, because a '+
  'definition without the pressure that produced it is a fact you will forget.</li>'+
  '<li>Halls end with what they needed, what they unlock, and where you already met the idea. '+
  'The map draws that as a graph — the rows are the order you should learn in.</li></ul>'+
  '<h3 class="k">The capstone</h3><ul class="keys">'+
  '<li>From the map: <b>Build the restaurant</b>. Choose the parts, then the museum opens for '+
  'six nights — a normal Tuesday, a lunch rush, two outages, a redelivery storm and a cold cache.</li>'+
  '<li>The verdict is <b>measured, not looked up</b>: it runs your architecture through the same '+
  'simulator the control room uses, and every finding links to the hall that explains it.</li></ul>'+
  '<h3 class="k">How to learn here</h3><ul class="keys">'+
  '<li><b>See it.</b> The installation demonstrates the idea.</li>'+
  '<li><b>Try it.</b> Walk around it and notice what changes.</li>'+
  '<li><b>Name it.</b> The room gives you the plain-language idea and the engineering term.</li>'+
  '<li><b>Go deeper.</b> The reference drawer contains the formal explanation, interview recall, code, and sources.</li>'+
  '</ul><h3 class="k">The rotunda floor is a running system</h3><ul class="keys">'+
  '<li>The floor under the spiral is the restaurant’s architecture at walking scale: customers, a load balancer, API gates, auth, '+
  'the order service, a cache, the database with its index and replica, a payment provider behind a boundary, a queue, workers, an event log and notifications.</li>'+
  '<li>Every light that moves is <b>a real request from the simulator</b>, replayed in slow motion so latency is visible: a 10 ms hop is a blink, '+
  'a one-second timeout is a wait you can watch. Status codes are things that happen — <b>400</b> bounces off the gate, <b>401</b> stops at the shield, '+
  '<b>429</b> finds the barrier down, <b>201</b> adds a row to the ledger, <b>503</b> shatters at the database.</li>'+
  '<li>The staff are <b>software actors</b>, not people: each one is in a state — idle, inspecting, processing, waiting, failed — because a real event put it there.</li>'+
  '<li>Press <b>G</b> to follow one request from table to table; the museum slows down while you do.</li></ul>'+
  '<h3 class="k">Every installation is a lab</h3><ul class="keys">'+
  '<li>Stand at a plinth and a bar appears at the bottom: buttons (or <b>1–9</b>) that change what the installation is doing, and one line of numbers saying what just happened.</li>'+
  '<li>Most labs have a <b>normal</b>, a <b>break it</b> and a <b>fix it</b>: drop the index, lose the ack, let two workers race for one pizza, then add the lock.</li>'+
  '<li>Big-O is faithful: every runner does f(n) operations on the same machine. Change n and O(n²) goes from seconds to hours.</li></ul>'+
  '<h3 class="k">How the museum works</h3><ul class="keys">'+
  '<li><b>One state, many views.</b> A single simulator holds requests, queues, metrics and failures. The floor, the control room, the debugger, the capstone and the atrium core all read it; none of them runs its own fake animation.</li>'+
  '<li><b>An event bus is its nervous system.</b> Every hop emits a typed event with a trace id. The floor actors, the log, the trace waterfall and the time machine subscribe to the same stream.</li>'+
  '<li><b>Object pooling and instancing.</b> Request packets are one InstancedMesh — one draw call however many are in flight — and messages in every lab come from fixed pools, never allocated per message.</li>'+
  '<li><b>Culling.</b> Installations and department staff only update when you are close enough to see them; label textures are shared per text.</li>'+
  '<li><b>Observability of itself.</b> Press <b>O</b>: frame time, draw calls, pooled packets, events per second — the museum measured by the method it teaches.</li>'+
  '<li><b>Graceful degradation.</b> Without WebGL, the museum falls back to a reading room with the full index.</li></ul>'+
  '<h3 class="k">The walk between halls counts</h3><ul class="keys">'+
  '<li>Every stretch of ramp is a cost model you cross on foot: <b>O(n)</b> is fourteen tick marks, <b>O(log n)</b> halves the gap each time, '+
  '<b>O(1)</b> is two arches and nothing in between.</li>'+
  '<li>Others are execution models — a <b>fork</b> into two lanes for parallelism, a single <b>interleaved</b> lane for concurrency, '+
  'a four-stage <b>pipeline</b>, a <b>cache</b> that only lights the first time you cross it, a <b>backoff</b> whose gaps double.</li>'+
  '<li>The pill above the joystick names the stretch you are on and counts your steps. Walking O(n) costs you fourteen. Walking O(1) costs you one.</li></ul>'+
  '<h3 class="k">Height is abstraction</h3><ul class="keys">'+
  '<li>The rings in the atrium mark the layer you are level with: <b>00 transistors and logic gates</b> at the floor, then machine code, '+
  'memory hierarchy, data structures, processes and threads, services and protocols, and <b>06 distributed systems</b> at the top.</li>'+
  '<li>Layer 00 is built for real — a <b>NAND gate</b> stands on the rotunda floor cycling its truth table, because every hall above it '+
  'is ultimately that part repeated.</li>'+
  '<li>The ceiling is <b>the network</b>: ten nodes, links between them, packets crossing — and one in four never arrives.</li></ul>'+
  '<h3 class="k">The route</h3><ul class="keys">'+
  '<li><b>Move between departments.</b> The spiral is the curriculum: principles → algorithms → dynamic programming → protocols → messaging → concurrency → infrastructure → distributed systems.</li></ul>';}


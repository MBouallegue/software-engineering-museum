/* ======================================================================
   EXPLAIN THIS — a compact card beside the object, the world stays visible
   For every component: why it exists, what problem it answers, what it
   replaced, what it costs, how it fails, and what it connects to.
   ====================================================================== */
const EXPLAIN={
 customer:{what:'The client — a phone or browser at a table.',why:'Every system exists for someone making a request.',problem:'Users double-tap, lose signal, and retry on their own.',replaces:'Walking up to the counter.',cost:'You do not control the client: old versions stay in the wild for years.',fails:'Dropped connections, duplicate submits, clock skew.',rel:['rest','realtime','delivery']},
 web:{what:'The client application.',why:'It turns a tap into an HTTP request.',problem:'The network between client and server is the least reliable part.',replaces:'—',cost:'Every API change must stay compatible with clients already installed.',fails:'Retries without idempotency keys create duplicates.',rel:['rest','delivery']},
 lb:{what:'A dispatcher in front of identical API instances.',why:'One instance has a ceiling; many identical ones share the load and survive one dying.',problem:'Traffic outgrows a single box, and a single box is a single point of failure.',replaces:'A bigger machine (vertical scaling).',cost:'Instances must be stateless; health checks; one more hop.',fails:'Routing to an unhealthy instance; uneven load from sticky sessions.',rel:['scaling','orchestration']},
 api:{what:'The HTTP contract: receive, validate, route, answer.',why:'Clients should not need to know how the kitchen works.',problem:'Without a contract, every client is coupled to every internal change.',replaces:'Clients talking to the database directly.',cost:'A hop, a versioning discipline, backward compatibility forever.',fails:'Saturation (queueing latency), bad requests (400), overload (429), slow dependencies.',rel:['rest','rpc-graphql','soap']},
 auth:{what:'An identity check on every request.',why:'Authorisation decisions need to know who is asking.',problem:'Anyone can send an HTTP request.',replaces:'Trusting the network.',cost:'Latency on every call; token rotation; a service that must never be slow.',fails:'Expired tokens (401); an auth outage takes everything with it.',rel:['rest','mcp']},
 orders:{what:'The use case — where "place an order" is decided.',why:'Business rules need one home, independent of HTTP and SQL.',problem:'Rules scattered across controllers, SQL and scripts.',replaces:'Fat controllers.',cost:'Ports, adapters and mapping code.',fails:'Infrastructure leaking inward makes it untestable and hard to change.',rel:['architecture','principles','patterns']},
 cache:{what:'Fast memory in front of the database.',why:'Most reads ask a question someone asked a second ago.',problem:'The database spends its capacity answering repeats.',replaces:'Reading the truth every time.',cost:'Stale answers up to the TTL, invalidation logic, memory.',fails:'Mass expiry → stampede; cold start after a restart; old prices served.',rel:['scaling','database','cap']},
 db:{what:'The source of truth: committed rows.',why:'Orders must survive the request, the deploy and the machine.',problem:'Process memory disappears on restart.',replaces:'Files and in-memory state.',cost:'Schema decisions, operations, a hard capacity ceiling.',fails:'Missing index (full scans), connection exhaustion, lost updates, outage.',rel:['database','indexes','transactions','race']},
 replica:{what:'A read-only copy that streams the primary\'s changes.',why:'Scale reads without touching the primary.',problem:'Reads saturate one database.',replaces:'A bigger primary.',cost:'Replica lag: reads may be stale.',fails:'Lag spikes; a partition; promoting a replica that was behind.',rel:['cap','scaling']},
 search:{what:'A separate index of the menu for text search.',why:'Relational indexes are poor at "pizza with no cheese".',problem:'LIKE \'%x%\' scans everything.',replaces:'Full scans.',cost:'A second copy of the data to keep in sync.',fails:'Drift between the index and the truth.',rel:['indexes']},
 queue:{what:'Work waiting for a worker.',why:'The producer and consumer do not need to run at the same time or speed.',problem:'Slow work inside the request makes the customer wait.',replaces:'Doing it inline.',cost:'Latency until done, a broker to run, possible duplicates.',fails:'Backlog (arrivals beat service), poison messages, broker failure.',rel:['tasks','rabbitmq','delivery','retries']},
 worker:{what:'Processes that pull jobs and do the slow work.',why:'Concurrency is set by worker count, not by how hard customers are tapping.',problem:'Bursty traffic and slow jobs.',replaces:'Threads inside the web server.',cost:'Jobs must be idempotent; one more fleet to scale and watch.',fails:'Crash mid-job → redelivery; too few workers → a queue that never drains; races on shared rows.',rel:['tasks','race','orchestration']},
 kitchen:{what:'The real work the workers perform.',why:'The job is the point; everything else is plumbing.',problem:'It is slow and it can fail.',replaces:'—',cost:'—',fails:'Partial work if a worker dies halfway.',rel:['tasks','transactions']},
 broker:{what:'An append-only log of events.',why:'Many consumers read the same facts at their own pace, and can replay them.',problem:'Point-to-point calls couple the publisher to every consumer.',replaces:'Calling each consumer directly.',cost:'Operational weight; order only within a partition.',fails:'Consumer lag; retention expiring before a slow consumer reads.',rel:['kafka','pubsub','delivery']},
 notify:{what:'A subscriber that turns OrderPlaced into an SMS.',why:'New reactions without changing the publisher.',problem:'The order service should not know about SMS.',replaces:'A call from the order service.',cost:'Nobody owns the end-to-end flow; tracing gets harder.',fails:'Duplicate messages without idempotency.',rel:['pubsub','kafka']},
 payment:{what:'Someone else\'s system.',why:'You do not build card processing.',problem:'Their latency and outages are outside your control.',replaces:'—',cost:'Every call crosses a network you do not own.',fails:'Timeouts, hangs, double charges on retry.',rel:['retries','delivery','transactions']}
};

let explainFor=null;
function exRow(k,v){return v?'<dt>'+k+'</dt><dd>'+v+'</dd>':'';}
function exChips(ids){return (ids||[]).filter(function(i){return BYID[i];}).map(function(i){
 return '<button class="chip" data-exgo="'+i+'">'+BYID[i].title+'</button>';}).join('');}
function openExplain(target){
 if(!target)return;
 const el=$('explain');let h='',col='#8FA0FF';
 if(target.go){                       /* a station on the restaurant floor */
  const X=EXPLAIN[target.node]||{};col=target.col||col;
  const breaks=SYS_FAILURES.filter(function(f){return f.hits===target.node;});
  h='<div class="ek">Restaurant · '+((SIM.node(target.node)||{}).label||target.node||'')+'</div><h4>'+target.title+'</h4>'+
   '<dl>'+exRow('What',X.what||target.sub)+exRow('Why',X.why)+exRow('Costs',X.cost)+exRow('Fails',X.fails)+'</dl>'+
   storyBtn(window.SCN&&SCN.forNode(target.node))+
   (X.rel?'<div class="chips" style="margin-top:9px">'+exChips(X.rel)+'</div>':'')+
   '<div class="ea"><button class="vb" data-exa="hall">Walk to the hall <kbd>E</kbd></button>'+
   (target.node?'<button class="vb" data-exa="debug">Debug a request here</button>':'')+
   (breaks.length?'<button class="vb" data-exa="break">Break it</button>':'')+
   '<button class="vb" data-exa="close">Close</button></div>';
  CAMF.look((NP[target.node]||target.pos).clone(),6.2,3.0);
 }else{                                /* an exhibit on the ramp */
  const e=target;col=WING[e.wing].color;
  h='<div class="ek">'+WING[e.wing].short+' · hall '+String(e.n).padStart(2,'0')+'</div><h4>'+e.title+'</h4>'+
   '<dl>'+exRow('What',stripTags(e.idea||''))+exRow('Why',e.why||e.problem)+exRow('Trade-off',e.tradeoff)+'</dl>'+
   tryIt(e)+storyBtn(window.SCN&&SCN.forHall(e.id))+
   '<div class="chips" style="margin-top:9px">'+exChips(e.rel)+'</div>'+
   '<div class="ea"><button class="vb" data-exa="guide">Open the guide <kbd>E</kbd></button>'+
   ((e.nodes||[]).length?'<button class="vb" data-exa="system">Where it sits in the system</button>':'')+
   '<button class="vb" data-exa="close">Close</button></div>';
  CAMF.look(e.pos.clone().setY(e.y+1.8),7.2,2.6);}
 el.style.setProperty('--acc',col);el.innerHTML=h;el.classList.add('on');explainFor=target;
 /* the controls in the card are the exhibit's own — the same ones as keys 1–9 */
 const r=!target.go&&rigOf(target);
 Array.prototype.forEach.call(el.querySelectorAll('[data-act]'),function(b){
  b.addEventListener('click',function(){const a=r&&r.acts[+b.getAttribute('data-act')];if(!a)return;a.fn();paintLab(false);
   const lr=el.querySelector('.try .lr');if(lr&&r.readout)lr.innerHTML=r.readout();
   Array.prototype.forEach.call(el.querySelectorAll('[data-act]'),function(x){const ax=r.acts[+x.getAttribute('data-act')];x.classList.toggle('on',!!(ax.on&&ax.on()));});});});
 const sb=el.querySelector('[data-story]');
 if(sb)sb.addEventListener('click',function(){const id=sb.getAttribute('data-story');closeExplain();SCN.open(id);});
 Array.prototype.forEach.call(el.querySelectorAll('[data-exgo]'),function(b){
  b.addEventListener('click',function(){closeExplain();openExhibit(b.getAttribute('data-exgo'));});});
 Array.prototype.forEach.call(el.querySelectorAll('[data-exa]'),function(b){
  b.addEventListener('click',function(){const a=b.getAttribute('data-exa');
   if(a==='close')closeExplain();
   else if(a==='guide'){closeExplain();openExhibit(target.id);}
   else if(a==='hall'){closeExplain();travel(target.go);}
   else if(a==='system'){closeExplain();INST.show('blueprint');INST.picked=target.nodes[0];
    INST.say('<b>'+target.title+' in the system.</b> Highlighted: the component this hall explains.');}
   else if(a==='debug'){closeExplain();debugThrough(target.node);}
   else if(a==='break'){closeExplain();const f=SYS_FAILURES.filter(function(x){return x.hits===target.node;})[0];
    SIM.fail[f.id]=true;SIM.reset();moment('<b>'+f.label+'.</b> '+f.note+' Watch the floor — then press <b>V</b> to defend it.');}});});}
function closeExplain(){$('explain').classList.remove('on');explainFor=null;CAMF.release();}
/* the primary action first; the rest one click further away */
function tryIt(e){const r=rigOf(e);if(!r||!r.acts||!r.acts.length)return '';
 const b=function(a,i,prime){return '<button class="vb'+(prime?' prime':'')+(a.on&&a.on()?' on':'')+'" data-act="'+i+'"><kbd>'+(i+1)+'</kbd> '+a.label+'</button>';};
 return '<div class="try"><u>Try it</u><div class="ea" style="margin-top:0">'+b(r.acts[0],0,true)+(r.acts[1]?b(r.acts[1],1):'')+'</div>'+
  (r.acts.length>2?'<details><summary>More controls ('+(r.acts.length-2)+')</summary><div class="ea">'+r.acts.slice(2).map(function(a,i){return b(a,i+2);}).join('')+'</div></details>':'')+
  (r.readout?'<div class="lr">'+r.readout()+'</div>':'')+'</div>';}
function storyBtn(d){if(!d)return '';
 return '<button class="story" data-story="'+d.id+'"><span>▶</span><span>Run story '+d.letter+': '+d.title+'<small>Step through it, change one decision, compare the results</small></span></button>';}

/* open the debugger on a recent request that passed through one component */
function debugThrough(node){
 INST.show('debug');if(INST.mode!=='debug')INST.setMode('debug');
 const A=INST.finished();
 for(let i=A.length-1;i>=0;i--){if(A[i].hops.some(function(h){return h.node===node;})){
  INST.dbg={req:A[i],steps:INST.stepsFor(A[i]),i:0};
  INST.follow={id:A[i].id,hops:A[i].hops,ms:A[i].ms,status:A[i].status,note:A[i].note,dbg:true};
  let k=0;INST.dbg.steps.forEach(function(s,j){if(!k&&s.node===node)k=j;});
  INST.goStep(k);return;}}
 INST.say('<b>No recent request touched that component.</b> Press ▶ live for a few seconds, then freeze again.');}

/* stand beside a component on the floor and look at it */
function showOnFloor(node){
 const tgt=(node==='api'?NP.api1:node==='web'||node==='customer'?NP.table0:NP[node])||NP.orders;
 closeSheet();
 const k=Math.max(.35,Math.min(.8,(Math.hypot(tgt.x,tgt.z)-3.2)/Math.max(1,Math.hypot(tgt.x,tgt.z))));
 P.plaza=true;P.x=tgt.x*k+.4;P.z=tgt.z*k+.4;P.y=0;P.r=Math.hypot(P.x,P.z);
 camYaw=Math.atan2(P.x-tgt.x,P.z-tgt.z);lastDrag=performance.now();
 const st=STATIONS.filter(function(s){return s.node===node;})[0];
 if(st)openExplain(st);else CAMF.look(tgt.clone(),6.2,3.0);}

/* ---- the camera can be asked to look at something, then let go ---- */
const CAMF={on:false,get:null,dist:6,h:3,
 look:function(v,dist,h){this.on=true;const vv=v;this.get=function(){return vv;};this.dist=dist||6;this.h=h||3;},
 follow:function(fn,dist,h){this.on=true;this.get=fn;this.dist=dist||7;this.h=h||4;},
 release:function(){this.on=false;this.get=null;}};

/* ---- the simulation clock: pause and slow motion are accessibility,
        and also the easiest way to see what a system is doing ---- */
function updateSimBtn(){const b=$('simBtn');if(!b)return;
 b.textContent=SIM.paused?'❚❚ Paused':(SIM.timeScale<1?'Live ×'+SIM.timeScale:'Live');
 b.classList.toggle('warn',SIM.paused||SIM.timeScale<1);}
function togglePause(){SIM.userPaused=!SIM.paused;SIM.paused=SIM.userPaused;updateSimBtn();
 moment(SIM.paused?'<b>Simulation paused.</b> Every actor, packet and gauge has stopped. <b>P</b> resumes.':'<b>Simulation running.</b>');}
function setSpeed(dir){const S=[.25,.5,1];let i=S.indexOf(SIM.userScale||1);if(i<0)i=2;
 i=Math.max(0,Math.min(2,i+dir));SIM.userScale=S[i];if(!FLOOR.focus)SIM.timeScale=S[i];updateSimBtn();
 moment('<b>Simulation speed ×'+S[i]+'.</b> Latency on the floor stretches with it; the numbers do not change.');}

/* ---- the lab bar ---- */
let labFor=null,labTick=0;
function rigOf(e){for(let i=0;i<RIGLIST.length;i++)if(RIGLIST[i].e===e)return RIGLIST[i].r;return null;}
function labActs(){const r=labFor&&rigOf(labFor);return r&&r.acts?r.acts:null;}
function paintLab(force){
 const e=labFor,r=e&&rigOf(e),bar=$('labbar');
 /* the explain card carries the same controls; never show them twice */
 if(!r||(!r.acts&&!r.readout)||explainFor===e){bar.classList.remove('on');return;}
 bar.classList.add('on');bar.style.setProperty('--acc',WING[e.wing].color);
 if(force){
  $('labBtns').innerHTML=(r.acts||[]).map(function(a,i){
   return '<button data-lab="'+i+'"><kbd>'+(i+1)+'</kbd>'+a.label+'</button>';}).join('');
  Array.prototype.forEach.call($('labBtns').children,function(b){
   b.addEventListener('click',function(){const a=r.acts[+b.getAttribute('data-lab')];if(a){a.fn();paintLab(false);}});});}
 (r.acts||[]).forEach(function(a,i){const b=$('labBtns').children[i];if(b)b.classList.toggle('on',!!(a.on&&a.on()));});
 $('labRead').innerHTML=r.readout?r.readout():'';}

/* ---- the museum's own instruments ---- */
const PERF={on:false,frames:0,acc:0,ms:0};
function paintPerf(dt){
 PERF.frames++;PERF.acc+=dt;
 if(!PERF.on||PERF.acc<.5)return;
 const fps=PERF.frames/PERF.acc,I=renderer.info;
 $('perf').innerHTML='<b>'+fps.toFixed(0)+'</b> fps · '+(1000/fps).toFixed(1)+' ms/frame\n'+
  'draw calls  <b>'+I.render.calls+'</b>   triangles <b>'+fmtN(I.render.triangles)+'</b>\n'+
  'geometries  '+I.memory.geometries+'   textures '+I.memory.textures+'\n'+
  'packets     <b>'+FLOOR.packets.length+'</b> in flight · '+FLOOR.pool.length+' pooled (1 instanced draw)\n'+
  'event bus   <b>'+BUS.rate.toFixed(0)+'</b> events/s · '+BUS.log.length+' kept\n'+
  'history     '+SIM.archive.length+' requests · '+SIM.snaps.length+' snapshots\n'+
  'sim clock   t='+SIM.t.toFixed(1)+'s ×'+SIM.timeScale+(SIM.paused?' (paused)':'');
 PERF.frames=0;PERF.acc=0;}

/* reduced motion: slower system, no fly-in, no bobbing */
const RM=!!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);


/* ======================================================================
   THE RESTAURANT
   The rotunda floor is one running analogy. Every station is a real
   component, it is labelled, it is animated, and walking into it opens
   the hall that explains it. This is the spine the museum hangs on.
   ====================================================================== */
const STATIONS=[];
function stn(x,z,t,s,go,col,node){
 STATIONS.push({pos:new THREE.Vector3(x,0,z),title:t,sub:s,go:go,col:col,node:node||null});
 return STATIONS[STATIONS.length-1];}

/* ======================================================================
   THE FLOOR — software actors, driven by events
   Every station is an ACTOR with a state machine that mirrors a software
   state: idle, receive, inspect, process, wait, send, fail, complete.
   Nothing here moves on a timer of its own. A packet reaches a station
   because a real request from the simulator reached that component; a
   worker lifts a job because a WORK_STARTED event said so.

   The sync half (a request's hops) is replayed in slow motion from the
   request's own event list, so latency is visible: a 10 ms hop is a
   blink, a 1000 ms timeout is a wait you can watch. The async half
   (workers, the event log, notifications) arrives straight off the bus.
   ====================================================================== */
const RST={};
const FLOOR={t:0,packets:[],pool:[],max:28,gap:0,focus:null,focusNext:false,SLOW:.003,SPEED:6.5,
 jobsShown:0,spawned:0};
const NP={};               /* where each component stands on the floor */
const ACT={};              /* the actors, by system node id */

function buildRestaurant(){
 const G=new THREE.Group();scene.add(G);RST.G=G;
 const C={lb:'#F06FA8',api:'#6FD08C',auth:'#B18FE0',orders:'#FFD166',cache:'#43D9E8',db:'#D99A52',
  replica:'#C08A50',pay:'#8FA0FF',queue:'#FF6B5A',log:'#FFD166',kit:'#3FC1A9',bell:'#E9EDF7',client:'#8FA0FF'};
 const Y=1.25;
 function V(x,z,y){return new THREE.Vector3(x,y===undefined?Y:y,z);}
 function sign(x,z,txt,col,y,sc){const s=textSprite(txt,col,44,sc||3.4);s.position.set(x,y||2.2,z);G.add(s);return s;}
 function pad(x,z,col){
  const r=new THREE.Mesh(new THREE.RingGeometry(1.05,1.22,26),
   new THREE.MeshBasicMaterial({color:col,transparent:true,opacity:.24,side:THREE.DoubleSide}));
  r.rotation.x=-Math.PI/2;r.position.set(x,.03,z);G.add(r);return r;}
 function slab(x,z,w,d,h,col,emi){const m=box(w,h,d,ownLit(col,emi===undefined?.14:emi,.5));m.position.set(x,h/2,z);G.add(m);return m;}
 const B=badges(G,10);RST.B=B;
 const J=flyers(G,18,'box');RST.J=J;

 /* --- customers: tables with a client device whose screen is the state --- */
 const TB=[[11.0,5.6],[11.6,-3.8],[7.8,8.6]];
 ACT.tables=TB.map(function(p,i){
  const top=new THREE.Mesh(new THREE.CylinderGeometry(.85,.85,.08,24),plain(0x1B2638,.7,.1));top.position.set(p[0],.72,p[1]);G.add(top);
  const leg=cyl(.08,.7,plain(0x0F1726,.8,.1));leg.position.set(p[0],.35,p[1]);G.add(leg);
  for(let k=0;k<2;k++){const st=cyl(.26,.45,plain(0x1A2436,.8,.1));st.position.set(p[0]+(k?.95:-.95),.22,p[1]+(k?.25:-.25));G.add(st);}
  const dev=box(.34,.22,.04,SKIN);dev.position.set(p[0],.9,p[1]);dev.rotation.x=-.5;G.add(dev);
  const scr=box(.28,.16,.01,ownNeon(C.client,.35));scr.position.set(p[0],.905,p[1]+.02);scr.rotation.x=-.5;G.add(scr);
  NP['table'+i]=V(p[0],p[1],1.0);
  const parts=[top,leg].concat(G.children.slice(-4,-2));          /* the two stools */
  return {scr:scr,dev:dev,parts:parts,state:'idle',until:0,pos:V(p[0],p[1],1.0)};});
 sign(10.2,1.0,'CUSTOMERS',C.client,1.9,3.2);
 stn(9.6,2.6,'The customers','Clients: each table device is one caller','rest',C.client,'customer');

 /* --- load balancer: a dispatcher arm that points at the lane it chose --- */
 const lbBase=slab(8.6,.8,.9,.9,.7,C.lb,.18);
 const arm=box(1.3,.08,.12,ownNeon(C.lb,.9));arm.position.set(8.6,.82,.8);G.add(arm);
 sign(8.6,.8,'LOAD BALANCER',C.lb,1.75,3.4);
 NP.lb=V(8.6,.8);
 ACT.lb={arm:arm,base:lbBase,want:0};
 stn(8.6,2.6,'The load balancer','Spreads requests over identical API instances','scaling',C.lb,'lb');

 /* --- API: gates, one lane per running instance --- */
 const LZ=[-1.3,.6,2.5];
 ACT.api={lanes:LZ.map(function(z){
  const L=box(.12,1.7,.12,ownLit(C.api,.25,.4));L.position.set(5.6,.85,z-.55);G.add(L);
  const R=box(.12,1.7,.12,ownLit(C.api,.25,.4));R.position.set(5.6,.85,z+.55);G.add(R);
  const T=box(.12,.14,1.25,ownLit(C.api,.25,.4));T.position.set(5.6,1.72,z);G.add(T);
  const bar=box(.06,.06,1.05,ownNeon('#FFC65C',.9));bar.position.set(5.6,1.6,z);G.add(bar);
  const beam=box(.02,1.4,1.0,ownNeon(C.api,.0));beam.position.set(5.6,.8,z);G.add(beam);
  return {parts:[L,R,T],bar:bar,beam:beam,z:z,state:'idle',until:0};})};
 sign(5.6,.6,'API GATEWAY',C.api,2.5,3.6);
 LZ.forEach(function(z,i){NP['api'+i]=V(5.6,z);});
 stn(6.8,-2.8,'The API','Receives, validates, routes, answers — the HTTP contract','rest',C.api,'api');

 /* --- auth: an identity arch --- */
 const arch=new THREE.Mesh(new THREE.TorusGeometry(.8,.07,8,30,Math.PI),ownLit(C.auth,.3,.4));
 arch.position.set(3.6,.1,.6);arch.rotation.y=Math.PI/2;G.add(arch);
 const shield=box(.03,.78,1.5,ownNeon(C.auth,.08));shield.position.set(3.6,.5,.6);G.add(shield);
 sign(3.6,.6,'AUTH',C.auth,1.35,2.4);
 NP.auth=V(3.6,.6);ACT.auth={arch:arch,shield:shield,state:'idle',until:0};
 stn(3.6,-1.2,'Auth','Who is asking — identity checked on every request','rest',C.auth,'auth');

 /* --- order service: the decision desk --- */
 const desk=new THREE.Mesh(new THREE.CylinderGeometry(.9,1.0,.8,6),ownLit(C.orders,.18,.45));desk.position.set(1.2,.4,.6);G.add(desk);
 const ring=new THREE.Mesh(GEO.tor,ownNeon(C.orders,.8));ring.scale.setScalar(2.2);ring.rotation.x=Math.PI/2;ring.position.set(1.2,1.05,.6);G.add(ring);
 sign(1.2,.6,'ORDER SERVICE',C.orders,2.1,3.6);
 NP.orders=V(1.2,.6);ACT.orders={desk:desk,ring:ring,state:'idle',until:0,spin:0};
 stn(1.2,2.4,'The order service','The use case: the hexagon\'s centre, where "place an order" is decided','architecture',C.orders,'orders');

 /* --- cache: a wall of fast memory --- */
 const cslots=[];
 for(let i=0;i<12;i++){const m=box(.36,.3,.12,ownLit(C.cache,.2,.4));m.position.set(1.9+(i%4)*.44,.8+Math.floor(i/4)*.38,-6.2);G.add(m);cslots.push(m);}
 const cframe=slab(2.56,-6.35,2.0,.12,1.9,'#10202E',.05);
 sign(2.56,-6.2,'CACHE · fast memory',C.cache,2.5,3.8);
 NP.cache=V(2.56,-5.6);ACT.cache={slots:cslots,state:'idle',until:0};
 stn(2.6,-4.2,'The cache','Memory in front of the database — fast, and possibly stale','scaling',C.cache,'cache');

 /* --- database: a vault of drawers, and a ledger that grows on COMMIT --- */
 const vault=slab(-3.0,-7.4,2.4,1.4,1.2,C.db,.1);
 const drawers=[];for(let i=0;i<6;i++){const d=box(.7,.26,.2,ownLit(C.db,.2,.45));d.position.set(-3.75+(i%3)*.75,.35+Math.floor(i/3)*.4,-6.62);G.add(d);drawers.push({m:d,z0:-6.62,out:0});}
 const ledger=[];for(let i=0;i<10;i++){const r=box(2.1,.07,1.1,ownNeon(C.db,.85));r.position.set(-3.0,1.25+i*.085,-7.4);r.visible=false;G.add(r);ledger.push(r);}
 const shutter=box(2.46,1.2,.04,ownNeon('#FF5A4A',.0));shutter.position.set(-3.0,.6,-6.64);G.add(shutter);
 sign(-3.0,-7.4,'DATABASE · the truth',C.db,2.9,4.0);
 NP.db=V(-3.0,-6.2);ACT.db={drawers:drawers,ledger:ledger,rows:0,shutter:shutter,vault:vault,state:'idle',until:0,scan:0};
 stn(-1.2,-5.4,'The database','What survives after the guest leaves — committed rows','database',C.db,'db');

 /* the index: a card box next to the vault, lit when it exists */
 const ibox=slab(-6.2,-8.8,1.2,.9,.8,'#9B7BE8',.2);
 const cards=[];for(let i=0;i<8;i++){const cd=box(.05,.45,.7,ownNeon('#9B7BE8',.3));cd.position.set(-6.6+i*.11,1.0,-8.8);G.add(cd);cards.push(cd);}
 sign(-6.2,-8.8,'INDEX',"#9B7BE8",1.9,2.4);
 ACT.index={box:ibox,cards:cards};
 stn(-6.4,-7.0,'The index','A B-tree beside the table: jump to the row instead of reading them all','indexes','#9B7BE8','db');

 /* the replica: a copy that follows the ledger, late */
 const rvault=slab(.8,-11.2,1.6,1.0,.8,C.replica,.08);
 const rled=[];for(let i=0;i<10;i++){const r=box(1.4,.06,.8,ownNeon(C.replica,.6));r.position.set(.8,.84+i*.07,-11.2);r.visible=false;G.add(r);rled.push(r);}
 const rlink=box(5.2,.04,.04,ownNeon(C.replica,.35));rlink.position.set(-1.1,1.0,-9.3);rlink.rotation.y=Math.atan2(-(-11.2+7.4),(.8+3.0));G.add(rlink);
 sign(.8,-11.2,'READ REPLICA',C.replica,1.9,3.0);
 ACT.replica={ledger:rled,rows:0,link:rlink,vault:rvault};
 stn(1.4,-9.4,'The read replica','A copy for reads — always a little behind','cap',C.replica,'replica');

 /* --- payment: someone else's system, behind a boundary --- */
 const bnd=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(2.6,2.2,2.2)),
  new THREE.LineDashedMaterial({color:0x8FA0FF,dashSize:.18,gapSize:.12,transparent:true,opacity:.6}));
 bnd.computeLineDistances();bnd.position.set(8.4,1.1,-8.6);G.add(bnd);
 const term=slab(8.4,-8.6,.9,.6,1.1,C.pay,.15);
 const pscr=box(.6,.34,.02,ownNeon(C.pay,.5));pscr.position.set(8.4,1.3,-8.28);G.add(pscr);
 const spin=new THREE.Mesh(GEO.tor,ownNeon('#FFC65C',0));spin.scale.setScalar(1.4);spin.position.set(8.4,1.9,-8.3);G.add(spin);
 const lever=box(.08,.5,.08,ownNeon('#83C167',.95));lever.position.set(7.2,1.2,-7.6);G.add(lever);
 const leverB=box(.3,.12,.12,SKIN);leverB.position.set(7.2,.95,-7.6);G.add(leverB);
 sign(8.4,-8.6,'PAYMENT · external',C.pay,2.7,3.6);
 NP.payment=V(8.4,-7.8);ACT.pay={scr:pscr,spin:spin,lever:lever,leverB:leverB,state:'idle',until:0};
 stn(7.0,-6.4,'The payment provider','Someone else\'s system — the network call you do not control','retries',C.pay,'payment');

 /* --- the ticket rail: depth IS the queue metric --- */
 const rail=slab(-1.4,4.8,6.2,.24,.12,C.queue,.5);rail.position.y=1.12;
 for(let i=0;i<4;i++)slab(-4.2+i*1.9,4.8,.13,.13,1.12,C.queue,.2);
 const tickets=[];
 for(let i=0;i<14;i++){const tk=box(.30,.40,.02,ownNeon(C.log,.85));
  tk.position.set(-4.25+i*.42,.92,4.8);tk.visible=false;G.add(tk);tickets.push(tk);}
 sign(-1.4,4.8,'QUEUE · ticket rail',C.queue,2.0,3.8);
 NP.queue=V(-1.4,4.4);ACT.queue={tickets:tickets};
 stn(-1.4,7.0,'The queue','Work handed off, waiting for a worker','tasks',C.queue,'queue');

 /* --- the workers: operator units that pull jobs --- */
 RST.counter=slab(-8.4,1.8,1.2,7.2,.9,C.kit,.12);
 ACT.workers=[[-7.0,-.6],[-7.0,1.8],[-7.0,4.2]].map(function(p){
  const f=figure(C.kit,true);f.g.position.set(p[0],0,p[1]);f.g.rotation.y=Math.PI/2;G.add(f.g);f.cube.visible=false;
  return {f:f,pos:V(p[0],p[1],1.0),busy:0,state:'idle'};});
 sign(-8.4,1.8,'WORKERS',C.kit,2.3,3.6);
 NP.worker=V(-7.0,1.8);
 stn(-5.6,1.8,'The workers','Slow work, pulled off the queue at their own pace','tasks',C.kit,'worker');

 /* --- the event log: kept, in order, with offsets --- */
 const logCards=[];
 for(let i=0;i<10;i++){const cd=box(.4,.03,.52,ownNeon(C.log,.5));
  cd.position.set(-6.2+i*.45,.62+i*.03,9.2);cd.rotation.y=.12;G.add(cd);logCards.push(cd);}
 slab(-4.2,9.2,5.2,.9,.55,'#26344F',.08);
 sign(-4.2,9.2,'EVENT LOG · append-only',C.log,1.9,4.0);
 NP.broker=V(-4.2,8.4,.9);ACT.log={cards:logCards,off:90};
 stn(-4.2,7.2,'The event log','Every event kept in order, replayable — Kafka','kafka',C.log,'broker');

 /* --- notifications: the bell that anyone may listen to --- */
 const bell=new THREE.Mesh(GEO.oct,ownNeon('#FFFFFF',.9));bell.scale.setScalar(.6);bell.position.set(-9.6,1.5,7.0);G.add(bell);
 const bellGlow=glow('#FFFFFF',3.2,0);bellGlow.position.copy(bell.position);G.add(bellGlow);
 slab(-9.6,7.0,.9,.9,1.15,'#26344F',.1);
 sign(-9.6,7.0,'NOTIFICATIONS',C.bell,2.5,3.4);
 NP.notify=V(-9.6,7.0,1.5);ACT.bell={bell:bell,glow:bellGlow,ring:0};
 stn(-8.4,5.6,'Notifications','Subscribes to OrderPlaced — publish/subscribe','pubsub',C.bell,'notify');

 /* --- title --- */
 const ttl=textSprite('THE RESTAURANT — A RUNNING SYSTEM','#EAF1FF',52,15);ttl.position.set(0,7.4,0);G.add(ttl);
 const sub=textSprite('every light that moves is a real request · E on any station explains it','#8FA0FF',34,13);
 sub.position.set(0,6.5,0);G.add(sub);

 /* --- the packets: one InstancedMesh, one draw call, pooled --- */
 const pg=new THREE.BoxGeometry(.3,.3,.3);
 const pm=new THREE.MeshBasicMaterial({color:0xffffff});
 const IM=new THREE.InstancedMesh(pg,pm,FLOOR.max);
 IM.instanceMatrix.setUsage(THREE.DynamicDrawUsage);IM.frustumCulled=false;G.add(IM);
 const zero=new THREE.Matrix4().makeScale(0,0,0),white=new THREE.Color(1,1,1);
 for(let i=0;i<FLOOR.max;i++){IM.setMatrixAt(i,zero);IM.setColorAt(i,white);FLOOR.pool.push(i);}
 RST.IM=IM;
 /* shards for the requests that break */
 RST.shards=[];for(let i=0;i<16;i++){const s=box(.1,.1,.1,ownNeon('#FF5A4A',1));s.visible=false;G.add(s);RST.shards.push({m:s,v:new THREE.Vector3(),t:0});}
 /* the followed request carries its own caption */
 const fc=cv(1024,180),fx=fc.getContext('2d');const ft=new THREE.CanvasTexture(fc);
 const fs=new THREE.Sprite(new THREE.SpriteMaterial({map:ft,transparent:true,depthWrite:false}));
 fs.scale.set(5,5*180/1024,1);fs.visible=false;G.add(fs);
 RST.flabel={c:fx,tex:ft,s:fs};
 const halo=new THREE.Mesh(GEO.tor,ownNeon('#FFFFFF',.9));halo.scale.setScalar(1.3);halo.visible=false;G.add(halo);RST.halo=halo;

 /* the async half of the system arrives off the bus */
 BUS.on('REQUEST_SENT',function(ev){floorSpawn(ev.req);});
 BUS.on('WORK_STARTED',function(ev){
  if(!RST.G.visible)return;
  const vis=ACT.workers.filter(function(x){return x.f.g.visible;});if(!vis.length)return;
  const w=vis.filter(function(x){return x.busy<=0;})[0]||vis[FLOOR.jobsShown%vis.length];FLOOR.jobsShown++;
  w.busy=.9;w.state=ev.dup?'retry':'process';
  J.go(ev.dup?'#FF7A6B':C.log,[NP.queue.x,1.0,NP.queue.z],[w.pos.x+.4,1.0,w.pos.z],.45,null,.14,.6);});
 BUS.on('DUPLICATE',function(){if(RST.G.visible)B.pop('duplicate delivery','#FF7A6B',-7.0,2.4,1.8);});
 BUS.on('DUPLICATE_IGNORED',function(){if(RST.G.visible)B.pop('idempotent · ignored','#B18FE0',-7.0,2.2,1.8);});
 BUS.on('WORK_COMPLETED',function(ev){
  if(!RST.G.visible||!SIM.live('broker'))return;
  J.go(C.log,[-7.0,1.0,1.8],[NP.broker.x,.9,NP.broker.z],.6,null,.12,.9);});
 BUS.on('EVENT_APPENDED',function(){
  const L=ACT.log;L.off++;
  if(RST.G.visible&&Math.random()<.35)B.pop('offset '+L.off,C.log,-4.2,1.6,9.2);});
 BUS.on('EVENT_CONSUMED',function(){
  if(!RST.G.visible)return;ACT.bell.ring=.6;
  J.go('#FFFFFF',[NP.broker.x,.9,NP.broker.z],[NP.notify.x,1.4,NP.notify.z],.5,null,.08,.5);});
}

/* ---- the life of one request on the floor ---- */
function floorPos(node,lane,table){
 if(node==='web'||node==='customer')return NP['table'+table];
 if(node==='api')return NP['api'+lane];
 return NP[node]||NP.orders;}
function floorSpawn(req){
 if(!RST.G||!RST.G.visible||!FLOOR.pool.length)return;
 const focus=FLOOR.focusNext;
 if(!focus&&FLOOR.gap>0)return;              /* sample, do not flood the floor */
 FLOOR.gap=.6;FLOOR.spawned++;
 const slot=FLOOR.pool.pop();
 const lanes=Math.max(1,Math.min(3,SIM.knobs.api||1));
 const lane=FLOOR.spawned%lanes,table=FLOOR.spawned%3;
 const legs=[];
 req.hops.forEach(function(h,i){
  if(i===0)return;                            /* hop 0 happens on the table */
  legs.push({node:h.node,type:h.type,ms:h.ms,note:h.note,hop:i,
   pos:floorPos(h.node,lane,table),dwell:Math.max(.14,Math.min(5,h.ms*FLOOR.SLOW))});});
 /* the response path home */
 const last=req.hops[req.hops.length-1].node,ret=[];
 if(last!=='api'&&last!=='lb')ret.push(floorPos('api',lane,table));
 if(SIM.live('lb'))ret.push(NP.lb);
 ret.push(NP['table'+table]);
 const pk={req:req,slot:slot,legs:legs,ret:ret,i:-1,phase:'move',t:0,
  from:NP['table'+table].clone(),to:null,dur:0,pos:NP['table'+table].clone(),
  col:new THREE.Color('#FFD166'),table:table,lane:lane,focus:focus,ri:0,dead:false,waitOut:false};
 FLOOR.packets.push(pk);
 const tb=ACT.tables[table];tb.state='wait';
 if(focus){FLOOR.focusNext=false;FLOOR.focus=pk;SIM.timeScale=.35;
  floorLabel(pk,'leaving the table');routeStart(pk);}
 nextLeg(pk);}

function nextLeg(pk){
 pk.i++;pk.t=0;pk.from.copy(pk.pos);
 if(pk.i<pk.legs.length){const L=pk.legs[pk.i];pk.to=L.pos.clone();
  if(L.type==='RATE_LIMITED')pk.to.x+=1.1;          /* it never gets through the gate */
  pk.phase='move';pk.dur=Math.max(.2,pk.from.distanceTo(pk.to)/FLOOR.SPEED);return;}
 /* response */
 const k=pk.i-pk.legs.length;
 if(k<pk.ret.length){pk.to=pk.ret[k].clone();pk.phase='return';
  pk.dur=Math.max(.2,pk.from.distanceTo(pk.to)/(FLOOR.SPEED*1.3));
  pk.col.set(STATUSCOL[pk.req.status]||'#FFFFFF');
  if(k===0&&pk.focus){floorLabel(pk,pk.req.status+' '+(STATUS_TEXT[pk.req.status]||'')+' — on its way back');routeBack(pk);}return;}
 /* home */
 const tb=ACT.tables[pk.table],ok=pk.req.status<400;
 tb.state=ok?'ok':'bad';tb.until=FLOOR.t+1.4;
 RST.B.pop(pk.req.status+' '+(STATUS_TEXT[pk.req.status]||''),STATUSCOL[pk.req.status]||'#fff',pk.pos.x,2.1,pk.pos.z);
 if(pk.focus)floorDone(pk);
 pk.dead=true;}

/* what each event does to the actor it lands on */
function react(pk,L){
 const t=FLOOR.t,d=L.dwell,B=RST.B;
 switch(L.type){
  case 'ROUTED':ACT.lb.want=pk.lane;break;
  case 'REQUEST_RECEIVED':{const g=ACT.api.lanes[pk.lane];g.state='inspect';g.until=t+d;break;}
  case 'REQUEST_REJECTED':{const g=ACT.api.lanes[pk.lane];g.state='reject';g.until=t+1.2;pk.col.set('#FF7A6B');
   B.pop('400 Bad Request','#FF7A6B',5.6,2.4,g.z);break;}
  case 'RATE_LIMITED':{const g=ACT.api.lanes[pk.lane];g.state='blocked';g.until=t+1.4;pk.col.set('#FFC65C');
   B.pop('429 · Retry-After','#FFC65C',5.6,2.4,g.z);break;}
  case 'AUTH_OK':ACT.auth.state='ok';ACT.auth.until=t+d+.2;break;
  case 'AUTH_FAILED':ACT.auth.state='fail';ACT.auth.until=t+1.2;pk.col.set('#FF7A6B');B.pop('401 Unauthorized','#FF7A6B',3.6,2.0,.6);break;
  case 'USE_CASE':ACT.orders.state='process';ACT.orders.until=t+d+.2;break;
  case 'CACHE_HIT':ACT.cache.state='hit';ACT.cache.until=t+.5;ACT.cache.k=(Math.random()*12)|0;break;
  case 'CACHE_MISS':ACT.cache.state='miss';ACT.cache.until=t+.7;ACT.cache.k=(Math.random()*12)|0;break;
  case 'FALLBACK':ACT.cache.state='hit';ACT.cache.until=t+.8;B.pop('202 · degraded','#FFC65C',2.56,2.6,-6.2);pk.col.set('#FFC65C');break;
  case 'DB_QUERY':ACT.db.state='query';ACT.db.until=t+d;ACT.db.k=(Math.random()*6)|0;break;
  case 'DB_SCAN':ACT.db.state='scan';ACT.db.until=t+d;ACT.db.scan=0;break;
  case 'DB_REFUSED':case 'DB_SATURATED':case 'NO_QUORUM':
   ACT.db.state='fail';ACT.db.until=t+d;pk.col.set('#FF5A4A');
   pk.shatterAt=Math.min(d,1.2);          /* measured in the packet's own dwell */
   B.pop(L.type==='DB_REFUSED'?'500 · database down':L.type==='NO_QUORUM'?'503 · no quorum':'503 · saturated','#FF5A4A',-3.0,2.6,-6.6);break;
  case 'PAYMENT_CHARGED':ACT.pay.state='process';ACT.pay.until=t+d;break;
  case 'CIRCUIT_OPEN':ACT.pay.state='open';ACT.pay.until=t+1.2;B.pop('circuit open · deferred','#FFC65C',7.2,2.0,-7.6);break;
  case 'TIMEOUT':ACT.pay.state='wait';ACT.pay.until=t+d;B.pop('504 · timed out after 1 s','#FF7A6B',8.4,2.4,-8.6);break;
  case 'HUNG':ACT.pay.state='wait';ACT.pay.until=t+d;B.pop('no timeout · still waiting','#FF7A6B',8.4,2.4,-8.6);break;
  case 'MESSAGE_PUBLISHED':B.pop('job enqueued — the customer need not wait','#FF6B5A',-1.4,1.9,4.8);break;}
 if(L.type==='DB_QUERY'||L.type==='DB_SCAN')pk.commitAt=d;}

function floorLabel(pk,line){
 const L=RST.flabel,x=L.c;x.clearRect(0,0,1024,180);
 x.fillStyle='rgba(6,10,19,.86)';rr(x,40,14,944,152,22);x.fill();
 x.strokeStyle=pk.col.getStyle();x.lineWidth=4;rr(x,40,14,944,152,22);x.stroke();
 x.font='700 50px "JetBrains Mono",monospace';x.fillStyle='#FFFFFF';x.textAlign='left';x.textBaseline='middle';
 x.fillText(pk.req.method+' '+pk.req.path+'  ·  '+pk.req.trace,72,62);
 x.font='500 38px Inter,sans-serif';x.fillStyle='#C9D6F0';x.fillText(line.slice(0,48),72,124);
 L.tex.needsUpdate=true;}

function floorDone(pk){
 FLOOR.focus=null;SIM.timeScale=SIM.userScale||1;RST.flabel.s.visible=false;RST.halo.visible=false;
 CAMF.release();routeEnd(pk);}

/* follow the next request, from table to table */
function followOnFloor(){
 if(!RST.G)return;
 SIM.paused=false;updateSimBtn();
 P.plaza=true;P.x=12.4;P.z=1.6;P.y=0;P.r=Math.hypot(P.x,P.z);
 camYaw=Math.atan2(P.x,P.z)+.25;lastDrag=performance.now();
 FLOOR.focusNext=true;
 CAMF.follow(function(){return FLOOR.focus?FLOOR.focus.pos:null;},7.5,4.2);
 routeWaiting();}

/* ======================================================================
   THE FOLLOW BAR — following one order is a journey with a map: every
   component it will visit, where it is now, what happened there, and
   how long it took. The same hops the System view's debugger steps through.
   ====================================================================== */
const FOLLOW={pk:null,hide:0};
function nodeName(n){const x=SIM.node(n);return x?x.label:n;}
function routeShow(on){$('route').classList.toggle('on',on);document.body.classList.toggle('following',on);}
function routeWaiting(){clearTimeout(FOLLOW.hide);FOLLOW.pk=null;
 $('routeT').textContent='Follow an order';
 $('routeS').innerHTML='Waiting for the next customer to tap <b>Place order</b>…';
 $('routeSteps').innerHTML='';$('route').style.setProperty('--acc','#FFD166');routeShow(true);}
function routeStart(pk){FOLLOW.pk=pk;
 const steps=['Table '+(pk.table+1)].concat(pk.legs.map(function(L){return nodeName(L.node);})).concat(['Back at the table']);
 $('routeT').textContent=pk.req.method+' '+pk.req.path+' · '+pk.req.trace;
 $('routeS').textContent='The customer at table '+(pk.table+1)+' places an order. The rest of the floor slows down so you can follow it.';
 $('routeSteps').innerHTML=steps.map(function(s,i){return '<li'+(i===0?' class="now"':'')+'>'+esc(s)+'<small></small></li>';}).join('');
 routeShow(true);}
function routeMark(i,bad,ms){const li=$('routeSteps').children;
 for(let k=0;k<li.length;k++){li[k].classList.toggle('done',k<i);li[k].classList.toggle('now',k===i);}
 if(li[i]){if(bad)li[i].classList.add('bad');if(ms!=null)li[i].querySelector('small').textContent=ms+' ms';
  li[i].scrollIntoView({block:'nearest',inline:'center',behavior:RM?'auto':'smooth'});}}
function routeAt(pk,L,E){if(FOLLOW.pk!==pk)return;
 const bad=/FAIL|REJECT|REFUSED|SATURATED|TIMEOUT|HUNG|NO_QUORUM|RATE_LIMITED/.test(L.type);
 routeMark(pk.i+1,bad,L.ms);
 $('routeS').innerHTML='<b>'+esc((E.what||L.type).replace(/[.]$/,''))+'.</b> '+(E.why||'');}
function routeBack(pk){if(FOLLOW.pk!==pk)return;const ok=pk.req.status<400;
 $('route').style.setProperty('--acc',ok?'#6FD08C':'#FF7A6B');
 $('routeS').innerHTML='<b>'+pk.req.status+' '+(STATUS_TEXT[pk.req.status]||'')+'</b> — the answer travels back the way it came.';}
function routeEnd(pk){if(FOLLOW.pk!==pk)return;const r=pk.req,n=$('routeSteps').children.length;
 routeMark(n-1,r.status>=400);
 $('routeS').innerHTML='<b>'+r.status+' '+(STATUS_TEXT[r.status]||'')+'</b> after '+fmtN(Math.round(r.ms))+' ms and '+r.hops.length+
  ' hops'+(r.note?' · <i>'+esc(r.note)+'</i>':'')+'. The kitchen robots now cook it, and the waiter brings it out.'+
  ' <b>V</b> then <b>Debug</b> steps through this same trace.';
 FOLLOW.pk=null;clearTimeout(FOLLOW.hide);FOLLOW.hide=setTimeout(function(){routeShow(false);},9000);}
function stopFollowing(){
 clearTimeout(FOLLOW.hide);FLOOR.focusNext=false;routeShow(false);CAMF.release();
 const pk=FLOOR.focus;if(pk){pk.focus=false;FLOOR.focus=null;SIM.timeScale=SIM.userScale||1;RST.flabel.s.visible=false;RST.halo.visible=false;}
 FOLLOW.pk=null;}
$('routeX').addEventListener('click',stopFollowing);

function runRestaurant(t,dt){
 const inside=P.plaza||P.a<GAP+.4;
 RST.G.visible=inside||Math.hypot(P.x,P.z)<R_IN+9;
 if(!RST.G.visible)return;
 /* the floor runs on the simulator's clock: pause the system, and it stops */
 const sdt=SIM.paused?0:dt*SIM.timeScale;
 FLOOR.t+=sdt;FLOOR.gap-=sdt;
 const ft=FLOOR.t,m=SIM.m,k=SIM.knobs;
 RST.B.up(sdt);RST.J.up(sdt);

 /* packets */
 const IM=RST.IM,mat=new THREE.Matrix4(),q=new THREE.Quaternion(),s=new THREE.Vector3();
 for(let i=FLOOR.packets.length-1;i>=0;i--){
  const pk=FLOOR.packets[i];
  /* the followed request keeps a readable pace while the rest of the
     floor is slowed and dimmed around it */
  pk.t+=(pk.focus&&!SIM.paused)?dt*.75:sdt;
  if(pk.phase==='move'||pk.phase==='return'){
   const u=Math.min(1,pk.t/pk.dur),e=ease(u);
   pk.pos.lerpVectors(pk.from,pk.to,e);pk.pos.y=pk.from.y+(pk.to.y-pk.from.y)*e+Math.sin(u*Math.PI)*.35;
   if(u>=1){
    if(pk.phase==='move'){const L=pk.legs[pk.i];pk.phase='dwell';pk.t=0;pk.dur=L.dwell;react(pk,L);
     if(pk.focus){const E=EVT[L.type]||{};
      floorLabel(pk,(pk.i+2)+'/'+(pk.legs.length+2)+' · '+(E.what||L.type)+' '+L.ms+'ms');
      routeAt(pk,L,E);}}
    else nextLeg(pk);}}
  else if(pk.phase==='dwell'){
   if(pk.commitAt&&pk.t>=pk.commitAt){pk.commitAt=0;commitRow(pk);}
   if(pk.shatterAt&&pk.t>=pk.shatterAt){pk.shatterAt=0;shatter(pk.pos);}
   pk.pos.y=pk.to.y+Math.sin(ft*9)*.03;
   if(pk.t>=pk.dur)nextLeg(pk);}
  if(pk.dead){IM.setMatrixAt(pk.slot,mat.makeScale(0,0,0));FLOOR.pool.push(pk.slot);FLOOR.packets.splice(i,1);continue;}
  const sc=pk.focus?1.7:1;
  s.set(sc,sc,sc);q.setFromAxisAngle(AXY,ft*2+i);
  mat.compose(pk.pos,q,s);IM.setMatrixAt(pk.slot,mat);
  const dim=FLOOR.focus&&!pk.focus?.25:1;
  _c.copy(pk.col).multiplyScalar(dim);IM.setColorAt(pk.slot,_c);
  if(pk.focus){const L=RST.flabel.s;L.visible=true;L.position.set(pk.pos.x,pk.pos.y+1.35,pk.pos.z);
   RST.halo.visible=true;RST.halo.position.copy(pk.pos);RST.halo.rotation.x=Math.PI/2;
   RST.halo.material.color.copy(pk.col);RST.halo.scale.setScalar(1.3+Math.sin(t*6)*.12);}}
 IM.instanceMatrix.needsUpdate=true;if(IM.instanceColor)IM.instanceColor.needsUpdate=true;

 /* shards */
 RST.shards.forEach(function(o){if(!o.m.visible)return;o.t-=sdt;o.v.y-=9.8*sdt;
  o.m.position.addScaledVector(o.v,sdt);if(o.m.position.y<.05){o.m.position.y=.05;o.v.set(0,0,0);}
  o.m.material.opacity=Math.max(0,o.t);if(o.t<=0)o.m.visible=false;});

 /* tables */
 ACT.tables.forEach(function(tb){
  if((tb.state==='ok'||tb.state==='bad')&&ft>tb.until)tb.state='idle';
  const col=tb.state==='wait'?'#FFC65C':tb.state==='ok'?'#6FD08C':tb.state==='bad'?'#FF7A6B':'#8FA0FF';
  tb.scr.material.color.set(col);
  tb.scr.material.opacity=tb.state==='wait'?.45+Math.abs(Math.sin(t*4))*.5:tb.state==='idle'?.3:.95;});

 /* load balancer: the arm swings to the lane it picked */
 const lanes=Math.max(1,Math.min(3,k.api||1)),lbLive=SIM.live('lb');
 const want=Math.atan2(-(ACT.api.lanes[ACT.lb.want].z-.8),5.6-8.6);
 ACT.lb.arm.rotation.y+=wrapPi(want-ACT.lb.arm.rotation.y)*Math.min(1,dt*6);
 ACT.lb.arm.visible=lbLive;ACT.lb.base.visible=lbLive;

 /* API lanes: provisioned instances only; the lintel shows load */
 ACT.api.lanes.forEach(function(g,i){
  const on=i<lanes;
  if(g.state!=='idle'&&ft>g.until)g.state='idle';
  const load=m.apiLoad,slow=SIM.fail.slow;
  const col=!on?'#22303F':g.state==='reject'?'#FF7A6B':g.state==='blocked'?'#FFC65C':
   (slow||load>.85)?'#FFC65C':'#6FD08C';
  g.parts.forEach(function(p){p.material.color.set(col);p.material.emissive.set(col);
   p.material.emissiveIntensity=!on?.02:g.state==='inspect'?.8:.25+Math.min(1,load)*.3;});
  g.bar.position.y=g.state==='blocked'?.95:1.6;g.bar.visible=on;
  g.beam.material.opacity=g.state==='inspect'?.18+Math.abs(Math.sin(t*14))*.2:0;});

 /* auth */
 const au=ACT.auth,auLive=SIM.live('auth');
 if(au.state!=='idle'&&ft>au.until)au.state='idle';
 au.arch.visible=au.shield.visible=auLive;
 au.shield.material.color.set(au.state==='fail'?'#FF7A6B':au.state==='ok'?'#83C167':'#B18FE0');
 au.shield.material.opacity=au.state==='idle'?.06:.45;

 /* order service: the ring spins while it decides */
 const od=ACT.orders;if(od.state!=='idle'&&ft>od.until)od.state='idle';
 od.ring.rotation.z+=sdt*(od.state==='process'?6:.6);
 od.ring.material.opacity=od.state==='process'?1:.45;

 /* cache: brightness is the hit rate; one slot answers or misses */
 const ca=ACT.cache,cOn=SIM.live('cache'),cDown=SIM.fail.cacheOut;
 if(ca.state!=='idle'&&ft>ca.until)ca.state='idle';
 ca.slots.forEach(function(sl,i){
  let col='#43D9E8',e=cOn?.12+m.hit*.35:.02;
  if(cDown){col='#FF5A4A';e=.12+Math.abs(Math.sin(t*3))*.1;}
  else if(i===ca.k&&ca.state==='hit'){col='#FFFFFF';e=1.2;}
  else if(i===ca.k&&ca.state==='miss'){col='#1A2A3A';e=.02;}
  sl.material.color.set(col);sl.material.emissive.set(col);sl.material.emissiveIntensity=e;});

 /* database: drawers, scans, the ledger, the shutter */
 const db=ACT.db,dbDown=SIM.fail.db;
 if(db.state!=='idle'&&ft>db.until)db.state='idle';
 db.drawers.forEach(function(d,i){
  let out=0,e=.15+Math.min(1,m.dbLoad)*.25;
  if(db.state==='query'&&i===db.k){out=.45;e=1;}
  if(db.state==='scan'){const kk=Math.floor((ft*10)%6);if(i===kk){out=.3;e=1;}}
  if(m.dbLoad>.94&&!dbDown)d.m.position.x+=Math.sin(t*40+i)*.004;
  d.out+=(out-d.out)*Math.min(1,dt*10);d.m.position.z=d.z0+d.out;
  d.m.material.emissiveIntensity=dbDown?.02:e;});
 db.shutter.material.opacity=dbDown?.55+Math.abs(Math.sin(t*3))*.2:0;
 const ix=ACT.index;
 ix.cards.forEach(function(cd,i){cd.material.opacity=k.index?(i===4?.25+Math.abs(Math.sin(t*2.4))*.7:.3):.05;});
 ix.box.material.emissiveIntensity=k.index?.25:.02;

 /* replica: follows the ledger, late; a partition cuts the link */
 const rp=ACT.replica,rLive=SIM.live('replica');
 rp.vault.visible=rLive;rp.link.visible=rLive;
 const lagSteps=SIM.fail.partition?99:SIM.fail.stale?3:0;
 const target=Math.max(0,db.rows-lagSteps);
 if(!SIM.fail.partition&&rp.rows<target&&Math.random()<sdt*2.5)rp.rows++;
 if(rp.rows>db.rows)rp.rows=db.rows;
 rp.ledger.forEach(function(r,i){r.visible=rLive&&i<rp.rows;});
 rp.link.material.color.set(SIM.fail.partition?'#FF5A4A':SIM.fail.stale?'#FFC65C':'#C08A50');
 rp.link.material.opacity=SIM.fail.partition?.2+Math.abs(Math.sin(t*5))*.3:.4;

 /* payment */
 const pa=ACT.pay,pDown=SIM.fail.payment;
 if(pa.state!=='idle'&&ft>pa.until)pa.state='idle';
 pa.scr.material.color.set(pDown?'#FF5A4A':pa.state==='process'?'#83C167':'#8FA0FF');
 pa.scr.material.opacity=pa.state==='idle'?.4:.95;
 pa.spin.material.opacity=pa.state==='wait'?.95:0;pa.spin.rotation.z+=sdt*5;
 pa.lever.visible=pa.leverB.visible=!!SIM.guard.breaker;
 pa.lever.rotation.z=(SIM.guard.breaker&&pDown)?1.1:0;
 pa.lever.material.color.set((SIM.guard.breaker&&pDown)?'#FF7A6B':'#83C167');

 /* the ticket rail IS the queue depth */
 const hang=Math.min(14,Math.round(m.queue/22)+(SIM.jobs.length?1:0));
 ACT.queue.tickets.forEach(function(tk,i){tk.visible=SIM.live('queue')&&i<hang;
  if(tk.visible){tk.position.y=.92+Math.sin(t*1.6+i*.5)*.02;tk.material.color.set(i>10?'#FF7A6B':'#FFD166');}});

 /* workers */
 const dead=SIM.fail.worker||k.workers<=0;
 ACT.workers.forEach(function(w,i){
  const present=i<Math.max(1,Math.min(3,k.workers));
  w.busy-=sdt;const busy=w.busy>0&&!dead;
  if(w.bot){PROPS.kitchen(w,SIM.live('worker')&&present,dead,busy,dt);return;}   /* the robot replaces the figure */
  w.f.g.visible=SIM.live('worker')&&present;
  w.f.cube.visible=busy;w.f.cube.material.color.set(w.state==='retry'?'#FF7A6B':'#FFD166');
  w.f.screen.material.color.set(dead?'#FF5A4A':busy?'#FFD166':'#3FC1A9');
  w.f.screen.material.opacity=dead?.25+Math.abs(Math.sin(t*2))*.3:busy?.95:.4;
  w.f.band.material.color.set(dead?'#FF5A4A':'#3FC1A9');
  w.f.g.rotation.z=busy?Math.sin(t*10+i)*.04:0;});

 /* the event log lights further as consumers fall behind */
 const lagLit=Math.min(ACT.log.cards.length,1+Math.floor(m.lag/40));
 ACT.log.cards.forEach(function(cd,i){cd.visible=SIM.live('broker');
  cd.material.opacity=i<lagLit?(.3+Math.max(0,Math.sin(t*.7-i*.35))*.6):.14;});

 /* the bell */
 const bl=ACT.bell;bl.ring=Math.max(0,bl.ring-sdt);
 bl.bell.visible=SIM.live('notify');
 bl.bell.rotation.y+=sdt*(bl.ring>0?8:.9);
 bl.bell.position.y=1.5+(bl.ring>0?Math.abs(Math.sin(t*22))*.12:0);
 bl.glow.material.opacity=bl.ring>0?.55:.05;
}
const AXY=new THREE.Vector3(0,1,0),_c=new THREE.Color();

function commitRow(pk){
 const db=ACT.db;db.rows=(db.rows%10)+1;
 if(db.rows===1)ACT.replica.rows=0;
 db.ledger.forEach(function(r,i){r.visible=i<db.rows;});
 RST.B.pop('COMMIT · row '+pk.req.order,'#83C167',-3.0,2.2+db.rows*.085,-7.4);}

function shatter(p){
 let n=0;RST.shards.forEach(function(o){if(o.m.visible||n>=6)return;n++;
  o.m.visible=true;o.m.position.copy(p);o.t=1.2;o.m.material.opacity=1;
  o.v.set((Math.random()-.5)*3,1.5+Math.random()*2,(Math.random()-.5)*3);});}


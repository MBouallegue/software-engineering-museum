/* ======================================================================
   PROPS — CC0 models that furnish the floor and give the restaurant's
   actors bodies (credits: assets/CREDITS.md).

   Every model is optional. If one cannot load (for example when the page
   is opened from file:// rather than served), the procedural stand-in it
   would have replaced simply stays, and nothing else changes.

   The robots are not decoration. Each one is driven by the same events
   as the floor it stands on:
     kitchen robots   WORK_STARTED → turn to the stove and knead,
                      DUPLICATE → shake the head, job done → thumbs up,
                      workers crashed → collapse, recovered → stand up
     the waiter       EVENT_CONSUMED (the notification) → carries a pizza
                      box to a table: the async half of an order arriving
     the guide        waves when a visitor walks up to the first hall
   ====================================================================== */
const PROPS={ready:false,T:{},bots:[]};

(function(){
const BASE='assets/models/';
const FILES={
 robot:'robot/RobotExpressive.glb',
 table:'furniture/tableRound.glb',chair:'furniture/chairRounded.glb',rug:'furniture/rugRound.glb',
 stove:'furniture/kitchenStove.glb',cabinet:'furniture/kitchenCabinet.glb',fridge:'furniture/kitchenFridge.glb',
 bar:'furniture/kitchenBar.glb',
 plant:'furniture/pottedPlant.glb',bench:'furniture/benchCushion.glb',
 lamp:'furniture/lampRoundFloor.glb',crate:'furniture/cardboardBoxClosed.glb',screen:'furniture/computerScreen.glb',
 desk:'furniture/desk.glb',
 pizza:'food/pizza.glb',pbox:'food/pizza-box.glb',plate:'food/plate-dinner.glb',burger:'food/burger.glb',
 fries:'food/fries.glb',soda:'food/soda.glb',coffee:'food/cup-coffee.glb',salad:'food/salad.glb'};
const _b=new THREE.Box3(),_s=new THREE.Vector3();

/* ---- instancing a model at a real-world size ---------------------------
   Kenney and Quaternius models come in their own units, so every placement
   states the size it should have (height, or width for flat things). */
function sized(name,size,axis){
 const t=PROPS.T[name];if(!t)return null;
 const o=t.scene.clone(true);
 _b.setFromObject(t.scene).getSize(_s);
 const k=size/Math.max(1e-4,axis==='w'?Math.max(_s.x,_s.z):_s.y);
 o.scale.setScalar(k);
 o.userData.h=_s.y*k;o.userData.w=_s.x*k;o.userData.d=_s.z*k;o.userData.minY=t.minY*k;
 return o;}
function put(parent,name,size,x,y,z,ry,axis){
 const o=sized(name,size,axis);if(!o)return null;
 o.position.set(x,y-o.userData.minY,z);o.rotation.y=ry||0;parent.add(o);return o;}
function finish(o,cast){
 o.traverse(function(m){if(!m.isMesh)return;m.castShadow=cast!==false;m.receiveShadow=true;
  const ms=Array.isArray(m.material)?m.material:[m.material];
  ms.forEach(function(mt){if(mt&&mt.isMeshStandardMaterial){mt.envMapIntensity=.35;mt.needsUpdate=true;}});});}

/* Kenney's palette is bright and flat; the museum is dark and lit. Pull the
   furniture down into the room's value range so bloom does not catch it. */
function tone(root,k){const seen=new Set();
 root.traverse(function(m){if(!m.isMesh)return;
  (Array.isArray(m.material)?m.material:[m.material]).forEach(function(mt){if(!mt||seen.has(mt))return;seen.add(mt);
   if(mt.color)mt.color.multiplyScalar(k);mt.roughness=Math.max(mt.roughness||0,.55);mt.metalness=Math.min(mt.metalness||0,.2);});});}

/* ---- the robot: one rig, a small set of moods ------------------------- */
const LOOPS={Idle:1,Walking:1,Running:1,Dance:1,Punch:1};
function Bot(tint,height){
 const t=PROPS.T.robot;
 const root=THREE.SkeletonUtils.clone(t.scene);
 _b.setFromObject(t.scene).getSize(_s);root.scale.setScalar(height/_s.y);
 /* each robot gets its own body colour; joints and visor stay shared */
 root.traverse(function(m){if(!m.isMesh)return;m.castShadow=true;m.receiveShadow=true;m.frustumCulled=false;
  m.material=m.material.clone();m.material.envMapIntensity=.45;
  if(/main/i.test(m.material.name))m.material.color.set(tint);});
 this.root=root;this.mixer=new THREE.AnimationMixer(root);this.act={};
 const self=this;
 t.animations.forEach(function(c){self.act[c.name]=self.mixer.clipAction(c);});
 this.base='Idle';this.cur=null;this.shot=null;this.dead=false;
 this.mixer.addEventListener('finished',function(e){
  if(self.dead)return;                     /* a fallen robot stays down */
  self.shot=null;self.fade(self.base,.3);});
 this.fade('Idle',0);}
Bot.prototype.fade=function(name,d){const a=this.act[name];if(!a||this.cur===a)return;
 a.reset();a.setEffectiveWeight(1);a.enabled=true;
 if(LOOPS[name])a.setLoop(THREE.LoopRepeat,Infinity);else{a.setLoop(THREE.LoopOnce,1);a.clampWhenFinished=true;}
 if(this.cur)this.cur.crossFadeTo(a,d===undefined?.25:d,false);
 a.play();this.cur=a;};
/* a looping mood: what the robot does until something happens */
Bot.prototype.loop=function(name){if(this.dead)return;this.base=name;if(!this.shot)this.fade(name);};
/* a one-off gesture, after which the robot returns to its mood */
Bot.prototype.once=function(name){if(this.dead||this.shot===name)return;this.shot=name;this.fade(name,.15);};
Bot.prototype.fall=function(){if(this.dead)return;this.dead=true;this.shot=null;this.fade('Death',.2);};
Bot.prototype.rise=function(){if(!this.dead)return;this.dead=false;this.shot='Standing';this.fade('Standing',.2);};
Bot.prototype.update=function(dt){this.mixer.update(dt);};

/* ======================================================================
   THE RESTAURANT, FURNISHED
   ====================================================================== */
function dressTables(G){
 const menu=[['pizza','soda'],['burger','fries'],['salad','coffee']];
 ACT.tables.forEach(function(tb,i){
  const p=tb.pos;
  const tab=put(G,'table',.76,p.x,0,p.z,i*.7);if(!tab)return;finish(tab);
  (tb.parts||[]).forEach(function(m){m.visible=false;});
  const top=tab.userData.h;
  /* the client device stays: its screen is the customer's state */
  tb.dev.position.y=top+.12;tb.scr.position.y=top+.125;
  for(let k=0;k<2;k++){const a=i*.7+(k?0:Math.PI)+Math.PI/2;
   const c=put(G,'chair',.9,p.x+Math.cos(a)*.95,0,p.z-Math.sin(a)*.95,a+Math.PI/2);if(c)finish(c);}
  const rug=put(G,'rug',3.1,p.x,.006,p.z,0,'w');if(rug)finish(rug,false);
  const food=menu[i%3];
  const pl=put(G,'plate',.42,p.x+.32,top,p.z-.18,0,'w');if(pl)finish(pl);
  const f1=put(G,food[0],.34,p.x+.32,top+.03,p.z-.18,i,'w');if(f1)finish(f1);
  const f2=put(G,food[1],.2,p.x-.3,top,p.z+.22,0);if(f2)finish(f2);
  tb.drop=new THREE.Vector3(p.x-.25,top,p.z-.3);});}

function dressKitchen(G){
 if(RST.counter)RST.counter.visible=false;
 /* a run of cabinets along x = -8.9, with a stove in front of each robot */
 const robotsZ=ACT.workers.map(function(w){return w.pos.z;});
 let z=-1.9;const X=-8.95;
 while(z<5.6){
  const nearBot=robotsZ.some(function(rz){return Math.abs(rz-(z+.45))<.5;});
  const unit=put(G,nearBot?'stove':'cabinet',.92,X,0,z+.45,Math.PI/2);if(!unit)break;finish(unit);
  z+=Math.max(.6,unit.userData.w);}
 const fr=put(G,'fridge',1.9,X-.05,0,z+.55,Math.PI/2);if(fr)finish(fr);
 /* the pass: where the waiter picks orders up */
 const bar=put(G,'bar',.92,-6.0,0,6.3,0);if(bar)finish(bar);
 RST.pass=new THREE.Vector3(-6.0,(bar?bar.userData.h:.92),6.3);
 const stack=put(G,'pbox',.42,-6.25,RST.pass.y,6.3,.3,'w');if(stack)finish(stack);
 const stack2=put(G,'pbox',.42,-6.25,RST.pass.y+.06,6.3,.1,'w');if(stack2)finish(stack2);}

function dressFloor(G){
 /* the order service is a desk with a screen: the use case is "decided" here */
 const sc=put(G,'screen',.42,1.2,.82,.25,0);if(sc)finish(sc);
 /* the payment provider's terminal sits behind its boundary */
 const pd=put(G,'desk',.78,8.4,0,-9.15,0);if(pd)finish(pd);
 /* parcels of work next to the ticket rail */
 [[-4.9,5.5,0],[-5.3,5.9,.4],[-4.7,6.0,.9]].forEach(function(c){const b=put(G,'crate',.34,c[0],0,c[1],c[2]);if(b)finish(b);});
 /* the room around the floor: benches facing the system, lamps and plants */
 [[170,'bench'],[205,'bench'],[232,'plant'],[188,'lamp'],[150,'plant'],[-160,'lamp'],[70,'plant'],[95,'bench'],[-30,'plant']].forEach(function(s){
  const a=s[0]*Math.PI/180,r=13.6,x=Math.cos(a)*r,z=Math.sin(a)*r;
  const o=s[1]==='bench'?put(G,'bench',.55,x,0,z,-a-Math.PI/2):s[1]==='lamp'?put(G,'lamp',1.7,x,0,z,0):put(G,'plant',1.15,x,0,z,a);
  if(o)finish(o);});}

/* ---- the robots on the floor ----------------------------------------- */
function staffKitchen(G){
 ACT.workers.forEach(function(w,i){
  const b=new Bot('#3FC1A9',1.45);b.root.position.set(-7.7,0,w.pos.z);b.root.rotation.y=Math.PI/2;G.add(b.root);
  b.face=Math.PI/2;b.idleFace=Math.PI/2;
  /* a pizza on the counter in front of the robot while it works */
  const pz=put(G,'pizza',.46,-8.55,.93,w.pos.z,0,'w');if(pz){finish(pz);pz.visible=false;}
  b.pizza=pz;w.bot=b;PROPS.bots.push(b);});
 BUS.on('DUPLICATE',function(){const w=ACT.workers.filter(function(x){return x.bot&&x.busy>0;})[0];if(w)w.bot.once('No');});}

const WAITER={bot:null,path:[],i:0,state:'home',home:null,carry:null,table:null,wait:0};
function staffWaiter(G){
 const b=new Bot('#FF8A5B',1.4);
 WAITER.home=new THREE.Vector3(-5.0,0,6.9);b.root.position.copy(WAITER.home);b.root.rotation.y=Math.PI/2;G.add(b.root);
 b.face=Math.PI/2;WAITER.bot=b;PROPS.bots.push(b);
 const box=put(b.root,'pbox',.42/b.root.scale.x,0,0,0,0,'w');
 if(box){finish(box);box.position.set(0,.62/b.root.scale.x,.34/b.root.scale.x);box.visible=false;WAITER.carry=box;}
 /* a delivered box waits on the table for a while, then is cleared */
 WAITER.served=ACT.tables.map(function(){const s=put(G,'pbox',.42,0,0,0,0,'w');if(s){finish(s);s.visible=false;}return {m:s,t:0};});
 BUS.on('EVENT_CONSUMED',function(){
  if(WAITER.state!=='home'||!RST.G.visible||Math.random()>.45)return;
  const ti=Math.random()<.5?0:2,tb=ACT.tables[ti];if(!tb||!tb.drop)return;
  /* around the rail and the gates, never through them */
  const to=tb.pos;
  WAITER.path=[RST.pass.clone().setY(0).add(new THREE.Vector3(.3,0,.75)),new THREE.Vector3(3.2,0,7.0),
   new THREE.Vector3(to.x-1.25,0,to.z+.9)];
  WAITER.i=0;WAITER.table=ti;WAITER.state='fetch';WAITER.bot.loop('Walking');});}
function runWaiter(sdt,dt){
 const W=WAITER,b=W.bot;if(!b)return;
 const p=b.root.position;
 if(W.state==='serve'){W.wait-=dt;if(W.wait<=0){W.state='back';W.path=[new THREE.Vector3(3.2,0,7.0),W.home.clone()];W.i=0;b.loop('Walking');}}
 else if(W.state==='fetch'||W.state==='deliver'||W.state==='back'){
  const tgt=W.path[W.i],dx=tgt.x-p.x,dz=tgt.z-p.z,d=Math.hypot(dx,dz),sp=1.55*sdt;
  b.face=Math.atan2(dx,dz);
  if(d<=sp){p.x=tgt.x;p.z=tgt.z;W.i++;
   if(W.state==='fetch'&&W.i===1&&W.carry)W.carry.visible=true;        /* picked up at the pass */
   if(W.i>=W.path.length){
    if(W.state==='back'){W.state='home';b.loop('Idle');b.face=Math.PI/2;}
    else{W.state='serve';W.wait=1.6;b.loop('Idle');b.once('Wave');
     const tb=ACT.tables[W.table],s=W.served[W.table];
     if(W.carry)W.carry.visible=false;
     if(s&&s.m){s.m.position.set(tb.drop.x,tb.drop.y-s.m.userData.minY,tb.drop.z);s.m.visible=true;s.t=14;}
     tb.state='ok';tb.until=FLOOR.t+1.4;
     b.face=Math.atan2(tb.pos.x-p.x,tb.pos.z-p.z);}}}
  else{p.x+=dx/d*sp;p.z+=dz/d*sp;}
  if(W.state==='fetch'&&W.i>=1)W.state='deliver';}
 b.root.rotation.y+=wrapPi(b.face-b.root.rotation.y)*Math.min(1,dt*8);
 W.served.forEach(function(s){if(s.m&&s.m.visible){s.t-=sdt;if(s.t<=0)s.m.visible=false;}});}

/* ---- called from runRestaurant: the kitchen robots read the floor ----- */
PROPS.kitchen=function(w,show,dead,busy,dt){
 const b=w.bot;b.root.visible=show;w.f.g.visible=false;
 if(dead)b.fall();else b.rise();
 if(!dead){
  if(busy){b.loop('Punch');b.face=-Math.PI/2;}        /* turned to the stove, working the dough */
  else{if(b.base==='Punch')b.once('ThumbsUp');b.loop('Idle');b.face=b.idleFace;}}
 if(b.pizza)b.pizza.visible=show&&busy&&!dead;
 b.root.rotation.y+=wrapPi(b.face-b.root.rotation.y)*Math.min(1,dt*6);};

/* ======================================================================
   THE MUSEUM: a guide in the lobby, plants at every department gate
   ====================================================================== */
let GUIDE=null,guideNear=false;
function dressMuseum(){
 const e=BYID.welcome;
 if(e&&e.grp){GUIDE=new Bot('#8C7BE0',1.5);GUIDE.root.position.set(3.5,0,3.4);GUIDE.root.rotation.y=-.55;e.grp.add(GUIDE.root);PROPS.bots.push(GUIDE);}
 let last='';
 EXHIBITS.forEach(function(x){if(!x.grp||x.wing===last||x.wing==='hub')return;last=x.wing;
  const p=put(x.grp,'plant',1.25,-5.0,0,8.55,x.n);if(p)finish(p);});}

/* ======================================================================
   LOADING
   ====================================================================== */
PROPS.load=function(){
 if(!THREE.GLTFLoader||!THREE.SkeletonUtils)return;
 const L=new THREE.GLTFLoader();
 const jobs=Object.keys(FILES).map(function(k){return new Promise(function(res){
  L.load(BASE+FILES[k],function(g){
   g.scene.updateMatrixWorld(true);_b.setFromObject(g.scene);
   if(k!=='robot')tone(g.scene,k==='rug'?.28:FILES[k].indexOf('food/')===0?.85:.5);
   PROPS.T[k]={scene:g.scene,animations:g.animations,minY:_b.min.y};   /* model units */
   res(k);},undefined,function(){res(null);});});});
 Promise.all(jobs).then(function(){
  if(!RST.G)return;
  try{
   if(PROPS.T.table)dressTables(RST.G);
   if(PROPS.T.cabinet&&PROPS.T.stove)dressKitchen(RST.G);
   dressFloor(RST.G);
   if(PROPS.T.robot){staffKitchen(RST.G);staffWaiter(RST.G);dressMuseum();}
   else dressMuseum();
   PROPS.ready=true;
  }catch(err){console.warn('[props] furnishing skipped:',err);}});};

PROPS.update=function(t,dt){
 if(!PROPS.ready)return;
 const sdt=SIM.paused?0:dt*(SIM.timeScale||1);
 const onFloor=RST.G&&RST.G.visible;
 PROPS.bots.forEach(function(b){
  if(b===GUIDE)return;
  if(onFloor)b.update(sdt);});
 if(onFloor)runWaiter(sdt,dt);
 if(GUIDE){
  const e=BYID.welcome,d=Math.hypot(P.x-e.pos.x,P.z-e.pos.z)+Math.abs(P.y-e.y)*2;
  if(d<8&&!guideNear){guideNear=true;GUIDE.once('Wave');}
  else if(d>11)guideNear=false;
  if(d<60)GUIDE.update(dt);}};
})();

/* ======================================================================
   THE CAST
   Nothing in this museum wanders. Every figure on the ramp is staff,
   and every department's staff act out that department's idea.
   ====================================================================== */
const CAST=[];const SPAN={};
EXHIBITS.forEach(function(e){if(e.wing==='hub')return;
 const s=SPAN[e.wing]||(SPAN[e.wing]={a0:99,a1:-99});
 if(e.a<s.a0)s.a0=e.a;if(e.a>s.a1)s.a1=e.a;});

const SKIN=plain(0x16223A,.95,.02),SKIN2=plain(0x24344F,.95,.02);
/* The staff are software actors, so they look like equipment with a job,
   not like people: a base, a mast, and a display that shows what state
   the actor is in. A humanoid would promise behaviour (wandering, looking
   around) that no actor in this museum has. */
function figure(col,carry){
 const g=new THREE.Group();
 g.add(contact(1.0,.45));
 const base=new THREE.Mesh(GEO.cyl,SKIN);base.scale.set(.46,.1,.46);base.position.y=.05;g.add(base);
 const b=box(.12,.72,.12,SKIN2);b.position.y=.46;g.add(b);
 const head=box(.46,.3,.07,SKIN);head.position.set(0,.98,0);g.add(head);
 const screen=box(.38,.22,.02,ownNeon(col,.55));screen.position.set(0,.98,.045);g.add(screen);
 const band=new THREE.Mesh(GEO.tor,ownNeon(col,.8));
 band.scale.set(.5,.5,.5);band.rotation.x=Math.PI/2;band.position.y=.11;g.add(band);
 let cube=null;
 if(carry){cube=box(.2,.2,.2,ownNeon(carry===true?col:carry,.95));
  cube.position.set(0,.7,.22);g.add(cube);}
 return {g:g,cube:cube,band:band,b:b,screen:screen};
}
function at(f,a,r,bob){
 f.g.position.set(Math.cos(a)*r,yDeck(a)+(bob||0),Math.sin(a)*r);
 f.g.rotation.y=-a;}
function fr(x){return x-Math.floor(x);}
function post(a,r,h,col){
 const m=box(.26,h,.26,lit(col,.35,.45));
 m.position.set(Math.cos(a)*r,yDeck(a)+h/2,Math.sin(a)*r);m.rotation.y=-a;return m;}
function tag(txt,col,a,r,y,size){
 const s=textSprite(txt,col,44,size||3.6);
 s.position.set(Math.cos(a)*r,yDeck(a)+y,Math.sin(a)*r);return s;}

function crew(wing,build){
 const s=SPAN[wing];if(!s)return;
 const w=WING[wing],g=new THREE.Group();scene.add(g);
 const o=build(s,w.color,g);
 o.g=g;o.mid=(s.a0+s.a1)/2;CAST.push(o);}

/* ---- ALGORITHMS: five runners, one input, five growth rates ----
   Faithful, not decorative: every runner does f(n) operations on the
   same machine, so position = operations done / operations needed.
   n = 32 and O(n) crosses the department in ten seconds. */
function crewRacers(s,c,g){
 const F=[],N=32,RATE=N/10;
 const fn=[function(){return 1;},function(n){return Math.log2(n);},function(n){return n;},
  function(n){return n*Math.log2(n);},function(n){return n*n;}];
 const lab=['O(1)','O(log n)','O(n)','O(n log n)','O(n²)'];
 for(let i=0;i<5;i++){const f=figure(c,false);g.add(f.g);
  F.push(f);g.add(tag(lab[i],c,s.a0-.30,18.6+i*1.75,1.9,2.6));}
 g.add(tag('n = 32 · same machine','#FFFFFF',s.a0-.45,26.2,2.6,3.6));
 g.add(post(s.a0-.34,18.2,3.2,c));g.add(post(s.a1+.30,18.2,3.2,c));
 return{up:function(t){const el=(t%16);
  F.forEach(function(f,i){const p=Math.min(1,el*RATE/fn[i](N));
   at(f,s.a0-.2+p*(s.a1-s.a0+.5),18.6+i*1.75,0);
   f.band.material.opacity=p>=1?.95:.35;});}};}
/* ---- MESSAGING: couriers, a duplicate, and one dead letter ---- */
function crewCouriers(s,c,g){
 const F=[];for(let i=0;i<6;i++){const f=figure(c,true);g.add(f.g);F.push(f);}
 const bin=box(.9,.9,.9,lit('#FF6B5A',.3,.5));
 const ba=s.a1-.25,br=R_OUT-2.1;
 bin.position.set(Math.cos(ba)*br,yDeck(ba)+.45,Math.sin(ba)*br);g.add(bin);
 g.add(tag('dead letter',"#FF6B5A",ba,br,1.5,3.0));
 g.add(tag('producer',c,s.a0-.28,21,2.2,3.0));
 g.add(tag('consumers',c,s.a1+.26,21,2.2,3.2));
 return{up:function(t){
  F.forEach(function(f,i){
   const p=fr(t*.06+i*.167),A=s.a0-.3+p*(s.a1-s.a0+.6);
   if(i===4){                                   /* the duplicate */
    at(f,s.a0-.3+fr(t*.06+.167*4-.035)*(s.a1-s.a0+.6),22.4,0);
    f.cube.material.opacity=.55;}
   else if(i===5){                              /* the one that never arrives */
    const q=Math.min(1,p*1.6);
    at(f,s.a0-.3+q*(s.a1-s.a0+.2),20.4+q*(br-20.4),0);
    f.cube.material.opacity=Math.max(0,1-q*1.3);}
   else at(f,A,20.2+i*.85,Math.abs(Math.sin(t*6+i))*.04);});
  bin.rotation.y=t*.4;}};}

/* ---- CONCURRENCY: a queue, a desk, and a worker taking the head ---- */
function crewQueue(s,c,g){
 const N=7,aD=(s.a0+s.a1)/2+.12,F=[];
 const desk=box(1.5,.8,1.1,lit(c,.22,.45));
 desk.position.set(Math.cos(aD)*19.4,yDeck(aD)+.4,Math.sin(aD)*19.4);
 desk.rotation.y=-aD;g.add(desk);
 const wk=figure(c,false);wk.g.scale.setScalar(1.05);g.add(wk.g);
 at(wk,aD,18.2,0);
 g.add(tag('worker',c,aD,18.2,1.75,2.8));
 g.add(tag('the queue',c,aD-.30,23.6,2.2,3.4));
 for(let i=0;i<N;i++){const f=figure(c,true);g.add(f.g);F.push(f);}
 return{up:function(t,dt){
  const step=t*.55,base=Math.floor(step),ph=fr(step);
  F.forEach(function(f,i){
   const slot=(i+base)%N;
   const A=aD+.10+slot*.052;
   at(f,A,20.6,slot===0?Math.abs(Math.sin(t*9))*.06:0);
   f.cube.material.opacity=slot===0?Math.max(0,1-ph*2.2):(slot===N-1?ph:1);
   f.band.material.opacity=slot===0?.95:.35;});
  wk.g.rotation.z=Math.sin(t*5)*.06;}};}

/* ---- PROTOCOLS: request goes out, response comes back ---- */
function crewPairs(s,c,g){
 const P2=[];
 for(let i=0;i<3;i++){
  const aS=s.a0+.35+i*((s.a1-s.a0-.5)/2.4), aC=aS+.30;
  const srv=figure(c,false);g.add(srv.g);at(srv,aS,19.3+i*.2,0);
  const cli=figure(c,'#FFD166');g.add(cli.g);
  const pl=post(aS,19.3+i*.2,1.4,c);g.add(pl);
  P2.push({srv:srv,cli:cli,aS:aS,aC:aC,r:21.6+i*.6,i:i});}
 g.add(tag('client',"#FFD166",s.a0+.15,22.6,2.0,2.8));
 g.add(tag('server',c,s.a0+.15,19.0,2.0,2.8));
 return{up:function(t){
  P2.forEach(function(o){
   const p=fr(t*.12+o.i*.31);
   let A,carry=1,col=1;
   if(p<.40){A=o.aC+(o.aS-o.aC)*(p/.40);}
   else if(p<.58){A=o.aS;carry=0;}
   else{A=o.aS+(o.aC-o.aS)*((p-.58)/.42);}
   at(o.cli,A,o.r,Math.abs(Math.sin(t*6+o.i))*.04);
   o.cli.cube.material.opacity=carry?1:0;
   o.cli.cube.material.color.set(p<.40?'#FFD166':'#83C167');
   o.srv.band.material.opacity=(p>.38&&p<.62)?1:.3;});}};}

/* ---- DYNAMIC PROGRAMMING: one walker computes, one reuses ---- */
function crewMemo(s,c,g){
 const T=[],n=8,A0=s.a0-.1,A1=s.a1+.3;
 for(let i=0;i<n;i++){const a=A0+(i/(n-1))*(A1-A0);
  const t2=box(1.5,.05,1.5,ownNeon(c,.12));
  t2.position.set(Math.cos(a)*20.4,yDeck(a)+.04,Math.sin(a)*20.4);t2.rotation.y=-a;
  g.add(t2);T.push(t2);}
 const naive=figure(c,false),memo=figure('#FFD166',false);
 g.add(naive.g);g.add(memo.g);
 g.add(tag('computes',c,A0,22.6,2.0,2.9));
 g.add(tag('remembers',"#FFD166",A0,18.2,2.0,3.1));
 return{up:function(t){
  const p=fr(t*.045);
  at(naive,A0+p*(A1-A0),22.6,Math.abs(Math.sin(t*6))*.04);
  const q=Math.min(1,fr(t*.045+.52)*7);
  at(memo,A0+q*(A1-A0),18.6,Math.abs(Math.sin(t*14))*.05);
  T.forEach(function(m,i){
   const k=p*(n-1);
   m.material.opacity=i<=k?.12+Math.max(0,1-Math.abs(k-i))*.6:.06;});}};}

/* ---- DATA: one clerk scans every shelf, one goes straight to the index ---- */
function crewClerks(s,c,g){
 const SH=[],n=6,A0=s.a0-.05,A1=s.a1+.25;
 for(let i=0;i<n;i++){const a=A0+(i/(n-1))*(A1-A0);
  const p2=post(a,19.2,2.1,c);g.add(p2);SH.push({a:a,m:p2});}
 const scan=figure(c,false),idx=figure('#FFD166',false);
 g.add(scan.g);g.add(idx.g);
 g.add(tag('full scan',c,A0,22.7,2.0,3.0));
 g.add(tag('index seek',"#FFD166",A0,20.9,2.0,3.2));
 return{up:function(t){
  const p=fr(t*.05),k=Math.floor(p*n);
  at(scan,SH[Math.min(n-1,k)].a,22.7,Math.abs(Math.sin(t*7))*.05);
  const target=SH[3].a,q=Math.min(1,fr(t*.05+.5)*6);
  at(idx,A0+q*(target-A0),20.9,0);
  SH.forEach(function(o,i){o.m.material=lit(i===3?'#FFD166':c,i<=k?.9:.25,.45);});}};}

/* ---- DISTRIBUTED: three replicas, until the network splits them ---- */
function crewReplicas(s,c,g){
 const F=[];for(let i=0;i<3;i++){const f=figure(c,false);g.add(f.g);F.push(f);}
 const A0=s.a0-.1,A1=s.a1+.3;
 const split=box(.14,3.0,7.0,ownNeon('#FF6B5A',0));
 const sa=(A0+A1)/2;
 split.position.set(Math.cos(sa)*21.5,yDeck(sa)+1.5,Math.sin(sa)*21.5);
 split.rotation.y=-sa;g.add(split);
 g.add(tag('replicas',c,A0,22.9,2.1,3.0));
 g.add(tag('partition',"#FF6B5A",sa,24.4,2.4,3.0));
 return{up:function(t){
  const cut=Math.sin(t*.24)>.55;
  const p=.5+.5*Math.sin(t*.42);
  F.forEach(function(f,i){
   const lag=(cut&&i===2)?.32:0;
   at(f,A0+(p-lag)*(A1-A0),19.4+i*1.7,0);
   f.band.material.color.set((cut&&i===2)?'#FF6B5A':c);
   f.band.material.opacity=(cut&&i===2)?1:.45;});
  split.material.opacity=cut?.22+Math.sin(t*8)*.1:0;}};}

/* ---- INFRASTRUCTURE: the same crate, built once, run anywhere ---- */
function crewDock(s,c,g){
 const F=[],A0=s.a0-.2,A1=s.a1+.3;
 for(let i=0;i<3;i++){const f=figure(c,true);g.add(f.g);F.push(f);}
 const stack=[];
 for(let i=0;i<4;i++){const b=box(.8,.36,.8,ownLit(c,.2,.45));
  b.position.set(Math.cos(A1)*19.6,yDeck(A1)+.2+i*.4,Math.sin(A1)*19.6);
  b.rotation.y=-A1;g.add(b);stack.push(b);}
 g.add(tag('build',c,A0,21.4,2.1,2.8));
 g.add(tag('run anywhere',c,A1,21.4,2.1,3.4));
 return{up:function(t){
  F.forEach(function(f,i){const p=fr(t*.07+i*.334);
   at(f,A0+p*(A1-A0),21.4+i*.9,Math.abs(Math.sin(t*6+i))*.04);
   f.cube.material.opacity=1;});
  stack.forEach(function(b,i){
   const k=fr(t*.07*4+i*.25);
   b.material.emissiveIntensity=.2+(k<.2?1.1:0);});}};}

/* ---- PRINCIPLES: two modules, one member moving between them ---- */
function crewModules(s,c,g){
 const F=[],A0=s.a0-.05,A1=s.a1+.25;
 const cA=A0+.18,cB=A1-.18;
 for(let i=0;i<6;i++){const f=figure(c,false);g.add(f.g);F.push(f);}
 g.add(post(cA,20.6,2.4,c));g.add(post(cB,20.6,2.4,c));
 g.add(tag('module A',c,cA,22.9,2.0,3.0));
 g.add(tag('module B',c,cB,22.9,2.0,3.0));
 return{up:function(t){
  const mover=Math.floor(t*.10)%6,p=fr(t*.10);
  F.forEach(function(f,i){
   const home=i<3?cA:cB,other=i<3?cB:cA;
   const A=(i===mover)?home+(other-home)*p:home;
   const off=(i%3)-1;
   at(f,A+off*.035,20.6+off*1.0,0);
   f.band.material.opacity=(i===mover)?.95:.35;});}};}

function buildCast(){
 crew('complexity',crewRacers);
 crew('messaging',crewCouriers);
 crew('tasks',crewQueue);
 crew('protocols',crewPairs);
 crew('dp',crewMemo);
 crew('data',crewClerks);
 crew('distributed',crewReplicas);
 crew('containers',crewDock);
 crew('foundations',crewModules);
}
function runCast(t,dt){
 CAST.forEach(function(o){
  const vis=Math.abs(P.a-o.mid)<3.4;
  o.g.visible=vis;if(vis)o.up(t,dt);});
}


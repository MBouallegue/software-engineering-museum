/* ======================================================================
   LABS — installations you can change from where you stand
   Every rig below replaces one that used to borrow another hall's shape.
   A rig may now return:
     acts     buttons (and keys 1–9) that change what it is doing
     readout  one line that says what just happened, in numbers
   The lab bar appears when you stand at the plinth. Nothing needs the
   reading drawer to be understood.
   ====================================================================== */
function mk(w,h,d,col,emi){return box(w,h,d,ownLit(col,emi===undefined?.2:emi,.45));}
function tint(m,col,emi){m.material.color.set(col);if(m.material.emissive)m.material.emissive.set(col);
 if(emi!==undefined&&m.material.emissiveIntensity!==undefined)m.material.emissiveIntensity=emi;}
function lerp(a,b,t){return a+(b-a)*t;}
function clamp01(x){return x<0?0:x>1?1:x;}

/* small labels share one texture per (text, colour) — dozens of rigs,
   a few dozen textures. Texture reuse is one of the museum's own rules. */
const LABTEX={};
function miniLabel(text,col,sc){
 const k=text+'|'+col;
 let tex=LABTEX[k];
 if(!tex){const c=cv(512,96),x=c.getContext('2d');
  x.font='600 44px "JetBrains Mono",monospace';x.textAlign='center';x.textBaseline='middle';
  x.fillStyle='rgba(6,10,19,.72)';const w=Math.min(508,x.measureText(text).width+34);
  rr(x,256-w/2,10,w,76,14);x.fill();
  x.fillStyle=col;x.fillText(text,256,50);
  tex=LABTEX[k]=new THREE.CanvasTexture(c);}
 const s=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false}));
 const k2=sc||1.2;s.scale.set(k2,k2*96/512,1);return s;}
function lbl(g,text,col,x,y,z,sc){const s=miniLabel(text,col,sc);s.position.set(x,y,z);g.add(s);return s;}
/* swap a label's text without a new sprite */
function relabel(s,text,col){const k=text+'|'+col;
 if(!LABTEX[k]){const t=miniLabel(text,col);LABTEX[k]=t.material.map;}
 s.material.map=LABTEX[k];s.material.needsUpdate=true;}

/* a pool of travelling messages — pooled, never allocated per message */
function flyers(g,max,shape){
 const P=[];
 for(let i=0;i<max;i++){
  const m=shape==='box'?box(1,1,1,ownNeon('#FFFFFF',1)):sph(.5,ownNeon('#FFFFFF',1));
  m.visible=false;g.add(m);P.push({m:m,on:false});}
 return {
  go:function(col,a,b,dur,done,size,arc){
   let p=null;for(let i=0;i<P.length;i++)if(!P[i].on){p=P[i];break;}
   if(!p)return null;
   p.on=true;p.a=a;p.b=b;p.t=0;p.d=Math.max(.01,dur);p.done=done||null;p.arc=arc||0;
   p.m.material.color.set(col);p.m.material.opacity=1;p.m.scale.setScalar((size||.09)*2);
   p.m.visible=true;p.m.position.set(a[0],a[1],a[2]);return p;},
  up:function(dt){P.forEach(function(p){if(!p.on)return;p.t+=dt;const k=Math.min(1,p.t/p.d);
   p.m.position.set(lerp(p.a[0],p.b[0],k),lerp(p.a[1],p.b[1],k)+Math.sin(k*Math.PI)*p.arc,lerp(p.a[2],p.b[2],k));
   if(k>=1){p.on=false;p.m.visible=false;if(p.done)p.done(p);}});},
  clear:function(){P.forEach(function(p){p.on=false;p.m.visible=false;});},
  busy:function(){let n=0;P.forEach(function(p){if(p.on)n++;});return n;}};}

/* a status badge that pops where something happened, then fades */
function badges(g,n){
 const B=[];for(let i=0;i<n;i++){const s=miniLabel('200','#83C167',.9);s.visible=false;g.add(s);B.push({s:s,t:0});}
 let k=0;
 return {pop:function(text,col,x,y,z){const b=B[k++%B.length];relabel(b.s,text,col);
   b.s.position.set(x,y,z);b.s.visible=true;b.t=1.6;b.y=y;},
  up:function(dt){B.forEach(function(b){if(!b.s.visible)return;b.t-=dt;
   b.s.position.y=b.y+(1.6-b.t)*.18;b.s.material.opacity=Math.min(1,b.t);if(b.t<=0)b.s.visible=false;});}};}

const STATUSCOL={200:'#83C167',201:'#6FD08C',202:'#FFC65C',400:'#FF7A6B',401:'#FF7A6B',404:'#9AA6BF',
 429:'#FFC65C',500:'#FF5A4A',503:'#FF5A4A',504:'#FF7A6B'};

/* ---- PRINCIPLES: pull out Stripe, plug in PayPal ------------------------- */
function rigDI(c){
 const g=new THREE.Group();
 const svc=mk(1.1,.8,.9,'#FFD166',.25);svc.position.set(-1.7,.4,0);g.add(svc);
 lbl(g,'OrderService','#FFD166',-1.7,1.12,0,1.5);
 const port=new THREE.LineSegments(new THREE.EdgesGeometry(GEO.box),
  new THREE.LineBasicMaterial({color:0xE9EDF7,transparent:true,opacity:.85}));
 port.scale.set(.42,.86,.96);port.position.set(-.3,.43,0);g.add(port);
 const portL=lbl(g,'PaymentPort','#E9EDF7',-.3,1.12,0,1.4);
 const glue=mk(1.0,.16,.16,'#FF7A6B',.6);glue.position.set(-.55,.4,0);glue.visible=false;g.add(glue);
 const AD=[{n:'Stripe',col:'#6FD08C'},{n:'PayPal',col:'#B18FE0'}].map(function(a){
  const m=mk(.8,.7,.8,a.col,.2);g.add(m);const l=lbl(g,a.n,a.col,0,0,0,1.15);return {m:m,l:l,col:a.col,n:a.n};});
 const F=flyers(g,8);
 let cur=0,swap=0,wired=false,served=0,edits=0,down=0,next=.4,auto=6.5,msg='';
 function place(){
  AD.forEach(function(a,i){
   const plugged=(i===cur);
   let x=plugged?.55:1.85,z=plugged?0:(i?-.95:.95);
   if(swap>0){const k=ease(1-swap/1.1);
    const was=(i!==cur);           /* the one leaving was plugged before the swap */
    x=was?lerp(.55,1.85,k):lerp(1.85,.55,k);z=was?lerp(0,(i?-.95:.95),k):lerp((i?-.95:.95),0,k);}
   a.m.position.set(x,.36,z);a.l.position.set(x,.95,z);});}
 function doSwap(){
  if(swap>0)return;
  if(wired){down=2.2;edits++;msg='Hard-wired: to change provider, <b>OrderService itself</b> was edited and redeployed. Calls stopped for the redeploy.';}
  else msg='Injected: the adapter was swapped at the <b>edge</b>. OrderService never noticed — nothing inside it changed.';
  cur=1-cur;swap=1.1;auto=6.5;}
 place();
 return {g:g,
  acts:[{label:'Swap payment provider',fn:doSwap},
        {label:'Hard-wire it (no port)',on:function(){return wired;},fn:function(){wired=!wired;
          msg=wired?'OrderService now calls <b>new stripe.Charge()</b> directly. Try swapping the provider.':'Back to depending on an interface the caller owns.';}}],
  readout:function(){return 'Calls served <b>'+served+'</b> · OrderService edited <b>'+edits+'</b> times · provider <b>'+AD[cur].n+'</b>'+(msg?'<br>'+msg:'');},
  up:function(t,dt){
   F.up(dt);
   if(swap>0){swap=Math.max(0,swap-dt);place();}
   auto-=dt;if(auto<=0)doSwap();
   down=Math.max(0,down-dt);
   port.visible=!wired;portL.visible=!wired;glue.visible=wired;
   tint(svc,down>0?'#FF7A6B':'#FFD166',down>0?.4+Math.abs(Math.sin(t*8))*.4:.25);
   next-=dt;
   if(next<=0&&down<=0&&swap<=0){next=.7;
    const A=AD[cur];
    F.go('#FFFFFF',[-1.15,.5,0],[.15,.5,0],.55,function(){served++;
     tint(A.m,A.col,.9);setTimeout(function(){tint(A.m,A.col,.2);},180);});}}};}

/* ---- PATTERNS: strategy + observer ---------------------------------------- */
function rigStrategy(c){
 const g=new THREE.Group();
 const ctx=mk(1.0,.7,1.0,'#FFD166',.22);ctx.position.set(-.5,.35,0);g.add(ctx);
 lbl(g,'Sorter context','#FFD166',-.5,1.05,0,1.5);
 const S=[{n:'QuickSort',col:'#83C167',size:'small list'},{n:'MergeSort',col:'#58C4DD',size:'large list'},
          {n:'ExternalSort',col:'#B18FE0',size:'40 GB file'}].map(function(s,i){
  const m=mk(.62,.46,.3,s.col,.18);m.position.set(1.55,.25+i*.5,-.3);g.add(m);
  const l=lbl(g,s.n,s.col,1.55,.25+i*.5,.12,1.1);return Object.assign({m:m,l:l,home:[1.55,.25+i*.5,-.3]},s);});
 const obs=[];for(let i=0;i<3;i++){const o=sph(.1,ownNeon('#58C4DD',.3));o.position.set(-1.5+i*.5,.12,-.85);g.add(o);obs.push(o);}
 lbl(g,'observers','#58C4DD',-1,.42,-.85,1.0);
 const input=mk(.4,.3,.4,'#FFFFFF',.4);g.add(input);
 const inL=lbl(g,'small list','#FFFFFF',0,0,0,1.0);
 let pick=0,ph=0,forced=-1,msg='';
 function start(i){pick=i;ph=0;relabel(inL,S[i].size,'#FFFFFF');
  msg='Input: <b>'+S[i].size+'</b> → strategy <b>'+S[i].n+'</b>. The call site is still <code>sorter.sort(rows)</code>.';}
 start(0);
 return {g:g,
  acts:S.map(function(s,i){return {label:s.size,on:function(){return pick===i;},fn:function(){forced=i;start(i);}};}),
  readout:function(){return msg+'<br>When it finishes, the context <b>notifies</b> — three observers react, and it never learned their names.';},
  up:function(t,dt){
   ph+=dt;
   const s=S[pick];
   /* 0-1 input arrives, 1-2 strategy slides in, 2-3.2 runs, 3.2-3.8 notify */
   const k1=clamp01(ph/1);input.position.set(lerp(-2.3,-.5,ease(k1)),.85,0);inL.position.set(input.position.x,1.2,0);
   input.visible=ph<3.2;inL.visible=ph<3.2;
   S.forEach(function(o,i){const m=o.m;
    if(i===pick){const k=clamp01(ph-1);
     m.position.set(lerp(o.home[0],.2,ease(k)),lerp(o.home[1],.35,ease(k)),lerp(o.home[2],0,ease(k)));
     tint(m,o.col,ph>2&&ph<3.2?.5+Math.abs(Math.sin(t*9))*.5:.3);}
    else{m.position.set(o.home[0],o.home[1],o.home[2]);tint(m,o.col,.12);}
    o.l.position.set(m.position.x,m.position.y,m.position.z+.3);});
   obs.forEach(function(o,i){o.material.opacity=(ph>3.2&&ph<3.9+i*.1)?1:.25;});
   if(ph>4.6){start(forced>=0?forced:(pick+1)%3);forced=-1;}}};}

/* ---- ARCHITECTURE: the hexagon, with arrows that point inward ------------- */
function rigHexagon(c){
 const g=new THREE.Group();
 const hex=new THREE.Mesh(new THREE.CylinderGeometry(.75,.75,.5,6),ownLit('#FFD166',.3,.45));
 hex.position.set(0,.3,0);g.add(hex);
 lbl(g,'Domain','#FFD166',0,.85,0,1.2);
 const AD=[{n:'HTTP',x:-1.9,z:-.55,col:'#58C4DD',drive:1},{n:'Kafka consumer',x:-1.9,z:.55,col:'#58C4DD',drive:1},
           {n:'Postgres',x:1.9,z:-.55,col:'#6FD08C',drive:0,alt:'DynamoDB'},{n:'Payment API',x:1.9,z:.55,col:'#6FD08C',drive:0}];
 AD.forEach(function(a){a.m=mk(.7,.42,.5,a.col,.2);a.m.position.set(a.x,.21,a.z);g.add(a.m);
  a.l=lbl(g,a.n,a.col,a.x,.66,a.z,1.1);
  /* the dependency arrow: always from the adapter toward the domain */
  const dx=-a.x*.55,dz=-a.z*.55,cx=a.x+dx*.5,cz=a.z+dz*.5;
  a.cone=new THREE.Mesh(GEO.cone,ownNeon('#E9EDF7',.75));a.cone.scale.set(.14,.28,.14);
  a.cone.position.set(a.x*.52,.3,a.z*.52);
  a.cone.rotation.z=a.x<0?-Math.PI/2:Math.PI/2;g.add(a.cone);
  const line=box(Math.abs(a.x)-.8,.025,.025,ownNeon('#E9EDF7',.25));line.position.set(a.x/2+(a.x<0?-.05:.05),.3,a.z*.75);g.add(line);});
 const F=flyers(g,8);
 let leak=false,swapped=false,next=.3,domainEdits=0,msg='Calls go <b>out</b> through ports; dependencies point <b>in</b>. The domain imports nothing from the rim.';
 return {g:g,
  acts:[{label:'Swap Postgres → DynamoDB',on:function(){return swapped;},fn:function(){swapped=!swapped;
          const a=AD[2];relabel(a.l,swapped?'DynamoDB':'Postgres',a.col);
          if(leak)domainEdits++;
          msg=leak?'The domain imported the SQL driver, so swapping the database meant <b>editing the domain</b> too.'
                  :'One adapter replaced. The domain did not change — <b>0 files</b> inside the hexagon touched.';}},
        {label:'Leak SQL into the domain',on:function(){return leak;},fn:function(){leak=!leak;
          msg=leak?'<code>import psycopg2</code> inside Order. One arrow now points <b>outward</b> — the centre depends on the rim.':'The boundary is restored: every arrow points inward again.';}}],
  readout:function(){return msg+' · domain edits caused by infrastructure: <b>'+domainEdits+'</b>';},
  up:function(t,dt){
   F.up(dt);
   tint(hex,leak?'#FF7A6B':'#FFD166',.3+Math.abs(Math.sin(t*1.6))*.15);
   const pg=AD[2];pg.cone.rotation.z=leak?-Math.PI/2:Math.PI/2;tint(pg.cone,leak?'#FF7A6B':'#E9EDF7');
   pg.m.material.color.set(swapped?'#43D9E8':pg.col);pg.m.material.emissive.set(swapped?'#43D9E8':pg.col);
   next-=dt;if(next<=0){next=.9;
    const a=AD[(Math.random()*2)|0],b=AD[2+((Math.random()*2)|0)];
    F.go(a.col,[a.x+.4,.35,a.z],[-.55,.35,a.z*.3],.6,function(){
     F.go('#FFFFFF',[.55,.35,b.z*.3],[b.x-.4,.35,b.z],.6);});}}};}

/* ---- BIG-O: five lanes, the same machine, faithful work counts ------------ */
function rigGrowth(c){
 const g=new THREE.Group();
 const L=[{n:'O(1)',f:function(){return 1;},col:'#83C167'},
          {n:'O(log n)',f:function(n){return Math.max(1,Math.log2(n));},col:'#58C4DD'},
          {n:'O(n)',f:function(n){return n;},col:'#FFD166'},
          {n:'O(n log n)',f:function(n){return n*Math.log2(n);},col:'#B18FE0'},
          {n:'O(n²)',f:function(n){return n*n;},col:'#FF6B5A'}];
 L.forEach(function(l,i){const z=(i-2)*.5;
  const tr=box(4.0,.04,.12,lit('#2A3752',.05,.6));tr.position.set(.2,.05,z);g.add(tr);
  l.m=sph(.13,ownNeon(l.col,1));l.m.position.set(-1.8,.2,z);g.add(l.m);
  lbl(g,l.n,l.col,-2.45,.24,z,1.0);l.z=z;});
 const fin=box(.05,.5,2.4,neon('#FFFFFF',.35));fin.position.set(2.2,.25,0);g.add(fin);
 const NS=[10,100,1000,10000];
 let n=100,t0=0;
 function human(s){if(s<1)return (s*1000).toFixed(0)+' ms';if(s<120)return s.toFixed(1)+' s';
  if(s<7200)return (s/60).toFixed(0)+' min';if(s<172800)return (s/3600).toFixed(1)+' h';
  if(s<3.2e7)return (s/86400).toFixed(0)+' days';return (s/3.15e7).toExponential(1)+' years';}
 return {g:g,
  acts:NS.map(function(v){return {label:'n = '+v.toLocaleString('en-US'),on:function(){return n===v;},fn:function(){n=v;t0=0;}};}),
  readout:function(){
   const rate=n/4;                 /* the machine is fixed: O(n) takes four seconds */
   return 'n = <b>'+n.toLocaleString('en-US')+'</b>, one machine, '+fmtN(rate)+' ops/s. '+
    L.map(function(l){const ops=l.f(n),s=ops/rate;
     return l.n+' <b>'+(t0>=s?'✓':human(s))+'</b>';}).join(' · ');},
  up:function(t,dt){
   t0+=dt;
   const rate=n/4;
   L.forEach(function(l){const p=clamp01(t0*rate/l.f(n));
    l.m.position.x=-1.8+p*4.0;l.m.material.opacity=p>=1?.55:1;});
   if(t0>11)t0=0;}};}

/* ---- REST: every status code is something that physically happens --------- */
function rigHTTP(c){
 const g=new THREE.Group();
 const X={client:-2.4,gate:-1.55,valid:-.8,auth:-.05,router:.7,store:1.75};
 const pad=mk(.5,.1,.5,'#8FA0FF',.3);pad.position.set(X.client,.05,0);g.add(pad);lbl(g,'client','#8FA0FF',X.client,.5,0,.9);
 /* 429: a barrier that lowers across the entrance */
 const postL=mk(.08,.8,.08,'#FFC65C',.2),postR=postL.clone();postL.position.set(X.gate,.4,-.4);postR.position.set(X.gate,.4,.4);g.add(postL);g.add(postR);
 const bar=mk(.06,.06,.84,'#FFC65C',.5);bar.position.set(X.gate,.95,0);g.add(bar);lbl(g,'rate limit','#FFC65C',X.gate,1.2,0,.9);
 /* 400: a scanner that reads the body against the contract */
 const scan=new THREE.Mesh(GEO.tor,ownNeon('#58C4DD',.6));scan.scale.setScalar(1.3);scan.rotation.y=Math.PI/2;scan.position.set(X.valid,.55,0);g.add(scan);
 lbl(g,'validate','#58C4DD',X.valid,1.2,0,.9);
 /* 401: an identity shield */
 const shield=box(.04,.9,.9,ownNeon('#B18FE0',.25));shield.position.set(X.auth,.5,0);g.add(shield);lbl(g,'identity','#B18FE0',X.auth,1.2,0,.9);
 const router=mk(.3,.3,.3,'#E9EDF7',.3);router.position.set(X.router,.3,0);g.add(router);lbl(g,'route','#E9EDF7',X.router,.75,0,.8);
 /* the resource store: rows that exist, and one address that does not */
 const shelf=mk(.9,.06,1.6,'#D99A52',.1);shelf.position.set(X.store,.02,0);g.add(shelf);
 const rows=[];for(let i=0;i<6;i++){const r=mk(.26,.2,.2,'#D99A52',.25);r.position.set(X.store-.25+(i%2)*.5,.16+Math.floor(i/2)*.24,-.55);r.visible=i<3;g.add(r);rows.push(r);}
 const hole=new THREE.LineSegments(new THREE.EdgesGeometry(GEO.box),new THREE.LineBasicMaterial({color:0x9AA6BF,transparent:true,opacity:.6}));
 hole.scale.set(.3,.24,.24);hole.position.set(X.store,.16,.55);g.add(hole);lbl(g,'/orders/9999','#9AA6BF',X.store,.5,.55,.9);
 lbl(g,'/orders','#D99A52',X.store,.95,-.55,.9);
 const pkt=sph(.1,ownNeon('#FFFFFF',1)),pktB=box(.2,.2,.2,ownNeon('#FFFFFF',1));g.add(pkt);g.add(pktB);
 const B=badges(g,4);
 const SC=[
  {k:'GET',path:'/orders/1842',st:200,stop:X.store,z:-.55,say:'A copy of the resource comes back. Nothing on the shelf changed — GET is <b>safe</b> and <b>idempotent</b>.'},
  {k:'POST',path:'/orders',st:201,stop:X.store,z:-.55,say:'A <b>new resource now exists</b> — a new row appeared on the shelf. Location: /orders/1843.'},
  {k:'POST',path:'/orders',st:400,stop:X.valid,z:0,say:'The body broke the contract (qty: 0). Rejected at validation. <b>Retrying the same request can never work.</b>'},
  {k:'GET',path:'/orders/1842',st:401,stop:X.auth,z:0,say:'No valid identity. The shield stops it — nothing behind this point ran.'},
  {k:'GET',path:'/orders/9999',st:404,stop:X.store,z:.55,say:'Routing worked; the address is empty. <b>404 is an answer</b>, not a failure of the server.'},
  {k:'POST',path:'/orders',st:429,stop:X.gate-.25,z:0,say:'Too many requests. The barrier is down: come back after <b>Retry-After</b>. The server protected itself.'},
  {k:'POST',path:'/orders',st:500,stop:X.store,z:-.55,say:'Something downstream broke. The server failed, not the client — this one <b>may</b> be worth retrying.'}];
 let i=0,ph=0,forced=-1,msg='';
 function cur(){return SC[i];}
 return {g:g,
  acts:SC.map(function(s,j){return {label:s.k+' → '+s.st,on:function(){return i===j;},fn:function(){i=j;ph=0;forced=j;}};}),
  readout:function(){const s=cur();return '<b>'+s.k+' '+s.path+' → '+s.st+' '+STATUS_TEXT[s.st]+'.</b> '+s.say;},
  up:function(t,dt){
   B.up(dt);ph+=dt;const s=cur(),isPost=s.k==='POST';
   const p=isPost?pktB:pkt;pkt.visible=!isPost;pktB.visible=isPost;
   const col=isPost?'#FFD166':'#58C4DD';
   bar.position.y=(s.st===429&&ph>.2&&ph<3.2)?.55:.95;
   tint(scan,(s.st===400&&ph>1.1&&ph<1.8)?'#FF7A6B':'#58C4DD');
   shield.material.opacity=(s.st===401&&ph>1.2&&ph<1.9)?.8:.22;tint(shield,(s.st===401&&ph>1.2&&ph<1.9)?'#FF7A6B':'#B18FE0');
   /* out: 0..1.2, act: 1.2..1.9, back: 1.9..3.0, rest */
   let x,z=0;
   if(ph<1.2){const k=ease(ph/1.2);x=lerp(X.client,s.stop,k);if(s.stop>=X.router)z=lerp(0,s.z,clamp01((x-X.router)/(s.stop-X.router)));}
   else if(ph<1.9){x=s.stop;z=s.stop>=X.router?s.z:0;
    if(!p.__done){p.__done=1;const st=s.st;
     B.pop(st+' '+STATUS_TEXT[st],STATUSCOL[st],s.stop,1.05,z);
     if(st===201){const r=rows.filter(function(r){return !r.visible;})[0];if(r)r.visible=true;else rows.forEach(function(r,j){r.visible=j<3;});}
     if(st===500)rows.forEach(function(r){tint(r,'#FF5A4A',.9);});}}
   else if(ph<3.0){const k=ease((ph-1.9)/1.1);x=lerp(s.stop,X.client,k);z=lerp(s.stop>=X.router?s.z:0,0,k);}
   else{x=X.client;}
   if(ph<1.2)p.__done=0;
   p.position.set(x,.55+(s.st===400&&ph>1.2&&ph<1.9?Math.abs(Math.sin(t*14))*.1:0),z);
   const back=ph>=1.9;
   p.material.color.set(back?STATUSCOL[s.st]:col);
   p.scale.setScalar((isPost?.2:.2)*(back&&(s.st===200)?1.3:1));
   if(ph>3&&ph<3.1)rows.forEach(function(r){tint(r,'#D99A52',.25);});
   if(ph>3.6){ph=0;if(forced<0)i=(i+1)%SC.length;forced=-1;}}};}

/* ---- SOAP: the envelope, the signature, the contract ---------------------- */
function rigEnvelope(c){
 const g=new THREE.Group();
 const body=mk(.36,.05,.26,'#FFFFFF',.4);g.add(body);
 const extra=mk(.12,.05,.12,'#FF7A6B',.6);g.add(extra);
 const env=box(.6,.18,.44,new THREE.MeshStandardMaterial({color:0x5B8DEF,emissive:0x5B8DEF,emissiveIntensity:.25,transparent:true,opacity:.45}));g.add(env);
 const head=mk(.6,.03,.1,'#FFD166',.5);g.add(head);
 const seal=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,.03,16),ownNeon('#FFD166',1));g.add(seal);
 const wsdl=new THREE.LineSegments(new THREE.EdgesGeometry(GEO.box),new THREE.LineBasicMaterial({color:0x83C167,transparent:true,opacity:.8}));
 wsdl.scale.set(.66,.24,.5);wsdl.position.set(1.8,.5,0);g.add(wsdl);
 lbl(g,'WSDL contract','#83C167',1.8,.95,0,1.1);lbl(g,'sender','#5B8DEF',-2.1,.95,0,1.0);
 const recv=mk(.8,.3,.8,'#5B8DEF',.15);recv.position.set(1.8,.15,0);g.add(recv);
 const B=badges(g,3);
 let ph=0,bad=false,msg='';
 return {g:g,
  acts:[{label:'Send a valid message',on:function(){return !bad;},fn:function(){bad=false;ph=0;}},
        {label:'Add a field the contract lacks',on:function(){return bad;},fn:function(){bad=true;ph=0;}}],
  readout:function(){return bad?'The receiver validates against the WSDL before reading a word: an unknown element fails the schema → <b>soap:Fault</b>. Strict contracts reject change.'
                              :'Body → wrapped in an <b>Envelope</b> → a <b>Header</b> carries WS-Security → a <b>signature</b> seals it → the receiver checks it against the <b>contract</b>.';},
  up:function(t,dt){B.up(dt);ph+=dt;
   const x=ph<2.6?-2.0:lerp(-2.0,1.8,ease(clamp01((ph-2.6)/1.2)));
   const y=.55;
   body.position.set(x,y,0);extra.visible=bad;extra.position.set(x+.2,y+.04,.12);
   env.visible=ph>.8;const ek=ph>.8?Math.max(.01,Math.min(1,(ph-.8)*2.2)):.01;env.scale.set(.6*ek,.18*ek,.44*ek);env.position.set(x,y,0);
   head.visible=ph>1.4;head.position.set(x,y+.11,-.17);
   seal.visible=ph>2.0;seal.position.set(x+.2,y+.1,.12);seal.rotation.x=Math.PI/2*(ph>2&&ph<2.3?(ph-2)/.3:1);
   if(ph>3.8&&ph<3.85)B.pop(bad?'soap:Fault':'200 accepted',bad?'#FF7A6B':'#83C167',1.8,1.2,0);
   wsdl.material.color.set(ph>3.8&&ph<5?(bad?0xFF7A6B:0x83C167):0x83C167);
   tint(recv,ph>3.8&&ph<5?(bad?'#FF7A6B':'#83C167'):'#5B8DEF',ph>3.8&&ph<5?.6:.15);
   if(ph>5.6)ph=0;}};}

/* ---- MCP: host, clients, servers, and a tool call ------------------------- */
function rigMCP(c){
 const g=new THREE.Group();
 const host=mk(1.0,.5,1.8,'#6FD08C',.15);host.position.set(-1.8,.25,0);g.add(host);
 lbl(g,'Host (AI app)','#6FD08C',-1.8,.95,0,1.2);
 const model=sph(.16,ownNeon('#FFFFFF',.9));model.position.set(-1.9,.72,0);g.add(model);
 const gate=box(.05,.4,.4,ownNeon('#FFD166',.4));gate.position.set(-1.15,.5,-.5);g.add(gate);
 lbl(g,'consent','#FFD166',-1.15,.9,-.5,.8);
 const SV=[{n:'files server',z:-.5,col:'#58C4DD'},{n:'calendar server',z:.5,col:'#B18FE0'}];
 SV.forEach(function(s){
  s.cl=mk(.22,.22,.22,'#E9EDF7',.3);s.cl.position.set(-.75,.35,s.z);g.add(s.cl);
  s.m=mk(.7,.45,.6,s.col,.15);s.m.position.set(1.6,.25,s.z);g.add(s.m);lbl(g,s.n,s.col,1.6,.78,s.z,1.1);
  s.tool=mk(.14,.14,.14,s.col,.2);s.tool.position.set(1.2,.6,s.z);g.add(s.tool);
  const wire=box(2.2,.02,.02,ownNeon(s.col,.25));wire.position.set(.45,.35,s.z);g.add(wire);});
 lbl(g,'MCP clients','#E9EDF7',-.75,.72,0,.9);
 const tl=[];for(let i=0;i<4;i++){const m=box(.1,.04,.1,ownNeon('#FFFFFF',.15));m.position.set(-2.1+i*.18,.52,.6);g.add(m);tl.push(m);}
 const F=flyers(g,6);const B=badges(g,3);
 let ph=0,deny=false,step='';
 return {g:g,
  acts:[{label:'Allow the tool call',on:function(){return !deny;},fn:function(){deny=false;ph=0;F.clear();}},
        {label:'Deny (the user says no)',on:function(){return deny;},fn:function(){deny=true;ph=0;F.clear();}}],
  readout:function(){return 'JSON-RPC over the connection: <b>'+step+'</b>. The server declares its tools; the <b>host</b> decides whether the model may use them.';},
  up:function(t,dt){F.up(dt);B.up(dt);const p0=ph;ph+=dt;
   function at(x){return p0<x&&ph>=x;}
   if(at(.05)){step='initialize';SV.forEach(function(s){F.go('#FFFFFF',[-.75,.4,s.z],[1.3,.4,s.z],.7,function(){F.go(s.col,[1.3,.4,s.z],[-.75,.4,s.z],.7);});});}
   if(at(1.6)){step='tools/list → 4 tools discovered';}
   tl.forEach(function(m,i){m.material.opacity=ph>1.6+i*.12?.95:.15;});
   if(at(2.4)){step='the model chooses search_files';}
   model.material.color.set(ph>2.4&&ph<3?'#FFD166':'#FFFFFF');
   if(at(3.0)){if(deny){step='tools/call — blocked at consent';B.pop('denied','#FF7A6B',-1.15,1.1,-.5);}
    else{step='tools/call search_files';F.go('#FFD166',[-1.3,.5,-.5],[1.2,.6,-.5],1.0,function(){
      tint(SV[0].tool,'#FFD166',1);F.go('#83C167',[1.2,.6,-.5],[-1.3,.5,-.5],1.0,function(){step='result → back into the model\'s context';tint(SV[0].tool,SV[0].col,.2);});});}}
   tint(gate,deny&&ph>3&&ph<4.2?'#FF7A6B':'#FFD166',.4);
   if(ph>6.4){ph=0;}}};}

/* ---- REALTIME: the same events, three ways of hearing about them ---------- */
function rigRealtime(c){
 const g=new THREE.Group();
 const LN=[{n:'Polling',z:-.8,col:'#FFD166'},{n:'SSE',z:0,col:'#6FD08C'},{n:'WebSocket',z:.8,col:'#58C4DD'}];
 LN.forEach(function(l){
  l.cl=mk(.36,.36,.36,'#8FA0FF',.2);l.cl.position.set(-2,.2,l.z);g.add(l.cl);
  l.sv=mk(.4,.5,.4,l.col,.15);l.sv.position.set(2,.25,l.z);g.add(l.sv);
  lbl(g,l.n,l.col,-2.55,.5,l.z,1.0);
  if(l.n!=='Polling'){const p=box(3.6,.035,.035,ownNeon(l.col,.35));p.position.set(0,.3,l.z);g.add(p);}
  l.F=flyers(g,6);l.req=0;l.empty=0;l.lat=[];l.pend=[];});
 lbl(g,'client','#8FA0FF',-2,.6,-1.25,.9);lbl(g,'server','#E9EDF7',2,.7,-1.25,.9);
 let pollEvery=1.6,pollT=0,evT=1.2,chatT=2.5,T=0;
 function evt(){LN.forEach(function(l){l.pend.push(T);tint(l.sv,'#FFFFFF',.8);});
  /* the push lanes deliver at once */
  [LN[1],LN[2]].forEach(function(l){const born=l.pend.shift();
   l.F.go('#FFFFFF',[1.8,.32,l.z],[-1.8,.32,l.z],.55,function(){l.lat.push(T-born);if(l.lat.length>20)l.lat.shift();});});}
 function avg(a){return a.length?a.reduce(function(x,y){return x+y;},0)/a.length:0;}
 return {g:g,
  acts:[{label:'Poll every 0.5 s',on:function(){return pollEvery===.5;},fn:function(){pollEvery=.5;}},
        {label:'Poll every 1.6 s',on:function(){return pollEvery===1.6;},fn:function(){pollEvery=1.6;}},
        {label:'Poll every 4 s',on:function(){return pollEvery===4;},fn:function(){pollEvery=4;}},
        {label:'Burst of updates',fn:function(){evt();setTimeout(evt,150);setTimeout(evt,300);}}],
  readout:function(){const P=LN[0];
   return 'Polling: <b>'+P.req+'</b> requests, <b>'+P.empty+'</b> came back empty, update seen after <b>'+avg(P.lat).toFixed(2)+'s</b> on average · '+
          'SSE: <b>0</b> requests, <b>'+avg(LN[1].lat).toFixed(2)+'s</b> · WebSocket: same, and the client can talk back.';},
  up:function(t,dt){T+=dt;
   LN.forEach(function(l){l.F.up(dt);l.sv.material.emissiveIntensity=Math.max(.15,l.sv.material.emissiveIntensity-dt*1.5);});
   evT-=dt;if(evT<=0){evT=1.5+Math.random()*2.5;evt();}
   pollT-=dt;const P=LN[0];
   if(pollT<=0){pollT=pollEvery;P.req++;
    P.F.go('#FFD166',[-1.8,.32,P.z],[1.8,.32,P.z],.45,function(){
     const has=P.pend.length>0,born=has?P.pend.shift():0;if(!has)P.empty++;
     P.F.go(has?'#FFFFFF':'#4A5573',[1.8,.32,P.z],[-1.8,.32,P.z],.45,function(){if(has){P.lat.push(T-born);if(P.lat.length>20)P.lat.shift();}});});}
   chatT-=dt;if(chatT<=0){chatT=2.8;LN[2].F.go('#8FA0FF',[-1.8,.28,LN[2].z],[1.8,.28,LN[2].z],.55);}}};}

/* ---- DELIVERY: at-most-once, at-least-once, idempotent -------------------- */
function rigDelivery(c){
 const g=new THREE.Group();
 const prod=mk(.5,.5,.5,'#FFD166',.2);prod.position.set(-2.1,.25,0);g.add(prod);lbl(g,'producer','#FFD166',-2.1,.8,0,.9);
 const brk=mk(.7,.4,.7,'#FF6B5A',.2);brk.position.set(-.5,.2,0);g.add(brk);lbl(g,'broker','#FF6B5A',-.5,.75,0,.9);
 const con=mk(.5,.6,.5,'#58C4DD',.2);con.position.set(1.1,.3,0);g.add(con);lbl(g,'consumer','#58C4DD',1.1,.95,0,.9);
 const led=[];for(let i=0;i<6;i++){const m=box(.22,.04,.3,ownNeon('#B18FE0',.12));m.position.set(1.1+(i%3)*.26-.26,.05+Math.floor(i/3)*.06,-.7);g.add(m);led.push(m);}
 const ledL=lbl(g,'processed keys','#B18FE0',1.1,.4,-.7,.9);
 const coins=[];for(let i=0;i<14;i++){const m=new THREE.Mesh(new THREE.CylinderGeometry(.1,.1,.04,14),ownNeon('#83C167',.95));
  m.position.set(2.0+(i%2)*.24,.03+Math.floor(i/2)*.05,.2);m.visible=false;g.add(m);coins.push(m);}
 lbl(g,'charges','#83C167',2.1,.75,.2,.9);
 const F=flyers(g,6,'box');const B=badges(g,3);
 const MODES=['at-most-once','at-least-once','idempotent'];
 let mode=1,T=0,n=0,charged=0,lost=0,dupC=0,dupI=0,key=0,seen={};
 function charge(red){const m=coins[charged%coins.length];if(charged%coins.length===0)coins.forEach(function(c2){c2.visible=false;});
  m.visible=true;m.material.color.set(red?'#FF6B5A':'#83C167');charged++;}
 function send(){n++;key++;const k=key,trouble=(n%3===0);
  F.go('#FFD166',[-1.8,.35,0],[-.7,.35,0],.5,function(){
   F.go('#FFD166',[-.3,.35,0],[.9,.35,0],.55,function(){deliver(k,trouble,false);});});}
 function deliver(k,trouble,isDup){
  if(mode===0){ /* ack on receipt, then process — a crash loses the message */
   if(trouble&&!isDup){lost++;tint(con,'#FF7A6B',.8);B.pop('crashed · lost','#FF7A6B',1.1,1.2,0);return;}
   charge(false);return;}
  if(mode===2&&seen[k]){dupI++;B.pop('duplicate ignored','#B18FE0',1.1,1.2,0);led[k%6].material.opacity=1;return;}
  charge(isDup);if(isDup){dupC++;B.pop('charged twice','#FF6B5A',1.1,1.2,0);}
  seen[k]=1;led[k%6].material.opacity=.9;
  /* ack after processing — and sometimes the ack is lost, so it comes again */
  if(trouble&&!isDup){tint(con,'#FFC65C',.8);B.pop('ack lost','#FFC65C',.2,1.0,0);
   setTimeout(function(){F.go('#FFC65C',[-.3,.35,0],[.9,.35,0],.55,function(){deliver(k,false,true);});},500);}}
 return {g:g,
  acts:MODES.map(function(m,i){return {label:m,on:function(){return mode===i;},fn:function(){mode=i;n=0;charged=0;lost=0;dupC=0;dupI=0;seen={};
   coins.forEach(function(c2){c2.visible=false;});led.forEach(function(l){l.material.opacity=.12;});}};}),
  readout:function(){return '<b>'+MODES[mode]+'</b> · sent '+n+' · charged '+charged+
   ' · <span style="color:#FF7A6B">lost '+lost+'</span> · <span style="color:#FF7A6B">double charges '+dupC+'</span> · duplicates ignored '+dupI+
   (mode===0?'<br>Ack first, work second: a crash means the message is simply gone.':mode===1?'<br>Work first, ack second: nothing is lost, but a lost ack means it happens twice.':'<br>At-least-once delivery + a processed-keys table = exactly-once <b>effect</b>.');},
  up:function(t,dt){F.up(dt);B.up(dt);T+=dt;
   ledL.visible=mode===2;led.forEach(function(l){l.visible=mode===2;});
   con.material.emissiveIntensity=Math.max(.2,con.material.emissiveIntensity-dt);
   if(con.material.emissiveIntensity<=.25)tint(con,'#58C4DD',.2);
   if(T>1.3){T=0;send();}}};}

/* ---- RETRIES: naive retry, backoff with jitter, circuit breaker ------------ */
function rigRetry(c){
 const g=new THREE.Group();
 const N=6,CL=[];
 for(let i=0;i<N;i++){const z=(i-(N-1)/2)*.4;const m=mk(.24,.24,.24,'#8FA0FF',.2);m.position.set(-2.1,.15,z);g.add(m);
  const lamp=sph(.05,ownNeon('#83C167',.9));lamp.position.set(-2.1,.36,z);g.add(lamp);
  CL.push({m:m,lamp:lamp,z:z,wait:Math.random()*1.2,att:0,fails:0});}
 lbl(g,'clients','#8FA0FF',-2.1,.7,-1.35,.9);
 const srv=mk(.7,.7,.7,'#3FC1A9',.2);srv.position.set(1.9,.35,0);g.add(srv);lbl(g,'payment provider','#3FC1A9',1.9,1.0,0,1.1);
 const meter=box(.12,1,.12,ownNeon('#83C167',.9));meter.position.set(2.45,.5,0);g.add(meter);
 const F=flyers(g,26);
 const MODES=['naive retry','backoff + jitter','circuit breaker'];
 let mode=0,T=0,arrivals=[],brk='closed',brkT=0,fails=0,state='healthy';
 function load(){const now=T;arrivals=arrivals.filter(function(a){return now-a<1;});return arrivals.length/4;}  /* capacity: 4 calls/s */
 function outage(){const k=T%14;return k>2&&k<5.5;}
 function down(){return outage()||(state==='overloaded');}
 function attempt(cl){
  if(mode===2&&brk==='open'){cl.lamp.material.color.set('#FF7A6B');cl.wait=.8;return;}  /* fail fast, locally */
  F.go('#FFFFFF',[-1.9,.2,cl.z],[1.5,.35,cl.z*.3],.45,function(){
   arrivals.push(T);
   const ok=!down();
   F.go(ok?'#83C167':'#FF7A6B',[1.5,.35,cl.z*.3],[-1.9,.2,cl.z],.45,function(){
    cl.lamp.material.color.set(ok?'#83C167':'#FF7A6B');
    if(ok){cl.att=0;cl.wait=1.2+Math.random()*.4;if(brk==='half')brk='closed';fails=Math.max(0,fails-1);return;}
    cl.att++;fails++;
    if(mode===2&&brk!=='open'&&fails>=6){brk='open';brkT=2.6;}
    if(mode===0)cl.wait=.15;                                         /* immediately, all together */
    else{const cap=Math.min(6,.4*Math.pow(2,cl.att));cl.wait=Math.random()*cap;}});});}   /* full jitter */
 return {g:g,
  acts:MODES.map(function(m,i){return {label:m,on:function(){return mode===i;},fn:function(){mode=i;brk='closed';fails=0;state='healthy';CL.forEach(function(cl){cl.att=0;});}};}),
  readout:function(){const L=load();
   return 'Provider '+(outage()?'<b style="color:#FF7A6B">in an outage</b>':state==='overloaded'?'<b style="color:#FFC65C">recovered, but knocked down again by retries</b>':'<b>healthy</b>')+
    ' · load <b>'+Math.round(L*100)+'%</b>'+(mode===2?' · breaker <b>'+brk+'</b>':'')+
    (mode===0?'<br>Every client retries instantly, in lock-step. When the provider comes back, the herd is waiting.':
     mode===1?'<br>Waits grow and are randomised, so retries spread out instead of arriving together.':
     '<br>After repeated failures the breaker opens: clients fail fast and stop adding load, then one probe tests recovery.');},
  up:function(t,dt){F.up(dt);T+=dt;
   const L=load();
   if(T%14<dt)state='healthy';                       /* a new day */
   if(!outage()&&L>1.25)state='overloaded';else if(L<.8)state='healthy';
   if(brk==='open'){brkT-=dt;if(brkT<=0)brk='half';}
   CL.forEach(function(cl){cl.wait-=dt;if(cl.wait<=0){cl.wait=99;attempt(cl);}});
   meter.scale.y=Math.max(.05,Math.min(1.6,L));meter.position.y=meter.scale.y/2;
   meter.material.color.set(L>1.2?'#FF7A6B':L>.8?'#FFC65C':'#83C167');
   tint(srv,down()?'#FF7A6B':'#3FC1A9',down()?.3+Math.abs(Math.sin(t*6))*.3:.2);}};}

/* ---- ORCHESTRATION: desired state, and a loop that makes it true ---------- */
function rigReconcile(c){
 const g=new THREE.Group();
 const NODES=[{x:-.8},{x:1.0}],SL=[];
 NODES.forEach(function(nd,ni){const plat=mk(1.5,.08,1.5,'#5B8DEF',.1);plat.position.set(nd.x,.04,0);g.add(plat);nd.plat=plat;
  lbl(g,'node '+(ni+1),'#5B8DEF',nd.x,.2,.95,.8);
  for(let i=0;i<3;i++){SL.push({node:ni,x:nd.x-.45+i*.45,z:(i%2?.3:-.3),pod:null});}});
 const spec=lbl(g,'replicas: 3','#FFD166',-2.1,.9,0,1.2);
 const ctl=sph(.12,ownNeon('#FFD166',1));g.add(ctl);
 const pods=[];for(let i=0;i<7;i++){const m=mk(.28,.28,.28,'#3FC1A9',.3);m.visible=false;g.add(m);pods.push({m:m,s:0,state:'off',slot:null});}
 let desired=3,T=0,deadNode=-1,msg='',pending=0;
 function slotFree(){for(let i=0;i<SL.length;i++){const s=SL[i];if(!s.pod&&s.node!==deadNode)return s;}return null;}
 function actual(){return pods.filter(function(p){return p.state==='run'||p.state==='start';}).length;}
 function reconcile(){
  const a=actual();pending=0;
  if(a<desired){for(let k=0;k<desired-a;k++){const s=slotFree();if(!s){pending=desired-a-k;msg='Pending: <b>no capacity</b> left for '+pending+' pod(s).';break;}
    const p=pods.filter(function(p2){return p2.state==='off';})[0];if(!p)break;
    p.state='start';p.s=0;p.slot=s;s.pod=p;p.m.visible=true;p.m.position.set(s.x,.22,s.z);tint(p.m,'#3FC1A9',.3);}
   if(!pending)msg='Observed '+a+', wanted '+desired+' → started '+(desired-a)+'.';}
  else if(a>desired){pods.filter(function(p){return p.state==='run';}).slice(0,a-desired).forEach(function(p){p.state='stop';});msg='Observed '+a+', wanted '+desired+' → stopping '+(a-desired)+'.';}}
 function kill(p){if(!p)return;p.state='dying';p.s=1;tint(p.m,'#FF7A6B',.8);}
 return {g:g,
  acts:[{label:'Kill a pod',fn:function(){kill(pods.filter(function(p){return p.state==='run';})[0]);msg='A pod died. Nobody restarts it by hand.';}},
        {label:'Scale to 5',on:function(){return desired===5;},fn:function(){desired=5;relabel(spec,'replicas: 5','#FFD166');}},
        {label:'Scale to 2',on:function(){return desired===2;},fn:function(){desired=2;relabel(spec,'replicas: 2','#FFD166');}},
        {label:'Lose node 2',on:function(){return deadNode===1;},fn:function(){
          if(deadNode===1){deadNode=-1;msg='Node 2 is back.';return;}
          deadNode=1;SL.forEach(function(s){if(s.node===1&&s.pod){kill(s.pod);}});msg='A whole machine failed. Its pods are rescheduled elsewhere — if there is room.';}}],
  readout:function(){return 'Desired <b>'+desired+'</b> · running <b>'+actual()+'</b>'+(pending?' · <b style="color:#FF7A6B">pending '+pending+'</b>':'')+'<br>'+msg;},
  up:function(t,dt){T+=dt;
   const A=(T*1.4)%(Math.PI*2);ctl.position.set(Math.cos(A)*1.9,1.2,Math.sin(A)*.9);
   if(Math.floor(T/1.3)!==Math.floor((T-dt)/1.3)){reconcile();ctl.scale.setScalar(1.8);}
   ctl.scale.setScalar(Math.max(1,ctl.scale.x-dt*3));
   NODES.forEach(function(nd,i){tint(nd.plat,deadNode===i?'#FF7A6B':'#5B8DEF',deadNode===i?.25:.1);});
   pods.forEach(function(p){
    if(p.state==='start'){p.s=Math.min(1,p.s+dt*1.6);p.m.scale.setScalar(.28*p.s);if(p.s>=1)p.state='run';}
    else if(p.state==='stop'||p.state==='dying'){p.s=Math.max(0,p.s-dt*(p.state==='dying'?.9:1.6));p.m.scale.setScalar(.28*Math.max(.01,p.s));
     if(p.state==='dying')p.m.position.y=.22-(1-p.s)*.2;
     if(p.s<=0){p.state='off';p.m.visible=false;if(p.slot)p.slot.pod=null;p.slot=null;}}
    else if(p.state==='run')p.m.material.emissiveIntensity=.3+Math.abs(Math.sin(t*2+p.m.position.x))*.2;});}};}

/* ---- CACHE: fast memory in front of a slow truth ------------------------- */
function rigCache(c){
 const g=new THREE.Group();
 const K=12,S=[];
 for(let i=0;i<K;i++){const m=mk(.3,.26,.14,'#43D9E8',.05);m.position.set(-.9+(i%4)*.38,.55+Math.floor(i/4)*.32,-.6);g.add(m);
  S.push({m:m,age:99,ver:0});}
 lbl(g,'cache — memory','#43D9E8',-.35,1.55,-.6,1.2);
 const db=mk(.8,.5,.7,'#D99A52',.15);db.position.set(1.8,.25,.2);g.add(db);lbl(g,'database','#D99A52',1.8,.8,.2,1.0);
 const meter=box(.1,1,.1,ownNeon('#83C167',.9));meter.position.set(2.35,.5,.2);g.add(meter);
 const F=flyers(g,20);
 const TTLS=[{n:'TTL 2 s — fresh',v:2},{n:'TTL 6 s',v:6},{n:'TTL 20 s — fast',v:20}];
 let ttl=6,T=0,next=0,hits=0,miss=0,dbHits=[],stale=0,ver=1,coalesce=false,inflight={};
 function key(){const r=Math.random();return Math.min(K-1,Math.floor(Math.pow(r,2.2)*K));}   /* a few keys are hot */
 function req(k){
  const s=S[k],sx=s.m.position.x,sy=s.m.position.y;
  F.go('#FFFFFF',[-2.3,.5,.3],[sx,sy,-.45],.45,function(){
   if(s.age<ttl){hits++;if(s.ver<ver)stale++;tint(s.m,s.ver<ver?'#FFC65C':'#FFFFFF',1);
    F.go(s.ver<ver?'#FFC65C':'#83C167',[sx,sy,-.45],[-2.3,.5,.3],.35);return;}
   miss++;
   if(coalesce){if(inflight[k]){inflight[k].push(1);return;}     /* wait for the fetch already running */
    inflight[k]=[];}
   dbHits.push(T);
   F.go('#9AA6BF',[sx,sy,-.45],[1.6,.4,.2],.4,function(){
    setTimeout(function(){
     F.go('#D99A52',[1.6,.4,.2],[sx,sy,-.45],.4,function(){s.age=0;s.ver=ver;
      const waiting=coalesce&&inflight[k]?inflight[k].length:0;delete inflight[k];
      for(let w=0;w<=waiting;w++)F.go('#83C167',[sx,sy,-.45],[-2.3,.5,.3],.45);});},450);});});}
 return {g:g,
  acts:TTLS.map(function(x){return {label:x.n,on:function(){return ttl===x.v;},fn:function(){ttl=x.v;}};}).concat([
   {label:'Everything expires at once',fn:function(){S.forEach(function(s){s.age=99;});for(let i=0;i<10;i++)setTimeout(function(){req(key());},i*40);}},
   {label:'Coalesce misses',on:function(){return coalesce;},fn:function(){coalesce=!coalesce;}}]),
  readout:function(){const tot=hits+miss,L=dbHits.filter(function(x){return T-x<2;}).length/2;
   return 'Hit rate <b>'+(tot?Math.round(hits/tot*100):0)+'%</b> · database reads <b>'+L.toFixed(1)+'/s</b> · stale answers served <b>'+stale+'</b> (the price changes every 5 s)'+
    '<br>'+(ttl<=2?'<b>Fresh</b>: few stale reads, many trips to the database.':ttl>=20?'<b>Fast</b>: the database rests, and customers see old prices.':'The middle of the trade-off.')+
    (coalesce?' Misses on one key now wait for a single fetch.':'');},
  up:function(t,dt){F.up(dt);T+=dt;
   if(Math.floor(T/5)!==Math.floor((T-dt)/5))ver++;          /* the truth moves on */
   S.forEach(function(s){s.age+=dt;const f=s.age<ttl?1-s.age/ttl:0;
    const col=s.age>=ttl?'#1A2A3A':(s.ver<ver?'#FFC65C':'#43D9E8');
    s.m.material.color.set(col);s.m.material.emissive.set(col);
    s.m.material.emissiveIntensity=Math.max(s.m.material.emissiveIntensity-dt*2,.05+f*.5);});
   next-=dt;if(next<=0){next=.33;req(key());}
   const L=dbHits.filter(function(x){return T-x<2;}).length/2;dbHits=dbHits.filter(function(x){return T-x<4;});
   meter.scale.y=Math.max(.05,Math.min(1.8,L/2.5));meter.position.y=meter.scale.y/2;
   meter.material.color.set(L>3.5?'#FF7A6B':L>2?'#FFC65C':'#83C167');
   tint(db,'#D99A52',.15+Math.min(.8,L*.12));}};}

/* ---- KNAPSACK: the table fills, then the answer walks back out ------------ */
function rigKnapsack(c){
 const g=new THREE.Group();
 const IT=[{n:'A',w:1,v:1},{n:'B',w:3,v:4},{n:'C',w:4,v:5},{n:'D',w:5,v:7}];
 const MAXC=7,cells=[];
 for(let i=0;i<=IT.length;i++)for(let cc=0;cc<=MAXC;cc++){
  const m=mk(.2,.05,.2,'#9B7BE8',.05);m.position.set(-.9+cc*.25,.05,-.9+i*.25);g.add(m);cells.push({m:m,i:i,c:cc});}
 lbl(g,'capacity →','#9B7BE8',-.2,.3,-1.25,.9);
 IT.forEach(function(it,k){it.m=mk(.12+it.w*.06,.12+it.w*.04,.2,'#FFD166',.2);it.home=[-2.1,.1+it.w*.02,-.6+k*.42];
  it.m.position.set(it.home[0],it.home[1],it.home[2]);g.add(it.m);
  it.l=lbl(g,it.n+' w'+it.w+' v'+it.v,'#FFD166',-2.1,.45,it.home[2],.9);});
 const bag=new THREE.LineSegments(new THREE.EdgesGeometry(GEO.box),new THREE.LineBasicMaterial({color:0x83C167}));
 bag.scale.set(.9,.6,.9);bag.position.set(1.9,.3,0);g.add(bag);
 const bagL=lbl(g,'bag · capacity 7','#83C167',1.9,.85,0,1.0);
 let cap=7,dp=null,take=[],T=0,best=0;
 function solve(){dp=[];for(let i=0;i<=IT.length;i++){dp.push([]);for(let cc=0;cc<=MAXC;cc++){
   if(i===0||cc>cap){dp[i][cc]=0;continue;}
   const it=IT[i-1];dp[i][cc]=dp[i-1][cc];if(it.w<=cc)dp[i][cc]=Math.max(dp[i][cc],dp[i-1][cc-it.w]+it.v);}}
  take=[];let cc=cap;for(let i=IT.length;i>0;i--){if(dp[i][cc]!==dp[i-1][cc]){take.push(i-1);cc-=IT[i-1].w;}}
  best=dp[IT.length][cap];T=0;relabel(bagL,'bag · capacity '+cap,'#83C167');}
 solve();
 const FILL=(IT.length+1)*(MAXC+1)*.09;
 return {g:g,
  acts:[{label:'Capacity 7',on:function(){return cap===7;},fn:function(){cap=7;solve();}},
        {label:'Capacity 5',on:function(){return cap===5;},fn:function(){cap=5;solve();}},
        {label:'Replay',fn:function(){T=0;}}],
  readout:function(){return 'Each cell answers: <i>best value using the first i items with capacity c</i>. It reads only the row above. '+
   'Best for capacity '+cap+': <b>'+best+'</b> — take '+take.slice().reverse().map(function(k){return '<b>'+IT[k].n+'</b>';}).join(' + ')+'.';},
  up:function(t,dt){T+=dt;const filled=Math.floor(T/.09);
   cells.forEach(function(o,idx){const on=idx<filled&&o.c<=cap;const v=dp[o.i][o.c];
    o.m.visible=o.c<=cap;o.m.scale.y=on?1+v*1.2:1;o.m.position.y=on?.05+v*.03:.05;
    o.m.material.emissiveIntensity=on?.12+v/12:.03;});
   const back=T>FILL+.4;
   /* walk the answer back: chosen items fly into the bag */
   IT.forEach(function(it,k){const chosen=take.indexOf(k)>=0;
    const q=back&&chosen?ease(clamp01((T-FILL-.4)/1.2)):0;
    const slot=take.indexOf(k);
    it.m.position.set(lerp(it.home[0],1.9,q),lerp(it.home[1],.15+slot*.18,q),lerp(it.home[2],0,q));
    it.l.position.set(it.m.position.x,it.m.position.y+.35,it.m.position.z);
    tint(it.m,chosen&&back?'#83C167':'#FFD166',chosen&&back?.5:.2);});
   if(T>FILL+5)T=0;}};}

/* ---- RACE CONDITIONS: two workers, one pizza ------------------------------ */
function rigRaceCond(c){
 const g=new THREE.Group();
 const stock=mk(.5,.5,.5,'#FFD166',.3);stock.position.set(0,.3,-.5);g.add(stock);
 const stockL=lbl(g,'stock = 1','#FFD166',0,.95,-.5,1.2);
 const ghost=mk(.5,.5,.5,'#FF6B5A',.5);ghost.position.set(0,.3,-.5);ghost.material.transparent=true;ghost.material.opacity=.35;ghost.visible=false;g.add(ghost);
 const lock=new THREE.Mesh(GEO.tor,ownNeon('#83C167',.9));lock.scale.setScalar(.6);g.add(lock);
 const W=[{n:'A',x:-1.6,col:'#58C4DD'},{n:'B',x:1.6,col:'#B18FE0'}];
 W.forEach(function(w){w.f=figure(w.col,false);w.f.g.position.set(w.x,0,-.2);w.f.g.rotation.y=w.x<0?Math.PI/2:-Math.PI/2;g.add(w.f.g);
  lbl(g,'worker '+w.n,w.col,w.x,1.55,-.2,1.0);w.t=lbl(g,'','#83C167',w.x,1.85,-.2,1.1);w.t.visible=false;});
 const tiles=[];for(let i=0;i<9;i++){const s=miniLabel('',  '#FFFFFF',1.0);s.visible=false;s.position.set(-2.1+i*.53,.25,.85);g.add(s);tiles.push(s);}
 const F=flyers(g,4);
 const MODES={
  none:{n:'No lock',steps:[['A','read','1'],['B','read','1'],['A','write','0'],['B','write','0']],res:'oversold'},
  mutex:{n:'Mutex',steps:[['A','lock',''],['A','read','1'],['B','wait',''],['A','write','0'],['A','unlock',''],['B','lock',''],['B','read','0'],['B','refuse',''],['B','unlock','']],res:'ok'},
  atomic:{n:'Atomic UPDATE',steps:[['A','update','1 row'],['B','update','0 rows'],['B','refuse','']],res:'ok'},
  optimistic:{n:'Optimistic (version)',steps:[['A','read','1 v1'],['B','read','1 v1'],['A','write','v1→v2 ✓'],['B','write','v1 ✗'],['B','read','0 v2'],['B','refuse','']],res:'ok'}};
 const ORDER=['none','mutex','atomic','optimistic'];
 let mode='none',k=0,T=0,val=1,holder=null,conf={A:0,B:0},refused={A:0,B:0},waited=0,forced=false,line='';
 function reset(){k=0;T=-.6;val=1;holder=null;conf={A:0,B:0};refused={A:0,B:0};waited=0;line='';
  tiles.forEach(function(s){s.visible=false;});ghost.visible=false;W.forEach(function(w){w.t.visible=false;});}
 function doStep(s){
  const w=s[0]==='A'?W[0]:W[1],op=s[1];
  const txt=s[0]+' '+op+(s[2]?' '+s[2]:'');line=txt;
  const tile=tiles[k];relabel(tile,txt,op==='wait'||op==='refuse'||s[2].indexOf('✗')>=0?'#FF7A6B':w.col);tile.visible=true;
  if(op==='read'||op==='write'||op==='update')F.go(op==='read'?'#58C4DD':'#FFD166',[w.x*.8,.9,-.2],[0,.5,-.5],.4);
  if(op==='lock')holder=s[0];if(op==='unlock')holder=null;
  if(op==='wait')waited++;
  if(op==='write'&&s[2]==='0'){conf[s[0]]=1;val=val-1;}
  if(op==='update'&&s[2]==='1 row'){conf[s[0]]=1;val=0;}
  if(op==='write'&&s[2].indexOf('✓')>=0){conf[s[0]]=1;val=0;}
  if(op==='refuse')refused[s[0]]=1;
  W.forEach(function(w2){const n=w2.n;
   if(conf[n]){relabel(w2.t,'✓ confirmed','#83C167');w2.t.visible=true;}
   else if(refused[n]){relabel(w2.t,'sold out','#FFC65C');w2.t.visible=true;}});}
 reset();
 return {g:g,
  acts:ORDER.map(function(m){return {label:MODES[m].n,on:function(){return mode===m;},fn:function(){mode=m;forced=true;reset();}};}),
  readout:function(){const sold=conf.A+conf.B;
   return '<b>'+MODES[mode].n+'</b> · '+(line||'…')+' · confirmed <b>'+sold+'</b> of 1 pizza'+
    (sold>1?' — <b style="color:#FF7A6B">lost update: both wrote 0, one write vanished</b>':'')+
    (waited?' · B waited while A held the lock':'');},
  up:function(t,dt){F.up(dt);T+=dt;
   const M=MODES[mode];
   if(T>1.1&&k<M.steps.length){doStep(M.steps[k]);k++;T=0;}
   if(k>=M.steps.length&&T>3.4){if(!forced)mode=ORDER[(ORDER.indexOf(mode)+1)%ORDER.length];forced=false;reset();}
   const sold=conf.A+conf.B;
   stock.visible=val>0;ghost.visible=sold>1;
   relabel(stockL,sold>1?'stock = 0 · sold 2':'stock = '+Math.max(0,val),sold>1?'#FF7A6B':'#FFD166');
   lock.visible=mode==='mutex';
   const hx=holder==='A'?-1.6:holder==='B'?1.6:0;
   lock.position.set(lerp(lock.position.x,hx,Math.min(1,dt*6)),holder?1.25:.95,holder?-.2:-.5);
   lock.rotation.y=t*1.5;
   W.forEach(function(w){const blocked=mode==='mutex'&&w.n==='B'&&holder==='A'&&k>2;
    w.f.band.material.color.set(blocked?'#FF7A6B':w.col);w.f.band.material.opacity=blocked?.5+Math.abs(Math.sin(t*6))*.5:.8;});}};}

/* ---- TASK QUEUES: arrival, service, and backpressure --------------------- */
function rigBackpressure(c){
 const g=new THREE.Group();
 const prod=mk(.5,.6,.5,'#FFD166',.2);prod.position.set(-2.2,.3,0);g.add(prod);lbl(g,'producer','#FFD166',-2.2,.95,0,.9);
 const belt=box(2.6,.04,.4,lit('#2A3752',.05,.6));belt.position.set(-.5,.04,0);g.add(belt);
 const Q=[];for(let i=0;i<12;i++){const m=mk(.16,.16,.16,'#3FC1A9',.4);m.position.set(.7-i*.2,.14,0);m.visible=false;g.add(m);Q.push(m);}
 const over=lbl(g,'','#FF7A6B',-1.8,.5,.45,1.0);
 const W=[];for(let i=0;i<4;i++){const f=figure('#3FC1A9',true);f.g.position.set(1.5+(i%2)*.55,0,(i<2?-.45:.45));
  f.g.rotation.y=-Math.PI/2;f.g.scale.setScalar(.8);g.add(f.g);W.push({f:f,busy:0});}
 lbl(g,'workers','#3FC1A9',1.8,1.4,0,1.0);
 let lam=1.2,base=1.2,mu=.5,nW=2,bp=false,depth=0,acc=0,throttled=false,T=0;
 return {g:g,
  acts:[{label:'Traffic ×3',on:function(){return base>2;},fn:function(){base=base>2?1.2:3.6;}},
        {label:'Add a worker',fn:function(){nW=Math.min(4,nW+1);}},
        {label:'Remove a worker',fn:function(){nW=Math.max(1,nW-1);}},
        {label:'Backpressure',on:function(){return bp;},fn:function(){bp=!bp;}}],
  readout:function(){const cap=nW*mu,grow=lam>cap+.01;
   return 'Arrivals <b>'+lam.toFixed(1)+'/s</b> · capacity <b>'+cap.toFixed(1)+'/s</b> ('+nW+' workers × '+mu+') · depth <b>'+Math.round(depth)+'</b> — '+
    (grow?'<b style="color:#FF7A6B">arrivals beat service: the queue grows forever</b>':depth>0.5?'draining':'keeping up')+
    (throttled?'<br><b style="color:#FFC65C">Backpressure:</b> the queue is full, so the producer is told to slow down (429) instead of the queue growing.':'');},
  up:function(t,dt){T+=dt;
   const cap=nW*mu;
   throttled=bp&&depth>=6;
   lam=throttled?Math.min(base,cap):base;
   acc+=lam*dt;while(acc>=1){acc-=1;depth+=1;}
   /* each worker takes the head job and holds it for 1/mu seconds */
   W.forEach(function(w,i){w.f.g.visible=i<nW;
    if(i>=nW){w.busy=0;return;}
    if(w.busy>0){w.busy-=dt;if(w.busy<=0)w.busy=0;}
    else if(depth>=1){depth-=1;w.busy=1/mu;}
    w.f.cube.visible=w.busy>0;
    w.f.band.material.opacity=w.busy>0?.95:.3;
    w.f.g.rotation.z=w.busy>0?Math.sin(t*9+i)*.05:0;});
   const n=Math.min(12,Math.floor(depth));
   Q.forEach(function(m,i){m.visible=i<n;});
   relabel(over,depth>12?'+'+Math.floor(depth-12)+' more waiting':'','#FF7A6B');over.visible=depth>12;
   tint(prod,throttled?'#FFC65C':'#FFD166',throttled?.5+Math.abs(Math.sin(t*5))*.4:.2);}};}

/* ---- INDEXES: scan every row, or descend three pages ----------------------- */
function rigIndexLab(c){
 const g=new THREE.Group();
 const LV=[[1,2.05],[3,1.28],[9,.5]],nodes=[];
 LV.forEach(function(L){const row=[];
  for(let i=0;i<L[0];i++){const x=(i-(L[0]-1)/2)*(L[0]===9?.46:L[0]===3?1.5:0);
   const n=slab3(L[0]===9?.34:.62,.34,.18,.05,ownLit(c,.16,.5));n.position.set(x,L[1],0);g.add(n);row.push({m:n,x:x,y:L[1]});}
  nodes.push(row);});
 for(let i=0;i<3;i++){for(let j=0;j<3;j++){const A=nodes[1][i],B=nodes[2][i*3+j];
  const dx=B.x-A.x,dy=B.y-A.y,len=Math.hypot(dx,dy);const e=box(len,.03,.03,ownNeon(c,.22));
  e.position.set((A.x+B.x)/2,(A.y+B.y)/2,0);e.rotation.z=Math.atan2(dy,dx);g.add(e);}
  const A=nodes[0][0],B=nodes[1][i];const dx=B.x-A.x,dy=B.y-A.y,len=Math.hypot(dx,dy);
  const e=box(len,.03,.03,ownNeon(c,.22));e.position.set((A.x+B.x)/2,(A.y+B.y)/2,0);e.rotation.z=Math.atan2(dy,dx);g.add(e);}
 /* the heap: the table itself, unsorted, in front */
 const heap=[];for(let i=0;i<9;i++){const m=mk(.3,.14,.3,'#D99A52',.08);m.position.set(-1.84+i*.46,.1,.9);g.add(m);heap.push(m);}
 lbl(g,'table heap — rows in arrival order','#D99A52',0,.42,.9,1.6);lbl(g,'B-tree index','#9B7BE8',-1.6,2.3,0,1.2);
 const probe=sph(.14,ownNeon('#FFD166',1));g.add(probe);
 const TARGET=4,HEAPT=6;
 let mode='seek',T=0,examined=0;
 return {g:g,
  acts:[{label:'Find order #842 — no index',on:function(){return mode==='scan';},fn:function(){mode='scan';T=0;}},
        {label:'Find order #842 — with index',on:function(){return mode==='seek';},fn:function(){mode='seek';T=0;}},
        {label:'Insert a row',on:function(){return mode==='insert';},fn:function(){mode='insert';T=0;}}],
  readout:function(){
   if(mode==='scan')return 'Full scan: <b>'+examined+'</b> of 9 rows read. For a million-row table that is <b>1,000,000</b> reads for one answer — the work grows with the table.';
   if(mode==='seek')return 'Index seek: <b>'+examined+'</b> pages read (root → branch → leaf → row). For a million rows, about <b>4</b>: the work grows with log n.';
   return 'Every insert writes <b>twice</b>: the row in the heap and its key in the index (and a page may split). Indexes make reads cheap by making writes dearer.';},
  up:function(t,dt){T+=dt;
   nodes.forEach(function(r){r.forEach(function(n){n.m.material.emissiveIntensity=.14;});});
   heap.forEach(function(h){h.material.emissiveIntensity=.08;});
   if(mode==='scan'){const k=Math.min(8,Math.floor(T/.55));examined=k+1;
    probe.position.set(heap[k].position.x,.35,.9);
    for(let i=0;i<=k;i++)heap[i].material.emissiveIntensity=i===HEAPT&&k>=HEAPT?1.2:.5;
    if(T>6.5)T=0;}
   else if(mode==='seek'){const p=clamp01(T/2.6);let px,py;
    if(p<.33){px=0;py=2.05-(p/.33)*.77;examined=1;}
    else if(p<.66){px=nodes[1][1].x*((p-.33)/.33);py=1.28;examined=2;}
    else{const q=(p-.66)/.34,B=nodes[2][TARGET];px=nodes[1][1].x+(B.x-nodes[1][1].x)*q;py=1.28+(B.y-1.28)*q;examined=3;}
    if(T>2.6){px=lerp(nodes[2][TARGET].x,heap[HEAPT].position.x,clamp01((T-2.6)/.7));py=lerp(.5,.35,clamp01((T-2.6)/.7));examined=4;
     heap[HEAPT].material.emissiveIntensity=1.2;}
    probe.position.set(px,py,T>2.6?lerp(0,.9,clamp01((T-2.6)/.7)):0);
    if(p<.33)nodes[0][0].m.material.emissiveIntensity=1.1;else if(p<.66)nodes[1][1].m.material.emissiveIntensity=1.1;else nodes[2][TARGET].m.material.emissiveIntensity=1.2;
    if(T>5)T=0;}
   else{const p=clamp01(T/1.4);probe.position.set(lerp(-2.4,heap[8].position.x,p),.35,.9);
    if(T>1.4){heap[8].material.emissiveIntensity=1.2;nodes[2][2].m.material.emissiveIntensity=1.2;nodes[1][0].m.material.emissiveIntensity=.7;}
    if(T>4)T=0;}}};}

/* ---- TRANSACTIONS: all of it, or none of it ------------------------------ */
function rigTxn(c){
 const g=new THREE.Group();
 const ST=[{n:'debit card'},{n:'create order'},{n:'reserve stock'},{n:'payment confirms'}];
 ST.forEach(function(s,i){s.x=-1.65+i*1.1;s.m=slab3(.8,.8,.3,.08,ownLit(c,.15,.5));s.m.position.set(s.x,0,0);g.add(s.m);
  s.l=lbl(g,s.n,'#E9EDF7',s.x,.75,.45,1.0);});
 const ring=new THREE.Mesh(GEO.tor,ownNeon('#83C167',0));ring.scale.set(5.2,2.2,2);ring.rotation.x=Math.PI/2;ring.position.y=.2;g.add(ring);
 const word=lbl(g,'BEGIN','#FFD166',0,1.3,0,1.6);
 const MODES=[{n:'Commit',k:'commit'},{n:'Payment fails',k:'fail'},{n:'Payment fails — no transaction',k:'none'}];
 let mode=0,T=0,forced=false;
 return {g:g,
  acts:MODES.map(function(m,i){return {label:m.n,on:function(){return mode===i;},fn:function(){mode=i;T=0;forced=true;}};}),
  readout:function(){const k=MODES[mode].k;
   return k==='commit'?'Four writes, one <b>COMMIT</b>: they become visible and durable together.'
    :k==='fail'?'The payment fails after three writes. <b>ROLLBACK</b> undoes them in reverse order — to everyone else, nothing ever happened.'
    :'Each write committed on its own. The payment fails, and the money is taken, the order exists and the stock is held — <b style="color:#FF7A6B">for a payment that never happened.</b>';},
  up:function(t,dt){T+=dt;const k=MODES[mode].k;
   const applied=Math.floor(T/.9);
   const failAt=k==='commit'?99:3;
   let phase='begin';
   if(applied>=4||(applied>=3&&failAt===3))phase=k==='commit'?'commit':k==='fail'?'rollback':'broken';
   const back=phase==='rollback'?Math.max(0,3-Math.floor((T-3.6)/.45)):99;
   ST.forEach(function(s,i){
    let up=i<applied&&i<(failAt===3?3:4);
    if(phase==='rollback'&&i>=back)up=false;
    const failed=i===3&&failAt===3&&applied>=3;
    s.m.position.y=lerp(s.m.position.y,up?.35:0,Math.min(1,dt*8));
    const col=failed?'#FF6B5A':phase==='commit'?'#83C167':phase==='broken'&&up?'#FFC65C':c;
    s.m.material.color.set(col);s.m.material.emissive.set(col);s.m.material.emissiveIntensity=up||failed?.7:.15;});
   ring.material.opacity=phase==='commit'?.8:0;
   relabel(word,phase==='commit'?'COMMIT':phase==='rollback'?'ROLLBACK':phase==='broken'?'INCONSISTENT':k==='none'?'autocommit':'BEGIN',
    phase==='commit'?'#83C167':phase==='rollback'?'#FFC65C':phase==='broken'?'#FF6B5A':'#FFD166');
   if(T>7.2){T=0;if(!forced)mode=(mode+1)%3;forced=false;}}};}

/* ---- CAP: three replicas, then the network splits ------------------------ */
function rigCAP(c){
 const g=new THREE.Group();
 const N=[{n:'A',x:-1.9,z:-.45,side:0},{n:'B',x:-1.9,z:.45,side:0},{n:'C',x:1.9,z:0,side:1}];
 N.forEach(function(n){n.m=mk(.5,.4,.5,c,.2);n.m.position.set(n.x,.2,n.z);g.add(n.m);n.v=1;n.l=lbl(g,n.n+' v1',c,n.x,.7,n.z,1.0);});
 const seg=[];for(let i=0;i<5;i++){const s=mk(.55,.08,.4,c,.2);s.position.set(-1.1+i*.55,.08,0);g.add(s);seg.push(s);}
 const F=flyers(g,10);const B=badges(g,3);
 let part=false,mode='CP',T=0,wT=0,lost=0,msg='Every write is copied to the other replicas across the network.';
 function show(){N.forEach(function(n){relabel(n.l,n.n+' v'+n.v,n.side&&part&&mode==='AP'&&n.v!==N[0].v?'#FFC65C':c);});}
 function write(side){
  const tgt=side?N[2]:N[0];
  if(part&&side===1&&mode==='CP'){B.pop('503 no quorum','#FF7A6B',tgt.x,1.1,tgt.z);return;}
  tgt.v++;show();
  N.forEach(function(o){if(o===tgt)return;
   if(part&&o.side!==tgt.side){return;}
   F.go('#FFFFFF',[tgt.x,.35,tgt.z],[o.x,.35,o.z],o.side===tgt.side?.35:.9,function(){o.v=Math.max(o.v,tgt.v);show();});});}
 function heal(){part=false;
  const a=N[0].v,b=N[2].v,w=Math.max(a,b);
  if(mode==='AP'&&a!==b){lost=Math.abs(a-b);msg='Healed. Last-write-wins kept v'+w+' and <b style="color:#FF7A6B">discarded the other side\'s writes</b>.';}
  else msg='Healed. C catches up from the majority.';
  N.forEach(function(n){n.v=w;});show();}
 return {g:g,
  acts:[{label:'Cut the network',on:function(){return part;},fn:function(){if(part)heal();else{part=true;msg='Partition: C cannot reach A or B.';}}},
        {label:'Choose CP (refuse)',on:function(){return mode==='CP';},fn:function(){mode='CP';}},
        {label:'Choose AP (accept)',on:function(){return mode==='AP';},fn:function(){mode='AP';}}],
  readout:function(){return (part?'<b>Partitioned</b> · '+(mode==='CP'?'CP: C is in the minority and <b>refuses writes</b> — correct, but unavailable.':'AP: both sides <b>accept writes</b> and drift apart — available, but they disagree.'):msg)+
   ' · A v'+N[0].v+' / C v'+N[2].v;},
  up:function(t,dt){F.up(dt);B.up(dt);T+=dt;wT-=dt;
   if(wT<=0){wT=1.3;write(Math.random()<.5?0:1);}
   seg.forEach(function(s,i){const cut=part&&Math.abs(i-2)<1.5;
    s.position.y=lerp(s.position.y,cut?-.5:.08,Math.min(1,dt*5));s.rotation.z=cut?(i-2)*.4:0;tint(s,cut?'#FF6B5A':c,cut?.6:.2);});
   N.forEach(function(n){const iso=part&&n.side===1;tint(n.m,iso&&mode==='CP'?'#FF6B5A':c,iso?.3+Math.abs(Math.sin(t*4))*.3:.2);});}};}


/* which installation belongs to which hall — one idea, one shape */
const RIGS={
 welcome:function(c){return rigCore(c);},
 principles:function(c){return rigDI(c);},
 patterns:function(c){return rigStrategy(c);},
 architecture:function(c){return rigHexagon(c);},
 bigo:function(c){return rigGrowth(c);},
 structures:function(c){return rigStack(c,6);},
 recursion:function(c){return rigArch(c,6);},
 'dp-blueprint':function(c){return rigGrid(c,6,6);},
 'dp-grid':function(c){return rigGrid(c,7,8);},
 'dp-knapsack':function(c){return rigKnapsack(c);},
 rest:function(c){return rigHTTP(c);},
 soap:function(c){return rigEnvelope(c);},
 'rpc-graphql':function(c){return rigGraphQL(c);},
 mcp:function(c){return rigMCP(c);},
 realtime:function(c){return rigRealtime(c);},
 kafka:function(c){return rigKafkaLog(c);},
 rabbitmq:function(c){return rigExchange(c);},
 pubsub:function(c){return rigPubSub(c);},
 delivery:function(c){return rigDelivery(c);},
 tasks:function(c){return rigBackpressure(c);},
 race:function(c){return rigRaceCond(c);},
 retries:function(c){return rigRetry(c);},
 docker:function(c){return rigStack(c,7);},
 orchestration:function(c){return rigReconcile(c);},
 cap:function(c){return rigCAP(c);},
 scaling:function(c){return rigCache(c);},
 database:function(c){return rigPages(c);},
 indexes:function(c){return rigIndexLab(c);},
 transactions:function(c){return rigTxn(c);}
};

/* the one-line thing the museum says when you arrive — it must describe
   what the plinth is actually doing, or it teaches the wrong thing */
const MOMENTS={
 welcome:'You are standing on a <b>spiral</b>. Walk it once and you have walked a career.',
 principles:'OrderService keeps calling. <b>Stripe is pulled out, PayPal plugged in</b> — and nothing inside the caller changes. Now try hard-wiring it.',
 patterns:'Three sizes of input, three sort strategies, <b>one call site</b>. When it finishes, the observers hear about it.',
 architecture:'The domain in the middle; adapters at the rim. <b>Every arrow points inward.</b> Leak SQL into the domain and watch one flip.',
 bigo:'Five lanes, one machine. <b>Change n</b> and watch O(n²) go from seconds to hours.',
 structures:'Top of the stack only. That is the whole contract.',
 recursion:'Each arch holds a smaller copy of itself — until one is small enough to answer.',
 'dp-blueprint':'The wavefront only ever needs the cells behind it.',
 'dp-grid':'Watch it fill diagonally, then walk the answer back.',
 'dp-knapsack':'The table fills one cell at a time, each reading the row above. Then the <b>answer walks out of the table</b> into the bag.',
 rest:'Seven requests, seven status codes, seven <b>physical</b> outcomes. Watch where each one stops.',
 soap:'Wrapped, headed, signed — then checked against the contract. Add a field it does not know.',
 'rpc-graphql':'One gate, exactly the fields you asked for.',
 mcp:'initialize → tools/list → tools/call. The host holds the <b>consent gate</b>.',
 realtime:'The same updates, three ways. Count how many polls came back <b>empty</b>.',
 kafka:'Three partitions, and nothing is ever removed. The two markers are <b>consumer groups</b> — rewind one and it reads everything again.',
 rabbitmq:'Messages arrive, wait, and <b>leave</b>. The exchange decides which queues get a copy; send a poison message and watch it leave to the dead-letter bin.',
 pubsub:'One kitchen bell. Many listeners. Nobody had to call them by name.',
 delivery:'Ack before or after the work? Switch modes and count <b>lost messages</b> against <b>double charges</b>.',
 tasks:'Jobs arrive faster than two workers can finish them. <b>The queue grows forever</b> — until you add a worker, or push back.',
 race:'Two workers, one pizza. <b>Both said yes.</b> Now try a lock.',
 retries:'The provider goes down. Watch naive retries <b>keep it down</b>, then try backoff and a breaker.',
 docker:'Change the bottom slab and everything above it rebuilds.',
 orchestration:'<b>replicas: 3</b>. Kill a pod — the loop notices and replaces it. Nobody is paged.',
 cap:'Three replicas. <b>Cut the network</b>, then choose: refuse, or disagree.',
 scaling:'Fast memory in front of slow truth. Slide from <b>fresh</b> to <b>fast</b> and watch stale answers appear.',
 database:'The row goes to the log first, then the page. That order is the durability.',
 indexes:'Find one order two ways: <b>read every row</b>, or <b>descend three pages</b>.',
 transactions:'Four writes. Make the payment fail — then make it fail <b>without</b> a transaction.'
};

/* ======================================================================
   INSTALLATIONS  —  each hall animates its own idea
   ====================================================================== */
function rigCore(c){                       /* the data core */
 const g=new THREE.Group();
 const core=new THREE.Mesh(new THREE.IcosahedronGeometry(1.15,1),
  new THREE.MeshBasicMaterial({color:c,wireframe:true,transparent:true,opacity:.75}));
 core.position.y=1.5;g.add(core);
 const in2=sph(.5,neon(c,.85));in2.position.y=1.5;g.add(in2);
 g.add((function(){const s=glow(c,5,.42);s.position.y=1.5;return s;})());
 const rings=[];
 for(let i=0;i<3;i++){const r=new THREE.Mesh(GEO.tor,neon(c,.5));
  r.scale.setScalar(2.4+i*.85);r.rotation.x=Math.PI/2+i*.7;r.rotation.z=i*.9;
  r.position.y=1.5;g.add(r);rings.push(r);}
 const P=[];const pg=new THREE.Group();pg.position.y=1.5;g.add(pg);
 for(let i=0;i<14;i++){const p=sph(.075,neon(c,.9));pg.add(p);
  P.push({m:p,r:1.7+Math.random()*1.5,s:.5+Math.random(),o:Math.random()*6.28,t:Math.random()*2-1});}
 return{g:g,up:function(t){core.rotation.y=t*.24;core.rotation.x=t*.13;
  rings.forEach(function(r,i){r.rotation.z=i*.9+t*(.2+i*.12)*(i%2?-1:1);});
  P.forEach(function(p){const A=t*p.s+p.o;
   p.m.position.set(Math.cos(A)*p.r,p.t*.9,Math.sin(A)*p.r);});}};}



function rigStack(c,n){                    /* layers, pushes, pops */
 const g=new THREE.Group(),S=[];
 for(let i=0;i<n;i++){const b=box(2.5-i*.06,.3,1.7-i*.04,ownLit(c,.14,.45));
  b.position.y=.2+i*.36;g.add(b);
  const e=new THREE.LineSegments(new THREE.EdgesGeometry(GEO.box),
   new THREE.LineBasicMaterial({color:c,transparent:true,opacity:.45}));
  e.scale.copy(b.scale);e.position.copy(b.position);g.add(e);
  S.push({b:b,e:e,y:.2+i*.36});}
 return{g:g,up:function(t){const cyc=(t*.45)%(n+2.6);
  S.forEach(function(s,i){
   const d=cyc-(n-1-i);const k=(d>0&&d<1.5)?Math.sin(Math.min(1,d/1.5)*Math.PI):0;
   s.b.position.y=s.y+k*.5;s.e.position.y=s.b.position.y;
   s.b.material.emissiveIntensity=.14+k*1.1;
   s.e.material.opacity=.45+k*.5;});}};}



function rigGrid(c,n,m){                   /* dp tables you can see fill */
 const g=new THREE.Group(),T=[];
 const s=.38;
 for(let i=0;i<n;i++)for(let j=0;j<m;j++){
  const t=box(s*.86,.06,s*.86,ownLit(c,.05,.5));
  t.position.set((j-(m-1)/2)*s,.06,(i-(n-1)/2)*s);g.add(t);
  T.push({m:t,i:i,j:j,d:i+j});}
 const maxd=n+m-2;
 const path=[];let pi=n-1,pj=m-1;
 while(pi>0||pj>0){path.push(pi+'-'+pj);if(pi>0&&(pj===0||((pi*7+pj*3)%3)))pi--;else pj--;}
 path.push('0-0');
 const pset={};path.forEach(function(k){pset[k]=1;});
 return{g:g,up:function(t){const cyc=(t*.55)%(maxd+5);
  T.forEach(function(o){
   let k=0;
   if(cyc<=maxd+1){k=Math.max(0,1-Math.abs(cyc-o.d)*.85);}
   else{const pp=(cyc-maxd-1)/3.4;
    k=pset[o.i+'-'+o.j]?Math.max(0,1-Math.abs(pp*(maxd+1)-(maxd-o.d))*.8):0;}
   o.m.position.y=.06+k*.22;
   o.m.material.emissiveIntensity=.05+k*1.15;});}};}

function rigArch(c,n){                     /* recursion: a room inside the room */
 const g=new THREE.Group(),A=[];
 for(let i=0;i<n;i++){const k=Math.pow(.79,i);
  const fr=new THREE.Group();
  const w=2.5*k,h=2.1*k,th=.1*k+.03;
  const L=box(th,h,th,ownLit(c,.4,.4));L.position.set(-w/2,h/2,0);fr.add(L);
  const R=box(th,h,th,ownLit(c,.4,.4));R.position.set(w/2,h/2,0);fr.add(R);
  const T=box(w+th,th,th,ownLit(c,.4,.4));T.position.set(0,h,0);fr.add(T);
  fr.position.z=-i*.62;g.add(fr);A.push({fr:fr,i:i,parts:[L,R,T]});}
 const ball=sph(.13,neon('#FFFFFF',1));g.add(ball);
 const bg=glow(c,1.3,.6);g.add(bg);
 return{g:g,up:function(t){const cyc=(t*.5)%2;
  const p=cyc<1?cyc:2-cyc;const d=p*(n-1);
  ball.position.set(0,1.0,-d*.62);bg.position.copy(ball.position);
  A.forEach(function(o){const k=Math.max(0,1-Math.abs(d-o.i)*.9);
   o.parts.forEach(function(m){m.material.emissiveIntensity=.25+k*1.2;});});}};}



/* restaurant and data installations: the physical metaphor is the lesson */
function rigGraphQL(c){
 const g=new THREE.Group(),nodes=[];
 const root=box(1.0,.18,1.0,lit(c,.2,.5));root.position.set(-2,.35,0);g.add(root);
 const branches=[{x:-.4,z:-.9},{x:-.4,z:0},{x:-.4,z:.9}];
 branches.forEach(function(b,i){const m=box(.75,.14,.65,lit('#D99A52',.08,.5));m.position.set(b.x,.32,b.z);g.add(m);nodes.push({m:m,i:i});});
 const leaves=[];
 nodes.forEach(function(n,i){for(let j=0;j<3;j++){const l=sph(.1,neon(c,.9));l.position.set(.65,.35,n.m.position.z+(j-1)*.24);g.add(l);leaves.push({m:l,branch:i,j:j});}});
 const query=box(.16,.16,2.6,neon('#FFFFFF',.7));query.position.set(1.4,.45,0);g.add(query);
 return{g:g,up:function(t){
   const phase=(t*.45)%4; const active=Math.floor(phase)%3;
   nodes.forEach(function(n,i){const on=i===active||((Math.floor(t*.45)+1)%3===i);n.m.material=lit(i===active?c:'#D99A52',i===active?.65:.08,.5);});
   leaves.forEach(function(l){const on=l.branch===active && l.j<2; l.m.material=neon(on?c:'#6B7280',on?.95:.18);l.m.scale.setScalar(on?1.35:.8);});
   query.position.z=Math.sin(t*1.3)*.95;
 }};
}
function rigPubSub(c){
 const g=new THREE.Group(),subs=[];
 const pub=box(.65,.9,.65,lit(c,.18,.5));pub.position.x=-2.5;g.add(pub);
 const topic=new THREE.Mesh(new THREE.TorusGeometry(.62,.12,10,28),neon('#FFD166',.9));topic.rotation.x=Math.PI/2;topic.position.x=0;topic.position.y=.8;g.add(topic);
 for(let i=0;i<3;i++){const s=box(.55,.7,.55,lit('#83C167',.1,.5));s.position.set(2.2,.35,(i-1)*1.05);g.add(s);subs.push(s);}
 const msg=sph(.12,neon('#FFFFFF',1));g.add(msg);const mg=glow(c,1.3,.6);g.add(mg);
 return{g:g,up:function(t){const phase=(t*.55)%3.4;let x,z,y=.9;if(phase<1.3){x=-2.5+phase/1.3*2.5;z=0;}else{const q=(phase-1.3)/2.1;const i=Math.min(2,Math.floor(q*3));const local=q*3-i;x=0+2.2*local;z=(i-1)*1.05;y=.85+.15*Math.sin(t*5);}msg.position.set(x,y,z);mg.position.copy(msg.position);mg.material.opacity=.25+.35*Math.abs(Math.sin(t*5));subs.forEach(function(s,i){s.material.emissiveIntensity=.1+(phase>1.3&&Math.floor((phase-1.3)/.7)%3===i?.9:0);});}};
}

/* ---- DATABASE: write-ahead log first, then the page ---- */
function rigPages(c){
 const g=new THREE.Group();
 const shelf=slab3(4.0,1.5,.22,.08,lit(c,.12,.55));shelf.position.set(0,0,-.55);g.add(shelf);
 const pages=[];
 for(let i=0;i<6;i++){const p=slab3(.55,1.15,.30,.06,ownLit(c,.14,.5));
  p.position.set(-1.6+i*.64,.22,-.55);g.add(p);pages.push(p);}
 const wal=slab3(4.0,.42,.14,.05,lit('#FFD166',.3,.5));wal.position.set(0,.02,1.05);g.add(wal);
 const walm=[];
 for(let i=0;i<10;i++){const m=box(.24,.06,.26,ownNeon('#FFD166',.18));
  m.position.set(-1.7+i*.38,.18,1.05);g.add(m);walm.push(m);}
 const row=box(.26,.26,.26,ownNeon('#FFFFFF',1));row.position.set(-2.2,.7,1.05);g.add(row);
 const gl=glow('#FFFFFF',1.3,.6);g.add(gl);
 return{g:g,up:function(t){
  const p=fr(t*.16);
  let x,y,z;
  if(p<.45){x=-2.2+ (p/.45)*3.9;y=.7;z=1.05;}          /* into the log */
  else if(p<.62){x=1.7;y=.7;z=1.05+((p-.45)/.17)*-1.6;} /* then to the page */
  else{const k=Math.floor(fr(t*.16/1)*6);x=-1.6+((Math.floor(t*.16)%6))*.64;y=.62;z=-.55;}
  row.position.set(x,y,z);gl.position.set(x,y,z);
  row.material.opacity=p<.68?1:Math.max(0,1-(p-.68)*6);
  walm.forEach(function(m,i){
   const lit2=p*10>=i;m.material.opacity=lit2?.85:.16;});
  pages.forEach(function(pg,i){
   const on=(Math.floor(t*.16)%6)===i&&p>.62;
   pg.material.emissiveIntensity=on?1.1:.14;
   pg.position.y=.22+(on?.12:0);});}};}



/* which installation belongs to which hall */
/* ----------------------------------------------------------------------
   KAFKA — a log you can walk along
   Not moving dots. A ledger: three partitions of numbered slots, records
   that are APPENDED and never removed, and two consumer groups sitting at
   their own offsets. The whole point is visible here: reading does not
   consume, so one group can be behind the other, and either can rewind.
   ---------------------------------------------------------------------- */
function rigKafkaLog(c){
 const g=new THREE.Group();
 const P=3,SLOTS=16,sw=.23,gap=.035,step=sw+gap;
 const x0=-((SLOTS-1)/2)*step;
 const KEYS=['#58C4DD','#FFD166','#83C167'];      /* record key -> partition */
 const lanes=[];
 for(let p=0;p<P;p++){
  const z=(p-1)*.82;
  const rail=box(SLOTS*step+.18,.035,.58,lit('#2A3752',.04,.75));
  rail.position.set(0,.05,z);g.add(rail);
  const cells=[];
  for(let i=0;i<SLOTS;i++){
   const b=box(sw,.15,.46,ownNeon('#33425F',.22));
   b.position.set(x0+i*step,.145,z);g.add(b);cells.push(b);}
  const tag=textSprite('P'+p,KEYS[p],34,1.5);
  tag.position.set(x0-.55,.3,z);g.add(tag);
  lanes.push({z:z,cells:cells,head:0,col:KEYS[p]});}

 /* two groups, two independent positions — the idea, made physical */
 const GRP=[{id:'billing',col:'#6FD08C',off:[0,0,0],marks:[],rate:1.00},
            {id:'analytics',col:'#B18FE0',off:[0,0,0],marks:[],rate:0.55}];
 GRP.forEach(function(gr,gi){
  for(let p=0;p<P;p++){
   const m=box(.05,.30,.56,ownNeon(gr.col,.95));
   m.position.set(x0,.34,lanes[p].z+(gi?.20:-.20));g.add(m);gr.marks.push(m);}
  const tag=textSprite(gr.id,gr.col,30,1.35);
  tag.position.set(x0+SLOTS*step*.5+.75,.42+gi*.30,0);g.add(tag);});

 /* ownLit, not lit: this one pulses, and lit() hands back a shared material */
 const prod=box(.34,.52,.34,ownLit(c,.28,.45));
 prod.position.set(x0-1.0,.3,0);g.add(prod);

 let clock=0,appended=0,replayIn=13,replays=0;
 return {g:g,
  acts:[{label:'Rewind analytics to offset 0',fn:function(){GRP[1].off=[0,0,0];replayIn=15;replays++;}},
        {label:'Analytics falls behind',on:function(){return GRP[1].rate<.3;},fn:function(){GRP[1].rate=GRP[1].rate<.3?.55:.18;}}],
  readout:function(){const lag=function(gr){let s=0;for(let p=0;p<P;p++)s+=Math.max(0,lanes[p].head-gr.off[p]);return Math.round(s);};
   return 'billing lag <b>'+lag(GRP[0])+'</b> · analytics lag <b>'+lag(GRP[1])+'</b> · replays <b>'+replays+'</b><br>Reading does not remove anything: a consumer is just an <b>offset</b>, and an offset can move backwards.';},
  up:function(t,dt){
  clock+=dt;
  /* append: the key decides the partition, which is what keeps order */
  if(clock>.52){
   clock=0;appended++;
   const p=appended%P,L=lanes[p];
   if(L.head<SLOTS){
    L.cells[L.head].material.color.set(L.col);
    L.cells[L.head].material.opacity=.95;
    L.head++;
   }else{
    /* retention: the window slides, it does not empty */
    for(let i=0;i<SLOTS-1;i++)
     L.cells[i].material.color.copy(L.cells[i+1].material.color);
    L.cells[SLOTS-1].material.color.set(L.col);
    GRP.forEach(function(gr){gr.off[p]=Math.max(0,gr.off[p]-1);});}}
  prod.material.emissiveIntensity=.28+Math.abs(Math.sin(t*3.1))*.5;

  /* each group advances at its own pace and never blocks the other */
  GRP.forEach(function(gr){
   for(let p=0;p<P;p++){
    const L=lanes[p];
    gr.off[p]=Math.min(L.head,gr.off[p]+dt*gr.rate);
    gr.marks[p].position.x=x0+gr.off[p]*step-step*.5;
    gr.marks[p].material.opacity=.55+Math.abs(Math.sin(t*2.6))*.4;}});

  /* Dim = every group has already read it, and it is STILL HERE.
     That is the whole difference from a queue. */
  lanes.forEach(function(L,li){
   const slowest=GRP[1].off[li];
   for(let i=0;i<SLOTS;i++)
    L.cells[i].material.opacity=(i<L.head)?(i<slowest?.38:.92):.16;});

  /* and once in a while, analytics rewinds and reads it all again */
  replayIn-=dt;
  if(replayIn<=0){replayIn=15;GRP[1].off=[0,0,0];replays++;}
 }};}

/* ----------------------------------------------------------------------
   RABBITMQ — a sorting office
   The opposite shape to the log. Messages ARRIVE, WAIT, and LEAVE. The
   exchange decides which queues a message is copied into, queues visibly
   build and drain, and a message that keeps failing is thrown out to the
   dead-letter bin rather than blocking everything behind it.
   ---------------------------------------------------------------------- */
function rigExchange(c){
 const g=new THREE.Group();
 const ex=box(.75,1.0,1.9,ownLit(c,.24,.42));ex.position.set(-1.7,.6,0);g.add(ex);
 const exTag=textSprite('exchange',c,30,1.5);exTag.position.set(-1.7,1.35,0);g.add(exTag);

 const QC=['#58C4DD','#FFD166','#6FD08C'],QN=['order.*','*.eu','audit'];
 const queues=[];
 for(let q=0;q<3;q++){
  const z=(q-1)*.95;
  const chute=box(1.15,.05,.34,lit('#2A3752',.05,.75));
  chute.position.set(-.85,.52,z);g.add(chute);
  const slots=[];
  for(let i=0;i<7;i++){
   const b=box(.19,.24,.38,ownNeon('#33425F',.2));
   b.position.set(.05+i*.25,.64,z);g.add(b);slots.push(b);}
  const tag=textSprite(QN[q],QC[q],28,1.25);
  tag.position.set(2.15,.72,z);g.add(tag);
  queues.push({z:z,slots:slots,depth:0,col:QC[q],drain:.7+q*.35});}

 const dlq=box(.46,.46,.56,ownNeon('#FC6255',.3));
 dlq.position.set(2.0,.24,-1.95);g.add(dlq);
 const dlqTag=textSprite('dead letter','#FC6255',26,1.2);
 dlqTag.position.set(2.0,.66,-1.95);g.add(dlqTag);

 const msg=sph(.11,ownNeon('#FFFFFF',1));g.add(msg);
 let phase=0,route=[0],poison=false,dlqHeat=0,sent=0,wantPoison=false,wantFan=false,dead=0,acked=0;

 return {g:g,
  acts:[{label:'Send a poison message',fn:function(){wantPoison=true;}},
        {label:'Fanout to every queue',fn:function(){wantFan=true;}}],
  readout:function(){return 'queues '+queues.map(function(q,i){return QN[i]+' <b>'+Math.round(q.depth)+'</b>';}).join(' · ')+' · acked <b>'+Math.round(acked)+'</b> · dead letters <b>'+dead+'</b><br>Acknowledged messages are <b>gone</b>. A message that keeps failing goes to the dead-letter queue instead of blocking the ones behind it.';},
  up:function(t,dt){
  phase+=dt*.85;
  if(phase>=2){
   phase=0;sent++;
   /* direct, topic, fanout — the routing rule, rotating */
   route = (wantFan||sent%4===0)?[0,1,2] : (sent%3===0)?[1,2] : [sent%3];
   poison=wantPoison||(sent%7===0);wantPoison=false;wantFan=false;}

  /* producer -> exchange -> the queues the binding matched */
  if(phase<.85){
   const k=phase/.85;
   msg.position.set(-3.1+k*1.4,.72,0);
   msg.material.color.set('#FFFFFF');
  }else{
   const k=Math.min(1,(phase-.85)/.75);
   const z=route.reduce(function(a,q){return a+queues[q].z;},0)/route.length;
   msg.position.set(-1.7+k*1.75,.72,z*k);
   msg.material.color.set(poison?'#FC6255':queues[route[0]].col);
   if(k>=1&&!msg.__landed){
    msg.__landed=1;
    if(poison){dlqHeat=1;dead++;}
    else route.forEach(function(q){
     queues[q].depth=Math.min(7,queues[q].depth+1);});}}
  if(phase<.85)msg.__landed=0;

  ex.material.emissiveIntensity=.24+Math.abs(Math.sin(t*2.4))*.45;

  /* consumers acknowledge, and the message is gone for good */
  queues.forEach(function(q){
   const was=q.depth;q.depth=Math.max(0,q.depth-dt*q.drain);acked+=was-q.depth;
   const n=Math.round(q.depth);
   q.slots.forEach(function(s,i){
    const held=i<n;
    s.material.color.set(held?q.col:'#33425F');
    s.material.opacity=held?(.85+Math.sin(t*3+i)*.1):.14;});});

  dlqHeat=Math.max(0,dlqHeat-dt*.5);
  dlq.material.opacity=.3+dlqHeat*.65;
 }};}


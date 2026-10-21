/* ======================================================================
   THE INSTRUMENT
   Six drawings of one system. Not six diagrams — one topology, painted
   six ways, from the same simulator the museum floor is running on.
   Slice and Follow are modifiers: they work inside every view, because
   the thing being sliced and followed is always the same system.
   ====================================================================== */
const IC={line:'rgba(127,168,255,.42)',grid:'rgba(127,168,255,.07)',
          face:'#0B1322',faint:'#4C5B79',paper:'#070B14'};
const KINDC={person:'#FFD166',client:'#8FA0FF',app:'#6FD08C',data:'#D99A52',
             infra:'#43D9E8',services:'#B18FE0',system:'#8FA0FF',ext:'#7C89A6',
             /* component level reuses the hexagon's own colours */
             domain:'#FFD166',port:'#E9EDF7',adapter:'#6FD08C'};

const IMODES=[
 {id:'blueprint',n:'Blueprint',k:'01',
  cap:'<b>The architectural drawing.</b> Every box is a component that exists on the museum floor, and every line is a dependency you can walk. Boundaries are grouped by <em>layer</em> — the same layers the slice control uses. Click any box to open the hall that explains it.'},
 {id:'system',n:'System',k:'02',
  cap:'<b>The same system at three zoom levels.</b> Start with who uses it and what it talks to, descend to the containers, then into one container’s components. One drawing per level beats one drawing containing everything.'},
 {id:'runtime',n:'Runtime',k:'03',
  cap:'<b>What is happening right now.</b> Each dot is one real request from the simulator, moving at its real measured latency. Box colour is utilisation, not health — watch what saturation does to latency before anything actually errors.'},
 {id:'data',n:'Data flow',k:'04',
  cap:'<b>Where one order lives.</b> Solid boxes keep state; outlined boxes only pass it through. The same order is an HTTP body, then an object, then a row, then an event — follow it and watch it change form without changing meaning.'},
 {id:'failure',n:'Failure',k:'05',
  cap:'<b>What breaks, and what it takes down with it.</b> Red is failed. Amber is collateral — a component that is fine but cannot do its job. Turn on a defence and watch the amber stop spreading.'},
 {id:'body',n:'Body',k:'06',
  cap:'<b>Scaffolding, then discard it.</b> Grouping components by what they do to a body makes an unfamiliar architecture legible in about ten seconds. It is an intuition pump, not a model — every group below has a precise engineering name, and that is the one to keep.'},
 {id:'debug',n:'Debug',k:'07',
  cap:'<b>The museum is frozen.</b> Pick a request on the left and step through it event by event, or drag the timeline to rewind the whole system. Every dot, gauge and log line is read from the same recorded events.'}
];

/* One order, followed through every form it takes. The fact never
   changes; the representation changes at every boundary. This is the
   same order the runtime view is moving around as a dot. */
const ORDER_LIFE=[
 {node:'customer',form:'a decision',    text:'Two margheritas, table 4.'},
 {node:'web',     form:'a JSON body',   text:'{"table":4,"items":[{"sku":"margherita","qty":2}]}'},
 {node:'api',     form:'an HTTP request',text:'POST /orders   Idempotency-Key: 8f14e45f…'},
 {node:'orders',  form:'a domain object',text:'Order(id=None, table=4, lines=[Line("margherita",2)], status=DRAFT)'},
 {node:'db',      form:'a statement',   text:'INSERT INTO orders (table_no, total_cents) VALUES (4, 2400) RETURNING id'},
 {node:'db',      form:'a row',         text:'orders │ id 1842 │ table_no 4 │ status placed │ total_cents 2400'},
 {node:'queue',   form:'a job',         text:'{"task":"send_receipt","order_id":1842}'},
 {node:'broker',  form:'an event',      text:'topic orders · partition 2 · offset 91 — OrderPlaced{order_id:1842}'},
 {node:'worker',  form:'work',          text:'group "notifications" reads offset 91, does the work, commits 92'},
 {node:'notify',  form:'a message',     text:'SMS — “Order #1842 confirmed. About 18 minutes.”'}
];

/* --- geometry ------------------------------------------------------- */
function edgePath(a,b){
 const ac={x:a.x+a.w/2,y:a.y+a.h/2},bc={x:b.x+b.w/2,y:b.y+b.h/2};
 const dx=bc.x-ac.x,dy=bc.y-ac.y;
 if(Math.abs(dx)<34){const y1=dy>0?a.y+a.h:a.y,y2=dy>0?b.y:b.y+b.h;
  return [{x:ac.x,y:y1},{x:bc.x,y:y2}];}
 if(Math.abs(dy)<26){const x1=dx>0?a.x+a.w:a.x,x2=dx>0?b.x:b.x+b.w;
  return [{x:x1,y:ac.y},{x:x2,y:bc.y}];}
 const x1=dx>0?a.x+a.w:a.x,x2=dx>0?b.x:b.x+b.w,mx=(x1+x2)/2;
 return [{x:x1,y:ac.y},{x:mx,y:ac.y},{x:mx,y:bc.y},{x:x2,y:bc.y}];}

function pathLen(p){let L=0;for(let i=1;i<p.length;i++)L+=Math.hypot(p[i].x-p[i-1].x,p[i].y-p[i-1].y);return L;}
function pathAt(p,t){
 const L=pathLen(p);let d=Math.max(0,Math.min(1,t))*L;
 for(let i=1;i<p.length;i++){
  const seg=Math.hypot(p[i].x-p[i-1].x,p[i].y-p[i-1].y);
  if(d<=seg||i===p.length-1){const k=seg?d/seg:0;
   return {x:p[i-1].x+(p[i].x-p[i-1].x)*k,y:p[i-1].y+(p[i].y-p[i-1].y)*k,
           a:Math.atan2(p[i].y-p[i-1].y,p[i].x-p[i-1].x)};}
  d-=seg;}
 return {x:p[0].x,y:p[0].y,a:0};}

function polyline(c,p,r){
 c.beginPath();c.moveTo(p[0].x,p[0].y);
 for(let i=1;i<p.length-1;i++)c.arcTo(p[i].x,p[i].y,p[i+1].x,p[i+1].y,r===undefined?9:r);
 c.lineTo(p[p.length-1].x,p[p.length-1].y);c.stroke();}

function arrow(c,p,col){
 const e=p[p.length-1],b=p[p.length-2]||e;
 const a=Math.atan2(e.y-b.y,e.x-b.x);
 c.fillStyle=col;c.beginPath();
 c.moveTo(e.x,e.y);
 c.lineTo(e.x-Math.cos(a-.42)*9,e.y-Math.sin(a-.42)*9);
 c.lineTo(e.x-Math.cos(a+.42)*9,e.y-Math.sin(a+.42)*9);
 c.closePath();c.fill();}

/* --- the instrument -------------------------------------------------- */
const INST={
 open:false,mode:'blueprint',level:2,focus:null,slice:null,follow:null,
 cv:null,c:null,raf:0,last:0,t:0,W:SYS_W,H:SYS_H,hit:[],picked:null,

 /* which nodes/edges this view is drawing */
 scene:function(){
  if(this.mode==='system'&&this.level===1)
   return {nodes:SYS_CONTEXT,edges:SYS_CONTEXT_EDGES,W:1046,H:552};
  if(this.mode==='system'&&this.level===3&&SYS_COMPONENTS[this.focus]){
   const s=SYS_COMPONENTS[this.focus];
   return {nodes:s.nodes,edges:s.edges,W:1046,H:552,inner:true};}
  return {nodes:SYS_NODES.filter(function(n){return n.stage<=SIM.stage;}),
          edges:SYS_EDGES.filter(function(e){
           if(e.stage&&e.stage>SIM.stage)return false;
           if(e.a==='web'&&e.b==='api'&&SIM.stage>=3)return false;  /* the LB took over */
           return SIM.stage>=(SYS_NODES.filter(function(n){return n.id===e.a;})[0]||{stage:0}).stage;}),
          W:SYS_W,H:SYS_H};},

 /* is this node dimmed by a modifier? */
 dimmed:function(n){
  if(this.follow){
   if(n.id==='customer')return false;        /* the request started with them */
   const hit=this.follow.hops.some(function(h){return h.node===n.id;});
   return !hit;}
  if(this.slice&&n.layer&&n.layer!==this.slice)return true;
  return false;},

 /* failure propagation: who cannot do their job because of who */
 blast:function(){
  const out={};
  SYS_FAILURES.forEach(function(f){if(SIM.fail[f.id])out[f.hits]='down';});
  if(SIM.fail.db&&!SIM.guard.fallback){out.orders='hurt';out.api='hurt';out.web='hurt';}
  if(SIM.fail.cacheOut){out.db='hurt';}
  if(SIM.fail.payment&&!(SIM.guard.breaker||SIM.guard.timeout)){out.orders='hurt';out.api='hurt';}
  if(SIM.fail.worker){out.queue='hurt';out.kitchen='hurt';if(!SIM.guard.dlq)out.broker='hurt';}
  if(SIM.fail.slow){out.api='hurt';out.lb='hurt';out.web='hurt';}
  if(SIM.fail.partition){out.replica='down';out.db='hurt';}
  if(SIM.fail.dup&&!SIM.guard.idem){out.worker='hurt';out.payment='hurt';}
  if(SIM.fail.stale)out.replica='hurt';
  if(SIM.m.queue>500)out.queue='hurt';
  return out;},

 /* ---------------- painting ---------------- */
 draw:function(){
  const c=this.c;if(!c)return;
  const S=this.scene(),W=S.W,H=S.H;
  const dpr=Math.min(window.devicePixelRatio||1,2);
  const rect=this.cv.getBoundingClientRect();
  const cw=Math.max(200,rect.width),ch=Math.max(160,rect.height);
  if(this.cv.width!==Math.round(cw*dpr)||this.cv.height!==Math.round(ch*dpr)){
   this.cv.width=Math.round(cw*dpr);this.cv.height=Math.round(ch*dpr);}
  c.setTransform(dpr,0,0,dpr,0,0);
  c.clearRect(0,0,cw,ch);

  /* fit the drawing into the stage, and remember the transform for hit tests */
  const s=Math.min(cw/W,ch/H);
  const ox=(cw-W*s)/2,oy=(ch-H*s)/2;
  this.tf={s:s,ox:ox,oy:oy};
  c.save();c.translate(ox,oy);c.scale(s,s);

  this.paperGrid(c,W,H);
  const blast=this.mode==='failure'?this.blast():{};
  const self=this;
  const NID={};S.nodes.forEach(function(n){NID[n.id]=n;});

  /* Boundaries: only the slice you asked for, so the sheet never fills
     with overlapping rectangles. Body view tints each node instead. */
  if(this.slice&&this.mode!=='body')this.sliceHull(c,S);
  if(this.mode==='body')this.organTint(c,S);

  /* edges first, so boxes sit on top; labels are deferred to a pass
     after the boxes so a label can never be half-hidden by one. */
  const labels=[];
  S.edges.forEach(function(e){
   const a=NID[e.a],b=NID[e.b];if(!a||!b)return;
   const p=edgePath(a,b);
   const dim=self.dimmed(a)||self.dimmed(b);
   let col=IC.line,wdt=1.3,dash=null;
   if(e.kind==='async'){dash=[7,5];col='rgba(255,209,102,.5)';}
   if(e.kind==='event'){dash=[2,5];col='rgba(177,143,224,.55)';}
   if(e.kind==='repl'){dash=[11,4];col='rgba(217,154,82,.5)';}
   if(self.mode==='data')col=(e.kind==='sync')?'rgba(127,168,255,.34)':col;
   if(self.follow)col=self.followEdge(e)?VC.blue:'rgba(127,168,255,.12)';
   if(self.follow&&self.followEdge(e)){wdt=2.4;dash=null;}
   if(dim&&!self.follow)col='rgba(127,168,255,.11)';
   c.save();c.strokeStyle=col;c.lineWidth=wdt;c.lineCap='round';c.lineJoin='round';
   if(dash)c.setLineDash(dash);
   polyline(c,p);c.setLineDash([]);
   arrow(c,p,col);c.restore();
   if(e.label&&!dim&&s>.44&&!(self.follow&&!self.followEdge(e)))
    labels.push({p:p,txt:e.label,kind:e.kind});});

  /* runtime: real requests, moving at their real latency */
  if(this.mode==='runtime')this.flight(c,NID);
  if(this.mode==='debug')this.flightAt(c,NID,this.tmT===null?SIM.t:this.tmT);

  /* boxes */
  S.nodes.forEach(function(n){self.box(c,n,S,blast);});

  /* labels last, and only where they actually fit */
  this.edgeLabels(c,labels,S.nodes);

  if(this.mode==='blueprint')this.titleBlock(c,W,H);
  c.restore();},

 /* A label is only drawn if a clear spot exists on its own line. No
    label is better than a label sitting on top of a component. */
 edgeLabels:function(c,labels,nodes){
  const placed=[];
  c.font=FM(500,10);
  labels.forEach(function(L){
   const m=c.measureText(L.txt).width,hw=m/2+5,hh=9;
   const tries=[.5,.36,.64,.26,.74];
   for(let i=0;i<tries.length;i++){
    const pt=pathAt(L.p,tries[i]);
    const box={x:pt.x-hw,y:pt.y-hh,w:hw*2,h:hh*2};
    let clash=false;
    for(let j=0;j<nodes.length&&!clash;j++){const n=nodes[j];
     if(box.x<n.x+n.w+3&&box.x+box.w>n.x-3&&box.y<n.y+n.h+3&&box.y+box.h>n.y-3)clash=true;}
    for(let j=0;j<placed.length&&!clash;j++){const q=placed[j];
     if(box.x<q.x+q.w&&box.x+box.w>q.x&&box.y<q.y+q.h&&box.y+box.h>q.y)clash=true;}
    if(clash)continue;
    placed.push(box);
    c.save();
    c.fillStyle=IC.paper;rr(c,box.x,box.y,box.w,box.h,4);c.fill();
    T(c,L.txt,pt.x,pt.y,FM(500,10),L.kind==='event'?'#9C7FD0':IC.faint,'center','middle');
    c.restore();
    return;}});},

 /* the one boundary worth drawing: the layer you sliced to */
 sliceHull:function(c,S){
  const self=this;
  const ns=S.nodes.filter(function(n){return n.layer===self.slice;});
  if(!ns.length)return;
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  ns.forEach(function(n){x0=Math.min(x0,n.x);y0=Math.min(y0,n.y);
   x1=Math.max(x1,n.x+n.w);y1=Math.max(y1,n.y+n.h);});
  x0-=15;y0-=26;x1+=15;y1+=15;
  const l=SYS_LAYERS.filter(function(x){return x.id===self.slice;})[0];
  c.save();c.setLineDash([4,4]);c.strokeStyle='rgba(143,160,255,.38)';c.lineWidth=1.2;
  rr(c,x0,y0,x1-x0,y1-y0,10);c.stroke();c.setLineDash([]);
  T(c,(l?l.name:self.slice).toUpperCase(),x0+11,y0+12,FM(600,9.5),'#8FA0FF','left','middle');
  c.restore();},

 /* body view: tint each node by organ, and say so in a legend */
 organTint:function(c,S){
  const ORG={skeleton:'#8FA0FF',circulation:'#FF7A6B',nerves:'#B18FE0',memory:'#D99A52',
             muscle:'#6FD08C',immune:'#43D9E8',reflex:'#FFD166',brain:'#E86FA3'};
  c.save();
  S.nodes.forEach(function(n){
   const col=ORG[n.body];if(!col)return;
   c.globalAlpha=.13;c.fillStyle=col;
   rr(c,n.x-7,n.y-7,n.w+14,n.h+14,13);c.fill();});
  c.globalAlpha=1;
  /* legend, in the empty bottom-left quarter of the sheet */
  let y=402;
  T(c,'READ THE ARCHITECTURE AS A BODY',34,y,FM(600,9.5),'#8FA0FF','left','middle');
  Object.keys(ORG).forEach(function(k,i){
   const b=SYS_BODY[k];if(!b)return;
   const yy=y+20+i*17;
   c.fillStyle=ORG[k];c.beginPath();c.arc(39,yy,4,0,6.3);c.fill();
   T(c,b.name,50,yy,FS(600,10.5),'#D6E2F6','left','middle');
   T(c,b.note,138,yy,FS(400,10),IC.faint,'left','middle');});
  c.restore();},

 paperGrid:function(c,W,H){
  c.save();c.fillStyle=IC.paper;c.fillRect(0,0,W,H);
  c.strokeStyle=IC.grid;c.lineWidth=1;
  for(let x=0;x<=W;x+=38){c.beginPath();c.moveTo(x,0);c.lineTo(x,H);c.stroke();}
  for(let y=0;y<=H;y+=38){c.beginPath();c.moveTo(0,y);c.lineTo(W,y);c.stroke();}
  c.strokeStyle='rgba(127,168,255,.18)';c.lineWidth=1;
  c.strokeRect(14.5,14.5,W-29,H-29);
  c.restore();},

 box:function(c,n,S,blast){
  const dim=this.dimmed(n);
  const col=KINDC[n.kind]||VC.blue;
  const live=SIM.live(n.id);
  const st=blast[n.id];
  let ring=col,fill=IC.face,alpha=dim?.24:1;

  if(this.mode==='runtime'){
   const load=this.loadOf(n.id);
   ring=load>.85?'#FF7A6B':load>.6?'#FFC65C':col;}
  if(this.mode==='failure'){
   if(st==='down'){ring='#FF7A6B';fill='#1C0E10';}
   else if(st==='hurt'){ring='#FFC65C';fill='#191308';}
   else ring='rgba(127,168,255,.3)';}
  if(this.mode==='data'){
   const keeps=(n.id==='db'||n.id==='replica'||n.id==='cache'||n.id==='broker'||n.id==='search');
   ring=keeps?'#D99A52':'rgba(127,168,255,.28)';
   if(keeps)fill='#160F07';}
  if(this.follow&&!dim)ring=VC.blue;
  if(this.picked===n.id)ring='#fff';

  c.save();c.globalAlpha=alpha;
  c.fillStyle=fill;rr(c,n.x,n.y,n.w,n.h,9);c.fill();
  c.strokeStyle=ring;c.lineWidth=this.picked===n.id?2.2:1.4;
  rr(c,n.x,n.y,n.w,n.h,9);c.stroke();

  /* kind bar down the left edge — the legend you never have to read */
  c.fillStyle=col;rr(c,n.x,n.y+8,2.5,n.h-16,2);c.fill();

  const cx=n.x+n.w/2;
  const two=!!n.sub;
  T(c,n.label,cx,n.y+(two?n.h/2-8:n.h/2),FS(600,13),dim?IC.faint:'#EAF1FF','center','middle');
  if(two)T(c,n.sub,cx,n.y+n.h/2+10,FM(400,9.5),dim?'rgba(76,91,121,.7)':IC.faint,'center','middle');

  /* live readouts, only where they teach something */
  if(this.mode==='runtime'){
   const r=this.readout(n.id);
   if(r)T(c,r,n.x+n.w-7,n.y+9,FM(600,9),'#9FB4D8','right','middle');
   if(n.id==='queue'){
    const d=Math.min(1,SIM.m.queue/800);
    c.fillStyle='rgba(255,122,107,.2)';rr(c,n.x+2,n.y+n.h-5,(n.w-4)*d,3,2);c.fill();}}
  if(this.mode==='blueprint'){
   const idx=SYS_NODES.indexOf(n);
   if(idx>=0)T(c,'A-'+String(idx+1).padStart(2,'0'),n.x+7,n.y+9,FM(500,8.5),'rgba(76,91,121,.85)','left','middle');}
  if(this.mode==='debug'&&this.dbg){const s=this.dbg.steps[this.dbg.i];
   if(s&&s.node===n.id){const pulse=.5+.5*Math.sin(performance.now()/160);
    c.strokeStyle='rgba(255,255,255,'+(.45+pulse*.5)+')';c.lineWidth=2.4;rr(c,n.x-5,n.y-5,n.w+10,n.h+10,12);c.stroke();
    const tagTxt=s.type.toLowerCase().replace(/_/g,' ')+(s.sync?' · '+s.ms+'ms':'');
    c.font=FM(600,10);const tw=c.measureText(tagTxt).width+14;
    c.fillStyle='#fff';rr(c,n.x+n.w/2-tw/2,n.y-24,tw,17,8);c.fill();
    T(c,tagTxt,n.x+n.w/2,n.y-15.5,FM(600,10),'#061018','center','middle');}}
  if(this.mode==='failure'&&st==='down'){
   c.strokeStyle='#FF7A6B';c.lineWidth=1.6;
   c.beginPath();c.moveTo(n.x+8,n.y+8);c.lineTo(n.x+n.w-8,n.y+n.h-8);
   c.moveTo(n.x+n.w-8,n.y+8);c.lineTo(n.x+8,n.y+n.h-8);c.stroke();}
  if(!live&&this.mode!=='system'){
   c.setLineDash([3,3]);c.strokeStyle='rgba(127,168,255,.2)';c.lineWidth=1;
   rr(c,n.x,n.y,n.w,n.h,9);c.stroke();c.setLineDash([]);}
  c.restore();},

 loadOf:function(id){
  const m=SIM.m;
  if(id==='api'||id==='lb'||id==='web')return m.apiLoad;
  if(id==='db'||id==='replica')return m.dbLoad;
  if(id==='worker'||id==='kitchen')return Math.min(1,m.workerLoad);
  if(id==='queue')return Math.min(1,m.queue/800);
  if(id==='cache')return 1-m.hit;
  return .2;},

 readout:function(id){
  const m=SIM.m;
  if(id==='api')return Math.round(m.apiLoad*100)+'%';
  if(id==='db')return Math.round(m.dbLoad*100)+'%';
  if(id==='cache')return Math.round(m.hit*100)+'% hit';
  if(id==='queue')return fmtN(Math.round(m.queue));
  if(id==='worker')return SIM.knobs.workers+'×';
  if(id==='broker')return 'lag '+fmtN(Math.round(m.lag));
  return '';},

 followEdge:function(e){
  if(!this.follow)return false;
  const h=this.follow.hops;
  for(let i=0;i<h.length-1;i++)
   if(h[i].node===e.a&&h[i+1].node===e.b)return true;
  return false;},

 /* live requests as dots, at their measured speed */
 flight:function(c,NID){
  const self=this;
  SIM.reqs.forEach(function(q){
   if(q.done)return;
   let acc=0,i=0;
   for(;i<q.hops.length;i++){if(q.t<acc+q.hops[i].ms)break;acc+=q.hops[i].ms;}
   if(i>=q.hops.length-1)return;
   const a=NID[q.hops[i].node],b=NID[q.hops[i+1].node];
   if(!a||!b)return;
   if(self.slice&&(self.dimmed(a)||self.dimmed(b)))return;
   const k=q.hops[i].ms?(q.t-acc)/q.hops[i].ms:0;
   const p=edgePath(a,b),pt=pathAt(p,Math.max(0,Math.min(1,k)));
   const bad=q.status>=400;
   c.save();
   c.fillStyle=bad?'#FF7A6B':(q.hit?'#6FD08C':VC.blue);
   c.globalAlpha=.9;
   c.beginPath();c.arc(pt.x,pt.y,4.2,0,6.3);c.fill();
   c.globalAlpha=.22;c.beginPath();c.arc(pt.x,pt.y,9,0,6.3);c.fill();
   c.restore();});},

 titleBlock:function(c,W,H){
  const w=232,h=66,x=26,y=H-h-24;   /* bottom-left: the only empty corner */
  c.save();c.fillStyle='rgba(7,11,20,.94)';rr(c,x,y,w,h,6);c.fill();
  c.strokeStyle='rgba(127,168,255,.3)';c.lineWidth=1;rr(c,x,y,w,h,6);c.stroke();
  c.beginPath();c.moveTo(x,y+26);c.lineTo(x+w,y+26);c.stroke();
  T(c,'THE SOFTWARE RESTAURANT',x+10,y+13,FM(600,9.5),'#D6E2F6','left','middle');
  T(c,'CONTAINER DIAGRAM',x+10,y+38,FM(500,8.5),IC.faint,'left','middle');
  T(c,'SHEET 01 / REV D',x+10,y+53,FM(500,8.5),IC.faint,'left','middle');
  T(c,'STAGE '+SIM.stage,x+w-10,y+38,FM(600,9),VC.blue,'right','middle');
  T(c,SYS_NODES.filter(function(n){return n.stage<=SIM.stage;}).length+' COMPONENTS',
    x+w-10,y+53,FM(500,8.5),IC.faint,'right','middle');
  c.restore();},

 /* ---------------- panels ---------------- */
 gauges:function(){
  const k=SIM.knobs;
  /* in the time machine, the control room shows the past, not the present */
  const m=(this.mode==='debug'&&this.tmT!==null)?SIM.snapAt(this.tmT):SIM.m;
  /* Not enough samples is not the same as zero. Say so, the way a real
     dashboard has to. */
  const warm=SIM.win.length>=12;
  const g=[
   ['req / s',Math.round(m.rps),'',Math.min(1,m.rps/300),m.rps>240?2:m.rps>140?1:0],
   ['p95',warm?Math.round(m.p95):'—','ms',Math.min(1,m.p95/1500),warm?(m.p95>900?2:m.p95>400?1:0):0],
   ['errors',warm?(m.err*100).toFixed(1):'—','%',Math.min(1,m.err*4),warm?(m.err>.05?2:m.err>.01?1:0):0],
   ['cache hit',warm?Math.round(m.hit*100):'—','%',m.hit,warm?(m.hit<.3?2:m.hit<.6?1:0):0],
   ['api load',Math.round(m.apiLoad*100),'%',Math.min(1,m.apiLoad),m.apiLoad>.85?2:m.apiLoad>.65?1:0],
   ['db load',Math.round(m.dbLoad*100),'%',Math.min(1,m.dbLoad),m.dbLoad>.85?2:m.dbLoad>.65?1:0],
   ['queue',fmtN(Math.round(m.queue)),'jobs',Math.min(1,m.queue/800),m.queue>400?2:m.queue>80?1:0],
   ['event lag',fmtN(Math.round(m.lag)),'',Math.min(1,m.lag/400),m.lag>200?2:m.lag>40?1:0],
   ['double charges',fmtN(Math.round(m.dupes||0)),'',Math.min(1,(m.dupes||0)/400),
    m.dupRate>0?2:(m.dupes>0?1:0)],
   ['health',Math.round((m.health||0)*100),'%',m.health||0,m.health<.4?2:m.health<.75?1:0]];
  let h='';
  g.forEach(function(x){
   h+='<div class="g'+(x[4]===2?' bad':x[4]===1?' warn':'')+'"><u>'+x[0]+'</u><b>'+x[1]+
      (x[2]?'<s>'+x[2]+'</s>':'')+'</b><i style="width:'+Math.round(x[3]*100)+'%"></i></div>';});
  $('instGauges').innerHTML=h;},

 buildPanels:function(){
  const self=this;
  /* modes */
  $('instModes').innerHTML=IMODES.map(function(m){
   return '<button class="imode'+(m.id===self.mode?' on':'')+'" data-m="'+m.id+'"><i>'+m.k+'</i>'+m.n+'</button>';
  }).join('');
  Array.prototype.forEach.call($('instModes').children,function(b){
   b.addEventListener('click',function(){self.setMode(b.getAttribute('data-m'));});});

  $('instTM').classList.toggle('on',self.mode==='debug');
  /* slice */
  $('instSlice').innerHTML='<button data-l="" class="'+(self.slice?'':'on')+'"><b>Whole system</b><span>everything at once</span></button>'+
   SYS_LAYERS.map(function(l){
    return '<button data-l="'+l.id+'" class="'+(self.slice===l.id?'on':'')+'"><b>'+l.name+'</b><span>'+l.note+'</span></button>';
   }).join('');
  Array.prototype.forEach.call($('instSlice').children,function(b){
   b.addEventListener('click',function(){
    self.slice=b.getAttribute('data-l')||null;self.buildPanels();self.caption();});});

  /* knobs */
  const k=SIM.knobs;
  $('instKnobs').innerHTML=
   self.slider('traffic','Traffic',5,400,k.traffic,'req/s')+
   self.slider('workers','Workers',0,10,k.workers,'')+
   self.slider('api','API instances',1,6,k.api,'')+
   self.slider('replicas','Read replicas',0,4,k.replicas,'')+
   self.slider('shards','Shards',1,4,k.shards||1,'')+
   '<div class="togs">'+
    self.tog('cache','Cache',k.cache)+self.tog('index','Index',k.index)+
    self.tog('async','Async work',k.async)+'</div>';
  Array.prototype.forEach.call($('instKnobs').querySelectorAll('input[type=range]'),function(r){
   r.addEventListener('input',function(){
    SIM.knobs[r.getAttribute('data-k')]=+r.value;
    r.parentNode.querySelector('label b').textContent=r.value;
    self.gauges();});});
  Array.prototype.forEach.call($('instKnobs').querySelectorAll('.tog'),function(b){
   b.addEventListener('click',function(){
    const kk=b.getAttribute('data-k');SIM.knobs[kk]=!SIM.knobs[kk];
    b.classList.toggle('on',!!SIM.knobs[kk]);self.caption();});});

  /* failures + guards */
  $('instFails').innerHTML=SYS_FAILURES.map(function(f){
   return '<button class="tog bad'+(SIM.fail[f.id]?' on':'')+'" data-f="'+f.id+'" title="'+f.note+'">'+f.label+'</button>';
  }).join('');
  Array.prototype.forEach.call($('instFails').children,function(b){
   b.addEventListener('click',function(){
    const id=b.getAttribute('data-f');SIM.fail[id]=!SIM.fail[id];
    b.classList.toggle('on',!!SIM.fail[id]);SIM.reset();
    const f=SYS_FAILURES.filter(function(x){return x.id===id;})[0];
    if(SIM.fail[id]){self.setMode('failure');self.say('<b>'+f.label+'.</b> '+f.note+
      ' Amber components are not broken — they simply cannot do their job. Now turn on a defence below.');}
    else self.caption();});});

  $('instGuards').innerHTML=SYS_GUARDS.map(function(g){
   return '<button class="tog'+(SIM.guard[g.id]?' on':'')+'" data-g="'+g.id+'" title="'+g.note+'">'+g.label+'</button>';
  }).join('');
  Array.prototype.forEach.call($('instGuards').children,function(b){
   b.addEventListener('click',function(){
    const id=b.getAttribute('data-g');SIM.guard[id]=!SIM.guard[id];
    b.classList.toggle('on',!!SIM.guard[id]);SIM.reset();
    const g=SYS_GUARDS.filter(function(x){return x.id===id;})[0];
    if(SIM.guard[id])self.say('<b>'+g.label+'.</b> '+g.note+
      ' <em>Watch what it costs as well as what it fixes.</em>');
    else self.caption();});});

  /* incidents */
  $('instInc').innerHTML=SYS_INCIDENTS.map(function(i){
   return '<button data-i="'+i.id+'"><b>'+i.name+'</b><span>'+i.brief+'</span></button>';}).join('');
  Array.prototype.forEach.call($('instInc').children,function(b){
   b.addEventListener('click',function(){
    const inc=SIM.applyIncident(b.getAttribute('data-i'));
    if(!inc)return;
    self.buildPanels();self.setMode('runtime');
    self.say('<b>'+inc.name+'.</b> '+inc.teach+
     ' <em>Read the control room, find the component that gave way, then defend it.</em>');});});},

 slider:function(k,label,lo,hi,v,unit){
  return '<div class="knob-row"><label>'+label+(unit?' <s style="opacity:.6">'+unit+'</s>':'')+
   ' <b>'+v+'</b></label><input type="range" data-k="'+k+'" min="'+lo+'" max="'+hi+'" value="'+v+'"></div>';},
 tog:function(k,label,on){
  return '<button class="tog'+(on?' on':'')+'" data-k="'+k+'">'+label+'</button>';},

 /* ---------------- trace / follow ---------------- */
 tracePanel:function(){
  if(this.mode==='debug'){this.debugPanel();return;}
  const q=this.follow;
  if(!q){$('instTrace').innerHTML='<div class="inote">Nothing selected. <b>Follow a request</b> takes one live request and shows every hop it made with the time each took. <b>Follow an order</b> takes one piece of data and shows every shape it turns into.</div>';return;}
  if(q.data){
   let d='<div class="inote" style="margin:0 0 9px"><b>'+q.id+'</b> · the same fact, ten times</div>';
   q.hops.forEach(function(x){
    const n=SIM.node(x.node)||{label:x.node};
    d+='<div class="dform"><u>'+n.label+'</u><b>'+x.note+'</b><code>'+
       esc(x.text)+'</code></div>';});
   $('instTrace').innerHTML=d;return;}
  const max=Math.max.apply(null,q.hops.map(function(h){return h.ms;}))||1;
  let h='<div class="inote" style="margin:0 0 9px"><b>'+q.id+'</b> → order '+q.order+
        ' · <b>'+q.status+'</b> · '+Math.round(q.ms)+'ms total'+
        (q.note?' · <em>'+q.note+'</em>':'')+'</div>';
  q.hops.forEach(function(x){
   const n=SIM.node(x.node)||{label:x.node};
   const slow=x.ms>=max*.55&&x.ms>40;
   h+='<div class="tr'+(slow?' slow':'')+(x.note==='HIT'?' hit':'')+'">'+
      '<u>'+n.label+'</u><div class="bar" style="width:'+Math.max(3,Math.round(x.ms/max*100))+'%"></div>'+
      '<s>'+Math.round(x.ms)+'ms</s></div>';
   if(x.note)h+='<div class="tr"><u></u><s style="text-align:left;color:#6FD08C">'+x.note+'</s><s></s></div>';});
  $('instTrace').innerHTML=h;},

 /* the same highlighting, but the panel shows form instead of time */
 followData:function(){
  const live=ORDER_LIFE.filter(function(s){return SIM.live(s.node);});
  this.follow={id:'Order #1842',order:'#1842',data:true,
   hops:live.map(function(s){return {node:s.node,ms:0,note:s.form,text:s.text};}),
   ms:0,status:201,note:'one order, ten shapes'};
  this.setMode('data');
  this.tracePanel();
  $('instFollow').textContent='Clear the trace';
  this.say('<b>Order #1842.</b> The same fact, rewritten at every boundary it crosses — '+
   'a body, an object, a statement, a row, a job, an event, a message. '+
   '<em>None of those conversions is free, and every one of them is a place a bug can live.</em>');},

 followOne:function(){
  const q=SIM.sample();
  this.follow={id:q.id,order:q.order,hops:q.hops.slice(),ms:q.ms,status:q.status,note:q.note};
  this.tracePanel();
  const slow=this.follow.hops.slice().sort(function(a,b){return b.ms-a.ms;})[0];
  this.say('<b>'+this.follow.id+'.</b> Everything not on its path has faded. The trace on the left is the same request as a waterfall — '+
   'the widest bar is <em>'+(SIM.node(slow.node)||{}).label+'</em> at '+Math.round(slow.ms)+'ms. '+
   'That is how you find a slow system: not by guessing, by measuring each hop.');
  $('instFollow').textContent='Clear the trace';},

 clearFollow:function(){this.follow=null;this.tracePanel();this.caption();
  $('instFollow').textContent='Follow a request';
  $('instFollowData').textContent='Follow an order';},

 /* ---------------- captions ---------------- */
 say:function(html){$('instCap').innerHTML=html;},
 caption:function(){
  if(this.mode==='debug'&&this.dbg){this.debugDetail();return;}
  const m=IMODES.filter(function(x){return x.id===this.mode;}.bind(this))[0];
  let h=m?m.cap:'';
  if(this.mode==='system'){
   h+=' <em>Level '+this.level+' of 3.</em>';
   if(this.level===2)h+=' Click Order service, Database or Queue to go deeper.';
   if(this.level===3)h+=' Click anywhere on the sheet to come back up.';}
  if(this.slice){
   const l=SYS_LAYERS.filter(function(x){return x.id===this.slice;}.bind(this))[0];
   if(l)h+=' <em>Sliced to '+l.name+'.</em> '+l.note;}
  this.say(h);},

 setMode:function(id){
  if(id==='system'&&this.mode==='system')this.level=this.level===1?2:1;
  else if(id==='system')this.level=1;
  const was=this.mode;
  if(was==='debug'&&id!=='debug')this.debugLeave();
  this.mode=id;
  if(id==='debug'&&was!=='debug')this.debugEnter();
  this.buildPanels();this.tracePanel();this.caption();},

 /* ---------------- interaction ---------------- */
 pick:function(ev){
  const r=this.cv.getBoundingClientRect(),tf=this.tf;if(!tf)return;
  const x=((ev.clientX-r.left)-tf.ox)/tf.s,y=((ev.clientY-r.top)-tf.oy)/tf.s;
  const S=this.scene();
  let hit=null;
  S.nodes.forEach(function(n){
   if(x>=n.x&&x<=n.x+n.w&&y>=n.y&&y<=n.y+n.h)hit=n;});

  if(this.mode==='debug'&&this.dbg&&hit){
   let k=-1;for(let i=0;i<this.dbg.steps.length;i++)if(this.dbg.steps[i].node===hit.id){k=i;break;}
   if(k>=0){this.goStep(k);return;}
   this.say('<b>'+hit.label+'</b> is not on this request’s path. <em>Pick another request on the left.</em>');return;}
  if(this.mode==='system'&&this.level===3){this.level=2;this.focus=null;this.caption();return;}
  if(!hit){this.picked=null;this.caption();return;}
  this.picked=hit.id;

  if(this.mode==='system'&&this.level===1&&hit.id==='system'){this.level=2;this.caption();return;}
  if(this.mode==='system'&&this.level===2&&SYS_COMPONENTS[hit.id]){
   this.level=3;this.focus=hit.id;
   const s=SYS_COMPONENTS[hit.id];
   this.say('<b>'+s.title+' — component level.</b> '+s.note+' Click a component to open its hall, or click the sheet to come back up.');
   return;}

  const cid=hit.concept||(SIM.node(hit.id)||{}).concept;
  const e=cid?BYID[cid]:null;
  if(!e){this.caption();return;}
  const halls=GRAPH.forNode(hit.id);
  let h='<b>'+(hit.label||hit.id)+'.</b> '+(e.question||'')+' ';
  if(halls.length>1){
   h+='Explained in '+halls.length+' halls: ';
   h+=halls.map(function(x){return '<em>'+x.title+'</em>';}).join(', ')+'. ';}
  h+='Opening <em>'+e.title+'</em>…';
  this.say(h);
  setTimeout(function(){INST.close();openExhibit(cid);},260);},

 /* ---------------- the system debugger + time machine ----------------
    Debug mode freezes the museum. The simulator stops; the restaurant
    floor stops with it, because it runs on the simulator's clock. Then
    one request can be stepped through event by event, and the whole
    system can be scrubbed back through the last minute — requests in
    flight, gauges, the log — all read from the same recorded events. */
 dbg:null,tmT:null,
 ASYNC:{WORK_STARTED:1,WORK_COMPLETED:1,EVENT_APPENDED:1,EVENT_CONSUMED:1,DUPLICATE:1,DUPLICATE_IGNORED:1},
 debugEnter:function(){
  SIM.paused=true;if(typeof updateSimBtn==='function')updateSimBtn();
  this.tmT=SIM.t;
  if(!this.dbg||!this.dbg.req)this.pickReq('latest',true);
  else this.goStep(this.dbg.i);},
 debugLeave:function(){
  SIM.paused=!!SIM.userPaused;if(typeof updateSimBtn==='function')updateSimBtn();
  this.tmT=null;if(this.follow&&this.follow.dbg)this.follow=null;},
 finished:function(){const T=SIM.t,M=SIM.MS_PER_S;
  return SIM.archive.filter(function(r){return (T-r.born)*M>=r.ms;});},
 pickReq:function(kind,quiet){
  const A=this.finished();let r=null;
  const bad=function(x){return x.status>=500||x.status===429;};
  const has=function(x,t){return x.hops.some(function(h){return h.type===t;});};
  const last=function(f){for(let i=A.length-1;i>=0;i--)if(f(A[i]))return A[i];return null;};
  if(kind==='latest')r=A[A.length-1]||null;
  else if(kind==='slowest')r=A.reduce(function(b,x){return !b||x.ms>b.ms?x:b;},null);
  else if(kind==='failed')r=last(bad);
  else if(kind==='client')r=last(function(x){return x.status>=400&&x.status<500&&x.status!==429;});
  else if(kind==='miss')r=last(function(x){return has(x,'CACHE_MISS');});
  else if(kind==='async')r=last(function(x){return has(x,'MESSAGE_PUBLISHED');});
  if(!r){if(!quiet)this.say('<b>Nothing like that in the last minute.</b> Break something on the right (or turn traffic up), press <em>▶ live</em> for a few seconds, then freeze again.');
   this.debugPanel();return;}
  this.dbg={req:r,steps:this.stepsFor(r),i:0,kind:kind};
  this.follow={id:r.id,order:r.order,hops:r.hops,ms:r.ms,status:r.status,note:r.note,dbg:true};
  this.goStep(0);},
 stepsFor:function(r){const M=SIM.MS_PER_S,self=this;
  const out=r.ev.map(function(e){return {t:r.born+e.at/M,type:e.type,node:e.node,ms:e.ms,at:e.at,note:e.note,sync:true};});
  BUS.log.forEach(function(e){if(e.trace===r.trace&&self.ASYNC[e.type])
   out.push({t:e.t,type:e.type,node:e.node,ms:0,at:(e.t-r.born)*M,note:e.dup?'redelivered':'',sync:false});});
  return out.sort(function(a,b){return a.t-b.t;});},
 goStep:function(i){const d=this.dbg;if(!d)return;
  d.i=Math.max(0,Math.min(d.steps.length-1,i));
  const s=d.steps[d.i];this.tmT=s.t+1e-6;this.picked=s.node;
  this.debugPanel();this.debugDetail();},
 step:function(k){if(this.dbg)this.goStep(this.dbg.i+k);},
 dataAt:function(node,r){
  const f=ORDER_LIFE.filter(function(x){return x.node===node;});
  if(!f.length)return null;
  const n=r.order.slice(1);
  return f.map(function(x){return x.form+': '+x.text.replace(/1842/g,n);}).join('  ·  ');},
 debugDetail:function(){
  const d=this.dbg;if(!d)return;
  const s=d.steps[d.i],r=d.req,E=EVT[s.type]||{what:s.type,why:''};
  const node=SIM.node(s.node)||{label:s.node};
  const data=this.dataAt(s.node,r);
  const hall=E.concept&&BYID[E.concept];
  let h='<b>Step '+(d.i+1)+' of '+d.steps.length+' · '+E.what+'</b> <em>'+node.label+'</em>'+
   '<div class="ddet">'+
   '<u>Why</u><span>'+E.why+'</span>'+
   (s.sync?'<u>Latency</u><span><b>'+s.ms+' ms</b> in this hop · '+Math.round(s.at)+' ms since the request left the table'+
     (s.note?' · <i>'+esc(s.note)+'</i>':'')+'</span>':
    '<u>When</u><span>'+Math.round(s.at)+' ms after the request — <b>after</b> the customer already had an answer. This is the async half.</span>')+
   (data?'<u>Data</u><span><code>'+esc(data)+'</code></span>':'')+
   (E.risk?'<u>Can fail</u><span>'+E.risk+'</span>':'')+
   '<u>Trace</u><span>'+r.id+' · trace '+r.trace+' · '+r.status+' '+(STATUS_TEXT[r.status]||'')+'</span></div>'+
   '<div class="ref-actions">'+
   (hall?'<button class="vb" data-dact="hall">Open “'+hall.title+'”</button>':'')+
   (NP[s.node]||s.node==='web'||s.node==='api'?'<button class="vb" data-dact="floor">Show it on the floor</button>':'')+
   '<button class="vb" data-dact="watch">Watch one live on the floor</button></div>';
  this.say(h);
  const self=this;
  Array.prototype.forEach.call($('instCap').querySelectorAll('[data-dact]'),function(b){
   b.addEventListener('click',function(){const a=b.getAttribute('data-dact');
    if(a==='hall'){self.close();openExhibit(E.concept);}
    else if(a==='floor'){self.close();showOnFloor(s.node);}
    else{self.close();followOnFloor();}});});},
 debugPanel:function(){
  const d=this.dbg,self=this;
  let h='<div class="dpick">'+[['latest','latest'],['slowest','slowest'],['failed','failed 5xx'],['client','4xx'],['miss','cache miss'],['async','with a job']]
   .map(function(x){return '<button data-pick="'+x[0]+'">'+x[1]+'</button>';}).join('')+'</div>';
  if(d){
   h+='<div class="inote" style="margin:0 0 8px"><b>'+d.req.id+'</b> · '+d.req.method+' '+d.req.path+' · <b>'+d.req.status+'</b> · '+
      Math.round(d.req.ms)+' ms</div>';
   d.steps.forEach(function(s,i){const E=EVT[s.type]||{};
    h+='<button class="dstep'+(i===d.i?' on':'')+(E.bad?' bad':'')+'" data-step="'+i+'"><i>'+(i+1)+'</i>'+
       s.type.toLowerCase().replace(/_/g,' ')+'<s>'+(s.sync?s.ms+'ms':'async')+'</s></button>';});
   h+='<div style="display:flex;gap:6px;margin-top:8px"><button class="ibtn" data-sk="-1" style="margin:0">◀ step</button>'+
      '<button class="ibtn" data-sk="1" style="margin:0">step ▶</button></div>';}
  /* the log, as of the playhead */
  const T=this.tmT===null?SIM.t:this.tmT;
  const L=BUS.log.filter(function(e){return e.t<=T+1e-6;}).slice(-18);
  const tr=d?d.req.trace:null;
  h+='<div class="ihead" style="margin-top:14px">Log @ t='+T.toFixed(2)+'s</div><div class="dlog">'+
   L.map(function(e){const E=EVT[e.type]||{};
    return '<div class="'+(e.trace===tr?'hot':'')+(E.bad?' bad':'')+'">'+e.t.toFixed(2)+'  '+e.trace+'  '+
     e.type+(e.type==='RESPONSE'?' '+e.note:'')+'</div>';}).join('')+'</div>';
  $('instTrace').innerHTML=h;
  Array.prototype.forEach.call($('instTrace').querySelectorAll('[data-pick]'),function(b){
   b.addEventListener('click',function(){self.pickReq(b.getAttribute('data-pick'));});});
  Array.prototype.forEach.call($('instTrace').querySelectorAll('[data-step]'),function(b){
   b.addEventListener('click',function(){self.goStep(+b.getAttribute('data-step'));});});
  Array.prototype.forEach.call($('instTrace').querySelectorAll('[data-sk]'),function(b){
   b.addEventListener('click',function(){self.step(+b.getAttribute('data-sk'));});});
  const lg=$('instTrace').querySelector('.dlog');if(lg)lg.scrollTop=lg.scrollHeight;},

 /* the range the time machine can reach: the last minute of history */
 tmRange:function(){
  const s=SIM.snaps,a=SIM.archive;
  let t0=s.length?s[0].t:SIM.t-1;if(a.length)t0=Math.min(t0,a[0].born);
  return {t0:Math.max(0,t0),t1:Math.max(t0+.5,SIM.t)};},
 tmScrub:function(v){
  const R=this.tmRange();this.tmT=R.t0+(R.t1-R.t0)*v/1000;
  if(!SIM.paused){SIM.paused=true;if(typeof updateSimBtn==='function')updateSimBtn();}
  const d=this.dbg;if(d){let k=0;for(let i=0;i<d.steps.length;i++)if(d.steps[i].t<=this.tmT)k=i;d.i=k;}
  this.debugPanel();
  if(d&&d.steps[d.i].t<=this.tmT)this.debugDetail();},
 drawTimeline:function(){
  const cv=$('tmCv');if(!cv)return;const r=cv.getBoundingClientRect();
  const dpr=Math.min(window.devicePixelRatio||1,2),W=Math.max(100,r.width),H=Math.max(20,r.height);
  if(cv.width!==Math.round(W*dpr)){cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);}
  const c=cv.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,W,H);
  const R=this.tmRange(),span=R.t1-R.t0,X=function(t){return (t-R.t0)/span*W;};
  /* event density: every bar is events on the bus, red where something failed */
  const N=Math.floor(W/4),cnt=new Array(N).fill(0),badc=new Array(N).fill(0);
  BUS.log.forEach(function(e){if(e.t<R.t0)return;const b=Math.min(N-1,Math.floor((e.t-R.t0)/span*N));cnt[b]++;
   if((EVT[e.type]||{}).bad)badc[b]++;});
  const mx=Math.max(1,Math.max.apply(null,cnt));
  for(let i=0;i<N;i++){const h=cnt[i]/mx*(H-14);
   c.fillStyle='rgba(127,168,255,.35)';c.fillRect(i*4,H-12-h,3,h);
   if(badc[i]){const hb=badc[i]/mx*(H-14);c.fillStyle='#FF7A6B';c.fillRect(i*4,H-12-hb,3,hb);}}
  /* the selected request, from table to last event */
  const d=this.dbg;
  if(d){const a=X(d.steps[0].t),b=X(d.steps[d.steps.length-1].t);
   c.fillStyle='rgba(143,160,255,.22)';c.fillRect(a,0,Math.max(2,b-a),H-12);
   d.steps.forEach(function(s){c.fillStyle=(EVT[s.type]||{}).bad?'#FF7A6B':'#8FA0FF';c.fillRect(X(s.t)-.5,2,1.5,8);});}
  const T=this.tmT===null?SIM.t:this.tmT,px=X(T);
  c.fillStyle='#fff';c.fillRect(px-1,0,2,H-10);
  $('tmT').textContent=SIM.paused?('t='+T.toFixed(2)+'s'):'live';
  const rg=$('tmRange');if(document.activeElement!==rg)rg.value=Math.round((T-R.t0)/span*1000);
  $('tmPlay').textContent=SIM.paused?'▶ live':'❚❚ freeze';},

 /* requests in flight at an arbitrary moment — computed, not recorded */
 flightAt:function(c,NID,T){
  const M=SIM.MS_PER_S,sel=this.dbg?this.dbg.req:null;
  SIM.archive.forEach(function(q){
   const lt=(T-q.born)*M;if(lt<0||lt>q.ms)return;
   let acc=0,i=0;for(;i<q.hops.length;i++){if(lt<acc+q.hops[i].ms)break;acc+=q.hops[i].ms;}
   if(i>=q.hops.length-1)i=q.hops.length-2;if(i<0)return;
   const a=NID[q.hops[i].node],b=NID[q.hops[i+1].node];if(!a||!b)return;
   const k=q.hops[i].ms?(lt-acc)/q.hops[i].ms:0;
   const pt=pathAt(edgePath(a,b),Math.max(0,Math.min(1,k)));
   const me=q===sel,bad=q.status>=500||q.status===429;
   c.save();c.globalAlpha=me?1:.55;c.fillStyle=bad?'#FF7A6B':q.status>=400?'#FFC65C':(me?'#FFFFFF':VC.blue);
   c.beginPath();c.arc(pt.x,pt.y,me?6.5:3.6,0,6.3);c.fill();
   if(me){c.strokeStyle='#fff';c.lineWidth=1.5;c.beginPath();c.arc(pt.x,pt.y,11,0,6.3);c.stroke();}
   c.restore();});},

 /* ---------------- lifecycle ---------------- */
 frame:function(){
  const now=performance.now();
  const dt=Math.max(0,Math.min(.05,(now-this.last)/1000));this.last=now;
  this.t+=dt;
  SIM.step(dt);
  if(this.gTick===undefined)this.gTick=0;
  this.gTick+=dt;if(this.gTick>.25){this.gTick=0;this.gauges();
   if(this.mode==='debug'&&!SIM.paused)this.debugPanel();}
  if(this.mode==='debug')this.drawTimeline();
  this.draw();
  this.raf=requestAnimationFrame(function(){INST.frame();});},

 show:function(mode){
  if(!this.cv){this.cv=$('instCv');this.c=this.cv.getContext('2d');
   this.cv.addEventListener('click',function(ev){INST.pick(ev);});}
  this.open=true;this.mode=mode||this.mode;
  $('inst').classList.add('on');
  if(this.mode==='debug')this.debugEnter();
  this.buildPanels();this.gauges();this.tracePanel();this.caption();
  this.last=performance.now();
  cancelAnimationFrame(this.raf);this.raf=requestAnimationFrame(function(){INST.frame();});},

 close:function(){if(this.mode==='debug')this.debugLeave();this.open=false;$('inst').classList.remove('on');
  cancelAnimationFrame(this.raf);this.raf=0;},

 toggle:function(){this.open?this.close():this.show();}
};

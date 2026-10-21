/* ======================================================================
   WALKING, LOOKING, READING
   ====================================================================== */
const P={a:0.02,r:20.6,x:0,z:0,y:0,plaza:false,lastTh:0,hd:0};
let camYaw=Math.PI-0.02,camPitch=.30,lastDrag=-99,tour=false,tourT=null;
const inp={x:0,y:0},keys={};
const SPEED=7.4;
const seen={};

function setFromAR(){P.x=Math.cos(P.a)*P.r;P.z=Math.sin(P.a)*P.r;P.y=yDeck(P.a);P.lastTh=P.a;}

function resolve(nx,nz){
 const r=Math.hypot(nx,nz)||.001,th=Math.atan2(nz,nx);
 if(P.plaza){
  if(r<=R_IN-.75){P.x=nx;P.z=nz;P.y=0;P.r=r;return;}
  const d=wrapPi(th);
  if(Math.abs(d)<GAP-.1){P.plaza=false;P.a=d;P.lastTh=th;P.r=Math.min(r,R_OUT-1.15);
   P.x=Math.cos(th)*P.r;P.z=Math.sin(th)*P.r;P.y=yDeck(P.a);return;}
  const k=(R_IN-.75)/r;P.x=nx*k;P.z=nz*k;P.y=0;P.r=R_IN-.75;return;}
 const a2=P.a+wrapPi(th-P.lastTh);
 if(a2<-.28||a2>A_MAX+.7)return;
 const inGap=a2<GAP-.1&&a2>-.28;
 if(inGap&&r<R_IN-.4){P.plaza=true;P.a=0;P.x=nx;P.z=nz;P.y=0;P.r=r;return;}
 let rr=r;
 if(!inGap&&rr<R_IN+1.05)rr=R_IN+1.05;
 if(inGap&&rr<R_IN-.4)rr=R_IN-.4;
 if(rr>R_OUT-1.15)rr=R_OUT-1.15;
 P.a=a2;P.lastTh=th;P.r=rr;P.x=Math.cos(th)*rr;P.z=Math.sin(th)*rr;P.y=yDeck(P.a);}

/* ---- travel / tour ---- */
function travel(id){
 const e=BYID[id];if(!e)return;
 tour=false;$('tourBtn').classList.remove('on');
 P.plaza=false;P.a=e.a;P.r=R_OUT-5.6;setFromAR();
 camYaw=Math.PI-e.a;lastDrag=performance.now();
 closeSheet();fireMoment(e);}
function nextHall(){
 let best=null;
 for(let i=0;i<EXHIBITS.length;i++){const e=EXHIBITS[i];
  if(e.a>P.a+.22&&!visited[e.id]){best=e;break;}}
 if(!best)for(let i=0;i<EXHIBITS.length;i++){const e=EXHIBITS[i];
  if(e.a>P.a+.22){best=e;break;}}
 return best||EXHIBITS[0];}
function toggleTour(){
 tour=!tour;$('tourBtn').classList.toggle('on',tour);
 if(tour){tourT=nextHall();
  if(P.plaza){P.plaza=false;P.a=.08;P.r=R_IN+1.6;setFromAR();}
  moment('<b>Guided walk.</b> Heading for “'+tourT.title+'”. Move or tap Tour to take over.');}}

/* ---- moments: the museum talking to you ---- */
let momTimer=0;
function moment(html){$('momentT').innerHTML=html;$('moment').classList.add('on');
 clearTimeout(momTimer);momTimer=setTimeout(function(){$('moment').classList.remove('on');},6200);}
function fireMoment(e){if(seen[e.id])return;seen[e.id]=1;
 if(MOMENTS[e.id])moment(MOMENTS[e.id]);}

/* ---- the reading panel ---- */
let VIZ=null,sheetMode='';
const sheet=$('sheet');
function lum(hex){const h=hex.replace('#','');
 const f=function(v){v=parseInt(v,16)/255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);};
 return .2126*f(h.slice(0,2))+.7152*f(h.slice(2,4))+.0722*f(h.slice(4,6));}
function closeSheet(){sheet.classList.remove('on');if(VIZ){VIZ.destroy();VIZ=null;}sheetMode='';}
function openSheet(tag,color,title){
 $('sheetBody').classList.remove('museum-ref');
 if(VIZ){VIZ.destroy();VIZ=null;}
 const t=$('sheetTag');t.textContent=tag;t.style.background=color;
 t.style.color=lum(color)>.52?'#0A0F1A':'#F2F7FF';
 $('sheetTitle').textContent=title;sheet.classList.add('on');$('sheetBody').scrollTop=0;}
function nice(s){return s.charAt(0)+s.slice(1).toLowerCase();}
function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

/* ----------------------------------------------------------------------
   THE DOCUMENTATION LADDER
   Nine layers, three depths, one concept model. Nothing below is written
   per exhibit — it is rendered from the CONCEPT record that the map, the
   blueprint and the capstone also read. Nobody has to read production
   notes to find out what a queue is.
   ---------------------------------------------------------------------- */
let docDepth='working';
const DEPTHS=[
 {id:'glance', n:'Glance',  note:'the idea, acted out'},
 {id:'working',n:'Working', note:'enough to use it'},
 {id:'deep',   n:'Deep',    note:'code, production, recall'}];

function lay(n,title){return '<div class="lay"><i>'+n+'</i><b>'+title+'</b></div>';}
function chips(ids,cls){
 return ids.map(function(i){const o=BYID[i];if(!o)return '';
  return '<button class="chip '+(cls||(visited[i]?'done':''))+'" data-go="'+i+'">'+
         o.title+'</button>';}).join('');}
function stripTags(s){return (s||'').replace(/<[^>]+>/g,'');}

function docHTML(e){
 const w=WING[e.wing],D=docDepth,deep=(D==='deep'),work=(D!=='glance');
 let h='';

 /* layer 1 — the question and one sentence of intuition */
 h+='<div class="ref-hero"><div class="ref-kicker">'+w.name+
    ' · hall '+String(e.n).padStart(2,'0')+'</div>'+
    '<h3>'+e.title+'</h3>'+
    '<div class="guide-question">'+(e.question||'What is happening here?')+'</div>';
 if(e.idea)h+='<p>'+e.idea+'</p>';
 h+='<div class="ref-actions"><button class="vb" id="replayRoom">Walk into the room</button>';
 const story=window.SCN&&SCN.forHall(e.id);
 if(story)h+='<button class="vb on" id="runStory">▶ Run story '+story.letter+'</button>';
 if(e.nodes&&e.nodes.length)h+='<button class="vb" id="inSystem">See it in the system</button>';
 const breaks=SYS_FAILURES.filter(function(f){return (e.nodes||[]).indexOf(f.hits)>=0;});
 if(breaks.length)h+='<button class="vb" id="breakIt">Break it</button>';
 h+='<button class="vb" id="closeRef">Back to the museum</button></div></div>';

 h+='<div class="depth">'+DEPTHS.map(function(d){
   return '<button class="'+(d.id===D?'on':'')+'" data-depth="'+d.id+'">'+d.n+
          '<small>'+d.note+'</small></button>';}).join('')+'</div>';

 /* the four beats — problem, pressure, idea, trade-off */
 if(e.problem){
  h+=lay('01','Why this exists')+'<div class="beats">'+
   '<div class="beat b1"><u>Problem</u><p>'+e.problem+'</p></div>'+
   '<div class="beat b2"><u>Pressure</u><p>'+e.pressure+'</p></div>'+
   '<div class="beat b3"><u>The idea</u><p>'+stripTags(e.idea)+'</p></div>'+
   '<div class="beat b4"><u>Trade-off</u><p>'+e.tradeoff+'</p></div></div>';
  if(e.why)h+='<p class="lede">'+e.why+'</p>';}

 /* layer 2 — what the room physically did */
 if(e.moment)h+=lay('02','What you just saw')+
   '<div class="ref-idea"><i></i><span>'+stripTags(e.moment)+'</span></div>';

 /* the animated argument sits between intuition and definition, on purpose */
 h+='<div id="vizHost"></div>';

 if(work&&e.concept)h+=lay('03','The concept')+'<p class="lede">'+e.concept+'</p>';
 if(work&&e.how&&e.how.length)h+=lay('04','How it works')+'<ul class="howlist">'+
   e.how.map(function(x){return '<li>'+x+'</li>';}).join('')+'</ul>';
 if(work&&e.trade&&e.trade.length){
  h+=lay('05','Trade-offs')+'<table class="trade">';
  e.trade.forEach(function(x,i){h+='<tr><td>'+TR[i]+'</td><td>'+x+'</td></tr>';});
  h+='</table>';}

 if(deep&&e.code)h+=lay('06','Implementation')+'<pre><code>'+esc(e.code.text)+'</code></pre>';
 if(deep&&e.prod&&e.prod.length)h+=lay('07','In production')+'<ul class="howlist prod">'+
   e.prod.map(function(x){return '<li>'+x+'</li>';}).join('')+'</ul>';
 if(deep&&e.adr)h+=lay('—','Decision record')+'<div class="adr">'+
   '<div><u>Context</u><p>'+e.adr.ctx+'</p></div>'+
   '<div><u>Decision</u><p>'+e.adr.dec+'</p></div>'+
   '<div><u>Consequences</u><ul>'+
     e.adr.con.map(function(c){return '<li>'+c+'</li>';}).join('')+'</ul></div></div>';
 if(deep&&e.keys&&e.keys.length)h+=lay('08','What to remember')+'<ul class="keys">'+
   e.keys.map(function(k){return '<li>'+k+'</li>';}).join('')+'</ul>';
 if(deep&&e.cheat&&e.cheat.length){
  h+=lay('08','Interview recall')+'<table class="cheat">';
  e.cheat.forEach(function(c){h+='<tr><td>'+c[0]+'</td><td>'+c[1]+'</td></tr>';});
  h+='</table>';}
 if(deep&&e.refs&&e.refs.length)h+=lay('09','Further reading')+'<div class="refs">'+
   e.refs.map(function(r){return '<a href="'+r[1]+'" target="_blank" rel="noopener">'+
     r[0]+' ↗</a>';}).join('')+'</div>';

 /* the graph, as navigation — never a random nearby room */
 h+=lay('→','Where this sits');
 const met=GRAPH.metBefore(e.id);
 const unmet=(e.prereq||[]).filter(function(p){return !visited[p];});
 const opens=GRAPH.unlocks(e.id),nxt=GRAPH.next(e.id);
 if(met.length)h+='<div class="gcard"><u>You already met this</u><div class="chips">'+
   chips(met,'done')+'</div></div>';
 if(unmet.length)h+='<div class="gcard"><u>Worth seeing first</u><div class="chips">'+
   chips(unmet,'locked')+'</div></div>';
 if(e.rel&&e.rel.length)h+='<div class="gcard"><u>Related</u><div class="chips">'+
   chips(e.rel)+'</div></div>';
 if(opens.length)h+='<div class="gcard"><u>This one unlocks</u><div class="chips">'+
   chips(opens)+'</div></div>';
 if(nxt&&nxt.id!==e.id)h+='<div class="gcard"><u>Visit next</u>'+
   '<em>Every prerequisite for this one is now behind you.</em>'+
   '<div class="chips" style="margin-top:8px">'+chips([nxt.id],'next')+'</div></div>';
 return h;
}

function wireDoc(e){
 const body=$('sheetBody');
 VIZ=mountViz($('vizHost'),e.viz);
 const rb=$('replayRoom');
 if(rb)rb.addEventListener('click',function(){closeSheet();travel(e.id);showLesson(e);});
 const cb=$('closeRef');if(cb)cb.addEventListener('click',closeSheet);
 const rs=$('runStory');if(rs)rs.addEventListener('click',function(){SCN.open(SCN.forHall(e.id).id);});
 const sb=$('inSystem');
 if(sb)sb.addEventListener('click',function(){
  closeSheet();INST.show('blueprint');INST.picked=e.nodes[0];
  const names=e.nodes.map(function(n){
   return '<em>'+((SIM.node(n)||{}).label||n)+'</em>';}).join(', ');
  INST.say('<b>'+e.title+' in the system.</b> This hall explains '+names+
   '. Every other box is a component some other hall explains — click one to go there.');});
 const bb=$('breakIt');
 if(bb)bb.addEventListener('click',function(){
  const f=SYS_FAILURES.filter(function(x){return (e.nodes||[]).indexOf(x.hits)>=0;})[0];
  closeSheet();SIM.clearFailures();SIM.clearGuards();SIM.fail[f.id]=true;SIM.reset();
  INST.show('failure');INST.buildPanels();
  INST.say('<b>'+f.label+'.</b> '+f.note+
   ' Amber is collateral — components that are fine but cannot do their job. '+
   'Turn on a defence on the right and watch how far the amber stops spreading.');});
 Array.prototype.forEach.call(body.querySelectorAll('[data-depth]'),function(b){
  b.addEventListener('click',function(){
   docDepth=b.getAttribute('data-depth');
   /* stop the old canvas loop before the node is thrown away, or every
      depth change leaves an orphan animation running off-screen */
   if(VIZ){VIZ.destroy();VIZ=null;}
   body.innerHTML=docHTML(e);wireDoc(e);body.scrollTop=0;});});
 Array.prototype.forEach.call(body.querySelectorAll('[data-go]'),function(b){
  b.addEventListener('click',function(){openExhibit(b.getAttribute('data-go'));});});
}

function openExhibit(id){
 const e=BYID[id];if(!e)return;
 openSheet(nice(WING[e.wing].name),WING[e.wing].color,e.title);sheetMode='exhibit';
 $('sheetBody').classList.add('museum-ref');
 $('sheetBody').innerHTML=docHTML(e);
 wireDoc(e);
 markVisited(id);if(e.ring)e.ring.material.opacity=.55;
}


/* ---- the index ---- */

/* ----------------------------------------------------------------------
   THE CONCEPT GRAPH, DRAWN
   Rows are prerequisite depth, so the picture IS the curriculum order:
   nothing appears above something it depends on. Colour is department,
   fill is "visited", a ring is "you have everything you need for this".
   ---------------------------------------------------------------------- */
const GLEVEL={};
function conceptLevel(id,guard){
 if(GLEVEL[id]!==undefined)return GLEVEL[id];
 guard=guard||{};
 if(guard[id])return 0;
 guard[id]=1;
 const e=BYID[id];
 let L=0;
 (e&&e.prereq||[]).forEach(function(p){
  if(BYID[p])L=Math.max(L,conceptLevel(p,guard)+1);});
 GLEVEL[id]=L;return L;}

function graphLayout(W){
 const rows={};
 EXHIBITS.forEach(function(e){
  if(e.id==='welcome')return;
  const L=conceptLevel(e.id);(rows[L]=rows[L]||[]).push(e);});
 const keys=Object.keys(rows).map(Number).sort(function(a,b){return a-b;});
 const rh=76,pad=26;
 const pos={};
 const order=WINGS.map(function(w){return w.id;});
 keys.forEach(function(L,ri){
  const rowArr=rows[L];
  if(ri===0){
   /* the roots have no parents: group them by department so the colours
      read as bands, and everything below inherits that ordering */
   rowArr.sort(function(a,b){return order.indexOf(a.wing)-order.indexOf(b.wing);});
  }else{
   /* barycentre pass — put each concept above its prerequisites, which
      is what stops the drawing turning into a ball of string */
   rowArr.forEach(function(e){
    const px=(e.prereq||[]).map(function(p){return pos[p]?pos[p].x:null;})
                           .filter(function(v){return v!==null;});
    e.__bx=px.length?px.reduce(function(a,b){return a+b;},0)/px.length
                    :order.indexOf(e.wing)/order.length*W;});
   rowArr.sort(function(a,b){return a.__bx-b.__bx;});}
  const step=(W-pad*2)/rowArr.length;
  rowArr.forEach(function(e,i){
   pos[e.id]={x:pad+step*(i+.5),y:pad+18+ri*rh,e:e,level:L};});});
 return {pos:pos,h:pad*2+18+keys.length*rh,levels:keys.length};}

function drawConceptGraph(cv){
 const W=cv.width,x=cv.getContext('2d');
 const G=graphLayout(W);
 cv.__graph=G;
 x.clearRect(0,0,W,cv.height);

 /* edges: prerequisite -> concept */
 EXHIBITS.forEach(function(e){
  const to=G.pos[e.id];if(!to)return;
  (e.prereq||[]).forEach(function(p){
   const from=G.pos[p];if(!from)return;
   const lit=visited[p];
   x.strokeStyle=lit?'rgba(143,160,255,.38)':'rgba(120,150,210,.13)';
   x.lineWidth=lit?1.5:1;
   x.beginPath();x.moveTo(from.x,from.y+13);
   x.bezierCurveTo(from.x,from.y+40,to.x,to.y-40,to.x,to.y-13);
   x.stroke();});});

 /* nodes */
 const ready={};GRAPH.ready().forEach(function(e){ready[e.id]=1;});
 Object.keys(G.pos).forEach(function(id){
  const n=G.pos[id],col=WING[n.e.wing].color;
  if(ready[id]&&!visited[id]){
   x.strokeStyle=col;x.lineWidth=1.4;x.globalAlpha=.55;
   x.beginPath();x.arc(n.x,n.y,15,0,6.3);x.stroke();x.globalAlpha=1;}
  x.beginPath();x.arc(n.x,n.y,visited[id]?8:6,0,6.3);
  if(visited[id]){x.fillStyle=col;x.fill();}
  else{x.strokeStyle=col;x.lineWidth=1.6;x.globalAlpha=.8;x.stroke();x.globalAlpha=1;}
  x.font='500 10px "JetBrains Mono", monospace';
  x.fillStyle=visited[id]?'#DCE6F8':'#8093B4';
  x.textAlign='center';x.textBaseline='top';
  const t=n.e.title.length>18?n.e.title.slice(0,17)+'…':n.e.title;
  x.fillText(t,n.x,n.y+14);});

 /* row labels */
 x.textAlign='left';x.textBaseline='middle';
 for(let L=0;L<G.levels;L++){
  x.font='600 8.5px "JetBrains Mono", monospace';
  x.fillStyle='rgba(120,150,210,.3)';
  x.fillText('L'+L,6,26+18+L*76);}
}

function hitGraph(cv,ev){
 const G=cv.__graph;if(!G)return null;
 const r=cv.getBoundingClientRect();
 const sx=cv.width/r.width,sy=cv.height/r.height;
 const px=(ev.clientX-r.left)*sx,py=(ev.clientY-r.top)*sy;
 let best=null,bd=1e9;
 Object.keys(G.pos).forEach(function(id){
  const n=G.pos[id],d=Math.hypot(px-n.x,py-n.y);
  if(d<bd&&d<26){bd=d;best=id;}});
 return best;}

/* ---- the journey: departments in order, halls inside them ---- */
function journeyHTML(){
 const hereWing=(near&&near.wing)?near.wing:(P.plaza?'hub':null);
 const ready={};GRAPH.ready().forEach(function(e){ready[e.id]=1;});
 let h='<div class="jmap">';
 WINGS.forEach(function(w,i){
  const halls=EXHIBITS.filter(function(e){return e.wing===w.id;});
  if(!halls.length)return;
  const done=halls.filter(function(e){return visited[e.id];}).length;
  h+='<div class="jrow'+(w.id===hereWing?' here':'')+'">'+
     '<div class="jnum">'+String(i).padStart(2,'0')+'</div><div class="jdept">'+
     '<b>'+w.short+'</b>'+
     '<q>'+((w.guide&&w.guide.question)||w.blurb||'')+'</q>'+
     '<div class="jhalls">';
  halls.forEach(function(e){
   const cls=visited[e.id]?'done':(ready[e.id]?'ready':'locked');
   h+='<button class="jh '+cls+'" data-go="'+e.id+'">'+e.title+'</button>';});
  h+='</div><div class="jbar"><i style="width:'+
     Math.round(done/halls.length*100)+'%;background:'+w.color+'"></i></div>'+
     '</div></div>';});
 return h+'</div>';}

function openMap(){
 openSheet('Museum map','#8FA0FF','The journey');sheetMode='map';
 const seenN=Object.keys(visited).length;
 const nxt=GRAPH.next(near&&near.id);
 $('sheetBody').innerHTML=
  '<p class="lede">The museum is a curriculum, not a corridor. '+seenN+' of '+EXHIBITS.length+
  ' halls behind you. A <b>→</b> means every prerequisite for that hall is already done; '+
  'a dim hall is one the museum would rather you came back to.</p>'+
  (nxt?'<div class="gcard" style="margin:12px 0"><u>Recommended next</u>'+
    '<em>'+(nxt.question||'')+'</em><div class="chips" style="margin-top:8px">'+
    '<button class="chip next" data-go="'+nxt.id+'">'+nxt.title+'</button></div></div>':'')+
  journeyHTML()+
  '<div class="mapsec"><h3>The concept graph</h3>'+
  '<p>Every line is a prerequisite. Rows are depth, so nothing sits above something it depends on — '+
  'this drawing is the order the museum would teach in. Filled circles are halls you have visited; '+
  'a ring means you are ready for it now.</p>'+
  '<div class="graphwrap"><canvas id="cgraph"></canvas></div>'+
  '<div class="glegend">'+WINGS.filter(function(w){return w.id!=='hub';})
    .map(function(w){return '<span style="color:'+w.color+'"><i></i>'+w.short+'</span>';}).join('')+
  '</div></div>'+
  '<div class="mapsec"><h3>The capstone</h3>'+
  '<p>When the departments start feeling like one system rather than ten topics, '+
  'go and build it. You choose the parts; the museum opens the restaurant for six nights '+
  'and tells you exactly what broke and why.</p>'+
  '<button class="ibtn primary" id="goCapstone" style="margin-top:0">Build the restaurant</button></div>'+
  '<div class="mapsec"><h3>Every hall</h3>'+
  '<input class="srch" id="srch" placeholder="Search halls — kafka, idempotent, big-o…" autocomplete="off">'+
  '<div id="idx"></div></div>';

 const cv=$('cgraph');
 const wpx=Math.max(560,cv.parentNode.clientWidth-20);
 const L=graphLayout(wpx);
 cv.width=wpx;cv.height=L.h;
 cv.style.height=L.h+'px';
 drawConceptGraph(cv);
 cv.addEventListener('click',function(ev){
  const id=hitGraph(cv,ev);if(id)travel(id);});

 renderIndex('');
 const s=$('srch');s.addEventListener('input',function(){renderIndex(s.value.toLowerCase());});
 $('goCapstone').addEventListener('click',openCapstone);
 Array.prototype.forEach.call($('sheetBody').querySelectorAll('.jh[data-go],.chip[data-go]'),
  function(b){b.addEventListener('click',function(){travel(b.getAttribute('data-go'));});});}

function renderIndex(q){
 let h='',cur='';
 EXHIBITS.forEach(function(e){
  const w=WING[e.wing];
  const hay=(e.title+' '+e.lede+' '+(e.keys||[]).join(' ')+' '+
   (e.cheat||[]).map(function(c){return c[0];}).join(' ')).toLowerCase();
  if(q&&hay.indexOf(q)<0)return;
  if(w.id!==cur){cur=w.id;h+='</div><div class="dept-head"><div class="wingttl"><i style="background:'+w.color+'"></i>'+w.name+'</div><div class="dept-blurb">'+(w.blurb||'')+'</div></div><div class="tiles">';}
  h+='<button class="tile" data-go="'+e.id+'" style="border-left-color:'+w.color+'">'+
   '<span class="num">'+String(e.n).padStart(2,'0')+'</span><span style="min-width:0"><b>'+e.title+'</b>'+
   '<span>'+strip(e.lede,54)+'</span></span>'+
   (visited[e.id]?'<span class="ok">✓</span>':'')+'</button>';});
 h=(h+'</div>').replace(/^<\/div>/,'');
 if(!h.replace(/<[^>]*>/g,'').trim())h='<p class="lede">Nothing matches that.</p>';
 $('idx').innerHTML=h;
 Array.prototype.forEach.call($('idx').querySelectorAll('[data-go]'),function(b){
  b.addEventListener('click',function(){travel(b.getAttribute('data-go'));});});}


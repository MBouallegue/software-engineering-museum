(function(){
const {STAGES,K,W,H,clone,clamp,ez,rng,hexA,ms,Rec,pace,grid,ctr,stateCol,drawNode,edgePts,polyAt,drawEdges,packet,dot,drawPacket,panel,kv,nodeStates,code,SC}=StoryKit;

/* ======================================================================
   THE PLAYER
   ====================================================================== */
const BYS={};SC.forEach(function(d){BYS[d.id]=d;});
const HALL2S={rest:'order','rpc-graphql':'order',architecture:'order',database:'index',indexes:'index',transactions:'race',tasks:'queue',rabbitmq:'queue',
 race:'race',retries:'failure',delivery:'replay',kafka:'replay',pubsub:'replay',scaling:'queue',cap:'failure'};
const NODE2S={customer:'order',web:'order',api:'order',auth:'order',orders:'order',db:'index',cache:'index',replica:'failure',queue:'queue',worker:'queue',
 kitchen:'race',broker:'replay',notify:'replay',payment:'failure',lb:'queue',search:'index'};
let DONE={};try{DONE=JSON.parse(localStorage.getItem('mose2.stories')||'{}')||{};}catch(e){DONE={};}
function saveDone(){try{localStorage.setItem('mose2.stories',JSON.stringify(DONE));}catch(e){}}

const P={def:null,opts:null,run:null,pos:0,playing:false,speed:1,holds:true,focus:false,level:2,sel:null,tab:'explain',
 base:null,baseOpts:null,lastIdx:-2,until:null,raf:0,last:0,chap:null,quiz:{}};
const cv=$('scnCv'),tl=$('scnTl');let cx=null,tx=null,cwid=0,chei=0,view={s:1,ox:0,oy:0};

function optLabel(def,opts){return def.options.map(function(o){const c=o.choices.filter(function(x){return x[0]===opts[o.id];})[0];return c?c[1]:'';}).join(' · ');}
function build(){P.run=P.def.build(P.opts);P.pos=0;P.lastIdx=-2;P.until=null;
 P.timed=P.run.events.some(function(e){return e.t>0;});
 P.total=P.run.events.reduce(function(a,e){return a+e.dur;},0);}
function curIdx(){const i=Math.floor(P.pos),p=P.pos-i;return p>0?i:i-1;}
function stateAt(i){return i<=0?P.run.s0:P.run.events[i-1].s;}
function tAt(){const ev=P.run.events,i=Math.floor(P.pos),p=P.pos-i;if(i>=ev.length)return ev.length?ev[ev.length-1].t:0;
 const a=i?ev[i-1].t:0;return a+(ev[i].t-a)*p;}

function open(id,optsOverride,at){
 if(!id){showPick();return;}
 const d=BYS[id];if(!d)return;
 if(typeof closeExplain==='function'&&explainFor)closeExplain();
 if(typeof closeSheet==='function')closeSheet();
 if(typeof INST!=='undefined'&&INST.open)INST.close();
 $('scnPick').classList.remove('on');
 P.def=d;P.opts={};d.options.forEach(function(o){P.opts[o.id]=o.def;});if(optsOverride)Object.assign(P.opts,optsOverride);
 P.base=null;P.baseOpts=null;P.sel=null;P.level=2;P.tab='explain';P.chap=null;P.quiz={};
 if(RM)P.speed=.5;$('scnSpd').textContent='×'+P.speed;
 build();
 const acc=WING[d.wing]?WING[d.wing].color:'#8FA0FF';P.acc=acc;
 $('scn').style.setProperty('--acc',acc);$('scnKick').textContent='Story '+d.letter+' · '+(WING[d.wing]?WING[d.wing].short:'')+' · '+(BYID[d.hall]?BYID[d.hall].title:'');
 $('scnTitle').textContent=d.title;
 $('scnQ').innerHTML=esc(d.question)+'<small>'+esc(d.intuition)+'</small>';
 $('scnArc').innerHTML=STAGES.map(function(s){return '<li>'+s+'</li>';}).join('');
 SCN.isOpen=true;$('scn').classList.add('on');
 if(SIM){P.simWas=SIM.paused;SIM.paused=true;}
 paintPrim();paintTabs();fit();P.playing=true;P.last=performance.now();
 if(at){const a=anchorIdx(at);if(a>=0){P.pos=a+1;P.playing=false;}}
 loop();
 try{cv.focus({preventScroll:true});}catch(e){}}
function close(){SCN.isOpen=false;P.playing=false;cancelAnimationFrame(P.raf);$('scn').classList.remove('on');
 if(SIM){SIM.paused=!!SIM.userPaused;}if(typeof updateSimBtn==='function')updateSimBtn();
 if(typeof paintProgress==='function')paintProgress();}

function showPick(){
 if(typeof closeExplain==='function'&&explainFor)closeExplain();
 if(typeof closeSheet==='function')closeSheet();
 SCN.isOpen=true;$('scn').classList.add('on');$('scn').style.setProperty('--acc','#8FA0FF');
 if(SIM){P.simWas=SIM.paused;SIM.paused=true;}
 P.playing=false;
 $('scnKick').textContent='Stories';$('scnTitle').textContent='One restaurant, six chapters';$('scnArc').innerHTML='';
 const pk=$('scnPick');
 pk.innerHTML='<div class="in"><h2>One restaurant, six chapters</h2><p>Each story is a short, controllable simulation of the restaurant system that runs through the whole museum. Step through it, select any component to have it explained, then change one engineering decision and compare the two runs.</p>'+
  '<div class="scn-cards"><button class="scard live" style="--c:#FFD166" data-live="1"><i>Live · the restaurant floor</i><b>Watch a real order in 3D</b>'+
  '<span>Ride along with one live request from a table, through every component, and back. The kitchen robots cook it and the waiter brings it out.</span><em>about 1 minute · also G</em></button>'+SC.map(function(d){const c=WING[d.wing]?WING[d.wing].color:'#8FA0FF';
   return '<button class="scard'+(DONE[d.id]?' done':'')+'" style="--c:'+c+'" data-story="'+d.id+'"><i>Story '+d.letter+' · '+(WING[d.wing]?WING[d.wing].short:'')+'</i><b>'+esc(d.title)+'</b><span>'+esc(d.question)+'</span><em>'+(DONE[d.id]?'✓ completed':'about 2 minutes')+'</em></button>';}).join('')+
  '</div></div>';
 pk.classList.add('on');
 pk.querySelector('[data-live]').addEventListener('click',function(){close();if(typeof skipIntro==='function')skipIntro();followOnFloor();});
 Array.prototype.forEach.call(pk.querySelectorAll('[data-story]'),function(b){b.addEventListener('click',function(){open(b.getAttribute('data-story'));});});}

/* ---- sizing ---- */
function fit(){const st=$('scnStage');const d=Math.min(window.devicePixelRatio||1,2);
 /* on a phone the drawing keeps a legible minimum size and pans inside the stage */
 const narrow=st.clientWidth<600;st.classList.toggle('pan',narrow);
 if(narrow){const mw=680,mh=Math.round(mw*H/W);cv.style.width=mw+'px';cv.style.height=mh+'px';st.style.height='auto';st.style.setProperty('--vw',(st.clientWidth-2)+'px');}
 else{cv.style.width='';cv.style.height='';st.style.height='';}
 const r=cv.getBoundingClientRect();
 cwid=Math.max(10,r.width);chei=Math.max(10,r.height);cv.width=Math.round(cwid*d);cv.height=Math.round(chei*d);cx=cv.getContext('2d');
 const s=Math.min(cwid/W,chei/H);view={s:s,ox:(cwid-W*s)/2,oy:(chei-H*s)/2,d:d};
 const tr=tl.getBoundingClientRect();tl.width=Math.round(tr.width*d);tl.height=Math.round(tr.height*d);tx=tl.getContext('2d');tx.setTransform(d,0,0,d,0,0);tl._w=tr.width;tl._h=tr.height;}
addEventListener('resize',function(){if(SCN.isOpen&&P.def)fit();});

/* ---- the loop ---- */
function loop(){cancelAnimationFrame(P.raf);P.raf=requestAnimationFrame(frame);}
function frame(ts){if(!SCN.isOpen||!P.def)return;P.raf=requestAnimationFrame(frame);
 /* rAF time can precede the timestamp taken in open(), so never let dt go negative */
 const dt=Math.max(0,Math.min(.1,(ts-P.last)/1000));P.last=ts;const ev=P.run.events,N=ev.length;
 if(P.playing&&P.pos<N){let i=Math.floor(P.pos);const e=ev[i];
  let np=P.pos+dt*P.speed/Math.max(.05,e.dur);
  if(Math.floor(np)>i){np=i+1;
   if(P.until!=null&&np>=P.until){P.playing=false;P.until=null;}
   else if(P.holds&&e.hold){P.playing=false;}}
  P.pos=Math.min(N,np);if(P.pos>=N){P.playing=false;onEnd();}}
 draw();drawTl();
 const ci=curIdx();
 if(ci!==P.lastIdx||(P.wasPlaying&&!P.playing)){P.lastIdx=ci;paintNow(!P.playing);}
 P.wasPlaying=P.playing;paintTransport();}

function ctxX(){const ev=P.run.events,N=ev.length,i=Math.min(Math.floor(P.pos),N),p=P.pos-i;
 const ci=curIdx();
 const X={def:P.def,run:P.run,opts:P.opts,acc:P.acc,i:i,p:i<N?p:0,E:i<N?ev[i]:null,S:stateAt(i),t:tAt(),sel:P.sel,focus:P.focus,cur:ci>=0?ev[ci]:null};
 X.ns=nodeStates(P.def,X);return X;}
function draw(){const c=cx;if(!c)return;const d=view.d;
 c.setTransform(d,0,0,d,0,0);c.fillStyle=K.bg;c.fillRect(0,0,cwid,chei);
 c.setTransform(d*view.s,0,0,d*view.s,d*view.ox,d*view.oy);grid(c);
 const X=ctxX(),def=P.def;
 if(!def.custom){drawEdges(c,def,X);Object.keys(def.nodes).forEach(function(id){drawNode(c,def.nodes[id],X.ns[id],P.acc);});}
 if(def.draw)def.draw(c,X);
 if(!def.custom)drawPacket(c,def,X);}

/* ---- timeline: marker widths follow playback time ---- */
function drawTl(){const c=tx;if(!c)return;const w=tl._w,h=tl._h,ev=P.run.events;
 c.clearRect(0,0,w,h);rr(c,0,0,w,h,8);c.fillStyle='#0C1324';c.fill();
 let acc0=0;const px=function(a){return 8+(w-16)*a/P.total;};
 c.fillStyle='#1A2540';c.fillRect(8,h/2-1,w-16,2);
 let played=0;for(let i=0;i<ev.length;i++){if(i<Math.floor(P.pos))played+=ev[i].dur;else if(i===Math.floor(P.pos))played+=ev[i].dur*(P.pos-i);}
 c.fillStyle=P.acc;c.fillRect(8,h/2-1,px(played)-8,2);
 for(let i=0;i<ev.length;i++){const e=ev[i];acc0+=e.dur;const x=px(acc0);
  const col=e.bad?K.bad:e.good?K.ok:e.warn?K.wait:e.key?P.acc:'#33456B';
  if(e.key||e.hold){c.fillStyle=col;c.beginPath();c.moveTo(x,h/2-8);c.lineTo(x+5,h/2-3);c.lineTo(x,h/2+2);c.lineTo(x-5,h/2-3);c.fill();}
  else if(e.bad||e.warn||e.good){c.fillStyle=col;c.fillRect(x-1,h/2+4,2,6);}
  else if(ev.length<80){c.fillStyle='#2B3A5C';c.fillRect(x-.5,h/2+4,1,4);}}
 const hx=px(played);c.fillStyle='#fff';c.fillRect(hx-1,4,2,h-8);}
function tlSeek(ev){const r=tl.getBoundingClientRect(),x=ev.clientX-r.left,w=r.width;const a=clamp((x-8)/(w-16),0,1)*P.total;
 let acc0=0;const E=P.run.events;for(let i=0;i<E.length;i++){acc0+=E[i].dur;if(acc0>=a){seek(i+1,false);return;}}seek(E.length,false);}
function seek(pos,play){P.pos=clamp(pos,0,P.run.events.length);P.playing=!!play;P.until=null;$('scnEnd').classList.remove('on');if(P.pos>=P.run.events.length)onEnd();}
function step(d){const i=Math.floor(P.pos),fr=P.pos-i;P.playing=false;
 if(d>0)seek(fr>0?i+1:i+1,false);else seek(fr>0?i:i-1,false);}

/* ---- transport ---- */
function paintTransport(){const b=$('scnPlay'),N=P.run.events.length;
 const t=P.playing?'❚❚ Pause':P.pos>=N?'⟲ Replay':'▶ Play';if(b.textContent!==t)b.textContent=t;
 const ci=curIdx(),e=ci>=0?P.run.events[ci]:null;
 const clk='step '+Math.max(0,ci+1)+'/'+N+(P.timed?'<small>'+(e?ms(e.t):'0 ms')+' sim</small>':'');if($('scnClock').innerHTML!==clk)$('scnClock').innerHTML=clk;}
$('scnPlay').addEventListener('click',function(){const N=P.run.events.length;if(P.pos>=N){seek(0,true);return;}P.playing=!P.playing;P.until=null;});
$('scnRe').addEventListener('click',function(){seek(0,true);});
$('scnBack').addEventListener('click',function(){step(-1);});
$('scnFwd').addEventListener('click',function(){step(1);});
const SPEEDS=[.25,.5,1,2,4];
function setSpd(d){let i=SPEEDS.indexOf(P.speed);if(i<0)i=2;i=clamp(i+d,0,SPEEDS.length-1);P.speed=SPEEDS[i];$('scnSpd').textContent='×'+P.speed;}
$('scnSpd').addEventListener('click',function(){let i=SPEEDS.indexOf(P.speed);P.speed=SPEEDS[(i+1)%SPEEDS.length];$('scnSpd').textContent='×'+P.speed;});
$('scnHold').addEventListener('click',function(){P.holds=!P.holds;$('scnHold').classList.toggle('on',P.holds);});
$('scnFocus').addEventListener('click',function(){P.focus=!P.focus;$('scnFocus').classList.toggle('on',P.focus);});
$('scnHold').classList.add('on');
tl.addEventListener('pointerdown',function(e){tlSeek(e);tl.setPointerCapture(e.pointerId);});
tl.addEventListener('pointermove',function(e){if(e.buttons)tlSeek(e);});

/* ---- selecting an object on the stage: explain this ---- */
cv.addEventListener('click',function(e){const r=cv.getBoundingClientRect();const x=(e.clientX-r.left-view.ox)/view.s,y=(e.clientY-r.top-view.oy)/view.s;
 let hit=null;Object.keys(P.def.nodes).forEach(function(id){const n=P.def.nodes[id];if(x>=n.x&&x<=n.x+n.w&&y>=n.y&&y<=n.y+n.h){if(!hit||n.w*n.h<P.def.nodes[hit].w*P.def.nodes[hit].h)hit=id;}});
 selectObj(hit===P.sel?null:hit);});
function selectObj(id){P.sel=id;P.tab='explain';paintTabs();}

/* ---- the primary decision lives under the stage, one click away ---- */
function paintPrim(){const d=P.def,o=d.options.filter(function(x){return x.primary;})[0]||d.options[0];
 $('scnPrim').innerHTML='<span>Try</span><div class="seg" role="group" aria-label="'+esc(o.label)+'">'+o.choices.map(function(c){
  return '<button data-opt="'+o.id+'" data-v="'+c[0]+'" class="'+(P.opts[o.id]===c[0]?'on':'')+'">'+esc(c[1])+'</button>';}).join('')+'</div>'+
  (d.options.length>1?'<button class="vb" data-more="1">More experiments…</button>':'');
 wireOpts($('scnPrim'));const m=$('scnPrim').querySelector('[data-more]');if(m)m.addEventListener('click',function(){P.tab='lab';paintTabs();});}
function wireOpts(root){Array.prototype.forEach.call(root.querySelectorAll('[data-opt]'),function(b){b.addEventListener('click',function(){
 setOpt(b.getAttribute('data-opt'),b.getAttribute('data-v'));});});}
function setOpt(k,v){if(P.opts[k]===v)return;
 /* keep the run you just did as the “before”, so one change can be compared */
 P.base=P.run.metrics;P.baseOpts=Object.assign({},P.opts);
 P.opts[k]=v;build();P.playing=true;P.sel=P.sel;$('scnEnd').classList.remove('on');paintPrim();paintTabs();}

/* ---- the side panel ---- */
document.querySelectorAll('.scn-tabs [data-tab]').forEach(function(b){b.addEventListener('click',function(){P.tab=b.getAttribute('data-tab');paintTabs();});});
function paintTabs(){document.querySelectorAll('.scn-tabs [data-tab]').forEach(function(b){b.classList.toggle('on',b.getAttribute('data-tab')===P.tab);});
 if(P.tab==='explain')paintExplain();else if(P.tab==='guide')paintGuide();else paintLab();}
function paintNow(force){const ci=curIdx(),e=ci>=0?P.run.events[ci]:null;
 const held=e&&e.hold&&P.holds&&!P.playing&&P.pos===ci+1&&P.pos<P.run.events.length;
 $('scnCap').innerHTML=e?e.say+(held?' <span style="color:var(--acc)">◆ Paused at a key moment. Press Play or Space to continue.</span>':''):'<b>Press Play</b> or <kbd>Space</kbd>. Select any component on the stage to have it explained.';
 const stg=P.pos>=P.run.events.length?7:e?e.stage:0;
 Array.prototype.forEach.call($('scnArc').children,function(li,k){li.classList.toggle('on',k===stg);li.classList.toggle('done',k<stg);});
 const now=performance.now();
 if(P.tab==='explain'&&(force||!e||e.hold||e.key||e.why||now-(P.lastPaint||0)>800)){P.lastPaint=now;paintExplain();}
 else if(P.tab==='guide'&&e&&e.chapter&&e.chapter!==P.chap){P.chap=e.chapter;paintGuide(true);}}
function relChips(ids){return '<div class="objs">'+(ids||[]).filter(function(i){return BYID[i];}).map(function(i){return '<button class="chip2" data-hall="'+i+'">'+esc(BYID[i].title)+'</button>';}).join('')+'</div>';}
function wireHalls(root){Array.prototype.forEach.call(root.querySelectorAll('[data-hall]'),function(b){b.addEventListener('click',function(){
 const h=b.getAttribute('data-hall');close();openExhibit(h);});});
 Array.prototype.forEach.call(root.querySelectorAll('[data-story]'),function(b){b.addEventListener('click',function(){open(b.getAttribute('data-story'));});});}
function paintExplain(){const pane=$('scnPane'),d=P.def,ci=curIdx(),e=ci>=0?P.run.events[ci]:null,S=stateAt(Math.min(Math.floor(P.pos),P.run.events.length));
 let h='';
 if(P.sel&&d.obj[P.sel]){const o=d.obj[P.sel],n=d.nodes[P.sel];
  h+='<div class="ocard"><h6 style="margin:0 0 6px">Selected</h6><h5>'+esc(n.label)+'</h5><p><b>What is this?</b> '+o.what+'</p><p><b>Why does it exist?</b> '+o.why+'</p>'+
   '<div class="st">Now: '+o.state(S)+'</div>'+(o.rel?'<h6>Go deeper</h6>'+relChips(o.rel):'')+'</div>';}
 h+='<div class="lvl" role="tablist">'+[[1,'Intuition','Level 1'],[2,'What you see','Level 2'],[3,'Engineering','Level 3']].map(function(l){
  return '<button data-lvl="'+l[0]+'" class="'+(P.level===l[0]?'on':'')+'"><small>'+l[2]+'</small>'+l[1]+'</button>';}).join('')+'</div>';
 if(P.level===1){h+='<p>'+d.intuition+'</p>';if(e&&e.concept&&BYID[e.concept])h+='<h6>The idea behind this step</h6><p>'+(BYID[e.concept].idea||'')+'</p>';}
 else if(P.level===2){
  if(!e)h+='<p>'+esc(d.question)+'</p><p>Press <b>Play</b>. The story will pause at its important moments, marked ◆ on the timeline.</p>';
  else{h+='<h6>'+(e.bad?'Failure':e.warn?'Warning':e.good?'Success':'Event')+' · step '+(ci+1)+'</h6><p><b>'+esc(e.label)+'.</b> '+e.say+'</p>';
   if(e.why)h+='<dl class="why"><dt>Cause</dt><dd>'+e.why.cause+'</dd><dt>Consequence</dt><dd>'+e.why.consequence+'</dd><dt>Response</dt><dd>'+e.why.response+'</dd><dt>Trade-off</dt><dd>'+e.why.tradeoff+'</dd></dl>';
   h+='<h6>Event inspector</h6><div class="insp">'+(P.timed?'<u>sim time</u><span>'+ms(e.t)+'</span>':'<u>step</u><span>'+(ci+1)+' of '+P.run.events.length+'</span>')+'<u>from → to</u><span>'+esc((d.nodes[e.src]||{}).label||e.src)+' → '+esc((d.nodes[e.dst]||{}).label||e.dst)+'</span>'+
    '<u>type</u><span><code>'+esc(e.type)+'</code></span>';
   Object.keys(e.data||{}).forEach(function(k){h+='<u>'+esc(k)+'</u><span>'+esc(String(e.data[k]))+'</span>';});
   if(e.changes)h+='<u>changed</u><span class="'+(e.bad?'bad':'ok')+'">'+e.changes.map(esc).join('<br>')+'</span>';
   if(e.bad)h+='<u>failure</u><span class="bad">yes</span>';
   if(e.concept&&BYID[e.concept])h+='<u>concept</u><span>'+esc(BYID[e.concept].title)+'</span>';
   h+='</div>';}}
 else{const ch=d.chapters.filter(function(c){return c.id===(e&&e.chapter)||c.id==='mech';})[0]||d.chapters[0];
  h+='<div class="doc"><h4>'+esc(ch.n)+'</h4>'+(ch.html||'')+'</div><button class="vb" data-goguide="1">Open the full study guide</button>';
  if(BYID[d.hall])h+=' <button class="vb" data-hall="'+d.hall+'">The hall’s reference: '+esc(BYID[d.hall].title)+'</button>';}
 h+='<h6>In this scene</h6><div class="objs">'+Object.keys(d.obj).map(function(id){return '<button data-sel="'+id+'" class="'+(P.sel===id?'on':'')+'">'+esc(d.nodes[id].label)+'</button>';}).join('')+'</div>';
 pane.innerHTML=h;
 Array.prototype.forEach.call(pane.querySelectorAll('[data-lvl]'),function(b){b.addEventListener('click',function(){P.level=+b.getAttribute('data-lvl');paintExplain();});});
 Array.prototype.forEach.call(pane.querySelectorAll('[data-sel]'),function(b){b.addEventListener('click',function(){const id=b.getAttribute('data-sel');P.sel=P.sel===id?null:id;paintExplain();});});
 const g=pane.querySelector('[data-goguide]');if(g)g.addEventListener('click',function(){P.tab='guide';paintTabs();});
 wireHalls(pane);}
function anchorIdx(key){const E=P.run.events;for(let i=0;i<E.length;i++)if(E[i].key===key)return i;return -1;}
function paintGuide(keepScroll){const pane=$('scnPane'),d=P.def,top=pane.scrollTop;
 const cur=P.chap||'problem';
 let h='<div class="chap">'+d.chapters.map(function(c,i){const a=c.anchor?anchorIdx(c.anchor):-1;
  return '<button data-ch="'+c.id+'" class="'+(c.id===cur?'on':'')+'"><i>'+String(i+1).padStart(2,'0')+'</i>'+esc(c.n)+(a>=0?'<s>▶ step '+(a+1)+'</s>':'')+'</button>';}).join('')+'</div>';
 const ch=d.chapters.filter(function(c){return c.id===cur;})[0];
 h+='<div class="doc" id="scnDoc"><h4>'+esc(ch.n)+'</h4>';
 if(ch.html)h+=ch.html;
 if(ch.rel)h+=relChips(ch.rel)+'<h6>Other stories</h6><div class="objs">'+SC.filter(function(x){return x.id!==d.id;}).map(function(x){return '<button class="chip2" data-story="'+x.id+'">'+x.letter+' · '+esc(x.title)+'</button>';}).join('')+'</div>';
 if(ch.quiz)ch.quiz.forEach(function(q,qi){const ans=P.quiz[qi];
  h+='<div class="quiz"><p>'+esc(q.q)+'</p>'+q.a.map(function(a,ai){const cls=ans==null?'':ai===q.ok?'ok':ai===ans?'no':'';
   return '<button data-q="'+qi+'" data-a="'+ai+'" class="'+cls+'">'+esc(a)+'</button>';}).join('')+(ans!=null?'<div class="fb">'+(ans===q.ok?'<b style="color:var(--ok)">Right.</b> ':'<b style="color:var(--bad)">Not quite.</b> ')+esc(q.why)+'</div>':'')+'</div>';});
 if(ch.anchor&&anchorIdx(ch.anchor)>=0)h+='<button class="vb" data-show="'+ch.anchor+'">▶ Show this in the animation</button> ';
 h+='<button class="vb" data-hall="'+d.hall+'">Go to the 3D exhibit</button></div>';
 pane.innerHTML=h;if(keepScroll)pane.scrollTop=top;
 Array.prototype.forEach.call(pane.querySelectorAll('[data-ch]'),function(b){b.addEventListener('click',function(){
  const id=b.getAttribute('data-ch');P.chap=id;const c=d.chapters.filter(function(x){return x.id===id;})[0];
  if(c.anchor)syncTo(c.anchor);paintGuide();});});
 Array.prototype.forEach.call(pane.querySelectorAll('[data-q]'),function(b){b.addEventListener('click',function(){P.quiz[+b.getAttribute('data-q')]=+b.getAttribute('data-a');paintGuide(true);});});
 Array.prototype.forEach.call(pane.querySelectorAll('[data-show]'),function(b){b.addEventListener('click',function(){syncTo(b.getAttribute('data-show'),true);});});
 Array.prototype.forEach.call(pane.querySelectorAll('[data-hall]'),function(b){b.addEventListener('click',function(){const h2=b.getAttribute('data-hall');close();if(typeof travel==='function')travel(h2);});});
 Array.prototype.forEach.call(pane.querySelectorAll('[data-story]'),function(b){b.addEventListener('click',function(){open(b.getAttribute('data-story'));});});}
/* reading a section moves the animation to it — but never restarts a scene
   that is already showing that section */
function syncTo(key,force){const a=anchorIdx(key);if(a<0)return;
 const E=P.run.events,ci=curIdx();
 let next=E.length;for(let i=a+1;i<E.length;i++)if(E[i].key&&E[i].chapter&&E[i].chapter!==E[a].chapter){next=i;break;}
 if(!force&&ci>=a&&ci<next)return;
 P.pos=a;P.until=a+1;P.playing=true;$('scnEnd').classList.remove('on');}
function paintLab(){const pane=$('scnPane'),d=P.def,m=P.run.metrics;
 let h='<p>Change <b>one</b> decision and the story runs again with the same inputs. The previous run is kept so you can compare the two.</p>';
 d.options.forEach(function(o){h+='<div class="opt"><b>'+esc(o.label)+'</b><div class="seg">'+o.choices.map(function(c){
  return '<button data-opt="'+o.id+'" data-v="'+c[0]+'" class="'+(P.opts[o.id]===c[0]?'on':'')+'">'+esc(c[1])+'</button>';}).join('')+'</div>'+(o.note?'<small>'+esc(o.note)+'</small>':'')+'</div>';});
 h+='<h6>Before and after</h6>';
 h+='<table class="cmp"><tr><th>Metric</th><th>'+(P.base?'Before':'—')+'</th><th>Now</th></tr>'+d.metrics.map(function(k){
  const now=m[k[0]],was=P.base?P.base[k[0]]:null;let cls='';
  if(P.base&&k[3]&&typeof now==='number'&&typeof was==='number'&&now!==was)cls=(k[3]<0?now<was:now>was)?'better':'worse';
  return '<tr><td>'+esc(k[1])+'</td><td>'+(was==null?'—':esc(k[2](was)))+'</td><td class="'+cls+'">'+esc(k[2](now))+'</td></tr>';}).join('')+'</table>';
 if(P.base)h+='<p style="font-size:11.5px;color:var(--faint)">Before: '+esc(optLabel(d,P.baseOpts))+'<br>Now: '+esc(optLabel(d,P.opts))+'</p>';
 else h+='<p style="font-size:11.5px;color:var(--faint)">These are this run\'s final results. Change an option to get a before-and-after comparison.</p>';
 h+='<button class="vb" id="scnSkip">Skip to the result</button> <button class="vb" id="scnRun">Replay this run</button>';
 h+='<h6>Remember</h6><p>Green means better on that metric, not better overall. Each option moves the cost somewhere else, and the Study guide\'s <b>Trade-offs</b> chapter explains where.</p>';
 pane.innerHTML=h;wireOpts(pane);
 $('scnSkip').addEventListener('click',function(){seek(P.run.events.length,false);});
 $('scnRun').addEventListener('click',function(){seek(0,true);});}
function onEnd(){const d=P.def;if(!DONE[d.id]){DONE[d.id]=1;saveDone();}
 const nx=BYS[d.next];const el=$('scnEnd');
 const tk=typeof d.takeaway==='function'?d.takeaway(P.opts,P.run.metrics):d.takeaway;
 el.innerHTML='<h5>Takeaway</h5><p>'+tk+'</p><div class="row"><button class="vb" data-e="lab">Change one decision →</button>'+
  '<button class="vb" data-e="guide">Study guide</button>'+(nx?'<button class="vb" data-e="next">Next: '+nx.letter+' · '+esc(nx.title)+'</button>':'')+
  '<button class="vb" data-e="hall">Back to the 3D exhibit</button></div>';
 el.classList.add('on');
 Array.prototype.forEach.call(el.querySelectorAll('[data-e]'),function(b){b.addEventListener('click',function(){const a=b.getAttribute('data-e');
  if(a==='lab'){P.tab='lab';paintTabs();el.classList.remove('on');}else if(a==='guide'){P.tab='guide';P.chap='trade';paintTabs();}
  else if(a==='next')open(d.next);else{close();if(typeof travel==='function')travel(d.hall);}});});
 if(P.tab==='lab')paintLab();}

$('scnX').addEventListener('click',close);
$('scnAll').addEventListener('click',showPick);
$('scnHall').addEventListener('click',function(){const h=P.def&&P.def.hall;close();if(h&&typeof travel==='function'){travel(h);}});

/* keys while the lab is open: the museum's own bindings are suspended */
addEventListener('keydown',function(ev){if(!SCN.isOpen)return;const k=ev.key;
 if(ev.target&&(ev.target.tagName==='INPUT'||ev.target.tagName==='TEXTAREA'))return;
 const pick=$('scnPick').classList.contains('on');
 if(k==='Escape'){ev.preventDefault();if(pick&&P.def){$('scnPick').classList.remove('on');open(P.def.id);}else close();}
 else if(pick){return;}
 else if(k===' '&&!(ev.target&&ev.target.tagName==='BUTTON')){ev.preventDefault();$('scnPlay').click();}
 else if(k==='ArrowRight'||k==='.'){ev.preventDefault();step(1);}
 else if(k==='ArrowLeft'||k===','){ev.preventDefault();step(-1);}
 else if(k==='Home'){ev.preventDefault();seek(0,false);}
 else if(k==='End'){ev.preventDefault();seek(P.run.events.length,false);}
 else if(k==='['){setSpd(-1);}else if(k===']'){setSpd(1);}
 else if(k==='1'||k==='2'||k==='3'){P.level=+k;P.tab='explain';paintTabs();}
 else if(k==='f'||k==='F'){$('scnFocus').click();}
 ev.stopImmediatePropagation();},true);

/* ---- first visit ---- */
function onboard(){let seenIt=false;try{seenIt=!!localStorage.getItem('mose2.onboarded');}catch(e){}
 if(seenIt)return;$('onb').classList.add('on');}
function onbDone(){try{localStorage.setItem('mose2.onboarded','1');}catch(e){}$('onb').classList.remove('on');}
$('onbGo').addEventListener('click',function(){onbDone();open('order');});
$('onbSkip').addEventListener('click',onbDone);
addEventListener('keydown',function(ev){if($('onb').classList.contains('on')&&ev.key==='Escape'){onbDone();ev.stopImmediatePropagation();}},true);

window.SCN={isOpen:false,open:open,close:close,pick:showPick,onboard:onboard,
 forHall:function(id){return HALL2S[id]?BYS[HALL2S[id]]:null;},forNode:function(n){return NODE2S[n]?BYS[NODE2S[n]]:null;},
 done:function(){return Object.keys(DONE).length;},count:SC.length,list:SC};
})();

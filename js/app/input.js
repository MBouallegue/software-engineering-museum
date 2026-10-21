/* ---- input ---- */
addEventListener('keydown',function(ev){
 const k=ev.key.toLowerCase();
 if(ev.target&&(ev.target.tagName==='INPUT'||ev.target.tagName==='TEXTAREA')&&k!=='escape')return;
 skipIntro();
 if(k==='escape'){if($('settings').classList.contains('on')){toggleSettings(false);return;}
  if(document.body.classList.contains('following')){stopFollowing();return;}
  if(INST.open){INST.close();return;}if(explainFor){closeExplain();return;}closeSheet();return;}
 if(k==='p'){togglePause();return;}
 if(k==='['){setSpeed(-1);return;}
 if(k===']'){setSpeed(1);return;}
 if(k==='o'){PERF.on=!PERF.on;$('perf').classList.toggle('on',PERF.on);return;}
 if(INST.open){
  if(k==='v')INST.close();
  else if(INST.mode==='debug'&&(k==='arrowright'||k==='.')){INST.step(1);ev.preventDefault();}
  else if(INST.mode==='debug'&&(k==='arrowleft'||k===',')){INST.step(-1);ev.preventDefault();}
  else if(k==='f')INST.follow?INST.clearFollow():INST.followOne();
  else{const n=parseInt(k,10);if(n>=1&&n<=IMODES.length)INST.setMode(IMODES[n-1].id);}
  return;}
 if(sheet.classList.contains('on')){if(k==='m')closeSheet();return;}
 if(k==='e'||k==='enter'||k===' '){ev.preventDefault();enterNear();return;}
 const nk=parseInt(k,10),acts=labActs();
 if(acts&&nk>=1&&nk<=acts.length){acts[nk-1].fn();paintLab(false);return;}
 if(k==='m'){openMap();return;}
 if(k==='v'){INST.show();return;}
 if(k==='g'){followOnFloor();return;}
 if(k==='t'){toggleTour();return;}
 if(k==='r'){slideTo(.06);return;}
 if(k==='h'||k==='?'){openHelp();return;}
 if(k==='l'&&window.SCN){SCN.pick();return;}
 keys[k]=1;});
addEventListener('keyup',function(ev){keys[ev.key.toLowerCase()]=0;});
addEventListener('blur',function(){for(const k in keys)keys[k]=0;});

(function stick(){
 const el=$('stick'),kn=$('knob');let id=null,cx=0,cy=0;
 el.addEventListener('pointerdown',function(e){id=e.pointerId;el.setPointerCapture(id);
  const r=el.getBoundingClientRect();cx=r.left+r.width/2;cy=r.top+r.height/2;mv(e);});
 el.addEventListener('pointermove',function(e){if(e.pointerId===id)mv(e);});
 function end(e){if(e.pointerId!==id)return;id=null;inp.x=0;inp.y=0;kn.style.transform='';}
 el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);
 function mv(e){e.preventDefault();
  let dx=e.clientX-cx,dy=e.clientY-cy;const L=Math.hypot(dx,dy),M=42;
  if(L>M){dx*=M/L;dy*=M/L;}
  kn.style.transform='translate('+dx+'px,'+dy+'px)';
  inp.x=dx/M;inp.y=-dy/M;if(tour)toggleTour();}
})();

(function look(){
 const el=$('scene');let id=null,px=0,py=0;
 el.addEventListener('pointerdown',function(e){id=e.pointerId;px=e.clientX;py=e.clientY;
  el.setPointerCapture(id);});
 el.addEventListener('pointermove',function(e){if(e.pointerId!==id)return;
  camYaw-=(e.clientX-px)*.0062;
  camPitch=Math.max(.02,Math.min(.72,camPitch+(e.clientY-py)*.0026));
  px=e.clientX;py=e.clientY;lastDrag=performance.now();});
 function end(e){if(e.pointerId===id)id=null;}
 el.addEventListener('pointerup',end);el.addEventListener('pointercancel',end);
})();

/* ---- the rail: drag to ride the spiral ---- */
let slideTarget=null,railShown=-9;
function slideTo(a){
 skipIntro();slideTarget=Math.max(0,Math.min(A_MAX,a));
 if(tour){tour=false;$('tourBtn').classList.remove('on');}
 closeSheet();}
function buildRail(){
 let h='';
 WINGS.forEach(function(w){
  if(w.id==='hub')return;
  let e=null;EXHIBITS.forEach(function(x){if(!e&&x.wing===w.id)e=x;});
  if(!e)return;
  h+='<button class="tick" data-a="'+e.a.toFixed(3)+'" style="bottom:'+
     ((e.a/A_MAX)*100).toFixed(2)+'%;--c:'+w.color+'"><span>'+
     (w.short||w.name)+'</span><i></i></button>';});
 $('railTicks').innerHTML=h;
 Array.prototype.forEach.call($('railTicks').querySelectorAll('.tick'),function(b){
  b.addEventListener('click',function(ev){ev.stopPropagation();
   slideTo(parseFloat(b.getAttribute('data-a')));});});
 const tr=$('railTrack');let id=null;
 function scrub(ev){
  const r=tr.getBoundingClientRect();
  const f=1-Math.max(0,Math.min(1,(ev.clientY-r.top)/r.height));
  slideTo(f*A_MAX);}
 tr.addEventListener('pointerdown',function(ev){id=ev.pointerId;tr.setPointerCapture(id);
  $('rail').classList.add('live');scrub(ev);ev.stopPropagation();});
 tr.addEventListener('pointermove',function(ev){if(ev.pointerId===id){scrub(ev);ev.stopPropagation();}});
 function end(ev){if(ev.pointerId===id){id=null;
  setTimeout(function(){$('rail').classList.remove('live');},1400);}}
 tr.addEventListener('pointerup',end);tr.addEventListener('pointercancel',end);
 $('railHome').addEventListener('click',function(){slideTo(.06);
  moment('<b>Sliding back to the lobby.</b> The restaurant is under the first turn.');});}
function paintRail(){
 const f=Math.max(0,Math.min(1,P.a/A_MAX))*100;
 if(Math.abs(f-railShown)<.35)return;
 railShown=f;
 $('railFill').style.height=f.toFixed(2)+'%';
 $('railKnob').style.bottom=f.toFixed(2)+'%';}

$('mapBtn').addEventListener('click',openMap);
$('simBtn').addEventListener('click',togglePause);
$('tmPlay').addEventListener('click',function(){
 if(SIM.paused){SIM.paused=false;SIM.userPaused=false;INST.tmT=null;}
 else{SIM.paused=true;INST.tmT=SIM.t;INST.debugPanel();}
 updateSimBtn();});
$('tmRange').addEventListener('input',function(){INST.tmScrub(+this.value);});
$('helpBtn').addEventListener('click',openHelp);
$('storyBtn').addEventListener('click',function(){if(window.SCN)SCN.pick();});
$('setBtn').addEventListener('click',function(ev){ev.stopPropagation();toggleSettings();});
$('tourBtn').addEventListener('click',toggleTour);
$('systemBtn').addEventListener('click',function(){closeSheet();INST.show();});
$('instX').addEventListener('click',function(){INST.close();});
$('instFollow').addEventListener('click',function(){
 INST.follow?INST.clearFollow():INST.followOne();});
$('instFollowData').addEventListener('click',function(){
 (INST.follow&&INST.follow.data)?INST.clearFollow():INST.followData();});
$('instRestore').addEventListener('click',function(){
 SIM.restore();INST.clearFollow();
 INST.buildPanels();INST.gauges();
 INST.say('<b>Restored.</b> Traffic, workers, replicas, cache and index are back to their defaults, and every failure and defence is off. '+
  'Now change <em>one</em> thing and watch which number moves first — that is the whole method.');});
$('sheetX').addEventListener('click',closeSheet);
sheet.addEventListener('click',function(e){if(e.target===sheet)closeSheet();});
function enterNear(){if(!near)return;
 /* the first press explains in place, beside the object; the second goes deeper */
 if(explainFor!==near){openExplain(near);return;}
 closeExplain();
 if(near.go){travel(near.go);moment('<b>'+near.title+'</b> — '+near.sub+'.');}
 else openExhibit(near.id);}
$('enterBtn').addEventListener('click',enterNear);


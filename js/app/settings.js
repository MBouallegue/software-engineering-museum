/* ======================================================================
   SETTINGS — one small panel instead of a row of switches in the top bar.
   Graphics is the only choice most visitors ever need, so it comes first.
   ====================================================================== */
const GFX_NOTE={
 auto:'Picks the best look this device can keep smooth, and steps down on its own if frames drop.',
 high:'Bloom, soft shadows and a reflective atrium floor, always. Needs a capable GPU.',
 fast:'Direct rendering, no post-processing. Best for laptops on battery and older phones.'};

function paintSettings(){
 const seg=$('gfxSeg');if(!seg||!window.GFX)return;
 Array.prototype.forEach.call(seg.children,function(b){b.classList.toggle('on',b.getAttribute('data-gfx')===GFX.mode);});
 $('gfxNote').textContent=GFX_NOTE[GFX.mode]+(GFX.mode==='auto'&&GFX.on?' Now: '+GFX.describe()+'.':'');
 $('perfTog').checked=!!PERF.on;}

function toggleSettings(force){
 const el=$('settings'),on=force===undefined?!el.classList.contains('on'):force;
 el.classList.toggle('on',on);$('setBtn').setAttribute('aria-expanded',on?'true':'false');
 if(on)paintSettings();}

Array.prototype.forEach.call($('gfxSeg').children,function(b){
 b.addEventListener('click',function(){if(window.GFX)GFX.setMode(b.getAttribute('data-gfx'));paintSettings();});});
$('perfTog').addEventListener('change',function(){PERF.on=this.checked;$('perf').classList.toggle('on',PERF.on);});
$('tipsAgain').addEventListener('click',function(){toggleSettings(false);
 try{localStorage.removeItem('mose2.onboarded');}catch(e){}if(window.SCN)SCN.onboard();});
/* a click anywhere else closes it */
addEventListener('pointerdown',function(ev){const el=$('settings');
 if(el.classList.contains('on')&&!el.contains(ev.target)&&ev.target.id!=='setBtn')toggleSettings(false);});

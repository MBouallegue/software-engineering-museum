/* ======================================================================
   LOOP
   ====================================================================== */
const lookAt=new THREE.Vector3(0,1.6,0),camWant=new THREE.Vector3(),_fd=new THREE.Vector3(),_lt=new THREE.Vector3();
let seenPlaza=0,lessonTimer=0;
function showLesson(e){
  if(!e)return;
  const el=$('lesson');
  $('lessonT').textContent=e.title;
  const raw=(e.moment||e.lede||'Watch the installation.').replace(/<[^>]+>/g,'');
  $('lessonS').textContent=raw.length>120?raw.slice(0,117)+'…':raw;
  el.style.setProperty('--acc',WING[e.wing].color);el.classList.add('on');
  clearTimeout(lessonTimer);lessonTimer=setTimeout(function(){el.classList.remove('on');},2600);
}
function projectWorld(v){
  const p=v.clone().project(camera);
  return {x:(p.x*.5+.5)*innerWidth,y:(-.5*p.y+.5)*innerHeight,z:p.z};
}

let lastT=0,lastFloor='';
function tick(ts){
 requestAnimationFrame(tick);
 if(!ready)return;
 const dt=Math.max(0,Math.min(.05,(ts-lastT)/1000));lastT=ts;const t=ts/1000;
 if(window.SCN&&SCN.isOpen)return;          /* the story bench covers the world: stop drawing it */
 const open=sheet.classList.contains('on');

 /* movement */
 let ix=inp.x,iy=inp.y;
 if(!open){
  if(keys.w||keys.arrowup)iy+=1;if(keys.s||keys.arrowdown)iy-=1;
  if(keys.a||keys.arrowleft)ix-=1;if(keys.d||keys.arrowright)ix+=1;}
 const L=Math.hypot(ix,iy);if(L>1){ix/=L;iy/=L;}
 if(L>.05){skipIntro();slideTarget=null;
  if(CAMF.on){CAMF.release();FLOOR.focusNext=false;}
  if(explainFor)closeExplain();}

 if(slideTarget!==null&&!open){
  const d=slideTarget-P.a;
  const step=Math.max(1.3,Math.abs(d)*.95)*dt;
  if(Math.abs(d)<=step){P.a=slideTarget;slideTarget=null;}
  else P.a+=(d<0?-1:1)*step;
  P.plaza=false;
  P.r+=Math.max(-9*dt,Math.min(9*dt,(R_OUT-5.6)-P.r));
  setFromAR();P.hd=(d>=0?-P.a:-P.a+Math.PI);
  if(performance.now()-lastDrag>500)
   camYaw+=wrapPi((Math.PI-P.a)-camYaw)*Math.min(1,dt*2.4);}
 if(L>.05&&tour)toggleTour();

 if(tour&&tourT&&!open){
  const tr=R_OUT-5.6,step=SPEED*.72*dt;
  const da=tourT.a-P.a;
  const ma=Math.min(Math.abs(da),step/tr)*(da<0?-1:1);
  P.a+=ma;P.r+=Math.max(-step,Math.min(step,tr-P.r));
  setFromAR();P.hd=(ma>=0?-P.a:-P.a+Math.PI);
  if(Math.abs(tourT.a-P.a)<.02&&Math.abs(tr-P.r)<.25){toggleTour();}
  if(performance.now()-lastDrag>1200)camYaw+=wrapPi((Math.PI-P.a)-camYaw)*Math.min(1,dt*1.6);
 }else if(L>.05&&!open){
  const fx=-Math.sin(camYaw),fz=-Math.cos(camYaw);
  const rx=-fz,rz=fx;
  const sp=SPEED*dt;
  resolve(P.x+(fx*iy+rx*ix)*sp,P.z+(fz*iy+rz*ix)*sp);
  P.hd=Math.atan2(fx*iy+rx*ix,fz*iy+rz*ix);
  if(performance.now()-lastDrag>2600){
   const wantY=P.plaza?camYaw:(Math.PI-P.a);
   camYaw+=wrapPi(wantY-camYaw)*Math.min(1,dt*.9);}
 }

 /* avatar */
 avatar.position.set(P.x,P.y,P.z);
 avatar.rotation.y+=wrapPi(P.hd-avatar.rotation.y)*Math.min(1,dt*9);
 avatar.children[0].position.y=.55+(RM?0:Math.abs(Math.sin(t*9))*(L>.05?.045:0));
 playerLight.position.set(P.x,P.y+2.6,P.z);


 /* camera */
 if(intro){runIntro(dt);draw3D(dt,t);return;}
 /* A focused object gets framed: the camera stands between it and the
    visitor, a little above, and eases there — no cuts, no teleports. */
 const foc=CAMF.on&&CAMF.get?CAMF.get():null;
 if(foc){
  _fd.set(P.x-foc.x,0,P.z-foc.z);if(_fd.lengthSq()<.01)_fd.set(Math.sin(camYaw),0,Math.cos(camYaw));
  _fd.normalize();
  camWant.set(foc.x+_fd.x*CAMF.dist,foc.y+CAMF.h,foc.z+_fd.z*CAMF.dist);
 }else camWant.set(P.x+Math.sin(camYaw)*6.4,P.y+2.65+camPitch*6.4,P.z+Math.cos(camYaw)*6.4);
 const cr=Math.hypot(camWant.x,camWant.z);
 if(cr>R_OUT-.9){camWant.x*=(R_OUT-.9)/cr;camWant.z*=(R_OUT-.9)/cr;}
 if(camWant.y<P.y+1.8)camWant.y=P.y+1.8;
 camera.position.lerp(camWant,Math.min(1,dt*(foc?2.2:4.4)));
 _lt.set(P.x,P.y+1.75,P.z);if(foc)_lt.copy(foc);
 lookAt.lerp(_lt,Math.min(1,dt*(foc?3:6)));
 camera.lookAt(lookAt);

 /* the core + dust */
 const K=scene.userData.core;
 K.core.rotation.y=t*.075;K.core.rotation.x=t*.04;
 K.core2.rotation.y=-t*.13;K.core2.rotation.z=t*.06;
 K.halo.material.opacity=.24+Math.sin(t*.9)*.07;
 const liveQ=SIM.reqs,nq=Math.min(K.ORB.length,liveQ.length),spd=.12+Math.min(1,SIM.knobs.traffic/300)*.5;
 K.ORB.forEach(function(p,i){p.m.visible=i<nq;if(i>=nq)return;
  const q=liveQ[liveQ.length-1-i],A=t*spd*(p.s+.4)+p.o;
  p.m.position.set(Math.cos(A)*p.r,p.t*.55,Math.sin(A)*p.r);
  p.m.material.color.set(q.status>=500||q.status===429?'#FF5A4A':q.status>=400?'#FFC65C':'#8FE9F5');});
 const hl=SIM.m.health===undefined?1:SIM.m.health;
 K.halo.material.color.setRGB(lerp(1,.26,hl),lerp(.35,.85,hl),lerp(.3,.91,hl));
 if(scene.userData.pathMarkers)scene.userData.pathMarkers.children.forEach(function(m,i){m.material.opacity=(i%7===0?.22+Math.abs(Math.sin(t*2.2+i*.08))*.45:.12);});

 /* installations — only the ones you can see */
 let best=null,bd=6.4;
 RIGLIST.forEach(function(o){
  const e=o.e,d=Math.hypot(P.x-e.pos.x,P.z-e.pos.z)+Math.abs(P.y-e.y)*2.2;
  const act=d<38;
  e.grp.visible=d<96;
  o.r.g.visible=act;
  if(act)o.r.up(t,dt);
  if(e.ring)e.ring.material.opacity=visited[e.id]?.5:(d<7?.3+Math.sin(t*3.4)*.2:.22);
  if(e.panelGlow)e.panelGlow.material.opacity=d<12?.34:.18;
  if(d<bd){bd=d;best=e;}});

 if(P.plaza||P.a<GAP+.5){
  STATIONS.forEach(function(l){
   const d=Math.hypot(P.x-l.pos.x,P.z-l.pos.z)+Math.abs(P.y)*2.4;
   if(d<4.4&&d<bd){bd=d;best=l;}});}

  /* The museum itself teaches: the closest exhibit becomes a small diegetic label,
     while its pavilion pulses as you enter the idea. */
  if(best){
    const wp=best.pos.clone();wp.y+=best.go?2.9:4.9;
    const sp=projectWorld(wp);
    const wl=$('worldLabel');
    if(sp.z>-1&&sp.z<1){wl.style.left=sp.x+'px';wl.style.top=sp.y+'px';wl.classList.add('on');
      $('worldLabelT').textContent=best.title;
      $('worldLabelS').textContent=best.go?(best.sub+' · E'):(WING[best.wing].short+' · '+(best.question||'watch it')+' · E');
    }else wl.classList.remove('on');
    if(best.frame){const pulse=bd<7?(.32+Math.sin(t*3.8)*.14):.08;best.frame.halo.material.opacity=pulse;best.frame.beacon.material.opacity=.06+Math.max(0,7-bd)*.035;}
    if(best!==near && bd<5.2 && best.id)showLesson(best);
  }else $('worldLabel').classList.remove('on');

 /* the system keeps running whether or not you are looking at it —
    that is why the restaurant floor and the control room agree. */
 if(!INST.open)SIM.step(dt);
 runCast(t,dt);
 runRestaurant(t,dt);
 PROPS.update(t,dt);
 runCorridors(t,dt);
 runColumn(t,dt);
 paintRail();
 if(P.plaza&&!seenPlaza){seenPlaza=1;
  moment('<b>The restaurant, running.</b> Every moving light is a real request. Press <b>E</b> at any station to ask why it exists, or <b>G</b> to follow one request end to end.');}

 /* hint + moments */
 near=best;
 /* the lab bar: the installation you are standing at can be changed from here */
 const labE=(near&&near.id&&!near.go&&!open&&!INST.open)?near:null;
 if(labE!==labFor){labFor=labE;paintLab(true);}
 else if(labFor){labTick+=dt;if(labTick>.2){labTick=0;paintLab(false);}}
 paintPerf(dt);
 if(near&&near.id)fireMoment(near);
 const want=(near&&!open)?(near.id||('stn:'+near.go+near.title)):'';
 if(want!==lastHint){lastHint=want;
  const hn=$('hint'),bt=$('enterBtn');
  if(want){hn.classList.add('on');$('hintT').textContent=near.title;
   $('hintS').textContent=near.go?near.sub:WING[near.wing].name;bt.classList.add('on');}
  else{hn.classList.remove('on');bt.classList.remove('on');}}

 /* floor ribbon */
 const fl=P.plaza?'The Restaurant':((near&&near.wing)?WING[near.wing].name:
  ('Level '+(1+Math.min(2,Math.floor(P.a/(Math.PI*2))))+' — the ramp'));
 if(fl!==lastFloor){lastFloor=fl;$('floorpill').textContent=fl;
  $('floorpill').classList.add('on');}

 draw3D(dt,t);}
function draw3D(dt,t){if(window.GFX&&GFX.on)GFX.render(dt,t);else renderer.render(scene,camera);}

addEventListener('resize',function(){
 if(!ready)return;camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
 renderer.setSize(innerWidth,innerHeight,false);if(window.GFX)GFX.resize();});

/* ======================================================================
   BOOT
   ====================================================================== */
function hasWebGL(){try{const c=document.createElement('canvas');
 return !!(window.WebGLRenderingContext&&(c.getContext('webgl')||c.getContext('experimental-webgl')));}
 catch(e){return false;}}

function boot(){
 $('loadBar').style.width='45%';
 loadVisited();
 paintProgress();

 if(!window.THREE||!hasWebGL()){
  $('load').innerHTML='<div class="in"><h1>Reading room</h1>'+
   '<p>This device cannot run the 3D rotunda, so here is the whole collection as an index.</p></div>';
  setTimeout(function(){$('load').classList.add('off');openMap();},420);return;}

 const canvas=$('scene');
 renderer=new THREE.WebGLRenderer({canvas:canvas,antialias:innerWidth>900,powerPreference:'high-performance'});
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,innerWidth>900?2:1.7));
 renderer.setSize(innerWidth,innerHeight,false);
 renderer.outputEncoding=THREE.sRGBEncoding;

 scene=new THREE.Scene();
 scene.background=new THREE.Color(0x05070E);
 scene.fog=new THREE.FogExp2(0x05070E,.0135);
 camera=new THREE.PerspectiveCamera(56,innerWidth/innerHeight,.2,420);

 scene.add(new THREE.AmbientLight(0x1B2746,1.05));
 scene.add(new THREE.HemisphereLight(0x3A4E8A,0x05070E,.5));
 const sun=new THREE.DirectionalLight(0xAFC6FF,.40);sun.position.set(24,64,14);scene.add(sun);
 const rim=new THREE.DirectionalLight(0x7FA8FF,.30);rim.position.set(-30,18,-26);scene.add(rim);
 const fill=new THREE.DirectionalLight(0xFFD2A0,.16);fill.position.set(18,10,-24);scene.add(fill);
 const coreLight=new THREE.PointLight(0x43D9E8,2.3,88,2);coreLight.position.set(0,13,0);scene.add(coreLight);
 playerLight=new THREE.PointLight(0xFFE3BE,1.25,26,2);scene.add(playerLight);

 $('loadBar').style.width='62%';
 buildRotunda();
 buildPathMarkers();
 buildSectionTotems();
 $('loadBar').style.width='82%';
 buildAlcoves();
 buildCast();
 buildRestaurant();
 PROPS.load();                 /* furniture and robots stream in after the first frame */
 buildCorridors();
 buildColumn();
 buildRail();

 /* you */
 avatar=new THREE.Group();
 const bm=new THREE.MeshStandardMaterial({color:0x2B3A5C,emissive:0x1A2A4A,
  emissiveIntensity:.5,roughness:.75});
 const b=new THREE.Mesh(new THREE.CylinderGeometry(.14,.21,1.1,10),bm);b.position.y=.55;avatar.add(b);
 const hd=sph(.16,bm);hd.position.y=1.24;avatar.add(hd);
 const sh=glow(0xFFD9A8,1.9,.32);sh.position.y=.06;avatar.add(sh);
 scene.add(avatar);

 setFromAR();
 camera.position.set(P.x+Math.sin(camYaw)*6.4,P.y+4.4,P.z+Math.cos(camYaw)*6.4);

 $('loadBar').style.width='100%';
 ready=true;lastT=performance.now();
 if(window.GFX)GFX.init();
 if(RM){SIM.userScale=.5;SIM.timeScale=.5;intro=0;}
 updateSimBtn();
 setTimeout(function(){$('load').classList.add('off');
  $('museumTag').classList.add('on');
  moment('<b>Walk up the ramp.</b> Don’t read the museum. Move through it. The rooms act the ideas out.');
  if(window.SCN)SCN.onboard();},520);
 requestAnimationFrame(tick);}

if(document.fonts&&document.fonts.ready){
 let done=false;const go=function(){if(!done){done=true;boot();}};
 document.fonts.ready.then(go);setTimeout(go,2500);
}else boot();

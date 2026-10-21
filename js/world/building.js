/* ======================================================================
   BUILDING THE ROTUNDA
   ====================================================================== */
let scene,camera,renderer,player,avatar,playerLight,ready=false,near=null,visited={},lastHint='';
const RIGLIST=[];const VIS=[];let CHAP=0;
const H_MAX=yAt(A_MAX);

function yDeck(a){return Math.max(0,yAt(Math.min(a,A_MAX)));}

function stripGeo(rows,flip){
 const pos=[],uv=[],idx=[],n=rows.length;
 rows.forEach(function(p,i){pos.push(p[0].x,p[0].y,p[0].z,p[1].x,p[1].y,p[1].z);
  uv.push(i/(n-1),0,i/(n-1),1);});
 for(let i=0;i<n-1;i++){const b=i*2;
  if(flip)idx.push(b,b+1,b+2,b+1,b+3,b+2);
  else idx.push(b,b+2,b+1,b+1,b+2,b+3);}
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
 g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 g.setIndex(idx);g.computeVertexNormals();return g;}

function spiralRows(a0,a1,step,fa,fb){
 const rows=[];
 for(let a=a0;a<=a1+1e-6;a+=step)rows.push([fa(a),fb(a)]);
 return rows;}

/* ---------------- storage ---------------- */
function loadVisited(){try{visited=JSON.parse(localStorage.getItem('mose2.visited')||'{}')||{};}
 catch(e){visited={};}}
function markVisited(id){visited[id]=1;
 try{localStorage.setItem('mose2.visited',JSON.stringify(visited));}catch(e){}
 paintProgress();}
function paintProgress(){const n=Object.keys(visited).length;
 $('prog').textContent=n+' / '+EXHIBITS.length+' halls'+(window.SCN?' · '+SCN.done()+' / '+SCN.count+' stories':'');}

/* ---------------- the building ---------------- */
function buildRotunda(){
 const dt=deckTex();dt.repeat.set(TURNS*28,2.4);
 const deckMat=new THREE.MeshStandardMaterial({map:dt,color:0x93A6C8,roughness:.86,
  metalness:.06,side:THREE.DoubleSide});

 /* walking deck */
 const A0=-0.34,A1=A_MAX+0.78,ST=0.045;
 scene.add(new THREE.Mesh(stripGeo(spiralRows(A0,A1,ST,
   function(a){return polar(a,R_IN,yDeck(a));},
   function(a){return polar(a,R_OUT,yDeck(a));})),deckMat));

 /* soffit: the underside you see from the atrium */
 const soff=new THREE.MeshStandardMaterial({color:0x0A1120,roughness:1,side:THREE.DoubleSide});
 scene.add(new THREE.Mesh(stripGeo(spiralRows(A0,A1,ST*2,
   function(a){return polar(a,R_IN,yDeck(a)-.62);},
   function(a){return polar(a,R_OUT,yDeck(a)-.62);})),soff));
 /* inner fascia band */
 scene.add(new THREE.Mesh(stripGeo(spiralRows(A0,A1,ST,
   function(a){return polar(a,R_IN,yDeck(a));},
   function(a){return polar(a,R_IN,yDeck(a)-.62);})),
   new THREE.MeshStandardMaterial({color:0x121D33,roughness:.8,side:THREE.DoubleSide})));

 /* inner parapet + its glowing rail — the signature spiral of light */
 const par=new THREE.MeshStandardMaterial({color:0x0E1728,roughness:.75,
  metalness:.15,side:THREE.DoubleSide});
 scene.add(new THREE.Mesh(stripGeo(spiralRows(GAP,A1,ST,
   function(a){return polar(a,R_IN+.5,yDeck(a));},
   function(a){return polar(a,R_IN+.5,yDeck(a)+1.06);})),par));
 const rail=new THREE.MeshBasicMaterial({color:0x6FA8FF,transparent:true,opacity:.85,side:THREE.DoubleSide});
 scene.add(new THREE.Mesh(stripGeo(spiralRows(GAP,A1,ST,
   function(a){return polar(a,R_IN+.42,yDeck(a)+1.06);},
   function(a){return polar(a,R_IN+.6,yDeck(a)+1.10);})),rail));

 /* outer wall */
 const wall=new THREE.MeshStandardMaterial({color:0x080E1A,roughness:1,side:THREE.DoubleSide});
 scene.add(new THREE.Mesh(stripGeo(spiralRows(A0,A1,ST,
   function(a){return polar(a,R_OUT,yDeck(a)-.6);},
   function(a){return polar(a,R_OUT,yDeck(a)+8.5);})),wall));
 /* cornice light line on the outer wall */
 scene.add(new THREE.Mesh(stripGeo(spiralRows(A0,A1,ST,
   function(a){return polar(a,R_OUT-.06,yDeck(a)+8.05);},
   function(a){return polar(a,R_OUT-.06,yDeck(a)+8.2);})),
   new THREE.MeshBasicMaterial({color:0x2A4670,side:THREE.DoubleSide})));

 /* plaza floor + outer skirt */
 const pdt=deckTex();pdt.repeat.set(9,9);
 const plaza=new THREE.Mesh(new THREE.CircleGeometry(R_IN+.1,64),
  new THREE.MeshStandardMaterial({map:pdt,color:0x8FA2C4,roughness:.9}));
 plaza.rotation.x=-Math.PI/2;plaza.position.y=0;scene.add(plaza);
 const skirt=new THREE.Mesh(new THREE.RingGeometry(R_OUT,R_OUT+26,48,1),
  new THREE.MeshStandardMaterial({color:0x04060C,roughness:1}));
 skirt.rotation.x=-Math.PI/2;skirt.position.y=-.66;scene.add(skirt);

 /* ceiling + oculus */
 const ceil=new THREE.Mesh(new THREE.CircleGeometry(R_OUT+1,48),
  new THREE.MeshStandardMaterial({color:0x060B16,roughness:1,side:THREE.DoubleSide}));
 ceil.rotation.x=Math.PI/2;ceil.position.y=H_MAX+8.2;scene.add(ceil);
 const oc=new THREE.Mesh(new THREE.RingGeometry(6.4,7.1,48),
  new THREE.MeshBasicMaterial({color:0x4C7FD8,transparent:true,opacity:.6,side:THREE.DoubleSide}));
 oc.rotation.x=Math.PI/2;oc.position.y=H_MAX+8.1;scene.add(oc);

 /* the core in the atrium */
 const coreG=new THREE.Group();coreG.position.set(0,0,0);scene.add(coreG);
 const plinth=cyl(3.2,.9,plain(0x0C1424,.8,.2));plinth.position.y=.45;coreG.add(plinth);
 const ring0=new THREE.Mesh(new THREE.RingGeometry(3.2,3.6,48),
  new THREE.MeshBasicMaterial({color:0x43D9E8,transparent:true,opacity:.5,side:THREE.DoubleSide}));
 ring0.rotation.x=-Math.PI/2;ring0.position.y=.92;coreG.add(ring0);
 const core=new THREE.Mesh(new THREE.IcosahedronGeometry(4.1,1),
  new THREE.MeshBasicMaterial({color:0x43D9E8,wireframe:true,transparent:true,opacity:.42}));
 core.position.y=12.5;coreG.add(core);
 const core2=new THREE.Mesh(new THREE.IcosahedronGeometry(2.1,0),
  new THREE.MeshBasicMaterial({color:0x8FE9F5,transparent:true,opacity:.24}));
 core2.position.y=12.5;coreG.add(core2);
 const halo=glow(0x43D9E8,26,.3);halo.position.y=12.5;coreG.add(halo);
 const shaft=new THREE.Mesh(new THREE.CylinderGeometry(1.15,2.4,H_MAX+8,24,1,true),
  new THREE.MeshBasicMaterial({color:0x2E86C8,transparent:true,opacity:.075,
   side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));
 shaft.position.y=(H_MAX+8)/2;coreG.add(shaft);
 const orbit=new THREE.Group();orbit.position.y=12.5;coreG.add(orbit);
 const ORB=[];
 /* one light per request in flight, coloured by how it ended — the core
    is the live system seen from the atrium, not an ornament */
 for(let i=0;i<26;i++){const p=sph(.14,ownNeon('#8FE9F5',.9));p.visible=false;orbit.add(p);
  ORB.push({m:p,r:5.5+Math.random()*4,s:.22+Math.random()*.4,o:Math.random()*6.28,
   t:(Math.random()*2-1)*6});}
 for(let i=0;i<3;i++){const r=new THREE.Mesh(new THREE.TorusGeometry(6.4+i*1.9,.045,6,64),
  new THREE.MeshBasicMaterial({color:0x43D9E8,transparent:true,opacity:.28}));
  r.rotation.x=Math.PI/2+i*.55;r.rotation.z=i*.8;r.position.y=12.5;coreG.add(r);}
 scene.userData.core={core:core,core2:core2,orbit:orbit,ORB:ORB,halo:halo};

 const coreL=textSprite('THE SYSTEM, LIVE — one light per request in flight','#8FE9F5',30,14);
 coreL.position.set(0,18.4,0);coreG.add(coreL);
}

/* ---------------- the museum architecture ---------------- */
function buildExhibitFrame(g,c){
  // An open pavilion: the visitor walks into the concept rather than up to a poster.
  const postM=plain(0x0B1425,.68,.28), edgeM=neon(c,.55);
  [-3.9,3.9].forEach(function(x){
    const p=box(.22,4.9,.22,postM);p.position.set(x,2.45,4.2);g.add(p);
    const glowP=box(.055,4.4,.055,edgeM);glowP.position.set(x*.98,2.35,4.0);g.add(glowP);
  });
  const top=box(8.0,.18,.22,edgeM);top.position.set(0,4.9,4.2);g.add(top);
  const back=box(8.0,4.7,.08,plain(0x070D18,.95,.08));back.position.set(0,2.5,.35);g.add(back);
  const floor=box(8.4,.045,6.0,neon(c,.13));floor.position.set(0,.03,4.4);g.add(floor);
  const halo=new THREE.Mesh(new THREE.TorusGeometry(3.1,.035,7,64),neon(c,.5));
  halo.rotation.x=Math.PI/2;halo.position.set(0,4.65,4.1);g.add(halo);
  const beacon=glow(c,7,.08);beacon.position.set(0,4.25,4.0);g.add(beacon);
  return {halo:halo,beacon:beacon};
}

function buildPathMarkers(){
  const g=new THREE.Group();scene.add(g);
  for(let i=0;i<170;i++){
    const a=-.12+i*(A_MAX+.25)/169, r=R_IN+2.0, y=yDeck(a)+.035;
    const m=box(.10,.035,.46,neon(i%7===0?'#FFFFFF':'#5C7FC5',i%7===0?.42:.17));
    m.position.set(Math.cos(a)*r,y,Math.sin(a)*r);m.rotation.y=a+Math.PI/2;g.add(m);
  }
  scene.userData.pathMarkers=g;
}

function buildSectionTotems(){
  WINGS.filter(function(w){return w.id!=='hub';}).forEach(function(w,wi){
    const a=(wi+1)*(A_MAX/(WINGS.length));
    const y=yDeck(a);
    const g=new THREE.Group();g.position.copy(polar(a,R_IN+2.3,y));g.rotation.y=-a+Math.PI/2;scene.add(g);
    const stem=box(.09,3.6,.09,neon(w.color,.65));stem.position.y=1.8;g.add(stem);
    const orb=sph(.23,neon(w.color,1));orb.position.y=3.7;g.add(orb);
    const halo=glow(w.color,2.4,.35);halo.position.y=3.7;g.add(halo);
    const tx=textSprite(w.name,w.color,40,5.8);tx.position.set(0,4.45,0);g.add(tx);
    const qx=textSprite((w.guide&&w.guide.question)||w.blurb||'',w.color,24,4.8);qx.position.set(0,3.82,0);g.add(qx);
    g.userData={a:a,orb:orb,halo:halo};
  });
}

/* ---------------- one alcove per hall ---------------- */
function buildAlcoves(){
 let lastWing='';CHAP=0;
 EXHIBITS.forEach(function(e){
  const w=WING[e.wing],C=w.color;
  const g=new THREE.Group();
  g.position.copy(polar(e.a,R_OUT,e.y));g.rotation.y=e.face;scene.add(g);
  e.grp=g;

  /* open pavilion + minimal wall signage */
  e.frame=buildExhibitFrame(g,C);
  const pm=new THREE.MeshBasicMaterial({map:panelTex(e,w),transparent:true});
  const pn=new THREE.Mesh(new THREE.PlaneGeometry(7.4,4.48),pm);
  pn.position.set(0,3.2,.22);g.add(pn);
  const gw=glow(C,11,.2);gw.position.set(0,3.1,.55);g.add(gw);
  e.panelGlow=gw;

  /* plinth + installation */
  const pl=slab3(4.3,2.7,.92,.14,plain(0x0C1424,.72,.18));pl.position.set(0,0,2.7);g.add(pl);
  const psh=contact(6.2,.55);psh.position.set(0,.02,2.7);g.add(psh);
  const trim=box(4.4,.05,2.8,neon(C,.45));trim.position.set(0,.94,2.7);g.add(trim);
  const rig=RIGS[e.id]?RIGS[e.id](C):rigCore(C);
  rig.g.position.set(0,.96,3.35);rig.g.scale.setScalar(1.22);g.add(rig.g);
  RIGLIST.push({e:e,r:rig});

  /* stand-here ring + floor light bar */
  const ring=new THREE.Mesh(new THREE.RingGeometry(1.15,1.32,32),
   new THREE.MeshBasicMaterial({color:C,transparent:true,opacity:.3,side:THREE.DoubleSide}));
  ring.rotation.x=-Math.PI/2;ring.position.set(0,.055,5.95);g.add(ring);e.ring=ring;
  const bar=box(5.4,.04,.1,neon(C,.5));bar.position.set(0,.035,7.25);g.add(bar);

  /* department threshold: a numbered chapter, and the question it answers */
  if(e.wing!==lastWing&&e.wing!=='hub'){
   lastWing=e.wing;CHAP++;
   const no=('0'+CHAP).slice(-2);
   const num=textSprite(no,C,92,2.5);num.position.set(-5.2,6.15,4.2);g.add(num);
   const s=textSprite(w.short||w.name,C,58,8.0);s.position.set(-4.4,5.05,4.2);g.add(s);
   const q=(DEPT_GUIDE[e.wing]||{}).question;
   if(q){const qs=textSprite(q,'#C9D6F0',34,11.5);qs.position.set(-4.0,4.10,4.2);g.add(qs);}
   const gate=box(.16,6.6,.16,neon(C,.55));gate.position.set(-5.7,3.3,7.8);g.add(gate);
   const gate3=box(.16,6.6,.16,neon(C,.3));gate3.position.set(-5.7,3.3,-2.2);g.add(gate3);
   const gate2=box(11.6,.16,.16,neon(C,.4));gate2.position.set(-5.7,6.6,7.8);g.add(gate2);
   const fl=box(.1,.05,11.4,neon(C,.55));fl.position.set(-5.7,.035,6.0);g.add(fl);}
 });}

/* ---------------- other visitors ---------------- */

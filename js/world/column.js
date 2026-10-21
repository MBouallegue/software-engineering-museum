/* ======================================================================
   THE VERTICAL AXIS IS THE ABSTRACTION STACK
   ====================================================================== */
const LAYERS=[
 [0.4 ,'00','TRANSISTORS & LOGIC GATES','#F06FA8'],
 [4.6 ,'01','MACHINE CODE & REGISTERS', '#FF6B5A'],
 [8.6 ,'02','MEMORY HIERARCHY',         '#F5B841'],
 [12.6,'03','DATA STRUCTURES & ALGORITHMS','#43D9E8'],
 [16.6,'04','PROCESSES, THREADS & QUEUES','#3FC1A9'],
 [20.6,'05','SERVICES & PROTOCOLS',      '#6FD08C'],
 [24.6,'06','DISTRIBUTED SYSTEMS',       '#F06FA8']
];
const COL={};
function buildColumn(){
 const G=new THREE.Group();scene.add(G);COL.G=G;COL.rings=[];
 LAYERS.forEach(function(L){
  const ring=new THREE.Mesh(new THREE.TorusGeometry(12.4,.05,6,72),
   ownNeon(L[3],.28));
  ring.rotation.x=Math.PI/2;ring.position.y=L[0];G.add(ring);
  const s=textSprite(L[1]+' — '+L[2],L[3],40,13);
  s.position.set(0,L[0]+.9,0);G.add(s);
  COL.rings.push({m:ring,y:L[0]});});

 /* layer 00, made real: a NAND gate, cycling its truth table */
 const gx=-10.2,gz=-5.2;   /* clear of the payment provider's boundary */
 const body=box(2.6,1.5,.5,lit('#F06FA8',.2,.5));body.position.set(gx,2.2,gz);G.add(body);
 const inA=sph(.26,ownNeon('#FFD166',1));inA.position.set(gx-1.7,2.6,gz);G.add(inA);
 const inB=sph(.26,ownNeon('#FFD166',1));inB.position.set(gx-1.7,1.8,gz);G.add(inB);
 const out=sph(.30,ownNeon('#83C167',1));out.position.set(gx+1.8,2.2,gz);G.add(out);
 [[gx-1.15,2.6],[gx-1.15,1.8]].forEach(function(p){
  const w=box(1.1,.07,.07,ownNeon('#FFD166',.5));w.position.set(p[0],p[1],gz);G.add(w);});
 const w3=box(1.2,.07,.07,ownNeon('#83C167',.5));w3.position.set(gx+1.2,2.2,gz);G.add(w3);
 const st=box(.5,2.2,.5,plain(0x0C1424,.8,.15));st.position.set(gx,1.1,gz);G.add(st);
 const t1=textSprite('NAND','#F06FA8',52,3.4);t1.position.set(gx,4.2,gz);G.add(t1);
 const t2=textSprite('every layer above is built from this','#8FA0FF',30,9.5);
 t2.position.set(gx,3.55,gz);G.add(t2);
 const t3=textSprite('A','#FFD166',38,.9);t3.position.set(gx-2.3,2.6,gz);G.add(t3);
 const t4=textSprite('B','#FFD166',38,.9);t4.position.set(gx-2.3,1.8,gz);G.add(t4);
 const t5=textSprite('Q','#83C167',38,.9);t5.position.set(gx+2.4,2.2,gz);G.add(t5);
 COL.gate={inA:inA,inB:inB,out:out};
 stn(gx,gz+2.4,'The NAND gate','Layer 00 — the one part everything else is built from','bigo','#F06FA8');

 /* the ceiling is the network */
 const NODE=[],PKT=[];
 const cy=H_MAX+7.4;
 for(let i=0;i<10;i++){const a=i*(Math.PI*2/10),r=8+((i*3)%4)*2.2;
  const n=sph(.42,ownNeon('#5B8DEF',.85));
  n.position.set(Math.cos(a)*r,cy,Math.sin(a)*r);G.add(n);NODE.push(n);}
 for(let i=0;i<10;i++){const A=NODE[i].position,B=NODE[(i*3+1)%10].position;
  const d=Math.hypot(B.x-A.x,B.z-A.z);
  const e=box(d,.045,.045,ownNeon('#5B8DEF',.18));
  e.position.set((A.x+B.x)/2,cy,(A.z+B.z)/2);
  e.rotation.y=-Math.atan2(B.z-A.z,B.x-A.x);G.add(e);
  const p=sph(.2,ownNeon('#FFFFFF',.9));G.add(p);
  PKT.push({m:p,A:A,B:B,o:Math.random(),drop:i%4===0});}
 const ns=textSprite('THE NETWORK — every hop can be slow, reordered, or lost','#5B8DEF',34,20);
 ns.position.set(0,cy-1.6,0);G.add(ns);
 COL.PKT=PKT;COL.NODE=NODE;
}
function runColumn(t,dt){
 const g=COL.gate;
 const step=Math.floor(t*.5)%4;
 const A=step&2?1:0,B=step&1?1:0,Q=(A&&B)?0:1;
 g.inA.material.opacity=A?1:.16;g.inB.material.opacity=B?1:.16;
 g.out.material.opacity=Q?1:.16;
 COL.rings.forEach(function(r){
  const near=Math.abs(P.y-r.y)<2.4;
  r.m.material.opacity=near?.7:.2;});
 COL.PKT.forEach(function(p){
  const q=fr(t*.16+p.o);
  const lost=p.drop&&q>.55;
  p.m.position.set(p.A.x+(p.B.x-p.A.x)*q,p.A.y,p.A.z+(p.B.z-p.A.z)*q);
  p.m.material.opacity=lost?0:.9;});
}

/* ======================================================================
   THE OPENING SLIDE
   ====================================================================== */
let intro=1,introT=0;
function skipIntro(){if(intro){intro=0;$('intro').classList.remove('on');}}
function runIntro(dt){
 introT+=dt;
 const p=Math.min(1,introT/5.4),e=1-Math.pow(1-p,3);
 const a=.55+e*1.1,r=30-e*17,y=40-e*33;
 camera.position.set(Math.cos(a)*r,y,Math.sin(a)*r);
 camera.lookAt(0,10-e*8.4,0);
 if(introT>.4)$('intro').classList.add('on');
 if(introT>4.4)$('intro').classList.remove('on');
 if(p>=1)intro=0;
}


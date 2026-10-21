/* ======================================================================
   THE ROTUNDA  —  geometry, materials, installations
   ====================================================================== */
const R_IN=15, R_OUT=27, TURNS=3, RISE=9.2, A_MAX=TURNS*Math.PI*2;
const GAP=0.52;                      /* angular opening into the plaza */
const $=function(id){return document.getElementById(id);};

/* neon repaint of the wing palette */
const WINGCOL={hub:'#8FA0FF',foundations:'#F5B841',complexity:'#43D9E8',dp:'#9B7BE8',data:'#D99A52',
 protocols:'#6FD08C',messaging:'#FF6B5A',tasks:'#3FC1A9',containers:'#5B8DEF',distributed:'#F06FA8'};
WINGS.forEach(function(w){w.color=WINGCOL[w.id]||w.color;});
const WING={};WINGS.forEach(function(w){WING[w.id]=w;});
const BYID={};EXHIBITS.forEach(function(e){BYID[e.id]=e;});

function yAt(a){return Math.max(0,a-0.55)/(Math.PI*2)*RISE;}
function polar(a,r,y){return new THREE.Vector3(Math.cos(a)*r,y||0,Math.sin(a)*r);}
function wrapPi(d){while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;return d;}

/* exhibit placement along the spiral */
EXHIBITS.forEach(function(e,i){
 e.n=i;
 const span=Math.max(.55,(A_MAX-1.15)/Math.max(1,EXHIBITS.length-2));
 e.a = (i===0) ? 0.30 : 1.05+(i-1)*span;
 e.y = yAt(e.a);
 e.pos = polar(e.a, R_OUT-3.8, e.y+1.0);
 e.face = -e.a-Math.PI/2;
});

/* ---------------- materials ---------------- */
const MATS={};
function lit(hex,emi,rough){const k=hex+'|'+emi+'|'+(rough||0);
 if(MATS[k])return MATS[k];
 return MATS[k]=new THREE.MeshStandardMaterial({color:hex,emissive:hex,
  emissiveIntensity:emi,roughness:rough===undefined?.55:rough,metalness:.08});}
function ownLit(hex,emi,rough){return new THREE.MeshStandardMaterial({color:hex,emissive:hex,
 emissiveIntensity:emi,roughness:rough===undefined?.55:rough,metalness:.08});}
function ownNeon(hex,op){return new THREE.MeshBasicMaterial({color:hex,transparent:true,
 opacity:op===undefined?1:op});}
function plain(hex,rough,metal){const k='p'+hex+rough+metal;
 if(MATS[k])return MATS[k];
 return MATS[k]=new THREE.MeshStandardMaterial({color:hex,roughness:rough===undefined?.9:rough,
  metalness:metal===undefined?.05:metal});}
function neon(hex,op){const k='n'+hex+op;
 if(MATS[k])return MATS[k];
 return MATS[k]=new THREE.MeshBasicMaterial({color:hex,transparent:op<1,opacity:op===undefined?1:op});}

/* ---- nicer primitives: rounded, bevelled, with something under them ---- */
function roundShape(w,d,r){
 const s=new THREE.Shape(),x=-w/2,y=-d/2;
 s.moveTo(x+r,y);
 s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);
 s.lineTo(x+w,y+d-r);s.quadraticCurveTo(x+w,y+d,x+w-r,y+d);
 s.lineTo(x+r,y+d);s.quadraticCurveTo(x,y+d,x,y+d-r);
 s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);
 return s;}
const SLABC={};
function slab3(w,d,h,r,mat){
 const k=w+'|'+d+'|'+h+'|'+r;
 let g=SLABC[k];
 if(!g){g=new THREE.ExtrudeGeometry(roundShape(w,d,Math.min(r,Math.min(w,d)/2-.01)),
  {depth:Math.max(.02,h-.07),bevelEnabled:true,bevelSize:.034,bevelThickness:.034,
   bevelSegments:2,curveSegments:5});
  g.translate(0,0,.034);SLABC[k]=g;}
 const m=new THREE.Mesh(g,mat);m.rotation.x=-Math.PI/2;return m;}


let SHTEX=null;
function shadowTex(){if(SHTEX)return SHTEX;
 const c=cv(96,96),x=c.getContext('2d');
 const g=x.createRadialGradient(48,48,0,48,48,48);
 g.addColorStop(0,'rgba(0,0,0,.85)');g.addColorStop(.55,'rgba(0,0,0,.34)');
 g.addColorStop(1,'rgba(0,0,0,0)');
 x.fillStyle=g;x.fillRect(0,0,96,96);
 return SHTEX=new THREE.CanvasTexture(c);}
let SHGEO=null;
function contact(size,op){
 if(!SHGEO)SHGEO=new THREE.PlaneGeometry(1,1);
 const m=new THREE.Mesh(SHGEO,new THREE.MeshBasicMaterial({map:shadowTex(),
  transparent:true,opacity:op===undefined?.5:op,depthWrite:false,color:0x000000}));
 m.rotation.x=-Math.PI/2;m.position.y=.015;m.scale.set(size,size,1);return m;}

const GEO={
 box:new THREE.BoxGeometry(1,1,1),
 sph:new THREE.SphereGeometry(.5,14,10),
 cyl:new THREE.CylinderGeometry(.5,.5,1,16),
 cone:new THREE.ConeGeometry(.5,1,16),
 tor:new THREE.TorusGeometry(.5,.06,8,36),
 oct:new THREE.OctahedronGeometry(.5,0)
};
function box(w,h,d,m){const x=new THREE.Mesh(GEO.box,m);x.scale.set(w,h,d);return x;}
function sph(r,m){const x=new THREE.Mesh(GEO.sph,m);x.scale.setScalar(r*2);return x;}
function cyl(r,h,m){const x=new THREE.Mesh(GEO.cyl,m);x.scale.set(r*2,h,r*2);return x;}

/* ---------------- canvas textures ---------------- */
function cv(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}

let GLOWTEX=null;
function glowTex(){if(GLOWTEX)return GLOWTEX;
 const c=cv(128,128),x=c.getContext('2d');
 const g=x.createRadialGradient(64,64,0,64,64,64);
 g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.35,'rgba(255,255,255,.38)');
 g.addColorStop(1,'rgba(255,255,255,0)');
 x.fillStyle=g;x.fillRect(0,0,128,128);
 return GLOWTEX=new THREE.CanvasTexture(c);}
function glow(hex,size,op){
 const s=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex(),color:hex,
  transparent:true,opacity:op===undefined?.5:op,blending:THREE.AdditiveBlending,depthWrite:false}));
 s.scale.set(size,size,1);return s;}

function deckTex(){
 const c=cv(256,256),x=c.getContext('2d');
 x.fillStyle='#0C1220';x.fillRect(0,0,256,256);
 x.strokeStyle='rgba(120,160,230,.075)';x.lineWidth=1.4;
 for(let i=0;i<=256;i+=32){x.beginPath();x.moveTo(i,0);x.lineTo(i,256);x.stroke();
  x.beginPath();x.moveTo(0,i);x.lineTo(256,i);x.stroke();}
 x.fillStyle='rgba(255,255,255,.02)';
 for(let i=0;i<300;i++)x.fillRect(Math.random()*256,Math.random()*256,1.4,1.4);
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;return t;}

function strip(text,n){
 const s=text.replace(/<[^>]+>/g,'').replace(/&nbsp;/g,' ').trim();
 return s.length>n?s.slice(0,n-1).replace(/[ ,;.]+$/,'')+'…':s;}

/* the big glowing wall panel behind each installation */
function panelTex(e,w){
 const W=1024,H=620,c=cv(W,H),x=c.getContext('2d');
 const g=x.createLinearGradient(0,0,0,H);
 g.addColorStop(0,'#101B31');g.addColorStop(1,'#08101D');
 x.fillStyle=g;x.fillRect(0,0,W,H);
 const g2=x.createRadialGradient(W*.18,H*.12,8,W*.18,H*.12,W*.82);
 g2.addColorStop(0,w.color+'55');g2.addColorStop(1,'rgba(0,0,0,0)');
 x.fillStyle=g2;x.fillRect(0,0,W,H);
 x.strokeStyle=w.color;x.lineWidth=5;x.globalAlpha=.85;x.strokeRect(2.5,2.5,W-5,H-5);x.globalAlpha=1;
 x.fillStyle=w.color;x.fillRect(0,0,W,7);
 x.font='600 28px "JetBrains Mono",monospace';x.fillStyle=w.color;
 x.fillText(String(e.n).padStart(2,'0'),54,82);
 x.font='600 22px "JetBrains Mono",monospace';x.fillStyle='rgba(180,200,235,.48)';
 x.fillText(w.name,116,82);
 x.font='700 68px "Space Grotesk",sans-serif';x.fillStyle='#F2F7FF';
 let ttl=e.title;if(x.measureText(ttl).width>W-108){x.font='700 52px "Space Grotesk",sans-serif';}
 x.fillText(ttl,52,196);
 x.strokeStyle='rgba(120,160,230,.18)';x.lineWidth=2;x.beginPath();x.moveTo(52,235);x.lineTo(W-52,235);x.stroke();
 x.font='500 28px "Space Grotesk",sans-serif';x.fillStyle=w.color;
 x.fillText('WATCH IT  ·  TRY IT  ·  NAME IT',52,302);
 x.font='400 27px Inter,sans-serif';x.fillStyle='#A9BBDA';
 const hint=(e.question||e.moment||e.lede||'Watch the installation.').replace(/<[^>]+>/g,'');
 wrapText(x,hint.slice(0,120),52,350,W-104,39);
 x.font='500 21px "JetBrains Mono",monospace';x.fillStyle='rgba(210,225,255,.45)';
 x.fillText('ENTER  →  SIMPLE GUIDE  →  REFERENCE',52,522);
 const t=new THREE.CanvasTexture(c);t.anisotropy=4;return t;}
function wrapText(x,s,px,py,mw,lh){
 const words=s.split(' ');let line='',yy=py;
 for(let i=0;i<words.length;i++){const t=line+words[i]+' ';
  if(x.measureText(t).width>mw&&line){x.fillText(line,px,yy);line=words[i]+' ';yy+=lh;
   if(yy>py+lh*3)break;}else line=t;}
 x.fillText(line,px,yy);}

/* floating text sprite */
function textSprite(text,color,px,scale){
 const f=px||64,c=cv(1024,180),x=c.getContext('2d');
 x.font='700 '+f+'px "Space Grotesk",sans-serif';x.textAlign='center';x.textBaseline='middle';
 x.shadowColor=color;x.shadowBlur=26;x.fillStyle=color;x.fillText(text,512,90);
 x.shadowBlur=0;x.fillStyle='#FFFFFF';x.globalAlpha=.9;x.fillText(text,512,90);
 const s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),
  transparent:true,depthWrite:false}));
 const k=scale||6;s.scale.set(k,k*180/1024,1);return s;}


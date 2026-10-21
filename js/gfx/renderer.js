/* ======================================================================
   GRAPHICS — the rendering layer.
   Everything here is additive and optional: if the post-processing
   add-ons fail to load, the museum renders exactly as it did before.

   The visitor picks one of three modes in Settings: Auto, High or Fast.
   Underneath, three tiers do the work:
     low     direct render, environment reflections, light cones, dust
     medium  + HDR composer, bloom, colour grade, FXAA, soft shadows (1k)
     high    + full pixel ratio, 2k shadows, a polished atrium floor that reflects
   High pins the top tier, Fast pins the bottom one, and Auto starts at what
   the device can likely afford and steps down quietly if frames drop.
   (No MSAA: a multisampled half-float target resolves thin additive lines
    into green speckles on some GPUs. FXAA at a higher pixel ratio is clean.)
   ====================================================================== */
(function(){
const G=window.GFX={on:false,q:'medium',mode:'auto',ready:false};
const MKEY='mose2.graphics';
const ORDER=['low','medium','high'];
let composer=null,rt=null,renderPass,bloom,grade,fxaa,key,reflector=null,dust,coreFX,envRT;
const cones=[];let fpsAcc=0,fpsN=0,fpsCool=0;
const _w=new THREE.Vector3();

function hasPost(){return !!(THREE.EffectComposer&&THREE.RenderPass&&THREE.ShaderPass&&THREE.UnrealBloomPass);}
function deviceTier(){
 const touch=matchMedia&&matchMedia('(pointer:coarse)').matches;
 if(touch||innerWidth<900)return 'low';
 return (window.devicePixelRatio||1)>1.6?'medium':'high';}
function tierFor(mode){return mode==='high'?'high':mode==='fast'?'low':deviceTier();}
function savedMode(){
 const m=/[?&]graphics=(auto|high|fast)/.exec(location.search);if(m)return m[1];
 try{const v=localStorage.getItem(MKEY);if(v==='auto'||v==='high'||v==='fast')return v;}catch(e){}
 return 'auto';}

/* ---------------- the environment: what metal and glass reflect ---------------- */
function buildEnvironment(){
 const pm=new THREE.PMREMGenerator(renderer);
 const es=new THREE.Scene();
 const sky=new THREE.Mesh(new THREE.SphereGeometry(60,48,24),new THREE.ShaderMaterial({side:THREE.BackSide,depthWrite:false,
  vertexShader:'varying vec3 vP;void main(){vP=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'varying vec3 vP;void main(){float h=normalize(vP).y;'+
   'vec3 c=mix(vec3(.006,.009,.02),vec3(.035,.06,.12),smoothstep(-.3,.75,h));'+
   'c+=vec3(.02,.05,.09)*exp(-abs(h-.05)*9.);gl_FragColor=linearToOutputTexel(vec4(c,1.));}'}));
 es.add(sky);
 /* the oculus: a ring of cold light overhead */
 const ring=new THREE.Mesh(new THREE.TorusGeometry(16,2.2,12,64),new THREE.MeshBasicMaterial({color:new THREE.Color(0x6FB8FF).multiplyScalar(3.2)}));
 ring.rotation.x=Math.PI/2;ring.position.y=40;es.add(ring);
 /* warm and cool panels at the horizon, like gallery lighting */
 [[0xFFB36B,0,2.4],[0x43D9E8,2.1,2.0],[0x9B7BE8,4.2,1.6]].forEach(function(p){
  const m=new THREE.Mesh(new THREE.PlaneGeometry(26,6),new THREE.MeshBasicMaterial({color:new THREE.Color(p[0]).multiplyScalar(p[2]),side:THREE.DoubleSide}));
  m.position.set(Math.cos(p[1])*50,6,Math.sin(p[1])*50);m.lookAt(0,6,0);es.add(m);});
 envRT=pm.fromScene(es,.035);pm.dispose();
 scene.environment=envRT.texture;
 const seen=new Set();
 scene.traverse(function(o){const m=o.material;if(!m||!m.isMeshStandardMaterial||seen.has(m))return;seen.add(m);
  /* anything already a little metallic becomes properly metallic: frames,
     plinths, posts. Matte things stay matte, just less flat. */
  if(m.metalness>=.15){m.metalness=Math.max(m.metalness,.6);m.roughness=Math.min(m.roughness,.42);m.envMapIntensity=1.15;}
  else m.envMapIntensity=.3;
  m.needsUpdate=true;});}

/* ---------------- shadows from a key light that travels with you ---------------- */
function buildKeyLight(){
 key=new THREE.DirectionalLight(0xD8E4FF,.55);
 key.castShadow=true;
 const c=key.shadow.camera;c.left=-15;c.right=15;c.top=15;c.bottom=-15;
 /* near/far keep the floors above you out of the shadow pass */
 c.near=9;c.far=30;key.shadow.bias=-.0006;key.shadow.normalBias=.035;
 scene.add(key);scene.add(key.target);
 const ws=new THREE.Vector3();
 /* the shadow pass is the expensive part of this renderer, so only things
    big enough to read cast, and only surfaces you stand on or look at receive */
 scene.traverse(function(o){if(!o.isMesh||!o.material||!o.material.isMeshStandardMaterial)return;
  if(!o.geometry.boundingSphere)o.geometry.computeBoundingSphere();
  o.getWorldScale(ws);
  const R=o.geometry.boundingSphere.radius*Math.max(ws.x,ws.y,ws.z);
  o.castShadow=R>.45&&R<5;o.receiveShadow=R>1.4;});
 if(avatar)avatar.traverse(function(o){if(o.isMesh)o.castShadow=true;});}
let shadowTick=0;
function placeKey(cx,cy,cz){
 const s=.25;cx=Math.round(cx/s)*s;cz=Math.round(cz/s)*s;cy=Math.round(cy/s)*s;   /* snap: no shimmering edges */
 /* refresh the shadow map every 2nd (high) or 3rd (medium) frame, and at once when the light moves */
 const moved=key.target.position.x!==cx||key.target.position.y!==cy||key.target.position.z!==cz;
 shadowTick++;if(moved||shadowTick%(G.q==='high'?2:3)===0)renderer.shadowMap.needsUpdate=true;
 key.position.set(cx+6.5,cy+17,cz+4.5);key.target.position.set(cx,cy,cz);key.target.updateMatrixWorld();}

/* ---------------- light cones: a spotlight over every installation ---------------- */
const CONE_V='varying vec2 vUv;varying vec3 vN;varying vec3 vV;varying float vD;'+
 'void main(){vUv=uv;vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);vD=-mv.z;gl_Position=projectionMatrix*mv;}';
const CONE_F='uniform vec3 color;uniform float k;uniform float time;varying vec2 vUv;varying vec3 vN;varying vec3 vV;varying float vD;'+
 'void main(){float edge=pow(abs(dot(vN,vV)),1.6);float fall=pow(vUv.y,1.35);'+
 'float shimmer=.86+.14*sin(vUv.x*40.+time*.7+vUv.y*9.);'+
 'float far=1.-smoothstep(26.,60.,vD);'+
 'gl_FragColor=linearToOutputTexel(vec4(color*edge*fall*shimmer*k*far*.32,1.));}';
function buildCones(){
 EXHIBITS.forEach(function(e){if(!e.grp)return;
  const m=new THREE.ShaderMaterial({uniforms:{color:{value:new THREE.Color(WING[e.wing].color)},k:{value:.4},time:{value:0}},
   vertexShader:CONE_V,fragmentShader:CONE_F,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide});
  const c=new THREE.Mesh(new THREE.CylinderGeometry(.42,2.75,4.55,40,1,true),m);
  c.position.set(0,2.36,3.15);c.renderOrder=2;e.grp.add(c);
  cones.push({e:e,m:m,k:.4});});}

/* ---------------- dust in the light of the atrium ---------------- */
function buildDust(){
 const N=1500,pos=new Float32Array(N*3),seed=new Float32Array(N);
 for(let i=0;i<N;i++){const a=Math.random()*Math.PI*2,r=Math.sqrt(Math.random())*(R_OUT-1.2);
  pos[i*3]=Math.cos(a)*r;pos[i*3+1]=Math.random()*(H_MAX+8);pos[i*3+2]=Math.sin(a)*r;seed[i]=Math.random();}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('seed',new THREE.BufferAttribute(seed,1));
 const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  uniforms:{time:{value:0},px:{value:renderer.getPixelRatio()},top:{value:H_MAX+8}},
  vertexShader:'attribute float seed;uniform float time;uniform float px;uniform float top;varying float vA;'+
   'void main(){vec3 p=position;p.y=mod(p.y+time*(.06+seed*.12),top);'+
   'p.x+=sin(time*.21+seed*31.)*.7;p.z+=cos(time*.17+seed*17.)*.7;'+
   'vec4 mv=modelViewMatrix*vec4(p,1.);gl_PointSize=px*(26.+seed*40.)/max(1.,-mv.z);'+
   'vA=(1.-smoothstep(8.,42.,-mv.z))*smoothstep(.5,3.,-mv.z)*(.25+.75*seed);gl_Position=projectionMatrix*mv;}',
  fragmentShader:'varying float vA;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,0.,d);'+
   'gl_FragColor=linearToOutputTexel(vec4(vec3(.75,.85,1.)*a*vA*.22,1.));}'});
 dust=new THREE.Points(g,m);dust.frustumCulled=false;scene.add(dust);}

/* ---------------- the core: a living surface instead of a flat sphere ---------------- */
function buildCore(){const K=scene.userData.core;if(!K)return;
 const m=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  uniforms:{time:{value:0},pulse:{value:0},health:{value:1}},
  vertexShader:'varying vec3 vN;varying vec3 vV;varying vec3 vP;void main(){vP=position;vec4 mv=modelViewMatrix*vec4(position,1.);'+
   'vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
  fragmentShader:'uniform float time;uniform float pulse;uniform float health;varying vec3 vN;varying vec3 vV;varying vec3 vP;'+
   'void main(){float f=1.-abs(dot(vN,vV));float rim=pow(f,2.4);'+
   'vec3 n=normalize(vP);float lon=atan(n.z,n.x)/6.2831853+.5;float lat=n.y*.5+.5;'+
   'float grid=max(smoothstep(.06,0.,abs(fract(lon*28.+time*.02)-.5)-.44),smoothstep(.06,0.,abs(fract(lat*14.)-.5)-.44));'+
   'float band=smoothstep(.0,.06,.06-abs(fract(lat*3.-time*.18)-.5)+.0);'+
   'vec3 ok=vec3(.26,.85,.91),bad=vec3(1.,.35,.3);vec3 c=mix(bad,ok,health);'+
   'float a=rim*(.9+pulse*.8)+grid*rim*.55+band*.35*(.4+pulse);'+
   'gl_FragColor=linearToOutputTexel(vec4(c*a,1.));}'});
 coreFX=new THREE.Mesh(new THREE.SphereGeometry(2.35,64,32),m);coreFX.position.y=12.5;K.core.parent.add(coreFX);
 K.core2.visible=false;}

/* ---------------- labels fade with distance: the far side is no longer a wall of text ---------------- */
function tagLabels(){
 scene.traverse(function(o){if(!o.isSprite||!o.material||!o.material.map||o.material.blending===THREE.AdditiveBlending)return;
  const big=o.scale.x>=3;const near=big?24:9,far=big?52:20;
  o.onBeforeRender=function(r,s,cam){this.updateMatrixWorld();_w.setFromMatrixPosition(this.matrixWorld);
   const d=_w.distanceTo(cam.position),f=1-Math.min(1,Math.max(0,(d-near)/(far-near)));
   this.userData._o=this.material.opacity;this.material.opacity*=f*f*(3-2*f);};
  o.onAfterRender=function(){if(this.userData._o!=null)this.material.opacity=this.userData._o;};});}

/* ---------------- the polished atrium floor ---------------- */
const REF_SHADER={uniforms:{color:{value:null},tDiffuse:{value:null},textureMatrix:{value:null},camPos:{value:new THREE.Vector3()},R:{value:14},strength:{value:.42}},
 vertexShader:'uniform mat4 textureMatrix;varying vec4 vUv;varying vec3 vW;void main(){vUv=textureMatrix*vec4(position,1.);'+
  'vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
 fragmentShader:'uniform vec3 color;uniform sampler2D tDiffuse;uniform vec3 camPos;uniform float R;uniform float strength;varying vec4 vUv;varying vec3 vW;'+
  'void main(){vec2 p=vUv.xy/vUv.w;float o=.0022;'+
  'vec3 c=texture2D(tDiffuse,p).rgb*.36+(texture2D(tDiffuse,p+vec2(o,0.)).rgb+texture2D(tDiffuse,p-vec2(o,0.)).rgb+texture2D(tDiffuse,p+vec2(0.,o)).rgb+texture2D(tDiffuse,p-vec2(0.,o)).rgb)*.16;'+
  'vec3 v=normalize(camPos-vW);float fres=.3+.7*pow(1.-clamp(v.y,0.,1.),3.);'+
  'float edge=1.-smoothstep(.82,1.,length(vW.xz)/R);'+
  'gl_FragColor=vec4(c*color,strength*fres*edge);}'};
function ensureReflector(){if(reflector||!THREE.Reflector)return;
 const pr=renderer.getPixelRatio();
 reflector=new THREE.Reflector(new THREE.CircleGeometry(R_IN,72),{clipBias:.003,color:0xB8C8E8,
  textureWidth:Math.round(innerWidth*pr*.5),textureHeight:Math.round(innerHeight*pr*.5),shader:REF_SHADER});
 reflector.material.transparent=true;reflector.material.depthWrite=false;
 reflector.material.uniforms.R.value=R_IN;
 reflector.rotation.x=-Math.PI/2;reflector.position.y=.012;reflector.renderOrder=1;scene.add(reflector);}

/* ---------------- post-processing ---------------- */
const GRADE={uniforms:{tDiffuse:{value:null},time:{value:0},res:{value:new THREE.Vector2(1,1)},grain:{value:.028},vig:{value:.42},ca:{value:1},expo:{value:.9},sat:{value:1.12},con:{value:1.1}},
 vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
 fragmentShader:'uniform sampler2D tDiffuse;uniform float time;uniform vec2 res;uniform float grain;uniform float vig;uniform float ca;uniform float expo;uniform float sat;uniform float con;varying vec2 vUv;'+
  'float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}'+
  'vec3 shoulder(vec3 x){vec3 t=max(x-.78,0.);return min(x,.78)+t/(1.+t*4.6);}'+
  'vec3 toSRGB(vec3 c){return mix(c*12.92,1.055*pow(c,vec3(1./2.4))-.055,step(.0031308,c));}'+
  'void main(){vec2 d=vUv-.5;float r2=dot(d,d);vec2 o=d*r2*.012*ca;'+
  'vec3 c=vec3(texture2D(tDiffuse,vUv+o).r,texture2D(tDiffuse,vUv).g,texture2D(tDiffuse,vUv-o).b);'+
  'c=toSRGB(shoulder(max(c*expo,0.)));'+
  /* grade: a touch of contrast and saturation, cool shadows, warm highlights */
  'float l=dot(c,vec3(.2126,.7152,.0722));c=mix(vec3(l),c,sat);c=(c-.5)*con+.5;'+
  'c+=mix(vec3(-.006,.0,.018),vec3(.018,.008,-.012),smoothstep(.2,.8,l));'+
  'c*=mix(1.,smoothstep(.95,.18,length(d*vec2(1.,.82))),vig);'+
  'c+=(hash(vUv*res+fract(time)*91.7)-.5)*grain;'+
  'gl_FragColor=vec4(c,1.);}'};
function buildComposer(){
 if(composer){composer.renderTarget1.dispose();composer.renderTarget2.dispose();composer=null;}
 const pr=renderer.getPixelRatio(),w=innerWidth*pr,h=innerHeight*pr;
 const gl2=renderer.capabilities.isWebGL2;
 const opt={minFilter:THREE.LinearFilter,magFilter:THREE.LinearFilter,format:THREE.RGBAFormat,type:gl2?THREE.HalfFloatType:THREE.UnsignedByteType};
 /* HDR targets: the scene is dark, and 8-bit linear targets band badly in the dark */
 rt=new THREE.WebGLRenderTarget(w,h,opt);
 composer=new THREE.EffectComposer(renderer,rt);
 renderPass=new THREE.RenderPass(scene,camera);composer.addPass(renderPass);
 bloom=new THREE.UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.36,.36,.88);composer.addPass(bloom);
 grade=new THREE.ShaderPass(GRADE);composer.addPass(grade);
 fxaa=THREE.FXAAShader?new THREE.ShaderPass(THREE.FXAAShader):null;
 if(fxaa)composer.addPass(fxaa);
 composer.setPixelRatio(pr);composer.setSize(innerWidth,innerHeight);sizePasses();}
function sizePasses(){if(!composer)return;const pr=renderer.getPixelRatio();
 grade.uniforms.res.value.set(innerWidth*pr,innerHeight*pr);
 if(fxaa)fxaa.material.uniforms.resolution.value.set(1/(innerWidth*pr),1/(innerHeight*pr));}

/* ---------------- quality ---------------- */
function apply(q){G.q=q;
 const post=q!=='low'&&hasPost();
 const pr=Math.min(window.devicePixelRatio||1,q==='high'?2:q==='medium'?1.5:1.25);
 renderer.setPixelRatio(pr);renderer.setSize(innerWidth,innerHeight,false);
 renderer.shadowMap.enabled=q!=='low';renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;
 renderer.shadowMap.type=q==='high'?THREE.PCFSoftShadowMap:THREE.PCFShadowMap;
 key.castShadow=q!=='low';
 const ms=q==='high'?2048:1024;
 if(key.shadow.mapSize.x!==ms){key.shadow.mapSize.set(ms,ms);if(key.shadow.map){key.shadow.map.dispose();key.shadow.map=null;}}
 if(post)buildComposer();else if(composer){composer.renderTarget1.dispose();composer.renderTarget2.dispose();composer=null;}
 /* with the environment map and real shadows doing the fill, the old flat
    ambient wash only lowers contrast */
 FILL.forEach(function(f){f.l.intensity=f.base*(post?f.post:.85);});
 if(q==='high')ensureReflector();
 if(reflector)reflector.visible=q==='high';
 if(dust)dust.material.uniforms.px.value=pr;
 scene.traverse(function(o){if(o.material&&!o.material.isShaderMaterial)o.material.needsUpdate=true;});
 G.on=true;
 if(typeof paintSettings==='function')paintSettings();}
/* Auto, High or Fast: the only graphics choice a visitor has to make */
G.setMode=function(mode){G.mode=mode;try{localStorage.setItem(MKEY,mode);}catch(e){}fpsCool=8;apply(tierFor(mode));};
G.describe=function(){return {low:'direct rendering',medium:'bloom and soft shadows',
 high:'bloom, 2k shadows and a reflective floor'}[G.q];};
G.refreshShadows=function(){if(G.ready)renderer.shadowMap.needsUpdate=true;};

const FILL=[];
G.init=function(){
 if(G.ready||typeof renderer==='undefined'||!renderer||!scene)return;G.ready=true;
 scene.children.forEach(function(o){if(o.isAmbientLight)FILL.push({l:o,base:o.intensity,post:.45});
  else if(o.isHemisphereLight)FILL.push({l:o,base:o.intensity,post:.55});});
 buildEnvironment();buildKeyLight();buildCones();buildDust();buildCore();tagLabels();
 G.mode=savedMode();apply(tierFor(G.mode));};

G.resize=function(){if(!G.on)return;
 if(composer){composer.setPixelRatio(renderer.getPixelRatio());composer.setSize(innerWidth,innerHeight);sizePasses();}
 if(reflector){const pr=renderer.getPixelRatio();reflector.getRenderTarget().setSize(Math.round(innerWidth*pr*.5),Math.round(innerHeight*pr*.5));}};

/* ---------------- per frame ---------------- */
G.render=function(dt,t){
 cones.forEach(function(c){const want=(typeof near!=='undefined'&&near===c.e)?1.25:(visited[c.e.id]?.55:.38);
  c.k+=(want-c.k)*Math.min(1,dt*3);c.m.uniforms.k.value=c.k;c.m.uniforms.time.value=t;});
 if(dust)dust.material.uniforms.time.value=RM?0:t;
 if(coreFX){const u=coreFX.material.uniforms;u.time.value=t;
  const live=SIM&&SIM.reqs?SIM.reqs.length:0;u.pulse.value+=(Math.min(1,live/18)-u.pulse.value)*Math.min(1,dt*2);
  u.health.value=SIM&&SIM.m&&SIM.m.health!==undefined?SIM.m.health:1;
  coreFX.rotation.y=t*.05;}
 if(key)placeKey(P.x,P.y,P.z);
 if(reflector&&reflector.visible)reflector.material.uniforms.camPos.value.copy(camera.position);
 if(composer){grade.uniforms.time.value=RM?0:t;composer.render(dt);}
 else renderer.render(scene,camera);
 watchFps(dt);};

/* Auto only: when frames stay slow, step down a tier, quietly */
function watchFps(dt){if(G.mode!=='auto'||G.q==='low'||document.visibilityState!=='visible'||dt>.25)return;
 fpsAcc+=dt;fpsN++;fpsCool=Math.max(0,fpsCool-dt);
 if(fpsAcc<4)return;const fps=fpsN/fpsAcc;fpsAcc=0;fpsN=0;if(fpsCool>0)return;
 if((G.q==='high'&&fps<30)||(G.q==='medium'&&fps<22)){fpsCool=12;apply(ORDER[ORDER.indexOf(G.q)-1]);}}

if(typeof ready!=='undefined'&&ready)G.init();
})();

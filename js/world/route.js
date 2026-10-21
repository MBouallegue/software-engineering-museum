/* ======================================================================
   THE ROUTE IS PART OF THE MUSEUM
   The walk between two halls is never empty floor. Each stretch of ramp
   is a cost model you traverse with your own feet: linear scans, binary
   descents, pipelines, forks, caches, queues, backoff. The vertical axis
   is the abstraction stack — you start on transistors and climb to
   distributed systems. Nothing here is decoration.
   ====================================================================== */
const CORR=[];
const CORRKIND={
 o1:   {n:'O(1)',        l:'One hop. The size of the problem does not change the walk.'},
 on:   {n:'O(n)',        l:'One step per item. Twice the input, twice the floor.'},
 olog: {n:'O(log n)',    l:'Each marker halves what is left. A thousand items, ten steps.'},
 tree: {n:'Binary descent',l:'Two choices at every level. Depth grows like log n.'},
 fork: {n:'Parallelism', l:'Two lanes, two workers, one job. Wall-clock halves, total work does not.'},
 inter:{n:'Concurrency', l:'One lane, interleaved. Progress on both, never at the same instant.'},
 pipe: {n:'Pipelining',  l:'Four stages. Stage one starts the next item before stage four finishes this one.'},
 cache:{n:'Caching',     l:'The first crossing pays. The second is already lit.'},
 stack:{n:'LIFO',        l:'You may only take the one you put down last.'},
 hash: {n:'Hashing',     l:'No scanning. The key computes which bucket to stand in.'},
 net:  {n:'Network hops',l:'Every hop is latency you cannot optimise away, and a chance to fail.'},
 queue:{n:'Buffering',   l:'Work waits in slots. The buffer is what absorbs a burst.'},
 retry:{n:'Backoff',     l:'Each attempt waits longer than the last. The gaps are the point.'}
};
/* one lesson per stretch of ramp, in walking order */
const ROUTE=['o1','pipe','fork','on','olog','stack','tree','cache','on','hash','olog','o1',
 'net','on','pipe','o1','net','queue','queue','retry','fork','queue','inter','retry','fork','net','on'];

function cbar(g,a,r,w,d,col,op,rot){
 const m=box(w,.05,d,ownNeon(col,op===undefined?.5:op));
 m.position.set(Math.cos(a)*r,yDeck(a)+.035,Math.sin(a)*r);
 m.rotation.y=-a+(rot||0);g.add(m);return m;}
function cpost(g,a,r,h,col){
 const m=box(.2,h,.2,ownLit(col,.4,.45));
 m.position.set(Math.cos(a)*r,yDeck(a)+h/2,Math.sin(a)*r);m.rotation.y=-a;g.add(m);return m;}

function buildCorridors(){
 const list=EXHIBITS.filter(function(e){return e.wing!=='hub';});
 for(let i=0;i<EXHIBITS.length-1;i++){
  const A=EXHIBITS[i],B=EXHIBITS[i+1];
  const a0=A.a+.17,a1=B.a-.17;if(a1-a0<.15)continue;
  const kind=ROUTE[i%ROUTE.length],K=CORRKIND[kind];
  const col=WING[B.wing].color;
  const g=new THREE.Group();scene.add(g);
  const marks=[];
  const L=function(f){return a0+(a1-a0)*f;};

  if(kind==='o1'){
   for(let k=0;k<2;k++){const a=k?a1:a0;
    cpost(g,a,18.3,2.6,col);cpost(g,a,23.7,2.6,col);
    const top=box(5.6,.14,.14,ownNeon(col,.55));
    top.position.set(Math.cos(a)*21,yDeck(a)+2.6,Math.sin(a)*21);top.rotation.y=-a;g.add(top);}
   marks.push(cbar(g,L(.5),21,.5,4.6,col,.22));
  }else if(kind==='on'){
   for(let k=0;k<14;k++)marks.push(cbar(g,L(k/13),21,.22,4.4,col,.45));
  }else if(kind==='olog'||kind==='tree'){
   let f=0;for(let k=0;k<7;k++){f+=(1-f)/2;marks.push(cbar(g,L(f),21,.24,4.4,col,.5));}
   marks.push(cbar(g,L(0),21,.3,5.4,col,.6));
  }else if(kind==='fork'){
   for(let k=0;k<20;k++){marks.push(cbar(g,L(k/19),18.7,.34,1.5,col,.42));
    marks.push(cbar(g,L(k/19),23.3,.34,1.5,col,.42));}
   cbar(g,L(0),21,.3,7.4,col,.5);cbar(g,L(1),21,.3,7.4,col,.5);
  }else if(kind==='inter'){
   for(let k=0;k<18;k++)marks.push(cbar(g,L(k/17),21,.32,4.4,k%2?col:'#FFD166',.5));
  }else if(kind==='pipe'){
   const cs=['#FFD166','#83C167','#58C4DD','#B18FE0'];
   for(let k=0;k<4;k++){const f0=k/4,f1=(k+1)/4;
    for(let j=0;j<5;j++)marks.push(cbar(g,L(f0+(f1-f0)*j/4),21,.3,4.4,cs[k],.45));}
  }else if(kind==='cache'){
   for(let k=0;k<9;k++)marks.push(cbar(g,L(k/8),21,.9,4.4,col,.1));
  }else if(kind==='stack'){
   for(let k=0;k<9;k++){marks.push(cbar(g,L(k/8),20.0,.22,2.0,col,.5,.5));
    marks.push(cbar(g,L(k/8),22.0,.22,2.0,col,.5,-.5));}
  }else if(kind==='hash'){
   for(let k=0;k<9;k++){const rr=18.4+((k*37)%9)*.62;
    marks.push(cbar(g,L(k/8),rr,.85,.85,col,.28));}
  }else if(kind==='net'){
   for(let k=0;k<5;k++)cpost(g,L(k/4),21,1.5,col);
   for(let k=0;k<4;k++)marks.push(cbar(g,L((k+.5)/4),21,.5,.12,col,.4));
   marks.push(cbar(g,L(0),21,.42,.42,'#FFFFFF',.95));
  }else if(kind==='queue'){
   for(let k=0;k<11;k++)marks.push(cbar(g,L(k/10),21,.5,4.2,col,.18));
  }else if(kind==='retry'){
   let f=0,step=.06;
   for(let k=0;k<6;k++){marks.push(cbar(g,L(Math.min(1,f)),21,.26,4.4,
     k?'#FF6B5A':col,.55));f+=step;step*=1.75;}
  }
  const lab=textSprite('ROUTE · '+K.n,col,42,5.2);
  lab.position.set(Math.cos(a0+.05)*24.6,yDeck(a0+.05)+2.5,Math.sin(a0+.05)*24.6);g.add(lab);
  CORR.push({a0:a0,a1:a1,mid:(a0+a1)/2,kind:kind,K:K,g:g,marks:marks,col:col,lit:0});
 }
}

let curCorr=null,corrSteps=0,corrLast=0;
function runCorridors(t,dt){
 let here=null;
 CORR.forEach(function(c){
  const vis=Math.abs(P.a-c.mid)<1.7;
  c.g.visible=vis;
  if(!vis)return;
  if(P.a>=c.a0&&P.a<=c.a1)here=c;
  const f=Math.max(0,Math.min(1,(P.a-c.a0)/(c.a1-c.a0)));
  if(c.kind==='cache'){
   c.marks.forEach(function(m,i){
    const reached=f*(c.marks.length-1)>=i;
    if(reached)c.lit=Math.max(c.lit,i+1);
    m.material.opacity=i<c.lit?.55:.08;});
  }else if(c.kind==='queue'){
   c.marks.forEach(function(m,i){
    m.material.opacity=.14+Math.max(0,Math.sin(t*1.4-i*.42))*.6;});
  }else if(c.kind==='net'){
   const pk=c.marks[c.marks.length-1];
   const q=fr(t*.22);
   const a=c.a0+(c.a1-c.a0)*q;
   pk.position.set(Math.cos(a)*21,yDeck(a)+.5,Math.sin(a)*21);
   pk.material.opacity=q<.94?.95:.1;
  }else if(c.kind==='inter'){
   c.marks.forEach(function(m,i){
    m.material.opacity=(Math.floor(t*3)%2===i%2)?.85:.2;});
  }else if(c.kind==='fork'){
   c.marks.forEach(function(m,i){
    const lane=i%2,k=Math.floor(i/2)/19;
    m.material.opacity=.2+Math.max(0,Math.sin(t*2.2-k*5+lane*.6))*.7;});
  }else if(c.kind==='pipe'){
   c.marks.forEach(function(m,i){
    const stage=Math.floor(i/5);
    m.material.opacity=.18+Math.max(0,Math.sin(t*1.8-stage*.8-(i%5)*.2))*.7;});
  }else if(c.kind==='retry'){
   c.marks.forEach(function(m,i){
    m.material.opacity=.2+Math.max(0,Math.sin(t*.9-i*.9))*.75;});
  }else{
   c.marks.forEach(function(m,i){
    const n=c.marks.length,reached=f*n>=i;
    m.material.opacity=reached?.75:.22;});}
 });
 if(here!==curCorr){
  curCorr=here;corrSteps=0;corrLast=P.a;
  if(here){moment('<b>'+here.K.n+'.</b> '+here.K.l);}
 }
 if(here){
  corrSteps+=Math.abs(P.a-corrLast)*21/.78;corrLast=P.a;
  const n=Math.floor(corrSteps);
  $('corridor').textContent=here.K.n+' · '+n+' step'+(n===1?'':'s');
  $('corridor').style.color=here.col;
  $('corridor').classList.add('on');
 }else $('corridor').classList.remove('on');
}


/* ======================================================================
   VISUALIZATION ENGINES  —  dark, animated, steppable
   ====================================================================== */
const VC={bg:'#0E1320',card:'#171E2E',grid:'#232B40',ink:'#E9EDF7',dim:'#8A93AC',
          blue:'#58C4DD',yellow:'#FFD166',red:'#FC6255',green:'#83C167',purple:'#B18FE0',pink:'#E86FA3'};
const FS=(w,s)=>w+' '+s+'px Inter, system-ui, sans-serif';
const FM=(w,s)=>w+' '+s+'px "JetBrains Mono", monospace';

function rr(c,x,y,w,h,r){r=Math.max(0,Math.min(r,w/2,h/2));c.beginPath();c.moveTo(x+r,y);
 c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();}
function T(c,s,x,y,font,fill,align,base){c.font=font;c.fillStyle=fill;c.textAlign=align||'center';
 c.textBaseline=base||'middle';c.fillText(s,x,y);}
function fmtN(v){if(!isFinite(v))return'∞';if(v>=1e6)return v.toExponential(1).replace('e+','e');
 if(v>=1000)return Math.round(v).toLocaleString('en-US');if(v>=10)return Math.round(v);return Math.round(v*10)/10;}
function ease(t){return t<0?0:t>1?1:t*t*(3-2*t);}

function vizBase(host,W,H){
 const wrap=document.createElement('div');wrap.className='viz';
 const cv=document.createElement('canvas');const bar=document.createElement('div');bar.className='viz-bar';
 const cap=document.createElement('div');cap.className='viz-cap';
 wrap.appendChild(cv);wrap.appendChild(bar);wrap.appendChild(cap);host.appendChild(wrap);
 const ctx=cv.getContext('2d');let raf=0,last=0,dead=false;
 const o={wrap:wrap,cv:cv,ctx:ctx,bar:bar,cap:cap,W:W,H:H,s:1};
 o.fit=function(){const w=Math.max(240,wrap.clientWidth-20),s=w/W;o.s=s;
  cv.style.width=w+'px';cv.style.height=(H*s)+'px';
  const d=Math.min(window.devicePixelRatio||1,2);
  cv.width=Math.round(w*d);cv.height=Math.round(H*s*d);ctx.setTransform(d*s,0,0,d*s,0,0);};
 o.start=function(fn){last=performance.now();
  (function tick(ts){if(dead)return;const dt=Math.min(.05,(ts-last)/1000);last=ts;
   ctx.save();ctx.fillStyle=VC.bg;ctx.fillRect(0,0,W,H);fn(dt,ts/1000);ctx.restore();
   raf=requestAnimationFrame(tick);})(last);};
 o.destroy=function(){dead=true;cancelAnimationFrame(raf);window.removeEventListener('resize',o.fit);wrap.remove();};
 window.addEventListener('resize',o.fit);o.fit();requestAnimationFrame(o.fit);
 return o;}
function vbtn(bar,label,fn,on){const b=document.createElement('button');b.type='button';
 b.className='vb'+(on?' on':'');b.textContent=label;b.addEventListener('click',fn);bar.appendChild(b);return b;}
function vslider(bar,text,min,max,val,fn){const l=document.createElement('label');l.appendChild(document.createTextNode(text));
 const r=document.createElement('input');r.type='range';r.min=min;r.max=max;r.value=val;
 const v=document.createElement('b');v.style.color=VC.yellow;v.textContent=val;
 r.addEventListener('input',function(){v.textContent=r.value;fn(+r.value);});
 l.appendChild(r);l.appendChild(v);bar.appendChild(l);return r;}
function vtext(bar,text,val,fn){const l=document.createElement('label');l.appendChild(document.createTextNode(text));
 const i=document.createElement('input');i.type='text';i.value=val;i.spellcheck=false;
 i.addEventListener('input',function(){fn(i.value);});l.appendChild(i);bar.appendChild(l);return i;}

/* ---------- FLOW : nodes, edges, travelling packets, steps ---------- */
function clipRect(n,tx,ty){const cx=n.x+n.w/2,cy=n.y+n.h/2;let dx=tx-cx,dy=ty-cy;
 if(!dx&&!dy)return{x:cx,y:cy};
 const s=Math.min((n.w/2+8)/Math.max(Math.abs(dx),1e-6),(n.h/2+8)/Math.max(Math.abs(dy),1e-6));
 return{x:cx+dx*s,y:cy+dy*s};}
function qp(a,b,c,t){const u=1-t;return{x:u*u*a.x+2*u*t*b.x+t*t*c.x,y:u*u*a.y+2*u*t*b.y+t*t*c.y};}

function vizFlow(host,sp){
 const o=vizBase(host,sp.w||900,sp.h||440);
 const N={};sp.nodes.forEach(function(n){N[n.id]=n;});
 const steps=sp.steps||[{cap:'',on:[]}];
 let idx=0,t=0,playing=true;const DUR=3.4;
 function geo(e){const a=N[e.a],b=N[e.b];
  const ax=a.x+a.w/2,ay=a.y+a.h/2,bx=b.x+b.w/2,by=b.y+b.h/2;
  const dx=bx-ax,dy=by-ay,L=Math.hypot(dx,dy)||1,bd=e.bend||0;
  const c={x:(ax+bx)/2-dy/L*bd,y:(ay+by)/2+dx/L*bd};
  return{p0:clipRect(a,c.x,c.y),p1:c,p2:clipRect(b,c.x,c.y)};}
 const EG={};(sp.edges||[]).forEach(function(e){EG[e.a+'>'+e.b]=e;});
 function go(k){idx=(k+steps.length)%steps.length;t=0;o.cap.innerHTML=steps[idx].cap||'';count.textContent=(idx+1)+' / '+steps.length;}
 vbtn(o.bar,'◀',function(){playing=false;pb.textContent='Play';go(idx-1);});
 const pb=vbtn(o.bar,'Pause',function(){playing=!playing;pb.textContent=playing?'Pause':'Play';});
 vbtn(o.bar,'Next ▶',function(){playing=false;pb.textContent='Play';go(idx+1);});
 const count=document.createElement('label');count.style.color=VC.dim;o.bar.appendChild(count);
 go(0);
 o.start(function(dt){
  const c=o.ctx,st=steps[idx];
  if(playing){t+=dt;if(t>DUR)go(idx+1);}
  const on={};(st.on||[]).forEach(function(k){on[k]=1;});
  const live={};(st.fly||[]).forEach(function(f){live[f.e]=1;});
  /* edges */
  (sp.edges||[]).forEach(function(e){
   const g=geo(e),hot=live[e.a+'>'+e.b];
   c.strokeStyle=hot?'#4A5573':VC.grid;c.lineWidth=hot?2.4:1.8;
   c.beginPath();c.moveTo(g.p0.x,g.p0.y);c.quadraticCurveTo(g.p1.x,g.p1.y,g.p2.x,g.p2.y);c.stroke();
   const d=qp(g.p0,g.p1,g.p2,.94),e2=qp(g.p0,g.p1,g.p2,1),a=Math.atan2(e2.y-d.y,e2.x-d.x);
   c.fillStyle=hot?'#4A5573':VC.grid;c.beginPath();
   c.moveTo(e2.x,e2.y);c.lineTo(e2.x-9*Math.cos(a-.42),e2.y-9*Math.sin(a-.42));
   c.lineTo(e2.x-9*Math.cos(a+.42),e2.y-9*Math.sin(a+.42));c.closePath();c.fill();});
  /* nodes */
  sp.nodes.forEach(function(n){
   const act=on[n.id],col=n.color||VC.ink;
   c.save();
   if(act){c.shadowColor=col;c.shadowBlur=22;}
   rr(c,n.x,n.y,n.w,n.h,14);c.fillStyle=act?'#1B2436':VC.card;c.fill();
   c.shadowBlur=0;c.lineWidth=act?2.6:1.6;c.strokeStyle=act?col:'#2E3750';c.stroke();c.restore();
   const cy=n.sub?n.y+n.h/2-9:n.y+n.h/2;
   T(c,n.label,n.x+n.w/2,cy,FS(600,15),act?VC.ink:'#B7BFD4');
   if(n.sub)T(c,n.sub,n.x+n.w/2,n.y+n.h/2+11,FS(500,11.5),act?col:VC.dim);});
  /* packets */
  const p=ease(Math.min(1,t/(DUR*.62)));
  (st.fly||[]).forEach(function(f,k){
   const e=EG[f.e];if(!e)return;const g=geo(e);
   const tt=Math.min(1,Math.max(0,p*1.18-k*.1)),pt=qp(g.p0,g.p1,g.p2,tt),col=f.color||VC.blue;
   c.save();c.font=FM(600,11.5);const w=c.measureText(f.label||'').width+18;
   if(f.label){c.shadowColor='rgba(0,0,0,.5)';c.shadowBlur=10;
    rr(c,pt.x-w/2,pt.y-12,w,24,12);c.fillStyle=col;c.fill();c.shadowBlur=0;
    T(c,f.label,pt.x,pt.y+.5,FM(600,11.5),'#0E1320');}
   else{c.beginPath();c.arc(pt.x,pt.y,7,0,7);c.fillStyle=col;c.fill();}
   c.restore();});
  /* progress */
  c.fillStyle=VC.grid;c.fillRect(0,o.H-3,o.W,3);
  c.fillStyle=VC.yellow;c.fillRect(0,o.H-3,o.W*((idx+Math.min(1,t/DUR))/steps.length),3);
 });
 return o;}

/* ---------- CURVES : growth-rate plot ---------- */
function vizCurves(host,sp){
 const o=vizBase(host,900,430);const P={l:58,r:210,t:26,b:46};
 let n=sp.nstart||20,logY=false,anim=0;
 vslider(o.bar,'n =',2,sp.nmax,n,function(v){n=v;});
 const lg=vbtn(o.bar,'log scale',function(){logY=!logY;lg.classList.toggle('on',logY);});
 o.start(function(dt){
  const c=o.ctx,W=o.W,H=o.H;anim=Math.min(1,anim+dt*.6);
  const x0=P.l,x1=W-P.r,y0=H-P.b,y1=P.t;
  const X=function(v){return x0+(v-1)/(sp.nmax-1)*(x1-x0);};
  const Y=function(v){const f=logY?Math.log10(1+Math.max(0,v))/Math.log10(1+sp.ymax):v/sp.ymax;
   return y0-Math.min(1.04,Math.max(0,f))*(y0-y1);};
  for(let g=0;g<=5;g++){const y=y1+(y0-y1)*g/5;c.strokeStyle=VC.grid;c.lineWidth=1;
   c.beginPath();c.moveTo(x0,y);c.lineTo(x1,y);c.stroke();}
  c.strokeStyle='#39425E';c.lineWidth=1.6;c.beginPath();c.moveTo(x0,y1);c.lineTo(x0,y0);c.lineTo(x1,y0);c.stroke();
  T(c,'input size  n',(x0+x1)/2,H-16,FS(500,12),VC.dim);
  c.save();c.translate(18,(y0+y1)/2);c.rotate(-Math.PI/2);
  T(c,logY?'operations (log)':'operations',0,0,FS(500,12),VC.dim);c.restore();
  const cut=X(1)+(X(sp.nmax)-X(1))*anim;
  sp.series.forEach(function(s,i){
   c.save();c.beginPath();c.rect(x0-1,y1-8,cut-x0+1,y0-y1+9);c.clip();
   c.strokeStyle=s.color;c.lineWidth=2.6;c.lineJoin='round';c.beginPath();
   for(let k=0;k<=260;k++){const v=1+(sp.nmax-1)*k/260,y=Y(s.f(v));
    if(k===0)c.moveTo(X(v),y);else c.lineTo(X(v),y);}
   c.stroke();c.restore();
   const yv=Y(s.f(n));
   if(X(n)<=cut){c.beginPath();c.arc(X(n),yv,4.5,0,7);c.fillStyle=s.color;c.fill();}
   const ly=y1+8+i*34;
   c.fillStyle=s.color;rr(c,x1+26,ly+4,12,12,4);c.fill();
   T(c,s.label,x1+46,ly+10,FM(600,13),VC.ink,'left');
   T(c,fmtN(s.f(n))+'',W-16,ly+10,FM(400,12),VC.dim,'right');});
  c.setLineDash([5,5]);c.strokeStyle='rgba(233,237,247,.35)';c.lineWidth=1.4;
  c.beginPath();c.moveTo(X(n),y1-6);c.lineTo(X(n),y0);c.stroke();c.setLineDash([]);
  T(c,'n = '+n,X(n),y1-14,FM(600,12),VC.ink);
  T(c,sp.note+' '+n,x1+26,H-26,FS(500,11),VC.dim,'left');});
 o.cap.innerHTML='Every curve is the same shape drawn at a different rate. Slide <b>n</b> and watch the numbers on the right — at n = 64, an <i>O(2ⁿ)</i> algorithm needs more operations than there are atoms in a small city.';
 return o;}
/* ---------- GRID : DP tables (edit distance, LCS, knapsack) ---------- */
function vizGrid(host,sp){
 const o=vizBase(host,900,478);
 let mode=sp.mode||'edit',A=sp.a||'kitten',B=sp.b||'sitting',CAP=8;
 const ITEMS=[{n:'rope',w:1,v:15},{n:'lamp',w:3,v:20},{n:'radio',w:4,v:30},{n:'tent',w:5,v:50}];
 let dp=[],order=[],k=0,tt=0,playing=true,path=[],rows=0,cols=0,rl=[],cl=[],title='';
 function build(){
  rl=[];cl=[];order=[];path=[];k=0;tt=0;
  if(mode==='knap'){
   rows=ITEMS.length+1;cols=CAP+1;title='dp[i][c] = best value from the first i items with capacity c';
   rl=['∅'].concat(ITEMS.map(function(x){return x.n+' '+x.w+'kg/'+x.v;}));
   for(let c=0;c<cols;c++)cl.push(c+'');
   dp=[];for(let i=0;i<rows;i++)dp.push(new Array(cols).fill(0));
   for(let i=1;i<rows;i++)for(let c=0;c<cols;c++){
    const it=ITEMS[i-1];let from=[{i:i-1,j:c}],val=dp[i-1][c],note;
    if(c>=it.w&&dp[i-1][c-it.w]+it.v>val){val=dp[i-1][c-it.w]+it.v;}
    if(c>=it.w)from.push({i:i-1,j:c-it.w});
    dp[i][c]=val;
    note=c<it.w?('<b>'+it.n+' does not fit</b> in '+c+'kg → copy the row above: <i>'+val+'</i>')
      :('skip = <i>'+dp[i-1][c]+'</i>, take = '+it.v+' + <i>'+dp[i-1][c-it.w]+'</i> → <b>'+val+'</b>');
    order.push({i:i,j:c,from:from,note:note});}
  }else{
   const n=A.length,m=B.length;rows=n+1;cols=m+1;
   rl=['∅'].concat(A.split(''));cl=['∅'].concat(B.split(''));
   dp=[];for(let i=0;i<rows;i++)dp.push(new Array(cols).fill(0));
   if(mode==='edit'){title='dp[i][j] = cheapest edit from A[:i] to B[:j]';
    for(let i=0;i<rows;i++)dp[i][0]=i;for(let j=0;j<cols;j++)dp[0][j]=j;}
   else title='dp[i][j] = longest common subsequence of A[:i] and B[:j]';
   for(let i=1;i<rows;i++)for(let j=1;j<cols;j++){
    const same=A[i-1]===B[j-1];let val,from,note;
    if(mode==='edit'){
     if(same){val=dp[i-1][j-1];from=[{i:i-1,j:j-1}];note="'"+A[i-1]+"' = '"+B[j-1]+"' → <b>free match</b>, take the diagonal <i>"+val+"</i>";}
     else{val=1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);from=[{i:i-1,j:j},{i:i,j:j-1},{i:i-1,j:j-1}];
      note="'"+A[i-1]+"' ≠ '"+B[j-1]+"' → 1 + min(delete <i>"+dp[i-1][j]+"</i>, insert <i>"+dp[i][j-1]+"</i>, replace <i>"+dp[i-1][j-1]+"</i>) = <b>"+val+"</b>";}
    }else{
     if(same){val=dp[i-1][j-1]+1;from=[{i:i-1,j:j-1}];note="'"+A[i-1]+"' = '"+B[j-1]+"' → diagonal + 1 = <b>"+val+"</b>";}
     else{val=Math.max(dp[i-1][j],dp[i][j-1]);from=[{i:i-1,j:j},{i:i,j:j-1}];
      note="no match → max(up <i>"+dp[i-1][j]+"</i>, left <i>"+dp[i][j-1]+"</i>) = <b>"+val+"</b>";}}
    dp[i][j]=val;order.push({i:i,j:j,from:from,note:note});}}
 }
 function backtrack(){
  path=[];
  if(mode==='knap'){let c=CAP;for(let i=rows-1;i>0;i--){if(dp[i][c]!==dp[i-1][c]){path.push({i:i,j:c});c-=ITEMS[i-1].w;}}}
  else{let i=rows-1,j=cols-1;while(i>0&&j>0){const same=A[i-1]===B[j-1];
   if(mode==='edit'){if(same&&dp[i][j]===dp[i-1][j-1]){path.push({i:i,j:j});i--;j--;}
    else if(dp[i][j]===dp[i-1][j-1]+1){path.push({i:i,j:j});i--;j--;}
    else if(dp[i][j]===dp[i-1][j]+1){path.push({i:i,j:j});i--;}else{path.push({i:i,j:j});j--;}}
   else{if(same){path.push({i:i,j:j});i--;j--;}else if(dp[i-1][j]>=dp[i][j-1])i--;else j--;}}}
 }
 if(mode==='knap'){vslider(o.bar,'capacity',4,10,CAP,function(v){CAP=v;build();});}
 else{const ma=vbtn(o.bar,'edit distance',function(){mode='edit';ma.classList.add('on');ml.classList.remove('on');build();},true);
  const ml=vbtn(o.bar,'LCS',function(){mode='lcs';ml.classList.add('on');ma.classList.remove('on');build();});
  vtext(o.bar,'A',A,function(v){A=(v||' ').slice(0,9);build();});
  vtext(o.bar,'B',B,function(v){B=(v||' ').slice(0,9);build();});}
 const pb=vbtn(o.bar,'Pause',function(){playing=!playing;pb.textContent=playing?'Pause':'Play';});
 vbtn(o.bar,'Step',function(){playing=false;pb.textContent='Play';if(k<order.length)k++;if(k===order.length)backtrack();});
 vbtn(o.bar,'Restart',function(){k=0;tt=0;path=[];playing=true;pb.textContent='Pause';});
 build();
 o.start(function(dt){
  const c=o.ctx,W=o.W,H=o.H;
  const cw=Math.min(54,(W-210)/cols,(H-150)/rows),ox=150,oy=92;
  if(playing&&k<order.length){tt+=dt;const iv=Math.max(.07,1.4/Math.sqrt(order.length));
   while(tt>iv&&k<order.length){tt-=iv;k++;if(k===order.length)backtrack();}}
  T(c,title,20,30,FS(600,14),VC.ink,'left');
  const cur=k>0?order[k-1]:null,src={};if(cur)cur.from.forEach(function(f){src[f.i+','+f.j]=1;});
  const inPath={};path.forEach(function(p){inPath[p.i+','+p.j]=1;});
  for(let j=0;j<cols;j++)T(c,cl[j],ox+j*cw+cw/2,oy-16,FM(600,13),j&&cur&&cur.j===j?VC.yellow:VC.dim);
  for(let i=0;i<rows;i++)T(c,rl[i],ox-12,oy+i*cw+cw/2,mode==='knap'?FS(600,11.5):FM(600,13),i&&cur&&cur.i===i?VC.yellow:VC.dim,'right');
  let done=0;
  for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){
   const base=(mode==='knap')?(i===0):(i===0||j===0);
   const idx=order.findIndex(function(z){return z.i===i&&z.j===j;});
   const shown=base||(idx>-1&&idx<k);
   const x=ox+j*cw,y=oy+i*cw,isCur=cur&&cur.i===i&&cur.j===j;
   rr(c,x+2,y+2,cw-4,cw-4,7);
   c.fillStyle=isCur?'#2A3550':inPath[i+','+j]?'rgba(131,193,103,.26)':shown?(base?'#1A2133':'#1E2740'):'#141A28';
   c.fill();
   if(isCur||src[i+','+j]){c.lineWidth=isCur?2.6:1.8;c.strokeStyle=isCur?VC.yellow:VC.purple;c.stroke();}
   else if(inPath[i+','+j]){c.lineWidth=1.8;c.strokeStyle=VC.green;c.stroke();}
   if(shown){done++;T(c,dp[i][j]+'',x+cw/2,y+cw/2,FM(base?400:600,Math.min(15,cw*.36)),
    isCur?VC.yellow:inPath[i+','+j]?VC.green:base?VC.dim:VC.ink);}}
  const fy=oy+rows*cw+30;
  if(k>=order.length){
   const ans=dp[rows-1][cols-1];
   T(c,(mode==='knap'?'best value = ':mode==='edit'?'edit distance = ':'LCS length = ')+ans,ox,fy,FS(700,16),VC.green,'left');
   T(c,'green cells = the choices that produced it (backtracked)',ox+230,fy,FS(500,12),VC.dim,'left');}
  else T(c,'filled '+done+' / '+(rows*cols)+' cells',ox,fy,FS(500,12.5),VC.dim,'left');
  c.fillStyle=VC.grid;c.fillRect(0,H-3,W,3);c.fillStyle=VC.purple;c.fillRect(0,H-3,W*(k/Math.max(1,order.length)),3);
  o.cap.innerHTML=cur?('<b>['+cur.i+']['+cur.j+']</b> — '+cur.note)
   :(k>=order.length?'Table complete. The <b>green path</b> is the answer itself, recovered by walking backwards from the last cell.'
    :'Yellow is the cell being computed, purple its dependencies. Every cell reads only cells already filled.');});
 return o;}

/* ---------- TREE : recursion vs memoisation ---------- */
function vizTree(host,sp){
 const o=vizBase(host,900,430);
 let n=sp.n||6,memo=true,nodes=[],reveal=0,plainCount=0,memoCount=0;
 function build(){
  nodes=[];let col=0;const seen={};
  (function rec(v,d,parent){
   const hit=memo&&seen[v]!==undefined;
   const node={v:v,d:d,parent:parent,hit:hit,x:0,idx:nodes.length};
   nodes.push(node);
   if(!hit&&v>1){rec(v-1,d+1,node.idx);rec(v-2,d+1,node.idx);}
   if(!hit)seen[v]=1;
   if(hit||v<=1)node.x=col++;
   else{const ch=nodes.filter(function(z){return z.parent===node.idx;});
    node.x=ch.reduce(function(a,z){return a+z.x;},0)/Math.max(1,ch.length);}
  })(n,0,-1);
  memoCount=nodes.filter(function(z){return !z.hit;}).length;
  let p=0;(function pr(v){p++;if(v>1){pr(v-1);pr(v-2);}})(n);plainCount=p;
  reveal=0;}
 vslider(o.bar,'fib(n), n =',3,9,n,function(v){n=v;build();});
 const mb=vbtn(o.bar,'memoised',function(){memo=!memo;mb.classList.toggle('on',memo);mb.textContent=memo?'memoised':'plain recursion';build();},true);
 vbtn(o.bar,'Replay',function(){reveal=0;});
 build();
 o.start(function(dt){
  const c=o.ctx,W=o.W,H=o.H;reveal=Math.min(nodes.length,reveal+dt*14);
  const maxX=Math.max(1,Math.max.apply(null,nodes.map(function(z){return z.x;}))),
        maxD=Math.max(1,Math.max.apply(null,nodes.map(function(z){return z.d;})));
  const px=function(x){return 60+x/maxX*(W-260);},py=function(d){return 78+d/maxD*(H-170);};
  nodes.forEach(function(nd,i){if(i>=reveal||nd.parent<0)return;const p=nodes[nd.parent];
   c.strokeStyle=nd.hit?'rgba(252,98,85,.45)':'#2B3450';
   c.lineWidth=1.6;c.beginPath();c.moveTo(px(p.x),py(p.d)+16);c.lineTo(px(nd.x),py(nd.d)-16);c.stroke();});
  nodes.forEach(function(nd,i){if(i>=reveal)return;
   const x=px(nd.x),y=py(nd.d),r=Math.max(12,Math.min(19,(W-260)/maxX*.42));
   c.beginPath();c.arc(x,y,r,0,7);
   c.fillStyle=nd.hit?'rgba(252,98,85,.18)':nd.v<=1?'rgba(131,193,103,.2)':'#1C2436';c.fill();
   c.lineWidth=2;c.strokeStyle=nd.hit?VC.red:nd.v<=1?VC.green:VC.blue;c.stroke();
   T(c,nd.v+'',x,y,FM(600,Math.min(13,r*.8)),nd.hit?VC.red:VC.ink);});
  T(c,memo?'memoised: each value computed once':'plain recursion: the same values again and again',
    W/2,30,FS(600,15),VC.ink);
  const stat=memo?memoCount:plainCount;
  T(c,'calls',W-96,H-96,FS(500,12),VC.dim);T(c,stat+'',W-96,H-66,FM(700,30),memo?VC.green:VC.red);
  T(c,memo?('instead of '+plainCount):'vs '+memoCount+' memoised',W-96,H-38,FS(500,11.5),VC.dim);});
 o.cap.innerHTML='Red nodes are <b>cache hits</b> — the call stops there. Turn memoisation off and watch the tree explode: plain <i>fib</i> is O(2ⁿ), memoised it is O(n), and the only change is writing answers down.';
 return o;}
/* ---------- KAFKA : partitioned log with consumer groups ---------- */
function vizKafka(host,sp){
 const o=vizBase(host,900,452);
 const KEYS=[{k:'user-7',c:VC.blue},{k:'user-3',c:VC.yellow},{k:'user-9',c:VC.green},
             {k:'user-1',c:VC.purple},{k:'user-4',c:VC.pink}];
 const P=3,MAXL=13,GR=[{id:'billing',c:VC.green},{id:'analytics',c:VC.purple}];
 let parts=[[],[],[]],off={billing:[0,0,0],analytics:[0,0,0]},fly=[],auto=true,tp=0,tc=0,msg='';
 function hash(s){let h=7;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))>>>0;return h;}
 function produce(){const m=KEYS[(Math.random()*KEYS.length)|0];
  fly.push({k:m.k,c:m.c,p:hash(m.k)%P,t:0});}
 vbtn(o.bar,'Produce',function(){produce();});
 const ab=vbtn(o.bar,'auto',function(){auto=!auto;ab.classList.toggle('on',auto);},true);
 vbtn(o.bar,'Replay analytics',function(){off.analytics=[0,0,0];msg='analytics reset its offsets to 0 — the log is still there, so it reprocesses everything.';});
 vbtn(o.bar,'Reset',function(){parts=[[],[],[]];off={billing:[0,0,0],analytics:[0,0,0]};fly=[];msg='';});
 for(let i=0;i<5;i++)produce();
 o.start(function(dt){
  const c=o.ctx,W=o.W,H=o.H,x0=250,sw=38,ly=[110,220,330],lh=52;
  if(auto){tp+=dt;if(tp>1.15){tp=0;produce();}}
  tc+=dt;if(tc>.5){tc=0;GR.forEach(function(g){for(let p=0;p<P;p++)if(off[g.id][p]<parts[p].length)off[g.id][p]++;});}
  for(let i=fly.length-1;i>=0;i--){const f=fly[i];f.t+=dt*1.5;
   if(f.t>=1){parts[f.p].push({k:f.k,c:f.c});
    if(parts[f.p].length>MAXL){parts[f.p].shift();GR.forEach(function(g){off[g.id][f.p]=Math.max(0,off[g.id][f.p]-1);});
     msg='retention dropped the oldest record — a consumer that is too far behind loses it.';}
    fly.splice(i,1);}}
  rr(c,40,196,150,74,14);c.fillStyle=VC.card;c.fill();c.strokeStyle=VC.blue;c.lineWidth=2;c.stroke();
  T(c,'Producer',115,222,FS(600,15),VC.ink);T(c,'key → partition',115,244,FS(500,11.5),VC.blue);
  T(c,'topic: orders',x0,64,FS(700,15),VC.ink,'left');
  T(c,'append-only · ordered inside a partition · nothing is deleted on read',x0+110,64,FS(500,12),VC.dim,'left');
  for(let p=0;p<P;p++){
   const y=ly[p];
   T(c,'P'+p,x0-16,y+lh/2,FM(700,13),VC.dim,'right');
   rr(c,x0,y,MAXL*sw+6,lh,10);c.fillStyle='#141A28';c.fill();c.strokeStyle=VC.grid;c.lineWidth=1.4;c.stroke();
   parts[p].forEach(function(m,i){const x=x0+4+i*sw;
    rr(c,x,y+5,sw-6,lh-10,7);c.fillStyle=m.c+'30';c.fill();c.strokeStyle=m.c;c.lineWidth=1.6;c.stroke();
    T(c,m.k.slice(5),x+(sw-6)/2,y+lh/2-4,FM(600,12),m.c);
    T(c,i+'',x+(sw-6)/2,y+lh/2+13,FM(400,9.5),VC.dim);});
   GR.forEach(function(g,gi){const ox=x0+4+off[g.id][p]*sw+(sw-6)/2,oy=y+lh+7+gi*17;
    c.fillStyle=g.c;c.beginPath();c.moveTo(ox,oy);c.lineTo(ox-6,oy+9);c.lineTo(ox+6,oy+9);c.closePath();c.fill();
    T(c,g.id+' @'+off[g.id][p],ox+11,oy+5,FM(600,10),g.c,'left');});}
  fly.forEach(function(f){const y=ly[f.p]+lh/2,sx=190,ex=x0+4+parts[f.p].length*sw+16;
   const x=sx+(ex-sx)*ease(f.t),yy=222+(y-222)*ease(f.t);
   rr(c,x-30,yy-13,60,26,13);c.fillStyle=f.c;c.fill();T(c,f.k.slice(5),x,yy,FM(600,11),'#0E1320');});
  let lag=0;GR.forEach(function(g){for(let p=0;p<P;p++)lag+=parts[p].length-off[g.id][p];});
  T(c,'total consumer lag: '+lag+' records',x0,H-26,FS(600,12.5),lag>8?VC.red:VC.dim,'left');
  o.cap.innerHTML=msg?('<b>'+msg+'</b>')
   :'Same key → same partition → guaranteed order. Two groups read the <b>same</b> log at their own offsets, and <i>Replay analytics</i> shows why that matters: rewinding a consumer costs nothing.';});
 return o;}

/* ---------- AMORT : dynamic array doubling ---------- */
function vizAmort(host,sp){
 const o=vizBase(host,900,430);
 let n=0,cap=1,costs=[],total=0,auto=true,t=0,flash=0;
 function push(){let cost=1;if(n===cap){cost=n+1;cap*=2;flash=1;}n++;total+=cost;costs.push(cost);
  if(n>44){n=0;cap=1;costs=[];total=0;}}
 vbtn(o.bar,'Push',function(){push();});
 const ab=vbtn(o.bar,'auto',function(){auto=!auto;ab.classList.toggle('on',auto);},true);
 vbtn(o.bar,'Reset',function(){n=0;cap=1;costs=[];total=0;});
 o.start(function(dt){
  const c=o.ctx,W=o.W,H=o.H;flash=Math.max(0,flash-dt*2);
  if(auto){t+=dt;if(t>.32){t=0;push();}}
  const bx=60,bw=(W-140)/45,by=H-80;
  T(c,'cost of each append',bx,44,FS(600,14),VC.ink,'left');
  costs.forEach(function(v,i){const h=Math.min(by-90,v*7.2);
   rr(c,bx+i*bw+1,by-h,bw-3,h,3);c.fillStyle=v>1?VC.red:VC.blue;c.fill();
   if(v>1)T(c,v+'',bx+i*bw+bw/2,by-h-9,FM(600,9.5),VC.red);});
  c.strokeStyle=VC.grid;c.lineWidth=1.4;c.beginPath();c.moveTo(bx,by);c.lineTo(W-70,by);c.stroke();
  const avg=n?total/n:0,ay=by-avg*7.2;
  c.strokeStyle=VC.green;c.lineWidth=2;c.setLineDash([6,5]);
  c.beginPath();c.moveTo(bx,ay);c.lineTo(W-70,ay);c.stroke();c.setLineDash([]);
  T(c,'average = '+(Math.round(avg*100)/100),W-66,ay,FM(700,13),VC.green,'left');
  const sw=Math.min(22,(W-160)/cap),sy=by+26;
  for(let i=0;i<cap;i++){rr(c,bx+i*sw,sy,sw-3,20,4);
   c.fillStyle=i<n?(flash>0?'#FFD16655':'#1E2740'):'#141A28';c.fill();
   c.strokeStyle=i<n?VC.blue:VC.grid;c.lineWidth=1.2;c.stroke();}
  T(c,'length '+n+' / capacity '+cap,bx,sy+34,FM(600,12),VC.dim,'left');
  T(c,'total work '+total+' for '+n+' appends',W-70,sy+34,FM(600,12),VC.dim,'right');});
 o.cap.innerHTML='Most appends cost 1. When the array is full it allocates double and <b>copies everything</b> — the red spikes. Because the spikes double in spacing as they double in cost, the average stays flat near <i>2</i>: that is <b>amortised O(1)</b>, a worst-case promise about a sequence, not an average over lucky inputs.';
 return o;}

/* ---------- BACKOFF : retry storms and jitter ---------- */
function vizBackoff(host,sp){
 const o=vizBase(host,900,440);
 const CL=9,AT=6,base=.45,cap=6;let jitter=true,times=[],play=0,T_=18;
 function roll(){times=[];for(let i=0;i<CL;i++){let t=0,row=[t];
  for(let a=0;a<AT-1;a++){const b=Math.min(cap,base*Math.pow(2,a));t+=jitter?Math.random()*b:b;row.push(t);}
  times.push(row);}play=0;}
 const jb=vbtn(o.bar,'full jitter',function(){jitter=!jitter;jb.classList.toggle('on',jitter);
  jb.textContent=jitter?'full jitter':'no jitter';roll();},true);
 vbtn(o.bar,'Re-run',function(){roll();});
 roll();
 o.start(function(dt){
  const c=o.ctx,W=o.W,H=o.H,x0=130,x1=W-40,y0=80,rh=26;
  play+=dt*2.2;if(play>T_+2)play=0;
  const X=function(t){return x0+t/T_*(x1-x0);};
  T(c,'9 clients retry a failed dependency',x0,40,FS(600,14.5),VC.ink,'left');
  T(c,jitter?'sleep = uniform(0, backoff)':'sleep = backoff exactly',x1,40,FM(600,12.5),jitter?VC.green:VC.red,'right');
  for(let g=0;g<=6;g++){const x=X(g*3);c.strokeStyle=VC.grid;c.lineWidth=1;
   c.beginPath();c.moveTo(x,y0-10);c.lineTo(x,y0+CL*rh+6);c.stroke();
   T(c,(g*3)+'s',x,y0+CL*rh+22,FM(400,10.5),VC.dim);}
  const buckets=new Array(60).fill(0);
  times.forEach(function(row,i){const y=y0+i*rh+rh/2;
   c.strokeStyle='#1B2233';c.lineWidth=1.4;c.beginPath();c.moveTo(x0,y);c.lineTo(x1,y);c.stroke();
   T(c,'client '+(i+1),x0-12,y,FM(500,11),VC.dim,'right');
   row.forEach(function(t,a){if(t>T_)return;const hit=play>=t;
    if(hit)buckets[Math.min(59,(t/T_*60)|0)]++;
    c.beginPath();c.arc(X(t),y,hit?6:4,0,7);
    c.fillStyle=hit?(a===0?VC.blue:jitter?VC.green:VC.red):'#263050';c.fill();});});
  const hy=y0+CL*rh+40,hh=60,mx=Math.max(1,Math.max.apply(null,buckets));
  buckets.forEach(function(v,i){if(!v)return;const h=v/mx*hh,x=x0+(i/60)*(x1-x0);
   rr(c,x,hy+hh-h,(x1-x0)/60-2,h,2);c.fillStyle=v>4?VC.red:VC.blue;c.fill();});
  T(c,'requests hitting the dependency',x0,hy+hh+18,FS(500,11.5),VC.dim,'left');
  T(c,'peak '+mx+' at once',x1,hy+hh+18,FM(600,11.5),mx>4?VC.red:VC.green,'right');
  c.strokeStyle='rgba(233,237,247,.4)';c.lineWidth=1.4;
  c.beginPath();c.moveTo(X(Math.min(play,T_)),y0-14);c.lineTo(X(Math.min(play,T_)),hy+hh);c.stroke();});
 o.cap.innerHTML='Turn jitter off: every client backs off by the <i>same</i> amount, so the retries arrive in lockstep and re-kill the service the moment it recovers. <b>Full jitter</b> spreads the same attempts flat — same retry budget, a fraction of the peak.';
 return o;}
/* ---------- LAYERS : docker image layers + build cache ---------- */
function vizLayers(host,sp){
 const o=vizBase(host,900,470);
 let ms=false,from=0,anim=1,msg='A fresh build runs every instruction. Each one that touches the filesystem becomes a layer.';
 function L(){return ms
  ?[{n:'FROM python:3.12-slim',mb:124},{n:'RUN useradd app',mb:1},
    {n:'COPY --from=build /install',mb:58},{n:'COPY . /app',mb:9},{n:'ENTRYPOINT / CMD / USER',mb:0,meta:1}]
  :[{n:'FROM python:3.12',mb:1010},{n:'COPY requirements.txt',mb:1},
    {n:'RUN pip install -r requirements.txt',mb:186},{n:'COPY . /app',mb:9},{n:'ENTRYPOINT / CMD',mb:0,meta:1}];}
 function set(f,m){from=f;anim=0;msg=m;}
 vbtn(o.bar,'Fresh build',function(){set(0,'Nothing is cached, so every layer is built from scratch.');});
 vbtn(o.bar,'Edit source',function(){set(3,'Only <b>COPY . /app</b> and everything above it rebuild — seconds, because the dependency layer is untouched.');});
 vbtn(o.bar,'Edit requirements',function(){set(1,'The manifest changed, so the cache breaks <b>there</b> and the expensive install runs again. This is why you copy requirements before the source.');});
 const mb=vbtn(o.bar,'multi-stage',function(){ms=!ms;mb.classList.toggle('on',ms);
  set(0,ms?'Multi-stage: compile in a fat image, copy only the installed artefacts into a slim runtime. Same app, a third of the size.':'Back to a single-stage build with the full toolchain shipped to production.');});
 o.start(function(dt){
  const c=o.ctx,W=o.W,H=o.H,ls=L();anim=Math.min(1,anim+dt*.8);
  const x=170,w=470,base=H-70;let y=base,total=0;
  ls.forEach(function(l,i){
   const h=l.meta?26:Math.max(30,Math.min(78,26+l.mb*.07));y-=h+5;
   const rebuilding=i>=from,done=anim>=(i-from+1)/Math.max(1,ls.length-from);
   const col=!rebuilding?VC.green:done?VC.blue:VC.yellow;
   rr(c,x,y,w,h,9);c.fillStyle=!rebuilding?'rgba(131,193,103,.12)':done?'#1B2436':'rgba(255,209,102,.16)';c.fill();
   c.strokeStyle=col;c.lineWidth=rebuilding&&!done?2.4:1.6;c.stroke();
   T(c,l.n,x+14,y+h/2,FM(600,12.5),rebuilding?VC.ink:'#9EB894','left');
   T(c,l.meta?'metadata':l.mb+' MB',x+w-14,y+h/2,FM(500,11.5),VC.dim,'right');
   T(c,!rebuilding?'CACHED':done?'built':'building…',x+w+16,y+h/2,FM(600,11),col,'left');
   total+=l.mb;});
  c.setLineDash([6,5]);rr(c,x,y-38,w,30,9);c.strokeStyle=VC.purple;c.lineWidth=1.8;c.stroke();c.setLineDash([]);
  T(c,'container writable layer  (dies with the container)',x+w/2,y-23,FM(500,11.5),VC.purple);
  T(c,'image = read-only layers, bottom to top',x,46,FS(600,14),VC.ink,'left');
  T(c,'image size',x+w+16,base-18,FS(500,11),VC.dim,'left');
  T(c,total+' MB',x+w+16,base+2,FM(700,17),ms?VC.green:VC.ink,'left');
  c.fillStyle='#141A28';rr(c,x-2,base+4,w+4,10,4);c.fill();
  o.cap.innerHTML=msg;});
 return o;}

/* ---------- CAP : partition, then choose ---------- */
function vizCap(host,sp){
 const o=vizBase(host,900,440);
 let part=false,pick='C',t=0;
 const pb=vbtn(o.bar,'network partition',function(){part=!part;pb.classList.toggle('on',part);t=0;});
 const cb=vbtn(o.bar,'choose consistency',function(){pick='C';cb.classList.add('on');ab.classList.remove('on');t=0;},true);
 const ab=vbtn(o.bar,'choose availability',function(){pick='A';ab.classList.add('on');cb.classList.remove('on');t=0;});
 o.start(function(dt){
  const c=o.ctx,W=o.W,H=o.H;t+=dt;if(t>5.2)t=0;
  const n1={x:300,y:110},n2={x:600,y:110},w=150,h=84;
  const writer={x:60,y:110},reader={x:800,y:250};
  const replicated=!part;
  const v1='x = 2',v2=(t>1.6&&replicated)?'x = 2':'x = 1';
  [[n1,'Node A',v1,VC.green],[n2,'Node B',v2,(part&&t>1.6)?VC.red:VC.green]].forEach(function(z){
   rr(c,z[0].x-w/2,z[0].y-h/2,w,h,14);c.fillStyle=VC.card;c.fill();
   c.strokeStyle=z[3];c.lineWidth=2.2;c.stroke();
   T(c,z[1],z[0].x,z[0].y-16,FS(600,14),VC.ink);T(c,z[2],z[0].x,z[0].y+14,FM(700,18),z[3]);});
  c.strokeStyle=part?'rgba(252,98,85,.5)':VC.grid;c.lineWidth=2.4;c.setLineDash(part?[7,6]:[]);
  c.beginPath();c.moveTo(n1.x+w/2,n1.y);c.lineTo(n2.x-w/2,n2.y);c.stroke();c.setLineDash([]);
  if(part){const mx=(n1.x+n2.x)/2;c.strokeStyle=VC.red;c.lineWidth=4;
   c.beginPath();c.moveTo(mx-13,n1.y-13);c.lineTo(mx+13,n1.y+13);c.moveTo(mx+13,n1.y-13);c.lineTo(mx-13,n1.y+13);c.stroke();
   T(c,'messages dropped',mx,n1.y+42,FM(600,12),VC.red);}
  rr(c,writer.x-46,writer.y-30,92,60,12);c.fillStyle=VC.card;c.fill();c.strokeStyle=VC.blue;c.lineWidth=2;c.stroke();
  T(c,'writer',writer.x,writer.y,FS(600,13),VC.blue);
  rr(c,reader.x-46,reader.y-30,92,60,12);c.fillStyle=VC.card;c.fill();c.strokeStyle=VC.yellow;c.lineWidth=2;c.stroke();
  T(c,'reader',reader.x,reader.y,FS(600,13),VC.yellow);
  if(t<1.3){const p=ease(t/1.3),x=writer.x+46+(n1.x-w/2-writer.x-46)*p;
   rr(c,x-34,writer.y-13,68,26,13);c.fillStyle=VC.blue;c.fill();T(c,'write x=2',x,writer.y,FM(600,11),'#0E1320');}
  if(t>1.3&&t<2.4&&!part){const p=ease((t-1.3)/1.1),x=n1.x+w/2+(n2.x-w/2-n1.x-w/2)*p;
   rr(c,x-32,n1.y-13,64,26,13);c.fillStyle=VC.green;c.fill();T(c,'replicate',x,n1.y,FM(600,11),'#0E1320');}
  if(t>2.6){const p=ease(Math.min(1,(t-2.6)/1.1)),sx=reader.x-46,ex=n2.x+w/2,x=sx+(ex-sx)*p,y=reader.y+(n2.y-reader.y)*p;
   rr(c,x-30,y-13,60,26,13);c.fillStyle=VC.yellow;c.fill();T(c,'read x',x,y,FM(600,11),'#0E1320');}
  let banner,col;
  if(!part){banner='No partition → no trade-off. You are in the E of PACELC: replicate synchronously for consistency, asynchronously for latency.';col=VC.green;}
  else if(pick==='C'){banner='Consistency chosen → Node B refuses the read: 503, try the other side. Correct, but not available.';col=VC.blue;}
  else{banner='Availability chosen → Node B answers x = 1, a stale value. Available, but wrong until the partition heals.';col=VC.yellow;}
  if(part&&t>3.4){const rx=reader.x,ry=reader.y+56;
   rr(c,rx-96,ry-16,192,34,10);c.fillStyle=pick==='C'?'rgba(88,196,221,.18)':'rgba(255,209,102,.18)';c.fill();
   c.strokeStyle=col;c.lineWidth=1.8;c.stroke();
   T(c,pick==='C'?'503 unavailable':'x = 1  (stale)',rx,ry,FM(700,13),col);}
  rr(c,40,H-78,W-80,54,12);c.fillStyle='#141A28';c.fill();c.strokeStyle=col;c.lineWidth=1.6;c.stroke();
  c.font=FS(500,13);c.fillStyle=VC.ink;c.textAlign='left';c.textBaseline='middle';
  c.fillText(banner,62,H-51);});
 o.cap.innerHTML='Flip the partition on, then pick a side. <b>There is no third option</b> — and outside a partition the question never comes up, which is why calling a database "CP" or "AP" forever is a simplification.';
 return o;}

/* ---------- dispatcher ---------- */
const VIZ_MAP={flow:vizFlow,curves:vizCurves,grid:vizGrid,tree:vizTree,kafka:vizKafka,
               amort:vizAmort,backoff:vizBackoff,layers:vizLayers,cap:vizCap};
function mountViz(host,spec){if(!spec)return null;const f=VIZ_MAP[spec.type];return f?f(host,spec):null;}

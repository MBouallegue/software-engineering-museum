/* ======================================================================
   STORY KIT — the recorder, the playback model and the drawing primitives
   every scenario shares. Scenarios register themselves with StoryKit.SC.
   ====================================================================== */
const StoryKit=(function(){
const STAGES=['Question','Setup','Demonstration','Observation','Experiment','Trade-off','Explanation','Takeaway'];
const K={line:'#24324F',grid:'rgba(127,168,255,.05)',ink:'#E9EFFA',dim:'#8FA0BF',faint:'#56668A',card:'#0F1729',
 ok:'#6FD08C',bad:'#FF7A6B',wait:'#FFC65C',info:'#8FB4FF',bg:'#0A101D'};
const W=960,H=540;
function clone(o){return JSON.parse(JSON.stringify(o));}
function clamp(x,a,b){return x<a?a:x>b?b:x;}
function ez(t){t=clamp(t,0,1);return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;}
function rng(seed){let s=seed>>>0||1;return function(){s^=s<<13;s>>>=0;s^=s>>>17;s^=s<<5;s>>>=0;return s/4294967296;};}
function hexA(hex,a){const h=hex.replace('#','');const n=parseInt(h.length===3?h.replace(/./g,'$&$&'):h,16);
 return 'rgba('+(n>>16&255)+','+(n>>8&255)+','+(n&255)+','+a+')';}
function ms(v){return v>=1000?(v/1000).toFixed(v>=10000?1:2)+' s':Math.round(v)+' ms';}

/* ---- the recorder: every event carries the state after it ---- */
function Rec(s0){this.s=clone(s0);this.s0=clone(s0);this.ev=[];this.t=0;}
Rec.prototype.add=function(e){if(e.at!=null)this.t=e.at;if(e.fx)e.fx(this.s);delete e.fx;
 e.t=this.t;e.s=clone(this.s);if(!e.dur)e.dur=1;if(e.stage==null)e.stage=this.ev.length?this.ev[this.ev.length-1].stage:1;
 this.ev.push(e);return e;};
/* in time-driven scenarios an event's animation spans the gap since the last one */
function pace(ev,k,lo,hi){for(let i=0;i<ev.length;i++){const g=ev[i].t-(i?ev[i-1].t:0);
 ev[i].dur=Math.max(ev[i].hold?.9:0,clamp(g*k,lo,hi));}}

/* ---- drawing primitives shared by every scenario ---- */
function grid(c){c.strokeStyle=K.grid;c.lineWidth=1;c.beginPath();
 for(let x=0;x<=W;x+=24){c.moveTo(x+.5,0);c.lineTo(x+.5,H);}for(let y=0;y<=H;y+=24){c.moveTo(0,y+.5);c.lineTo(W,y+.5);}c.stroke();}
function ctr(n){return{x:n.x+n.w/2,y:n.y+n.h/2};}
function stateCol(st,acc){return st==='ok'?K.ok:st==='bad'?K.bad:st==='wait'?K.wait:st==='active'||st==='sel'?acc:K.line;}
function drawNode(c,n,st,acc,extra){
 const col=stateCol(st,acc),hot=st!=='idle'&&st!=='dim';
 c.save();c.globalAlpha=st==='dim'?.32:1;
 rr(c,n.x,n.y,n.w,n.h,10);c.fillStyle=hot?hexA(col,.12):K.card;c.fill();
 c.lineWidth=hot?2:1;c.strokeStyle=hot?col:'#2A3958';c.stroke();
 if(st==='sel'){rr(c,n.x-5,n.y-5,n.w+10,n.h+10,13);c.setLineDash([4,4]);c.strokeStyle=hexA(acc,.7);c.lineWidth=1;c.stroke();c.setLineDash([]);}
 if(n.kind){T(c,n.kind.toUpperCase(),n.x+12,n.y+13,FM(600,8.5),hot?col:K.faint,'left','middle');}
 const ly=n.kind?n.y+n.h/2+3:n.y+n.h/2-(n.sub?7:0);
 T(c,n.label,n.x+12,ly,FS(600,14),K.ink,'left','middle');
 if(n.sub)T(c,extra||n.sub,n.x+12,ly+17,FS(400,11),K.dim,'left','middle');
 c.restore();}
function edgePts(def,a,b){const A=def.nodes[a],B=def.nodes[b];if(!A||!B)return null;
 const ed=(def.edges||[]).filter(function(e){return(e[0]===a&&e[1]===b)||(e[0]===b&&e[1]===a);})[0];
 let pts;
 if(ed&&ed[2]){const via=ed[0]===a?ed[2]:ed[2].slice().reverse();
  pts=[ctr(A)].concat(via.map(function(p){return{x:p[0],y:p[1]};})).concat([ctr(B)]);}
 else pts=[ctr(A),ctr(B)];
 pts[0]=clipRect(A,pts[1].x,pts[1].y);pts[pts.length-1]=clipRect(B,pts[pts.length-2].x,pts[pts.length-2].y);
 return pts;}
function polyAt(p,t){let L=0;const seg=[];for(let i=1;i<p.length;i++){const d=Math.hypot(p[i].x-p[i-1].x,p[i].y-p[i-1].y);seg.push(d);L+=d;}
 let r=t*L;for(let i=0;i<seg.length;i++){if(r<=seg[i]||i===seg.length-1){const k=seg[i]?clamp(r/seg[i],0,1):1;
  return{x:p[i].x+(p[i+1].x-p[i].x)*k,y:p[i].y+(p[i+1].y-p[i].y)*k};}r-=seg[i];}return p[p.length-1];}
function drawEdges(c,def,X){(def.edges||[]).forEach(function(e){
 if(e[3]&&!e[3](X.opts))return;
 const p=edgePts(def,e[0],e[1]);if(!p)return;
 const hot=X.cur&&((X.cur.src===e[0]&&X.cur.dst===e[1])||(X.cur.src===e[1]&&X.cur.dst===e[0]));
 c.save();c.globalAlpha=X.focus&&!hot?.25:1;c.beginPath();c.moveTo(p[0].x,p[0].y);
 for(let i=1;i<p.length;i++)c.lineTo(p[i].x,p[i].y);
 c.strokeStyle=hot?hexA(X.acc,.85):'#26365A';c.lineWidth=hot?2:1.2;if(e[4])c.setLineDash([5,5]);c.stroke();c.restore();});}
function packet(c,x,y,txt,col){c.save();c.font=FM(600,10.5);const w=Math.max(18,c.measureText(txt).width+16);
 c.shadowColor=col;c.shadowBlur=RM?0:14;rr(c,x-w/2,y-11,w,22,11);c.fillStyle=col;c.fill();c.shadowBlur=0;
 T(c,txt,x,y+.5,FM(600,10.5),'#081020','center','middle');c.restore();}
function dot(c,x,y,r,col){c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=col;c.fill();}
function drawPacket(c,def,X){const E=X.E;if(!E||X.p<=0||!E.pk)return;
 const col=E.bad?K.bad:E.good?K.ok:E.warn?K.wait:X.acc;
 if(E.src===E.dst){const n=def.nodes[E.src];if(!n)return;const o=ctr(n);
  c.save();c.strokeStyle=col;c.lineWidth=3;c.beginPath();c.arc(n.x+n.w-16,n.y+16,8,-Math.PI/2,-Math.PI/2+Math.PI*2*X.p);c.stroke();c.restore();
  if(E.pk.txt)packet(c,o.x,n.y-16,E.pk.txt,col);return;}
 const p=edgePts(def,E.src,E.dst);if(!p)return;const q=polyAt(p,ez(X.p));packet(c,q.x,q.y,E.pk.txt||'',col);}
function panel(c,x,y,w,h,title){rr(c,x,y,w,h,10);c.fillStyle='rgba(12,19,36,.92)';c.fill();c.strokeStyle='#22314F';c.lineWidth=1;c.stroke();
 if(title)T(c,title.toUpperCase(),x+12,y+14,FM(600,8.5),K.faint,'left','middle');}
function kv(c,x,y,k,v,col){T(c,k,x,y,FS(400,11),K.dim,'left','middle');T(c,v,x+(c.__kvw||118),y,FM(600,11.5),col||K.ink,'left','middle');}
function nodeStates(def,X){const out={};Object.keys(def.nodes).forEach(function(id){
 let st='idle';const C=X.cur;
 if(C&&(C.src===id||C.dst===id))st=C.bad?'bad':C.warn?'wait':C.good?'ok':'active';
 else if(X.focus&&C)st='dim';
 if(X.sel===id)st=st==='idle'||st==='dim'?'sel':st;
 out[id]=st;});return out;}

const SC=[];
function code(t){return '<pre><code>'+esc(t)+'</code></pre>';}
return {STAGES,K,W,H,clone,clamp,ez,rng,hexA,ms,Rec,pace,grid,ctr,stateCol,drawNode,edgePts,polyAt,drawEdges,packet,dot,drawPacket,panel,kv,nodeStates,code,SC};
})();

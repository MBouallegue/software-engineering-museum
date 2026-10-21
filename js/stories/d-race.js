(function(){
const {STAGES,K,W,H,clone,clamp,ez,rng,hexA,ms,Rec,pace,grid,ctr,stateCol,drawNode,edgePts,polyAt,drawEdges,packet,dot,drawPacket,panel,kv,nodeStates,code,SC}=StoryKit;
/* ---------------- D · The race condition ---------------- */
SC.push({id:'race',hall:'race',wing:'tasks',letter:'D',title:'The race condition: two workers, one pizza',
 question:'Two workers both try to sell the last margherita at the same moment. Can both of them succeed?',
 intuition:'If two workers each read the stock and then write it back, both can see “1 left” before either one writes. Both sell, and you have oversold.',
 takeaway:'The bug is the gap between reading the stock and writing it. A lock closes the gap by making the second worker wait. An atomic conditional UPDATE closes it by doing the check and the write in one statement.',
 next:'failure',
 nodes:{w1:{x:24,y:84,w:130,h:76,kind:'worker',label:'Worker 1',sub:'order A'},w2:{x:24,y:380,w:130,h:76,kind:'worker',label:'Worker 2',sub:'order B'},
  row:{x:395,y:228,w:170,h:84,kind:'row',label:'inventory',sub:'margherita'},out:{x:780,y:212,w:160,h:116,kind:'result',label:'Orders confirmed',sub:''}},
 edges:[['w1','row'],['w2','row'],['row','out']],
 options:[{id:'fix',label:'Protect the read-then-write',primary:true,def:'none',choices:[['none','Nothing'],['lock','SELECT … FOR UPDATE'],['atomic','Atomic UPDATE … WHERE stock > 0']],
  note:'Run it with nothing first. Then use a lock or an atomic statement and run it again.'}],
 metrics:[['confirmed','Orders confirmed',String,0],['stock','Final stock',String,0],['oversold','Oversold',String,-1],['waited','Worker 2 waited',function(v){return ms(v);},-1]],
 obj:{w1:{what:'A worker handling order A.',why:'Workers run in parallel. That is the point of having more than one.',rel:['tasks','race'],state:function(s){return s.w1;}},
  w2:{what:'A worker handling order B, at the same moment.',why:'Concurrency means the steps of the two workers can interleave in any order.',rel:['tasks','race'],state:function(s){return s.w2;}},
  row:{what:'One row: inventory(item=margherita, stock).',why:'The shared state both workers read and write.',rel:['transactions','database'],state:function(s){return 'stock = '+s.stock+(s.lock?' · locked by '+s.lock:'');}},
  out:{what:'Orders the restaurant has promised to cook.',why:'This is where the bug shows: promises beyond the stock.',rel:['delivery'],state:function(s){return s.ok.length+' confirmed: '+s.ok.join(', ');}}},
 build:function(o){
  const R=new Rec({stock:1,lock:null,w1:'idle',w2:'idle',l1:null,l2:null,ok:[],no:[],sql:[],waited:0});
  R.add({type:'setup',src:'row',dst:'row',stage:1,key:'start',hold:true,dur:1.4,pk:{txt:'stock = 1'},chapter:'watch',label:'One pizza left',
   say:'There is <b>one</b> margherita left. Orders A and B arrive together, and each is handled by a different worker.',data:{row:'inventory(item=margherita, stock=1)'}});
  if(o.fix==='none'){
   R.add({type:'sql.read',src:'w1',dst:'row',pk:{txt:'SELECT stock'},dur:1.1,stage:2,key:'r1',chapter:'mech',fx:function(s){s.l1=1;s.w1='read stock = 1';},label:'W1 reads 1',say:'Worker 1 reads <b>stock = 1</b>.',data:{sql:'SELECT stock FROM inventory WHERE item = \'margherita\''}});
   R.add({type:'sql.read',src:'w2',dst:'row',pk:{txt:'SELECT stock'},dur:1.1,key:'r2',warn:true,hold:true,fx:function(s){s.l2=1;s.w2='read stock = 1';},label:'W2 reads 1',
    say:'Worker 2 reads <b>stock = 1</b> as well, because worker 1 has not written anything yet. <b>This interleaving is the bug.</b>',
    why:{cause:'Both reads happened before either write.',consequence:'Both workers now believe there is one pizza left.',response:'Make the check and the write one atomic step, or make the second reader wait.',tradeoff:'Any fix adds either waiting (locks) or a retry or a refusal (atomic or optimistic).'}});
   R.add({type:'decide',src:'w1',dst:'w1',pk:{txt:'1 > 0 → sell'},dur:.9,fx:function(s){s.w1='decided: sell';},label:'W1 decides to sell',say:'Worker 1: 1 &gt; 0, so it sells.'});
   R.add({type:'sql.write',src:'w1',dst:'row',pk:{txt:'SET stock = 0'},dur:1.1,fx:function(s){s.stock=0;s.w1='wrote 0';},label:'W1 writes 0',say:'Worker 1 writes <b>stock = 0</b>.',changes:['stock: 1 → 0']});
   R.add({type:'confirm',src:'row',dst:'out',good:true,pk:{txt:'A ✓'},dur:1,fx:function(s){s.ok.push('A');},label:'Order A confirmed',say:'Order A is confirmed.'});
   R.add({type:'decide',src:'w2',dst:'w2',pk:{txt:'1 > 0 → sell'},warn:true,dur:.9,fx:function(s){s.w2='decided: sell (stale)';},label:'W2 decides on a stale value',say:'Worker 2 decides using its <b>stale</b> copy: 1 &gt; 0, so it also sells.'});
   R.add({type:'sql.write',src:'w2',dst:'row',pk:{txt:'SET stock = 0'},bad:true,dur:1.1,fx:function(s){s.stock=0;s.w2='wrote 0';},label:'W2 writes 0 (lost update)',
    say:'Worker 2 writes <b>stock = 0</b> again. The row looks correct, and that is why this bug is so hard to notice.',changes:['stock: 0 → 0']});
   R.add({type:'confirm',src:'row',dst:'out',bad:true,pk:{txt:'B ✓ ?!'},key:'oversold',hold:true,stage:3,dur:1.3,chapter:'trade',fx:function(s){s.ok.push('B');},label:'Oversold',
    say:'Order B is confirmed too. <b>Two orders, one pizza.</b> No error was raised anywhere.',
    why:{cause:'Read, then decide, then write, as three separate steps. Another worker ran in the gap.',consequence:'Two confirmed orders for one pizza, and stock still shows 0. No error and no log line.',response:'Use SELECT … FOR UPDATE, or UPDATE … SET stock = stock − 1 WHERE stock > 0 and check the row count.',tradeoff:'Locks serialise access and can deadlock. Atomic updates only work when the rule fits in one statement.'}});
  }else if(o.fix==='lock'){
   R.add({type:'sql.lock',src:'w1',dst:'row',pk:{txt:'FOR UPDATE'},dur:1.2,stage:2,key:'r1',chapter:'mech',fx:function(s){s.lock='W1';s.l1=1;s.w1='holds lock, read 1';},label:'W1 locks the row',
    say:'Worker 1 runs <code>BEGIN; SELECT stock … FOR UPDATE</code>. It reads 1 and now <b>holds a row lock</b>.',data:{sql:'SELECT stock FROM inventory WHERE item=\'margherita\' FOR UPDATE'}});
   R.add({type:'sql.lock',src:'w2',dst:'row',pk:{txt:'FOR UPDATE'},warn:true,dur:1.3,key:'r2',hold:true,fx:function(s){s.w2='blocked, waiting for the lock';},label:'W2 must wait',
    say:'Worker 2 asks for the same row lock and <b>blocks</b>. It cannot read until worker 1 finishes.',
    why:{cause:'The row is locked by worker 1\'s open transaction.',consequence:'Worker 2 waits. It cannot see a value that is about to change.',response:'Keep the transaction short, so the wait stays short.',tradeoff:'Concurrency on this row drops to one worker at a time. Locks taken in different orders can deadlock.'}});
   R.add({type:'sql.write',src:'w1',dst:'row',pk:{txt:'SET stock = 0'},dur:1.1,fx:function(s){s.stock=0;s.w1='wrote 0';},label:'W1 writes 0',say:'Worker 1 writes stock = 0.',changes:['stock: 1 → 0']});
   R.add({type:'sql.commit',src:'w1',dst:'row',pk:{txt:'COMMIT'},good:true,dur:1,fx:function(s){s.lock=null;s.w1='committed';s.ok.push('A');s.waited=38;},label:'W1 commits; lock released',say:'Worker 1 commits. Order A is confirmed and the lock is released.'});
   R.add({type:'sql.lock',src:'w2',dst:'row',pk:{txt:'stock = 0'},dur:1.1,fx:function(s){s.lock='W2';s.l2=0;s.w2='holds lock, read 0';},label:'W2 finally reads 0',say:'Worker 2 gets the lock and reads the <b>current</b> value: <b>0</b>.'});
   R.add({type:'reject',src:'row',dst:'out',good:true,pk:{txt:'B: sold out'},key:'oversold',hold:true,stage:3,dur:1.3,chapter:'trade',fx:function(s){s.lock=null;s.w2='rolled back: sold out';s.no.push('B');},label:'B is told “sold out”',
    say:'Worker 2 rolls back and tells customer B <b>sold out</b>. One pizza, one order.',
    why:{cause:'The lock serialised the two read-then-write sequences.',consequence:'Correct result. Worker 2 waited about 38 ms.',response:'Use this when the rule needs several statements, or reads that must stay consistent.',tradeoff:'Throughput on hot rows is limited, and lock waits show up as latency.'}});
  }else{
   R.add({type:'sql.update',src:'w1',dst:'row',pk:{txt:'UPDATE … WHERE stock>0'},dur:1.3,stage:2,key:'r1',chapter:'mech',fx:function(s){s.stock=0;s.w1='1 row updated';},label:'W1: 1 row updated',
    say:'Worker 1 runs <code>UPDATE inventory SET stock = stock − 1 WHERE item=\'margherita\' AND stock &gt; 0</code>. The database checks and writes in one step, and <b>1 row is updated</b>.',changes:['stock: 1 → 0'],
    data:{sql:'UPDATE … SET stock = stock - 1 WHERE … AND stock > 0',rowcount:'1'}});
   R.add({type:'confirm',src:'row',dst:'out',good:true,pk:{txt:'A ✓'},dur:1,fx:function(s){s.ok.push('A');},label:'Order A confirmed',say:'Row count 1, so order A is confirmed.'});
   R.add({type:'sql.update',src:'w2',dst:'row',pk:{txt:'UPDATE … WHERE stock>0'},dur:1.3,key:'r2',hold:true,fx:function(s){s.w2='0 rows updated';},label:'W2: 0 rows updated',
    say:'Worker 2 runs the same statement. <code>stock &gt; 0</code> is now false, so <b>0 rows are updated</b>. Nothing was read in advance, so nothing was stale.',
    why:{cause:'The condition and the write are evaluated together, under the row lock the UPDATE itself takes.',consequence:'Only one UPDATE can match. The other sees 0 rows.',response:'Always check the row count. 0 means you lost the race.',tradeoff:'Fast and simple, but only for rules that fit in one statement.'}});
   R.add({type:'reject',src:'row',dst:'out',good:true,pk:{txt:'B: sold out'},key:'oversold',hold:true,stage:3,dur:1.3,chapter:'trade',fx:function(s){s.no.push('B');s.w2='told customer: sold out';},label:'B is told “sold out”',
    say:'Row count 0, so customer B is told <b>sold out</b>. Correct, with no waiting.'});
  }
  R.add({type:'end',src:'out',dst:'out',stage:7,key:'end',hold:true,dur:1.2,chapter:'prod',label:'Result',say:'Result: <b>'+R.s.ok.length+'</b> order(s) confirmed for 1 pizza.'});
  const s=R.s;return{s0:R.s0,events:R.ev,metrics:{confirmed:s.ok.length,stock:s.stock,oversold:Math.max(0,s.ok.length-1),waited:s.waited}};},
 draw:function(c,X){const s=X.S,N=X.def.nodes,acc=X.acc;
  /* lanes */
  const lane=function(y,lbl){c.strokeStyle='#22314F';c.setLineDash([2,4]);c.beginPath();c.moveTo(170,y);c.lineTo(760,y);c.stroke();c.setLineDash([]);
   T(c,lbl,760,y-10,FM(500,9),K.faint,'right');};
  lane(122,'worker 1 timeline');lane(418,'worker 2 timeline');
  let k1=0,k2=0;const upto=X.i;
  for(let i=0;i<upto;i++){const e=X.run.events[i];if(e.src!=='w1'&&e.src!=='w2')continue;
   const isW1=e.src==='w1',k=isW1?k1++:k2++,x=190+k*120,y=isW1?122:418;
   const col=e.bad?K.bad:e.warn?K.wait:e.good?K.ok:acc;c.font=FM(500,9.5);
   let lb=e.label.replace(/^W[12] /,'');while(lb.length>4&&c.measureText(lb).width>100)lb=lb.slice(0,-2);if(lb!==e.label.replace(/^W[12] /,''))lb+='…';
   const w=Math.min(112,c.measureText(lb).width+14);
   rr(c,x,y-11,w,22,6);c.fillStyle=hexA(col,.15);c.fill();c.strokeStyle=col;c.lineWidth=1;c.stroke();T(c,lb,x+7,y,FM(500,9.5),'#fff','left');}
  /* row value */
  const r=N.row;T(c,'stock = '+s.stock,r.x+r.w/2,r.y+r.h+18,FS(700,15),s.stock>0?K.ok:K.wait);
  if(s.lock){T(c,'🔒 locked by '+s.lock,r.x+r.w/2,r.y-14,FM(600,10.5),K.wait);}
  /* local copies */
  if(s.l1!=null)T(c,'local copy: '+s.l1,N.w1.x+N.w1.w/2,N.w1.y+N.w1.h+16,FM(500,10),K.dim);
  if(s.l2!=null)T(c,'local copy: '+s.l2,N.w2.x+N.w2.w/2,N.w2.y-12,FM(500,10),s.stock!==s.l2?K.wait:K.dim);
  /* outcome */
  const out=N.out;const over=s.ok.length>1;
  T(c,s.ok.length?s.ok.map(function(x){return x+' ✓';}).join('  '):'—',out.x+out.w/2,out.y+out.h-22,FS(700,18),over?K.bad:K.ok);
  if(s.no.length)T(c,s.no.join(', ')+': sold out',out.x+out.w/2,out.y+out.h+16,FM(500,10),K.dim);
  if(over)T(c,'2 orders · 1 pizza',out.x+out.w/2,out.y-14,FM(700,11),K.bad);
 },
 chapters:[
  {id:'problem',n:'The problem',html:'<p>Workers run in parallel. Each one follows the same safe-looking logic: read the stock, check it, write it. The logic is correct for one worker. With two, their steps interleave, and the combined result can be wrong.</p>'},
  {id:'intuition',n:'The intuition',html:'<p>Two waiters glance at the same whiteboard, both see “1 tiramisu”, and both promise it to their table. The board was right when each of them looked at it.</p>'},
  {id:'watch',n:'What you are watching',anchor:'start',html:'<p>Each worker has a timeline. Every step it takes appears as a chip. The row in the middle is the shared state, and the box on the right counts confirmed orders. Watch where worker 2\'s read lands relative to worker 1\'s write.</p>'},
  {id:'mech',n:'How it goes wrong',anchor:'r2',html:'<p>This is a <b>lost update</b>, a check-then-act race. Both reads see the same version. Each write is valid on its own, but the second one is based on a value that is no longer true. Under READ COMMITTED isolation, the default in PostgreSQL, nothing stops this.</p>'},
  {id:'code',n:'Code',html:code("-- ✗ racy\nstock = db.one(\"SELECT stock FROM inventory WHERE item=%s\", item)\nif stock > 0:\n    db.run(\"UPDATE inventory SET stock=%s WHERE item=%s\", stock-1, item)\n\n-- ✓ pessimistic: hold the row while you decide\nwith db.transaction():\n    stock = db.one(\"SELECT stock ... FOR UPDATE\", item)\n    if stock > 0: db.run(\"UPDATE ... SET stock = stock - 1 ...\")\n\n-- ✓ atomic: the condition is part of the write\nn = db.run(\"UPDATE inventory SET stock = stock - 1\"\n           \" WHERE item=%s AND stock > 0\", item).rowcount\nif n == 0: raise SoldOut")},
  {id:'trade',n:'Trade-offs',anchor:'oversold',html:'<ul><li><b>Lock (pessimistic)</b>: handles any amount of logic, but the second worker waits, hot rows serialise, and inconsistent lock order causes deadlocks.</li><li><b>Atomic UPDATE</b>: no waiting in your code and very fast, but only works when the rule fits in one statement.</li><li><b>Optimistic</b> (a version column): no locks, the loser retries. Good when conflicts are rare.</li></ul>'},
  {id:'fail',n:'Failure modes',html:'<ul><li>The bug only appears under concurrency, so tests run one at a time never catch it.</li><li>Caches and in-memory counters race the same way.</li><li>Holding a lock across a network call (for example, payment) turns a fast wait into a long one.</li></ul>'},
  {id:'prod',n:'In production',anchor:'end',html:'<ul><li>Use a constraint as the last line of defence: <code>CHECK (stock &gt;= 0)</code>.</li><li>Test with real parallelism: two connections, and a barrier between read and write.</li><li>Monitor lock waits and deadlocks (<code>pg_locks</code>, <code>log_lock_waits</code>).</li></ul>'},
  {id:'rel',n:'Related',rel:['race','transactions','tasks','database']},
  {id:'check',n:'Check yourself',quiz:[
   {q:'Why did nothing raise an error in the racy version?',a:['Errors were swallowed','Each statement was valid on its own; only the interleaving was wrong','The database was down'],ok:1,why:'Races are logic bugs in how steps combine, not failures of individual steps.'},
   {q:'What must you check after the atomic UPDATE?',a:['The new stock value','The affected row count','Nothing'],ok:1,why:'0 rows means the condition failed: you lost the race and the item is gone.'}]}]
});

})();

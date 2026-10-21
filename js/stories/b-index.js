(function(){
const {STAGES,K,W,H,clone,clamp,ez,rng,hexA,ms,Rec,pace,grid,ctr,stateCol,drawNode,edgePts,polyAt,drawEdges,packet,dot,drawPacket,panel,kv,nodeStates,code,SC}=StoryKit;
/* ---------------- B · Why indexes matter ---------------- */
(function(){
 const ROWS=[];for(let k=0;k<63;k++)ROWS.push({id:4701+k,st:(k*7)%10<7?'paid':((k*7)%10<9?'cooking':'open')});
 const PAGES=16,PER=4;function pageOf(k){return Math.floor(k/PER);}
 const LEAF=8;function leafOf(k){return Math.floor(k/LEAF);}
 SC.push({id:'index',hall:'indexes',wing:'data',letter:'B',title:'Why database indexes matter',
  question:'The customer asks “where is order 4719?”. How much of the table does the database have to read to answer?',
  intuition:'Without an index, the database has to read every page. An index is a sorted map that lets it go almost directly to the right page, and every write has to keep that map up to date.',
  takeaway:'Index on a selective column: 4 page reads instead of 16 here, and about 4 instead of about 100,000 at ten million rows. The cost is one extra page written on every insert and extra storage. For an unselective predicate, the planner correctly ignores the index.',
  next:'queue',custom:true,
  nodes:{index:{x:20,y:46,w:420,h:330,label:'B-tree index'},heap:{x:460,y:46,w:480,h:330,label:'Table pages (heap)'},planner:{x:20,y:392,w:420,h:130,label:'Planner'},cost:{x:460,y:392,w:480,h:130,label:'Cost'}},
  options:[
   {id:'idx',label:'Index on the queried column',primary:true,def:'off',choices:[['off','No index'],['on','B-tree index']],note:'Run it once without the index, then again with it. The Experiment tab keeps both results.'},
   {id:'q',label:'Query',def:'id',choices:[['id','WHERE id = 4719 (1 row)'],['status',"WHERE status = 'paid' (most rows)"]],note:'A selective predicate matches few rows. An unselective one matches most of the table.'}],
  metrics:[['reads','Pages read',String,-1],['rows','Rows examined',String,-1],['time','Modelled time',function(v){return v.toFixed(2)+' ms';},-1],
   ['big','Same query at 10M rows',function(v){return v>=1000?(v/1000).toFixed(1)+' s':v.toFixed(1)+' ms';},-1],['writes','Pages written per INSERT',String,-1],['extra','Extra storage (pages)',String,-1]],
  obj:{index:{what:'A B-tree: sorted keys in pages, with each level pointing to the level below.',why:'Turns “read everything” into “descend three or four levels”.',rel:['indexes','structures'],
    state:function(s){return s.plan?s.plan:'Not consulted yet.';}},
   heap:{what:'The table itself: rows stored in fixed-size pages, in insertion order.',why:'This is where the rows actually live. The index only points to them.',rel:['database'],
    state:function(s){return s.read.filter(Boolean).length+' of '+PAGES+' pages read · '+s.rows+' rows examined.';}},
   planner:{what:'The query planner estimates the cost of each plan and picks the cheapest one.',why:'The same SQL can run as a scan or an index lookup. The planner decides using statistics.',rel:['indexes','bigo'],
    state:function(s){return s.plan||'Waiting for a query.';}},
   cost:{what:'What this query cost, and what it would cost at production size.',why:'At 63 rows every plan is fast. Indexes matter as tables grow.',rel:['bigo'],state:function(s){return s.reads+' page reads.';}}},
  build:function(o){
   const idx=o.idx==='on',sel=o.q==='id',target=18;
   const R=new Rec({read:new Array(PAGES+1).fill(0),cur:-1,path:[],rows:0,found:[],reads:0,rand:0,plan:'',ins:null,written:[]});
   R.add({type:'sql.query',src:'planner',dst:'planner',stage:1,key:'start',hold:true,dur:1.4,pk:{txt:'EXPLAIN'},chapter:'watch',concept:'indexes',
    label:'The query arrives',say:'The API asks: <code>'+(sel?'SELECT * FROM orders WHERE id = 4719':"SELECT * FROM orders WHERE status = 'paid'")+'</code>. The table has 63 rows in 16 pages.',
    data:{sql:sel?'WHERE id = 4719':"WHERE status = 'paid'",rows:'63',pages:'16',index:idx?'orders_'+(sel?'id':'status')+'_idx':'none'}});
   const useIdx=idx&&sel;
   const plan=useIdx?'Index Scan using orders_id_idx':(idx&&!sel?'Seq Scan (index ignored: ~44 of 63 rows match)':'Seq Scan on orders');
   R.add({type:'plan.choose',src:'planner',dst:useIdx?'index':'heap',dur:1.3,pk:{txt:useIdx?'Index Scan':'Seq Scan'},key:'plan',chapter:'mech',stage:2,hold:idx&&!sel,
    warn:idx&&!sel,fx:function(s){s.plan=plan;},label:'Pick a plan',
    say:useIdx?'An index on <code>id</code> exists, and the predicate matches one row. The planner chooses an <b>Index Scan</b>.':
     idx?'An index on <code>status</code> exists, but about 70% of the rows match. Fetching them one at a time through the index would cost more than reading 16 pages in order, so the planner <b>ignores the index</b>.':
     'There is no index on <code>'+(sel?'id':'status')+'</code>. The only possible plan is to read every page: a <b>Seq Scan</b>.',
    why:idx&&!sel?{cause:'Low selectivity: the predicate matches about 44 of 63 rows.',consequence:'Random page reads for 44 rows cost more than one sequential pass over 16 pages.',response:'This is the planner working correctly. An index only helps when it lets the database skip most of the table.',tradeoff:'This index still costs a page write on every INSERT and UPDATE, and it never speeds this query up.'}:null,
    data:{plan:plan}});
   if(useIdx){
    const steps=[['index','root','root page · keys 4733'],['index','int0','internal · keys 4709 4717 4725'],['index','leaf2','leaf · 4717…4724'],['heap','p'+pageOf(target),'heap page '+pageOf(target)]];
    steps.forEach(function(st,i){const last=i===3;
     R.add({type:last?'heap.fetch':'index.descend',src:i?'index':'planner',dst:st[0],dur:1.1,pk:{txt:st[2].split(' · ')[0]},stage:2,key:i===0?'descend':last?'fetch':null,chapter:last?'mech':'mech',
      fx:function(s){s.path.push(st[1]);s.reads++;s.rand++;if(last){s.read[pageOf(target)]=1;s.cur=pageOf(target);s.rows+=1;s.found.push(target);}},
      label:last?'Fetch the row':'Read '+st[2].split(' · ')[0],
      say:last?'The leaf entry points straight to <b>heap page '+pageOf(target)+'</b>. One page is fetched and one row is examined.':
       i===0?'Start at the root. 4719 &lt; 4733, so go left.':i===1?'Internal page: 4719 is between 4717 and 4725, so follow the third pointer.':'Leaf page: <b>4719</b> is here, with the address of its row.',
      changes:['pages read: '+(i+1)],data:{page:st[2],'random reads':String(i+1)}});});
    R.add({type:'result',src:'heap',dst:'planner',good:true,key:'result',hold:true,stage:3,dur:1.3,pk:{txt:'1 row'},chapter:'trade',label:'Answer: 1 row',
     say:'Found with <b>4 page reads</b>. The other <b>15 heap pages were never touched</b>.',
     why:{cause:'The B-tree keeps keys sorted, so each level rules out most of the remaining keys.',consequence:'Lookup cost grows with the depth of the tree (log of the row count), not with the row count itself.',response:'Index the columns your hot queries filter or join on.',tradeoff:'Every INSERT, UPDATE or DELETE of an indexed column must also update the tree.'}});
   }else{
    for(let p=0;p<PAGES;p++){const lo=p*PER,hi=Math.min(ROWS.length,lo+PER);const m=[];
     for(let k=lo;k<hi;k++)if(sel?k===target:ROWS[k].st==='paid')m.push(k);
     const isT=sel&&m.length;
     R.add({type:'heap.scan',src:p?'heap':'planner',dst:'heap',dur:sel?.55:.4,pk:{txt:'page '+p},stage:2,key:p===0?'scan':isT?'hit':null,hold:false,warn:false,good:!!isT,
      fx:function(s){s.read[p]=1;s.cur=p;s.reads++;s.rows+=hi-lo;m.forEach(function(k){s.found.push(k);});},
      label:'Read page '+p+(isT?' — match':''),
      say:isT?'Page '+p+' contains <b>4719</b>, but the scan cannot stop here. Without an index or a unique constraint, the database does not know there is no second match.':
       'Read page '+p+': '+(hi-lo)+' rows examined'+(m.length?', '+m.length+' match':'')+'.',
      changes:['pages read: '+(p+1),'rows examined: '+hi]});}
    R.add({type:'result',src:'heap',dst:'planner',good:sel?false:true,warn:sel,key:'result',hold:true,stage:3,dur:1.3,pk:{txt:R.s.found.length+' row'+(R.s.found.length>1?'s':'')},chapter:'trade',
     label:'Answer: '+R.s.found.length+(R.s.found.length===1?' row':' rows'),
     say:'Answered after reading <b>all 16 pages</b> and examining <b>63 rows</b>'+(sel?' to return one.':'.'),
     why:sel?{cause:'No index on id, so a full table scan was the only possible plan.',consequence:'Work grows linearly with the table. At 10 million rows, the same query reads about 100,000 pages.',response:'CREATE INDEX on id. Switch the Experiment option to “B-tree index” and run it again.',tradeoff:'At 63 rows a scan is about as fast as an index. The difference appears as the table grows.'}:
      {cause:'The query asks for most of the table.',consequence:'Reading pages in order is the cheapest way to return most of them.',response:'Nothing to fix. For reports, consider a summary table or a covering index.',tradeoff:'An index here would only add write cost.'}});
   }
   R.add({type:'sql.insert',src:'planner',dst:'heap',dur:1.2,pk:{txt:'INSERT 4764'},key:'write',stage:5,hold:true,chapter:'trade',
    fx:function(s){s.ins=4764;s.written=idx?['heap page 15','index leaf 7']:['heap page 15'];},label:'Now a write',
    say:idx?'A new order arrives: <code>INSERT … id 4764</code>. The row goes to heap page 15, <b>and</b> its key must be placed in index leaf 7: <b>2 pages written</b> instead of 1.':'A new order arrives: <code>INSERT … id 4764</code>. Only heap page 15 changes: <b>1 page written</b>.',
    why:idx?{cause:'Every index on the table must contain every row.',consequence:'Writes cost one more page (and WAL record) per index. A full leaf has to split.',response:'Index what you query, drop what you do not.',tradeoff:'Faster reads cost slower writes and more storage. Five indexes means about five extra page writes on every insert.'}:null,
    changes:idx?['heap page 15: +1 row','index leaf 7: +1 key']:['heap page 15: +1 row']});
   R.add({type:'end',src:'cost',dst:'cost',dur:1.2,stage:7,key:'end',hold:true,chapter:'prod',label:'Compare the cost',say:'Compare the cost panel. Then switch one option in the Experiment tab and run it again.'});
   const s=R.s,time=s.rand?s.reads*0.3:s.reads*0.08+s.rows*0.002;
   const big=useIdx?4*0.3:100000*0.08+1e7*0.0002;
   return{s0:R.s0,events:R.ev,metrics:{reads:s.reads,rows:s.rows,time:time,big:big,writes:idx?2:1,extra:idx?11:0}};},
  draw:function(c,X){const s=X.S,o=X.opts,idx=o.idx==='on',sel=o.q==='id',acc=X.acc,st=X.ns;
   /* index */
   const ix=X.def.nodes.index;panel(c,ix.x,ix.y,ix.w,ix.h,idx?'orders_'+(sel?'id':'status')+'_idx · B-tree':'Index');
   if(st.index==='sel'){rr(c,ix.x-4,ix.y-4,ix.w+8,ix.h+8,12);c.strokeStyle=hexA(acc,.7);c.setLineDash([4,4]);c.stroke();c.setLineDash([]);}
   if(!idx){T(c,'No index on orders.'+(sel?'id':'status'),ix.x+ix.w/2,ix.y+ix.h/2-8,FS(600,14),K.dim);
    T(c,'the only plan is to read every page',ix.x+ix.w/2,ix.y+ix.h/2+14,FS(400,11.5),K.faint);}
   else if(!sel){T(c,'Index on status exists',ix.x+ix.w/2,ix.y+ix.h/2-8,FS(600,14),K.wait);
    T(c,'…but 70% of rows match, so the planner skips it',ix.x+ix.w/2,ix.y+ix.h/2+14,FS(400,11.5),K.dim);}
   else{const on=function(id){return s.path.indexOf(id)>=0;};
    const root={x:180,y:82,w:100,h:34,id:'root',t:'< 4733'},ints=[{x:80,y:166,w:110,h:34,id:'int0',t:'4709·4717·4725'},{x:270,y:166,w:110,h:34,id:'int1',t:'4741·4749·4757'}];
    const leaves=[];for(let i=0;i<8;i++)leaves.push({x:32+i*50,y:262,w:44,h:56,id:'leaf'+i,t:String(4701+i*8)});
    c.lineWidth=1;
    ints.forEach(function(n){c.strokeStyle=on(n.id)?acc:'#2A3958';c.beginPath();c.moveTo(root.x+root.w/2,root.y+root.h);c.lineTo(n.x+n.w/2,n.y);c.stroke();});
    leaves.forEach(function(l,i){const p=ints[i<4?0:1];c.strokeStyle=on(l.id)?acc:'#24324F';c.beginPath();c.moveTo(p.x+p.w/2,p.y+p.h);c.lineTo(l.x+l.w/2,l.y);c.stroke();});
    [root].concat(ints).concat(leaves).forEach(function(n){const h=on(n.id);rr(c,n.x,n.y,n.w,n.h,6);c.fillStyle=h?hexA(acc,.2):K.card;c.fill();
     c.strokeStyle=h?acc:'#2A3958';c.lineWidth=h?2:1;c.stroke();
     T(c,n.t,n.x+n.w/2,n.y+(n.h>40?16:n.h/2),FM(500,n.h>40?9:9.5),h?'#fff':K.dim);
     if(n.h>40){T(c,'…',n.x+n.w/2,n.y+34,FM(500,9),K.faint);}});
    T(c,'root',root.x+root.w+10,root.y+root.h/2,FM(500,9),K.faint,'left');T(c,'internal',ix.x+ix.w-14,183,FM(500,9),K.faint,'right');
    T(c,'leaves → row addresses',ix.x+ix.w/2,340,FM(500,9),K.faint);
    if(s.ins){const l=leaves[7];rr(c,l.x-3,l.y-3,l.w+6,l.h+6,8);c.strokeStyle=K.wait;c.lineWidth=2;c.stroke();T(c,'+4764',l.x+l.w/2,l.y+l.h+12,FM(600,9.5),K.wait);}}
   /* heap */
   const hp=X.def.nodes.heap;panel(c,hp.x,hp.y,hp.w,hp.h,'orders · heap · 16 pages × 4 rows');
   if(st.heap==='sel'){rr(c,hp.x-4,hp.y-4,hp.w+8,hp.h+8,12);c.strokeStyle=hexA(acc,.7);c.setLineDash([4,4]);c.stroke();c.setLineDash([]);}
   const skipped=idx&&sel&&s.path.length===4;
   for(let p=0;p<PAGES;p++){const gx=hp.x+16+(p%4)*116,gy=hp.y+30+Math.floor(p/4)*74,w=104,h=64;
    const rd=s.read[p],cur=s.cur===p;
    rr(c,gx,gy,w,h,6);c.fillStyle=cur?hexA(acc,.22):rd?hexA(acc,.08):K.card;c.fill();
    c.strokeStyle=cur?acc:rd?hexA(acc,.5):'#26365A';c.lineWidth=cur?2:1;c.stroke();
    T(c,'p'+p,gx+8,gy+10,FM(600,8.5),cur?'#fff':K.faint,'left');
    for(let r=0;r<PER;r++){const k=p*PER+r;if(k>=ROWS.length&&!(s.ins&&p===15))continue;
     const isNew=k>=ROWS.length,row=isNew?{id:4764,st:'open'}:ROWS[k];
     const hit=s.found.indexOf(k)>=0;
     T(c,String(row.id),gx+8,gy+24+r*11,FM(hit?600:400,8.5),isNew?K.wait:hit?K.ok:rd?'#B8C6E0':'#4B5B7E','left');
     T(c,row.st,gx+w-8,gy+24+r*11,FM(400,8),hit?K.ok:'#435273','right');}
    if(skipped&&!rd){c.save();rr(c,gx,gy,w,h,6);c.clip();c.globalAlpha=.55;c.strokeStyle='#2E3D5E';c.beginPath();
     for(let d=-h;d<w;d+=10){c.moveTo(gx+d,gy+h);c.lineTo(gx+d+h,gy);}c.stroke();c.restore();}}
   if(skipped)T(c,'hatched = never read',hp.x+hp.w-14,hp.y+14,FM(500,9),K.faint,'right');
   /* planner */
   const pl=X.def.nodes.planner;panel(c,pl.x,pl.y,pl.w,pl.h,'Planner · EXPLAIN');
   T(c,sel?'SELECT * FROM orders WHERE id = 4719;':"SELECT * FROM orders WHERE status = 'paid';",pl.x+14,pl.y+40,FM(500,11),'#A8C4F0','left');
   T(c,s.plan?'→ '+s.plan:'→ …',pl.x+14,pl.y+66,FM(600,11.5),s.plan?(s.plan.indexOf('Index')===0?K.ok:K.wait):K.faint,'left');
   if(s.ins)T(c,'INSERT 4764 → writes: '+s.written.join(' + '),pl.x+14,pl.y+92,FM(500,10.5),K.wait,'left');
   if(st.planner==='active'||st.planner==='sel'){rr(c,pl.x,pl.y,pl.w,pl.h,10);c.strokeStyle=acc;c.lineWidth=2;c.stroke();}
   /* cost */
   const cs=X.def.nodes.cost;panel(c,cs.x,cs.y,cs.w,cs.h,'Cost so far');c.__kvw=150;
   kv(c,cs.x+14,cs.y+40,'Pages read',s.reads+' / 16',s.reads>6?K.wait:K.ok);
   kv(c,cs.x+14,cs.y+62,'Rows examined',String(s.rows));
   kv(c,cs.x+14,cs.y+84,'Random / sequential',s.rand+' / '+(s.reads-s.rand));
   kv(c,cs.x+14,cs.y+106,'Pages per INSERT',s.ins?String(s.written.length):'—',s.ins&&s.written.length>1?K.wait:K.dim);
   T(c,'at 10M rows: '+(o.idx==='on'&&sel?'≈ 4 page reads':'≈ 100,000 page reads'),cs.x+cs.w-14,cs.y+40,FM(600,10.5),o.idx==='on'&&sel?K.ok:K.bad,'right');
  },
  chapters:[
   {id:'problem',n:'The problem',html:'<p>Customers ask “where is my order?” thousands of times a minute. If each question reads the whole <code>orders</code> table, the database spends its capacity reading rows that do not match.</p>'},
   {id:'intuition',n:'The intuition',html:'<p>A book index: instead of reading every page to find “B-tree”, you look it up in the sorted list at the back and turn straight to the right page.</p>'},
   {id:'watch',n:'What you are watching',anchor:'start',html:'<p>On the right are the table\'s 16 pages. On the left is the index, if there is one. A page lights up when it is read. With an index, hatched pages are pages the query <b>never touched</b>. The cost panel counts every page read.</p>'},
   {id:'mech',n:'How a B-tree lookup works',anchor:'descend',html:'<p>Keys are kept sorted in pages. Each internal page splits the key range, and the leaves hold <code>(key → row address)</code>. A lookup reads one page per level and then fetches the row. With a fan-out of several hundred keys per page, ten million rows fit in about 3–4 levels.</p>'},
   {id:'scan',n:'How a scan works',anchor:'scan',html:'<p>A sequential scan reads every page in physical order and tests every row. Sequential reads are cheap per page, but the number of pages grows with the table.</p>'},
   {id:'code',n:'Code',html:code("-- see the plan before and after\nEXPLAIN ANALYZE SELECT * FROM orders WHERE id = 4719;\n--  Seq Scan on orders  (rows=1) (actual ... rows removed by filter: 62)\n\nCREATE INDEX CONCURRENTLY orders_id_idx ON orders (id);\n\nEXPLAIN ANALYZE SELECT * FROM orders WHERE id = 4719;\n--  Index Scan using orders_id_idx on orders (rows=1)\n\n-- an index the planner will (rightly) ignore:\nCREATE INDEX orders_status_idx ON orders (status);\nEXPLAIN SELECT * FROM orders WHERE status = 'paid';\n--  Seq Scan on orders  Filter: (status = 'paid')")},
   {id:'trade',n:'Trade-offs',anchor:'write',html:'<ul><li><b>Reads</b>: a lookup touches a few pages instead of all of them.</li><li><b>Writes</b>: every insert, update or delete of an indexed column also updates the tree, and a full leaf splits.</li><li><b>Storage</b>: here the index adds 11 pages to a 16-page table.</li><li><b>Selectivity</b>: an index helps when it lets the database skip most rows. For <code>status = \'paid\'</code> (70% of rows), a scan is cheaper, and the planner chooses it.</li></ul>'},
   {id:'fail',n:'Failure modes',html:'<ul><li>A missing index on a foreign key makes joins and cascading deletes scan.</li><li>A function on the column (<code>WHERE lower(email)=…</code>) cannot use a plain index.</li><li>Stale statistics make the planner choose badly. <code>ANALYZE</code> refreshes them.</li><li>Too many indexes slow every write and inflate WAL and replication traffic.</li></ul>'},
   {id:'prod',n:'In production',anchor:'end',html:'<ul><li>Use <code>CREATE INDEX CONCURRENTLY</code> so the build does not block writes.</li><li>Use <code>pg_stat_statements</code> to find the queries worth indexing, and <code>pg_stat_user_indexes</code> to find indexes nobody uses.</li><li>Composite index order matters: <code>(customer_id, created_at)</code> serves “recent orders for a customer”.</li></ul>'},
   {id:'rel',n:'Related',rel:['indexes','database','bigo','structures','transactions']},
   {id:'check',n:'Check yourself',quiz:[
    {q:'Why did the scan keep reading after finding 4719?',a:['It was slow','Without an index or unique constraint it cannot know there is no second 4719','Pages must be read in pairs'],ok:1,why:'The scan stops at the end of the table, not at the first match.'},
    {q:"Why was the status index ignored?",a:['A bug in the planner','About 70% of rows match, so one sequential pass is cheaper','Indexes only work on numbers'],ok:1,why:'Selectivity decides. An index pays off when it lets the query skip most of the table.'}]}]
 });
})();

})();

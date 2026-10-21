(function(){
const {STAGES,K,W,H,clone,clamp,ez,rng,hexA,ms,Rec,pace,grid,ctr,stateCol,drawNode,edgePts,polyAt,drawEdges,packet,dot,drawPacket,panel,kv,nodeStates,code,SC}=StoryKit;
/* ---------------- A · Follow an order ---------------- */
SC.push({id:'order',hall:'rest',wing:'protocols',letter:'A',title:'Follow one order through the system',
 question:'What actually happens between “Place order” and the SMS that says it is ready?',
 intuition:'An order is a chain of hand-offs. The customer only waits for the part that must happen before the answer, and the rest is done afterwards.',
 takeaway:function(o,m){
  if(m.status>=400)return 'The request failed with '+m.status+' after '+ms(m.wait)+', before any state changed: 0 rows written, 0 events published. Failing at the boundary is cheap, and the client can fix the problem and retry safely.';
  if(o.mode==='sync')return 'The customer waited '+ms(m.wait)+', and nearly all of that was kitchen work running inside the request. Sync gives a stronger promise (“it printed”), but the slowest step now sets the latency, and a failing SMS provider would fail the order too.';
  return 'The customer waited '+ms(m.wait)+' for authentication, validation, one database commit and one publish, not for the kitchen. Choosing which work happens before the response and which happens after it is one of the most important decisions in this design.';},
 next:'index',
 nodes:{
  customer:{x:24,y:214,w:130,h:76,kind:'client',label:'Customer',sub:'table 7 · phone'},
  api:{x:214,y:214,w:136,h:76,kind:'app',label:'API',sub:'HTTP contract'},
  auth:{x:214,y:58,w:136,h:70,kind:'app',label:'Auth',sub:'who is asking'},
  orders:{x:410,y:214,w:150,h:76,kind:'app',label:'Order service',sub:'placeOrder()'},
  db:{x:620,y:214,w:150,h:76,kind:'data',label:'PostgreSQL',sub:'orders table'},
  log:{x:410,y:388,w:150,h:70,kind:'infra',label:'Event log',sub:'Kafka · orders'},
  worker:{x:620,y:388,w:150,h:70,kind:'app',label:'Kitchen worker',sub:'prints the ticket'},
  notify:{x:810,y:388,w:130,h:70,kind:'service',label:'Notifications',sub:'SMS'}},
 edges:[['customer','api'],['api','auth'],['api','orders'],['orders','db'],['orders','log',null,function(o){return o.mode!=='sync';}],
  ['log','worker',null,function(o){return o.mode!=='sync';}],['orders','worker',null,function(o){return o.mode==='sync';},true],
  ['worker','notify'],['notify','customer',[[875,500],[89,500]],null,true]],
 options:[
  {id:'mode',label:'When does the kitchen work happen?',primary:true,def:'async',choices:[['async','After the response (async)'],['sync','Before the response (sync)']],
   note:'Async publishes an event and answers immediately. Sync prints the ticket and sends the SMS inside the request.'},
  {id:'fault',label:'Inject a fault',def:'none',choices:[['none','None'],['token','Expired token'],['body','Invalid body'],['dbslow','Slow database']],
   note:'Each fault fails at a different hop, and changes what was written before the failure.'}],
 metrics:[['wait','Customer waited',function(v){return ms(v);},-1],['status','HTTP status',String,0],['rows','Rows written',String,0],
  ['events','Events published',String,0],['after','Work after the response',function(v){return ms(v);},0]],
 obj:{
  customer:{what:'The client: a phone at table 7.',why:'Every system exists for someone making a request.',rel:['rest','delivery'],
   state:function(s){return s.answered?'Has its answer: '+s.status+' after '+ms(s.respT):'Waiting for a response.';}},
  api:{what:'The HTTP contract: receive, authenticate, validate, route, answer.',why:'Clients should not need to know how the kitchen works.',rel:['rest','rpc-graphql'],
   state:function(s){return s.valid===false?'Rejected the body (400).':s.auth==='expired'?'Rejected the token (401).':'Routing POST /orders.';}},
  auth:{what:'Checks who is asking, on every request.',why:'Authorisation needs an identity; anyone can send HTTP.',rel:['rest','mcp'],
   state:function(s){return s.auth?'Token: '+s.auth:'Not yet consulted.';}},
  orders:{what:'The use case: where “place an order” is decided.',why:'Business rules need one home, independent of HTTP and SQL.',rel:['architecture','principles'],
   state:function(s){return s.rows.length?'Order #'+s.rows[0].id+' placed.':'No order yet.';}},
  db:{what:'The source of truth. Committed rows survive restarts.',why:'The order must outlive this request and this machine.',rel:['database','transactions','indexes'],
   state:function(s){return s.rows.length+' committed row(s).';}},
  log:{what:'An append-only log of facts. Consumers read it at their own pace.',why:'The order service does not need to know who reacts to OrderPlaced.',rel:['kafka','pubsub'],
   state:function(s){return s.log.length?s.log.length+' event(s): '+s.log.join(', '):'Empty.';}},
  worker:{what:'A process that does the slow work outside the request.',why:'Printing and cooking take seconds; the customer should not hold a connection for that.',rel:['tasks','race'],
   state:function(s){return s.ticket?'Ticket printed.':'Idle.';}},
  notify:{what:'A subscriber that turns events into SMS.',why:'A new reaction without changing the publisher.',rel:['pubsub','delivery'],
   state:function(s){return s.sms?'SMS sent.':'Nothing sent yet.';}}},
 build:function(o){
  const R=new Rec({rows:[],log:[],answered:false,respT:0,status:null,ticket:false,sms:false,auth:null,valid:null});
  const net=12;let t=0;
  R.add({at:0,type:'client.compose',src:'customer',dst:'customer',stage:1,key:'start',hold:true,dur:1.4,pk:{txt:'POST /orders'},chapter:'watch',concept:'rest',
   label:'Build the request',say:'Table 7 taps <b>Place order</b>. The phone builds an HTTP request: <code>POST /orders</code>, a JSON body, a bearer token and an <code>Idempotency-Key</code> so that a retry cannot create a second order.',
   data:{method:'POST',endpoint:'/orders',body:'{"table":7,"items":["margherita","tiramisu"]}',token:o.fault==='token'?'expired 4 min ago':'valid','Idempotency-Key':'b7f1…07'}});
  t+=net;R.add({at:t,type:'http.request',src:'customer',dst:'api',stage:2,dur:1.3,pk:{txt:'POST /orders'},concept:'rest',label:'Request crosses the network',
   say:'The request reaches the API after <b>'+net+' ms</b> on the network. Nothing has been decided yet.',data:{latency:net+' ms',protocol:'HTTPS · HTTP/1.1'}});
  t+=4;R.add({at:t,type:'auth.verify',src:'api',dst:'auth',dur:1,pk:{txt:'verify token'},concept:'rest',label:'Authenticate',
   say:'The API first asks <b>who is calling</b>. Authentication happens before any business code runs.'});
  if(o.fault==='token'){
   t+=8;R.add({at:t,type:'auth.reject',src:'auth',dst:'api',bad:true,dur:1.1,pk:{txt:'expired'},fx:function(s){s.auth='expired';},label:'Token rejected',stage:3,
    say:'The token expired four minutes ago. Auth answers <b>no</b> in 8 ms.',changes:['auth result: expired']});
   t+=net;R.add({at:t,type:'http.response',src:'api',dst:'customer',bad:true,key:'response',hold:true,dur:1.3,stage:5,pk:{txt:'401'},chapter:'fail',
    fx:function(s){s.answered=true;s.respT=t;s.status=401;},label:'401 Unauthorized',
    say:'The customer receives <b>401 Unauthorized</b> after <b>'+ms(t)+'</b>. No business code ran.',
    why:{cause:'The bearer token expired before the request arrived.',consequence:'The request failed before any state changed: 0 rows and 0 events. A failure this early is cheap to recover from.',
     response:'The client refreshes its token and sends the same request again with the same Idempotency-Key.',tradeoff:'Checking identity costs about 8 ms on every request. Skipping that check is not a safe option.'},
    data:{status:'401 Unauthorized','WWW-Authenticate':'Bearer error="invalid_token"'},changes:['customer: answered (401)']});
   return finish();}
  t+=8;R.add({at:t,type:'auth.ok',src:'auth',dst:'api',good:true,dur:.9,pk:{txt:'user 42 ✓'},fx:function(s){s.auth='user 42';},label:'Identity confirmed',
   say:'Auth confirms <b>user 42</b>.',changes:['auth result: user 42']});
  t+=2;R.add({at:t,type:'api.validate',src:'api',dst:'api',dur:1,pk:{txt:'schema check'},key:'validate',chapter:'mech',bad:o.fault==='body',
   fx:function(s){s.valid=o.fault!=='body';},label:'Validate the body',
   say:o.fault==='body'?'The body has <b>no items</b>. The API rejects it at the boundary.':'The API checks the body against the contract: table is an integer and items is a non-empty list.',
   data:{schema:'OrderCreate v2',result:o.fault==='body'?'items: must not be empty':'valid'}});
  if(o.fault==='body'){
   t+=net;R.add({at:t,type:'http.response',src:'api',dst:'customer',bad:true,key:'response',hold:true,stage:5,dur:1.3,pk:{txt:'400'},chapter:'fail',
    fx:function(s){s.answered=true;s.respT=t;s.status=400;},label:'400 Bad Request',
    say:'<b>400 Bad Request</b> after <b>'+ms(t)+'</b>, with a message that names the field.',
    why:{cause:'The client sent a body that breaks the contract (items is empty).',consequence:'The API rejected it at the edge. The order service and the database never saw it.',
     response:'Fix the client. Retrying the same body returns the same 400, because the request itself is wrong.',tradeoff:'Strict validation rejects some requests that might have been usable. Loose validation lets bad data into the system.'},
    data:{status:'400 Bad Request',error:'items: must not be empty'}});
   return finish();}
  t+=1;R.add({at:t,type:'rpc.call',src:'api',dst:'orders',dur:1,pk:{txt:'placeOrder(cmd)'},concept:'architecture',label:'Hand the use case over',
   say:'The API turns HTTP into a plain command and calls the order service. The service never sees HTTP.'});
  const ins=o.fault==='dbslow'?900:14;
  t+=2;R.add({at:t,type:'sql.insert',src:'orders',dst:'db',dur:1.1,pk:{txt:'BEGIN · INSERT'},key:'db',chapter:'mech',concept:'transactions',label:'Write the order',
   say:'Inside one transaction: <code>INSERT INTO orders (table_no, items, total) VALUES (7, …, 17.50)</code>.',data:{sql:'INSERT INTO orders … RETURNING id'}});
  t+=ins;R.add({at:t,type:'sql.commit',src:'db',dst:'orders',good:o.fault!=='dbslow',warn:o.fault==='dbslow',dur:o.fault==='dbslow'?2.4:1,pk:{txt:'COMMIT · id 4711'},
   fx:function(s){s.rows.push({id:4711,table:7,total:'17.50'});},label:o.fault==='dbslow'?'Commit — slowly':'Committed',stage:3,hold:o.fault==='dbslow',
   say:o.fault==='dbslow'?'The commit took <b>'+ins+' ms</b> instead of 14 ms. The request is held for the whole time.':'The row is durable: <b>order #4711</b> now survives a crash. ('+ins+' ms)',
   why:o.fault==='dbslow'?{cause:'The insert waited about 900 ms, for example on a lock, a saturated disk, or a missing index on a foreign key.',consequence:'Every request in flight waits too. Connection-pool slots stay occupied, and new requests queue behind them.',
    response:'Set a statement timeout, find the slow query, and keep transactions short.',tradeoff:'A short timeout fails some requests quickly. A long one makes all requests slow.'}:null,
   changes:['orders: +1 row (#4711)'],data:{rows:'1',duration:ms(ins)}});
  if(o.mode==='sync'){
   t+=2;R.add({at:t,type:'call.inline',src:'orders',dst:'worker',dur:1,pk:{txt:'printTicket()'},label:'Print the ticket inline',stage:4,
    say:'In <b>sync</b> mode the request itself waits while the kitchen ticket is printed.'});
   t+=1800;R.add({at:t,type:'work',src:'worker',dst:'worker',dur:2.2,warn:true,pk:{txt:'cooking ticket'},fx:function(s){s.ticket=true;},label:'Kitchen work (1.8 s)',
    say:'1.8 s of work happens <b>while the customer is still waiting</b> on the open connection.',changes:['ticket printed']});
   t+=350;R.add({at:t,type:'sms.send',src:'worker',dst:'notify',dur:1.2,pk:{txt:'SMS'},fx:function(s){s.sms=true;},label:'Send the SMS inline',
    say:'Then the SMS is sent too (350 ms). If the SMS provider is down, the order request now fails as well.'});
   t+=2;
  }else{
   t+=5;R.add({at:t,type:'event.publish',src:'orders',dst:'log',dur:1.1,pk:{txt:'OrderPlaced #4711'},key:'publish',chapter:'code',concept:'kafka',
    fx:function(s){s.log.push('OrderPlaced#4711@0');},label:'Publish OrderPlaced',
    say:'The service appends the fact <b>OrderPlaced #4711</b> to the event log (offset 0). It does not know, or wait for, whoever reacts to it.',
    changes:['event log: +OrderPlaced at offset 0'],data:{topic:'orders',partition:'0',offset:'0',key:'4711'}});
  }
  t+=1;R.add({at:t,type:'rpc.return',src:'orders',dst:'api',dur:.8,pk:{txt:'#4711'},label:'Back to the API',say:'The use case returns the new order id.'});
  t+=net;R.add({at:t,type:'http.response',src:'api',dst:'customer',good:true,key:'response',hold:true,stage:3,dur:1.3,pk:{txt:'201 Created'},chapter:'trade',
   fx:function(s){s.answered=true;s.respT=t;s.status=201;},label:'201 Created',
   say:'The customer has an answer after <b>'+ms(t)+'</b>: <code>201 Created</code>, <code>Location: /orders/4711</code>.'+(o.mode==='sync'?' Almost all of that time was kitchen work.':' The kitchen has not started yet, and the customer does not need to wait for it.'),
   why:o.mode==='sync'?{cause:'The ticket and the SMS ran inside the request.',consequence:'The customer waited '+ms(t)+'. A slow kitchen or a failing SMS provider now affects ordering as well.',response:'Publish an event and answer immediately. Do the slow work in a worker.',tradeoff:'Sync is simpler, and the customer knows the ticket really printed.'}:
    {cause:'Only the work that must succeed before answering ran in the request: auth, validation, commit and publish.',consequence:'The customer waited '+ms(t)+'. The kitchen work will happen later and can be retried on its own.',response:'Tell the customer “Order received”, not “Order ready”. The SMS will confirm later.',tradeoff:'The system is now eventually consistent. The order exists before its ticket does, and failures after the response need their own handling.'},
   data:{status:'201 Created',Location:'/orders/4711',latency:ms(t)},changes:['customer: answered (201)']});
  if(o.mode!=='sync'){
   t+=40;R.add({at:t,type:'event.consume',src:'log',dst:'worker',dur:1.1,pk:{txt:'OrderPlaced'},key:'async',stage:3,chapter:'code',concept:'tasks',label:'Worker picks the event up',
    say:'<b>After</b> the customer already has an answer, a kitchen worker reads OrderPlaced from the log.'});
   t+=1800;R.add({at:t,type:'work',src:'worker',dst:'worker',dur:2,pk:{txt:'cooking ticket'},fx:function(s){s.ticket=true;},label:'Kitchen work (1.8 s)',
    say:'The same 1.8 s of kitchen work, but no customer connection is held open while it runs.',changes:['ticket printed']});
   t+=350;R.add({at:t,type:'sms.send',src:'worker',dst:'notify',dur:1.1,pk:{txt:'notify'},fx:function(s){s.sms=true;},label:'Ask for an SMS',say:'The worker asks Notifications to text the customer.'});
  }
  t+=600;R.add({at:t,type:'sms.deliver',src:'notify',dst:'customer',good:true,dur:1.6,stage:7,hold:true,key:'end',pk:{txt:'SMS: ready'},chapter:'prod',label:'SMS arrives',
   say:'The SMS arrives at '+ms(t)+' after the tap. The customer had their <b>201</b> at '+ms(R.s.respT)+'.'});
  return finish();
  function finish(){const s=R.s;return{s0:R.s0,events:R.ev,metrics:{wait:s.respT,status:s.status,rows:s.rows.length,events:s.log.length,after:s.answered?Math.max(0,R.t-s.respT):0}};}
 },
 draw:function(c,X){const s=X.S,tNow=X.t;
  panel(c,620,58,320,130,'What the customer sees');
  c.__kvw=130;kv(c,634,90,'Waiting for',s.answered?ms(s.respT)+' ✓':ms(tNow),s.answered?K.ok:K.wait);
  kv(c,634,114,'Status',s.status?String(s.status):'…',s.status>=400?K.bad:s.status?K.ok:K.dim);
  kv(c,634,138,'Server clock',ms(tNow));kv(c,634,162,'Kitchen ticket',s.ticket?'printed':'not yet',s.ticket?K.ok:K.dim);
  if(s.rows.length){T(c,'row #4711 · table 7 · €17.50',695,306,FM(500,10),K.ok,'center','middle');}
  if(s.log.length){T(c,'[0] OrderPlaced #4711',485,474,FM(500,10),K.ok,'center','middle');}
 },
 chapters:[
  {id:'problem',n:'The problem',html:'<p>A customer taps one button. Behind it, six components need to agree that an order exists, and two of them are slow. If every step happens while the customer waits, the slowest dependency decides how slow ordering is.</p>'},
  {id:'intuition',n:'The intuition',html:'<p>Think of the front of house and the kitchen. The waiter writes the order down, puts the ticket on the rail and tells you “got it”. They do not stand at your table while the pizza bakes.</p>'},
  {id:'watch',n:'What you are watching',anchor:'start',html:'<p>Each moving label is one real message. Its colour shows the outcome: accent for in progress, <b style="color:var(--ok)">green</b> for success, <b style="color:var(--bad)">red</b> for failure, and <b style="color:var(--wait)">amber</b> for slow. The clock in “What the customer sees” stops when the response arrives.</p>'},
  {id:'mech',n:'How it works',anchor:'validate',html:'<ul><li><b>Authenticate</b>: who is asking (401 if unknown).</li><li><b>Validate</b>: is the body well-formed (400 if not)?</li><li><b>Decide</b>: the order service applies the rules. It knows nothing about HTTP.</li><li><b>Commit</b>: one transaction makes the order durable.</li><li><b>Publish</b>: record the fact that it happened.</li><li><b>Respond</b>: 201 plus the new resource\'s Location.</li></ul>'},
  {id:'code',n:'Code',anchor:'publish',html:code('@app.post("/orders", status_code=201)\ndef create_order(body: OrderCreate, user=Depends(auth),\n                 key: str = Header(alias="Idempotency-Key")):\n    with db.transaction():                       # one unit of work\n        order = orders.place(user, body, key)    # rules live here\n        outbox.add("OrderPlaced", order.id)      # same transaction\n    return Response(status_code=201,\n                    headers={"Location": f"/orders/{order.id}"})\n\n# a separate process relays the outbox to Kafka;\n# workers consume OrderPlaced and print the ticket')+
   '<p>The <b>outbox</b> row is written in the same transaction as the order, so it is impossible to have “order saved, event lost”. A relay then publishes it to the log.</p>'},
  {id:'trade',n:'Trade-offs',anchor:'response',html:'<ul><li><b>Async is faster to answer</b> and isolates the customer from slow or failing work.</li><li><b>Async is harder to reason about.</b> The order exists before its ticket does, and a failure after 201 needs retries, a dead-letter queue, and a way to tell the customer.</li><li><b>Sync is simpler</b> and gives a stronger promise (“it printed”), but the slowest step in the chain sets the latency.</li></ul><p>Use the <b>Experiment</b> tab to switch between the two and compare the numbers.</p>'},
  {id:'fail',n:'Failure modes',html:'<ul><li><b>401 / 400</b>: cheap, early, and no state changes.</li><li><b>Slow database</b>: every request in flight waits, and pool slots run out.</li><li><b>Crash after commit, before publish</b>: the outbox pattern exists for this case.</li><li><b>Client retries after a timeout</b>: the Idempotency-Key turns a second POST into the same order.</li></ul>'},
  {id:'prod',n:'In production',anchor:'end',html:'<ul><li>Propagate a trace id (W3C <code>traceparent</code>) through every hop. Then this whole picture is one trace in your observability tool.</li><li>Set timeouts at every arrow.</li><li>Measure p99 latency, not the average. The slowest 1% of requests is where customers notice problems.</li></ul>'},
  {id:'rel',n:'Related',html:'',rel:['rest','transactions','kafka','tasks','delivery','architecture']},
  {id:'check',n:'Check yourself',quiz:[
   {q:'Why does the async version answer faster?',a:['The database is faster in async mode','The kitchen work is moved out of the request','HTTP/2 is used'],ok:1,why:'The same 1.8 s of work still happens, but the customer no longer waits for it.'},
   {q:'With an expired token, how many rows were written?',a:['0','1','It depends on retries'],ok:0,why:'Authentication runs before the use case, so a 401 fails before any state changes.'}]}]
});

})();

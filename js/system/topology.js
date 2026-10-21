/* ======================================================================
   THE LIVING SYSTEM
   One fictional software system — a restaurant — simulated continuously.
   The museum does not contain several unrelated diagrams. It contains
   ONE system, and every department is a different view of it.

     topology  -> blueprint view, system view, slice mode, capstone
     simulator -> control room, runtime view, failure lab, incidents
     requests  -> follow-the-request, traces, observability

   Nothing below is decoration: every node is a component that a hall
   explains, every number is produced by a queueing model, and every
   failure switch changes those numbers the way the real failure would.
   ====================================================================== */

/* ---- the slice layers (§ slice-the-system) ------------------------- */
const SYS_LAYERS=[
 {id:'business',  name:'Business',       note:'People and the thing they actually want.'},
 {id:'app',       name:'Application',    note:'The code that implements the use case.'},
 {id:'services',  name:'Services',       note:'Separate processes this one depends on.'},
 {id:'data',      name:'Data',           note:'Where state lives and how it is found.'},
 {id:'infra',     name:'Infrastructure', note:'What routes, buffers and carries the work.'},
 {id:'network',   name:'Network',        note:'The links — the part that is allowed to lie.'}
];

/* ---- the software body (§ software-body) ---------------------------
   A second reading of the same topology. Intuition first, then it is
   dropped: no node is EXPLAINED by its organ, only introduced by it. */
const SYS_BODY={
 skeleton:{name:'Skeleton',    note:'Interfaces and contracts — the shape everything else hangs on.'},
 circulation:{name:'Circulation',note:'Requests and responses moving through the system.'},
 nerves:{name:'Nervous system',note:'Events: something happened, and the news travels.'},
 memory:{name:'Memory',        note:'What survives the request — durable and cached.'},
 muscle:{name:'Muscle',        note:'Workers: where the slow work is actually done.'},
 immune:{name:'Immune system', note:'Authentication, authorization, validation.'},
 reflex:{name:'Reflexes',      note:'Retries, timeouts, breakers, health checks.'},
 brain:{name:'Brain',          note:'Orchestration and decisions, including agents.'}
};

/* ---- the topology ---------------------------------------------------
   stage = how far into the journey this node appears (§ the world evolves)
   concept = the hall that explains it, so every box is clickable
   x,y = blueprint coordinates on a 1000x560 sheet                      */
const SYS_NODES=[
 {id:'customer',kind:'person', label:'Customer',    sub:'wants dinner',        layer:'business',body:'circulation',stage:0,concept:'rest',      x:28, y:236,w:118,h:62},
 {id:'web',     kind:'client', label:'Web / mobile',sub:'the client',          layer:'business',body:'skeleton',   stage:0,concept:'rest',      x:168,y:236,w:118,h:62},
 {id:'lb',      kind:'infra',  label:'Load balancer',sub:'picks an instance',  layer:'infra',   body:'circulation',stage:3,concept:'scaling',   x:308,y:239,w:118,h:56},
 {id:'api',     kind:'app',    label:'API',         sub:'HTTP contract',       layer:'app',     body:'skeleton',   stage:1,concept:'rest',      x:448,y:236,w:118,h:62},
 {id:'auth',    kind:'app',    label:'Auth',        sub:'who is asking',       layer:'app',     body:'immune',     stage:2,concept:'rest',      x:448,y:128,w:118,h:52},
 {id:'orders',  kind:'app',    label:'Order service',sub:'the use case',       layer:'app',     body:'brain',      stage:1,concept:'architecture',x:596,y:232,w:130,h:70},
 {id:'cache',   kind:'data',   label:'Cache',       sub:'Redis — recent reads',layer:'data',body:'memory',    stage:2,concept:'scaling',   x:752,y:128,w:118,h:56},
 {id:'db',      kind:'data',   label:'Database',    sub:'PostgreSQL — truth',layer:'data',  body:'memory',     stage:1,concept:'database',  x:752,y:232,w:118,h:62},
 {id:'replica', kind:'data',   label:'Read replica',sub:'may be behind',       layer:'data',    body:'memory',     stage:3,concept:'cap',       x:900,y:236,w:118,h:54},
 {id:'search',  kind:'services',label:'Search',     sub:'an index of the menu',layer:'services',body:'memory',     stage:3,concept:'indexes',   x:752,y:34, w:118,h:50},
 {id:'queue',   kind:'infra',  label:'Queue',       sub:'work that can wait',  layer:'infra',   body:'nerves',     stage:2,concept:'tasks',     x:596,y:362,w:130,h:56},
 {id:'worker',  kind:'app',    label:'Workers',     sub:'consume jobs',        layer:'app',     body:'muscle',     stage:2,concept:'tasks',     x:752,y:362,w:118,h:56},
 {id:'kitchen', kind:'person', label:'Kitchen',     sub:'the real work',       layer:'business',body:'muscle',     stage:0,concept:'tasks',     x:900,y:362,w:118,h:56},
 {id:'broker',  kind:'infra',  label:'Event log',   sub:'Kafka — kept, replayable',layer:'infra',body:'nerves',stage:3,concept:'kafka',    x:596,y:466,w:130,h:54},
 {id:'notify',  kind:'services',label:'Notifications',sub:'tells the customer',layer:'services',body:'nerves',     stage:3,concept:'pubsub',     x:752,y:466,w:118,h:54},
 {id:'payment', kind:'services',label:'Payment',    sub:'someone else’s system',layer:'services',body:'circulation',stage:2,concept:'retries',x:900,y:128,w:118,h:56}
];
const SYS_W=1046, SYS_H=552;

/* C4 level 1 — the same system, one box (§ abstraction levels) */
const SYS_CONTEXT=[
 {id:'customer',kind:'person',label:'Customer',   sub:'orders dinner',      x:60, y:230,w:170,h:92},
 {id:'system',  kind:'system',label:'Restaurant', sub:'the system you are standing in',x:420,y:210,w:220,h:132},
 {id:'payment', kind:'ext',   label:'Payment provider',sub:'someone else runs this',x:810,y:110,w:180,h:86},
 {id:'notify',  kind:'ext',   label:'Email / SMS',sub:'someone else runs this',x:810,y:330,w:180,h:86}
];
const SYS_CONTEXT_EDGES=[
 {a:'customer',b:'system', label:'places an order'},
 {a:'system',  b:'payment',label:'charges the card'},
 {a:'system',  b:'notify', label:'confirms the order'}
];

/* C4 level 3 — inside one container. Only the ones worth opening. */
const SYS_COMPONENTS={
 orders:{title:'Order service',note:'The hexagon from the Principles wing, drawn at component level. Yellow is the domain, white is a port it owns, green is a replaceable adapter — and every arrow points inward.',
  nodes:[{id:'ctrl',label:'Controller',sub:'parses HTTP, nothing else',kind:'adapter',x:120,y:70,w:180,h:70,concept:'rest'},
         {id:'uc',  label:'PlaceOrder',sub:'the use case',            kind:'app',    x:400,y:70,w:190,h:70,concept:'architecture'},
         {id:'dom', label:'Order',     sub:'domain rules, no imports',kind:'domain', x:400,y:230,w:190,h:78,concept:'principles'},
         {id:'repo',label:'OrderRepo', sub:'port — an interface',kind:'port',   x:690,y:230,w:190,h:70,concept:'principles'},
         {id:'sql', label:'SqlOrderRepo',sub:'adapter — writes SQL',kind:'adapter',x:690,y:380,w:190,h:70,concept:'database'},
         {id:'out', label:'Outbox',    sub:'event + row, one commit',kind:'app',    x:400,y:380,w:190,h:70,concept:'delivery'}],
  edges:[{a:'ctrl',b:'uc',label:'place(cart)'},{a:'uc',b:'dom',label:'Order.create()'},
         {a:'uc',b:'repo',label:'save(order)'},{a:'repo',b:'sql',label:'implements'},
         {a:'uc',b:'out',label:'OrderPlaced'},{a:'dom',b:'repo',label:'owns the port'}]},
 db:{title:'Database',note:'The storage engine, drawn the way the Data wing explains it.',
  nodes:[{id:'plan',label:'Query planner',sub:'decides scan or seek',kind:'app', x:120,y:70,w:190,h:70,concept:'indexes'},
         {id:'btree',label:'B-tree index',sub:'sorted, shallow',     kind:'data',x:430,y:70,w:190,h:70,concept:'indexes'},
         {id:'heap',label:'Table heap',   sub:'the rows themselves',  kind:'data',x:430,y:230,w:190,h:70,concept:'database'},
         {id:'mvcc',label:'MVCC',         sub:'row versions per txn', kind:'app', x:740,y:150,w:190,h:70,concept:'transactions'},
         {id:'wal', label:'Write-ahead log',sub:'durability lives here',kind:'data',x:430,y:380,w:190,h:70,concept:'transactions'}],
  edges:[{a:'plan',b:'btree',label:'index scan'},{a:'plan',b:'heap',label:'seq scan'},
         {a:'btree',b:'heap',label:'row pointer'},{a:'heap',b:'mvcc',label:'visibility'},
         {a:'heap',b:'wal',label:'flushed before commit'}]},
 queue:{title:'Queue + workers',note:'What the Messaging wing calls a broker, opened up.',
  nodes:[{id:'ex',  label:'Exchange',   sub:'routing rules',          kind:'infra',x:120,y:150,w:180,h:70,concept:'rabbitmq'},
         {id:'q1',  label:'kitchen queue',sub:'bound order.placed.*', kind:'infra',x:420,y:60, w:190,h:66,concept:'rabbitmq'},
         {id:'q2',  label:'receipts queue',sub:'bound order.*.eu',    kind:'infra',x:420,y:190,w:190,h:66,concept:'rabbitmq'},
         {id:'dlq', label:'Dead letter',  sub:'poison messages leave',kind:'ext',  x:420,y:330,w:190,h:66,concept:'rabbitmq'},
         {id:'w',   label:'Worker pool',  sub:'prefetch, ack, retry', kind:'app',  x:720,y:120,w:190,h:70,concept:'tasks'}],
  edges:[{a:'ex',b:'q1',label:'binding'},{a:'ex',b:'q2',label:'binding'},
         {a:'q1',b:'w',label:'consume'},{a:'q2',b:'w',label:'consume'},{a:'w',b:'dlq',label:'nack × 3'}]}
};
const SYS_EDGES=[
 {a:'customer',b:'web',   kind:'sync', label:'taps order'},
 {a:'web',     b:'lb',    kind:'sync', label:'POST /orders', stage:3},
 {a:'web',     b:'api',   kind:'sync', label:'POST /orders'},
 {a:'lb',      b:'api',   kind:'sync', label:'routes',        stage:3},
 {a:'api',     b:'auth',  kind:'sync', label:'verify token',  stage:2},
 {a:'api',     b:'orders',kind:'sync', label:'place_order()'},
 {a:'orders',  b:'cache', kind:'sync', label:'get menu',      stage:2},
 {a:'orders',  b:'db',    kind:'sync', label:'INSERT order'},
 {a:'db',      b:'replica',kind:'repl',label:'streams changes',stage:3},
 {a:'orders',  b:'search',kind:'sync', label:'index menu',    stage:3},
 {a:'orders',  b:'payment',kind:'sync',label:'charge card',   stage:2},
 {a:'orders',  b:'queue', kind:'async',label:'enqueue job',   stage:2},
 {a:'queue',   b:'worker',kind:'async',label:'worker pulls',  stage:2},
 {a:'worker',  b:'kitchen',kind:'async',label:'cook it',      stage:2},
 {a:'worker',  b:'broker',kind:'event',label:'OrderPlaced',   stage:3},
 {a:'broker',  b:'notify',kind:'event',label:'subscriber',    stage:3}
];

/* ---- failures the visitor can cause (§ break the system) ------------ */
const SYS_FAILURES=[
 {id:'db',      label:'Database down',      hits:'db',     note:'Writes fail outright. Everything that needs the truth stops.'},
 {id:'cacheOut',label:'Cache down',         hits:'cache',  note:'Every read falls through to the database at once.'},
 {id:'payment', label:'Payment provider out',hits:'payment',note:'A dependency you do not own stops answering.'},
 {id:'slow',    label:'Slow API',           hits:'api',    note:'Not down — just slow. The worse of the two failures.'},
 {id:'worker',  label:'Workers crash',      hits:'worker', note:'Nothing rejects the work. It simply stops being done.'},
 {id:'partition',label:'Network partition', hits:'replica',note:'Two halves that each believe they are the system.'},
 {id:'dup',     label:'Duplicate messages', hits:'queue',  note:'The same event arrives twice. Was the card charged twice?'},
 {id:'stale',   label:'Replica falls behind',hits:'replica',note:'Reads succeed and are wrong. The quiet one.'}
];

/* ---- the mechanisms that answer them (§ failure laboratory) --------- */
const SYS_GUARDS=[
 {id:'timeout', label:'Timeout',        concept:'retries', note:'Stop waiting. A caller that waits forever spreads the outage.'},
 {id:'retry',   label:'Retry + backoff',concept:'retries', note:'Try again, later each time, so you do not become the outage.'},
 {id:'breaker', label:'Circuit breaker',concept:'retries', note:'After enough failures, stop calling. Fail fast, recover on a probe.'},
 {id:'fallback',label:'Fallback',       concept:'scaling', note:'A degraded answer beats an error page. Serve the stale menu.'},
 {id:'idem',    label:'Idempotency key',concept:'delivery',note:'The same key twice is one charge. This is what makes retries safe.'},
 {id:'dlq',     label:'Dead-letter queue',concept:'rabbitmq',note:'Poison messages leave the queue instead of blocking it.'},
 {id:'replicate',label:'Read replica',  concept:'cap',     note:'Spread reads. Now you own a staleness window.'},
 {id:'cacheOn', label:'Cache',          concept:'scaling', note:'Stop asking the same expensive question.'},
 {id:'ratelimit',label:'Rate limit (429)',concept:'scaling',note:'Past capacity, refuse some requests at the door instead of making every request slow.'}
];

/* ---- incidents: a scenario is a set of knobs (§ incidents) ---------- */
const SYS_INCIDENTS=[
 {id:'rush',    name:'Lunch rush',        brief:'Ten times the traffic, nothing else changed.',
  set:{traffic:420}, fail:[], teach:'Nothing is broken. Saturation alone is enough to take a system down — watch latency, not errors.'},
 {id:'payout',  name:'Payment provider down',brief:'A system you do not own stops answering.',
  set:{}, fail:['payment'], teach:'Your availability is now their availability — unless you time out, break the circuit and degrade.'},
 {id:'slowdb',  name:'Slow database',     brief:'Somebody dropped the index.',
  set:{index:false}, fail:[], teach:'The same query, the same data, a hundred times the work. Indexes are not an optimisation, they are the design.'},
 {id:'backlog', name:'Queue backlog',     brief:'Producers outrun consumers.',
  set:{traffic:260,workers:1}, fail:[], teach:'A queue absorbs a spike. It does not absorb a deficit — if arrival beats service, depth grows forever.'},
 {id:'split',   name:'Network partition', brief:'The two halves cannot reach each other.',
  set:{}, fail:['partition'], teach:'Now choose: refuse the write and stay correct, or accept it and reconcile later.'},
 {id:'stampede',name:'Cache stampede',    brief:'Everything expires at the same instant.',
  set:{traffic:300}, fail:['cacheOut'], teach:'The cache was load-bearing. Losing it does not add load — it multiplies it.'},
 {id:'twice',   name:'Duplicate delivery',brief:'The broker re-delivers an event.',
  set:{}, fail:['dup'], teach:'At-least-once is the normal guarantee. Exactly-once is something you build with an idempotency key.'}
];


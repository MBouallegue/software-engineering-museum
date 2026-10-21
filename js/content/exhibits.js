/* ======================================================================
   WINGS + EXHIBITS  —  the museum's content
   ====================================================================== */
const WINGS=[
 {id:'hub',        name:'THE LOBBY',                         short:'LOBBY',        blurb:'Start with the map of the museum. Learn how to learn here.', color:'#8C7BE0', cx:0,   cz:0,   w:0,  h:0},
 {id:'foundations',name:'DEPARTMENT OF PRINCIPLES & DESIGN', short:'PRINCIPLES',   blurb:'How do we make code easier to change, test, and understand?', color:'#F2B705', cx:-48, cz:-46, w:40, h:26},
 {id:'complexity', name:'DEPARTMENT OF ALGORITHMS',          short:'ALGORITHMS',   blurb:'How do we choose a solution, and how expensive is it?', color:'#43D9E8', cx:52,  cz:-46, w:40, h:26},
 {id:'dp',         name:'DEPARTMENT OF DYNAMIC PROGRAMMING',  short:'DYNAMIC PROGRAMMING', blurb:'How do we stop solving the same subproblem again and again?', color:'#9B7BE8', cx:2,   cz:-54, w:40, h:26},
 {id:'data',        name:'DEPARTMENT OF DATA & STORAGE',        short:'DATA & STORAGE', blurb:'Where does software remember things, and how does it find them again?', color:'#D99A52', cx:-2,  cz:-82, w:40, h:24},
 {id:'protocols',  name:'DEPARTMENT OF PROTOCOLS',            short:'PROTOCOLS',    blurb:'How do programs communicate, and who decides the shape of a conversation?', color:'#6FD08C', cx:60,  cz:2,   w:26, h:60},
 {id:'messaging',  name:'DEPARTMENT OF MESSAGING',            short:'MESSAGING',    blurb:'What happens when one program publishes work and other programs listen for it?', color:'#FF6B5A', cx:2,   cz:56,  w:40, h:26},
 {id:'tasks',      name:'DEPARTMENT OF CONCURRENCY & WORK',   short:'CONCURRENCY',  blurb:'How does software do many things at once without stepping on itself?', color:'#3FC1A9', cx:-50, cz:50,  w:34, h:26},
 {id:'containers', name:'DEPARTMENT OF INFRASTRUCTURE',      short:'INFRASTRUCTURE', blurb:'How does the same software move from your laptop into a running system?', color:'#5B8DEF', cx:-58, cz:2,   w:26, h:34},
 {id:'distributed',name:'DEPARTMENT OF DISTRIBUTED SYSTEMS',  short:'DISTRIBUTED',  blurb:'What changes when one computer becomes many computers connected by an unreliable network?', color:'#F06FA8', cx:54,  cz:50,  w:32, h:26}
];

const EXHIBITS=[
{
 id:'welcome', wing:'hub', title:'Start here', icon:'obelisk',
 lede:'You are at the bottom of a <b>single spiral ramp</b>. Walk it once and you pass every idea in the order you would actually meet it — write code, measure it, make it talk to other code, then keep it alive when the network lies.',
 viz:{type:'flow',w:900,h:390,
  nodes:[
   {id:'a',x:96,y:150,w:150,h:78,label:'Turn one',sub:'write it well',color:'#FFD166'},
   {id:'b',x:316,y:70,w:150,h:78,label:'Turn two',sub:'make it talk',color:'#83C167'},
   {id:'c',x:316,y:232,w:150,h:78,label:'Turn three',sub:'keep it alive',color:'#FC6255'},
   {id:'d',x:556,y:150,w:170,h:78,label:'The alcove',sub:'watch, then read',color:'#58C4DD'},
   {id:'e',x:772,y:150,w:106,h:78,label:'Recall',sub:'in the room',color:'#B18FE0'}],
  edges:[{a:'a',b:'b'},{a:'b',b:'c'},{a:'a',b:'d'},{a:'b',b:'d'},{a:'c',b:'d'},{a:'d',b:'e'}],
  steps:[
   {cap:'<b>Turn one.</b> Design principles, patterns, cost of code — Big-O, data structures, recursion, dynamic programming.',on:['a'],fly:[{e:'a>d',label:'foundations'}]},
   {cap:'<b>Turn two.</b> Every way two programs talk: REST, SOAP, gRPC, GraphQL, MCP, and the realtime options.',on:['b'],fly:[{e:'b>d',label:'protocols'}]},
   {cap:'<b>Turn three.</b> Brokers, workers, retries, containers, and what breaks the moment the network does.',on:['c'],fly:[{e:'c>d',label:'operations'}]},
   {cap:'<b>Every alcove works the same way.</b> The thing on the plinth acts the idea out. The wall panel says it in three lines. Enter for the animated blueprint and the notes.',on:['d'],fly:[{e:'a>b',label:'walk'},{e:'b>c',label:'walk'}]},
   {cap:'<b>Built to be recalled out loud.</b> The <i>Interview notes</i> drawer in each hall is one line per idea, phrased the way an interviewer expects to hear it.',on:['e'],fly:[{e:'d>e',label:'say it'}]}]},
 keys:[
  '<b>The building is the lesson.</b> The queue hall makes you watch a queue drain. The complexity hall races five runners down lanes of different length. The CAP hall breaks its own bridge.',
  '<b>Walk, or skip.</b> Drag the joystick (or hold <i>W A S D</i>), drag anywhere else to swing the camera. <i>Tour</i> walks you to the next hall on its own; <i>Map</i> searches every hall and jumps.',
  '<b>Read as little as you like.</b> Each wall panel is legible from the ramp. The full notes, code and primary-source links live behind one drawer inside.',
  '<b>It is one HTML file.</b> Drop it in a repo as <code>index.html</code>, turn on GitHub Pages, and the museum is live for anyone.'],
 cheat:[['Walk','Joystick, WASD, or arrow keys'],['Look','Drag anywhere on the room'],['Enter','Tap Enter or press E'],['Tour','Guided walk to the next unvisited hall'],['Index','Press M — search and jump'],['Progress','Visited halls keep a check mark']],
 refs:[['3Blue1Brown (the panel style)','https://www.3blue1brown.com/'],['Three.js','https://threejs.org/'],['GitHub Pages','https://pages.github.com/']]
},

/* ---------------- FOUNDATIONS ---------------- */
{
 id:'principles', wing:'foundations', title:'Design principles', icon:'ico',
 lede:'Principles are <b>pressure tests for a change</b>, not laws. They all push the same way: keep what changes together in one place, and keep everything else from knowing about it.',
 viz:{type:'flow',w:900,h:430,
  nodes:[
   {id:'h',x:120,y:100,w:190,h:70,label:'OrderService',sub:'high-level policy',color:'#FFD166'},
   {id:'i',x:430,y:100,w:190,h:70,label:'PaymentGateway',sub:'interface (port)',color:'#E9EDF7'},
   {id:'s',x:740,y:60,w:150,h:62,label:'Stripe',sub:'adapter',color:'#83C167'},
   {id:'p',x:740,y:160,w:150,h:62,label:'PayPal',sub:'adapter',color:'#83C167'},
   {id:'f',x:120,y:300,w:190,h:70,label:'God class',sub:'talks to Stripe SDK',color:'#FC6255'},
   {id:'g',x:560,y:300,w:200,h:70,label:'Stripe SDK',sub:'concrete detail',color:'#FC6255'}],
  edges:[{a:'h',b:'i'},{a:'s',b:'i',bend:-20},{a:'p',b:'i',bend:20},{a:'f',b:'g'}],
  steps:[
   {cap:'<b>The smell first.</b> A class that reaches straight for a vendor SDK now has a reason to change every time the vendor does.',on:['f','g'],fly:[{e:'f>g',label:'new stripe.Charge()',color:'#FC6255'}]},
   {cap:'<b>Dependency inversion (D).</b> Both sides depend on an interface that the <i>caller</i> owns. Arrows now point inward.',on:['h','i'],fly:[{e:'h>i',label:'charge(amount)'}]},
   {cap:'<b>Open/closed (O).</b> Adding PayPal adds a file. Nothing in OrderService opens.',on:['s','p','i'],fly:[{e:'s>i',label:'implements',color:'#83C167'},{e:'p>i',label:'implements',color:'#83C167'}]},
   {cap:'<b>Liskov (L).</b> Any adapter must be swappable without the caller learning which one it got — same errors, same guarantees.',on:['i','h'],fly:[{e:'p>i',label:'substitutable'}]}]},
 keys:[
  '<b>S — single responsibility.</b> One reason to change. Ask "who asks for this to change?" — if two different people do, split it.',
  '<b>O — open/closed.</b> Extend by adding code, not by editing a switch statement that already works.',
  '<b>L — Liskov substitution.</b> A subtype must honour the supertype\'s promises: no stricter inputs, no weaker outputs, no surprise exceptions.',
  '<b>I — interface segregation.</b> Many small interfaces beat one fat one; nobody should implement methods they must leave empty.',
  '<b>D — dependency inversion.</b> Policy depends on abstractions; details depend on abstractions. Wire the concrete classes at the edge (composition root).',
  '<b>Coupling vs cohesion</b> is the measurable version of all five: low coupling between modules, high cohesion inside one.',
  '<b>DRY is about knowledge</b>, not characters. Two identical lines that change for different reasons should stay two lines.',
  '<b>KISS / YAGNI</b> are the counterweight: an abstraction added for a future that never arrives is a permanent tax.'],
 cheat:[['SRP','One reason to change'],['OCP','Add code, don\'t edit working code'],['LSP','Subtypes keep the contract'],['ISP','Small interfaces over fat ones'],['DIP','Depend on abstractions, inject details'],['Coupling','How much module A knows about B'],['Cohesion','How related the parts inside A are'],['Law of Demeter','Talk to friends, not friends of friends'],['Best answer','"Composition over inheritance, and inject the dependency"']],
 refs:[['SOLID (Uncle Bob)','https://blog.cleancoder.com/uncle-bob/2020/10/18/Solid-Relevance.html'],['Refactoring catalogue','https://refactoring.com/catalog/'],['Law of Demeter','https://en.wikipedia.org/wiki/Law_of_Demeter']]
},
{
 id:'patterns', wing:'foundations', title:'Design patterns', icon:'box',
 lede:'Patterns are <b>names for shapes that keep reappearing</b>. Their real value in an interview is vocabulary: saying "strategy" saves a paragraph.',
 viz:{type:'flow',w:900,h:430,
  nodes:[
   {id:'ctx',x:110,y:190,w:180,h:74,label:'Context',sub:'holds a strategy',color:'#FFD166'},
   {id:'if',x:400,y:190,w:180,h:70,label:'Sorter',sub:'interface',color:'#E9EDF7'},
   {id:'q',x:700,y:70,w:160,h:60,label:'QuickSort',color:'#83C167'},
   {id:'m',x:700,y:190,w:160,h:60,label:'MergeSort',color:'#83C167'},
   {id:'e',x:700,y:310,w:160,h:60,label:'ExternalSort',color:'#B18FE0'},
   {id:'sub',x:110,y:330,w:180,h:64,label:'Observers',sub:'notified on change',color:'#58C4DD'}],
  edges:[{a:'ctx',b:'if'},{a:'q',b:'if',bend:-18},{a:'m',b:'if'},{a:'e',b:'if',bend:18},{a:'ctx',b:'sub',bend:0}],
  steps:[
   {cap:'<b>Strategy.</b> The context owns an interface, not an algorithm. Behaviour becomes a constructor argument.',on:['ctx','if'],fly:[{e:'ctx>if',label:'sort(rows)'}]},
   {cap:'<b>Swap at runtime.</b> Small data takes quicksort; a 40 GB file takes the external merge. Same call site.',on:['q','m','e'],fly:[{e:'e>if',label:'implements',color:'#B18FE0'}]},
   {cap:'<b>Observer.</b> The context announces "it changed"; subscribers decide what that means. This is the local version of an event bus.',on:['ctx','sub'],fly:[{e:'ctx>sub',label:'notify(event)',color:'#58C4DD'}]},
   {cap:'<b>Factory.</b> When choosing the implementation is itself a decision, move it into one place instead of sprinkling <i>if</i> across the codebase.',on:['if'],fly:[{e:'ctx>if',label:'make("merge")',color:'#FFD166'}]}]},
 keys:[
  '<b>Creational</b> — factory method, abstract factory, builder, prototype, singleton. They answer "who decides which class?".',
  '<b>Structural</b> — adapter, decorator, facade, proxy, composite, bridge, flyweight. They answer "how do these fit together?".',
  '<b>Behavioural</b> — strategy, observer, command, state, template method, iterator, mediator, chain of responsibility, visitor, memento. They answer "who talks to whom, when?".',
  '<b>Adapter vs facade:</b> adapter changes an interface to one you need; facade hides a messy subsystem behind a simpler one.',
  '<b>Decorator vs proxy:</b> decorator adds behaviour, proxy controls access (lazy load, cache, permissions) — same shape, different intent.',
  '<b>Singleton is the one to be careful with:</b> global state, hidden dependency, hostile to tests. Prefer one instance wired by your DI container.',
  '<b>Backend-flavoured patterns</b> matter more day to day: repository, unit of work, dependency injection, CQRS, saga, outbox, circuit breaker, sidecar.',
  '<b>Good answer to "which pattern?"</b> — name the force first ("this varies per tenant"), then the pattern. Patterns chosen without a force are architecture astronautics.'],
 cheat:[['Strategy','Algorithm becomes an injected object'],['Observer','Publisher notifies subscribers'],['Command','Action as an object — queue it, undo it'],['State','Behaviour changes with an internal state object'],['Decorator','Wrap to add behaviour, same interface'],['Proxy','Wrap to control access'],['Facade','One friendly door to a messy subsystem'],['Repository','Collection-like API over storage'],['Saga','Long transaction as compensating steps'],['Outbox','Write event + row in one DB transaction']],
 refs:[['Refactoring Guru','https://refactoring.guru/design-patterns'],['Microservice patterns','https://microservices.io/patterns/index.html'],['Enterprise patterns (Fowler)','https://martinfowler.com/eaaCatalog/']]
},
{
 id:'architecture', wing:'foundations', title:'Architecture blueprint', icon:'arch',
 lede:'Architecture is the set of decisions that are <b>expensive to reverse</b>. The hexagon below is the one drawing worth memorising: domain in the middle, everything replaceable at the rim.',
 viz:{type:'flow',w:900,h:450,
  nodes:[
   {id:'dom',x:390,y:190,w:190,h:96,label:'Domain',sub:'entities + rules, no imports',color:'#FFD166'},
   {id:'app',x:390,y:60,w:190,h:64,label:'Use cases',sub:'application layer',color:'#B18FE0'},
   {id:'http',x:90,y:60,w:170,h:62,label:'HTTP adapter',sub:'REST controller',color:'#58C4DD'},
   {id:'cli',x:90,y:180,w:170,h:62,label:'Worker adapter',sub:'Kafka / Celery',color:'#58C4DD'},
   {id:'db',x:710,y:120,w:170,h:62,label:'Postgres adapter',sub:'repository impl',color:'#83C167'},
   {id:'pay',x:710,y:250,w:170,h:62,label:'Payment adapter',sub:'third-party API',color:'#83C167'},
   {id:'port',x:390,y:330,w:190,h:62,label:'Ports',sub:'interfaces owned by domain',color:'#E9EDF7'}],
  edges:[{a:'http',b:'app'},{a:'cli',b:'app',bend:-14},{a:'app',b:'dom'},{a:'dom',b:'port'},{a:'db',b:'port',bend:16},{a:'pay',b:'port',bend:-16}],
  steps:[
   {cap:'<b>Start in the middle.</b> The domain knows nothing about HTTP, SQL or JSON. It is the part you would keep if you rewrote everything else.',on:['dom']},
   {cap:'<b>Driving side (left).</b> Anything that calls you — a REST controller, a Kafka consumer, a CLI — is an adapter over the same use case.',on:['http','cli','app'],fly:[{e:'http>app',label:'POST /orders'},{e:'cli>app',label:'OrderPlaced',color:'#B18FE0'}]},
   {cap:'<b>Driven side (right).</b> Anything you call sits behind a port the domain declares. Swapping Postgres for DynamoDB touches one file.',on:['db','pay','port'],fly:[{e:'db>port',label:'implements',color:'#83C167'},{e:'pay>port',label:'implements',color:'#83C167'}]},
   {cap:'<b>The rule of the drawing:</b> every arrow points inward. That single constraint is what "clean", "onion" and "hexagonal" all share.',on:['dom','port','app']}]},
 keys:[
  '<b>Layered / n-tier.</b> Controller → service → repository. Easy to teach, drifts into an anaemic domain and fat services.',
  '<b>Hexagonal (ports & adapters).</b> Domain declares interfaces; infrastructure implements them. Best default for a backend with real business rules.',
  '<b>Clean / onion.</b> Same inward-dependency rule with named rings (entities, use cases, interface adapters, frameworks).',
  '<b>Modular monolith.</b> One deployable, hard internal module boundaries. Usually the right first answer — you can extract a service later, you cannot un-split one cheaply.',
  '<b>Microservices.</b> Independent deploy and scaling, bought with network failure, distributed transactions and operational overhead. Split along team and data boundaries, never along technical layers.',
  '<b>Event-driven.</b> Services publish facts instead of calling each other; you trade request-time coupling for eventual consistency and harder debugging.',
  '<b>Conway\'s law</b> is not a joke: the system will mirror the communication shape of the teams building it.',
  '<b>Record decisions.</b> An ADR — context, decision, consequences, one page — is the cheapest architecture artefact that survives staff turnover.'],
 cheat:[['Hexagonal','Domain in the middle, adapters at the rim'],['Dependency rule','Arrows always point inward'],['Monolith first','Split when a boundary hurts, not before'],['Microservice size','Owned by one team, own database'],['CQRS','Separate write model from read model'],['C4 model','Context → Container → Component → Code'],['ADR','One page: context, decision, consequences'],['Quality attributes','Latency, throughput, availability, cost, changeability']],
 refs:[['Hexagonal architecture','https://alistair.cockburn.us/hexagonal-architecture/'],['The Clean Architecture','https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html'],['Microservices (Fowler)','https://martinfowler.com/articles/microservices.html'],['C4 model','https://c4model.com/']]
},

/* ---------------- COMPLEXITY ---------------- */
{
 id:'bigo', wing:'complexity', title:'Big-O and growth', icon:'ico',
 lede:'Big-O is an <b>upper bound on how cost grows</b>, not a stopwatch. Drag <i>n</i> and watch where each curve leaves the frame — that crossing point is the whole reason we care.',
 viz:{type:'curves',ymax:520,nmax:64,nstart:22,
  series:[
   {label:'O(1)',color:'#83C167',f:function(n){return 1}},
   {label:'O(log n)',color:'#58C4DD',f:function(n){return Math.log2(Math.max(n,1))}},
   {label:'O(n)',color:'#FFD166',f:function(n){return n}},
   {label:'O(n log n)',color:'#B18FE0',f:function(n){return n*Math.log2(Math.max(n,2))}},
   {label:'O(n²)',color:'#FC6255',f:function(n){return n*n}},
   {label:'O(2ⁿ)',color:'#E86FA3',f:function(n){return Math.pow(2,n)}}],
  note:'operations at n ='},
 keys:[
  '<b>Read it as a limit.</b> O(f) means cost ≤ c·f(n) for large n. Constants and lower terms are dropped because they stop mattering as n grows — and start mattering again when n is small.',
  '<b>Θ is the honest one.</b> O is an upper bound, Ω a lower bound, Θ both. Saying "quicksort is O(n²)" is true; "Θ(n log n) average" is what you mean.',
  '<b>Best / average / worst are different questions.</b> Hash lookup: O(1) average, O(n) worst. Quicksort: O(n log n) average, O(n²) worst, fixed by randomised pivots.',
  '<b>Amortised ≠ average.</b> Amortised is a worst-case guarantee spread over a sequence: a dynamic array\'s doubling costs O(n) once, but O(1) per push over any run of pushes.',
  '<b>Space counts too</b>, and recursion spends it invisibly: depth × frame size. A recursive DFS on a 10⁶-node path is a stack overflow, not a slow program.',
  '<b>n matters.</b> Below a few thousand items, an O(n²) loop over a contiguous array can beat an O(n log n) structure that chases pointers. Cache locality is a constant factor you can feel.',
  '<b>Sum sequential work, multiply nested work.</b> Two loops in a row: O(n+m). A loop inside a loop: O(n·m). A loop calling an O(log n) lookup: O(n log n).',
  '<b>The practical ceiling:</b> roughly 10⁸ simple operations per second per core. n=10⁵ with an O(n²) algorithm is 10¹⁰ — that is the mental check to run before you write it.'],
 cheat:[['O(1)','Hash lookup, array index, stack push'],['O(log n)','Binary search, balanced tree, heap push'],['O(n)','Scan, counting sort pass, hash build'],['O(n log n)','Comparison sorts, divide & conquer'],['O(n²)','Nested scan, naive pair compare'],['O(2ⁿ) / O(n!)','Subsets, permutations, brute-force TSP'],['Amortised','Worst case spread over a sequence'],['Feasible n','10⁸ ops/s: n² fine to ~10⁴, n log n to ~10⁷']],
 refs:[['Big-O cheat sheet','https://www.bigocheatsheet.com/'],['Asymptotic notation','https://en.wikipedia.org/wiki/Big_O_notation'],['Python time complexity','https://wiki.python.org/moin/TimeComplexity']]
},
{
 id:'structures', wing:'complexity', title:'Structures and amortised cost', icon:'box',
 lede:'Choosing a data structure is <b>choosing which operation you want to be cheap</b>. The animation shows why a list that copies itself on every growth is still O(1) per append.',
 viz:{type:'amort'},
 keys:[
  '<b>Dynamic array.</b> Index O(1), append amortised O(1), insert/delete in the middle O(n). Doubling makes the total copying cost over n appends ≈ 2n.',
  '<b>Linked list.</b> Insert/delete at a known node O(1), search O(n), no index. In practice it loses to arrays because every hop is a cache miss.',
  '<b>Hash map.</b> Average O(1) for get/put/delete, worst O(n) on collisions; needs a good hash and a load factor around 0.7. No ordering.',
  '<b>Balanced BST / B-tree.</b> O(log n) with order preserved — range scans, "next key after x", and every relational index you have ever created.',
  '<b>Heap.</b> Push and pop O(log n), peek O(1). The structure behind priority queues, top-k and scheduler timers.',
  '<b>Trie.</b> O(k) in key length for prefix work — autocomplete, routing tables, IP lookup.',
  '<b>Union-find.</b> Near O(1) amortised with path compression and union by rank; connectivity, Kruskal, cycle detection.',
  '<b>Choose by access pattern:</b> membership → set, ordering → tree, priority → heap, prefix → trie, dedupe with recency → hash + linked list (that is an LRU cache).'],
 code:{lang:'python',text:"# Python's list is a dynamic array: append is amortised O(1)\n# insert(0, x) is O(n) — every element shifts one slot right.\nfrom collections import deque\nq = deque()      # O(1) at BOTH ends — use this for queues\nq.appendleft(1)  # list.insert(0, 1) would be O(n)\n\n# heapq turns a plain list into a binary heap\nimport heapq\nh = []\nheapq.heappush(h, (priority, task))   # O(log n)\nheapq.heappop(h)                      # O(log n), smallest first"},
 cheat:[['Array','index O(1), append amortised O(1), middle insert O(n)'],['Linked list','splice O(1), search O(n), cache-hostile'],['Hash map','O(1) avg, O(n) worst, unordered'],['Balanced tree','O(log n), keeps order, range queries'],['Heap','push/pop O(log n), peek O(1)'],['Trie','O(k) in key length, prefix search'],['Union-find','~O(α(n)) with compression'],['LRU cache','hash map + doubly linked list']],
 refs:[['Time complexity tables','https://www.bigocheatsheet.com/'],['Python collections','https://docs.python.org/3/library/collections.html'],['Dynamic array analysis','https://en.wikipedia.org/wiki/Dynamic_array']]
},
{
 id:'recursion', wing:'complexity', title:'Recursion and divide & conquer', icon:'tri',
 lede:'Divide and conquer turns a recurrence into a running time. Three shapes cover almost everything you will be asked: <b>split and recurse, split and merge, halve and discard</b>.',
 viz:{type:'flow',w:900,h:430,
  nodes:[
   {id:'t',x:360,y:40,w:200,h:56,label:'T(n) = a·T(n/b) + f(n)',sub:'the master theorem',color:'#FFD166'},
   {id:'c1',x:80,y:170,w:210,h:76,label:'Case 1 · leaves win',sub:'f(n) ≪ n^log_b a → Θ(n^log_b a)',color:'#58C4DD'},
   {id:'c2',x:340,y:170,w:230,h:76,label:'Case 2 · balanced',sub:'f(n) ≈ n^log_b a → Θ(n^log_b a · log n)',color:'#83C167'},
   {id:'c3',x:620,y:170,w:210,h:76,label:'Case 3 · root wins',sub:'f(n) ≫ n^log_b a → Θ(f(n))',color:'#B18FE0'},
   {id:'bs',x:80,y:320,w:210,h:66,label:'Binary search',sub:'T(n)=T(n/2)+O(1) → log n',color:'#58C4DD'},
   {id:'ms',x:340,y:320,w:230,h:66,label:'Merge sort',sub:'T(n)=2T(n/2)+O(n) → n log n',color:'#83C167'},
   {id:'st',x:620,y:320,w:210,h:66,label:'Strassen / quickselect',sub:'uneven split work',color:'#B18FE0'}],
  edges:[{a:'t',b:'c1',bend:-10},{a:'t',b:'c2'},{a:'t',b:'c3',bend:10},{a:'c1',b:'bs'},{a:'c2',b:'ms'},{a:'c3',b:'st'}],
  steps:[
   {cap:'<b>Write the recurrence first.</b> a = how many subproblems, n/b = their size, f(n) = the work you do to split and combine.',on:['t']},
   {cap:'<b>Case 1.</b> The recursion tree is bottom-heavy: almost all the work is in the leaves.',on:['c1','bs'],fly:[{e:'t>c1',label:'a=1, b=2, f=O(1)'}]},
   {cap:'<b>Case 2.</b> Every level costs the same, and there are log n levels — the n log n family.',on:['c2','ms'],fly:[{e:'t>c2',label:'a=2, b=2, f=O(n)',color:'#83C167'}]},
   {cap:'<b>Case 3.</b> The combine step dominates; the recursion is almost free by comparison.',on:['c3','st'],fly:[{e:'t>c3',label:'f grows fastest',color:'#B18FE0'}]}]},
 keys:[
  '<b>Every recursion needs three things:</b> a base case, a step that strictly shrinks the input, and an argument for why it terminates.',
  '<b>Recursion depth is memory.</b> Python defaults to ~1000 frames; deep recursion on linked structures must become an explicit stack or a loop.',
  '<b>Tail calls are not optimised in Python or Java</b> — rewrite as iteration when depth scales with n.',
  '<b>Binary search is the cheapest O(log n) you own,</b> and it generalises: search over an <i>answer</i> (smallest capacity that works), not just an array.',
  '<b>Merge sort is stable and predictable</b> (Θ(n log n), O(n) extra); quicksort is faster in place but O(n²) worst case without a randomised pivot.',
  '<b>Quickselect</b> finds the k-th element in expected O(n) by recursing into only one side — the trick behind fast top-k.',
  '<b>Backtracking is DFS with undo:</b> choose, recurse, un-choose. Prune early — the pruning, not the recursion, is what makes it finish.',
  '<b>When subproblems repeat, stop recursing and start memoising</b> — that is exactly the doorway to the dynamic programming wing.'],
 cheat:[['Master theorem','T(n)=aT(n/b)+f(n), compare f with n^log_b a'],['Binary search','T(n)=T(n/2)+O(1) → O(log n)'],['Merge sort','2T(n/2)+O(n) → O(n log n)'],['Quickselect','expected O(n), worst O(n²)'],['Backtracking','choose → recurse → un-choose'],['Depth','Recursion depth × frame = stack memory'],['Fix for deep recursion','Explicit stack or iteration']],
 refs:[['Master theorem','https://en.wikipedia.org/wiki/Master_theorem_(analysis_of_algorithms)'],['Divide & conquer','https://cp-algorithms.com/'],['Binary search on the answer','https://cp-algorithms.com/num_methods/binary_search.html']]
},

/* ---------------- DYNAMIC PROGRAMMING ---------------- */
{
 id:'dp-blueprint', wing:'dp', title:'How to see a DP problem', icon:'ico',
 lede:'Dynamic programming is <b>recursion plus a notebook</b>. It applies when a problem has optimal substructure and the recursion keeps solving the same subproblem — the tree below collapses the moment you write answers down.',
 viz:{type:'tree',n:6},
 keys:[
  '<b>Two conditions.</b> Optimal substructure (the best answer is built from best answers to smaller pieces) and overlapping subproblems (the same piece is asked for again).',
  '<b>Five questions, in this order.</b> What is the <i>state</i>? What is the <i>transition</i>? What are the <i>base cases</i>? In what <i>order</i> do states get filled? Which state holds the <i>answer</i>?',
  '<b>State is the smallest thing you must remember.</b> "dp[i][c] = best value using the first i items with capacity c." If you cannot write that sentence, you do not have a DP yet.',
  '<b>Complexity is mechanical:</b> number of states × cost of one transition. 10⁵ items × 10³ capacities × O(1) = 10⁸ — right at the edge.',
  '<b>Top-down (memoised recursion)</b> is easier to derive, only visits reachable states, and costs stack depth. Start here in an interview.',
  '<b>Bottom-up (tabulation)</b> removes recursion, has better constants, and makes space optimisation obvious. Convert once the recurrence is proven.',
  '<b>Space optimisation.</b> If dp[i] only reads dp[i-1], keep two rows — or one, iterating the inner loop backwards. O(n·W) becomes O(W).',
  '<b>Greedy vs DP.</b> Greedy commits to a local choice and needs a proof (exchange argument); DP explores every choice and keeps the best. If a counterexample breaks greedy, it is a DP.'],
 code:{lang:'python',text:"from functools import lru_cache\n\n# Top-down: write the recurrence, add one decorator.\n@lru_cache(maxsize=None)\ndef fib(n):\n    return n if n < 2 else fib(n-1) + fib(n-2)\n\n# Bottom-up: same recurrence, explicit order, O(1) space.\ndef fib_iter(n):\n    a, b = 0, 1\n    for _ in range(n):\n        a, b = b, a + b\n    return a"},
 cheat:[['Trigger words','count the ways, min cost, max value, is it possible'],['State','The smallest summary of the past you need'],['Transition','dp[s] from already-solved states'],['Complexity','states × transition cost'],['Top-down','lru_cache, lazy, stack depth'],['Bottom-up','loops, better constants, easy to shrink space'],['Space trick','Keep only the rows the recurrence reads'],['Not DP','No overlap → divide & conquer; provable local choice → greedy']],
 refs:[['Intro to DP','https://cp-algorithms.com/dynamic_programming/intro-to-dp.html'],['functools.lru_cache','https://docs.python.org/3/library/functools.html#functools.lru_cache'],['DP patterns','https://en.wikipedia.org/wiki/Dynamic_programming']]
},
{
 id:'dp-grid', wing:'dp', title:'The DP table', icon:'grid',
 lede:'Most two-sequence problems are the <b>same table with a different recurrence</b>. Edit the two strings, then step the fill — each cell reads only the three neighbours behind it.',
 viz:{type:'grid',mode:'edit',a:'kitten',b:'sitting'},
 keys:[
  '<b>Edit distance (Levenshtein).</b> dp[i][j] = cheapest way to turn the first i characters of A into the first j of B. Match costs nothing; otherwise pay 1 and take the best of insert, delete or replace.',
  '<b>Longest common subsequence.</b> Same grid: on a match take the diagonal + 1, otherwise the better of left and up. The path you backtrack <i>is</i> the subsequence.',
  '<b>Base cases are the border.</b> Turning a prefix into the empty string costs one deletion per character — so row 0 and column 0 are just 0,1,2,3…',
  '<b>Fill order follows the arrows.</b> Row by row works because every cell reads only up, left and up-left.',
  '<b>Complexity:</b> O(n·m) time, O(n·m) space; O(min(n,m)) space if you only need the number and keep two rows.',
  '<b>Backtracking recovers the answer itself</b> — the alignment, the diff, the subsequence. Keeping the full table is the price of being able to explain the result.',
  '<b>Same shape elsewhere:</b> longest common substring (reset to 0 on mismatch), regex and wildcard matching, sequence alignment in bioinformatics, and the diff in your version control.',
  '<b>Watch the off-by-one.</b> The table is (n+1)×(m+1) because index i means "the first i characters", not "character i".'],
 code:{lang:'python',text:"def edit_distance(a: str, b: str) -> int:\n    n, m = len(a), len(b)\n    dp = [[0]*(m+1) for _ in range(n+1)]\n    for i in range(n+1): dp[i][0] = i      # delete everything\n    for j in range(m+1): dp[0][j] = j      # insert everything\n    for i in range(1, n+1):\n        for j in range(1, m+1):\n            if a[i-1] == b[j-1]:\n                dp[i][j] = dp[i-1][j-1]            # free match\n            else:\n                dp[i][j] = 1 + min(dp[i-1][j],     # delete\n                                   dp[i][j-1],     # insert\n                                   dp[i-1][j-1])   # replace\n    return dp[n][m]"},
 cheat:[['State','dp[i][j] = answer for prefixes A[:i], B[:j]'],['Edit distance','match → diagonal; else 1 + min(3 neighbours)'],['LCS','match → diag+1; else max(left, up)'],['LC substring','match → diag+1; else 0, track the max'],['Base row/col','0,1,2,… for edit; all 0 for LCS'],['Time / space','O(nm) / O(nm), or O(min(n,m)) rows'],['Recover answer','Backtrack from dp[n][m] to dp[0][0]']],
 refs:[['Levenshtein distance','https://en.wikipedia.org/wiki/Levenshtein_distance'],['LCS problem','https://en.wikipedia.org/wiki/Longest_common_subsequence'],['Edit distance (cp-algorithms)','https://cp-algorithms.com/sequences/longest_increasing_subsequence.html']]
},
{
 id:'dp-knapsack', wing:'dp', title:'Knapsack and choice DP', icon:'box',
 lede:'The second table you should know by heart: <b>take it or leave it</b>. Every item is a row, every capacity a column, and the whole family — subset sum, coin change, partition — is this recurrence with the operator changed.',
 viz:{type:'grid',mode:'knap'},
 keys:[
  '<b>0/1 knapsack.</b> dp[i][c] = max value from the first i items with capacity c. Leave it: dp[i-1][c]. Take it: value + dp[i-1][c-weight]. Take the larger.',
  '<b>Why i-1 matters.</b> Reading the previous row is what forbids using an item twice. That single index is the difference between 0/1 and unbounded.',
  '<b>Unbounded knapsack / coin change</b> reads the <i>current</i> row — dp[c] = best(dp[c], dp[c-w] + v) iterating capacity forwards, so the same coin can be reused.',
  '<b>One-dimensional 0/1.</b> Keep a single array and iterate capacity <i>backwards</i>; you then read values not yet overwritten, which is still the previous row.',
  '<b>Change the operator, change the problem.</b> max → count the ways; max → boolean OR gives subset sum; min gives fewest coins.',
  '<b>Complexity is O(n·W)</b> — pseudo-polynomial. It scales with the numeric capacity, not the input length, which is why knapsack stays NP-hard despite this table.',
  '<b>Recover the chosen items</b> by walking backwards: if dp[i][c] ≠ dp[i-1][c], item i was taken; subtract its weight and continue.',
  '<b>Interview tell.</b> "Choose a subset subject to a budget, optimise a total" is knapsack. "Reach a target using unlimited copies" is coin change.'],
 code:{lang:'python',text:"def knapsack(weights, values, cap):\n    dp = [0] * (cap + 1)                 # 1-D, previous row implied\n    for w, v in zip(weights, values):\n        for c in range(cap, w - 1, -1):  # BACKWARDS keeps it 0/1\n            dp[c] = max(dp[c], dp[c - w] + v)\n    return dp[cap]\n\ndef coin_change(coins, target):          # fewest coins, unlimited copies\n    INF = float('inf')\n    dp = [0] + [INF] * target\n    for c in coins:\n        for t in range(c, target + 1):   # FORWARDS allows reuse\n            dp[t] = min(dp[t], dp[t - c] + 1)\n    return -1 if dp[target] == INF else dp[target]"},
 cheat:[['0/1 knapsack','max(skip, value + dp[i-1][c-w])'],['Unbounded','max(skip, value + dp[i][c-w])'],['1-D direction','0/1 → backwards, unbounded → forwards'],['Subset sum','Same table with OR instead of max'],['Count ways','Same table with + instead of max'],['Complexity','O(n·W) time, O(W) space'],['Pseudo-polynomial','Cost grows with the number W, not its digits'],['Recover items','dp[i][c] ≠ dp[i-1][c] → item i was taken']],
 refs:[['Knapsack problem','https://en.wikipedia.org/wiki/Knapsack_problem'],['Knapsack (cp-algorithms)','https://cp-algorithms.com/dynamic_programming/knapsack.html'],['Coin change','https://en.wikipedia.org/wiki/Change-making_problem']]
},

/* ---------------- DATA & STORAGE ---------------- */
{
 id:'database', wing:'data', title:'The restaurant database', icon:'grid',
 lede:'A database is the <b>restaurant ledger</b>: the kitchen can serve hundreds of meals, but someone must remember every table, order, ingredient, and payment. The application asks the database to store and find that memory.',
 viz:{type:'flow',w:900,h:450,
  nodes:[
   {id:'guest',x:40,y:180,w:150,h:72,label:'Guest',sub:'“Table 12, two pizzas”',color:'#58C4DD'},
   {id:'api',x:250,y:180,w:170,h:72,label:'Restaurant API',sub:'order service',color:'#FFD166'},
   {id:'db',x:500,y:120,w:190,h:92,label:'Database',sub:'tables · rows · constraints',color:'#D99A52'},
   {id:'idx',x:500,y:280,w:190,h:72,label:'Index',sub:'find the order faster',color:'#B18FE0'},
   {id:'chef',x:760,y:180,w:120,h:72,label:'Kitchen',sub:'reads the order',color:'#83C167'}],
  edges:[{a:'guest',b:'api'},{a:'api',b:'db'},{a:'db',b:'idx'},{a:'db',b:'chef'}],
  steps:[
   {cap:'<b>The order arrives.</b> The API does not keep the restaurant’s memory in Python variables. It asks the database to record the order.',on:['guest','api'],fly:[{e:'guest>api',label:'POST /orders'}]},
   {cap:'<b>The database remembers.</b> A row survives after this request ends, after the API restarts, and after another customer arrives.',on:['db'],fly:[{e:'api>db',label:'INSERT order #1842',color:'#D99A52'}]},
   {cap:'<b>The kitchen needs the same memory.</b> It can read the order later, even if a different application process handles the request.',on:['db','chef'],fly:[{e:'db>chef',label:'SELECT … WHERE id=1842',color:'#83C167'}]},
   {cap:'<b>The index is the menu’s index.</b> Instead of scanning every order, the database can jump toward the rows matching the key.',on:['idx','db'],fly:[{e:'db>idx',label:'lookup order_id',color:'#B18FE0'}]}]},
 keys:[
  '<b>Database = durable memory.</b> Your web process is temporary; the database is where important state survives requests, restarts, and multiple application instances.',
  '<b>Table → row → column.</b> A relational database stores structured records in tables and connects them with keys and relationships.',
  '<b>SQL describes what you want.</b> The database decides how to get it — scan, index lookup, join order, cache, and so on.',
  '<b>Transactions protect a piece of work.</b> If an order must create both an order row and its payment record, a transaction can make the pair succeed or fail together.',
  '<b>Constraints are rules the database enforces.</b> Primary keys, unique constraints, foreign keys, NOT NULL and CHECK stop invalid state from entering the system.',
  '<b>Indexes trade write/storage cost for faster reads.</b> Add them for real access patterns, not because every column looks important.',
  '<b>Connection pooling matters.</b> A production API should reuse a bounded number of database connections rather than opening one for every request.',
  '<b>ORMs are translators, not databases.</b> Django ORM, SQLAlchemy and similar tools generate database operations; understanding SQL still matters when queries become expensive.'
 ],
 cheat:[['Durable state','Data survives requests and process restarts'],['Table','Rows with a defined schema'],['Primary key','Uniquely identifies a row'],['Foreign key','Connects rows across tables'],['Transaction','Group of operations with one atomic outcome'],['Index','Extra structure that speeds selected reads'],['Constraint','Database-enforced validity rule'],['Connection pool','Reuse a bounded set of DB connections']],
 code:{lang:'sql',text:`-- the row outlives the request that created it
CREATE TABLE orders (
  id          bigserial PRIMARY KEY,
  table_no    int        NOT NULL,
  status      text       NOT NULL DEFAULT 'open'
                         CHECK (status IN ('open','served','paid','void')),
  total_cents int        NOT NULL CHECK (total_cents >= 0),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- a constraint is a rule the database refuses to break,
-- even when your application code has a bug in it
CREATE TABLE order_lines (
  id       bigserial PRIMARY KEY,
  order_id bigint NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item     text   NOT NULL,
  qty      int    NOT NULL CHECK (qty > 0)
);

-- ask for WHAT you want; the planner decides HOW
SELECT o.id, o.table_no, sum(l.qty) AS items
FROM orders o
JOIN order_lines l ON l.order_id = o.id
WHERE o.status = 'open'
GROUP BY o.id, o.table_no;`},
 refs:[['PostgreSQL documentation','https://www.postgresql.org/docs/'],['SQL tutorial (PostgreSQL)','https://www.postgresql.org/docs/current/tutorial.html'],['Django database access','https://docs.djangoproject.com/en/stable/topics/db/']]
},
{
 id:'indexes', wing:'data', title:'The index: finding one order fast', icon:'tri',
 lede:'An index is the <b>restaurant’s table-of-contents</b>. Without it, the waiter checks every order. With it, the waiter jumps straight to the page containing table 42.',
 viz:{type:'flow',w:900,h:420,
  nodes:[
   {id:'q',x:50,y:175,w:170,h:72,label:'“Find order 842”',sub:'WHERE order_id = 842',color:'#58C4DD'},
   {id:'scan',x:310,y:75,w:190,h:72,label:'Table scan',sub:'check 1 → 2 → 3 → …',color:'#FC6255'},
   {id:'index',x:310,y:275,w:190,h:72,label:'B-tree index',sub:'jump through sorted keys',color:'#B18FE0'},
   {id:'row',x:620,y:175,w:200,h:72,label:'Order #842',sub:'the row we wanted',color:'#83C167'}],
  edges:[{a:'q',b:'scan',bend:-12},{a:'q',b:'index',bend:12},{a:'scan',b:'row',bend:12},{a:'index',b:'row',bend:-12}],
  steps:[
   {cap:'<b>No index.</b> The database may inspect row after row until it finds 842. That is fine for a tiny menu and painful for a million orders.',on:['scan'],fly:[{e:'q>scan',label:'check every row',color:'#FC6255'}]},
   {cap:'<b>With an index.</b> The index keeps keys in an ordered structure so the database can narrow the search instead of visiting every row.',on:['index'],fly:[{e:'q>index',label:'seek 842',color:'#B18FE0'}]},
   {cap:'<b>Indexes are not free.</b> Every INSERT, UPDATE or DELETE may have to update the index too. You buy faster reads with storage and write work.',on:['index','row']}]},
 keys:[
  '<b>B-tree is the default workhorse.</b> It supports equality and range predicates and keeps keys ordered.',
  '<b>Composite indexes follow a left-to-right rule.</b> An index on (restaurant_id, created_at) is naturally useful when filtering by restaurant_id and then narrowing by time.',
  '<b>Do not index everything.</b> Extra indexes consume storage and slow writes. Index the queries your workload actually performs.',
  '<b>EXPLAIN is your flashlight.</b> Use the query plan to see whether the database scans, seeks, joins, sorts, or spills to disk.',
  '<b>Covering indexes can avoid table reads</b> when all selected columns are available from the index itself.',
  '<b>Cardinality matters.</b> An index on a column with only two possible values may not help much unless the query and distribution make it selective.'
 ],
 cheat:[['Index','Auxiliary structure for faster access'],['B-tree','Ordered, balanced index; equality + ranges'],['Composite','Column order matters'],['EXPLAIN','Shows the database query plan'],['Trade-off','Faster reads, more storage and write work']],
 code:{lang:'sql',text:`EXPLAIN ANALYZE
SELECT * FROM orders WHERE table_no = 42 AND status = 'open';

-- before:  Seq Scan on orders  (rows=2_000_000)  time=412 ms
CREATE INDEX idx_orders_table_status ON orders (table_no, status);
-- after:   Index Scan using idx_orders_table_status  time=0.21 ms

-- leftmost rule: this index also serves
--   WHERE table_no = 42
-- but NOT
--   WHERE status = 'open'          (table_no is missing)

-- covering index: the answer never touches the heap
CREATE INDEX idx_orders_open ON orders (table_no) INCLUDE (total_cents)
  WHERE status = 'open';           -- partial: only the rows you query

-- a function on the column disables the index
--   WHERE lower(item) = 'pizza'    -> seq scan
-- unless you index the expression
CREATE INDEX idx_lines_item_lower ON order_lines (lower(item));`},
 refs:[['PostgreSQL indexes','https://www.postgresql.org/docs/current/indexes.html'],['PostgreSQL EXPLAIN','https://www.postgresql.org/docs/current/using-explain.html']]
},
{
 id:'transactions', wing:'data', title:'The order and the payment', icon:'ico',
 lede:'A transaction is the restaurant rule: <b>either the whole order is committed, or the kitchen behaves as if none of it happened.</b> That is what keeps related pieces of state from drifting apart.',
 viz:{type:'flow',w:900,h:430,
  nodes:[
   {id:'order',x:60,y:170,w:160,h:72,label:'Create order',sub:'table 12',color:'#58C4DD'},
   {id:'tx',x:310,y:170,w:180,h:80,label:'Transaction',sub:'one atomic unit',color:'#FFD166'},
   {id:'pay',x:590,y:70,w:180,h:72,label:'Payment row',sub:'€24 · pending',color:'#83C167'},
   {id:'stock',x:590,y:180,w:180,h:72,label:'Stock row',sub:'pizza − 1',color:'#83C167'},
   {id:'fail',x:590,y:300,w:180,h:72,label:'Something fails',sub:'ROLLBACK',color:'#FC6255'}],
  edges:[{a:'order',b:'tx'},{a:'tx',b:'pay',bend:-12},{a:'tx',b:'stock'},{a:'tx',b:'fail',bend:12}],
  steps:[
   {cap:'<b>Start one transaction.</b> The application says: create the order, reserve stock, record the payment — these changes belong together.',on:['order','tx'],fly:[{e:'order>tx',label:'BEGIN'}]},
   {cap:'<b>All good.</b> The database commits the group, making the changes visible as one completed unit.',on:['pay','stock'],fly:[{e:'tx>pay',label:'COMMIT',color:'#83C167'},{e:'tx>stock',label:'COMMIT',color:'#83C167'}]},
   {cap:'<b>Failure.</b> If stock reservation fails before commit, the transaction rolls back the earlier work too. You do not leave a paid order with no pizza.',on:['fail','tx'],fly:[{e:'tx>fail',label:'ROLLBACK',color:'#FC6255'}]}]},
 keys:[
  '<b>Atomicity:</b> all operations in the transaction commit, or none do.',
  '<b>Consistency:</b> constraints and invariants remain true after the transaction.',
  '<b>Isolation:</b> concurrent transactions should not observe unsafe intermediate states; the exact behavior depends on the isolation level.',
  '<b>Durability:</b> after commit, the database promises the committed state will survive a crash under its durability guarantees.',
  '<b>Isolation levels are trade-offs.</b> Read committed, repeatable read, snapshot-style isolation and serializable provide different concurrency guarantees.',
  '<b>Keep transactions short.</b> Holding locks while waiting for HTTP calls, queues, or human input is a common production mistake.'
 ],
 cheat:[['ACID','Atomicity, Consistency, Isolation, Durability'],['COMMIT','Make the transaction permanent'],['ROLLBACK','Undo the transaction'],['Isolation','Controls what concurrent work can observe'],['Rule','Do not hold DB transactions open across network calls']],
 code:{lang:'sql',text:`BEGIN;
  UPDATE accounts SET balance = balance - 2500 WHERE id = 'table_12';
  INSERT INTO payments (order_id, amount_cents) VALUES (1842, 2500);
  UPDATE orders SET status = 'paid' WHERE id = 1842;
COMMIT;            -- all three, or none of them

-- isolation decides what a concurrent transaction is allowed to see
BEGIN ISOLATION LEVEL REPEATABLE READ;
  SELECT total_cents FROM orders WHERE id = 1842;   -- snapshot
  -- another session commits a change here; this one still sees the snapshot
COMMIT;

-- when correctness depends on a row not moving under you, say so
BEGIN;
  SELECT * FROM orders WHERE id = 1842 FOR UPDATE;  -- row lock
  UPDATE orders SET status = 'served' WHERE id = 1842;
COMMIT;

-- always lock in the same order in every code path, or two
-- transactions will each hold what the other one is waiting for`},
 refs:[['PostgreSQL transactions','https://www.postgresql.org/docs/current/tutorial-transactions.html'],['PostgreSQL isolation','https://www.postgresql.org/docs/current/transaction-iso.html']]
},

/* ---------------- PROTOCOLS ---------------- */
{
 id:'rest', wing:'protocols', title:'REST over HTTP', icon:'ico',
 lede:'REST is a set of <b>constraints, not a framework</b>: uniform interface, stateless requests, cacheable responses, layered system. Follow them and any proxy, CDN or client library already knows how to help you.',
 viz:{type:'flow',w:900,h:430,
  nodes:[
   {id:'c',x:60,y:180,w:160,h:72,label:'Client',sub:'holds all session state',color:'#58C4DD'},
   {id:'cdn',x:290,y:70,w:160,h:64,label:'Cache / CDN',sub:'ETag, Cache-Control',color:'#B18FE0'},
   {id:'lb',x:290,y:290,w:160,h:64,label:'Load balancer',sub:'any node will do',color:'#FFD166'},
   {id:'api',x:530,y:180,w:180,h:76,label:'API server',sub:'stateless handler',color:'#83C167'},
   {id:'db',x:780,y:180,w:110,h:72,label:'Store',color:'#E9EDF7'}],
  edges:[{a:'c',b:'cdn',bend:-12},{a:'c',b:'lb',bend:12},{a:'cdn',b:'api',bend:-12},{a:'lb',b:'api',bend:12},{a:'api',b:'db'}],
  steps:[
   {cap:'<b>GET /orders/42</b> — safe and idempotent. Nothing changes, so anything in the path is allowed to cache it.',on:['c','cdn'],fly:[{e:'c>cdn',label:'GET /orders/42'}]},
   {cap:'<b>304 Not Modified.</b> The client sent <i>If-None-Match: "v7"</i>; the cache answers without touching your server at all.',on:['cdn'],fly:[{e:'cdn>api',label:'ETag "v7" ?',color:'#B18FE0'}]},
   {cap:'<b>POST /orders</b> — not idempotent. Answer <i>201 Created</i> with a <i>Location</i> header, and accept an idempotency key so a retry cannot double-charge.',on:['c','lb','api'],fly:[{e:'c>lb',label:'POST /orders',color:'#FFD166'},{e:'lb>api',label:'Idempotency-Key',color:'#FFD166'}]},
   {cap:'<b>Stateless pays off here.</b> The retry landed on a different node and nothing broke, because the server kept no session.',on:['api','db'],fly:[{e:'api>db',label:'insert once',color:'#83C167'}]},
   {cap:'<b>429 Too Many Requests</b> with <i>Retry-After</i>. Status codes are the contract — use the ones that exist before inventing fields.',on:['api','c'],fly:[{e:'lb>api',label:'429 + Retry-After',color:'#FC6255'}]}]},
 keys:[
  '<b>Resources, not actions.</b> Nouns in the path, verbs in the method: <code>POST /orders</code>, not <code>/createOrder</code>. Sub-resources express relationships: <code>/orders/42/items</code>.',
  '<b>Method semantics are a promise.</b> GET and HEAD are safe; GET, PUT, DELETE are idempotent; POST is not; PATCH usually is not.',
  '<b>Stateless means no server-side session</b> — every request carries its own auth and context. That is what makes horizontal scaling and load balancing trivial.',
  '<b>Use the status codes.</b> 201 + Location for creation, 202 for accepted-but-async, 400 vs 422 (malformed vs semantically wrong), 401 vs 403, 409 for conflict, 429 with Retry-After.',
  '<b>Idempotency keys</b> turn POST into something a client can safely retry: store the key with the result and replay the stored response on a repeat.',
  '<b>Paginate with cursors,</b> not <code>OFFSET</code>. Offsets drift while rows are inserted and get slower the deeper you go.',
  '<b>Version deliberately</b> — <code>/v1</code> in the path is the boring, readable choice. Add fields freely; removing or retyping one is the breaking change.',
  '<b>Richardson maturity:</b> level 0 one endpoint, 1 resources, 2 verbs + status codes, 3 hypermedia. Most good APIs stop at level 2 and that is fine.'],
 code:{lang:'http',text:"POST /v1/orders HTTP/1.1\nAuthorization: Bearer <token>\nIdempotency-Key: 7c1f-…-b23\nContent-Type: application/json\n\n{\"item_id\": 42, \"qty\": 2}\n\nHTTP/1.1 201 Created\nLocation: /v1/orders/9001\nETag: \"v7\"\nCache-Control: private, max-age=0, must-revalidate"},
 cheat:[['Safe','GET, HEAD, OPTIONS — no side effects'],['Idempotent','GET, PUT, DELETE (+ POST with a key)'],['201','Created, with a Location header'],['202','Accepted, work continues async'],['400 vs 422','Malformed vs valid-but-wrong'],['401 vs 403','Not authenticated vs not allowed'],['409','Conflict — version or state clash'],['429','Rate limited, send Retry-After'],['ETag','Version token for conditional requests'],['Pagination','Cursor beats offset at scale']],
 refs:[['HTTP methods (MDN)','https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods'],['Status codes (MDN)','https://developer.mozilla.org/en-US/docs/Web/HTTP/Status'],['Fielding, chapter 5','https://ics.uci.edu/~fielding/pubs/dissertation/rest_arch_style.htm'],['Richardson maturity model','https://martinfowler.com/articles/richardsonMaturityModel.html']]
},
{
 id:'soap', wing:'protocols', title:'SOAP and contract-first', icon:'box',
 lede:'SOAP is an <b>XML envelope with a machine-readable contract</b>. It is verbose and old, and it is still what banks, telecoms, insurers and government gateways answer the phone with.',
 viz:{type:'flow',w:900,h:440,
  nodes:[
   {id:'wsdl',x:340,y:40,w:220,h:64,label:'WSDL + XSD',sub:'the contract, published first',color:'#FFD166'},
   {id:'stub',x:60,y:180,w:190,h:72,label:'Generated client',sub:'stubs from the WSDL',color:'#58C4DD'},
   {id:'env',x:340,y:180,w:220,h:88,label:'SOAP Envelope',sub:'Header · Body · Fault',color:'#E9EDF7'},
   {id:'srv',x:660,y:180,w:190,h:72,label:'Service endpoint',sub:'one URL, many operations',color:'#83C167'},
   {id:'sec',x:60,y:330,w:190,h:64,label:'WS-Security',sub:'signed, encrypted header',color:'#B18FE0'},
   {id:'flt',x:660,y:330,w:190,h:64,label:'SOAP Fault',sub:'faultcode + faultstring',color:'#FC6255'}],
  edges:[{a:'wsdl',b:'stub',bend:-14},{a:'wsdl',b:'srv',bend:14},{a:'stub',b:'env'},{a:'env',b:'srv'},{a:'sec',b:'env'},{a:'srv',b:'flt'}],
  steps:[
   {cap:'<b>Contract first.</b> The WSDL declares operations, types and bindings; both sides generate code from it instead of agreeing in a wiki.',on:['wsdl'],fly:[{e:'wsdl>stub',label:'wsdl2java / zeep'},{e:'wsdl>srv',label:'skeleton'}]},
   {cap:'<b>The envelope.</b> Header carries the cross-cutting stuff (auth, transaction, routing); Body carries the call itself.',on:['stub','env'],fly:[{e:'stub>env',label:'<GetBalance>'}]},
   {cap:'<b>WS-Security</b> signs and encrypts at the <i>message</i> level, so it survives an intermediary that TLS alone would not protect.',on:['sec','env'],fly:[{e:'sec>env',label:'signed token',color:'#B18FE0'}]},
   {cap:'<b>Errors are Faults,</b> not status codes — a 200 response can still be a failure, which is the classic gotcha when wrapping SOAP in a REST facade.',on:['srv','flt'],fly:[{e:'srv>flt',label:'faultcode: Client',color:'#FC6255'}]}]},
 keys:[
  '<b>SOAP is a protocol; REST is a style.</b> SOAP specifies the message format, error format and extension model; REST specifies constraints and reuses HTTP.',
  '<b>Envelope structure:</b> <code>Envelope</code> → optional <code>Header</code> → <code>Body</code> → optional <code>Fault</code>. Namespaces everywhere.',
  '<b>WSDL is the schema of the API</b> — operations, message types (XSD), bindings and the endpoint address. Tooling generates a typed client from it.',
  '<b>Transport-agnostic.</b> Usually HTTP POST to a single URL, but SOAP also runs over JMS or SMTP. HTTP is a carrier, not part of the semantics.',
  '<b>The WS-* stack</b> adds WS-Security, WS-ReliableMessaging and WS-AtomicTransaction — real distributed-transaction features REST never standardised.',
  '<b>Faults, not status codes.</b> Check the Body for a Fault element; many gateways return HTTP 200 with a failure inside.',
  '<b>In practice:</b> use a generated client (Python <code>zeep</code>, Java JAX-WS), cache the WSDL locally, and log the raw XML — every integration bug lives in a namespace.',
  '<b>When you would still pick it:</b> a partner already speaks it, you need message-level signing, or you need formal, enforceable contracts between organisations.'],
 code:{lang:'xml',text:"<soap:Envelope xmlns:soap=\"http://www.w3.org/2003/05/soap-envelope\">\n  <soap:Header>\n    <wsse:Security>…signed token…</wsse:Security>\n  </soap:Header>\n  <soap:Body>\n    <GetBalance xmlns=\"urn:bank:accounts\">\n      <AccountId>TN59-0001</AccountId>\n    </GetBalance>\n  </soap:Body>\n</soap:Envelope>"},
 cheat:[['Envelope','Header (cross-cutting) + Body (the call)'],['WSDL','Machine-readable contract → generated clients'],['XSD','Type definitions the payload must satisfy'],['Fault','Error element inside a 200 response'],['WS-Security','Signing/encryption at message level'],['Transport','HTTP, JMS or SMTP — not HTTP-specific'],['vs REST','Contract-first and strict vs resource-oriented and flexible'],['Python client','zeep — Client(wsdl).service.Operation(...)']],
 refs:[['SOAP 1.2 (W3C)','https://www.w3.org/TR/soap12-part1/'],['WSDL 1.1','https://www.w3.org/TR/wsdl'],['zeep (Python)','https://docs.python-zeep.org/']]
},
{
 id:'rpc-graphql', wing:'protocols', title:'gRPC & GraphQL: two different conversations', icon:'tri',
 lede:'This room deliberately shows <b>two different ideas</b>. gRPC is a typed conversation about calling a service. GraphQL is a conversation about asking for exactly the data you need. They should not feel like the same room.',
 viz:{type:'flow',w:900,h:440,
  nodes:[
   {id:'proto',x:60,y:50,w:190,h:64,label:'.proto',sub:'IDL — the contract',color:'#FFD166'},
   {id:'gc',x:60,y:170,w:190,h:68,label:'gRPC client',sub:'generated stub',color:'#58C4DD'},
   {id:'gs',x:330,y:170,w:190,h:68,label:'gRPC server',sub:'HTTP/2 + protobuf',color:'#83C167'},
   {id:'str',x:600,y:170,w:250,h:68,label:'Streaming',sub:'unary · server · client · bidi',color:'#B18FE0'},
   {id:'q',x:60,y:330,w:190,h:66,label:'GraphQL query',sub:'client picks fields',color:'#58C4DD'},
   {id:'res',x:330,y:330,w:190,h:66,label:'Resolvers',sub:'one per field',color:'#83C167'},
   {id:'n1',x:600,y:330,w:250,h:66,label:'N+1 danger',sub:'batch with DataLoader',color:'#FC6255'}],
  edges:[{a:'proto',b:'gc'},{a:'gc',b:'gs'},{a:'gs',b:'str'},{a:'q',b:'res'},{a:'res',b:'n1'}],
  steps:[
   {cap:'<b>gRPC starts from the IDL.</b> The .proto file generates both sides — types, client stub and server skeleton — in any supported language.',on:['proto','gc'],fly:[{e:'proto>gc',label:'protoc'}]},
   {cap:'<b>Binary over HTTP/2.</b> Small frames, multiplexed connections, built-in deadlines. Typically 5–10× less payload than JSON for the same data.',on:['gc','gs'],fly:[{e:'gc>gs',label:'GetUser{id:42}'}]},
   {cap:'<b>Four call shapes.</b> Unary, server-streaming, client-streaming, bidirectional — real streaming without inventing a protocol.',on:['str'],fly:[{e:'gs>str',label:'stream of events',color:'#B18FE0'}]},
   {cap:'<b>GraphQL flips the direction.</b> One endpoint, and the query names exactly the fields — no over-fetching, no version-per-screen.',on:['q','res'],fly:[{e:'q>res',label:'{ user { name orders { id } } }',color:'#58C4DD'}]},
   {cap:'<b>The cost:</b> nested resolvers fan out into N+1 queries. Batch per request with DataLoader and cap query depth and complexity.',on:['res','n1'],fly:[{e:'res>n1',label:'100 × SELECT',color:'#FC6255'}]}]},
 keys:[
  '<b>gRPC = protobuf + HTTP/2.</b> Schema-first, binary, multiplexed, with deadlines, cancellation and interceptors in the framework rather than your code.',
  '<b>Where gRPC wins:</b> internal service-to-service traffic, polyglot teams, high call volume, streaming. Where it loses: browsers (needs grpc-web), human debuggability, public APIs.',
  '<b>Protobuf evolution rules:</b> never reuse a field number, never change a type, add new fields as optional. Field numbers, not names, are the wire contract.',
  '<b>GraphQL = one endpoint, one schema, typed.</b> Queries read, mutations write, subscriptions stream. The schema is the API documentation.',
  '<b>Resolvers are per field,</b> which is the source of both flexibility and the N+1 problem. DataLoader batches and caches within a request.',
  '<b>HTTP caching mostly stops working</b> with GraphQL (everything is a POST to one URL); you move caching into the server or use persisted queries.',
  '<b>Protect the endpoint:</b> query depth limits, complexity scoring, timeouts and persisted-query allowlists — otherwise one client can write a query that costs a minute of CPU.',
  '<b>Choosing:</b> public and cacheable → REST; internal, chatty and typed → gRPC; many clients with different screen needs → GraphQL. They coexist happily in one system.'],
 cheat:[['gRPC transport','HTTP/2, binary protobuf frames'],['gRPC modes','unary, server, client, bidirectional'],['Deadline','Client-set timeout propagated through calls'],['Protobuf rule','Field numbers are forever'],['GraphQL ops','query, mutation, subscription'],['N+1 fix','DataLoader batching per request'],['GraphQL caching','Server-side or persisted queries'],['Pick REST when','Public, cacheable, human-readable']],
 refs:[['gRPC introduction','https://grpc.io/docs/what-is-grpc/introduction/'],['Protobuf language guide','https://protobuf.dev/programming-guides/proto3/'],['GraphQL learn','https://graphql.org/learn/'],['DataLoader','https://github.com/graphql/dataloader']]
},
{
 id:'mcp', wing:'protocols', title:'MCP — Model Context Protocol', icon:'ico',
 lede:'MCP is an open standard for <b>connecting an AI application to tools and data</b>. One protocol instead of a bespoke integration per model: a host app runs clients, each client speaks JSON-RPC to one server.',
 viz:{type:'flow',w:900,h:450,
  nodes:[
   {id:'host',x:60,y:180,w:190,h:84,label:'Host app',sub:'the AI application',color:'#FFD166'},
   {id:'cli',x:320,y:180,w:170,h:84,label:'MCP client',sub:'one per server',color:'#58C4DD'},
   {id:'srv',x:580,y:60,w:260,h:68,label:'Server · tools',sub:'callable functions',color:'#83C167'},
   {id:'res',x:580,y:170,w:260,h:68,label:'Server · resources',sub:'readable context',color:'#B18FE0'},
   {id:'pr',x:580,y:280,w:260,h:68,label:'Server · prompts',sub:'reusable templates',color:'#E86FA3'},
   {id:'tr',x:320,y:340,w:170,h:64,label:'Transport',sub:'stdio · streamable HTTP',color:'#E9EDF7'}],
  edges:[{a:'host',b:'cli'},{a:'cli',b:'srv',bend:-14},{a:'cli',b:'res'},{a:'cli',b:'pr',bend:14},{a:'cli',b:'tr'}],
  steps:[
   {cap:'<b>Initialize.</b> Client and server exchange versions and capabilities — the handshake decides what the rest of the session may use.',on:['host','cli'],fly:[{e:'host>cli',label:'initialize'}]},
   {cap:'<b>Discovery.</b> <i>tools/list</i> returns each tool with a JSON Schema for its arguments, which is what the model reads to call it correctly.',on:['cli','srv'],fly:[{e:'cli>srv',label:'tools/list',color:'#83C167'}]},
   {cap:'<b>Invocation.</b> <i>tools/call</i> with validated arguments; the result comes back as content the model can read. Side effects live behind the server, not the model.',on:['srv'],fly:[{e:'cli>srv',label:'tools/call {name, args}',color:'#83C167'}]},
   {cap:'<b>Resources</b> are read-only context addressed by URI — a file, a row, a wiki page — pulled in without any tool call.',on:['res'],fly:[{e:'cli>res',label:'resources/read',color:'#B18FE0'}]},
   {cap:'<b>Transports.</b> stdio for a local process, streamable HTTP for a remote one. The message layer is JSON-RPC 2.0 either way.',on:['tr','cli'],fly:[{e:'cli>tr',label:'JSON-RPC 2.0'}]}]},
 keys:[
  '<b>Three roles.</b> Host (the AI app), client (one connection, owned by the host), server (exposes capabilities). A host runs many clients side by side.',
  '<b>Servers expose three things:</b> tools (model-callable actions), resources (URI-addressed read-only context) and prompts (user-selectable templates).',
  '<b>Messages are JSON-RPC 2.0</b> — requests with ids, responses, and notifications. Everything else is a convention on top of that.',
  '<b>Capabilities are negotiated at initialize,</b> so a client never calls something the server did not advertise, and both sides can evolve independently.',
  '<b>Transports:</b> stdio for local servers (simple, no network surface) and streamable HTTP for remote ones, which can push server-initiated messages.',
  '<b>Tool schemas do the heavy lifting.</b> A clear name, a one-line description and a tight JSON Schema are what make a model call a tool correctly.',
  '<b>Security is the host\'s job:</b> user consent before a tool runs, least-privilege credentials, validated inputs, and treating anything a server returns as data — never as instructions.',
  '<b>Why it exists.</b> N models × M tools becomes N + M integrations. The same idea as ODBC for databases or LSP for editors.'],
 code:{lang:'json',text:"// client → server\n{\"jsonrpc\":\"2.0\",\"id\":7,\"method\":\"tools/call\",\n \"params\":{\"name\":\"search_orders\",\n            \"arguments\":{\"customer\":\"42\",\"status\":\"open\"}}}\n\n// server → client\n{\"jsonrpc\":\"2.0\",\"id\":7,\n \"result\":{\"content\":[{\"type\":\"text\",\"text\":\"3 open orders…\"}]}}"},
 cheat:[['Host','The AI application (e.g. a chat client or IDE)'],['Client','One connection to one server'],['Server','Exposes tools, resources, prompts'],['Wire format','JSON-RPC 2.0'],['Transports','stdio (local), streamable HTTP (remote)'],['Tools','Model-callable, JSON Schema arguments'],['Resources','Read-only context addressed by URI'],['Prompts','Reusable templates the user picks'],['Why','N×M integrations become N+M']],
 refs:[['MCP documentation','https://modelcontextprotocol.io/'],['MCP specification','https://modelcontextprotocol.io/specification'],['JSON-RPC 2.0','https://www.jsonrpc.org/specification']]
},
{
 id:'realtime', wing:'protocols', title:'Realtime: polling to sockets', icon:'grid',
 lede:'Four ways to get news to a client, in increasing order of cost and capability. Pick the <b>cheapest one that meets the latency you actually need</b>.',
 viz:{type:'flow',w:900,h:450,
  nodes:[
   {id:'p',x:70,y:50,w:200,h:64,label:'Short polling',sub:'ask every N seconds',color:'#FC6255'},
   {id:'lp',x:70,y:160,w:200,h:64,label:'Long polling',sub:'hold the request open',color:'#FFD166'},
   {id:'sse',x:70,y:270,w:200,h:64,label:'Server-sent events',sub:'one-way stream over HTTP',color:'#83C167'},
   {id:'ws',x:70,y:380,w:200,h:64,label:'WebSocket',sub:'full duplex, upgraded',color:'#58C4DD'},
   {id:'srv',x:420,y:210,w:170,h:80,label:'Server',color:'#E9EDF7'},
   {id:'hook',x:680,y:110,w:180,h:68,label:'Webhook',sub:'server → server callback',color:'#B18FE0'},
   {id:'state',x:680,y:300,w:180,h:68,label:'Sticky state',sub:'the scaling problem',color:'#E86FA3'}],
  edges:[{a:'p',b:'srv'},{a:'lp',b:'srv'},{a:'sse',b:'srv'},{a:'ws',b:'srv'},{a:'srv',b:'hook',bend:-10},{a:'ws',b:'state',bend:18}],
  steps:[
   {cap:'<b>Short polling</b> is the honest baseline: trivially cacheable and load-balanced, but mostly empty responses and latency equal to the interval.',on:['p','srv'],fly:[{e:'p>srv',label:'GET /messages?since=…',color:'#FC6255'}]},
   {cap:'<b>Long polling</b> holds the connection until something happens. Near-instant, works everywhere, but each waiting client occupies a connection.',on:['lp','srv'],fly:[{e:'lp>srv',label:'hold… then reply',color:'#FFD166'}]},
   {cap:'<b>SSE</b> is one HTTP response that never ends. One-way, text, auto-reconnecting with <i>Last-Event-ID</i>. Perfect for feeds, progress and token streams.',on:['sse','srv'],fly:[{e:'sse>srv',label:'text/event-stream',color:'#83C167'}]},
   {cap:'<b>WebSocket</b> upgrades the connection to full duplex binary. Choose it when the <i>client</i> also needs to send constantly — chat, games, collaborative editing.',on:['ws','srv'],fly:[{e:'ws>srv',label:'Upgrade: websocket',color:'#58C4DD'}]},
   {cap:'<b>Between servers, use webhooks:</b> a signed POST to a URL the receiver registered. Always sign, always retry, always make the handler idempotent.',on:['srv','hook'],fly:[{e:'srv>hook',label:'POST + HMAC signature',color:'#B18FE0'}]},
   {cap:'<b>The scaling tax.</b> Long-lived connections pin a client to one node, so you need a pub/sub backplane (Redis, Kafka) to fan out across instances.',on:['state','ws'],fly:[{e:'ws>state',label:'which node holds this user?',color:'#E86FA3'}]}]},
 keys:[
  '<b>Short polling</b> — simplest, cacheable, wasteful. Fine when "within a minute" is acceptable.',
  '<b>Long polling</b> — low latency without new protocols; costs one held connection per waiting client.',
  '<b>SSE</b> — server → client only, plain HTTP, automatic reconnect, resumable via Last-Event-ID. Text only, and old browsers cap connections per domain.',
  '<b>WebSocket</b> — one TCP connection, both directions, binary or text, after an HTTP Upgrade handshake. You implement your own heartbeat, reconnect and backpressure.',
  '<b>Webhooks</b> are the server-to-server version: sign the payload (HMAC), include a timestamp against replay, retry with backoff, and expect duplicates.',
  '<b>Long-lived connections break statelessness.</b> Plan for connection affinity, a pub/sub backplane, and a reconnect storm after a deploy.',
  '<b>Always send a resume token</b> — a cursor, offset or event id — so a reconnecting client can catch up instead of re-reading everything.',
  '<b>Rule of thumb:</b> notifications and progress → SSE; interactive two-way → WebSocket; integrations → webhooks; everything else → polling.'],
 cheat:[['Short polling','Simple, cacheable, wasteful'],['Long polling','Low latency, holds a connection'],['SSE','One-way, HTTP, auto-reconnect, text'],['WebSocket','Full duplex after Upgrade, you own the heartbeat'],['Webhook','Signed POST + retries + idempotent handler'],['Resume','Cursor / Last-Event-ID so clients catch up'],['Scaling','Affinity + pub/sub backplane'],['Reconnect','Exponential backoff with jitter']],
 refs:[['Server-sent events (MDN)','https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events'],['WebSockets (MDN)','https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API'],['Webhook security','https://webhooks.fyi/']]
},

/* ---------------- MESSAGING ---------------- */
{
 id:'kafka', wing:'messaging', title:'Kafka — the log', icon:'grid',
 lede:'Kafka is not a queue, it is an <b>append-only log you can rewind</b>. Messages are not deleted when read; consumers just remember an offset, which is why two teams can read the same stream independently.',
 viz:{type:'kafka'},
 keys:[
  '<b>Topic → partitions.</b> A topic is split into partitions; each partition is an ordered, immutable sequence. Partitions are the unit of parallelism and of ordering.',
  '<b>Ordering is per partition only.</b> Same key → same partition → guaranteed order. Choose the key as the thing whose order matters (user id, order id, account id).',
  '<b>Offsets belong to the consumer,</b> not the broker. Committing an offset is a bookmark; reset it and you replay history.',
  '<b>Consumer groups.</b> Within a group each partition goes to exactly one consumer, so you scale by adding consumers <i>up to</i> the partition count. A second group reads the same data independently.',
  '<b>Retention, not consumption, deletes data</b> — by time or size. Log compaction instead keeps the latest value per key, turning a topic into a durable changelog.',
  '<b>Durability:</b> each partition has a leader and followers; <code>acks=all</code> plus <code>min.insync.replicas</code> is the setting that decides whether an ack really means "safe".',
  '<b>Rebalances hurt.</b> Adding or losing a consumer reassigns partitions and pauses processing; keep processing fast, use cooperative rebalancing, and commit deliberately.',
  '<b>Exactly-once is possible within Kafka</b> (idempotent producer + transactions), but the moment you touch an external system you are back to at-least-once and idempotent handlers.'],
 code:{lang:'python',text:"from confluent_kafka import Producer, Consumer\n\np = Producer({'bootstrap.servers': 'kafka:9092',\n              'enable.idempotence': True, 'acks': 'all'})\np.produce('orders', key=str(order_id), value=payload)   # key → partition\np.flush()\n\nc = Consumer({'bootstrap.servers': 'kafka:9092',\n              'group.id': 'billing', 'enable.auto.commit': False,\n              'auto.offset.reset': 'earliest'})\nc.subscribe(['orders'])\nwhile True:\n    msg = c.poll(1.0)\n    if msg and not msg.error():\n        handle(msg)      # must be idempotent\n        c.commit(msg)    # commit AFTER the work succeeds"},
 cheat:[['Partition','Ordered log; unit of parallelism'],['Key','Hashes to a partition → per-key ordering'],['Offset','Consumer bookmark, not broker state'],['Consumer group','1 partition → 1 consumer in the group'],['Retention','Time/size based; reading changes nothing'],['Compaction','Keep latest value per key'],['acks=all','Wait for in-sync replicas'],['Replay','Reset offsets and reprocess'],['Best for','Event streaming, audit logs, fan-out, reprocessing']],
 refs:[['Kafka documentation','https://kafka.apache.org/documentation/'],['Design section','https://kafka.apache.org/documentation/#design'],['Log compaction','https://kafka.apache.org/documentation/#compaction']]
},
{
 id:'rabbitmq', wing:'messaging', title:'RabbitMQ — routing', icon:'tri',
 lede:'RabbitMQ is a <b>smart broker with dumb consumers</b>. Producers never name a queue: they publish to an exchange, and bindings decide where the message lands.',
 viz:{type:'flow',w:900,h:460,
  nodes:[
   {id:'p',x:50,y:200,w:150,h:72,label:'Producer',sub:'publishes with a routing key',color:'#58C4DD'},
   {id:'x',x:270,y:200,w:180,h:80,label:'Exchange',sub:'direct · topic · fanout',color:'#FFD166'},
   {id:'q1',x:540,y:60,w:170,h:62,label:'orders.eu',sub:'binding: order.eu.*',color:'#83C167'},
   {id:'q2',x:540,y:180,w:170,h:62,label:'orders.us',sub:'binding: order.us.*',color:'#83C167'},
   {id:'q3',x:540,y:300,w:170,h:62,label:'audit',sub:'binding: order.#',color:'#B18FE0'},
   {id:'c',x:770,y:180,w:110,h:62,label:'Workers',sub:'ack / nack',color:'#E9EDF7'},
   {id:'dlx',x:540,y:400,w:280,h:56,label:'Dead-letter exchange',sub:'rejected · expired · overflow',color:'#FC6255'}],
  edges:[{a:'p',b:'x'},{a:'x',b:'q1',bend:-16},{a:'x',b:'q2'},{a:'x',b:'q3',bend:16},{a:'q2',b:'c'},{a:'q2',b:'dlx',bend:20}],
  steps:[
   {cap:'<b>Publish.</b> The producer sends to an exchange with routing key <i>order.eu.created</i> — it has no idea which queues exist.',on:['p','x'],fly:[{e:'p>x',label:'order.eu.created'}]},
   {cap:'<b>Topic exchange matches patterns.</b> <i>*</i> is one word, <i>#</i> is zero or more, so this message lands in the EU queue and in audit.',on:['x','q1','q3'],fly:[{e:'x>q1',label:'match order.eu.*',color:'#83C167'},{e:'x>q3',label:'match order.#',color:'#B18FE0'}]},
   {cap:'<b>Competing consumers.</b> Many workers on one queue share the load; <i>prefetch</i> stops one greedy worker from buffering the whole queue.',on:['q2','c'],fly:[{e:'q2>c',label:'deliver (prefetch=10)'}]},
   {cap:'<b>Acknowledge after the work,</b> not on receipt. If the worker dies before the ack, the broker redelivers to someone else.',on:['c'],fly:[{e:'q2>c',label:'basic.ack',color:'#83C167'}]},
   {cap:'<b>Poison messages go to a dead-letter exchange</b> — rejected, expired or over the length limit — so one bad payload cannot block the queue forever.',on:['dlx','q2'],fly:[{e:'q2>dlx',label:'nack (requeue=false)',color:'#FC6255'}]}]},
 keys:[
  '<b>Exchange types.</b> Direct (exact routing key), topic (pattern with <code>*</code> and <code>#</code>), fanout (everything to every bound queue), headers (match on attributes).',
  '<b>Bindings are the routing table,</b> and they live on the broker — you can add a consumer to an existing stream without touching the producer.',
  '<b>Acks are the delivery contract.</b> Manual ack after processing means at-least-once; auto-ack means at-most-once and lost work on a crash.',
  '<b>Prefetch (QoS)</b> limits unacked messages per consumer. Without it a fast consumer hoards the queue and latency becomes unfair.',
  '<b>Dead-letter exchanges + TTL</b> give you retries: reject to a delay queue with a TTL, let it expire back into the main exchange, and cap the attempts.',
  '<b>Quorum queues</b> (Raft-replicated) are the modern durable default; classic mirrored queues are deprecated. Durable queue + persistent message + publisher confirms is the full safety chain.',
  '<b>Once acked, a message is gone.</b> There is no rewind — that is the core difference from Kafka. RabbitMQ Streams exist if you want replay.',
  '<b>Pick RabbitMQ</b> for task distribution and complex routing to a known set of consumers; pick Kafka for high-throughput event streams that many teams replay.'],
 cheat:[['Direct','Exact routing key match'],['Topic','order.eu.* / order.# patterns'],['Fanout','Copy to every bound queue'],['Binding','Exchange → queue rule with a key'],['ack / nack','Confirm or reject after processing'],['Prefetch','Max unacked messages per consumer'],['DLX','Dead-letter destination for failures'],['Quorum queue','Raft-replicated durable queue'],['vs Kafka','Smart broker, no replay after ack']],
 refs:[['RabbitMQ tutorials','https://www.rabbitmq.com/tutorials'],['Exchanges & routing (AMQP)','https://www.rabbitmq.com/tutorials/amqp-concepts'],['Quorum queues','https://www.rabbitmq.com/docs/quorum-queues']]
},
{
 id:'delivery', wing:'messaging', title:'Delivery guarantees', icon:'ico',
 lede:'Every distributed system forces one choice: <b>lose messages, or duplicate them</b>. Nearly everyone picks duplicates and makes the handler idempotent — "exactly-once" is an effect you build, not a switch you flip.',
 viz:{type:'flow',w:900,h:450,
  nodes:[
   {id:'svc',x:60,y:170,w:180,h:80,label:'Service',sub:'writes + publishes',color:'#58C4DD'},
   {id:'db',x:320,y:60,w:170,h:66,label:'Database',sub:'the source of truth',color:'#E9EDF7'},
   {id:'out',x:320,y:180,w:170,h:66,label:'Outbox table',sub:'same transaction',color:'#FFD166'},
   {id:'rel',x:560,y:180,w:170,h:66,label:'Relay',sub:'polls / reads the WAL',color:'#B18FE0'},
   {id:'brk',x:780,y:180,w:110,h:66,label:'Broker',color:'#83C167'},
   {id:'cons',x:560,y:330,w:170,h:70,label:'Consumer',sub:'dedupe by message id',color:'#83C167'},
   {id:'seen',x:790,y:330,w:100,h:70,label:'Seen ids',sub:'TTL set',color:'#E86FA3'}],
  edges:[{a:'svc',b:'db'},{a:'svc',b:'out'},{a:'out',b:'rel'},{a:'rel',b:'brk'},{a:'brk',b:'cons',bend:18},{a:'cons',b:'seen'}],
  steps:[
   {cap:'<b>The dual-write bug.</b> Commit to the database, then publish — and crash in between. The row exists, the event never happened.',on:['svc','db'],fly:[{e:'svc>db',label:'INSERT order',color:'#FC6255'}]},
   {cap:'<b>Transactional outbox.</b> Write the row and the event in <i>one</i> transaction. Either both are there or neither is.',on:['out','db','svc'],fly:[{e:'svc>out',label:'INSERT event (same tx)',color:'#FFD166'}]},
   {cap:'<b>A relay ships it</b> by polling the table or tailing the write-ahead log (change data capture), then marks it sent.',on:['rel','brk'],fly:[{e:'out>rel',label:'poll / CDC',color:'#B18FE0'},{e:'rel>brk',label:'publish'}]},
   {cap:'<b>The relay may crash after publishing</b> and before marking — so the same event goes out twice. That is at-least-once, and it is fine.',on:['rel'],fly:[{e:'rel>brk',label:'duplicate!',color:'#FC6255'}]},
   {cap:'<b>The consumer makes it exactly-once in effect:</b> remember the message id, or write with a unique key so the second attempt is a no-op.',on:['cons','seen'],fly:[{e:'brk>cons',label:'event id abc'},{e:'cons>seen',label:'already processed → drop',color:'#83C167'}]}]},
 keys:[
  '<b>At-most-once.</b> Ack before processing. Fast, lossy, acceptable only for metrics and telemetry.',
  '<b>At-least-once.</b> Ack after processing. The default everywhere; duplicates are guaranteed to happen eventually.',
  '<b>Exactly-once</b> exists only inside a closed system (Kafka transactions) or as an <i>effect</i> — at-least-once delivery plus an idempotent handler.',
  '<b>Idempotency recipes:</b> a natural unique key with <code>INSERT … ON CONFLICT DO NOTHING</code>, a processed-ids table with a TTL, a version check, or an upsert that is safe to repeat.',
  '<b>Never dual-write</b> to the database and the broker. Use the transactional outbox, or change data capture from the log.',
  '<b>Ordering is a separate promise from delivery.</b> Partition by the key whose order matters, or carry a sequence number and reject anything older.',
  '<b>Retries need a dead-letter path</b> and a cap, or a poison message becomes an infinite loop with a metrics dashboard on top.',
  '<b>Consumer lag is the health metric</b> for any stream: if it grows monotonically, you are under-provisioned or stuck on one slow handler.'],
 cheat:[['At-most-once','Ack first — may lose'],['At-least-once','Ack last — may duplicate'],['Exactly-once','At-least-once + idempotent handler'],['Outbox','Row + event in one transaction'],['CDC','Read the WAL instead of polling'],['Dedupe','Unique key or processed-id set with TTL'],['Ordering','Per partition / per key only'],['Poison message','Cap retries, then dead-letter'],['Key metric','Consumer lag']],
 refs:[['Transactional outbox','https://microservices.io/patterns/data/transactional-outbox.html'],['Kafka exactly-once','https://kafka.apache.org/documentation/#semantics'],['Idempotent consumer','https://microservices.io/patterns/communication-style/idempotent-consumer.html']]
},

/* ---------------- PUBLISH / SUBSCRIBE ---------------- */
{
 id:'pubsub', wing:'messaging', title:'Publish / subscribe: the restaurant bell', icon:'ico',
 lede:'Publish / subscribe means <b>the sender does not choose the listener</b>. A restaurant can announce “Order 1842 is ready” once, while the waiter, kitchen display, delivery desk, and analytics service all listen independently.',
 viz:{type:'flow',w:900,h:450,
  nodes:[
   {id:'pub',x:45,y:185,w:165,h:78,label:'Publisher',sub:'Kitchen announces',color:'#58C4DD'},
   {id:'topic',x:290,y:185,w:180,h:82,label:'Topic / Event',sub:'order.ready',color:'#FFD166'},
   {id:'waiter',x:550,y:55,w:170,h:68,label:'Waiter',sub:'serve the table',color:'#83C167'},
   {id:'delivery',x:550,y:170,w:170,h:68,label:'Delivery desk',sub:'call the driver',color:'#83C167'},
   {id:'analytics',x:550,y:285,w:170,h:68,label:'Analytics',sub:'count orders',color:'#B18FE0'},
   {id:'late',x:770,y:185,w:100,h:68,label:'New listener',sub:'joins later',color:'#E86FA3'}],
  edges:[{a:'pub',b:'topic'},{a:'topic',b:'waiter',bend:-18},{a:'topic',b:'delivery'},{a:'topic',b:'analytics',bend:18},{a:'topic',b:'late',bend:28}],
  steps:[
   {cap:'<b>One announcement.</b> The kitchen publishes “order.ready”. It does not know which teams care about that event.',on:['pub','topic'],fly:[{e:'pub>topic',label:'order.ready #1842'}]},
   {cap:'<b>Many listeners.</b> The waiter, delivery desk, and analytics service each react to the same fact for different reasons.',on:['waiter','delivery','analytics'],fly:[{e:'topic>waiter',label:'serve',color:'#83C167'},{e:'topic>delivery',label:'dispatch',color:'#83C167'},{e:'topic>analytics',label:'count',color:'#B18FE0'}]},
   {cap:'<b>Publisher stays decoupled.</b> Add a new listener without changing the kitchen code. That is the core idea behind event-driven systems.',on:['topic','late'],fly:[{e:'topic>late',label:'new subscriber',color:'#E86FA3'}]}]},
 keys:[
  '<b>Publisher and subscriber do not need to know each other.</b> They agree on an event/topic contract instead.',
  '<b>Fan-out is the point.</b> One event can trigger independent reactions: email, analytics, search indexing, notifications, billing, and more.',
  '<b>Pub/sub is a pattern, not one product.</b> Kafka topics, RabbitMQ exchanges, Redis Pub/Sub, SNS/SQS-style systems and many brokers can implement variations of it.',
  '<b>Decoupling buys flexibility and complexity.</b> The publisher becomes simpler, while tracing, ordering, retries, duplicates, and eventual consistency become distributed concerns.',
  '<b>Events should describe facts.</b> “OrderPlaced” is safer than “SendEmailNow” because multiple consumers can decide what to do with the fact.',
  '<b>Consumers should tolerate replay or duplicates</b> when the underlying system can redeliver messages.'
 ],
 cheat:[['Publish','Send a fact without naming a consumer'],['Subscribe','Listen to a topic/event stream'],['Fan-out','One event reaches many consumers'],['Decoupling','Publisher does not depend on subscriber'],['Event','A fact that happened, e.g. OrderPlaced']],
 refs:[['AWS pub/sub overview','https://aws.amazon.com/pub-sub-messaging/'],['Kafka concepts','https://kafka.apache.org/documentation/#intro_concepts_and_terms']]
},

/* ---------------- TASKS & WORKERS ---------------- */
{
 id:'tasks', wing:'tasks', title:'Task queues', icon:'box',
 lede:'A task queue exists to take work <b>out of the request path</b>. The web process writes a message and answers in milliseconds; a worker does the slow part where a user is not waiting.',
 viz:{type:'flow',w:900,h:450,
  nodes:[
   {id:'web',x:50,y:180,w:170,h:78,label:'Web process',sub:'returns 202 fast',color:'#58C4DD'},
   {id:'brk',x:290,y:180,w:170,h:78,label:'Broker',sub:'Redis / RabbitMQ',color:'#FFD166'},
   {id:'w1',x:560,y:70,w:170,h:62,label:'Worker · default',color:'#83C167'},
   {id:'w2',x:560,y:180,w:170,h:62,label:'Worker · heavy',sub:'own queue, own pool',color:'#83C167'},
   {id:'res',x:790,y:180,w:100,h:62,label:'Result backend',color:'#B18FE0'},
   {id:'beat',x:290,y:330,w:170,h:66,label:'Scheduler',sub:'beat / cron',color:'#E86FA3'},
   {id:'dlq',x:560,y:330,w:170,h:66,label:'Dead letter',sub:'after max retries',color:'#FC6255'}],
  edges:[{a:'web',b:'brk'},{a:'brk',b:'w1',bend:-14},{a:'brk',b:'w2'},{a:'w2',b:'res'},{a:'beat',b:'brk'},{a:'w2',b:'dlq',bend:16}],
  steps:[
   {cap:'<b>Enqueue and return.</b> The request handler publishes a task with arguments and answers <i>202 Accepted</i> plus a task id.',on:['web','brk'],fly:[{e:'web>brk',label:'send_invoice.delay(42)'}]},
   {cap:'<b>Route by cost.</b> Separate queues for fast and slow work — otherwise one video transcode blocks a thousand emails.',on:['brk','w1','w2'],fly:[{e:'brk>w1',label:'queue: default'},{e:'brk>w2',label:'queue: heavy',color:'#FFD166'}]},
   {cap:'<b>Workers report state</b> to a result backend if anyone will ask. If nobody polls the result, turn it off — it is pure overhead.',on:['w2','res'],fly:[{e:'w2>res',label:'SUCCESS',color:'#B18FE0'}]},
   {cap:'<b>Periodic work</b> comes from a scheduler that enqueues on a timetable. Exactly one scheduler, or every tick runs twice.',on:['beat','brk'],fly:[{e:'beat>brk',label:'nightly_report @ 02:00',color:'#E86FA3'}]},
   {cap:'<b>Give up eventually.</b> After the retry budget, park the task where a human can look at it instead of retrying forever.',on:['w2','dlq'],fly:[{e:'w2>dlq',label:'max retries exceeded',color:'#FC6255'}]}]},
 keys:[
  '<b>Pass ids, never objects.</b> Arguments get serialised — send the primary key and re-read inside the task so it always works on fresh data.',
  '<b>Tasks must be idempotent.</b> A worker can die after doing the work and before acknowledging it; the task will run again.',
  '<b>Acknowledge late</b> (<code>acks_late=True</code>) so a crashed worker\'s task is redelivered — but only together with idempotency.',
  '<b>Set a time limit on every task.</b> Without one, a hung HTTP call holds a worker slot forever and the queue silently backs up.',
  '<b>Match the pool to the work:</b> processes for CPU-bound tasks, threads or async/gevent for IO-bound ones. A prefork pool blocked on network calls wastes cores.',
  '<b>Separate queues by latency class</b> and give each its own workers, so slow batch jobs cannot starve interactive ones.',
  '<b>Observability is queue depth, age of the oldest message, failure rate and runtime percentiles</b> — logs alone will not tell you the backlog is growing.',
  '<b>Choosing a broker:</b> Redis is simple and fast with weaker durability; RabbitMQ gives real acks, routing and dead-lettering; Kafka is for streams, not for job dispatch.'],
 code:{lang:'python',text:"from celery import Celery\n\napp = Celery('billing', broker='amqp://rabbit', backend=None)\n\n@app.task(bind=True, acks_late=True, max_retries=5,\n          autoretry_for=(TimeoutError,), retry_backoff=True,\n          retry_jitter=True, time_limit=120)\ndef send_invoice(self, order_id: int):        # id, not an object\n    order = Order.objects.get(pk=order_id)    # re-read fresh state\n    if order.invoice_sent:                    # idempotency guard\n        return\n    gateway.send(order)\n    Order.objects.filter(pk=order_id).update(invoice_sent=True)\n\n# producer side\nsend_invoice.apply_async(args=[42], queue='heavy', countdown=5)"},
 cheat:[['Why','Slow work out of the request path'],['Arguments','Serialisable ids, never ORM objects'],['acks_late','Redeliver on worker crash — needs idempotency'],['time_limit','Always set one'],['Queues','Split by latency class, not by feature'],['Pool','prefork = CPU, gevent/threads = IO'],['Scheduler','Celery beat / cron — exactly one instance'],['Metrics','Depth, oldest-message age, failures, p95 runtime']],
 refs:[['Celery documentation','https://docs.celeryq.dev/en/stable/'],['Celery best practices','https://docs.celeryq.dev/en/stable/userguide/tasks.html'],['RQ','https://python-rq.org/']]
},
{
 id:'race', wing:'tasks', title:'Race conditions and locks', icon:'box',
 lede:'Two workers, one last pizza. Both <b>read</b> "one left", both <b>write</b> "zero left", and two customers are told yes. Nothing crashed — the interleaving was simply legal.',
 viz:{type:'flow',w:900,h:430,
  nodes:[
   {id:'a',x:70,y:70,w:170,h:66,label:'Worker A',sub:'order #1842',color:'#58C4DD'},
   {id:'b',x:70,y:290,w:170,h:66,label:'Worker B',sub:'order #1843',color:'#B18FE0'},
   {id:'s',x:380,y:175,w:170,h:78,label:'stock = 1',sub:'one shared row',color:'#FFD166'},
   {id:'l',x:660,y:70,w:190,h:66,label:'Lock / version',sub:'the rule of entry',color:'#83C167'},
   {id:'r',x:660,y:290,w:190,h:66,label:'Result',sub:'orders confirmed',color:'#FC6255'}],
  edges:[{a:'a',b:'s',bend:-20},{a:'b',b:'s',bend:20},{a:'s',b:'r'},{a:'l',b:'s',bend:-10}],
  steps:[
   {cap:'<b>Read.</b> A reads 1. Before A writes, the scheduler switches to B — B also reads 1. Both are correct about the past.',on:['a','b','s'],fly:[{e:'a>s',label:'read → 1'},{e:'b>s',label:'read → 1',color:'#B18FE0'}]},
   {cap:'<b>Write.</b> A writes 0. B writes 0. The last write wins and hides the first. Two orders confirmed against one pizza: a <i>lost update</i>.',on:['a','b','s','r'],fly:[{e:'a>s',label:'write 0'},{e:'b>s',label:'write 0',color:'#B18FE0'},{e:'s>r',label:'sold 2 of 1',color:'#FC6255'}]},
   {cap:'<b>Mutex.</b> Only the holder of the lock may read-then-write. B waits, then reads 0 and refuses. Correct — and B spent that time blocked.',on:['l','s','b'],fly:[{e:'l>s',label:'held by A',color:'#83C167'}]},
   {cap:'<b>Atomic.</b> <i>UPDATE stock SET n=n-1 WHERE n&gt;0</i> makes the check and the write one indivisible step. B updates zero rows.',on:['s','r'],fly:[{e:'s>r',label:'1 row / 0 rows',color:'#83C167'}]},
   {cap:'<b>Optimistic.</b> No lock. Each write says which version it read. B\'s version is stale, so B re-reads, sees 0, and refuses. Cheap when collisions are rare.',on:['l','b','s'],fly:[{e:'b>s',label:'v1 ≠ v2 → retry',color:'#B18FE0'}]}]},
 keys:[
  '<b>A race condition</b> is any bug whose outcome depends on timing. The classic shape is <i>check-then-act</i>: read a value, decide, write — with a gap in which someone else can act.',
  '<b>Mutex:</b> one holder at a time. Simple and correct, but waiters are blocked and two locks taken in different orders can deadlock.',
  '<b>Semaphore:</b> N holders at a time. The right tool for "at most five connections to the payment provider", not for protecting one value.',
  '<b>Atomic operations</b> (compare-and-set, <code>UPDATE … WHERE</code>, <code>INCR</code>) remove the gap entirely. Prefer them when the invariant fits in one statement.',
  '<b>Optimistic locking</b> stores a version; a write fails if the version moved. No waiting, but the loser must retry — expensive when contention is high.',
  '<b>A queue</b> serialises by design: one consumer per key means no two writers ever meet.',
  '<b>Databases do this for you — partly.</b> Transactions at READ COMMITTED still allow lost updates on read-then-write; use <code>SELECT … FOR UPDATE</code>, an atomic update, or SERIALIZABLE.'],
 cheat:[['Race condition','Outcome depends on interleaving'],['Lost update','Two read-modify-writes, one wins silently'],['Mutex','One holder; others block'],['Semaphore','N holders; a counting permit'],['CAS','Write only if value is still what I read'],['Optimistic lock','Version column; retry on conflict'],['Pessimistic lock','SELECT … FOR UPDATE'],['Deadlock','Two holders each waiting for the other'],['Best answer','"Make the check and the write one atomic step"']],
 refs:[['PostgreSQL explicit locking','https://www.postgresql.org/docs/current/explicit-locking.html'],['Race condition','https://en.wikipedia.org/wiki/Race_condition'],['Optimistic concurrency control','https://en.wikipedia.org/wiki/Optimistic_concurrency_control']]
},
{
 id:'retries', wing:'tasks', title:'Retries, backoff, circuit breakers', icon:'tri',
 lede:'Retrying is how a system heals itself — and how it kills itself. The animation shows why <b>jitter matters more than the backoff curve</b>: without it, every client retries in lockstep.',
 viz:{type:'backoff'},
 keys:[
  '<b>Only retry what is retryable.</b> Timeouts, 429, 502/503/504 and connection resets — yes. 400, 401, 404, 422 — never; the answer will not change.',
  '<b>Exponential backoff:</b> wait base × 2^attempt, capped. It gives a struggling dependency time to recover instead of hammering it.',
  '<b>Jitter is the part people skip.</b> Full jitter — sleep a random value in [0, backoff] — spreads the retries out and prevents the thundering herd after an outage.',
  '<b>Cap the attempts and the total time.</b> An unbounded retry loop turns a partial outage into a queue backlog that outlives the outage.',
  '<b>Timeouts come first.</b> A retry policy on a call with no timeout is meaningless — you cannot retry something that never returns.',
  '<b>Do not retry at every layer.</b> Three layers retrying three times each is 27 calls; pick one layer to own retries.',
  '<b>Circuit breaker:</b> after N consecutive failures, open the circuit and fail fast for a cooldown, then let one trial request through (half-open). It protects both sides.',
  '<b>Retry budgets and bulkheads</b> finish the picture: cap retries as a percentage of traffic, and isolate pools so one slow dependency cannot exhaust every thread.'],
 code:{lang:'python',text:"import random, time\n\ndef call_with_retries(fn, attempts=5, base=0.2, cap=8.0):\n    for i in range(attempts):\n        try:\n            return fn(timeout=2.0)          # ALWAYS a timeout\n        except Retryable as e:\n            if i == attempts - 1:\n                raise\n            backoff = min(cap, base * 2 ** i)\n            time.sleep(random.uniform(0, backoff))   # full jitter\n"},
 cheat:[['Retryable','Timeout, 429, 502/503/504, connection reset'],['Never retry','400, 401, 403, 404, 422'],['Backoff','min(cap, base × 2^attempt)'],['Full jitter','sleep = uniform(0, backoff)'],['Budget','Max attempts AND max total time'],['One owner','Retry at a single layer'],['Breaker states','closed → open → half-open'],['Bulkhead','Separate pools per dependency'],['Retry-After','Obey it when the server sends one']],
 refs:[['Timeouts, retries and backoff with jitter','https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/'],['Exponential backoff and jitter','https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/'],['Circuit breaker','https://martinfowler.com/bliki/CircuitBreaker.html']]
},

/* ---------------- CONTAINERS ---------------- */
{
 id:'docker', wing:'containers', title:'Docker images and layers', icon:'box',
 lede:'An image is a <b>stack of read-only layers</b>; a container is that stack plus a thin writable layer on top. Once you see the stack, cache behaviour and image size stop being mysterious.',
 viz:{type:'layers'},
 keys:[
  '<b>Image vs container.</b> The image is the immutable filesystem and metadata; the container is a process with that filesystem plus a writable layer and namespaces.',
  '<b>Layers are content-addressed and shared.</b> Ten containers from one image store the base once. Layers stack with a union filesystem (overlay2).',
  '<b>The cache breaks at the first changed instruction</b> and everything below it rebuilds. So copy the dependency manifest, install, <i>then</i> copy the source.',
  '<b>Deleting a file does not shrink the image</b> — the earlier layer still holds it. Clean up inside the same RUN, or use a multi-stage build.',
  '<b>Multi-stage builds</b> compile in a fat image and copy only the artefact into a slim runtime. Usually the single biggest size win available.',
  '<b>Containers are not VMs.</b> They share the host kernel; isolation comes from namespaces and cgroups. Run one concern per container, as a non-root user.',
  '<b>Config comes from the environment,</b> secrets never bake into a layer — anyone with the image can read them with <code>docker history</code>.',
  '<b>ENTRYPOINT vs CMD:</b> ENTRYPOINT is the executable, CMD the default arguments. Use exec form so signals reach PID 1 and the container stops cleanly.'],
 code:{lang:'docker',text:"# ---- build stage ----------------------------------------\nFROM python:3.12-slim AS build\nWORKDIR /app\nCOPY requirements.txt .                 # changes rarely\nRUN pip install --prefix=/install -r requirements.txt\n\n# ---- runtime stage --------------------------------------\nFROM python:3.12-slim\nENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1\nRUN useradd -m app\nCOPY --from=build /install /usr/local\nCOPY . /app                             # changes every commit → last\nWORKDIR /app\nUSER app\nEXPOSE 8000\nHEALTHCHECK CMD python -c \"import urllib.request;urllib.request.urlopen('http://localhost:8000/health')\"\nENTRYPOINT [\"gunicorn\", \"app.wsgi\"]\nCMD [\"--bind\", \"0.0.0.0:8000\", \"--workers\", \"3\"]"},
 cheat:[['Image','Read-only layers + metadata'],['Container','Image + writable layer + namespaces'],['Layer creators','RUN, COPY, ADD'],['Cache rule','Least-changing instructions first'],['Multi-stage','Build fat, ship slim'],['.dockerignore','Keeps junk (and secrets) out of context'],['Volume','Data that must outlive the container'],['ENTRYPOINT / CMD','Executable / default arguments'],['Non-root','USER app — do it by default'],['Size wins','slim or distroless base, one RUN chain']],
 refs:[['Dockerfile best practices','https://docs.docker.com/build/building/best-practices/'],['Build cache','https://docs.docker.com/build/cache/'],['Multi-stage builds','https://docs.docker.com/build/building/multi-stage/']]
},
{
 id:'orchestration', wing:'containers', title:'Compose and orchestration', icon:'grid',
 lede:'One container is a process; many containers need a <b>scheduler that keeps the declared state true</b>. Compose does this on one machine, Kubernetes does it across a fleet.',
 viz:{type:'flow',w:900,h:450,
  nodes:[
   {id:'yaml',x:50,y:190,w:180,h:80,label:'Desired state',sub:'YAML you commit',color:'#FFD166'},
   {id:'ctl',x:300,y:190,w:180,h:80,label:'Control loop',sub:'observe → diff → act',color:'#58C4DD'},
   {id:'p1',x:570,y:60,w:150,h:58,label:'Pod 1',color:'#83C167'},
   {id:'p2',x:570,y:150,w:150,h:58,label:'Pod 2',color:'#83C167'},
   {id:'p3',x:570,y:240,w:150,h:58,label:'Pod 3',sub:'new',color:'#B18FE0'},
   {id:'svc',x:770,y:150,w:120,h:58,label:'Service',sub:'stable DNS',color:'#E9EDF7'},
   {id:'probe',x:300,y:340,w:180,h:64,label:'Probes',sub:'liveness · readiness',color:'#FC6255'},
   {id:'hpa',x:570,y:340,w:250,h:64,label:'Autoscaler',sub:'scale on CPU / queue depth',color:'#E86FA3'}],
  edges:[{a:'yaml',b:'ctl'},{a:'ctl',b:'p1',bend:-14},{a:'ctl',b:'p2'},{a:'ctl',b:'p3',bend:14},{a:'p2',b:'svc'},{a:'probe',b:'ctl'},{a:'hpa',b:'ctl',bend:20}],
  steps:[
   {cap:'<b>Declare, do not command.</b> You write "three replicas of this image"; the controller\'s job is to make reality match.',on:['yaml','ctl'],fly:[{e:'yaml>ctl',label:'replicas: 3'}]},
   {cap:'<b>The control loop never stops.</b> A pod dies, the diff is non-zero, a replacement is scheduled. That is the whole idea of orchestration.',on:['ctl','p3'],fly:[{e:'ctl>p3',label:'schedule replacement',color:'#B18FE0'}]},
   {cap:'<b>A Service is a stable name</b> in front of moving pods — clients resolve one DNS entry and never track individual addresses.',on:['svc','p2'],fly:[{e:'p2>svc',label:'endpoint registered'}]},
   {cap:'<b>Probes define "healthy".</b> Readiness removes a pod from the Service; liveness restarts it. Getting these backwards causes restart loops under load.',on:['probe','ctl'],fly:[{e:'probe>ctl',label:'readiness: false',color:'#FC6255'}]},
   {cap:'<b>Scaling is the same loop</b> with a metric attached — CPU, or better for workers, queue depth per replica.',on:['hpa','ctl'],fly:[{e:'hpa>ctl',label:'lag high → replicas: 6',color:'#E86FA3'}]}]},
 keys:[
  '<b>Compose for local development:</b> one file describing services, networks, volumes and dependencies, so a new developer runs the stack with one command.',
  '<b>Kubernetes core objects:</b> Pod (the smallest unit), Deployment (replicas + rolling updates), Service (stable virtual IP and DNS), Ingress (HTTP routing), ConfigMap and Secret (configuration).',
  '<b>Everything is a reconciliation loop</b> — controllers compare desired and actual state and act. Declarative, idempotent and self-healing by construction.',
  '<b>Probes:</b> startup (give me time to boot), readiness (send me traffic or not), liveness (restart me). Point liveness at something cheap and local.',
  '<b>Requests and limits.</b> Requests decide scheduling, limits decide throttling and OOM kills. No requests means the scheduler is guessing.',
  '<b>Rolling updates need a graceful shutdown:</b> handle SIGTERM, stop accepting work, finish in-flight requests, then exit inside the grace period.',
  '<b>Twelve-factor is the contract</b> that makes a container schedulable: config in the environment, stateless processes, logs to stdout, fast startup and shutdown.',
  '<b>Scale workers on queue depth, not CPU.</b> A worker waiting on IO looks idle while the backlog grows.'],
 code:{lang:'yaml',text:"services:\n  api:\n    build: .\n    ports: [\"8000:8000\"]\n    environment:\n      DATABASE_URL: postgres://app:secret@db:5432/app\n    depends_on:\n      db: { condition: service_healthy }\n  worker:\n    build: .\n    command: celery -A app worker -Q heavy -c 4\n    depends_on: [rabbit]\n  db:\n    image: postgres:16\n    volumes: [\"pgdata:/var/lib/postgresql/data\"]\n    healthcheck:\n      test: [\"CMD-SHELL\", \"pg_isready -U app\"]\n      interval: 5s\nvolumes: { pgdata: }"},
 cheat:[['Pod','One or more containers sharing a network namespace'],['Deployment','Declared replicas + rolling update'],['Service','Stable DNS and virtual IP'],['Ingress','HTTP routing into the cluster'],['ConfigMap / Secret','Configuration and credentials'],['Readiness','Take me out of the load balancer'],['Liveness','Restart me'],['Requests / limits','Scheduling / throttling'],['Graceful stop','Handle SIGTERM, drain, exit'],['Worker scaling','Queue depth beats CPU']],
 refs:[['Kubernetes concepts','https://kubernetes.io/docs/concepts/'],['Compose specification','https://docs.docker.com/compose/compose-file/'],['The twelve-factor app','https://12factor.net/']]
},

/* ---------------- DISTRIBUTED ---------------- */
{
 id:'cap', wing:'distributed', title:'CAP, PACELC, consistency', icon:'tri',
 lede:'CAP is one sentence: <b>when the network splits, you answer or you stay correct</b>. Flip the partition switch and pick a side — the trade-off is not abstract, it is what your on-call pager argues about.',
 viz:{type:'cap'},
 keys:[
  '<b>The real statement.</b> During a network partition a system can be consistent or available, not both. With no partition the choice does not arise — which is why "CP" and "AP" are modes, not personalities.',
  '<b>PACELC completes it.</b> If Partitioned, choose A or C; Else, choose Latency or Consistency. Most of the time you are in the "else" branch, trading latency for consistency.',
  '<b>Consistency models, strongest first:</b> linearizable (one global order, reads see the latest write), sequential, causal (related events keep order), eventual (converges, eventually).',
  '<b>Read-your-writes</b> is the one users actually notice. Route a user to the primary briefly after their write, or pin them to a replica that has caught up.',
  '<b>Quorums:</b> with N replicas, R + W > N gives overlapping read and write sets, so a read sees the latest acknowledged write.',
  '<b>Replication lag is a product decision.</b> Async replication means fast writes and stale reads; sync means slow writes and fresh reads.',
  '<b>Partitions are not hypothetical</b> — a full GC pause, a saturated NIC or a misconfigured security group look exactly like one to your code.',
  '<b>Idempotency and retries are the practical consequence.</b> A client that cannot tell "failed" from "succeeded but the reply was lost" must be able to ask again safely.'],
 cheat:[['C','Every read sees the latest write'],['A','Every request gets a non-error answer'],['P','The system survives dropped messages'],['CP example','A quorum store rejecting writes on the minority side'],['AP example','A store accepting writes everywhere and merging later'],['PACELC','Else: latency vs consistency'],['Linearizable','One global order of operations'],['Causal','Cause before effect, per chain'],['Quorum','R + W > N'],['Notice-able','Read-your-writes and monotonic reads']],
 refs:[['CAP theorem','https://en.wikipedia.org/wiki/CAP_theorem'],['PACELC','https://en.wikipedia.org/wiki/PACELC_design_principle'],['Please stop calling databases CP or AP','https://martin.kleppmann.com/2015/05/11/please-stop-calling-databases-cp-or-ap.html']]
},
{
 id:'scaling', wing:'distributed', title:'Caching and scale', icon:'ico',
 lede:'Scaling is mostly <b>moving work closer to the reader and spreading writes across keys</b>. Everything below is one of those two moves, plus the failure mode it introduces.',
 viz:{type:'flow',w:900,h:460,
  nodes:[
   {id:'cl',x:50,y:190,w:150,h:74,label:'Client',color:'#58C4DD'},
   {id:'lb',x:250,y:190,w:150,h:74,label:'Load balancer',sub:'L4 or L7',color:'#FFD166'},
   {id:'app',x:450,y:190,w:150,h:74,label:'App instances',sub:'stateless',color:'#83C167'},
   {id:'cache',x:450,y:60,w:150,h:64,label:'Cache',sub:'cache-aside + TTL',color:'#B18FE0'},
   {id:'s1',x:700,y:100,w:160,h:60,label:'Shard A',sub:'users 0–4',color:'#E9EDF7'},
   {id:'s2',x:700,y:200,w:160,h:60,label:'Shard B',sub:'users 5–9',color:'#E9EDF7'},
   {id:'rep',x:700,y:300,w:160,h:60,label:'Read replica',sub:'lags behind',color:'#E86FA3'},
   {id:'rl',x:250,y:340,w:150,h:64,label:'Rate limiter',sub:'token bucket',color:'#FC6255'}],
  edges:[{a:'cl',b:'lb'},{a:'lb',b:'app'},{a:'app',b:'cache'},{a:'app',b:'s1',bend:-12},{a:'app',b:'s2'},{a:'app',b:'rep',bend:12},{a:'rl',b:'lb'}],
  steps:[
   {cap:'<b>Cache-aside.</b> Look in the cache; on a miss read the database, write it back with a TTL. Simple, and the miss path is always correct.',on:['app','cache'],fly:[{e:'app>cache',label:'GET user:42 → miss',color:'#B18FE0'}]},
   {cap:'<b>Invalidate on write,</b> and keep TTLs short enough that a missed invalidation heals itself. Naming things and cache invalidation, as the joke goes.',on:['cache','s1'],fly:[{e:'app>s1',label:'UPDATE + DEL user:42'}]},
   {cap:'<b>Beware the stampede.</b> A hot key expiring sends every request to the database at once — use a lock, or refresh slightly early.',on:['cache'],fly:[{e:'app>cache',label:'1000 concurrent misses',color:'#FC6255'}]},
   {cap:'<b>Shard writes by key.</b> Consistent hashing keeps most keys in place when a node joins; a bad key choice concentrates traffic on one hot shard.',on:['s1','s2'],fly:[{e:'app>s2',label:'hash(user_id)'}]},
   {cap:'<b>Replicas scale reads, not writes,</b> and they lag. Send anything a user just wrote to the primary.',on:['rep'],fly:[{e:'app>rep',label:'stale by ~200 ms',color:'#E86FA3'}]},
   {cap:'<b>Shed load on purpose.</b> A token bucket with a clear 429 and Retry-After protects the whole system — silent queuing does not.',on:['rl','lb'],fly:[{e:'rl>lb',label:'429 Too Many Requests',color:'#FC6255'}]}]},
 keys:[
  '<b>Cache patterns:</b> cache-aside (app manages it), read-through, write-through (consistent, slower writes), write-behind (fast, risks loss). Cache-aside is the sane default.',
  '<b>Every cache entry needs a TTL</b>, even when you invalidate on write. The TTL is your safety net for the invalidation you will forget.',
  '<b>Stampede protection:</b> a per-key lock, early recomputation, or serving stale data while one request refreshes.',
  '<b>Eviction policy matters:</b> LRU for recency, LFU for popularity. Watch hit ratio and evictions — a cache with a 40% hit rate is mostly a latency tax.',
  '<b>Vertical scaling is the first answer,</b> not the embarrassing one. A bigger box has no distributed-systems failure modes.',
  '<b>Horizontal scaling needs statelessness</b> — session in a shared store or a token, files in object storage, no local disk assumptions.',
  '<b>Sharding splits writes;</b> choose the key to spread load, not to look tidy. Resharding is the painful operation, so leave room (virtual nodes, consistent hashing).',
  '<b>Rate limiting:</b> token bucket allows bursts, leaky bucket smooths them, sliding window is accurate and more expensive. Always return 429 with Retry-After.'],
 cheat:[['Cache-aside','Miss → read DB → write cache with TTL'],['Write-through','Write cache and DB together'],['Stampede','Lock or refresh early on hot keys'],['Eviction','LRU recency, LFU popularity'],['L4 vs L7','TCP routing vs HTTP-aware routing'],['Sharding','Split writes by key; watch hot shards'],['Consistent hashing','Few keys move when a node joins'],['Replica','Scales reads, lags behind'],['Token bucket','Allows bursts up to the bucket size'],['Backpressure','Reject fast with 429, never queue silently']],
 refs:[['Caching best practices','https://aws.amazon.com/caching/best-practices/'],['Consistent hashing','https://en.wikipedia.org/wiki/Consistent_hashing'],['Rate limiting algorithms','https://en.wikipedia.org/wiki/Token_bucket']]
}
];


/* ======================================================================
   MUSEUM GUIDE — plain-language layer
   The technical reference remains in each exhibit. This layer controls
   what a visitor sees first: a question, a physical idea, and the name.
   ====================================================================== */
const DEPT_GUIDE={
 hub:{question:'Where am I?', idea:'This is a museum you learn by walking through. Each department turns an engineering idea into a room you can watch and touch.'},
 foundations:{question:'How do I design code that can change?', idea:'Good design is mostly about controlling change: keep responsibilities clear, hide details, and make parts replaceable.'},
 complexity:{question:'How do I know whether a solution will scale?', idea:'Two programs can solve the same problem while doing wildly different amounts of work. Watch the growth, then learn the name for it.'},
 dp:{question:'Why solve the same problem twice?', idea:'When a problem contains smaller problems that repeat, remember their answers and build the larger answer from them.'},
data:{question:'Where does software remember things?', idea:'Applications come and go, but orders, users, payments, and inventory must survive. Databases are the durable memory underneath the program.'},
 protocols:{question:'How do two programs agree to talk?', idea:'A protocol is a shared conversation: what can I ask, what can you answer, and who controls the shape of the exchange?'},
 messaging:{question:'What if one program needs to announce something to other programs?', idea:'Publish facts, route messages, let consumers listen independently, and choose whether messages disappear, wait in queues, or remain in a log.'},
 tasks:{question:'How can many pieces of work run safely together?', idea:'Concurrency is not just doing things faster. It is coordinating work that overlaps in time.'},
 containers:{question:'How does software become a repeatable thing I can run?', idea:'Package the application and its environment, then give the runtime a predictable way to start, connect, observe, and replace it.'},
 distributed:{question:'What breaks when my program becomes many programs?', idea:'Networks delay, messages disappear, machines disagree, and copies fall behind. Distributed systems are the engineering of those facts.'}
};

/* ======================================================================
   TRADE-OFFS + THE CONCEPT GRAPH
   Every hall ends with what the idea buys you, what it costs, when to
   reach for something else, and which halls it leads to next.
   ====================================================================== */
const TR=['Buys you','Costs you','Reach elsewhere when'];
const DEEP={
welcome:{rel:['principles','bigo','rest','cap']},
principles:{trade:['A dependency you can replace, fake in a test, or configure per environment','One more wiring seam, and a container or factory somebody has to read','The dependency will never change and the class is trivial'],rel:['patterns','architecture','structures']},
patterns:{trade:['A shared name for a structure, so a design review takes minutes not hours','Pattern-for-its-own-sake: layers that exist because the book had them','A plain function says it more clearly than a named pattern would'],rel:['principles','architecture']},
architecture:{trade:['Domain rules that do not change when the database, the transport or the queue does','Ports, adapters and mapping code a CRUD service never needed','The app really is the database — a thin service gains nothing from a hexagon'],rel:['patterns','docker','rest','database']},
bigo:{trade:['A way to reject a design on paper, before you build and measure it','It hides constants — O(n) with a network call per item is still a disaster','n is small, bounded and will stay that way; clarity wins'],rel:['structures','recursion','dp-blueprint','indexes']},
structures:{trade:['An O(n) scan turned into an O(1) lookup or an ordered walk','Memory, and an invariant somebody has to keep true on every write','The collection has twelve items and a list is honest'],rel:['bigo','dp-grid','tasks','indexes']},
recursion:{trade:['Code shaped like the problem — trees, parsers, divide and conquer','Stack depth, and recomputing the same subproblem over and over','The loop is obvious and the depth is unbounded'],rel:['dp-blueprint','bigo']},
'dp-blueprint':{trade:['Exponential work collapsing to polynomial work','A table in memory, and a state definition you have to get exactly right','A greedy choice is provably optimal, or a closed form exists'],rel:['recursion','dp-grid','dp-knapsack']},
'dp-grid':{trade:['Exact edit distance or longest common subsequence in O(n·m)','O(n·m) memory unless you keep only the previous row','You only need a similarity score — a cheaper heuristic will do'],rel:['dp-blueprint','dp-knapsack','structures']},
'dp-knapsack':{trade:['The optimal subset, not a plausible one','Pseudo-polynomial: the cost grows with the capacity number itself','Items are divisible — then greedy by value/weight ratio is optimal'],rel:['dp-blueprint','bigo']},
database:{trade:['State that survives the process, the deploy and the machine','Schema decisions you will live with, plus a second system to operate','The data is genuinely ephemeral — a cache or a queue is the right home'],rel:['indexes','transactions','cap','scaling']},
indexes:{trade:['A lookup that jumps to the rows instead of reading every row','Slower writes, more storage, and an index the planner may ignore anyway','The table is tiny, or you read nearly all of it every time'],rel:['database','bigo','structures']},
transactions:{trade:['All of it or none of it, even when something fails halfway','Locks, contention, and isolation anomalies you have to reason about','The writes are independent and a partial result is harmless'],rel:['database','delivery','cap']},
rest:{trade:['Caches, proxies, browsers and every client library already understand it','Chatty round trips and over-fetching','You need one call with exactly the fields you want, or a stream'],rel:['rpc-graphql','soap','realtime','delivery']},
soap:{trade:['A machine-readable contract, plus signing and encryption at the message level','XML weight, tooling, and a real learning curve','Nobody in the room requires WS-* — REST or gRPC is lighter'],rel:['rest','rpc-graphql']},
'rpc-graphql':{trade:['gRPC: fast binary calls and streaming. GraphQL: one round trip, no over-fetching','gRPC needs a proxy for browsers; GraphQL moves N+1 into your resolvers','A handful of stable resources — REST is less machinery'],rel:['rest','mcp','soap']},
mcp:{trade:['One server works with any MCP host, and capabilities are declared rather than guessed','A process to run, and an authorization boundary you must actually design','The model needs one function — plain tool calling is enough'],rel:['rpc-graphql','rest','tasks']},
realtime:{trade:['Updates in the second they happen instead of the minute','Open connections are state: sticky sessions, reconnects, scaling','A thirty-second poll is genuinely fine and costs you nothing'],rel:['rest','kafka','pubsub','scaling']},
kafka:{trade:['Replay, many independent consumers, ordering per partition, huge throughput','Operational weight, and ordering that only holds inside a partition','You want per-message ack, priorities, or complex routing'],rel:['rabbitmq','delivery','pubsub','realtime']},
rabbitmq:{trade:['Flexible routing, per-message acks, dead-letter queues, priorities','Messages are gone once acknowledged — there is no replay','You need history, replay, or many consumers reading the same stream'],rel:['kafka','tasks','delivery','pubsub']},
delivery:{trade:['Correctness under retries, restarts and duplicate producers','A dedupe key, somewhere to keep it, and an outbox to write','Losing the occasional message truly does not matter — metrics, say'],rel:['kafka','rabbitmq','retries','transactions']},
pubsub:{trade:['New listeners without touching the publisher','Nobody owns the contract, and debugging means tracing fan-out','One known consumer needs the work done exactly once — use a queue'],rel:['kafka','rabbitmq','realtime']},
tasks:{trade:['Fast responses, retries for free, and work that survives a deploy','A broker, workers, a result store, and a second thing to monitor','The work takes twenty milliseconds — a queue is slower than doing it'],rel:['rabbitmq','race','retries','orchestration']},
race:{trade:['Correct results under concurrency, provably, instead of usually','Waiting (locks), retries (optimistic), or a narrower design (atomic statements)','There is one writer per key — a queue or a partition already serialises it'],rel:['transactions','tasks','delivery','cap']},
retries:{trade:['Transient failures that disappear without anyone being paged','Amplified load at exactly the worst moment, and duplicate work','The operation is not idempotent and you have no dedupe key'],rel:['delivery','cap','tasks']},
docker:{trade:['The same image in CI, staging and production, and a fast rollback','Build-cache discipline, image size, and one more layer to debug','A single static binary or a managed runtime already gives you this'],rel:['orchestration','architecture']},
orchestration:{trade:['Self-healing, rolling deploys, and scale you can describe in a file','A genuinely large amount of complexity and a platform to operate','Two containers on one box — Compose is the honest answer'],rel:['docker','scaling','tasks']},
cap:{trade:['A decision made deliberately instead of discovered during an incident','Whichever half you gave up: stale reads, or writes that are refused','There is one node — then you are trading latency, not consistency'],rel:['delivery','scaling','transactions','retries']},
scaling:{trade:['Headroom, and failure that degrades instead of falling over','Cache invalidation, shard keys you cannot change later, more moving parts','One box is at twenty percent — measure before distributing anything'],rel:['cap','orchestration','bigo','indexes']}
};

const EXHIBIT_GUIDE={
 welcome:{title:'The museum itself', question:'How should I use this place?', idea:'Walk first. Notice what the room is doing. Then open the reference when you want the formal vocabulary.', moment:'Walk the departments. The room demonstrates the idea before the drawer explains it.'},
 principles:{title:'Dependency injection', question:'How can I replace a dependency without changing the thing that uses it?', idea:'Give an object what it needs from the outside instead of making it create or choose that dependency itself.', moment:'Pull out Stripe. Plug in PayPal. OrderService keeps doing the same job.'},
 patterns:{title:'Design patterns', question:'Have I seen this design shape before?', idea:'Patterns give common solutions a name. The name is useful because it lets engineers discuss a structure quickly.', moment:'A strategy can be swapped without changing the code that uses it.'},
 architecture:{title:'Architecture', question:'Where should each responsibility live?', idea:'Architecture is the map of boundaries: domain rules, adapters, infrastructure, and the direction in which dependencies are allowed to point.', moment:'Follow the arrows. Good boundaries make the center independent of the outside world.'},
 bigo:{title:'Big-O', question:'What happens when the input gets bigger?', idea:'Big-O describes how the amount of work grows as the input grows. Watch the runners separate.', moment:'Double the input. Some runners barely notice. Others fall far behind.'},
 structures:{title:'Data structures', question:'Where should I put the data?', idea:'A data structure is a trade-off between the operations you need: lookup, insertion, deletion, ordering, and memory.', moment:'There is no best structure. The right one depends on the operation you do most.'},
 recursion:{title:'Recursion', question:'Can a big problem become smaller versions of itself?', idea:'A recursive solution solves a smaller copy of the same problem until it reaches a case that needs no further work.', moment:'Watch the room make a smaller room, then return through the same path.'},
 'dp-blueprint':{title:'Seeing a DP problem', question:'Is the same smaller problem appearing again?', idea:'Dynamic programming starts by noticing repeated subproblems and a way to build a larger answer from smaller answers.', moment:'Look for repeated states. If you keep solving the same thing, remember it.'},
 'dp-grid':{title:'The DP table', question:'What does remembering an answer look like?', idea:'Each cell stores an answer to a smaller problem. Later cells reuse those answers instead of starting over.', moment:'Watch the table fill. Every new answer can use work that is already finished.'},
 'dp-knapsack':{title:'Choice DP', question:'What if every item gives me a choice?', idea:'At each state, compare the choices and keep the best answer you can prove from earlier states.', moment:'Take it or leave it. The table remembers which choice produced the better result.'},
 database:{title:'The restaurant database', question:'Where does the restaurant remember everything?', idea:'The API is temporary, but orders, payments, tables, and stock need to survive. The database is the durable memory behind the application.', moment:'The order leaves the waiter’s hand and becomes a row that survives the request.'},
 indexes:{title:'The index', question:'How does the database find one order without checking every order?', idea:'An index is an extra structure that helps the database jump toward the rows a query needs.', moment:'The waiter stops checking every page and jumps straight to order #842.'},
 transactions:{title:'Transactions', question:'How do we stop an order from becoming half-finished?', idea:'A transaction groups related changes so they commit together or roll back together.', moment:'The payment fails. The order and stock changes disappear with it.'},
 rest:{title:'REST — the restaurant counter', question:'How does a customer place an order through an API?', idea:'Think of an API like a restaurant counter. The customer does not walk into the kitchen; they make a request, the service routes it, the kitchen does the work, and the response comes back.', moment:'You order two pizzas. The request becomes a kitchen ticket, then the result comes back to your table.'},
 soap:{title:'SOAP', question:'What does a structured message contract look like?', idea:'SOAP wraps a message in a formal envelope with a defined structure and contract.', moment:'Watch the message get wrapped before it travels. The envelope is part of the protocol.'},
 'rpc-graphql':{title:'gRPC & GraphQL', question:'Do I call a service, or ask for a shape of data?', idea:'gRPC is like calling a typed kitchen service: “prepareOrder(orderId)”. GraphQL is like filling out a menu card: “give me the order, customer name, and only these fields.”', moment:'The gRPC side sends a named operation. The GraphQL side selects branches of the data tree.'},
 mcp:{title:'MCP', question:'How can an AI use external tools and context?', idea:'MCP gives an AI application a structured way to discover and use tools, resources, and prompts through servers.', moment:'The host asks. The MCP connection carries the request. A server performs the tool action.'},
 realtime:{title:'Realtime communication', question:'Do I have to keep asking for updates?', idea:'Polling asks repeatedly. Server-sent events keep a stream open from server to client. WebSockets let both sides send messages.', moment:'Watch the communication change from repeated requests to a live connection.'},
 kafka:{title:'Kafka', question:'What if messages should stay around after someone reads them?', idea:'Kafka stores an ordered log. Consumers track their position, so messages can be read again or by another consumer group.', moment:'The log does not disappear when one reader passes. The offset tells each reader where it is.'},
 rabbitmq:{title:'RabbitMQ — the restaurant dispatcher', question:'Who should receive this piece of work?', idea:'A broker acts like a dispatcher between the kitchen and work queues. The publisher sends a message; routing rules decide which queue gets it.', moment:'One order ticket enters the dispatcher. Routing sends copies to the queues that match.'},
 pubsub:{title:'Publish / subscribe', question:'How can one announcement reach many listeners?', idea:'Publishers announce facts without choosing individual consumers. Subscribers listen for the events they care about.', moment:'The kitchen rings one bell: waiter, delivery desk, and analytics all hear it.'},
 delivery:{title:'Delivery guarantees', question:'What does “delivered” really mean?', idea:'At-most-once, at-least-once, and effectively-once systems make different promises about loss and duplicates.', moment:'A retry can create a duplicate. Reliability is about defining what happens next.'},
 tasks:{title:'Task queues', question:'What if the user should not wait for the work?', idea:'Put slow work in a queue and let workers process it separately from the request that created it.', moment:'The request leaves quickly. The worker keeps working after the user is gone.'},
 race:{title:'Race conditions', question:'What happens when two workers change the same thing at once?', idea:'Reading a value and then writing it is two steps. If someone else acts in between, one update silently disappears. Locks, atomic operations and versions close that gap.', moment:'Both workers saw one pizza. Both said yes. Now turn on a lock and watch one of them wait.'},
 retries:{title:'Retries & backoff', question:'What should I do when a dependency fails?', idea:'Retrying blindly can make an outage worse. Backoff spaces attempts out; a circuit breaker stops calling a dependency that is clearly failing.', moment:'Failure sends the job back — but each retry waits longer instead of creating a storm.'},
 docker:{title:'Docker', question:'What exactly am I shipping?', idea:'An image is a reusable filesystem built from layers. A container is a running instance with its own writable layer.', moment:'The image stays. The container is the temporary running copy.'},
 orchestration:{title:'Orchestration', question:'Who keeps the right number of things running?', idea:'An orchestrator watches desired state and works to make reality match it: start, stop, replace, route, and scale.', moment:'Kill one instance. Watch the system notice and replace it.'},
 cap:{title:'CAP & consistency', question:'What happens when the network splits?', idea:'During a partition, a distributed system cannot simultaneously guarantee every read sees the latest state and every request keeps succeeding.', moment:'Break the bridge. Then choose: refuse the request to stay correct, or answer with what this side knows.'},
 scaling:{title:'Scaling & caching', question:'How do I serve more users without doing the same work every time?', idea:'Move repeated reads closer to the caller, spread work across machines, and understand the failures those shortcuts create.', moment:'The first request is slow. The next one can use the nearby copy.'}
};

Object.keys(EXHIBIT_GUIDE).forEach(function(id){
 const e=EXHIBITS.find(function(x){return x.id===id;});
 if(!e)return;
 const g=EXHIBIT_GUIDE[id];
 if(g.title)e.title=g.title;
 e.question=g.question;
 e.moment=g.moment;
 e.prose=e.lede;
 e.idea=g.idea;
 e.lede='<b>'+g.question+'</b> '+g.idea;
});
EXHIBITS.forEach(function(e){const d=DEEP[e.id];if(d)Object.assign(e,d);});
WINGS.forEach(function(w){w.guide=DEPT_GUIDE[w.id]||{};});

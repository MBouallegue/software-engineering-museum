/* ======================================================================
   THE CONCEPT MODEL
   One record per idea. The map, the documentation ladder, the "visit
   next" suggestions, the blueprint links and the capstone all read from
   this — nothing is hard-coded twice.

   Every record answers the same four questions in the same order:
       PROBLEM   what went wrong without it
       PRESSURE  why that problem got worse
       IDEA      what engineers did about it
       TRADE-OFF what that cost them
   ====================================================================== */
const CONCEPT={

welcome:{
 body:'skeleton',prereq:[],nodes:['customer','web'],
 problem:'Software engineering is taught as a list of topics, so it is learned as a list of topics.',
 pressure:'Nobody ships a list. They ship one system, in which every choice constrains every other choice.',
 tradeoff:'A walk takes longer than an index. You will meet ideas before you have a name for them.',
 why:'Because you can memorise what a message queue is and still not know when to reach for one. Knowing <i>when</i> comes from having watched one fill up.',
 concept:'This museum is one fictional system — a restaurant — examined from ten directions. The departments are not chapters; they are questions the same system forces you to answer. Everything you can walk past downstairs appears again in the blueprint, in the control room, and in the capstone.',
 how:['<b>Walk first.</b> Every hall performs its idea before it names it. The performance is the argument.',
      '<b>Then name it.</b> This drawer runs from one sentence of intuition to production notes — you choose the depth at the top.',
      '<b>Then connect it.</b> Each hall ends with what it needed, what it unlocks, and where you already met the idea.',
      '<b>Then break it.</b> Press <i>System</i> for the live restaurant: six views, a control room, and a switch for every way it can fail.',
      '<b>Then build it.</b> The capstone hands you an empty architecture and six bad nights.'],
 prod:['The system is always running, whether or not you are looking at it — the floor of the rotunda and the control room are the same simulation.',
       'Nothing in the building is decoration. If it moves, it is reporting something.',
       'It is one HTML file. Drop it in a repository as index.html and the museum is live.'],
 code:{text:'# The whole museum, in the order you will meet it.\ncustomer → web → load_balancer → api → order_service\n                                              ├─ cache\n                                              ├─ database ─ replica\n                                              ├─ payment\n                                              └─ queue → workers → kitchen\n                                                            └→ event_log → notifications\n\n# Ten departments. One system. Every department is a question\n# this drawing refuses to answer on its own.'}},

/* ---------------- principles & design ---------------- */
principles:{
 body:'skeleton',prereq:[],nodes:['orders'],
 problem:'Changing one thing broke three others.',
 pressure:'The class reached directly for a vendor SDK, so every vendor change was also a change to your business rules.',
 tradeoff:'One more seam to wire up, and a reader who has to follow the indirection.',
 why:'Because the expensive part of software is not writing it, it is changing it later. Principles are the pressure tests you apply to a change before it is cheap to regret.',
 concept:'Dependency inversion: high-level policy and low-level detail both depend on an abstraction, and the caller owns that abstraction. The five SOLID principles are different angles on the same instruction — keep what changes together in one place, and keep everything else from knowing about it.',
 how:['The caller declares the interface it needs (a <i>port</i>), in its own module.',
      'Concrete implementations (<i>adapters</i>) are written against that interface, and live further out.',
      'Something at the very edge — a composition root, a DI container, a main() — picks which adapter to construct.',
      'The direction of the source-code dependency is now the opposite of the direction of the call. That inversion is the whole trick.'],
 prod:['Inject at the edge, not everywhere: a service locator hidden in the middle of the code is the same global you were avoiding.',
       'Every port is a contract you now have to keep — including its error behaviour, not just its signature.',
       'Fakes for tests are the fastest payoff, and the honest justification when someone asks why the seam exists.'],
 adr:{ctx:'Order pricing called the Stripe SDK directly. A pricing change and a payments upgrade became the same pull request, and the tests needed live network calls.',
      dec:'Introduce a PaymentGateway interface owned by the order domain. Stripe becomes one adapter behind it.',
      con:['Pricing can be unit-tested with a fake gateway.','Swapping or adding a provider touches one new file.','One more indirection to read through, and a wiring file that must be kept correct.']},
 code:{text:'# The domain owns the interface. It never imports Stripe.\nclass PaymentGateway(Protocol):\n    def charge(self, cents: int, token: str) -> ChargeId: ...\n\nclass OrderService:\n    def __init__(self, payments: PaymentGateway, orders: OrderRepo):\n        self.payments, self.orders = payments, orders   # injected\n\n    def place(self, cart, token):\n        order = self.orders.create(cart)\n        self.payments.charge(cart.total_cents, token)   # no vendor here\n        return order\n\n# The edge — and only the edge — knows the vendor exists.\nservice = OrderService(StripeGateway(api_key=ENV.key), SqlOrderRepo(db))'}},

patterns:{
 body:'skeleton',prereq:['principles'],nodes:['orders'],
 problem:'Two engineers described the same structure for twenty minutes and still disagreed.',
 pressure:'Designs repeat, but without shared names every discussion restarts from first principles.',
 tradeoff:'Pattern-for-its-own-sake — layers that exist because a book had them.',
 why:'Because vocabulary is leverage. Saying "make it a strategy" replaces a paragraph, and a design review that would have taken an hour takes ten minutes.',
 concept:'A design pattern is a named, recurring solution to a recurring problem in a context. The name is the deliverable: the structure would be reinvented anyway, but without a shared name it cannot be discussed quickly.',
 how:['<b>Creational</b> patterns answer "who decides which class?" — factory, builder, prototype, singleton.',
      '<b>Structural</b> patterns answer "how do these fit together?" — adapter, decorator, facade, proxy, composite.',
      '<b>Behavioural</b> patterns answer "who talks to whom, when?" — strategy, observer, command, state, template method.',
      'Choose by naming the <i>force</i> first ("this varies per tenant"), then the pattern. A pattern picked without a force is decoration.'],
 prod:['Adapter changes an interface you do not control; facade simplifies one you do. They look identical and mean different things.',
       'Decorator adds behaviour, proxy controls access. Same shape, different intent — say which you meant.',
       'Singleton is the one to justify out loud: it is global state, a hidden dependency, and hostile to tests.'],
 adr:{ctx:'Sorting strategy was a six-branch if-statement that every new export format had to edit.',
      dec:'Extract a Sorter interface; each algorithm becomes a class chosen at construction.',
      con:['New sort algorithms add a file instead of editing working code.','The choice moves to one factory that is easy to test.','More classes, and one more indirection for a reader to follow.']},
 code:{text:'class Sorter(Protocol):\n    def sort(self, rows: list) -> list: ...\n\nclass QuickSort:      # small, in memory\n    def sort(self, rows): return sorted(rows)\n\nclass ExternalSort:   # 40 GB, spills to disk\n    def sort(self, rows): return merge_runs(spill_runs(rows))\n\nclass Report:\n    def __init__(self, sorter: Sorter): self.sorter = sorter   # strategy\n    def render(self, rows): return self.sorter.sort(rows)\n\nReport(QuickSort()).render(small)\nReport(ExternalSort()).render(huge)   # same call site'}},

architecture:{
 body:'skeleton',prereq:['principles','patterns'],nodes:['orders','api'],
 problem:'The business rules could not be found, because they were spread through controllers, SQL strings and JSON serialisers.',
 pressure:'Every transport change — REST to gRPC, Postgres to Dynamo — rewrote logic that had nothing to do with transport.',
 tradeoff:'Ports, adapters and mapping code that a genuinely thin CRUD service never needed.',
 why:'Because some decisions are expensive to reverse. Architecture is the set of choices you make deliberately so that the rest can be changed cheaply.',
 concept:'Hexagonal (ports and adapters) architecture: the domain sits in the middle and imports nothing. Everything that drives it and everything it drives sits behind interfaces the domain declares. "Clean", "onion" and "hexagonal" differ in vocabulary and agree on the rule: every source dependency points inward.',
 how:['<b>Domain</b> — entities and rules. No HTTP, no SQL, no JSON. The part you would keep in a rewrite.',
      '<b>Use cases</b> — application services that orchestrate the domain for one intent.',
      '<b>Driving adapters</b> (left) — REST controller, queue consumer, CLI. Different ways to reach the same use case.',
      '<b>Driven adapters</b> (right) — the Postgres repository, the payment client. Implementations of ports the domain owns.'],
 prod:['The test for whether you got it right: can the domain be unit-tested with no database and no network? If not, the arrow points the wrong way.',
       'Mapping between domain objects and DTOs is real, recurring work. Budget for it or the boundary quietly dissolves.',
       'A CRUD service where the app really is the database gains almost nothing from a hexagon. Say so instead of building one.'],
 adr:{ctx:'The order flow needed to be callable from HTTP and from a Kafka consumer. The logic lived in the HTTP controller.',
      dec:'Extract a PlaceOrder use case. The controller and the consumer both become thin adapters over it.',
      con:['One implementation, two entry points, one set of tests.','The domain can be tested with no transport at all.','Two extra files and a DTO mapping per entry point.']},
 code:{text:'# domain/ports.py  — owned by the domain\nclass OrderRepo(Protocol):\n    def save(self, order: Order) -> None: ...\n\n# application/place_order.py — the use case, transport-free\nclass PlaceOrder:\n    def __init__(self, repo: OrderRepo, bus: EventBus):\n        self.repo, self.bus = repo, bus\n    def __call__(self, cart: Cart) -> Order:\n        order = Order.create(cart)          # domain rule\n        self.repo.save(order)\n        self.bus.publish(OrderPlaced(order.id))\n        return order\n\n# adapters/http.py — one of several ways in\n@app.post("/orders")\ndef create(body: OrderBody):\n    return place_order(body.to_cart())      # injected use case'}},

/* ---------------- algorithms ---------------- */
bigo:{
 body:'muscle',prereq:[],nodes:['orders','db'],
 problem:'It worked on the developer’s laptop with 50 rows and fell over in production with 500,000.',
 pressure:'Input size is the one variable you do not control.',
 tradeoff:'Big-O hides constants: O(n) with a network call per item is still a disaster.',
 why:'Because you need to reject a design on paper, before you have built it and measured it. Complexity is the only tool that lets you compare two solutions you have not written yet.',
 concept:'Big-O describes how the work done by an algorithm grows as its input grows, ignoring constant factors and lower-order terms. It is an upper bound on growth rate, not a measurement of speed.',
 how:['Count the operation that dominates — comparisons, or trips to the database — not lines of code.',
      'Keep only the fastest-growing term: n²+n becomes O(n²), because at large n the n stops mattering.',
      'Nested loops over the same input multiply. Halving the search space each step is O(log n).',
      'Amortised analysis averages an expensive rare step over the cheap common ones — a dynamic array push is O(1) amortised even though one push in n copies everything.'],
 prod:['The constant is where the money is: O(n) doing one query per row is worse than O(n log n) doing one query total. Big-O will not tell you this — the N+1 will.',
       'Space complexity gets forgotten and then becomes an out-of-memory page at 3am.',
       'Below a few thousand items, clarity beats asymptotics almost every time. Measure before optimising.'],
 adr:{ctx:'The order search page timed out as the table grew past a million rows.',
      dec:'Replace the per-row lookup loop with a single indexed query and a hash join in the application.',
      con:['Page load dropped from 14s to 90ms.','Worst case is now bounded by the index, not by table size.','One more index to maintain, and slightly slower writes.']},
 code:{text:'# O(n * m) — a query per order. Fine at 50, fatal at 500k.\nfor order in orders:                     # n\n    order.customer = db.query(            # each one a round trip\n        "SELECT * FROM customers WHERE id = %s", order.customer_id)\n\n# O(n + m) — two queries, one hash join in memory.\nids = {o.customer_id for o in orders}\ncustomers = {c.id: c for c in db.query(\n    "SELECT * FROM customers WHERE id = ANY(%s)", list(ids))}\nfor order in orders:\n    order.customer = customers[order.customer_id]'}},

structures:{
 body:'memory',prereq:['bigo'],nodes:['cache','db'],
 problem:'Finding one item meant looking at every item.',
 pressure:'The collection kept growing, and the lookup ran on every request.',
 tradeoff:'Memory, plus an invariant somebody has to keep true on every single write.',
 why:'Because a data structure is a decision about which operation you want to be cheap. There is no best structure — there is only the operation you do most.',
 concept:'A data structure is an arrangement of data that fixes the cost of each operation on it. Choosing one is choosing which operations are fast and which are slow.',
 how:['<b>Array</b> — O(1) by index, O(n) to search, contiguous so the CPU cache loves it.',
      '<b>Hash map</b> — O(1) average lookup by key, no ordering, degrades if the hash is poor.',
      '<b>Balanced tree</b> — O(log n) lookup <i>and</i> ordered traversal, which is why databases index with B-trees.',
      '<b>Heap</b> — O(1) peek at the minimum, O(log n) insert. The right answer to "top k" and to schedulers.',
      '<b>Stack / queue</b> — restrict the access pattern on purpose; the restriction is what makes the code correct.'],
 prod:['Cache locality often beats asymptotics at small n: a linear scan of a contiguous array can beat a pointer-chasing tree up to surprisingly large sizes.',
       'A hash map with attacker-controlled keys is a denial-of-service vector unless the hash is randomised.',
       'Every index you add to a database is a data structure you have chosen, with exactly these trade-offs, maintained on every write.'],
 adr:{ctx:'Deduplicating order IDs used a list and an "in" check — O(n) per item, O(n²) overall.',
      dec:'Use a set for membership and keep the list only where order matters.',
      con:['Deduplication became linear.','Memory grew by one hash table.','Insertion order had to be reintroduced explicitly where it mattered.']},
 code:{text:'# O(n²): "in" on a list scans the list every time.\nseen = []\nfor order_id in stream:\n    if order_id not in seen:      # O(n)\n        seen.append(order_id)\n\n# O(n): a set trades memory for an O(1) membership test.\nseen = set()\nunique = []\nfor order_id in stream:\n    if order_id not in seen:      # O(1) average\n        seen.add(order_id)\n        unique.append(order_id)   # order kept deliberately'}},

recursion:{
 body:'brain',prereq:['bigo'],nodes:['orders'],
 problem:'The data was a tree, and the loop was not.',
 pressure:'Nested menus, nested comments, nested directories — structures that contain smaller copies of themselves.',
 tradeoff:'Stack depth, and re-solving the same subproblem over and over.',
 why:'Because when the problem contains a smaller version of itself, code shaped like the problem is easier to get right than code that flattens it by hand.',
 concept:'A recursive function solves a problem by calling itself on a strictly smaller input, until it reaches a base case that needs no further work. Correctness needs three things: a base case, progress toward it, and an assumption that the smaller call is already correct.',
 how:['Write the base case first — the input so small the answer is obvious.',
      'Assume the recursive call works. Do not trace it; trust it and combine.',
      'Prove progress: every call must be strictly closer to the base case, or you get a stack overflow instead of an answer.',
      'Divide and conquer is recursion with a split: merge sort halves the list, sorts both, merges. O(n log n) falls straight out of the recursion tree.'],
 prod:['Python and JavaScript do not eliminate tail calls; deep recursion on user-controlled input is a crash. Convert to an explicit stack.',
       'If the same arguments appear twice in the call tree, you have found a dynamic-programming problem — go memoise it.',
       'Recursion on untrusted nested input (JSON, XML) is a denial-of-service vector. Bound the depth.'],
 adr:{ctx:'Rendering the nested menu tree used a hand-rolled iterative walk that nobody could modify safely.',
      dec:'Rewrite as direct recursion over the node type, with an explicit depth limit.',
      con:['The code now matches the shape of the data and is readable.','Depth is bounded, so hostile input cannot crash the renderer.','Very deep trees fall back to an explicit stack.']},
 code:{text:'def total_price(node):\n    """A menu section contains items and more sections."""\n    if node.is_item:                 # base case: answer is obvious\n        return node.price\n    return sum(total_price(child)    # trust the smaller call\n               for child in node.children)\n\n# Divide and conquer: the recursion tree IS the complexity.\ndef merge_sort(xs):\n    if len(xs) <= 1: return xs                     # base case\n    mid = len(xs) // 2\n    return merge(merge_sort(xs[:mid]),             # T(n) = 2T(n/2) + O(n)\n                 merge_sort(xs[mid:]))             #      = O(n log n)'}},

'dp-blueprint':{
 body:'memory',prereq:['recursion','bigo'],nodes:['orders'],
 problem:'The recursion was correct and took four days to finish.',
 pressure:'The same subproblem was being solved thousands of times in different branches of the call tree.',
 tradeoff:'A table in memory, and a state definition you have to get exactly right.',
 why:'Because exponential work is almost always repeated work. If you can recognise the repeat and keep the answer, the cost collapses to polynomial.',
 concept:'Dynamic programming applies when a problem has <i>optimal substructure</i> (the best answer is built from best answers to subproblems) and <i>overlapping subproblems</i> (the same subproblem recurs). Solve each subproblem once and reuse the result.',
 how:['Define the <b>state</b>: the smallest set of variables that identifies a subproblem. Get this wrong and nothing else works.',
      'Write the <b>recurrence</b>: the answer for a state in terms of smaller states.',
      'Identify the <b>base cases</b>.',
      '<b>Memoise</b> (top-down: recursion plus a cache) or <b>tabulate</b> (bottom-up: fill an array in dependency order). Same recurrence, different direction.'],
 prod:['Count the states before you write code: states × transitions is the running time, and it tells you immediately whether the approach is viable.',
       'Most DP tables only need the previous row — that turns O(n·m) memory into O(m) and is usually the difference between fitting in cache and not.',
       'If you need the answer <i>and</i> the choices that produced it, store parent pointers or re-derive by walking the table backwards.'],
 adr:{ctx:'Delivery-route pricing ran a naive recursion that recomputed the same partial routes exponentially.',
      dec:'Memoise on (stop_index, remaining_capacity) — the two variables that fully determine a subproblem.',
      con:['Runtime went from exponential to O(stops × capacity).','Memory is now a table proportional to that product.','The state definition must be exactly right, or the cache returns wrong answers silently.']},
 code:{text:'from functools import lru_cache\n\n# Plain recursion: fib(35) makes ~30 million calls.\ndef fib(n):\n    return n if n < 2 else fib(n-1) + fib(n-2)\n\n# Memoised: each state computed once. ~n calls.\n@lru_cache(maxsize=None)\ndef fib_memo(n):\n    return n if n < 2 else fib_memo(n-1) + fib_memo(n-2)\n\n# Tabulated: same recurrence, bottom-up, O(1) memory.\ndef fib_table(n):\n    a, b = 0, 1\n    for _ in range(n):\n        a, b = b, a + b          # only the previous row is ever needed\n    return a'}},

'dp-grid':{
 body:'memory',prereq:['dp-blueprint'],nodes:['orders'],
 problem:'Comparing two sequences by trying every alignment is exponential.',
 pressure:'Diffs, spell-check, and fuzzy matching all ask the same question about two strings.',
 tradeoff:'O(n·m) memory, unless you keep only the row you still need.',
 why:'Because a two-dimensional table is the natural shape when a subproblem is identified by two positions — one in each sequence.',
 concept:'Grid DP: the state is a pair of prefixes, cell (i,j) holds the answer for the first i of one sequence and the first j of the other, and each cell is computed from its neighbours. Edit distance and longest common subsequence are the two canonical members.',
 how:['Row i, column j = the answer for <code>A[:i]</code> against <code>B[:j]</code>.',
      'The first row and first column are the base cases — comparing against an empty sequence.',
      'Each cell looks at up to three neighbours: up (delete), left (insert), diagonal (match or substitute).',
      'The answer is the bottom-right cell. Walking backwards from it recovers the actual alignment, not just its cost.'],
 prod:['Only the previous row is needed for the <i>score</i>, giving O(min(n,m)) memory — but recovering the alignment needs the whole table, or Hirschberg’s divide-and-conquer trick.',
       'For "are these roughly similar?", a cheap heuristic (length, shingles, a bloom filter) first, and the exact DP only on survivors.',
       'Bounded edit distance can stop early: if you only care about distance ≤ k, compute a diagonal band and skip the rest.'],
 adr:{ctx:'Menu-item search needed to tolerate typos, and a full pairwise edit distance over the catalogue was too slow.',
      dec:'Filter candidates by length and trigram overlap first, then run bounded edit distance on the survivors.',
      con:['Typo tolerance without scanning the catalogue.','Two stages to maintain and tune.','A rare miss when the filter rejects a genuine match.']},
 code:{text:'def edit_distance(a, b):\n    # prev[j] = distance from a[:i-1] to b[:j]\n    prev = list(range(len(b) + 1))          # base row: delete everything\n    for i, ca in enumerate(a, 1):\n        cur = [i]                           # base column: insert everything\n        for j, cb in enumerate(b, 1):\n            cur.append(prev[j-1] if ca == cb else 1 + min(\n                prev[j],      # delete from a\n                cur[j-1],     # insert from b\n                prev[j-1]))   # substitute\n        prev = cur                          # only one row is ever kept\n    return prev[-1]'}},

'dp-knapsack':{
 body:'memory',prereq:['dp-blueprint'],nodes:['orders'],
 problem:'Every item is a yes-or-no choice, and there are 2ⁿ combinations.',
 pressure:'A budget, a van, a time window — anything with a hard capacity forces the same question.',
 tradeoff:'Pseudo-polynomial: the cost grows with the capacity <i>number</i>, so a large capacity is expensive even with few items.',
 why:'Because greedy choices are not optimal when items compete for a shared limit. You need to compare futures, and that means remembering the best answer for every remaining capacity.',
 concept:'0/1 knapsack: the state is (items considered, capacity remaining); the transition is take-it or leave-it, and the answer is the better of the two. Its running time, O(n·W), is pseudo-polynomial — polynomial in the capacity value, exponential in the number of bits used to write that value down.',
 how:['State: <code>best[i][c]</code> = best value using the first i items with capacity c.',
      'Leave it: <code>best[i-1][c]</code>. Take it: <code>value[i] + best[i-1][c - weight[i]]</code>, if it fits.',
      'Keep the maximum. The base row is zero value with no items.',
      'Iterating capacity <i>downwards</i> in the one-dimensional version is what stops an item being taken twice.'],
 prod:['If items are divisible, this is the wrong algorithm — greedy by value/weight ratio is provably optimal and far cheaper.',
       'Large capacities (cents, milliseconds) blow the table up. Scale the units or switch to a branch-and-bound or approximation scheme.',
       'When the answer must be explainable ("why was this item left out?"), keep the choice table — auditors and customers both ask.'],
 adr:{ctx:'The delivery batching service picked orders greedily by value and left the van half empty.',
      dec:'Model it as 0/1 knapsack over van volume, solved per dispatch window.',
      con:['Van utilisation rose from 71% to 94%.','Dispatch planning now costs O(orders × volume units).','Volume was rounded to 5-litre buckets to keep the table small.']},
 code:{text:'def knapsack(items, capacity):\n    """items: [(weight, value)]. Returns the best achievable value."""\n    best = [0] * (capacity + 1)              # one row, reused\n    for weight, value in items:\n        # DOWNWARDS: each item may be taken at most once.\n        for c in range(capacity, weight - 1, -1):\n            take  = value + best[c - weight]\n            leave = best[c]\n            best[c] = max(take, leave)\n    return best[capacity]'}},

/* ---------------- data & memory ---------------- */
database:{
 body:'memory',prereq:['structures'],nodes:['db'],
 problem:'The process restarted and the orders were gone.',
 pressure:'Deploys, crashes and scaling all destroy process memory — but an order is a promise to a customer.',
 tradeoff:'Schema decisions you will live with for years, plus a second system to operate and back up.',
 why:'Because the application is temporary and the data is not. A database is the part of the system that is allowed to outlive the code.',
 concept:'A relational database stores data as typed rows in tables, enforces constraints (primary keys, foreign keys, uniqueness, nullability) as invariants the storage engine will not let you break, and answers declarative queries — you state what you want, the planner decides how to get it.',
 how:['A <b>row</b> is one fact; a <b>column</b> is one property of it; a <b>table</b> is a set of rows with the same shape.',
      'A <b>primary key</b> identifies a row uniquely and permanently. A <b>foreign key</b> is a row pointing at another row, enforced by the database.',
      'A <b>join</b> follows those pointers at query time, which is why normalised data does not need to be duplicated.',
      '<b>Normalisation</b> stores each fact once so it cannot disagree with itself. <b>Denormalisation</b> deliberately duplicates it to avoid a join, and accepts the risk.'],
 prod:['Constraints in the database are the only ones that hold. Application-level validation races itself the moment there are two processes.',
       'Connection pools are a shared, finite resource — exhausting them looks exactly like the database being down.',
       'Migrations on a large table lock it. Add nullable columns, backfill in batches, then add the constraint.',
       'A backup you have never restored is not a backup.'],
 adr:{ctx:'Order state was kept in the API process so that reads were fast. A rolling deploy lost 40 minutes of orders.',
      dec:'Postgres is the single source of truth. The process keeps only a cache, and it is allowed to be empty.',
      con:['Orders survive restarts, deploys and instance loss.','Every read now crosses a network boundary.','Schema changes became a migration process rather than a code change.']},
 code:{text:'CREATE TABLE orders (\n  id          bigserial PRIMARY KEY,\n  customer_id bigint      NOT NULL REFERENCES customers(id),\n  status      text        NOT NULL DEFAULT \'placed\',\n  total_cents integer     NOT NULL CHECK (total_cents >= 0),\n  placed_at   timestamptz NOT NULL DEFAULT now()\n);\n\n-- The join follows the foreign key. The fact lives in one place.\nSELECT o.id, o.total_cents, c.name\n  FROM orders o\n  JOIN customers c ON c.id = o.customer_id\n WHERE o.status = \'placed\';'}},

indexes:{
 body:'memory',prereq:['database','bigo','structures'],nodes:['db','search'],
 problem:'Finding one order meant reading all four million.',
 pressure:'The table grew, the query did not change, and the same code got slower every week.',
 tradeoff:'Slower writes, more storage, and an index the planner may decide to ignore anyway.',
 why:'Because scanning every row to find one is O(n), and O(n) on a table that grows is a deadline you have already missed. An index is a data structure that turns it into O(log n).',
 concept:'An index is a secondary structure — almost always a B-tree — that maps column values to row locations in sorted order, so the engine can descend to the rows a query needs instead of reading the table. It is the data-structure choice from the algorithms wing, applied to storage and maintained on every write.',
 how:['A B-tree keeps keys sorted and the tree shallow, so a lookup is a handful of page reads regardless of table size.',
      'Because it is sorted, one index serves equality, range scans and ORDER BY.',
      'A <b>composite</b> index on (a, b) serves queries on a, and on a+b — but not on b alone. The column order is the whole design.',
      'A <b>covering</b> index contains every column the query needs, so the engine never touches the table at all.'],
 prod:['Every index is maintained on INSERT, UPDATE and DELETE. Unused indexes are pure write cost — find them and drop them.',
       'A function on the indexed column (<code>WHERE lower(email) = …</code>) disables the index unless you build the index on the same expression.',
       'Read the query plan rather than guessing: <code>EXPLAIN ANALYZE</code> tells you what the planner actually did, including when it chose a scan on purpose.',
       'Below a few thousand rows a sequential scan genuinely is faster, and the planner knows it.'],
 adr:{ctx:'The "my orders" page ran a sequential scan on a 4M-row table for every logged-in customer.',
      dec:'Add a composite index on (customer_id, placed_at DESC) to serve both the filter and the sort.',
      con:['Page latency fell from 2.1s to 6ms.','Order inserts got roughly 4% slower.','One more index in the write path and in the backup size.']},
 code:{text:'-- Seq Scan on orders  (cost=0..84210 rows=1 width=64)\n--   Filter: (customer_id = 4821)\nSELECT * FROM orders WHERE customer_id = 4821 ORDER BY placed_at DESC LIMIT 20;\n\nCREATE INDEX orders_customer_recent\n    ON orders (customer_id, placed_at DESC);\n\n-- Index Scan using orders_customer_recent  (cost=0.43..8.9 rows=20)\n-- The sort is free: the index is already in that order.'}},

transactions:{
 body:'memory',prereq:['database'],nodes:['db','payment'],
 problem:'The order was created, the stock was reserved, and then the payment failed.',
 pressure:'Any operation with more than one step can be interrupted between the steps.',
 tradeoff:'Locks, contention, and isolation anomalies you now have to reason about.',
 why:'Because a half-finished change is worse than no change. A transaction is how you make several writes behave like one.',
 concept:'A transaction is a unit of work that is atomic (all or nothing), consistent (constraints hold at the boundaries), isolated (concurrent transactions do not see each other’s partial work) and durable (a commit survives a crash). Isolation is the one with dials — the others are effectively absolute.',
 how:['<b>BEGIN</b> starts it. Every write is provisional until COMMIT.',
      '<b>COMMIT</b> makes it durable — the write-ahead log is flushed before the commit is acknowledged.',
      '<b>ROLLBACK</b>, or any crash, discards every write in the unit. There is no partial state to clean up.',
      'Isolation levels trade correctness for concurrency: <i>read committed</i> (the common default) still permits non-repeatable reads; <i>repeatable read</i> stops those but permits write skew; <i>serializable</i> behaves as if transactions ran one at a time, and pays for it in aborts.'],
 prod:['Keep transactions short. A transaction held open across a network call to a payment provider holds locks for the provider’s latency.',
       'Never put an external side effect inside a transaction — you cannot roll back a charged card or a sent email. Use the outbox pattern.',
       'Serializable means the database will abort transactions and expect you to retry. If you do not handle the retry, you have not enabled serializable.',
       'Across services there is no shared transaction. That is what sagas and compensating actions are for.'],
 adr:{ctx:'Order creation, stock reservation and payment ran as three independent writes. A payment failure left phantom orders holding stock.',
      dec:'Wrap order and stock in one database transaction. Move the payment call outside it, with an outbox row committed in the same transaction.',
      con:['No more phantom orders holding stock.','The payment is now asynchronous, so the customer sees "confirming" briefly.','A worker and an outbox table to operate.']},
 code:{text:'# Wrong: the card is charged inside the transaction.\n# A rollback cannot un-charge it, and the lock is held\n# for the payment provider\'s latency.\nwith db.transaction():\n    order = orders.insert(cart)\n    stock.reserve(cart.items)\n    payments.charge(cart.total)      # <- external, not rollback-able\n\n# Right: commit local state + an outbox row atomically.\nwith db.transaction():\n    order = orders.insert(cart)\n    stock.reserve(cart.items)\n    outbox.insert(ChargeRequested(order.id, cart.total))\n# A worker reads the outbox and calls the provider, with an\n# idempotency key, retrying safely until it succeeds.'}},

/* ---------------- protocols ---------------- */
rest:{
 body:'circulation',prereq:['architecture'],nodes:['web','api','orders'],
 problem:'Every pair of programs invented its own way to talk, and none of the infrastructure understood any of them.',
 pressure:'Browsers, proxies, CDNs and client libraries already speak HTTP. Anything else has to be taught.',
 tradeoff:'Chatty round trips, and responses that carry fields nobody asked for.',
 why:'Because the alternative is a bespoke protocol per integration. REST’s real payoff is that caches, retries, auth and tooling are already built for it.',
 concept:'REST models the system as <b>resources</b> identified by URLs, manipulated with a small fixed set of HTTP methods whose meaning is defined by the protocol rather than by your application. Each request carries everything needed to understand it — the server keeps no client session between calls.',
 how:['<b>GET</b> reads and must not change anything — which is what makes it safe to cache and safe to retry.',
      '<b>POST</b> creates and is <i>not</i> idempotent: two identical POSTs mean two orders.',
      '<b>PUT</b> replaces and <b>PATCH</b> modifies; both are idempotent when written correctly.',
      '<b>DELETE</b> removes, and deleting twice should still report success.',
      'The status code is part of the answer: <b>2xx</b> it worked, <b>4xx</b> the caller is wrong and retrying will not help, <b>5xx</b> the server is wrong and retrying might.'],
 prod:['Statelessness is what allows any instance to serve any request — it is the precondition for the load balancer, not a purity argument.',
       'Give POST an idempotency key. Mobile clients retry on flaky networks, and a duplicate order is a support ticket.',
       'Version at the edge and never break a field in place; somebody’s app is pinned to it.',
       'Pagination is not optional — an endpoint that returns "all orders" is an outage waiting for a large customer.'],
 adr:{ctx:'Mobile clients on poor networks retried failed POST /orders, producing duplicate orders and duplicate charges.',
      dec:'Require an Idempotency-Key header. Store the key with the response for 24 hours and replay it on repeat.',
      con:['A retry is now safe and returns the original order.','A key store to operate and expire.','Clients must generate and reuse the key correctly — documented and validated.']},
 code:{text:'POST /orders HTTP/1.1\nContent-Type: application/json\nIdempotency-Key: 8f14e45f-ea1a-4b2f-9e1a-9c2b7c1d33aa\n\n{"table": 4, "items": [{"sku": "margherita", "qty": 2}]}\n\n--- 201 Created\nLocation: /orders/1842\n{"id": 1842, "status": "placed", "total_cents": 2400}\n\n--- the same request again, same key\n--- 200 OK   (the original response, replayed — not a second order)\n{"id": 1842, "status": "placed", "total_cents": 2400}'}},

soap:{
 body:'skeleton',prereq:['rest'],nodes:['api'],
 problem:'Two companies needed a contract that a machine could verify, not a wiki page.',
 pressure:'Cross-organisation integrations where "we changed a field" is a legal problem, not a merge conflict.',
 tradeoff:'XML weight, heavy tooling, and a genuine learning curve.',
 why:'Because in some domains the contract must be machine-readable and the message itself must be signed and encrypted — not just the transport. Banking and health integrations still run on this.',
 concept:'SOAP is an XML messaging protocol: every message is an <i>Envelope</i> containing an optional <i>Header</i> (addressing, security, transactions) and a <i>Body</i> (the call or the fault). The service is described by a WSDL document, from which client code is generated.',
 how:['The <b>WSDL</b> declares operations, types and bindings. Clients are generated from it, so a breaking change fails at build time.',
      'The <b>Header</b> carries the WS-* extensions: WS-Security for signing and encrypting parts of the message, WS-Addressing for routing.',
      'A <b>Fault</b> is a structured error in the body — errors are part of the contract rather than an HTTP status.',
      'Because security is applied to the message rather than the channel, it survives intermediaries. That is the capability REST does not have.'],
 prod:['Message-level signing is the reason to choose SOAP. If TLS is enough, it is not the reason.',
       'Generated clients drift: pin the WSDL version and regenerate deliberately.',
       'XML parsers must have entity expansion disabled — XXE is the classic vulnerability here.'],
 adr:{ctx:'The payment partner required signed, non-repudiable messages that stay signed through their internal message bus.',
      dec:'Use SOAP with WS-Security for that one integration. Everything else stays REST.',
      con:['Meets the partner’s audit requirement.','One XML toolchain to maintain for one integration.','New engineers need a runbook for it.']},
 code:{text:'<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">\n  <soap:Header>\n    <wsse:Security>\n      <wsse:BinarySecurityToken>…</wsse:BinarySecurityToken>\n      <ds:Signature>…</ds:Signature>   <!-- signs the Body itself -->\n    </wsse:Security>\n  </soap:Header>\n  <soap:Body>\n    <ChargeCard xmlns="urn:payments:v2">\n      <OrderId>1842</OrderId>\n      <AmountCents>2400</AmountCents>\n    </ChargeCard>\n  </soap:Body>\n</soap:Envelope>'}},

'rpc-graphql':{
 body:'skeleton',prereq:['rest'],nodes:['api'],
 problem:'REST gave every client the same response, and no client wanted exactly that.',
 pressure:'A mobile screen needs three fields from four resources; REST answers with four round trips and four full documents.',
 tradeoff:'gRPC needs a proxy to reach browsers; GraphQL moves the N+1 problem into your resolvers.',
 why:'Because REST fixes the response shape on the server. gRPC and GraphQL are two different answers to that: one makes the call typed and fast, the other lets the client describe the shape it wants.',
 concept:'<b>gRPC</b> is contract-first RPC: you define services and messages in protobuf, generate both sides, and calls travel as compact binary frames over HTTP/2 — with unary, server-streaming, client-streaming and bidirectional modes. <b>GraphQL</b> is a query language for a typed graph: the client sends a selection set, the server resolves exactly those fields, and returns exactly that shape.',
 how:['gRPC: <code>.proto</code> is the source of truth; field <i>numbers</i> provide compatibility, so you may rename a field but never reuse a number.',
      'gRPC streaming keeps one HTTP/2 stream open, which is why it fits telemetry and chat far better than repeated REST calls.',
      'GraphQL: one endpoint, one POST, a selection set; only the requested branches come back.',
      'GraphQL resolvers run per field — which is exactly where an unbatched database call becomes an N+1 storm. DataLoader-style batching is not optional at scale.'],
 prod:['gRPC in the browser needs grpc-web and a proxy. That constraint decides the question more often than performance does.',
       'GraphQL makes query cost client-controlled: enforce depth limits, complexity budgets and persisted queries, or you have shipped a denial-of-service endpoint.',
       'HTTP caching is REST’s free gift and GraphQL’s hard problem — a single POST endpoint defeats every intermediary cache.',
       'Both need a schema-compatibility check in CI. That is the point of having a schema.'],
 adr:{ctx:'The mobile order screen made six REST calls and discarded roughly 80% of every payload.',
      dec:'Expose GraphQL for the mobile client; keep REST for partner integrations and webhooks.',
      con:['One round trip, only the needed fields, noticeably faster on mobile networks.','Resolver-level batching became mandatory.','Two API surfaces to version and secure.']},
 code:{text:'// gRPC: the contract is the file. Numbers, not names, are the ABI.\nservice Orders {\n  rpc GetOrder   (OrderRequest) returns (Order);\n  rpc WatchOrder (OrderRequest) returns (stream OrderEvent);\n}\nmessage OrderRequest { int64 id = 1; }\n\n# GraphQL: the client states the shape; only these branches come back.\nquery {\n  order(id: 1842) {\n    id\n    customer { name }        # one hop into the graph\n    items    { sku qty }\n  }                          # no "total", so no "total" is computed\n}'}},

mcp:{
 body:'brain',prereq:['rpc-graphql'],nodes:['api'],
 problem:'Every AI application re-implemented its own bespoke plugin interface, so no tool worked anywhere else.',
 pressure:'The number of (model application × tool) integrations grows multiplicatively, and each one is custom code.',
 tradeoff:'A process to run, and an authorization boundary you must actually design rather than inherit.',
 why:'Because the same integration problem that produced ODBC and the Language Server Protocol had appeared again: many hosts, many tools, and a quadratic number of adapters. One protocol turns that product into a sum.',
 concept:'The Model Context Protocol is an open protocol in which a <b>host</b> application runs an <b>MCP client</b> per connection, and each <b>server</b> exposes three kinds of capability over JSON-RPC: <i>tools</i> (model-invoked actions), <i>resources</i> (application-controlled context) and <i>prompts</i> (user-selected templates).',
 how:['The client and server negotiate capabilities on connection, so the host discovers what exists instead of hard-coding it.',
      '<b>Tools</b> are functions with a JSON-Schema input, invoked by the model and — critically — gated by the human or the host.',
      '<b>Resources</b> are addressable context the application chooses to include, such as a file or a database row.',
      '<b>Prompts</b> are templates the user picks deliberately, not something the model triggers on its own.',
      'Transport is stdio for a local server or HTTP for a remote one; the protocol is the same either way.'],
 prod:['A tool call is code execution with the model’s judgement in the loop. Scope credentials to the server, not to the host, and keep destructive tools behind explicit confirmation.',
       'Untrusted content returned by a tool can carry prompt injection. Treat tool output as data, never as instructions.',
       'Descriptions and schemas are the model’s only documentation — vague descriptions produce wrong calls far more often than bad models do.',
       'Log every invocation with its arguments. Auditing an agent after the fact is impossible otherwise.'],
 adr:{ctx:'Support agents needed live order lookups. Each assistant product would have required its own custom integration.',
      dec:'Expose one MCP server with read-only order tools; any MCP-capable host can use it unchanged.',
      con:['One integration serves every current and future host.','Authorization must be designed at the server, per token.','A long-running process to deploy, monitor and patch.']},
 code:{text:'from mcp.server import Server\nfrom mcp.types import Tool\n\nserver = Server("restaurant-orders")\n\n@server.list_tools()\nasync def list_tools() -> list[Tool]:\n    return [Tool(\n        name="get_order",\n        description="Look up one order by its numeric id. Read-only.",\n        inputSchema={"type": "object",\n                     "properties": {"id": {"type": "integer"}},\n                     "required": ["id"]})]\n\n@server.call_tool()\nasync def call_tool(name: str, args: dict):\n    if name == "get_order":\n        # scoped, read-only credentials — not the host\'s\n        return orders_db.fetch(args["id"], readonly=True)'}},

realtime:{
 body:'nerves',prereq:['rest'],nodes:['notify','web'],
 problem:'The customer refreshed the page to find out whether the food was ready.',
 pressure:'Polling every second with a thousand customers is a thousand requests per second to answer "no change".',
 tradeoff:'Open connections are state: sticky sessions, reconnect storms, and a scaling model that is no longer stateless.',
 why:'Because the update is generated by the server, and asking repeatedly is the wrong shape for an event the server already knows about.',
 concept:'Three escalating options. <b>Polling</b> repeats a request on a timer. <b>Server-sent events</b> keep one HTTP response open and stream text one way, with automatic reconnection and event IDs. <b>WebSockets</b> upgrade the connection to a bidirectional binary-or-text channel.',
 how:['Polling: simple, cacheable, stateless — and generates load proportional to clients × frequency, regardless of whether anything changed.',
      'Long polling: hold the request open until something happens. Cheaper than polling, still one request per event.',
      'SSE: one direction, plain HTTP, reconnects automatically with <code>Last-Event-ID</code>. Perfect for order status; unable to carry input.',
      'WebSockets: both directions, lowest latency, and your own framing, heartbeats and reconnect logic.'],
 prod:['Open connections are memory and file descriptors. Capacity planning changes from requests-per-second to concurrent-connections.',
       'Behind a load balancer you need sticky routing or a shared pub/sub backplane, because the event arrives at one instance and the socket is on another.',
       'Every client reconnects at once after a deploy. Jittered backoff on the client is what stops the reconnect storm.',
       'If a thirty-second poll is genuinely acceptable, it is also genuinely the right answer.'],
 adr:{ctx:'The order-status page polled every 2s. At peak it was 60% of all API traffic and almost all responses were unchanged.',
      dec:'Serve order status over SSE, fed from the existing event stream. Keep polling as the fallback.',
      con:['API request volume fell by roughly half.','Updates arrive in under a second instead of up to two.','Connection count is now a capacity metric, and the load balancer needed a longer idle timeout.']},
 code:{text:'// Server-sent events: one open response, ids so a reconnect resumes.\nres.writeHead(200, {\n  "Content-Type":  "text/event-stream",\n  "Cache-Control": "no-cache",\n  "Connection":    "keep-alive"\n});\nbus.on("order:" + id, e => {\n  res.write(`id: ${e.seq}\\n`);\n  res.write(`event: status\\n`);\n  res.write(`data: ${JSON.stringify(e)}\\n\\n`);\n});\n\n// Client: reconnects on its own and replays from Last-Event-ID.\nconst es = new EventSource("/orders/1842/stream");\nes.addEventListener("status", e => render(JSON.parse(e.data)));'}},

/* ---------------- messaging ---------------- */
pubsub:{
 body:'nerves',prereq:['rest'],nodes:['broker','notify'],
 problem:'Every time something new needed to know about an order, the order service had to be modified.',
 pressure:'Notifications, analytics, loyalty points, the delivery desk — each new listener was a new call in the same function.',
 tradeoff:'Nobody owns the contract any more, and debugging means tracing a fan-out you cannot see from the publisher.',
 why:'Because the publisher should not need to know who cares. Request/response asks a named party for something; publish/subscribe announces a fact and lets interested parties decide for themselves.',
 concept:'Publish/subscribe inverts the dependency of communication: publishers emit events to a topic without knowing the subscribers, and subscribers register interest without the publisher changing. It is the Observer pattern with a network and a broker in the middle.',
 how:['The publisher writes one event — a statement of fact in the past tense: <code>OrderPlaced</code>, not <code>SendEmail</code>.',
      'The broker delivers a copy to every subscription on that topic.',
      'A new subscriber attaches to the topic. The publisher is not redeployed, not recompiled, not informed.',
      'This is the key difference from a queue: a queue delivers each message to <i>one</i> consumer (work sharing); pub/sub delivers to <i>every</i> subscriber (fan-out).'],
 prod:['Name events as facts, not commands. <code>OrderPlaced</code> can have five subscribers; <code>SendConfirmationEmail</code> can only ever have one.',
       'The event payload is a public API. Version it, and add fields rather than changing them.',
       'Nothing tells the publisher that a subscriber is broken. Per-subscription lag and error metrics are how you find out.',
       'If exactly one consumer must do the work exactly once, you wanted a queue.'],
 adr:{ctx:'Adding the loyalty-points feature required a fifth outbound call inside the order transaction, and its failure rolled back real orders.',
      dec:'Publish OrderPlaced once. Notifications, analytics, delivery and loyalty each subscribe independently.',
      con:['New consumers no longer touch the order service.','A failing consumer cannot fail an order.','Fan-out is now invisible from the publisher; tracing and per-subscriber lag alerts became necessary.']},
 code:{text:'# Publisher: states a fact and stops caring.\ndef place_order(cart):\n    order = orders.insert(cart)\n    bus.publish("orders.placed", OrderPlaced(\n        order_id=order.id, total_cents=order.total, at=now()))\n    return order\n\n# Each subscriber is independent. Adding this file is the\n# entire cost of adding a new listener.\n@bus.subscribe("orders.placed", group="loyalty")\ndef award_points(event: OrderPlaced):\n    loyalty.add(event.order_id, points=event.total_cents // 100)'}},

kafka:{
 body:'nerves',prereq:['pubsub'],nodes:['broker'],
 problem:'A new analytics service needed last month’s events, and they had been deleted the moment the first consumer read them.',
 pressure:'Multiple teams want the same stream, at their own speed, and sometimes want to reprocess it from the beginning.',
 tradeoff:'Real operational weight, and ordering that only holds inside a partition — never across a topic.',
 why:'Because a queue deletes a message once it has been handled, which makes it useless as a record. Kafka keeps the log, so reading is not destroying.',
 concept:'Kafka is a distributed, partitioned, replicated commit log. A topic is split into partitions; each partition is an append-only sequence of records with monotonically increasing offsets. Consumers track their own offset, so reading does not consume — a second consumer group reads the same records independently, and any group can rewind.',
 how:['The <b>producer</b> appends. The record’s <b>key</b> chooses the partition, which is what guarantees that all events for one order stay in order.',
      'Each <b>partition</b> is ordered. There is no ordering guarantee <i>between</i> partitions — this is the single most misunderstood fact about Kafka.',
      'A <b>consumer group</b> divides partitions among its members: add consumers to parallelise, up to the partition count.',
      '<b>Offsets</b> are the consumer’s position, committed by the consumer. Rewinding the offset replays history; that is how you rebuild a projection.',
      '<b>Retention</b> is by time or size, not by consumption. The record stays until the policy removes it.'],
 prod:['Partition count is your parallelism ceiling and it is painful to change later, because the key-to-partition mapping moves.',
       'Consumer lag is <i>the</i> health metric. Alert on lag growth rate, not on absolute lag.',
       'Commit offsets after processing, not before, or a crash silently loses records. That makes delivery at-least-once — design the consumer to be idempotent.',
       'A slow consumer never slows the producer; it just falls behind. This is a feature until retention catches up with it.'],
 adr:{ctx:'Analytics needed to rebuild its order projection after a bug, but the RabbitMQ queue had long since acknowledged and dropped those messages.',
      dec:'Publish order events to a Kafka topic keyed by order_id, with 7-day retention. Analytics and notifications each get their own consumer group.',
      con:['A projection can be rebuilt by resetting the offset to zero.','Consumers read at their own pace without affecting each other.','A Kafka cluster to operate, and ordering guaranteed only per order_id.']},
 code:{text:'# The key decides the partition, and the partition is what\n# makes ordering per order possible.\nproducer.send("orders", key=str(order.id).encode(),\n              value=OrderPlaced(order.id).to_json())\n\n# Two groups, same topic, independent positions.\nconsumer = KafkaConsumer("orders",\n    group_id="notifications",         # "analytics" reads the same records\n    enable_auto_commit=False)         # commit AFTER work, not before\n\nfor record in consumer:\n    handle(record.value)              # must be idempotent: at-least-once\n    consumer.commit()\n\n# Rebuild a projection: rewind and replay.\n# kafka-consumer-groups --reset-offsets --to-earliest \\\n#     --group analytics --topic orders --execute'}},

rabbitmq:{
 body:'nerves',prereq:['pubsub'],nodes:['queue','worker'],
 problem:'Some messages needed to go to one queue, some to three, and some only if they matched a pattern.',
 pressure:'Routing rules that live in the producer become a deployment every time the topology changes.',
 tradeoff:'A message is gone once acknowledged — there is no replay, and no second reader of the same message.',
 why:'Because sometimes you do not want a log, you want a dispatcher: per-message acknowledgement, priorities, dead-lettering and routing rules that can change without redeploying the producer.',
 concept:'RabbitMQ implements AMQP: producers publish to an <b>exchange</b> with a <b>routing key</b>; <b>bindings</b> connect exchanges to <b>queues</b>; the exchange type decides the rule. Consumers take messages from a queue and acknowledge them individually — an unacknowledged message is redelivered.',
 how:['<b>Direct</b> exchange — deliver where routing key equals binding key. Point to point.',
      '<b>Topic</b> exchange — pattern match with wildcards: <code>order.*.eu</code>. The routing rule lives in the binding, not in the producer.',
      '<b>Fanout</b> — ignore the key, copy to every bound queue. This is pub/sub.',
      '<b>Headers</b> — match on message attributes instead of a key string.',
      '<b>Ack / nack</b> — the consumer confirms each message. A nack (or a dead consumer) returns it to the queue or sends it to the dead-letter exchange.'],
 prod:['Set a prefetch limit, or one consumer greedily buffers the whole queue and the others sit idle.',
       'Always configure a dead-letter exchange. Without one, a poison message is redelivered forever and blocks the queue behind it.',
       'A queue that grows without bound will exhaust broker memory and then block publishers. Alert on depth and set a max-length policy.',
       'Durable queue + persistent message + publisher confirms: all three, or the message is not actually safe across a broker restart.'],
 adr:{ctx:'Kitchen tickets, delivery dispatch and receipt printing all needed different subsets of order events, and the routing was an if-chain in the publisher.',
      dec:'Publish to a topic exchange keyed <code>order.&lt;type&gt;.&lt;region&gt;</code>. Each consumer binds the pattern it wants.',
      con:['Routing changes are a binding change, not a deploy.','A new consumer binds itself with no publisher change.','The live topology now lives in the broker, so it must be in configuration management.']},
 code:{text:'# The producer states what happened. It does not choose a queue.\nchannel.basic_publish(\n    exchange="orders", routing_key="order.placed.eu",\n    body=payload,\n    properties=pika.BasicProperties(delivery_mode=2))  # persistent\n\n# Each consumer declares the slice it wants.\nchannel.queue_bind(queue="kitchen",  exchange="orders",\n                   routing_key="order.placed.*")\nchannel.queue_bind(queue="eu_audit", exchange="orders",\n                   routing_key="order.*.eu")\n\n# Poison messages leave instead of blocking the queue.\nchannel.queue_declare(queue="kitchen", durable=True, arguments={\n    "x-dead-letter-exchange": "orders.dlx",\n    "x-max-length": 50_000})\nchannel.basic_qos(prefetch_count=20)   # do not hoard the queue'}},

delivery:{
 body:'nerves',prereq:['kafka','rabbitmq'],nodes:['queue','broker','payment'],
 problem:'The worker crashed after charging the card and before acknowledging the message. The message came back.',
 pressure:'Networks time out without telling you whether the work happened, so every retry might be a duplicate.',
 tradeoff:'A dedupe key, somewhere durable to keep it, and an outbox to write.',
 why:'Because "delivered" is not one guarantee, it is three, and the one you get for free is the one that duplicates. Deciding which you need is a design decision, not a configuration flag.',
 concept:'<b>At-most-once</b>: acknowledge first, then work — messages can be lost, never duplicated. <b>At-least-once</b>: work first, then acknowledge — messages can be duplicated, never lost. <b>Exactly-once</b> delivery is not achievable across an unreliable network; what is achievable is exactly-once <i>effect</i>, built from at-least-once delivery plus an idempotent consumer.',
 how:['Idempotency means f(f(x)) = f(x): applying the operation twice leaves the same state as applying it once.',
      'The usual implementation is a dedupe key — the message id, or a business key — stored in the same transaction as the effect.',
      'The <b>outbox pattern</b> solves the other half: write the state change and the event to the database in one transaction, and let a relay publish it. No lost event, no phantom event.',
      '"Exactly once" in Kafka means transactional writes <i>within</i> Kafka. It does not extend to your database or to a third-party charge.'],
 prod:['Assume every consumer will see duplicates. Design for it once, in the consumer, rather than hunting duplicates later.',
       'The dedupe record and the side effect must commit together, or you have simply moved the race.',
       'Dedupe keys need an expiry policy, or the table becomes the largest one you own.',
       'For metrics and logs, at-most-once is genuinely fine and much cheaper. Match the guarantee to the value of the message.'],
 adr:{ctx:'A broker redelivery after a worker restart charged four customers twice in one evening.',
      dec:'Every charge takes an idempotency key derived from the order id; the payment row and the key are inserted in one transaction.',
      con:['Redelivery is now harmless and the second attempt is a no-op.','One dedupe table with a 30-day expiry.','Every new consumer must adopt the same discipline — it is enforced in the shared worker base class.']},
 code:{text:'# At-least-once delivery + an idempotent consumer\n# = exactly-once EFFECT. The key and the effect commit together.\ndef handle(event):\n    with db.transaction():\n        inserted = db.execute(\n            "INSERT INTO processed (key) VALUES (%s) "\n            "ON CONFLICT DO NOTHING RETURNING key", event.id)\n        if not inserted:\n            return                      # already done — a duplicate\n        payments.charge(event.order_id, event.cents,\n                        idempotency_key=event.id)\n\n# The outbox: state change and event are one atomic write.\nwith db.transaction():\n    orders.insert(order)\n    outbox.insert(topic="orders.placed", payload=order.to_event())\n# A relay tails the outbox and publishes. Nothing can be lost\n# and nothing can be published for an order that rolled back.'}},

tasks:{
 body:'muscle',prereq:['rabbitmq'],nodes:['queue','worker','kitchen'],
 problem:'The customer’s browser waited nine seconds because the request generated a PDF and sent three emails.',
 pressure:'Slow work inside a request holds a connection, a thread and the user’s attention.',
 tradeoff:'A broker, workers, a result store, and a second system to monitor.',
 why:'Because the producer and the consumer do not need to run at the same time. A queue lets the request finish now and the work happen soon.',
 concept:'A task queue moves work out of the request path: the request enqueues a job and returns; a pool of workers consumes jobs independently. The queue absorbs bursts, survives restarts and provides retries — and it converts a synchronous failure into an asynchronous one.',
 how:['The request writes a job and returns 202 with a way to check the result.',
      'Workers pull jobs. Concurrency is set by worker count, not by request volume — which is what makes the system predictable under a spike.',
      'Queue depth is the load-bearing metric: arrival rate above service rate means depth grows without bound, and no amount of waiting fixes it.',
      'Retries need backoff and a dead-letter destination, or one poison job consumes the whole pool.'],
 prod:['A queue absorbs a <i>spike</i>. It cannot absorb a <i>deficit</i> — if arrivals exceed service permanently, depth grows until something breaks.',
       'Jobs must be idempotent. A worker can die between doing the work and acknowledging it, and the job will come back.',
       'Pass identifiers, not objects. A serialised object in a queue is a schema you will deploy incompatible versions of.',
       'The user needs to be told. "We are confirming your order" is a product decision that asynchrony forces on you.'],
 adr:{ctx:'Receipt PDF generation and three emails ran inline, making p95 order latency 9.4 seconds.',
      dec:'Enqueue a job after commit; return 202 with the order id. Workers do the slow work.',
      con:['p95 order latency fell to 180ms.','The customer now sees a "confirming" state instead of a finished one.','A broker, a worker fleet and queue-depth alerting to operate.']},
 code:{text:'# The request path: enqueue and return.\n@app.post("/orders")\ndef create(body):\n    order = place_order(body)\n    send_receipt.delay(order.id)          # returns immediately\n    return {"id": order.id, "status": "confirming"}, 202\n\n@task(max_retries=5, autoretry_for=(SMTPError,),\n      retry_backoff=True, retry_jitter=True)\ndef send_receipt(order_id: int):          # id, not an object\n    order = orders.get(order_id)          # re-read: it may have changed\n    if order.receipt_sent:                # idempotent: safe to run twice\n        return\n    mail.send(render_receipt(order))\n    orders.mark_receipt_sent(order_id)'}},

race:{
 body:'muscle',prereq:['tasks','transactions'],nodes:['worker','db'],
 problem:'Friday night: forty-one orders confirmed for thirty-eight portions of the special.',
 pressure:'Six workers now process orders in parallel, and each one checks the stock before decrementing it.',
 tradeoff:'Waiting on a lock, retrying on a conflict, or restricting yourself to operations that fit in one atomic statement.',
 why:'Because concurrency bugs do not show up in tests that run one thing at a time. They show up at the busiest minute of the week, and they leave no stack trace — only numbers that do not add up.',
 concept:'A <b>race condition</b> is a bug whose outcome depends on the interleaving of concurrent operations. The common form is a <i>lost update</i>: two read-modify-write sequences overlap and one write silently overwrites the other. It is fixed by making the check and the write indivisible — with a <b>lock</b>, an <b>atomic operation</b>, or a <b>version check</b> that detects the overlap.',
 how:['<b>Mutex / pessimistic lock:</b> <code>SELECT … FOR UPDATE</code> holds the row; the second worker blocks until the first commits, then reads the new value.',
      '<b>Atomic statement:</b> <code>UPDATE stock SET n = n - 1 WHERE sku = ? AND n &gt; 0</code>. The database does the check and the write as one step; "0 rows updated" means sold out.',
      '<b>Optimistic lock:</b> a <code>version</code> column. <code>UPDATE … SET n=?, version=version+1 WHERE version=?</code> — zero rows means someone got there first; re-read and decide again.',
      '<b>Semaphore:</b> a counter of permits. It bounds how many may enter (five payment calls at once); it does not protect a single value.',
      '<b>Serialise by key:</b> route every change for one SKU through one queue partition and there is only ever one writer.'],
 prod:['Deadlocks come from taking two locks in different orders. Always lock in a fixed order (by id), and keep transactions short.',
       'Optimistic locking under heavy contention becomes a retry storm — measure the conflict rate before choosing it.',
       'Distributed locks (Redis, ZooKeeper) need fencing tokens; a paused process can wake up still believing it holds a lock that expired.',
       'READ COMMITTED — the default in PostgreSQL — does not prevent lost updates on read-then-write. Choose the fix explicitly.'],
 adr:{ctx:'Oversold specials on three consecutive Fridays; each worker ran SELECT stock, then UPDATE stock = stock - 1.',
      dec:'Replace the read-modify-write with a single conditional UPDATE; treat "0 rows" as sold out.',
      con:['No oversells since, with no added lock waits.','The rule "never read-then-write shared counters" went into code review.','Complex multi-row invariants still need SELECT … FOR UPDATE inside a transaction.']},
 code:{text:'# The bug: check-then-act, with a gap in the middle.\nn = db.scalar("SELECT n FROM stock WHERE sku=%s", sku)\nif n > 0:                                   # B can run here\n    db.execute("UPDATE stock SET n=%s WHERE sku=%s", n - 1, sku)\n\n# Fix 1 — atomic: the check and the write are one statement.\nrows = db.execute(\n    "UPDATE stock SET n = n - 1 WHERE sku=%s AND n > 0", sku)\nif rows == 0: raise SoldOut()\n\n# Fix 2 — optimistic: detect the overlap, then decide again.\nn, v = db.one("SELECT n, version FROM stock WHERE sku=%s", sku)\nrows = db.execute("UPDATE stock SET n=%s, version=version+1 "\n                  "WHERE sku=%s AND version=%s", n - 1, sku, v)\nif rows == 0: retry()                       # someone got there first'}},

retries:{
 body:'reflex',prereq:['delivery','tasks'],nodes:['payment'],
 problem:'The payment provider had a two-second blip, and the retry logic turned it into a twenty-minute outage.',
 pressure:'Every client retried immediately, and they all retried at the same instant.',
 tradeoff:'Amplified load at exactly the worst moment, and duplicate work if the operation is not idempotent.',
 why:'Because most failures in a distributed system are transient — but a naive retry converts a small failure into a large one. The mechanism has to be designed, not assumed.',
 concept:'Three mechanisms that work together. A <b>timeout</b> bounds how long you wait. <b>Exponential backoff with jitter</b> spaces out attempts and de-synchronises callers. A <b>circuit breaker</b> stops calling a dependency that is clearly failing, fails fast, and probes for recovery.',
 how:['<b>Timeout first.</b> Without it the other two cannot work: a caller waiting forever is holding a connection that a retry will need.',
      '<b>Backoff</b> multiplies the delay each attempt (1s, 2s, 4s, 8s) with a cap.',
      '<b>Jitter</b> randomises the delay. Without it, every client retries simultaneously and you have rebuilt the thundering herd you were trying to avoid — full jitter (random between 0 and the cap) is the well-tested choice.',
      '<b>Circuit breaker</b>: closed → open after a failure threshold → half-open after a cool-down, where a single probe decides whether to close or re-open.',
      'Retry only what is safe: 5xx and timeouts, yes; 400 and 404, never — the answer will not change.'],
 prod:['Retry budgets matter more than retry counts: cap retries as a percentage of total traffic so a broad outage cannot triple your own load.',
       'Retries at several layers multiply. Three layers retrying three times each is twenty-seven calls. Retry at one layer, deliberately chosen.',
       'A retry of a non-idempotent operation is a duplicate charge. Idempotency is the precondition for retrying at all.',
       'Timeouts must be shorter than the caller’s timeout, all the way up the stack, or the work continues after nobody is listening.'],
 adr:{ctx:'A 2s payment-provider blip became a 20-minute outage: every client retried immediately and in lock-step, and the recovering provider was knocked down again.',
      dec:'Timeout at 2s, three retries with full jitter, and a circuit breaker that opens at a 50% failure rate over 20 requests.',
      con:['Transient blips are now invisible to customers.','A real outage fails fast and degrades instead of hanging.','Failure is less visible in logs, so breaker state became a dashboard metric.']},
 code:{text:'# Full jitter: random(0, cap) — not a fixed doubling.\n# Fixed backoff keeps every client synchronised; jitter spreads them.\ndef backoff(attempt, base=0.5, cap=8.0):\n    return random.uniform(0, min(cap, base * 2 ** attempt))\n\n@breaker(fail_rate=0.5, window=20, cooldown=30)\ndef charge(order_id, cents, key):\n    for attempt in range(4):\n        try:\n            return provider.charge(cents, idempotency_key=key,\n                                   timeout=2.0)      # timeout FIRST\n        except (Timeout, ServerError):               # transient: retry\n            if attempt == 3: raise\n            sleep(backoff(attempt))\n        except CardDeclined:                         # 4xx: never retry\n            raise'}},

/* ---------------- infrastructure ---------------- */
docker:{
 body:'skeleton',prereq:['architecture'],nodes:['api','worker'],
 problem:'It worked on the developer’s machine and failed in production on a different libc.',
 pressure:'The application is not just your code — it is your code plus an operating system, a runtime and a hundred shared libraries.',
 tradeoff:'Build-cache discipline, image size, and one more layer to debug through.',
 why:'Because "the environment" was an undocumented artefact that existed only on machines somebody had configured by hand. An image makes it a file you can version.',
 concept:'A container image is a stack of read-only filesystem layers plus metadata. A container is a running process using that image with a thin writable layer on top, isolated by kernel namespaces and limited by cgroups. It is not a virtual machine — there is one kernel, shared.',
 how:['Each instruction that changes the filesystem creates a layer. Layers are content-addressed and shared between images.',
      'The build cache reuses a layer if that instruction and everything before it are unchanged — so instruction order decides your build time.',
      'Copy the dependency manifest and install <i>before</i> copying source code; otherwise every source edit reinstalls every dependency.',
      'A multi-stage build compiles in a heavy image and copies only the artefact into a small runtime image.'],
 prod:['Pin base images by digest. <code>:latest</code> means your build is not reproducible and your supply chain is not auditable.',
       'Run as a non-root user with a read-only root filesystem. A container is a process, and root in the container is closer to root on the host than people assume.',
       'Secrets do not belong in layers — a deleted file is still in the layer beneath. Inject at runtime.',
       'One process per container, logging to stdout. The orchestrator handles restarts and collection.'],
 adr:{ctx:'Deploys depended on a hand-configured host. Rebuilding one took two days and never quite matched.',
      dec:'Ship a multi-stage image pinned by digest, built once in CI and promoted unchanged through environments.',
      con:['The same bytes run in CI, staging and production.','Rollback is re-pointing a tag.','Image size and build-cache order are now things the team maintains.']},
 code:{text:'# Dependencies first: this layer is cached until the manifest changes.\nFROM python:3.12-slim@sha256:2a41f0… AS build\nWORKDIR /app\nCOPY requirements.txt .                    # changes rarely\nRUN pip install --prefix=/install -r requirements.txt\nCOPY . .                                   # changes constantly\n\n# Runtime stage carries the artefact, not the toolchain.\nFROM python:3.12-slim@sha256:2a41f0…\nCOPY --from=build /install /usr/local\nCOPY --from=build /app /app\nUSER 10001:10001                           # never root\nCMD ["python", "-m", "orders"]'}},

orchestration:{
 body:'brain',prereq:['docker'],nodes:['lb','api','worker'],
 problem:'A container died at 3am and a human had to restart it.',
 pressure:'Dozens of containers across many machines, each needing placement, restart, rollout and routing.',
 tradeoff:'A genuinely large amount of complexity, and a platform that itself has to be operated.',
 why:'Because "the right number of healthy copies, in the right places, reachable at a stable address" is a control loop — and control loops should not be run by people.',
 concept:'An orchestrator is a reconciliation loop: you declare desired state, it continuously observes actual state and takes action to close the gap. Kubernetes expresses that as objects — a Deployment owns ReplicaSets, which own Pods; a Service gives them one stable address.',
 how:['You declare intent ("five replicas of this image"). You never issue imperative commands.',
      'A controller watches, compares and acts — forever. Delete a pod and it is replaced because the gap reopened.',
      'A <b>readiness</b> probe decides whether a pod receives traffic; a <b>liveness</b> probe decides whether it is restarted. Confusing them causes restart loops under load.',
      'A rolling update creates a new ReplicaSet and shifts replicas across, so a bad rollout can be paused or reversed.'],
 prod:['Resource requests and limits are how the scheduler works. Without requests it packs badly; without limits one pod starves its neighbours.',
       'A liveness probe that calls the database will restart every pod during a database incident, turning a degradation into an outage.',
       'Graceful shutdown: handle SIGTERM, stop accepting, drain in flight. Otherwise every deploy drops live requests.',
       'A pod has no identity and no disk. Anything stateful needs a StatefulSet and a volume, and deserves a hard look first.'],
 adr:{ctx:'Instance failures needed manual intervention, and deploys required a maintenance window.',
      dec:'Run the API as a Deployment behind a Service, with readiness gating traffic and rolling updates.',
      con:['Failed instances are replaced automatically.','Deploys are gradual and reversible.','A cluster to operate, and every service now needs correct probes and resource limits.']},
 code:{text:'apiVersion: apps/v1\nkind: Deployment\nspec:\n  replicas: 5                       # desired state, not a command\n  strategy:\n    rollingUpdate: { maxSurge: 1, maxUnavailable: 0 }\n  template:\n    spec:\n      containers:\n      - name: api\n        image: registry/orders@sha256:2a41f0…\n        readinessProbe:             # may I have traffic?\n          httpGet: { path: /ready, port: 8080 }\n        livenessProbe:              # am I wedged? (never checks the DB)\n          httpGet: { path: /live,  port: 8080 }\n          initialDelaySeconds: 20\n        resources:\n          requests: { cpu: 200m, memory: 256Mi }\n          limits:   { cpu: "1",  memory: 512Mi }'}},

/* ---------------- distributed ---------------- */
cap:{
 body:'memory',prereq:['transactions','delivery'],nodes:['db','replica'],
 problem:'The network between two data centres went down, and both halves kept accepting writes.',
 pressure:'Once there is more than one machine, there is a link, and every link eventually fails.',
 tradeoff:'Whichever half you gave up: stale reads, or writes that are refused.',
 why:'Because a partition is not a hypothetical. It is a scheduled event you have not scheduled. CAP forces you to decide the behaviour in advance rather than discovering it during an incident.',
 concept:'The CAP theorem: when a network partition occurs, a distributed system must choose between consistency (every read sees the latest write) and availability (every request receives a non-error response). Partition tolerance is not an option you pick — it is a property of having a network. So the real choice is CP or AP, <i>during a partition only</i>.',
 how:['<b>CP</b> — refuse to answer on the side that cannot confirm it is current. Correct, and briefly unavailable.',
      '<b>AP</b> — answer with what this side knows. Available, and briefly wrong.',
      'Outside a partition you are trading consistency against <i>latency</i>, not availability — the point PACELC adds.',
      '<b>Eventual consistency</b> is the AP promise: if writes stop, replicas converge. The useful question is always "how long, and what can a user see in the meantime?"'],
 prod:['Make the choice per operation, not per system. "Place order" wants CP; "show the menu" is happily AP.',
       'Quorum reads and writes (R + W > N) give strong consistency on a replicated store without a single leader.',
       'Measure replication lag and expose it. A staleness window you cannot see is one you cannot reason about.',
       'Read-your-own-writes is the anomaly users actually notice. Pin a user to the primary briefly after they write.'],
 adr:{ctx:'A cross-region link failure let both regions accept conflicting stock reservations, and the inventory was oversold.',
      dec:'Stock reservation is CP: writes require a quorum and are refused without one. Menu browsing stays AP from the local replica.',
      con:['Overselling became impossible.','During a partition, ordering pauses in the minority region.','Two consistency models in one product, which has to be explained to support.']},
 code:{text:'# CP for money and stock: refuse rather than guess.\ndef reserve_stock(sku, qty):\n    with quorum_write(timeout=2.0) as w:      # needs W of N nodes\n        if not w.reached:\n            raise Unavailable("cannot confirm stock — refusing")\n        w.decrement(sku, qty)\n\n# AP for the menu: answer from whatever this side has.\ndef menu():\n    try:\n        return replica.read(consistency="local")\n    except Unavailable:\n        return cache.get("menu:last_good")     # stale, and clearly labelled'}},

scaling:{
 body:'circulation',prereq:['cap','indexes','bigo'],nodes:['lb','cache','replica'],
 problem:'One server could not serve the lunch rush.',
 pressure:'Traffic is not flat. It is a spike at noon and nothing at 4am, and the spike is the part that must work.',
 tradeoff:'Cache invalidation, shard keys you cannot change later, and many more moving parts.',
 why:'Because the same expensive answer was being computed thousands of times, and one machine has a ceiling. Caching removes repeated work; horizontal scaling removes the ceiling.',
 concept:'Two different moves. <b>Caching</b> keeps a copy of an expensive result closer to the caller, trading freshness for latency and load. <b>Horizontal scaling</b> puts more instances behind a load balancer, which requires that instances be stateless and interchangeable.',
 how:['<b>Cache-aside</b>: look in the cache; on a miss read the source and populate it. The common pattern, and the one that stampedes.',
      'A <b>cache hit rate</b> is not a vanity metric — at 90% the database sees a tenth of the read traffic, so the difference between 90% and 99% is another tenfold cut.',
      'Invalidation is the hard half: TTL is simple and stale; explicit invalidation is fresh and easy to get wrong; write-through is consistent and slower.',
      '<b>Vertical</b> scaling is a bigger machine — simple and finite. <b>Horizontal</b> is more machines — unbounded and requires statelessness.',
      '<b>Sharding</b> splits the data itself by key. It is the last resort, because the shard key is close to irreversible.'],
 prod:['A stampede happens when a popular key expires and every request misses at once. Fix with a short lock, or by refreshing early in the background.',
       'The cache becomes load-bearing: measure what happens when it is empty, because a cold cache after a restart is a real outage mode.',
       'Autoscaling on CPU reacts after the queue has already formed. Scale on the metric that leads — queue depth or request concurrency.',
       'Measure before distributing anything. One box at 20% utilisation does not need a cluster; it needs a profiler.'],
 adr:{ctx:'Menu reads were 80% of database load, and the same twelve menus were being read thousands of times a minute.',
      dec:'Cache-aside on menu reads with a 60s TTL, early background refresh at 45s, and a per-key lock to prevent stampede.',
      con:['Database read load fell by roughly 85%.','The menu can be up to 60 seconds stale, which the business accepted.','Cache availability is now part of the service’s availability.']},
 code:{text:'def get_menu(restaurant_id):\n    key = f"menu:{restaurant_id}"\n    hit = cache.get(key)\n    if hit is not None:\n        return hit                                 # the 90% path\n\n    # Only ONE caller is allowed to rebuild a cold key.\n    # Without this lock, every miss hits the database at once.\n    with cache.lock(key + ":rebuild", timeout=5, blocking=False) as got:\n        if not got:\n            return cache.get_stale(key) or db_menu(restaurant_id)\n        value = db_menu(restaurant_id)\n        cache.set(key, value, ttl=60, early_refresh=45)\n        return value'}}
};

/* ---- merge the concept model onto the exhibits -------------------- */
EXHIBITS.forEach(function(e){
 const c=CONCEPT[e.id];if(!c)return;
 Object.keys(c).forEach(function(k){e[k]=c[k];});
});

/* ---- the concept graph (§ prerequisites, § visit next) ------------ */
const GRAPH={
 /* who depends on me — derived, never hand-maintained */
 unlocks:function(id){const out=[];
  EXHIBITS.forEach(function(e){if((e.prereq||[]).indexOf(id)>=0)out.push(e.id);});
  return out;},
 /* the full prerequisite chain, deepest first */
 chain:function(id,acc,depth){
  acc=acc||[];depth=depth||0;if(depth>6)return acc;
  const e=BYID[id];if(!e)return acc;
  (e.prereq||[]).forEach(function(p){
   if(acc.indexOf(p)<0){GRAPH.chain(p,acc,depth+1);acc.push(p);}});
  return acc;},
 /* what the visitor is ready for: prerequisites met, not yet visited.
    The lobby is orientation, not curriculum — it is never a suggestion. */
 ready:function(){
  const out=[];
  EXHIBITS.forEach(function(e){
   if(visited[e.id]||e.wing==='hub')return;
   const met=(e.prereq||[]).every(function(p){return visited[p];});
   if(met)out.push(e);});
  return out;},
 /* the single best suggestion, by conceptual distance not floor plan */
 next:function(fromId){
  const r=GRAPH.ready();
  if(!r.length)return null;
  const from=BYID[fromId];
  if(from){
   const direct=r.filter(function(e){return (e.prereq||[]).indexOf(fromId)>=0;});
   if(direct.length)return direct[0];
   const rel=(from.rel||[]).map(function(x){return BYID[x];})
     .filter(function(e){return e&&!visited[e.id];});
   if(rel.length)return rel[0];}
  return r[0];},
 /* concepts the visitor has already met that touch this one */
 metBefore:function(id){
  const e=BYID[id];if(!e)return [];
  const pool=(e.prereq||[]).concat(e.rel||[]);
  const out=[];
  pool.forEach(function(p){
   if(visited[p]&&out.indexOf(p)<0&&BYID[p])out.push(p);});
  return out;},
 /* every hall that explains a given system node */
 forNode:function(nodeId){
  const out=[];
  EXHIBITS.forEach(function(e){if((e.nodes||[]).indexOf(nodeId)>=0)out.push(e);});
  return out;}
};

# Architecture

The museum is a static site: one HTML shell, three stylesheets, plain scripts, and a folder of CC0 models. There is no build step and no framework.

## How the code is loaded

`index.html` loads three.js r128 and its official r128 add-ons, then the museum's scripts in a fixed order. They are classic scripts, not ES modules, so every top-level `const`, `let` and `function` lives in one shared global scope. That has two consequences:

- **Order matters.** A file may use names from files loaded before it at load time. It may use names from any file inside functions that run later.
- **Names must be unique.** If two plain scripts declare the same top-level name, the second script fails to run and the page hangs on its loading bar. `node tools/check.js` catches this, and the GitHub Action runs it on every push.

Files that start with `(function(){` keep their names private. The graphics layer, the props module's internals, and every story file work this way.

## Map

```
index.html                markup only: HUD, panels, story lab, script list
css/
  museum.css              HUD, sheets, explain card, lab bar, instrument
  stories.css             the story lab and the first-visit card
  panels.css              settings and the follow-an-order route bar
js/
  content/
    exhibits.js           WINGS and EXHIBITS: every hall's text, code and refs
    guides.js             plain-language guides and trade-off tables
    concepts.js           the concept model and the prerequisite graph
  system/
    topology.js           the restaurant system: nodes, edges, failures, guards
    simulator.js          the event bus (BUS, EVT) and the queueing simulator (SIM)
    instrument.js         the System view (V): six drawings of one topology
  ui/
    diagrams.js           2D canvas diagrams used inside the hall guides
  world/
    kit.js                constants, materials, primitives, canvas textures
    installations.js      the animated object on each hall's plinth
    labs.js               interactive versions of those installations (keys 1-9)
    building.js           the spiral rotunda, pavilions and alcoves
    cast.js               small figures acting out each department
    restaurant.js         the restaurant floor, driven by simulator events,
                          plus the follow-an-order route bar
    props.js              CC0 models: furniture, food and the robot staff
    route.js              the lessons laid along the ramp between halls
    column.js             the abstraction stack in the atrium, and the intro
  app/
    navigation.js         walking, the guide sheet, the map and search
    capstone.js           "build the restaurant" and the help sheet
    explain.js            the explain card, camera focus, lab bar, frame stats
    settings.js           the settings panel
    input.js              keyboard, joystick, look, the ramp rail
    main.js               the frame loop and boot
  gfx/
    renderer.js           post-processing, lighting, shadows, reflections
  stories/
    kit.js                recorder, playback model and drawing primitives
    a-order.js … f-replay.js   one deterministic scenario per file
    player.js             timeline, explanation levels, guide, experiments
assets/
  models/                 robot, furniture and food (see assets/CREDITS.md)
tools/check.js            syntax, duplicate globals, missing models
```

## One system, many views

Everything describes the same fictional restaurant. `topology.js` defines its components. `simulator.js` runs it and announces what happens on `BUS`. The views listen to that bus:

- **The restaurant floor** (`restaurant.js`) moves a packet for each request and drives the station animations.
- **The robots** (`props.js`) react to the same events. `WORK_STARTED` makes a kitchen robot turn to the stove, `DUPLICATE` makes it shake its head, and `EVENT_CONSUMED` sends the waiter to a table.
- **The core** in the atrium (`renderer.js`) pulses with the number of requests in flight, and turns red as system health drops.
- **The System view** (`instrument.js`) draws the same topology six ways and can step through a recorded trace.

The six stories (`js/stories/`) are separate: deterministic simulations that record a state snapshot after every event, so the timeline can step backwards to a real earlier state.

## Adding a story

1. Copy `js/stories/d-race.js`, the shortest one.
2. Give it a new `id`, a `hall` (the exhibit it belongs to), `nodes`, `options`, `metrics`, and a `build(opts)` that records events with `new Rec(...)`.
3. Add a `<script>` tag before `js/stories/player.js` in `index.html`.
4. Map its hall in `HALL2S` in `player.js` so the hall's explain card links to it.

## Adding a model

1. Put the `.glb` file under `assets/models/` and credit it in `assets/CREDITS.md`.
2. Add it to `FILES` in `js/world/props.js`.
3. Place it with `put(parent, name, size, x, y, z, rotation)`, where `size` is the real height in metres, then call `finish()` so it casts and receives shadows.

If the file fails to load, `put` returns `null` and the scene carries on without it.

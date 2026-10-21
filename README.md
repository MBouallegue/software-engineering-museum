# The Museum of Software Engineering

![The atrium and its live core, from film mode](preview.jpg)

A walkable 3D museum of software engineering that runs in the browser. You climb a spiral ramp through ten departments: principles and design, algorithms, dynamic programming, data and storage, protocols, messaging, concurrency, infrastructure and distributed systems. Every exhibit acts its idea out, and all of them describe one fictional restaurant system.

**Live site:** https://mbouallegue.github.io/software-engineering-museum/

## What's inside

- **29 halls.** Each one has an installation you can operate, a reference guide, code samples and interview notes.
- **Six guided stories** (press `L`). Each is a deterministic simulation with a real timeline: play, pause, step back, change one engineering decision, and compare the two runs.
  - A: follow one order through the system
  - B: why database indexes matter
  - C: a queue under pressure
  - D: a race condition
  - E: a distributed failure
  - F: Kafka replay
- **The system view** (press `V`). The same restaurant drawn as a blueprint, as C4 levels, as a live runtime and as a failure map, with a control room where you can break it and defend it.

## Controls

| Key | Action |
| --- | --- |
| `W A S D` / drag | Walk / look around |
| `E` | Explain the exhibit in front of you. Press again for its guide |
| `1`–`9` | Operate the exhibit |
| `C` | Film mode: a continuous camera flight through the building, HUD hidden |
| `L` | Stories |
| `V` | The system view |
| `M` | Map and search |
| `P` | Pause the whole museum |
| `?` | Help |

## Rendering

Everything is three.js r128 plus its official add-ons from the same release. No build step, no framework.

- **HDR post-processing.** The scene renders into a half-float target, then goes through `UnrealBloomPass`, a custom grade pass and FXAA. The grade pass handles highlight roll-off, sRGB encoding, contrast and saturation, a cool-shadow/warm-highlight split tone, vignette, light grain and slight edge chromatic aberration.
- **Image-based lighting.** A small procedural environment (a gradient sky, an oculus ring of cold light, warm and cool horizon panels) is prefiltered with `PMREMGenerator` and set as `scene.environment`, so frames and plinths read as metal.
- **Shadows from a key light that follows the visitor.** The light's frustum is snapped to a grid so edges don't shimmer. Its near/far planes keep the floors above you out of the pass. Only mid-sized objects cast and only large surfaces receive, and the map refreshes every 2nd or 3rd frame.
- **A polished atrium floor.** A `Reflector` with a custom shader adds a slightly blurred, Fresnel-weighted reflection that fades at the rim.
- **Shader details.** Volumetric light cones over every installation (they brighten as you approach), drifting dust as GPU-animated points, and an energy core whose grid and bands pulse with live traffic and turn red when the system is unhealthy.
- **Readable at a distance.** Floating labels fade with distance, so the far side of the building doesn't become a wall of text.
- **Film mode.** A closed Catmull-Rom camera path runs down the atrium, along the ramp and over the restaurant, then cranes back up to the oculus. Installations are kept alive around the camera, not the visitor.

### Quality

The **HQ / MQ / LQ** button in the top bar switches quality, and the choice is remembered.

| Level | What it adds |
| --- | --- |
| Low | Direct rendering, environment lighting, light cones, dust |
| Medium | Bloom, grade, FXAA, soft shadows (1024) |
| High | Higher pixel ratio, 2048 PCF-soft shadows, reflective atrium floor |

The default depends on the device, and the museum steps down automatically if the frame rate stays low. URL parameters are useful for recording:

- `?q=high` forces a quality level.
- `?film` starts film mode on load.

For example: `https://mbouallegue.github.io/software-engineering-museum/?q=high&film`

## Run it locally

It is a single static file with no build step. Open `index.html` in a browser, or serve the folder:

```sh
python -m http.server 8000
# then open http://localhost:8000
```

## Publish with GitHub Pages

1. Push this folder to a public GitHub repository.
2. In the repository, go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, then select `main` and `/ (root)`.
4. After about a minute, the site is live at `https://<your-username>.github.io/<repository-name>/`.

## Built with

- [Three.js](https://threejs.org/) r128 from cdnjs, and its r128 add-ons (EffectComposer, UnrealBloomPass, FXAA, Reflector) from jsDelivr
- Inter, Space Grotesk and JetBrains Mono from Google Fonts
- Plain HTML, CSS and JavaScript

## License

[MIT](LICENSE)

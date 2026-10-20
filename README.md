# The Museum of Software Engineering

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
| `L` | Stories |
| `V` | The system view |
| `M` | Map and search |
| `P` | Pause the whole museum |
| `?` | Help |

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

- [Three.js](https://threejs.org/) r128, loaded from cdnjs
- Inter, Space Grotesk and JetBrains Mono from Google Fonts
- Plain HTML, CSS and JavaScript

## License

[MIT](LICENSE)

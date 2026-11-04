# Development and verification

This project verifies the installed `@lewismoten/gamemaker-sandbox-engine` npm package from a separate Vite application. See the [README](../README.md) for setup.

For fixture development and browser checks, install development dependencies with `npm ci`. The engine and tools are installed from npmjs.org.

## Verify the package integration

These commands use the installed npm package and committed game data without requiring another source checkout:

```sh
npm run check
npm run build
npm run check:release
npm run check:guidance
npm run check:music
npm run check:isolation
npm run check:archives
```

`check` typechecks the application. `build` typechecks and builds it with Vite. The browser checks require locally installed Google Chrome; Playwright uses its `chrome` channel.

- `check:release` builds into a temporary directory and previews it on port 4176. Public page controls play the complete shipped demonstration, check the mobile finale, and start a new game. It checks for missing assets and browser errors, removes the scratch build, and stops its server.
- `check:guidance` uses port 4177. It checks each level's guidance text, the road atlas (one entry per level) and the tip on a phone after continuing at the hill.
- `check:browser` uses port 4175. It plays the hill with the real keyboard in the browser engine: the 20 mph climb, the crest scene change, the 30 mph descent and the ending, reading the engine's world every frame.
- `check:axe` uses ports 5431 to 5434. axe-core at 1440 and 390, light and dark, and no sideways scroll at 390.
- `check:archives` uses a scratch production server on port 4180. It checks the ZIP download, single-file bundled loading with loose game requests blocked, ZIP/SFX imports, keyboard access, and accessibility at 1440/390 in light/dark settings.
- `check:music` uses port 4178. It checks muted intros, level songs, current-track resume, the saved setting, and audible barks while music is off.

The checks use their own servers and leave the maintainer’s port 5173 server alone.

## Rebuild or inspect the fixture

All commands work from this repository alone. Generic development APIs come from the `@lewismoten/gamemaker-sandbox-tools` devDependency; game-specific content is copied into `assets/source/`. Browser playback uses `@lewismoten/gamemaker-sandbox-engine` and the runtime `@lewismoten/gamemaker-sandbox-archives` package to unpack the committed `public/hypothesis.zip`.

```sh
npm run build:art
npm run build:zip
npm run build:game
npm run check:game
npm run check:browser
```

`build:zip` creates the downloadable `public/hypothesis.zip` from the generated game files, instructions, license, and notices, using a fixed DOS timestamp and sorted entries. `build:game` also runs this step. `build:art` renders the landing page’s worn CitiCar. `build:game` writes the native DOS files to `public/game/`. These generated files are committed with their source. The toolkit is needed only when running development scripts.

`check:game` validates the fixture with the headless reference simulation from the tools package. It checks the scene graph, the garage door and its pickups, the three car speeds (20, 25 and 30 mph) with their speedometers, the stripe palette swaps, the timed turtle crossing, text and animation limits, and the shipped recording, which must win without losing a try and use only arrows, Space and Enter, one key at a time. `check:speed` runs just the speed measurements.

`check:browser` imports local fixture helpers and the installed development toolkit. It starts a temporary Vite server on port 4175, checks portrait and landscape layout and accessibility in light and dark settings, and plays all nine chapters through the installed npm engine. It stops its server afterwards.

**Phase 1 status:** `check:browser`, `check:guidance` and `check:release` still describe the old nine-chapter game's route and need rewriting for the new levels (phase 2). `check:game`, `check:speed`, `npm run check` and `npm run build` are current.

Additional browser modes (stale until then):

```sh
npm run check:browser -- --record
npm run check:browser -- --demo
npm run check:browser -- --lap
npm run check:browser -- --retry
```

- `--record` saved a browser run’s DOS input recording. Use `npm run record:demo` instead, which plays the game headless and saves `assets/teddy-tour.rec`; rebuild the game afterwards to copy it into `public/game/`.
- `--demo` verifies the shipped recording.
- `--lap` checks the vehicle chapter directly.
- `--retry` deliberately loses three tries, reloads the saved chapter, and verifies recovery with three fresh tries and clearing the checkpoint on a win.

## Source map

| Path                                              | Purpose                                                                       |
| ------------------------------------------------- | ----------------------------------------------------------------------------- |
| `src/game-files.ts`                               | Fetch the game ZIP and unpack bundled or selected archives into engine files. |
| `scripts/build-zip.ts`                            | Create the game distribution ZIP with the archives package.                   |
| `src/main.ts`                                     | Load game files and run the npm engine; connect page controls and status.     |
| `src/chapters.ts`                                 | Level names, goals, entrances, doors, and guidance.                                |
| `src/checkpoint.ts`                               | Remember a validated level entrance.                                        |
| `src/road-guide.ts`                               | Experiment log and contextual hints.                                              |
| `src/music-control.ts`                            | Persistent music preference independent of effects.                           |
| `scripts/build-game.ts`                           | Build the complete native game and its scene graph.                           |
| `scripts/hypo-art.ts`                             | Palettes, the stripe palette-swap car and the speedometer drawing.            |
| `scripts/hypo-car.ts`                             | The 20, 25 and 30 mph car characters, each carrying its own speedometer.      |
| `scripts/hypo-driveway.ts`                        | Level 1: four-way Teddy, pickups and the garage door.                         |
| `scripts/hypo-street.ts`                          | Level 2: the flat street and the timed turtle crossing.                       |
| `scripts/hypo-hill.ts`                             | Level 3: the hill, sheared along the car's path, with the 20 and 30 mph cars. |
| `scripts/hypo-cards.ts`                           | Title, level and results cards; intro, garage and results cartoons.           |
| `scripts/check-speed.ts`                          | Measures the three speeds in the headless simulation and the crest link.      |
| `scripts/record-demo.ts`                          | Plays the game headless and saves the shipped `.REC` demonstration.           |
| `scripts/music.ts`                                | Original level and ending themes.                                           |

`assets/gwinn-door.voc`, `assets/teddy-bark.voc`, and `assets/teddy-yawn.voc` are short edits of Lewis Moten’s recordings. Gwinn cheers when Teddy opens a car door, Teddy barks at balloon dogs, and his yawn plays during a nap.

See [Game data and engine techniques](engine-techniques.md) for implementation details and [NOTICE.md](../NOTICE.md) for credits.

## Development toolkit

The toolkit is a development dependency (`^3.1.0`) installed from npmjs.org. The project's `.npmrc` routes the `@lewismoten` scope to `https://registry.npmjs.org/`, and the lockfile records the published download URL and integrity checksum. No GitHub Packages login is needed for this setup.

```sh
npm ci
```

The toolkit's source is maintained in Game-Maker: Sandbox Edition; rebuilding or publishing that package is separate from building this consumer. Package tarballs are not committed here.

`npm run check:isolation` copies this project into a temporary consumer with no sibling repository, runs a fresh `npm ci`, rebuilds the game and art, runs native checks and typechecking, and compares every public file byte. It removes the installed tools package before building the browser application and rejects any tools-package module in the runtime graph. The scratch installation is removed afterwards.

See [copied-content provenance](../assets/source/README.md) for the game-specific source assets and their license.

To verify a future toolkit candidate, supply its tarball from outside this repository:

```sh
npm run check:isolation -- --tools-package /path/to/gamemaker-sandbox-tools.tgz
```

This overrides the dependency only in the temporary consumer; the project manifest and lockfile continue to use the registry version.

## Archive package release

`@lewismoten/gamemaker-sandbox-archives` is a runtime dependency (`^3.1.0`); it contains no development tools. Its source package and `archives-v3.1.0` release workflow live in Game-Maker: Sandbox Edition. Publish that package to the consumer's configured registry before a normal fresh installation. Until that first release, use the separately supplied npm candidate outside the repository:

```sh
npm install --no-save --package-lock=false /path/to/gamemaker-sandbox-archives.tgz
npm run check:isolation -- --archives-package /path/to/gamemaker-sandbox-archives.tgz
```

The candidate override changes only the scratch consumer. No npm tarballs are committed. `public/hypothesis.zip` is the intended game distribution asset and is committed with the game builder. Its files can also be unpacked by ordinary ZIP utilities.

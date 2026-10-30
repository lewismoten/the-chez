# Development and verification

This project verifies the installed `@lewismoten/gamemaker-sandbox-engine` npm package from a separate Vite application. See the [README](../README.md) for setup.

## Verify the package integration

These commands use the installed npm package and committed game data without requiring a GameMaker source checkout:

```sh
npm run check
npm run build
npm run check:release
npm run check:guidance
npm run check:music
```

`check` typechecks the application. `build` typechecks and builds it with Vite. The browser checks require locally installed Google Chrome; Playwright uses its `chrome` channel.

- `check:release` builds into a temporary directory and previews it on port 4176. Public page controls play the complete shipped demonstration, check the mobile finale, and start a new game. It checks for missing assets and browser errors, removes the scratch build, and stops its server.
- `check:guidance` uses port 4177. It checks actor-specific hints and uses public keyboard controls to pass Maple Street’s three crate barriers. Spending the native gate quota must keep the completed goal visible through the transition.
- `check:music` uses port 4178. It checks muted intros, chapter changes, current-track resume, persistent settings, and audible barks while music is off.

The checks use their own servers and leave the maintainer’s port 5173 server alone.

## Rebuild or inspect the fixture

Running and building the web application needs only this repository. The fixture builders and reference-engine checks additionally use a sibling `../GameMaker` checkout for format helpers, source art, and simulation tools.

```sh
npm run build:art
npm run build:game
npm run check:game
npm run check:browser
```

`build:art` renders the landing page’s worn CitiCar. `build:game` writes the native DOS files to `public/game/`. These generated files are committed with their source, so consumers do not need the sibling checkout to run the application.

`check:game` validates the fixture with the reference engine from the sibling checkout. It checks gates, inventory-tied flight, recovery paths, timed crossings, nap clouds, vehicle handling, text and animation limits, and the complete shipped recording. The recording must win without losing a try. This is separate from verifying the published npm package in the browser.

`check:browser` also imports fixture helpers from the sibling checkout. It starts a temporary Vite server on port 4175, checks portrait and landscape layout and accessibility in light and dark settings, and plays all nine chapters through the installed npm engine. It stops its server afterwards.

Additional browser modes:

```sh
npm run check:browser -- --record
npm run check:browser -- --demo
npm run check:browser -- --lap
npm run check:browser -- --retry
```

- `--record` saves a successful run’s DOS input recording to `assets/teddy-tour.rec`. Rebuild the game afterwards to copy it into `public/game/`.
- `--demo` verifies the shipped recording.
- `--lap` checks the vehicle chapter directly.
- `--retry` deliberately loses three tries, reloads the saved chapter, and verifies recovery with three fresh tries and clearing the checkpoint on a win.

## Source map

| Path                                              | Purpose                                                                   |
| ------------------------------------------------- | ------------------------------------------------------------------------- |
| `src/main.ts`                                     | Load game files and run the npm engine; connect page controls and status. |
| `src/chapters.ts`                                 | Chapter names, goals, entrances, and guidance.                            |
| `src/checkpoint.ts`                               | Remember a validated chapter entrance.                                    |
| `src/road-guide.ts`                               | Road atlas and contextual hints.                                          |
| `src/music-control.ts`                            | Persistent music preference independent of effects.                       |
| `scripts/build-game.ts`                           | Build the complete native game and its scene graph.                       |
| `scripts/chapters.ts`                             | Assemble the chapter data.                                                |
| `scripts/course-scenery.ts`                       | Draw complete original scenery and preserve backgrounds beneath pickups.  |
| `scripts/course-obstacles.ts`                     | Crates, hedge lift, and recoverable foam trays.                           |
| `scripts/crew-characters.ts`                      | Playable cast and walking jumps.                                          |
| `scripts/park-errand.ts`                          | Leaf rescue, wooden gate, and return lift.                                |
| `scripts/wind-kites.ts`                           | Moving stripe pickups and replacement posts.                              |
| `scripts/leaf-crossing.ts`                        | Native timed WAIT / GO crossing.                                          |
| `scripts/sky-laundry.ts`                          | Wind streams, cloud ledges, and nap clouds.                               |
| `scripts/gwinn-maze.ts`                           | Four-way garden maze.                                                     |
| `scripts/umbrella-weather.ts`                     | Inventory-powered floating and rain curtains.                             |
| `scripts/victory-lap.ts`                          | Vehicle character and homeward road.                                      |
| `scripts/stripe-car.ts`                           | Worn stripes and final repair.                                            |
| `scripts/cartoons.ts` / `scripts/road-stories.ts` | Intro, road trips, victory, and retry animations.                         |
| `scripts/music.ts`                                | Original chapter and ending themes.                                       |

`assets/gwinn-door.voc`, `assets/teddy-bark.voc`, and `assets/teddy-yawn.voc` are short edits of Lewis Moten’s recordings. Gwinn cheers when Teddy opens a car door, Teddy barks at balloon dogs, and his yawn plays during a nap.

See [Game data and engine techniques](engine-techniques.md) for implementation details and [NOTICE.md](../NOTICE.md) for credits.

# THE CHEZ: Stripe Chase

A Vite app with an original, seven-chapter RSD Game-Maker game. Teddy gathers fresh racing stripe pieces for Doc Leo's tomato-red CitiCar, while Gwinn cheers the crew on. The game runs through `@lewismoten/gamemaker-sandbox-engine` in the browser.

## Run locally

```sh
npm install
npm run dev
```

Open the Vite URL and choose **Play as Teddy**. Move Teddy with the Left and Right arrows (or A and D); hop with Up or W; bark with Space. Gather the required stripe pieces across the yard, Maple Street, Puddlewick Park, Downtown, the Clown Club, and Sky Laundry. These walking chapters end at THE CHEZ on the right; Teddy's Victory Lap then heads left toward home. F1 shows instructions. Touch buttons are below the game.

**Watch Teddy** plays a complete demonstration using a DOS `.REC` input recording through the same engine. Choose **Restart** to start your own game at any time. The recording stores keys and timing, not a video or a second implementation of the game.

Each new road changes the challenge: raised pieces call for hops, the park has a lifting air puff, Downtown adds a conveyor strip, and the Clown Club has friendly balloon dogs who share stripe pieces when Teddy barks. Sky Laundry takes the route upward: pause in an air stream, drift onto a cloud ledge, and gather the stripes above the marked Z clouds.

The fitted stripes pay off in **Teddy's Victory Lap**. Doc Leo drives while Teddy calls the corners from the passenger window. Hold Left to drive home, release it to coast to a stop, and use Right to reverse. Up bounces the car over the marked bumps; Space honks without stopping. Checkered flags count as cheers. This final road has no nap clouds.

Z clouds send Teddy into a tiny nap and use one try. The status shows the tries left. After three naps, **Try this road again** resumes the current chapter with three fresh tries. **Restart** starts the whole adventure again. The browser remembers the current road between visits: **Continue with Teddy** begins at its safe entrance with three fresh tries. Watching the demonstration keeps your own saved road. Winning or choosing Restart clears it. If browser storage is unavailable, the current session still keeps its checkpoint. F5 and F6 also provide the engine's save and load screens.

The **More Game-Maker games** section accepts another DOS game folder with a `.GAM` file and plays it through the same engine. Files stay in the browser.

## Teddy’s glovebox notebook

The page’s optional notebook explains the counter gates, bark exchanges, upward gravity and one-way cloud ledges, vehicle character, input recording, and music and cartoons. Each expandable entry names its source builder and links to actual downloadable DOS files. These are inspection examples; playing outside this page needs the complete `public/game/` folder. The notebook uses native HTML details controls and does not run a separate game simulation.

## Rebuild the DOS game

```sh
npm run build:game
npm run check:game
npm run check:browser
npm run check
npm run build
npm run check:release
```

`build:game` reads the GameMaker sibling checkout (`../GameMaker`) for the format helpers, Teddy art, and the measured CitiCar drawing. It writes the playable DOS files to `public/game/`. The built files are committed, so running the web app does not need the sibling checkout. `check:game` uses the headless Game-Maker engine to verify the counter gates, marked nap clouds, walking routes, cloud crossings, vehicle momentum, horn, and bounces. It also replays the shipped `.REC` through the complete built scene graph and requires a win without a nap.

The builder lives in `scripts/build-game.ts`. `scripts/chapters.ts` constructs the later stripe trails, `scripts/sky-laundry.ts` draws the cloud crossing and its nap clouds, `scripts/victory-lap.ts` builds the vehicle character and the leftward road, `scripts/scenery.ts` removes the source maps' unrelated interactions, `scripts/cartoons.ts` renders the intro, drive, win, and try-again animations, and `scripts/music.ts` composes the chapter and ending themes. See [NOTICE.md](NOTICE.md) for credits.

`assets/gwinn-door.voc`, `assets/teddy-bark.voc`, and `assets/teddy-yawn.voc` are short edits of Lewis Moten's recordings. Gwinn cheers when Teddy opens a car door, Teddy barks at balloon dogs, and his own yawn plays during a tiny nap.

## Inside Sky Laundry

- The air streams are two animated background blocks with upward gravity. Their arrows move while both animation frames keep the same pull.
- Cloud ledges are solid only on top. Teddy can rise through them from below, then settle on them from above. The route uses three different crossing heights.
- Marked Z clouds start Teddy's sleep animation. Game-Maker stores extra lives, so the builder gives him two extras and the page shows three total tries. After those tries, the page starts a fresh engine session at the same chapter's safe entrance.
- Each height gets stripe artwork over its own sky band. Touching a piece replaces it with that same background, so collecting it leaves a clean sky rather than a floating rectangle.

## Inside the leaf crossing

`scripts/leaf-crossing.ts` builds Gwinn’s timed Downtown crossing from fourteen background block slots. Five barrier rows and a two-tile sign share a 36-tick WAIT / 54-tick GO cycle. The closed variants are solid; the open variants are passable. Labels, striped barriers, and directional chevrons explain the state without depending on color. Neither state hurts Teddy or costs a try. This uses PLAYGAME’s global block animation, including collision with the displayed variant, rather than a page timer.

## Inside the victory ride

The vehicle is a new `.CHR` and `.CBL`, played by the same engine. Its steering frames add momentum instead of moving a fixed distance; the idle sequence lets that momentum decay. A bounce adds an upward impulse while keeping the horizontal momentum, and the horn sequence leaves the car rolling. The car sprite comes from the measured `chezPicture` drawing, reduced to the engine's 20-pixel actor width, with Teddy in the passenger window. The larger cartoons show the full car drawing.

The bounce has three protected ticks so a car stopped against a bump can rise before steering resumes. This avoids the engine's corner adjustment pushing the car down again while it is still too low to clear the bump.

Neutral spacer sequences also make steer-and-bounce inputs safe when both keys arrive in the same tick. They account for the original player's behavior when it resumes a sequence before that sequence's first frame has played.

`src/checkpoint.ts` stores only a validated road entrance in local browser storage, tied to the current chapter order. It never restores live engine objects, inventory, or a demonstration’s position.

`src/chapters.ts` supplies the page's names, goals, entrances, and control labels. The game check compares those values with the built DOS scene graph and gates, including the victory road's entrance on the right.

Every exit has one scene link, on its locked tile. The finish ribbon is checked from both sides so bouncing over it cannot bypass the cheer quota.

`check:browser` needs locally installed Google Chrome. It starts its own temporary Vite server on port 4175, checks layout and accessibility in portrait and landscape, plays all seven chapters through the installed engine package, and checks the win ending. It stops its server afterwards. Add `-- --record` to save the successful run's DOS input recording to `assets/teddy-tour.rec`, `-- --demo` to verify the shipped recording, `-- --lap` to check the vehicle chapter directly, or `-- --retry` to deliberately lose three tries and verify the saved chapter after a page reload, three fresh tries, recovery, and clearing the checkpoint on a win. Rebuild the DOS game after recording a new demonstration.

`check:release` builds into a temporary directory and previews it on port 4176. It uses only the page's public controls to watch the shipped demonstration, checks the mobile finale, then starts a new game. It reports missing assets or browser errors and removes its build and stops its server afterwards. Both browser commands use their own servers and leave the maintainer's port 5173 server alone.

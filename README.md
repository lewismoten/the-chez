# THE CHEZ: Stripe Chase

A Vite app with an original, six-chapter RSD Game-Maker game. Teddy gathers fresh racing stripe pieces for Doc Leo's tomato-red CitiCar, while Gwinn cheers the crew on. The game runs through `@lewismoten/gamemaker-sandbox-engine` in the browser.

## Run locally

```sh
npm install
npm run dev
```

Open the Vite URL and choose **Play as Teddy**. Move Teddy with the Left and Right arrows (or A and D); hop with Up or W; bark with Space. Gather the required stripe pieces across the yard, Maple Street, Puddlewick Park, Downtown, the Clown Club, and Sky Laundry, then reach THE CHEZ at the right end of each chapter. F1 shows instructions. Touch buttons are below the game.

**Watch Teddy** plays a complete demonstration using a DOS `.REC` input recording through the same engine. Choose **Restart** to start your own game at any time. The recording stores keys and timing, not a video or a second implementation of the game.

Each new road changes the challenge: raised pieces call for hops, the park has a lifting air puff, Downtown adds a conveyor strip, and the Clown Club has friendly balloon dogs who share stripe pieces when Teddy barks. Sky Laundry takes the route upward: pause in an air stream, drift onto a cloud ledge, and gather the stripes above the marked Z clouds.

Z clouds send Teddy into a tiny nap and use one try. The status shows the tries left. After three naps, **Try this road again** resumes the current chapter with three fresh tries. **Restart** starts the whole adventure again. F5 and F6 also provide the engine's save and load screens.

The **More Game-Maker games** section accepts another DOS game folder with a `.GAM` file and plays it through the same engine. Files stay in the browser.

## Rebuild the DOS game

```sh
npm run build:game
npm run check:game
npm run check:browser
npm run check
npm run build
npm run check:release
```

`build:game` reads the GameMaker sibling checkout (`../GameMaker`) for the format helpers, Teddy art, and the measured CitiCar drawing. It writes the playable DOS files to `public/game/`. The built files are committed, so running the web app does not need the sibling checkout. `check:game` uses the headless Game-Maker engine to confirm that walking cannot bypass the later car doors and that timed hops can complete all chapters.

The builder lives in `scripts/build-game.ts`. `scripts/chapters.ts` constructs the later stripe trails, `scripts/sky-laundry.ts` draws the cloud crossing and its nap clouds, `scripts/scenery.ts` removes the source maps' unrelated interactions, `scripts/cartoons.ts` renders the intro, drive, win, and try-again animations, and `scripts/music.ts` composes the chapter and ending themes. See [NOTICE.md](NOTICE.md) for credits.

`assets/gwinn-door.voc`, `assets/teddy-bark.voc`, and `assets/teddy-yawn.voc` are short edits of Lewis Moten's recordings. Gwinn cheers when Teddy opens a car door, Teddy barks at balloon dogs, and his own yawn plays during a tiny nap.

## Inside Sky Laundry

- The air streams are two animated background blocks with upward gravity. Their arrows move while both animation frames keep the same pull.
- Cloud ledges are solid only on top. Teddy can rise through them from below, then settle on them from above. The route uses three different crossing heights.
- Marked Z clouds start Teddy's sleep animation. Game-Maker stores extra lives, so the builder gives him two extras and the page shows three total tries. After those tries, the page starts a fresh engine session at the same chapter's safe entrance.
- Each height gets stripe artwork over its own sky band. Touching a piece replaces it with that same background, so collecting it leaves a clean sky rather than a floating rectangle.

`check:browser` needs locally installed Google Chrome. It starts its own temporary Vite server on port 4175, checks layout and accessibility in portrait and landscape, plays all six chapters through the installed engine package, and checks the win ending. It stops its server afterwards. Add `-- --record` to save the successful run's DOS input recording to `assets/teddy-tour.rec`, `-- --demo` to verify the shipped recording, or `-- --retry` to deliberately lose three tries and verify the chapter checkpoint and recovery. Rebuild the DOS game after recording a new demonstration.

`check:release` builds into a temporary directory and previews it on port 4176. It uses only the page's public controls to watch the shipped demonstration, checks the mobile finale, then starts a new game. It reports missing assets or browser errors and removes its build and stops its server afterwards. Both browser commands use their own servers and leave the maintainer's port 5173 server alone.

# THE CHEZ: Stripe Chase

A Vite app with an original, eight-chapter RSD Game-Maker game. Teddy gathers fresh racing stripe pieces for Doc Leo's tomato-red CitiCar, then hands the controls to Doc Leo and Gwinn for their own errands. The game runs through `@lewismoten/gamemaker-sandbox-engine` in the browser.

## Run locally

```sh
npm install
npm run dev
```

Open the Vite URL and choose **Play as Teddy**. Move Teddy with the Left and Right arrows (or A and D); hop with Up or W; bark with Space. Gather the required stripe pieces across the yard, Maple Street, Puddlewick Park, Downtown, the Clown Club, Sky Laundry, and Gwinn’s Shortcut. These walking chapters end at THE CHEZ on the right; Teddy's Victory Lap then heads left toward home. F1 shows instructions. Touch buttons are below the game.

**Watch Teddy** plays a complete demonstration using a DOS `.REC` input recording through the same engine. Choose **Restart** to start your own game at any time. The recording stores keys and timing, not a video or a second implementation of the game.

Each course starts from an original map. The yard introduces real crates to hop over; Maple Street’s flying stripe kites call for hops, the park asks Teddy to pause in a tall air stream and ride over an otherwise impassable hedge, Doc Leo takes over Downtown with a rubber-chicken squeak, taller crate hops, a conveyor strip and a timed WAIT / GO crossing for Gwinn’s very important leaf, and the Clown Club has stepping stones over harmless foam trays. Miss a stone and follow a return lift back up; friendly balloon dogs share optional bonus pieces when Teddy barks. Its twelve visible course pieces cover the ten-piece quota without balloons. Sky Laundry takes the route upward: pause in an air stream, drift onto a cloud ledge, then jump its gaps above the marked Z clouds.

The fitted stripes pay off in **Teddy's Victory Lap**. Doc Leo drives while Teddy calls the corners from the passenger window. Hold Left to drive home, release it to coast to a stop, and use Right to reverse. Up bounces the car over the marked bumps; Space honks without stopping. Checkered flags count as cheers. This final road has no nap clouds.

Gwinn’s Shortcut changes to four-way walking: all four arrows move Gwinn, and Space also moves down. The touch buttons become Up and Down for the maze. Follow the pawprints toward the car, or explore the side nooks for spare stripes. Doc Leo uses Space to squeak his rubber chicken; Teddy barks on his walking roads; the victory lap keeps its driving controls.

Z clouds send Teddy into a tiny nap and use one try. The status shows the tries left. After three naps, **Try this road again** resumes the current chapter with three fresh tries. **Restart** starts the whole adventure again. The browser remembers the current road between visits: **Continue with Teddy** begins at its safe entrance with three fresh tries. Watching the demonstration keeps your own saved road. Winning or choosing Restart clears it. If browser storage is unavailable, the current session still keeps its checkpoint. F5 and F6 also provide the engine's save and load screens.

The **Music on/off** button controls music separately from barks and other effects. Its setting is remembered between visits.

The **More Game-Maker games** section accepts another DOS game folder with a `.GAM` file and plays it through the same engine. Files stay in the browser.

## Teddy’s road atlas and guidance

The game’s guidance strip gives each road a short mission. Near a locked exit, it names the pieces still needed and offers a relevant hint. Reaching the quota switches the hint to the destination. The strip reads the engine’s counters, position, and opened gate; it does not change the rules or open a gate. The optional road atlas previews the eight errands with short character blurbs. `src/road-guide.ts` renders the atlas and formats the guidance from `src/chapters.ts`.

## Teddy’s glovebox notebook

The page’s optional notebook explains the counter gates, timed leaf crossing, bark exchanges, upward gravity and one-way cloud ledges, playable crew, recoverable foam trays, vehicle character, input recording, and music and cartoons. Each expandable entry names its source builder and links to actual downloadable DOS files. These are inspection examples; playing outside this page needs the complete `public/game/` folder. The notebook uses native HTML details controls and does not run a separate game simulation.

## Rebuild the DOS game

```sh
npm run build:art
npm run build:game
npm run check:game
npm run check:browser
npm run check:guidance
npm run check:music
npm run check
npm run build
npm run check:release
```

`build:game` reads the GameMaker sibling checkout (`../GameMaker`) for the format helpers, Teddy art, and the measured CitiCar drawing. It writes the playable DOS files to `public/game/`. The built files are committed, so running the web app does not need the sibling checkout. `check:game` uses the headless Game-Maker engine to verify the timed leaf crossing, counter gates, marked nap clouds, walking routes, cloud crossings, vehicle momentum, horn, and bounces. It also replays the shipped `.REC` through the complete built scene graph and requires a win without a nap.

The builder lives in `scripts/build-game.ts`. `scripts/chapters.ts` constructs the stripe trails, `scripts/course-obstacles.ts` builds the crates, hedge lift, and recoverable foam trays, `scripts/crew-characters.ts` adapts the playable cast and single-impulse jumps, `scripts/sky-laundry.ts` draws the cloud crossing and its nap clouds, `scripts/victory-lap.ts` builds the vehicle character and the leftward road, `scripts/course-scenery.ts` draws complete original houses, trees, tents, and laundry lines before tiling them into the native map, `scripts/cartoons.ts` renders the intro, drive, win, and try-again animations, and `scripts/music.ts` composes the chapter and ending themes. See [NOTICE.md](NOTICE.md) for credits.

`assets/gwinn-door.voc`, `assets/teddy-bark.voc`, and `assets/teddy-yawn.voc` are short edits of Lewis Moten's recordings. Gwinn cheers when Teddy opens a car door, Teddy barks at balloon dogs, and his own yawn plays during a tiny nap.

## The stripes return

`scripts/stripe-car.ts` draws the measured CitiCar with only a few racing stripe fragments, then restores the full pattern during the final fitting cartoon. It compares two versions of the project’s own car drawing, changing only the stripe pixels while keeping the roof, door window, wheels, and lights. The car stays worn during the search, including the title, chapter cards, and landing-page art. The final fitting cartoon restores all the stripes, then puts Teddy in the passenger window before the victory lap.

`scripts/road-stories.ts` supplies seven connected, captioned jokes and their animated props: Doc Leo’s wildly optimistic speed claim, Gwinn’s suspicious leaf, Doc Leo’s turn at the controls, the leaf’s thank-you, friendly balloon dogs, Gwinn’s extraordinarily long shortcut, and fitting the last stripe. `scripts/cartoons.ts` stages the crew, restores the stripes, and drives into the next road. Each short FLI can be skipped with the engine’s normal keys.

## Inside Sky Laundry

- The air streams are two animated background blocks with upward gravity. Their arrows move while both animation frames keep the same pull.
- Cloud ledges are solid only on top. Teddy can rise through them from below, then settle on them from above. The route uses three different crossing heights.
- Marked Z clouds start Teddy's sleep animation. Game-Maker stores extra lives, so the builder gives him two extras and the page shows three total tries. After those tries, the page starts a fresh engine session at the same chapter's safe entrance.
- Each stripe gets artwork over its exact underlying tile. Touching a piece replaces it with that same background, so collecting it leaves a clean sky rather than a floating rectangle.

## Inside the wind kites

`scripts/wind-kites.ts` turns stripe pieces into native moving actors on a closed four-corner path above Maple Street. PLAYGAME measures these normal-path corners from the starting cell; the last corner returns to (0, 0) so each loop stays in the same patch of sky. Touching a kite collects it. Wind posts send replacements every 64 ticks, so barking away or missing the first batch cannot strand Teddy. Kites expire after 320 ticks to keep the population bounded. Seven ground pieces leave only one kite needed for the eight-piece quota.

## Inside the leaf crossing

`scripts/leaf-crossing.ts` builds Gwinn’s timed Downtown crossing from eighteen background block slots. Five barrier rows, a two-tile sign, and a leaf that swaps sides share a 54-tick WAIT / 54-tick GO cycle. The closed variants are solid; the open variants are passable. Labels, striped barriers, and directional chevrons explain the state without depending on color. Neither state hurts Teddy or costs a try. This uses PLAYGAME’s global block animation, including collision with the displayed variant, rather than a page timer.

## Inside Gwinn’s shortcut

`scripts/gwinn-maze.ts` builds a garden maze and a native four-way Gwinn character. All scenery has zero gravity; character frames move in fixed steps, so Up and Down walk instead of hopping. Three-cell corridors give room to turn, pawprints indicate the exit route, and side nooks hold spare stripes. The maze has no hazards or disappearing paths. `MAZE_ROUTE` describes a safe route for verification.

## Inside the victory ride

The vehicle is a new `.CHR` and `.CBL`, played by the same engine. Its steering frames add momentum instead of moving a fixed distance; the idle sequence lets that momentum decay. A bounce adds an upward impulse while keeping the horizontal momentum, and the horn sequence leaves the car rolling. The car sprite comes from the measured `chezPicture` drawing, reduced to the engine's 20-pixel actor width, with Teddy in the passenger window. The larger cartoons show the full car drawing.

The bounce has three protected ticks so a car stopped against a bump can rise before steering resumes. This avoids the engine's corner adjustment pushing the car down again while it is still too low to clear the bump.

Neutral spacer sequences also make steer-and-bounce inputs safe when both keys arrive in the same tick. They account for the original player's behavior when it resumes a sequence before that sequence's first frame has played.

`src/checkpoint.ts` stores only a validated road entrance in local browser storage, tied to the current chapter order. It never restores live engine objects, inventory, or a demonstration’s position.

`src/chapters.ts` supplies the page's names, goals, entrances, and control labels. The game check compares those values with the built DOS scene graph and gates, including the victory road's entrance on the right.

Every exit has one scene link, on its locked tile. The finish ribbon is checked from both sides so bouncing over it cannot bypass the cheer quota.

`check:browser` needs locally installed Google Chrome. It starts its own temporary Vite server on port 4175, checks layout and accessibility in portrait and landscape, plays all eight chapters through the installed engine package, and checks the win ending. It stops its server afterwards. Add `-- --record` to save the successful run's DOS input recording to `assets/teddy-tour.rec`, `-- --demo` to verify the shipped recording, `-- --lap` to check the vehicle chapter directly, or `-- --retry` to deliberately lose three tries and verify the saved chapter after a page reload, three fresh tries, recovery, and clearing the checkpoint on a win. Rebuild the DOS game after recording a new demonstration.

`check:guidance` uses its own temporary server on port 4177. It checks actor-specific hints, then uses public keyboard controls to pass Maple Street’s three crate barriers. It also checks that spending the native gate quota keeps the completed goal visible through the road transition.

`check:release` builds into a temporary directory and previews it on port 4176. It uses only the page's public controls to watch the shipped demonstration, checks the mobile finale, then starts a new game. It reports missing assets or browser errors and removes its build and stops its server afterwards. These browser commands use their own servers and leave the maintainer's port 5173 server alone.

`build:art` renders the landing page’s worn CitiCar using the measured drawing. `src/music-control.ts` remembers the music setting and controls the engine’s song playback independently of effects. `check:music` checks muted intros, chapter changes, resumed songs, persistent settings, and audible barks with its own server on port 4178.

All walking-course maps are built from a blank map. The source project supplies the cast, rather than level geometry or scenery fragments. Stripe variants preserve the particular background beneath each piece and restore it on collection.

Walking characters use a single jump impulse for each press, instead of repeating the source character’s upward step while held. Every obstacle uses native Game-Maker collision, gravity, or animation; the page does not run additional platforming rules. Both sides of each foam tray have a return lift. The course check verifies recovery in both directions, optional balloon rewards, Doc Leo’s independent squeak, and each playable character’s own block set.

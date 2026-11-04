# Game data and engine techniques

The bundled game exercises the npm engine using native Game-Maker files: maps, characters, background blocks, counters, timed blocks, scene links, music, sound, and animations. The page displays controls and guidance; the engine runs the game rules.

For controls, see [Playing the bundled game](playing.md). For rebuilding and checking the fixture, see [Development and verification](development.md).

## Speeds that change, and a speedometer that agrees

`scripts/hypo-car.ts` builds THE CHEZ as a native `.CHR` in three speeds. The steering frames are not momentum frames: each tick moves the car a fixed number of pixels (`PIXELS_PER_TICK`: 4, 5 or 6), so 20, 25 and 30 mph are exact in the engine. Releasing the key stops the car, which keeps play easy for slow hands. The speedometer is the top block (`pic1`) of every frame of the same character, drawn by `dial(mph)` in `scripts/hypo-art.ts`, so the number on screen is the number the file moves at. Moving the dial with the car means it needs no map blocks and works on a scrolling view.

A downhill or uphill stretch is a scene link on the crest block into a scene with the same map and the other speed's character file. `scripts/check-speed.ts` measures all three speeds in the headless simulation and proves a crest link fires. `check:game` repeats those checks on the shipped files. Phase 1 ships only the 25 mph car (Control Run is flat); the 30 and 20 mph cars are built and checked, ready for the hill levels.

## Stripes as a palette swap

`car()` in `scripts/hypo-art.ts` draws one picture of THE CHEZ with its stripes in three reserved palette slots (250 lower stripe, 251 upper stripe, 252 white pinstripe). `palette(stage)` fills those slots with the body red (bare car) or with charcoal and white, so each trial's `.PAL` is a real palette swap and no art is redrawn. `check:game` verifies that the four palettes differ only in those three slots.

## The turtle with a countdown

`scripts/hypo-street.ts` builds the Control Run crossing from twelve block variants per cell, advancing every nine ticks: six of WAIT (the turtle and an arm are solid, a sign's bar drains) and six of GO (all clear). PLAYGAME animates block ids globally, so the barrier, the turtle and the four sign blocks stay in phase. Neither state hurts the car.

## Teddy, four ways

`scripts/hypo-driveway.ts` gives Teddy a native four-way character: front, back and side poses, with left drawn by mirroring the side frames. Arrows (and A, D, W) walk and Space barks. The scenery has zero gravity. Two pickups add to extra counter 21; the garage door asks for both, spends them and opens. Its scene link sits on that door, so touching it is leaving.

## The shipped recording

`npm run record:demo` plays the built game headless with arrows only, never holding two keys, and saves `assets/teddy-tour.rec`. `check:game` replays it, requires a win without a nap, and requires the keys to stay among arrows, Space and Enter.

## Website state and guidance

`src/checkpoint.ts` stores only a validated level entrance in local browser storage, tied to the current level order. It never restores live engine objects or a demonstration's position.

`src/chapters.ts` supplies the page's names, goals, entrances and doors. The game check compares those values with the built DOS scene graph.

`src/music-control.ts` remembers the music setting and controls the engine's song playback independently of effects.

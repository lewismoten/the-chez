# Game data and engine techniques

The bundled game exercises the npm engine using native Game-Maker files: maps, characters, background blocks, inventory, counters, music, sound, and animations. The page displays controls and guidance; the engine runs the game rules.

For controls, see [Playing the bundled game](playing.md). For rebuilding and checking the fixture, see [Development and verification](development.md).

## Original maps and scenery

All walking-course maps are built from a blank map. The source project supplies the cast, rather than level geometry or scenery fragments. Stripe variants preserve the particular background beneath each piece and restore it on collection.

The courses use distinct sky colors and ground treatments. Sky Laundry keeps its complete hanging shirts above each cloud route; its builder adds platforms and air streams without clearing the backdrop.

## Walking and crew

Walking characters use a single jump impulse for each press, instead of repeating the source character’s upward step while held. Every obstacle uses native Game-Maker collision, gravity, or animation; the page does not run additional platforming rules. Both sides of each foam tray have a return lift. The course check verifies recovery in both directions, optional balloon rewards, Doc Leo’s independent squeak, and each playable character’s own block set.

## The stripes return

`scripts/stripe-car.ts` draws the measured CitiCar with only a few racing stripe fragments, then restores the full pattern during the final fitting cartoon. It compares two versions of the project’s own car drawing, changing only the stripe pixels while keeping the roof, door window, wheels, and lights. The car stays worn during the search, including the title, chapter cards, and landing-page art. The final fitting cartoon restores all the stripes, then puts Teddy in the passenger window before the victory lap.

`scripts/road-stories.ts` supplies eight connected, captioned jokes and their animated props: Doc Leo’s wildly optimistic speed claim, Gwinn’s suspicious leaf, Doc Leo’s turn at the controls, the leaf’s thank-you, friendly balloon dogs, Gwinn’s extraordinarily long shortcut, an umbrella with a flight plan, and fitting the last stripe. `scripts/cartoons.ts` stages the crew, restores the stripes, and drives into the next road. Each short FLI can be skipped with the engine’s normal keys.

## Sky Laundry

- The air streams are two animated background blocks with upward gravity. Their arrows move while both animation frames keep the same pull.
- Cloud ledges are solid only on top. Teddy can rise through them from below, then settle on them from above. The route uses three different crossing heights.
- Marked Z clouds start Teddy's sleep animation. Game-Maker stores extra lives, so the builder gives him two extras and the page shows three total tries. After those tries, the page starts a fresh engine session at the same chapter's safe entrance.
- Each stripe gets artwork over its exact underlying tile. Touching a piece replaces it with that same background, so collecting it leaves a clean sky rather than a floating rectangle.

## Wind kites

`scripts/wind-kites.ts` turns stripe pieces into native moving actors on a closed four-corner path above Maple Street. PLAYGAME measures these normal-path corners from the starting cell; the last corner returns to (0, 0) so each loop stays in the same patch of sky. Touching a kite collects it. Wind posts send replacements every 64 ticks, so barking away or missing the first batch cannot strand Teddy. Kites expire after 320 ticks to keep the population bounded. Seven ground pieces leave only one kite needed for the eight-piece quota.

## Park leaf errand

`scripts/park-errand.ts` builds a leftward upper branch, Gwinn’s leaf, a wooden leaf gate, and a return lift. `src/park-route.ts` shares the coordinates with the page; the native counter and door remain authoritative. The leaf uses extra counter 20, independently of the park’s stripe counter 23. The return lift lets a player who crosses the hedge too early come back for it.

## Leaf crossing

`scripts/leaf-crossing.ts` builds Gwinn’s timed Downtown crossing from eighteen background block slots. Five barrier rows, a two-tile sign, and a leaf that swaps sides share a 54-tick WAIT / 54-tick GO cycle. The closed variants are solid; the open variants are passable. Labels, striped barriers, and directional chevrons explain the state without depending on color. Neither state hurts Teddy or costs a try. This uses PLAYGAME’s global block animation, including collision with the displayed variant, rather than a page timer.

## Gwinn’s shortcut

`scripts/gwinn-maze.ts` builds a garden maze and a native four-way Gwinn character. All scenery has zero gravity; character frames move in fixed steps, so Up and Down walk instead of hopping. Three-cell corridors give room to turn, pawprints indicate the exit route, and side nooks hold spare stripes. The maze has no hazards or disappearing paths. `MAZE_ROUTE` describes a safe route for verification.

## Umbrella Weather

`scripts/umbrella-weather.ts` builds Teddy’s inventory-gated umbrella flight. Space takes the marked umbrella; its native object ID enables the Up/W movement sequences. Releasing Up lets air friction slow the ascent while the walking or idle frames add a gentle downward drift. Three rain curtains have high, low, and high openings, with a safe floor throughout. `src/umbrella-route.ts` shares the pickup and opening coordinates. The carried umbrella picture is retained in the following road’s block set.

## Victory ride

The vehicle is a new `.CHR` and `.CBL`, played by the same engine. Its steering frames add momentum instead of moving a fixed distance; the idle sequence lets that momentum decay. A bounce adds an upward impulse while keeping the horizontal momentum, and the horn sequence leaves the car rolling. The car sprite comes from the measured `chezPicture` drawing, reduced to the engine's 20-pixel actor width, with Teddy in the passenger window. The larger cartoons show the full car drawing.

The bounce has three protected ticks so a car stopped against a bump can rise before steering resumes. This avoids the engine's corner adjustment pushing the car down again while it is still too low to clear the bump.

Neutral spacer sequences also make steer-and-bounce inputs safe when both keys arrive in the same tick. They account for the original player's behavior when it resumes a sequence before that sequence's first frame has played.

## Native instruction cards

Every native chapter card states its collection target, including ten cheer flags for the victory lap. The first road has its own card teaching the crate hop and ten-piece goal. The opening and park instructions stay up for four seconds and can be skipped with the engine’s normal keys. These instructions are DOS GIF/LST files played by the engine, so the standalone game carries its targets with it.

## Website state and guidance

`src/checkpoint.ts` stores only a validated road entrance in local browser storage, tied to the current chapter order. It never restores live engine objects, inventory, or a demonstration’s position.

`src/chapters.ts` supplies the page's names, goals, entrances, and control labels. The game check compares those values with the built DOS scene graph and gates, including the victory road's entrance on the right.

Every exit has one scene link, on its locked tile. The finish ribbon is checked from both sides so bouncing over it cannot bypass the cheer quota.

`src/music-control.ts` remembers the music setting and controls the engine’s song playback independently of effects.

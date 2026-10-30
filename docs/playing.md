# Playing the bundled game

Stripe Chase is the nine-chapter game fixture included with this engine verification project. Teddy gathers racing stripe pieces for Doc Leo’s tomato-red CitiCar, with help from Gwinn.

Start the application using the [setup instructions](../README.md), then choose **Play as Teddy**.

## Controls and chapters

Move Teddy with the Left and Right arrows (or A and D); hop with Up or W; bark with Space. Gather the required stripe pieces across the yard, Maple Street, Puddlewick Park, Downtown, the Clown Club, Sky Laundry, Gwinn’s Shortcut, and Umbrella Weather. These walking chapters end at THE CHEZ on the right; Teddy's Victory Lap then heads left toward home. F1 shows instructions. Touch buttons are below the game.

**Watch Teddy** plays a complete demonstration using a DOS `.REC` input recording through the same engine. Choose **Restart** to start your own game at any time. The recording stores keys and timing, not a video or a second implementation of the game.

Each course starts from an original map. The yard introduces real crates to hop over; Maple Street’s flying stripe kites call for hops, the park asks Teddy to ride into an upper branch, turn left for Gwinn’s leaf, and bring it right to a wooden gate, Doc Leo takes over Downtown with a rubber-chicken squeak, taller crate hops, a conveyor strip and a timed WAIT / GO crossing for Gwinn’s very important leaf, and the Clown Club has stepping stones over harmless foam trays. Miss a stone and follow a return lift back up; friendly balloon dogs share optional bonus pieces when Teddy barks. Its twelve visible course pieces cover the ten-piece quota without balloons. Sky Laundry takes the route upward: pause in an air stream, drift onto a cloud ledge, then jump its gaps above the marked Z clouds.

The fitted stripes pay off in **Teddy's Victory Lap**. Doc Leo drives while Teddy calls the corners from the passenger window. Hold Left to drive home, release it to coast to a stop, and use Right to reverse. Up bounces the car over the marked bumps; Space honks without stopping. Checkered flags count as cheers. This final road has no nap clouds.

Gwinn’s Shortcut changes to four-way walking: all four arrows move Gwinn, and Space also moves down. The touch buttons become Up and Down for the maze. Follow the pawprints toward the car, or explore the side nooks for spare stripes. Doc Leo uses Space to squeak his rubber chicken; Teddy barks on his walking roads; the victory lap keeps its driving controls.

Z clouds send Teddy into a tiny nap and use one try. The status shows the tries left. After three naps, **Try this road again** resumes the current chapter with three fresh tries. **Restart** starts the whole adventure again. The browser remembers the current road between visits: **Continue with Teddy** begins at its safe entrance with three fresh tries. Watching the demonstration keeps your own saved road. Winning or choosing Restart clears it. If browser storage is unavailable, the current session still keeps its checkpoint. F5 and F6 also provide the engine's save and load screens.

The **Music on/off** button controls music separately from barks and other effects. Its setting is remembered between visits.

The **More Game-Maker games** section accepts another DOS game folder with a `.GAM` file and plays it through the same engine. Files stay in the browser.

Umbrella Weather asks Teddy to take the marked umbrella with Space, hold Up/W to open it and float upward, then release it to fold it away and sink. Left/Right steer; the rain curtains have high, low, and high openings. The safe floor allows another approach after a missed opening.

## Road atlas and guidance

The game’s guidance strip gives each road a short mission. Near a locked exit, it names the pieces still needed and offers a relevant hint. Reaching the quota switches the hint to the destination. The strip reads the engine’s counters, position, and opened gate; it does not change the rules or open a gate. The optional road atlas previews the nine errands with short character blurbs. `src/road-guide.ts` renders the atlas and formats the guidance from `src/chapters.ts`.

## Glovebox notebook

The page’s optional notebook explains the counter gates, timed leaf crossing, bark exchanges, upward gravity and one-way cloud ledges, playable crew, recoverable foam trays, vehicle character, input recording, and music and cartoons. Each expandable entry names its source builder and links to actual downloadable DOS files. These are inspection examples; playing outside this page needs the complete `public/game/` folder. The notebook uses native HTML details controls and does not run a separate game simulation.

## Game archives

**Download Stripe Chase (.ZIP)** saves the complete native game in one file, with instructions, license, and credits. The bundled game loads that same ZIP through the archive package. Under **More Game-Maker games**, choose a folder, a ZIP, or a ZIP-based self-extracting EXE, then **Play selected game**. Files are unpacked locally in the browser. Ordinary executables are not game archives.

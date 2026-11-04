# Playing the bundled game

The Stripe Hypothesis is the game fixture included with this engine verification project. Doc Leo, PhD, swears racing stripes make THE CHEZ go faster. Teddy rides along with a clipboard. So far there are three levels; later trials add one stripe at a time.

Start the application using the [setup instructions](../README.md), then choose **Play as Teddy**.

## Controls and levels

Arrows carry the whole game: the four arrows walk Teddy in the driveway, Right drives THE CHEZ, and Space barks (or honks). A and D also work for left and right. F1 shows instructions. Touch buttons are below the game.

1. **The Hypothesis.** Teddy walks the driveway four ways. Fetch Doc Leo's clipboard (by the left lawn) and the stopwatch (on the right), then walk into the garage door. The door stays shut until both are in, and opens as soon as Teddy touches it.
2. **Control Run.** THE CHEZ has no stripes. Hold Right to drive at 25 mph; the speedometer riding above the car reads 25. Halfway along, a turtle crosses. The sign counts down WAIT, then GO, and its bar drains so you can see how long is left. Holding Right is safe, since the barrier simply holds the car until it opens. Drive through the checkered finish.
3. **Gwinn and the Tape.** A hedge maze at dusk. Gwinn has the stripe tape and sits on it at a dead end. Walk the corridors with the arrows, touch the tape roll, then walk into the garage door on the far side. After it, a short cartoon puts the first stripe on: a squeegee, the paint dries, Gwinn sniffs it.
4. **Trial 1: Uphill** (and **Downhill**). The first stripe is on. The road climbs a real hill at 20 mph, with the speedometer reading 20. At the crest a short card appears and the car changes to 30 mph on the same hill, now going down; press Right again to roll. The page's speed reading follows the car. Reversing is off on the slope. Drive to the finish at the bottom.

After the control run, a results cartoon reads **TOP SPEED: 25 MPH. INCONCLUSIVE.** After the hill, the last card reads **TOP SPEED: 30 MPH. INCONCLUSIVE. IT WAS A HILL.** Teddy is not convinced.

**Watch Teddy** plays a complete demonstration using a DOS `.REC` input recording through the same engine. It holds one key at a time, which is also how a slow, steady player can win. Choose **Restart** to start your own game at any time.

Missing a try is not part of these levels; the status line still shows the tries the engine keeps (three). **Continue with Teddy** begins at the last level's safe entrance. F5 and F6 provide the engine's save and load screens.

The **Music on/off** button controls music separately from barks and other effects. Its setting is remembered between visits.

The **More Game-Maker games** section accepts another DOS game folder with a `.GAM` file and plays it through the same engine. Files stay in the browser.

## The experiment log and guidance

The strip under the game gives each level a short mission. Near the garage door it names what is still missing. The strip reads the engine's counters and position; it does not change the rules or open a door. The optional log lists the levels with short blurbs (`src/road-guide.ts`, from `src/chapters.ts`).

## Lab notebook

The page's notebook explains how the speedometer, the palette-swapped stripes, the turtle countdown, four-way Teddy and the recorded demonstration work. Each expandable entry names its source builder and links to actual downloadable DOS files.

## Game archives

**Download The Stripe Hypothesis (.ZIP)** saves the complete native game in one file, with instructions, license, and credits. The bundled game loads that same ZIP through the archive package. Under **More Game-Maker games**, choose a folder, a ZIP, or a ZIP-based self-extracting EXE, then **Play selected game**. Files are unpacked locally in the browser. Ordinary executables are not game archives.

# THE CHEZ: Stripe Chase

A Vite app with an original, three-chapter RSD Game-Maker game. Teddy gathers fresh racing stripe pieces for Doc Leo's tomato-red CitiCar, while Gwinn cheers the crew on. The game runs through `@lewismoten/gamemaker-sandbox-engine` in the browser.

## Run locally

```sh
npm install
npm run dev
```

Open the Vite URL and choose **Start the game**. Move Teddy with the Left and Right arrows (or A and D); hop with Up or W. Gather the required stripe pieces in the yard, street, and park, then reach THE CHEZ at the right end of each chapter. F1 shows instructions. Touch buttons are below the game.

The **More Game-Maker games** section accepts another DOS game folder with a `.GAM` file and plays it through the same engine. Files stay in the browser.

## Rebuild the DOS game

```sh
npm run build:game
npm run check:game
npm run check
npm run build
```

`build:game` reads the GameMaker sibling checkout (`../GameMaker`) for the format helpers, Teddy art, and the measured CitiCar drawing. It writes the playable DOS files to `public/game/`. The built files are committed, so running the web app does not need the sibling checkout. `check:game` uses the headless Game-Maker engine to confirm that walking cannot bypass the later car doors and that timed hops can complete all chapters.

The builder lives in `scripts/build-game.ts`. `scripts/chapters.ts` constructs the later stripe trails, `scripts/cartoons.ts` renders the intro, drive, and win animations, and `scripts/music.ts` composes the chapter themes. See [NOTICE.md](NOTICE.md) for credits.

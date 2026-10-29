# THE CHEZ: Stripe Chase

A Vite app with an original, one-level RSD Game-Maker game. Teddy gathers ten pieces of fresh racing stripe for Doc Leo's tomato-red CitiCar, while Gwinn cheers the crew on. The game runs through `@lewismoten/gamemaker-sandbox-engine` in the browser.

## Run locally

```sh
npm install
npm run dev
```

Open the Vite URL and choose **Start the game**. Move Teddy with the Left and Right arrows (or A and D); hop with Up or W. Gather ten stripe pieces and reach THE CHEZ at the right end of the road. F1 shows instructions. Touch buttons are below the game.

The **More Game-Maker games** section accepts another DOS game folder with a `.GAM` file and plays it through the same engine. Files stay in the browser.

## Rebuild the DOS game

```sh
npm run build:game
npm run check
npm run build
```

`build:game` reads the GameMaker sibling checkout (`../GameMaker`) for the format helpers, Teddy art, and the measured CitiCar drawing. It writes the playable DOS files to `public/game/`. The built files are committed, so running the web app does not need the sibling checkout. See [NOTICE.md](NOTICE.md) for credits.

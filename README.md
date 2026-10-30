# the-chez

A Vite + TypeScript application for testing and verifying that `@lewismoten/gamemaker-sandbox-engine` can be installed from npm and run from a separate project.

The bundled Stripe Chase game provides sample data for exercising the engine.

## Setup

Requires Node.js 22.12 or newer.

```sh
npm install
npm run dev
```

Open the URL printed by Vite. Choose **Play as Teddy** to play the sample game or **Watch Teddy** to run its demonstration.

The game data is committed to this repository. Running the application does not require a GameMaker source checkout.

## Production build

```sh
npm run build
npm run preview
```

## Documentation

- [Development and verification](docs/development.md)
- [Playing the bundled game](docs/playing.md)
- [Game data and engine techniques](docs/engine-techniques.md)
- [Credits and notices](NOTICE.md)

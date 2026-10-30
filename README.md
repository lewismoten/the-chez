# the-chez

A standalone Vite + TypeScript application that tests whether `@lewismoten/gamemaker-sandbox-engine` can be installed from npm and run in a separate project.

The bundled Stripe Chase game is sample content for verifying the engine integration. It downloads as one ZIP and is unpacked by `@lewismoten/gamemaker-sandbox-archives`.

## Setup

Requires Node.js 22.12 or newer and the archive package release (see [development setup](docs/development.md#archive-package-release) for the pre-release candidate).

```sh
npm ci --omit=dev
npm run dev
```

Open the URL printed by Vite. This installs the browser application and uses the included game data. See [development](docs/development.md) to install the tools for rebuilding the sample game.

To build and preview the production application:

```sh
npm run build
npm run preview
```

## Documentation

- [Development and verification](docs/development.md)
- [Playing the sample game](docs/playing.md)
- [Game data and engine techniques](docs/engine-techniques.md)
- [Credits and notices](NOTICE.md)

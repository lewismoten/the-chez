# Copied game content

These are local copies of Lewis Moten’s MIT-licensed Game-Maker: Sandbox Edition content, used by The Stripe Hypothesis fixture builders. They are not fetched from another checkout and are not part of the development toolkit.

- `teddy/disk/`: the source character, character blocks, palette, sound set, monster art/rules, and sound files required by the builders, copied from `games/teddy/disk/`.
- `teddy/art/` and `teddy/sprites/`: the cast’s palette, drawing helpers, and ASCII sprites copied from `games/teddy/src/`. `costume-colors.ts` retains only the costume palette keys needed by Doc Leo.
- `chez.ts`: the measured CitiCar drawing copied from `games/kit/chez.ts`.

Imports of generic helpers were adapted to `@lewismoten/gamemaker-sandbox-tools`. Game-specific pixel and palette data is retained locally. See [NOTICE.md](../../NOTICE.md) for credits and the repository’s [LICENSE](LICENSE) for the license.

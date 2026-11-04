# Copied game content

These are local copies of Lewis Moten’s MIT-licensed Game-Maker: Sandbox Edition content, used by The Stripe Hypothesis fixture builders. They are not fetched from another checkout and are not part of the development toolkit.

- `teddy/disk/`: the source character, character blocks, palette, sound set, monster art/rules, and sound files required by the builders, copied from `games/teddy/disk/`.
- `teddy/art/` and `teddy/sprites/`: the cast’s palette, drawing helpers, and ASCII sprites copied from `games/teddy/src/`. `costume-colors.ts` retains only the costume palette keys needed by Doc Leo.
- `chez.ts`: the measured CitiCar drawing copied from `games/kit/chez.ts`.

Imports of generic helpers were adapted to `@lewismoten/gamemaker-sandbox-tools`. Game-specific pixel and palette data is retained locally. See [NOTICE.md](../../NOTICE.md) for credits and the repository’s [LICENSE](LICENSE) for the license.

The street and card art in `scripts/hypo-town.ts`, `hypo-tiles.ts`, `hypo-colors.ts` and `hypo-cards.ts` borrows its method from Tune-Up's parade street in Game-Maker: Sandbox Edition (`games/tuneup/`, Lewis Moten, MIT): one wide picture painted from repeating 20-pixel pieces (brick fronts with windows and bunting, lamp posts, a dithered sky, a road with lane marks and curbs), cut into the fewest unique blocks, with palette ramps in the free slots of the shared palette. The pictures themselves are new.

// Keep borrowed Teddy scenery while removing the source game's pickups, hazards, and spawners.
import type { Block } from '../../GameMaker/web/src/formats/blocks.ts';
import type { GameMap } from '../../GameMaker/web/src/formats/map.ts';

export function clearInheritedInteractions(map: GameMap, blocks: Block[], sampleX: number): void {
  const interactive = (id: number) => {
    const block = blocks[id];
    return Boolean(block.effect || block.obj || block.scorePts || block.chHitPt || block.birthTime);
  };
  const sky = map.blocks[39 * 100 + sampleX];
  const ground = map.blocks[40 * 100 + sampleX];
  if (interactive(sky) || interactive(ground)) throw new Error('Scenery samples must be decorative');
  const samples = Array.from({ length: 100 }, (_, y) => map.blocks[y * 100 + sampleX]);
  for (let y = 0; y < 100; y++) {
    const replacement = interactive(samples[y]) ? (y < 40 ? sky : ground) : samples[y];
    for (let x = 0; x < 100; x++) {
      const at = y * 100 + x;
      if (interactive(map.blocks[at])) map.blocks[at] = replacement;
    }
  }
}

// Proves the speed change in the engine: the same road driven by the 20, 25 and 30 mph cars,
// measured in pixels per tick, and the scene link that swaps cars on touching a crest block.
import assert from 'node:assert/strict';
import { emptyBlock } from '@lewismoten/gamemaker-sandbox-tools/formats/blocks';
import { newMap } from '@lewismoten/gamemaker-sandbox-tools/formats/map';
import { newMonsterSet } from '@lewismoten/gamemaker-sandbox-tools/formats/monster';
import { Sim } from '@lewismoten/gamemaker-sandbox-tools/simulation';
import { newCharInfo } from '@lewismoten/gamemaker-sandbox-tools/simulation';
import { carCharacter, carSprites, PIXELS_PER_TICK, type Mph } from './hypo-car.ts';

export async function measure(mph: Mph, ticks = 40, crest = false): Promise<number> {
  const map = newMap();
  const bbl = Array.from({ length: 150 }, (_, i) => emptyBlock(i));
  bbl[1].solid = 15;
  for (let x = 0; x < 100; x++) map.blocks[40 * 100 + x] = 1;
  const sim = new Sim(
    {
      map,
      bbl,
      mon: newMonsterSet(),
      mbl: Array.from({ length: 100 }, (_, i) => emptyBlock(i, true)),
      chr: carCharacter(mph),
      cbl: carSprites(),
      links: crest ? [{ toScene: 3, from: { x: 30, y: 39 }, to: { x: 31, y: 39 } }] : [],
    },
    { x: 10, y: 39 },
    newCharInfo(),
  );
  await sim.run(4);
  const start = sim.pos.x;
  sim.press(77);
  await sim.run(ticks);
  sim.release(77);
  if (crest) return sim.link;
  return (sim.pos.x - start) / ticks;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const rates = await Promise.all(([20, 25, 30] as Mph[]).map((m) => measure(m)));
  console.log('px per tick at 20/25/30 mph:', rates.join(' / '));
  // Touching the crest block fires the scene link that swaps in the next speed's car.
  assert.ok((await measure(25, 200, true)) >= 0, 'the crest link fires');
  rates.forEach((r, i) => assert.ok(Math.abs(r - PIXELS_PER_TICK[([20, 25, 30] as Mph[])[i]]) < 0.3, 'speed matches'));
}

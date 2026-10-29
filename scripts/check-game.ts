// Play the built stripe trail in the headless Game-Maker engine to catch unreachable exits.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseBlocks } from '../../GameMaker/web/src/formats/blocks.ts';
import { parseCharacter } from '../../GameMaker/web/src/formats/character.ts';
import { parseGame } from '../../GameMaker/web/src/formats/game.ts';
import { fliFaults } from '../../GameMaker/web/src/formats/fliLimits.ts';
import { parseMap } from '../../GameMaker/web/src/formats/map.ts';
import { parseMonsters } from '../../GameMaker/web/src/formats/monster.ts';
import { newCharInfo } from '../../GameMaker/web/src/engine/world.ts';
import { Sim } from '../../GameMaker/games/kit/sceneSim.ts';

const root = join(import.meta.dirname, '../public/game');
const bytes = (name: string) => new Uint8Array(readFileSync(join(root, name)));
const game = parseGame(bytes('stripe.gam'));
const ci = newCharInfo();
for (const name of ['intro.fli', 'drive.fli', 'drive2.fli', 'drive3.fli', 'drive4.fli', 'win.fli']) {
  assert.deepEqual(fliFaults(bytes(name)), [], `${name}: animation must fit the original DOS player`);
}

async function play(chapter: number, startX: number, hop: boolean, progress = newCharInfo()) {
  const scene = game.scenes[chapter];
  const sim = new Sim({
    map: parseMap(bytes(scene.files[1])),
    bbl: parseBlocks(bytes(scene.files[2]), 150),
    mon: parseMonsters(bytes(scene.files[3])),
    mbl: parseBlocks(bytes(scene.files[4]), 100),
    chr: parseCharacter(bytes(scene.files[5])),
    cbl: parseBlocks(bytes(scene.files[6]), 50),
    links: scene.links.slice(0, 2),
  }, { x: startX, y: 39 }, progress);
  const carX = scene.links[0].from.x;
  sim.press(77);
  await sim.run(800, (tick) => {
    if (hop && sim.pos.bx >= carX - 9) sim.release(72);
    if (hop && sim.pos.bx < carX - 9 && tick % 25 === 0) sim.press(72);
    if (hop && tick % 25 === 3) { sim.release(72); sim.release(77); sim.press(77); }
  });
  sim.release(77);
  if (hop && sim.link < 0 && sim.pos.bx > carX) {
    sim.press(75);
    await sim.run(200);
    sim.release(75);
  }
  return sim;
}

for (const [chapter, startX] of [[2, 10], [3, 8], [4, 8], [5, 8], [6, 8]]) {
  if (chapter > 2) {
    const walker = await play(chapter, startX, false);
    assert.equal(walker.link, -1, `${game.scenes[chapter].desc}: walking should leave the car door closed`);
  }
  const sim = await play(chapter, startX, chapter > 2, ci);
  assert.equal(sim.dead, false, `${game.scenes[chapter].desc}: Teddy must finish safely`);
  assert.ok(sim.link >= 0, `${game.scenes[chapter].desc}: stripe trail must lead to the next chapter`);
  console.log(`${game.scenes[chapter].desc}: passed in ${sim.ticks} ticks`);
}

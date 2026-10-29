// Play the built stripe trail in the headless Game-Maker engine to catch unreachable exits.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseBlocks } from '../../GameMaker/web/src/formats/blocks.ts';
import { parseCharacter } from '../../GameMaker/web/src/formats/character.ts';
import { parseGame } from '../../GameMaker/web/src/formats/game.ts';
import { fliFaults } from '../../GameMaker/web/src/formats/fliLimits.ts';
import { decodeVoc } from '../../GameMaker/web/src/formats/voc.ts';
import { parseMap } from '../../GameMaker/web/src/formats/map.ts';
import { parseMonsters } from '../../GameMaker/web/src/formats/monster.ts';
import { newCharInfo } from '../../GameMaker/web/src/engine/world.ts';
import { Sim } from '../../GameMaker/games/kit/sceneSim.ts';

const root = join(import.meta.dirname, '../public/game');
const bytes = (name: string) => new Uint8Array(readFileSync(join(root, name)));
const game = parseGame(bytes('stripe.gam'));
const ci = newCharInfo();
for (const [index, scene] of game.scenes.entries()) if (index >= 2) {
  const map = parseMap(bytes(scene.files[1]));
  const blocks = parseBlocks(bytes(scene.files[2]), 150);
  for (const id of map.blocks) {
    const block = blocks[id];
    assert.equal(block.obj || block.chHitPt || block.birthTime, 0, `${scene.desc}: no inherited pickups, hazards, or spawners`);
    assert.ok(block.effect === 0 || block.effect === 19 + index, `${scene.desc}: only its own stripe counter may be used`);
  }
}
for (const name of ['intro.fli', 'drive.fli', 'drive2.fli', 'drive3.fli', 'drive4.fli', 'win.fli', 'lost.fli']) {
  assert.deepEqual(fliFaults(bytes(name)), [], `${name}: animation must fit the original DOS player`);
}
const doorBark = decodeVoc(bytes('gate.voc'));
assert.ok(doorBark.samples.length / doorBark.sampleRate < 0.8, 'Gwinn bark must finish before the next scene starts');
const teddyBark = decodeVoc(bytes('woof.voc'));
assert.ok(teddyBark.samples.length / teddyBark.sampleRate < 0.8, 'Teddy bark must stay snappy during play');
for (const name of ['story.txt', 'help.txt', 'credits.txt']) {
  const lines = new TextDecoder().decode(bytes(name)).trimEnd().split(/\r?\n/);
  assert.ok(lines.length <= 16 && lines.every((line) => line.length <= 30), `${name}: text must fit the DOS screen`);
}

async function play(chapter: number, startX: number, hop: boolean, progress = newCharInfo(), tricks = { lift: false, push: false }, bark = false) {
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
  const barkTargets = [24, 43, 64, 70];
  let barkTarget = 0;
  let waitingToBark = false;
  let barkAt = -1;
  let noHopUntil = -1;
  sim.press(77);
  await sim.run(800, (tick) => {
    if (chapter === 4 && sim.pos.bx >= 44 && sim.pos.bx <= 46 && sim.w.ci.gravy < 0) tricks.lift = true;
    if (chapter === 5 && sim.pos.bx >= 28 && sim.pos.bx <= 34 && sim.w.ci.gravx > 0) tricks.push = true;
    if (chapter === 6 && bark) {
      if (barkTarget < barkTargets.length && !waitingToBark && barkAt < 0 && sim.pos.bx >= barkTargets[barkTarget] - 4) {
        sim.release(77);
        sim.release(72);
        waitingToBark = true;
      }
      if (waitingToBark && sim.pos.y >= 780) {
        noHopUntil = barkTargets[barkTarget] + 2;
        sim.press(57);
        barkAt = tick;
        waitingToBark = false;
        barkTarget++;
      }
      if (barkAt >= 0 && tick === barkAt + 2) sim.release(57);
      if (barkAt >= 0 && tick === barkAt + 12) { sim.press(77); barkAt = -1; }
    }
    if (hop && sim.pos.bx >= carX - 9) sim.release(72);
    if (hop && !waitingToBark && barkAt < 0 && sim.pos.bx >= noHopUntil && sim.pos.bx < carX - 9 && tick % 25 === 0) sim.press(72);
    if (hop && !waitingToBark && barkAt < 0 && tick % 25 === 3) { sim.release(72); sim.release(77); sim.press(77); }
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
    const tricks = { lift: false, push: false };
    const walker = await play(chapter, startX, false, newCharInfo(), tricks);
    assert.equal(walker.link, -1, `${game.scenes[chapter].desc}: walking should leave the car door closed`);
    if (chapter === 4) assert.ok(tricks.lift, 'the park air puff must lift Teddy');
    if (chapter === 5) assert.ok(tricks.push, 'the Downtown arrows must push Teddy');
  }
  if (chapter === 6) {
    const silentScout = await play(chapter, startX, true);
    assert.equal(silentScout.link, -1, 'hopping alone must not earn every stripe in the finale');
  }
  const sim = await play(chapter, startX, chapter > 2, ci, { lift: false, push: false }, chapter === 6);
  assert.equal(sim.dead, false, `${game.scenes[chapter].desc}: Teddy must finish safely`);
  assert.ok(sim.link >= 0, `${game.scenes[chapter].desc}: stripe trail must lead to the next chapter`);
  console.log(`${game.scenes[chapter].desc}: passed in ${sim.ticks} ticks`);
}

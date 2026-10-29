// Play the built stripe trail in the headless Game-Maker engine to catch unreachable exits.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseBlocks } from '../../GameMaker/web/src/formats/blocks.ts';
import { parseCharacter } from '../../GameMaker/web/src/formats/character.ts';
import { parseGame } from '../../GameMaker/web/src/formats/game.ts';
import { parseFli } from '../../GameMaker/web/src/formats/fli.ts';
import { KITE, KITE_STARTS, KITE_POSTS, KITE_INTERVAL, KITE_LIFETIME } from './wind-kites.ts';
import { MAZE_ROUTE, MAZE_PIECES } from './gwinn-maze.ts';
import { ROAD_BEATS } from './road-stories.ts';
import { fliFaults } from '../../GameMaker/web/src/formats/fliLimits.ts';
import { decodeVoc } from '../../GameMaker/web/src/formats/voc.ts';
import { parseMap } from '../../GameMaker/web/src/formats/map.ts';
import { parseMonsters } from '../../GameMaker/web/src/formats/monster.ts';
import { newCharInfo } from '../../GameMaker/web/src/engine/world.ts';
import { Sim } from '../../GameMaker/games/kit/sceneSim.ts';
import { LEAF_CROSSING, LEAF_WAIT, LEAF_GO } from './leaf-crossing.ts';
import { NAP_COLUMNS } from './sky-laundry.ts';
import { CHAPTERS } from '../src/chapters.ts';
import { GameSim, readDisk } from '../../GameMaker/games/kit/gameSim.ts';
import { parseRecording } from '../../GameMaker/web/src/formats/recording.ts';

const root = join(import.meta.dirname, '../public/game');
const bytes = (name: string) => new Uint8Array(readFileSync(join(root, name)));
const game = parseGame(bytes('stripe.gam'));
const DRIVE_SCENE = CHAPTERS.findIndex((chapter) => chapter.mode === 'drive') + 2;
const MAZE_SCENE = CHAPTERS.findIndex((chapter) => chapter.mode === 'maze') + 2;
assert.equal(game.scenes.length, CHAPTERS.length + 2, 'the page must describe every playable chapter');
const ci = newCharInfo();
for (const [index, scene] of game.scenes.entries()) if (index >= 2) {
  assert.equal(scene.desc, CHAPTERS[index - 2].name, 'the HUD and DOS chapter names must match');
  const entrance = index === 2 ? game.scenes[0].links[0] : game.scenes[index - 1].links[0];
  assert.equal(entrance.toScene, index, 'the story route must visit chapters in order');
  assert.equal(entrance.to.x, CHAPTERS[index - 2].startX, 'the route and retry must use the same safe entrance');
  assert.equal(scene.links.filter((link) => link.toScene !== 65535).length, 1, 'no backup link may bypass a counter gate');
  const map = parseMap(bytes(scene.files[1]));
  const blocks = parseBlocks(bytes(scene.files[2]), 150);
  const gate = blocks[map.blocks[39 * 100 + CHAPTERS[index - 2].carX]];
  assert.equal(gate.eamt, -CHAPTERS[index - 2].required, `${scene.desc}: the HUD must show the real gate quota`);
  for (const [at, id] of map.blocks.entries()) {
    const block = blocks[id];
    const kitePost = scene.files[1] === 'street.map' && Math.floor(at / 100) === 38 && KITE_POSTS.includes(at % 100);
    assert.equal(block.obj, 0, `${scene.desc}: no inherited inventory objects`);
    assert.equal(block.birthTime, kitePost ? KITE_INTERVAL : 0, `${scene.desc}: only the marked wind posts may spawn actors`);
    if (kitePost) assert.equal(block.birthMon, KITE);
    const nap = scene.files[1] === 'sky.map' && Math.floor(at / 100) === 39 && NAP_COLUMNS.includes(at % 100);
    assert.equal(block.chHitPt, nap ? -1000 : 0, `${scene.desc}: only the marked nap clouds may cause a retry`);
    assert.ok(block.effect === 0 || block.effect === 19 + index, `${scene.desc}: only its own stripe counter may be used`);
  }
}
for (const name of ['intro.fli', 'drive.fli', 'drive2.fli', 'drive3.fli', 'drive4.fli', 'drive5.fli', 'drive6.fli', 'drive7.fli', 'win.fli', 'lost.fli']) {
  assert.deepEqual(fliFaults(bytes(name)), [], `${name}: animation must fit the original DOS player`);
}
assert.equal(ROAD_BEATS.length, CHAPTERS.length - 1, 'every road transition must have a connected story beat');
for (const beat of ROAD_BEATS) for (const line of beat.lines) {
  assert.ok(line.length <= 38, `Road caption must leave room at the screen edges: ${line}`);
}
for (const name of ['drive.fli', 'drive2.fli', 'drive3.fli', 'drive4.fli', 'drive5.fli', 'drive6.fli', 'drive7.fli']) {
  const movie = parseFli(bytes(name));
  const seconds = movie.frameCount * movie.speed / 70;
  assert.ok(seconds >= 4 && seconds <= 8, `${name}: give the story time to read while keeping road trips short`);
}
const doorBark = decodeVoc(bytes('gate.voc'));
assert.ok(doorBark.samples.length / doorBark.sampleRate < 0.8, 'Gwinn bark must finish before the next scene starts');
const teddyBark = decodeVoc(bytes('woof.voc'));
assert.ok(teddyBark.samples.length / teddyBark.sampleRate < 0.8, 'Teddy bark must stay snappy during play');
const teddyYawn = decodeVoc(bytes('yawn.voc'));
assert.ok(teddyYawn.samples.length / teddyYawn.sampleRate < 1.2, 'Teddy yawn must finish during the nap animation');
const horn = decodeVoc(bytes('meep.voc'));
assert.ok(horn.samples.length / horn.sampleRate < 0.5, 'the victory horn must stay brief');
assert.equal(parseCharacter(bytes('teddy.chr')).meter[1], 2, 'two extra lives must provide three total tries');
for (const name of ['story.txt', 'help.txt', 'credits.txt']) {
  const lines = new TextDecoder().decode(bytes(name)).trimEnd().split(/\r?\n/);
  assert.ok(lines.length <= 16 && lines.every((line) => line.length <= 30), `${name}: text must fit the DOS screen`);
}

function stage(chapter: number, startX: number, progress = newCharInfo()) {
  const scene = game.scenes[chapter];
  return new Sim({
    map: parseMap(bytes(scene.files[1])),
    bbl: parseBlocks(bytes(scene.files[2]), 150),
    mon: parseMonsters(bytes(scene.files[3])),
    mbl: parseBlocks(bytes(scene.files[4]), 100),
    chr: parseCharacter(bytes(scene.files[5])),
    cbl: parseBlocks(bytes(scene.files[6]), 50),
    links: [scene.links[0]],
  }, { x: startX, y: 39 }, progress);
}

async function play(chapter: number, startX: number, hop: boolean, progress = newCharInfo(), tricks = { lift: false, push: false }, bark = false) {
  const scene = game.scenes[chapter];
  const sim = stage(chapter, startX, progress);
  if (chapter === DRIVE_SCENE) {
    let next = 0, bounced = -1;
    sim.press(75);
    await sim.run(500, (tick) => {
      const ready = next === 0 ? sim.pos.bx === 66 && sim.pos.x % 20 === 0 && sim.w.ci.gravx === 0 : sim.pos.bx <= [66, 48, 28][next];
      if (hop && next < 3 && ready) { sim.press(72); bounced = tick; next++; }
      if (bounced >= 0 && tick === bounced + 2) { sim.release(72); bounced = -1; }
    });
    sim.release(75);
    return sim;
  }
  if (chapter === MAZE_SCENE && hop) {
    let target = 1, held = 0;
    sim.press(77); held = 77;
    await sim.run(1200, () => {
      const point = MAZE_ROUTE[target];
      if (!point) return;
      const dx = point.x * 20 - sim.pos.x, dy = point.y * 20 - sim.pos.y;
      if (!dx && !dy) { sim.release(held); held = 0; target++; return; }
      const scan = dx ? dx > 0 ? 77 : 75 : dy > 0 ? 57 : 72;
      if (scan !== held) { if (held) sim.release(held); sim.press(scan); held = scan; }
    });
    return sim;
  }
  const carX = scene.links[0].from.x;
  const barkTargets = [24, 43, 64, 70];
  let barkTarget = 0;
  let waitingToBark = false;
  let barkAt = -1;
  let noHopUntil = -1;
  const skyStops = [{ lift: 16, land: 20, row: 35 }, { lift: 36, land: 40, row: 33 }, { lift: 56, land: 60, row: 35 }];
  let skyStop = 0;
  let skyPhase = 'approach';
  sim.press(77);
  await sim.run(800, (tick) => {
    if (chapter === 7 && hop) {
      const stop = skyStops[skyStop];
      if (!stop) return;
      if (skyPhase === 'approach' && sim.pos.bx >= stop.lift) { sim.release(77); skyPhase = 'rise'; }
      if (skyPhase === 'rise' && sim.pos.y <= stop.row * 20 - 20) { sim.press(77); skyPhase = 'fly'; }
      if (skyPhase === 'fly' && sim.pos.bx >= stop.land) { sim.release(77); skyPhase = 'land'; }
      if (skyPhase === 'land' && sim.pos.y === stop.row * 20) { sim.press(77); skyStop++; skyPhase = 'approach'; }
      return;
    }
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

for (const [index, info] of CHAPTERS.entries()) {
  const chapter = index + 2, startX = info.startX;
  if (chapter > 2) {
    const tricks = { lift: false, push: false };
    const walker = await play(chapter, startX, false, newCharInfo(), tricks);
    assert.equal(walker.link, -1, `${game.scenes[chapter].desc}: walking should leave the car door closed`);
    if (chapter === 7) {
      assert.ok(walker.dead, 'walking into a marked nap cloud must trigger a retry');
      assert.ok(walker.sounds.includes(18), 'the nap must play Teddy’s yawn');
      assert.ok(!walker.sounds.includes(17), 'the nap must not play the source game’s hurt sound');
    }
    if (chapter === 4) assert.ok(tricks.lift, 'the park air puff must lift Teddy');
    if (chapter === 5) assert.ok(tricks.push, 'the Downtown arrows must push Teddy');
    if (chapter === DRIVE_SCENE) {
      walker.press(75);
      walker.press(72);
      await walker.run(2);
      walker.release(72);
      await walker.run(30);
      walker.release(75);
      assert.ok(walker.pos.x < 64 * 20, 'a stopped driver must be able to bounce over the first bump');
      assert.equal(walker.dead, false, 'a missed bounce must never cost a try');
    }
  }
  if (chapter === 6) {
    const silentScout = await play(chapter, startX, true);
    assert.equal(silentScout.link, -1, 'hopping alone must not earn every stripe in the finale');
  }
  const sim = await play(chapter, startX, chapter > 2, ci, { lift: false, push: false }, chapter === 6);
  assert.equal(sim.dead, false, `${game.scenes[chapter].desc}: Teddy must finish safely`);
  assert.ok(sim.link >= 0, `${game.scenes[chapter].desc}: stripe trail must lead to the next chapter`);
  assert.equal(sim.link, 0, `${game.scenes[chapter].desc}: the route must leave through the counter gate itself`);
  console.log(`${game.scenes[chapter].desc}: passed in ${sim.ticks} ticks`);
}

// Wait out the first batch: replacement posts must keep the kite challenge recoverable.
const patientScout = stage(3, 8);
let peakKites = 0;
await patientScout.run(KITE_LIFETIME + KITE_INTERVAL + 5, () => {
  const live = patientScout.w.mm.flatMap((actor, i) => actor.monnum === KITE ? [patientScout.w.mi[i]] : []);
  peakKites = Math.max(peakKites, live.length);
  for (const kite of live) {
    const x = kite.curx[0] * 20 + kite.curx[1], y = kite.cury[0] * 20 + kite.cury[1];
    assert.ok(x >= 15 * 20 && x <= 79 * 20, 'kite paths must stay near their wind posts');
    assert.ok(y >= 37 * 20 && y <= 38 * 20, 'flying kites must stay above a walking Teddy');
  }
});
assert.ok(peakKites <= KITE_STARTS.length + KITE_POSTS.length * (Math.ceil(KITE_LIFETIME / KITE_INTERVAL) + 1), 'kite lifetime must bound the population');
const replacements = patientScout.w.mm.flatMap((actor, i) => actor.monnum === KITE ? [patientScout.w.mi[i]] : []);
assert.ok(replacements.length > 0 && replacements.every((kite) => kite.birthTime > 1), 'fresh kites must remain after every initial kite expires');
assert.equal(patientScout.w.ci.meter[22], 1, 'waiting beneath kites must not collect them');
patientScout.press(77);
await patientScout.run(500);
patientScout.release(77);
assert.equal(patientScout.w.ci.meter[22], 8, 'walking must collect exactly seven ground pieces, leaving one kite needed');
assert.equal(patientScout.link, -1);
patientScout.press(75);
await patientScout.run(20);
patientScout.release(75);
assert.equal(patientScout.pos.bx, 77, 'Teddy can return to the nearest visible wind post');
await patientScout.run(250, (tick) => {
  if (patientScout.w.ci.meter[22] >= 9) { patientScout.release(72); return; }
  if (tick % 25 === 0) patientScout.press(72);
  if (tick % 25 === 3) patientScout.release(72);
});
assert.ok(patientScout.w.ci.meter[22] >= 9, 'hopping at a wind post must catch a replacement kite');
patientScout.release(72);
patientScout.press(77);
await patientScout.run(100);
assert.equal(patientScout.link, 0, 'Teddy must still finish after the first kite batch is gone');
assert.equal(patientScout.dead, false);
console.log('Wind kites: flight bounds, fresh replacements, and delayed safe completion passed');

// Check the actual animated collision variants, including approaching from the far side.
for (const direction of [1, -1]) {
  const crossing = stage(5, LEAF_CROSSING + (direction > 0 ? -1 : 1));
  const scan = direction > 0 ? 77 : 75;
  crossing.press(scan);
  crossing.press(72);
  await crossing.run(LEAF_WAIT - 2);
  assert.ok(direction > 0 ? crossing.pos.x <= (LEAF_CROSSING - 1) * 20 : crossing.pos.x >= (LEAF_CROSSING + 1) * 20, 'WAIT must block even a hopping Teddy from either side');
  const gateId = crossing.w.map[39 * 100 + LEAF_CROSSING];
  const signId = crossing.w.map[34 * 100 + LEAF_CROSSING - 1];
  assert.equal(crossing.w.bg[crossing.w.blkmap[gateId]].solid, 15);
  crossing.release(72);
  await crossing.run(24);
  assert.ok(direction > 0 ? crossing.pos.bx > LEAF_CROSSING : crossing.pos.bx < LEAF_CROSSING, 'holding a direction through WAIT must continue through GO');
  assert.equal(crossing.w.bg[crossing.w.blkmap[gateId]].solid, 0);
  assert.equal(crossing.w.bg[crossing.w.blkmap[signId]].ntime, LEAF_GO, 'GO sign and passable barrier must stay in phase');
  crossing.release(scan);
  await crossing.run(LEAF_GO);
  assert.equal(crossing.w.bg[crossing.w.blkmap[gateId]].solid, 15, 'the crossing must keep cycling after a touch');
  assert.equal(crossing.dead, false, 'waiting and crossing must not cost a try');
}
const closingCrossing = stage(5, LEAF_CROSSING - 1);
await closingCrossing.run(LEAF_WAIT + LEAF_GO - 2);
closingCrossing.press(77);
await closingCrossing.run(4);
closingCrossing.release(77);
assert.equal(closingCrossing.dead, false, 'a light changing during entry must not hurt Teddy');
await closingCrossing.run(LEAF_WAIT);
closingCrossing.press(77);
await closingCrossing.run(20);
assert.ok(closingCrossing.pos.bx > LEAF_CROSSING, 'Teddy must recover when the light changes during entry');
console.log('Gwinn’s leaf crossing: WAIT, GO, both directions, and repeated cycles passed');

const mazeMoves = stage(MAZE_SCENE, 8);
for (const scan of [77, 75, 72, 80, 57, 72]) {
  mazeMoves.press(scan); await mazeMoves.run(5); mazeMoves.release(scan);
}
assert.deepEqual([mazeMoves.pos.x, mazeMoves.pos.y], [8 * 20, 39 * 20], 'all four arrows and Space-down must make reversible moves');
await mazeMoves.run(20);
assert.deepEqual([mazeMoves.pos.x, mazeMoves.pos.y], [8 * 20, 39 * 20], 'the maze must have no gravity or momentum drift');
const accessible = new Set([39 * 100 + 8]), queue = [39 * 100 + 8];
for (let at = 0; at < queue.length; at++) for (const shift of [-1, 1, -100, 100]) {
  const next = queue[at] + shift;
  if (next < 0 || next >= 10000 || accessible.has(next)) continue;
  if (mazeMoves.w.bg[mazeMoves.w.map[next]].solid) continue;
  accessible.add(next); queue.push(next);
}
for (const [x,y] of MAZE_PIECES) assert.ok(accessible.has(y*100+x), 'every spare stripe nook must connect to the entrance');
const mazeGate = stage(MAZE_SCENE, 82);
mazeGate.press(77); await mazeGate.run(40);
assert.equal(mazeGate.link, -1, 'the maze car must reject an incomplete stripe quota');
mazeGate.w.ci.meter[19 + MAZE_SCENE] = 11;
await mazeGate.run(20);
assert.equal(mazeGate.link, 0);
console.log('Gwinn’s Shortcut: four-way controls, no drift, connected nooks, and the counter gate passed');

const vehicle = stage(DRIVE_SCENE, 84);
vehicle.press(75);
await vehicle.run(20);
assert.ok(84 * 20 - vehicle.pos.x > 180, 'the striped car must be faster than Teddy on foot');
vehicle.release(75);
const releasedAt = vehicle.pos.x;
await vehicle.run(20);
assert.ok(vehicle.pos.x < releasedAt, 'the vehicle must coast after release');
assert.equal(Math.abs(vehicle.w.ci.gravx), 0, 'releasing the direction must bring the vehicle to rest');
const backing = stage(DRIVE_SCENE, 70);
backing.press(77);
await backing.run(10);
assert.ok(backing.pos.x > 70 * 20, 'Right must back the car up');
assert.equal(backing.w.chr.sequences[backing.w.chr.cseq].frames[backing.w.chr.cframe].orient, 0, 'backing must preserve the passenger-side view');
const honker = stage(DRIVE_SCENE, 84);
honker.press(75);
await honker.run(20);
const beforeHonk = honker.pos.x;
honker.press(57);
await honker.run(6);
assert.ok(honker.sounds.includes(20), 'Space must play the new victory horn');
assert.ok(honker.pos.x < beforeHonk, 'honking must keep the car moving');

for (const [start, direction] of [[12, 75], [9, 77]]) {
  const finish = stage(DRIVE_SCENE, start);
  finish.press(direction);
  await finish.run(40);
  assert.equal(finish.link, -1, 'the finish ribbon must reject an empty cheer counter from either side');
  finish.w.ci.meter[19 + DRIVE_SCENE] = 11;
  await finish.run(40);
  assert.equal(finish.link, 0, 'ten cheers must open the finish ribbon from either side');
  assert.equal(finish.w.ci.meter[19 + DRIVE_SCENE], 1, 'the ribbon must use its ten cheers exactly once');
}

const tour = new GameSim(readDisk(root));
const events = parseRecording(bytes('tour.rec'));
let event = 0, due = events[0]?.delta ?? Infinity;
for (let tick = 1; tick <= 5000 && !tour.ended; tick++) {
  while (event < events.length && due <= tick) {
    const key = events[event].key;
    if (key & 0x80) tour.release(key & 0x7f); else tour.press(key);
    event++;
    due += events[event]?.delta ?? Infinity;
  }
  await tour.tick();
}
assert.equal(tour.ended, 'won', `the shipped tour must win; stopped in scene ${tour.scene} at ${JSON.stringify(tour.pos)}`);
assert.equal(tour.deaths, 0, 'the demonstration must finish without a nap');
assert.deepEqual(tour.trail, CHAPTERS.map((_, index) => index + 2), 'the demonstration must visit every chapter');
console.log('Shipped DOS recording: all chapters passed');

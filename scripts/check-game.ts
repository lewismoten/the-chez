// Verify the built game headless: scene graph, text and animation limits, the three speeds and their
// speedometers, the palette-swapped stripes, both levels' rules, and the shipped recording.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseBlocks } from '@lewismoten/gamemaker-sandbox-tools/formats/blocks';
import { parseCharacter } from '@lewismoten/gamemaker-sandbox-tools/formats/character';
import { parseGame } from '@lewismoten/gamemaker-sandbox-tools/formats/game';
import { parseFli } from '@lewismoten/gamemaker-sandbox-tools/formats/fli';
import { fliFaults } from '@lewismoten/gamemaker-sandbox-tools/formats/fliLimits';
import { decodeVoc } from '@lewismoten/gamemaker-sandbox-tools/formats/voc';
import { parseMap } from '@lewismoten/gamemaker-sandbox-tools/formats/map';
import { parseMonsters } from '@lewismoten/gamemaker-sandbox-tools/formats/monster';
import { parseRecording } from '@lewismoten/gamemaker-sandbox-tools/formats/recording';
import { GameSim, readDisk, Sim, newCharInfo } from '@lewismoten/gamemaker-sandbox-tools/simulation';
import { CHAPTERS } from '../src/chapters.ts';
import { ITEMS, DRIVEWAY } from './hypo-driveway.ts';
import { STREET, CROSS_STATES, CROSS_TICKS } from './hypo-street.ts';
import { carCharacter, PIXELS_PER_TICK, type Mph } from './hypo-car.ts';
import { dial, palette, SLOT } from './hypo-art.ts';
import { measure } from './check-speed.ts';
import { carRise, HILL } from './hypo-hill.ts';
import { TAPE } from './hypo-tape.ts';
import { TRICYCLE } from './hypo-tricycle.ts';
import { WIND } from './hypo-garage.ts';

const root = join(import.meta.dirname, '../public/game');
const bytes = (name: string) => new Uint8Array(readFileSync(join(root, name)));
const game = parseGame(bytes('hypo.gam'));

// Scene graph: the title, the end, then the levels in order, each with one link on its door.
assert.equal(game.scenes.length, CHAPTERS.length + 2, 'the page must describe every playable level');
for (const [index, scene] of game.scenes.entries()) {
  if (index < 2) continue;
  const chapter = CHAPTERS[index - 2];
  assert.equal(chapter.scene, index, `${chapter.name}: the page's scene number is the engine's`);
  assert.equal(scene.desc, chapter.name, 'the HUD and DOS level names must match');
  const entrance = index === 2 ? game.scenes[0].links[0] : game.scenes[index - 1].links[0];
  assert.equal(entrance.toScene, index, 'levels must be visited in order');
  assert.deepEqual(entrance.to, { x: chapter.startX, y: chapter.startY }, 'the route and the retry use the same safe entrance');
  assert.equal(scene.links.filter((link) => link.toScene !== 65535).length, 1, 'no backup link may bypass a door');
  assert.deepEqual(scene.links[0].from, { x: chapter.doorX, y: chapter.doorY }, `${chapter.name}: the link sits on the door`);
  const map = parseMap(bytes(scene.files[1]));
  const blocks = parseBlocks(bytes(scene.files[2]), 150);
  const door = blocks[map.blocks[chapter.doorY * 100 + chapter.doorX]];
  if (chapter.counter !== undefined) {
    assert.equal(door.eamt, -chapter.required, `${chapter.name}: the HUD shows the real door quota`);
    assert.equal(door.effect, chapter.counter);
    assert.equal(door.solid, 15, 'the garage door starts shut');
  }
  const pickups = map.blocks.reduce((n, id) => n + (blocks[id].effect === chapter.counter && blocks[id].eamt > 0 ? 1 : 0), 0);
  assert.equal(pickups, chapter.counter === undefined ? 0 : chapter.required, `${chapter.name}: exactly the quota's worth of pickups`);
  assert.ok(
    map.blocks.every((id) => blocks[id].birthTime === 0 && blocks[id].chHitPt === 0),
    `${chapter.name}: nothing spawns or hurts`,
  );
}

// Text and animation limits.
for (const name of ['story.txt', 'help.txt', 'credits.txt']) {
  const lines = new TextDecoder().decode(bytes(name)).trimEnd().split(/\r?\n/);
  assert.ok(lines.length <= 16 && lines.every((line) => line.length <= 30), `${name}: notice lines must be 30 characters or fewer`);
}
assert.ok(new TextDecoder().decode(bytes('credits.txt')).includes('Claude Sonnet 5.5'), 'the credits name the AI that wrote the game');
for (const name of ['intro.fli', 'garage.fli', 'results.fli', 'tric.fli', 'wind.fli', 'hill.fli']) {
  assert.deepEqual(fliFaults(bytes(name)), [], `${name}: animation must fit the original DOS player`);
  const movie = parseFli(bytes(name));
  const seconds = (movie.frameCount * movie.speed) / 70;
  assert.ok(seconds >= 1.5 && seconds <= 14, `${name}: ${seconds}s should be readable and skippable (a results cartoon includes the stripe cartoon)`);
}
for (const [name, limit] of [
  ['gate.voc', 0.8],
  ['woof.voc', 0.8],
  ['meep.voc', 0.5],
  ['ping.voc', 0.5],
] as const) {
  const clip = decodeVoc(bytes(name));
  assert.ok(clip.samples.length / clip.sampleRate < limit, `${name} must stay short`);
}
assert.equal(parseCharacter(bytes('teddy.chr')).meter[1], 2, 'two extra lives give three tries');

// The three speeds: pixels per tick in the engine, and the speedometer riding on the car shows the same number.
const sprites = parseBlocks(bytes('car.cbl'), 50);
const slots: Record<Mph, number> = { 20: 3, 25: 4, 30: 5 };
for (const mph of [20, 25, 30] as Mph[]) {
  const rate = await measure(mph);
  assert.ok(Math.abs(rate - PIXELS_PER_TICK[mph]) < 0.3, `the ${mph} mph car must move ${PIXELS_PER_TICK[mph]} px per tick, not ${rate}`);
  const frame = carCharacter(mph).sequences[5].frames[0];
  assert.equal(frame.pic1, slots[mph], `the ${mph} mph car carries the ${mph} dial`);
  assert.deepEqual(Array.from(sprites[slots[mph]].pixels), Array.from(dial(mph).px), `dial ${mph} reads ${mph}`);
}
assert.equal(PIXELS_PER_TICK[30] * 25, PIXELS_PER_TICK[25] * 30, '30 is exactly 6/5 of 25');
assert.equal(PIXELS_PER_TICK[20] * 25, PIXELS_PER_TICK[25] * 20, '20 is exactly 4/5 of 25');
const shipped = parseCharacter(bytes('car25.chr'));
assert.equal(shipped.sequences[5].frames[0].x, PIXELS_PER_TICK[25], 'Control Run ships the 25 mph car');
assert.ok((await measure(25, 200, true)) >= 0, 'the crest link fires');
for (const [file, mph, dy] of [
  ['car20.chr', 20, -1],
  ['car30.chr', 30, 1],
] as const) {
  const hill = parseCharacter(bytes(file));
  const frames = hill.sequences[5].frames.filter((f) => f.pic2 < 50);
  assert.ok(frames.length > 0 && frames.every((f) => f.x === PIXELS_PER_TICK[mph] && f.y === dy), `${file}: ${mph} mph, one pixel ${dy < 0 ? 'up' : 'down'} per tick`);
  assert.equal(frames[0].pic1, slots[mph], `${file} carries the ${mph} dial`);
  assert.equal(hill.sequences[7].frames.filter((f) => f.pic2 < 50).length, 0, `${file}: no reversing on a slope`);
}

// Stripes are a palette swap: the four trial palettes differ only in the three stripe slots.
const slotsUsed: number[] = Object.values(SLOT);
const base = palette(0);
for (const stage of [1, 2, 3] as const) {
  const swapped = palette(stage);
  for (let i = 0; i < 256; i++)
    if (!slotsUsed.includes(i))
      assert.deepEqual(swapped.slice(i * 3, i * 3 + 3), base.slice(i * 3, i * 3 + 3), `stage ${stage} must not recolor slot ${i}`);
  assert.notDeepEqual(swapped.slice(250 * 3, 253 * 3), base.slice(250 * 3, 253 * 3), `stage ${stage} must change the stripes`);
}
assert.deepEqual(Array.from(bytes('street.pal')), Array.from(base), 'Control Run has no stripes (the bare palette)');
assert.deepEqual(Array.from(bytes('hill.pal')), Array.from(palette(3)), 'the hill trial has all three stripes');

function stage(scene: number, x: number, y: number, progress = newCharInfo()) {
  const entry = game.scenes[scene];
  return new Sim(
    {
      map: parseMap(bytes(entry.files[1])),
      bbl: parseBlocks(bytes(entry.files[2]), 150),
      mon: parseMonsters(bytes(entry.files[3])),
      mbl: parseBlocks(bytes(entry.files[4]), 100),
      chr: parseCharacter(bytes(entry.files[5])),
      cbl: parseBlocks(bytes(entry.files[6]), 50),
      links: [entry.links[0]],
    },
    { x, y },
    progress,
  );
}

// Level 1: the garage door stays shut without both items, and each item counts once.
const shut = stage(2, DRIVEWAY.doorX, DRIVEWAY.doorY + 2);
shut.press(72);
await shut.run(60);
assert.equal(shut.link, -1, 'the garage must stay shut without the clipboard and the stopwatch');
for (const item of ITEMS) {
  const walker = stage(2, item.x, item.y + 2);
  walker.press(72);
  await walker.run(30);
  assert.equal(walker.w.ci.meter[DRIVEWAY.counter], 2, `touching the ${item.name} counts exactly one`);
}
const open = stage(2, DRIVEWAY.doorX, DRIVEWAY.doorY + 2);
open.w.ci.meter[DRIVEWAY.counter] = 1 + DRIVEWAY.required;
open.press(72);
await open.run(60);
assert.equal(open.link, 0, 'touching the garage with both items leaves the level at once');

// Level 3, the maze: the garage stays shut without the tape; the tape counts once; the door then opens.
const tapeShut = stage(4, TAPE.doorX, TAPE.doorY + 2);
tapeShut.press(72);
await tapeShut.run(60);
assert.equal(tapeShut.link, -1, 'the maze garage must stay shut without the tape');
const tapeWalker = stage(4, TAPE.tapeX, TAPE.tapeY + 2);
tapeWalker.press(72);
await tapeWalker.run(30);
assert.equal(tapeWalker.w.ci.meter[TAPE.counter], 2, 'touching the tape counts exactly one');
const tapeOpen = stage(4, TAPE.doorX, TAPE.doorY + 2);
tapeOpen.w.ci.meter[TAPE.counter] = 1 + TAPE.required;
tapeOpen.press(72);
await tapeOpen.run(60);
assert.equal(tapeOpen.link, 0, 'touching the garage with the tape leaves the level at once');

// Level 2: the crossing is a solid closed barrier, then a clear road, on a fixed cycle.
const road = stage(3, STREET.crossX - 6, STREET.row);
const closedAt = () => road.w.bg[road.w.blkmap[road.w.map[STREET.row * 100 + STREET.crossX]]].solid !== 0;
road.press(77);
let blockedAt = -1,
  passedAt = -1;
for (let tick = 0; tick < CROSS_STATES * CROSS_TICKS * 2 && road.link === -1; tick++) {
  await road.tick();
  if (blockedAt < 0 && road.pos.bx < STREET.crossX && closedAt() && road.pos.bx >= STREET.crossX - 2) blockedAt = tick;
  if (passedAt < 0 && road.pos.bx > STREET.crossX) passedAt = tick;
}
assert.ok(passedAt >= 0, 'holding Right must get the car past the turtle on its own');
assert.ok(blockedAt >= 0, 'the closed barrier must stop the car before it passes');
assert.ok(passedAt > blockedAt, 'the car passes only after the barrier opens');

// Level 4, the tricycle: hens stand in the road and hold the car back (no hurt) until Space honks; the honk is a
// wave fired ahead that sends the hen flapping; the rival's set pace is below the car's, so a patient player finishes.
{
  const entry = game.scenes[5];
  const mons = parseMonsters(bytes(entry.files[3]));
  const rider = mons.find((m) => m.used && m.end === -1 && m.towards === 0 && m.march[0][0].pic > 0 && m.power >= 100)!;
  assert.ok(rider.march[0][0].pic < PIXELS_PER_TICK[25], 'the tricycle is a little slower than the car');
  assert.ok(rider.march[0].every((c) => c.pic === 0 || c.pic === rider.march[0][0].pic), 'the tricycle holds one set pace');
  const hens = TRICYCLE.hens;
  const run = stage(5, TRICYCLE.startX, TRICYCLE.row);
  await run.run(4);
  const hp = run.w.ci.meter[0];
  run.press(77);
  let furthest = 0;
  for (let tick = 0; tick < 300 && run.link === -1; tick++) {
    await run.tick();
    furthest = Math.max(furthest, run.pos.x);
  }
  assert.equal(run.link, -1, 'holding Right alone must not get past the first hen');
  assert.ok(furthest < hens[0] * 20, `the first hen holds the car back (reached ${furthest})`);
  run.release(77);
  await run.tick();
  run.press(57);
  await run.tick();
  await run.tick();
  run.release(57);
  for (let k = 0; k < 12; k++) await run.tick();
  run.press(77);
  for (let tick = 0; tick < 60; tick++) await run.tick();
  assert.ok(run.pos.x > hens[0] * 20 + 20, 'a honk clears the hen and the car drives on');
  assert.equal(run.w.ci.meter[0], hp, 'a hen and a honk never hurt');
  // honking at every hen reaches the corner without a hurt
  let honks = 0;
  const hist: number[] = [];
  for (let tick = 0; tick < 900 && run.link === -1; tick++) {
    await run.tick();
    hist.push(run.pos.x);
    const last = hist.slice(-8);
    if (last.length === 8 && Math.max(...last) - Math.min(...last) <= 12) {
      honks++;
      run.release(77);
      await run.tick();
      run.press(57);
      await run.tick();
      await run.tick();
      run.release(57);
      for (let k = 0; k < 8; k++) await run.tick();
      run.press(77);
      hist.length = 0;
    }
  }
  assert.equal(run.link, 0, 'honking at each hen reaches the corner');
  assert.equal(honks, hens.length - 1, 'one honk for each of the other hens');
  assert.equal(run.w.ci.meter[0], hp, 'the whole race is free of hurt');
}

// Level 5, the Wind Tunnel: gravity pulls Teddy down; each fan's draft (two cells of "suck up" gravity) lifts him through
// the one-way bench above and drops him on it, whether he holds Right or stands still; the roll gates the door.
{
  const entry = game.scenes[6];
  assert.equal(entry.files[5], 'teddy-side.chr', 'the garage uses the side-walking Teddy');
  const chr = parseCharacter(bytes('teddy-side.chr'));
  assert.ok(chr.sequences[9].frames.every((f) => f.pic2 >= 50) && chr.sequences[11].frames.every((f) => f.pic2 >= 50), 'no walking up or down in the garage');
  const map = parseMap(bytes(entry.files[1]));
  const blocks = parseBlocks(bytes(entry.files[2]), 150);
  for (const [f, fan] of WIND.fans.entries()) {
    const aboveId = map.blocks[(fan.row - 1) * 100 + fan.x];
    const above = blocks[aboveId];
    assert.equal(above.grav & 1, 1, `fan ${f + 1}: the draft pulls up`);
    assert.notEqual(above.nextBl, aboveId, `fan ${f + 1}: the draft is animated`);
    assert.equal(blocks[map.blocks[fan.row * 100 + fan.x]].ntime > 0, true, `fan ${f + 1}: the grate turns`);
  }
  const benches = [67, 63, 59];
  const lift = async (x: number, y: number, row: number, hold: boolean) => {
    const walk = stage(6, x, y);
    await walk.run(4);
    if (hold) walk.press(77);
    let landed = false;
    for (let tick = 0; tick < 120 && !landed; tick++) {
      await walk.tick();
      landed = tick > 10 && walk.pos.y === (row - 1) * 20 && walk.w.ci.gravy === 0;
    }
    assert.ok(landed, `from (${x},${y}) ${hold ? 'holding Right' : 'standing still'} the draft puts Teddy on the bench at row ${row}`);
  };
  for (const [f, fan] of WIND.fans.entries()) {
    const row = f === 0 ? WIND.startY : benches[f - 1] - 1;
    await lift(fan.x + 1, row, benches[f], false);
    await lift(fan.x - 1, row, benches[f], true);
  }
  const floor = stage(6, WIND.startX, WIND.startY);
  await floor.run(4);
  floor.press(77);
  for (let tick = 0; tick < 700 && floor.link === -1; tick++) await floor.tick();
  assert.equal(floor.link, 0, 'holding Right alone climbs all three benches, fetches the roll and leaves by the door');
  const doorShut = stage(6, WIND.doorX - 2, WIND.doorY);
  doorShut.press(77);
  await doorShut.run(120);
  assert.equal(doorShut.link, -1, 'the door stays shut without the roll');
}

// Levels 3 and 4: the 20 mph climb stays on the road's line, the crest link swaps in the 30 mph car at the top
// (same map, new character file), the downhill stays on the line, and the finish link ends the game.
assert.equal(game.scenes[7].files[1], game.scenes[8].files[1], 'both halves of the hill share one map');
assert.notEqual(game.scenes[7].files[5], game.scenes[8].files[5], 'the crest swaps the car');
for (const [scene, startX, startY, expect] of [
  [7, HILL.startX, HILL.startY, 7],
  [8, HILL.crestX, HILL.crestY, 8],
] as const) {
  const run = stage(scene, startX, startY);
  await run.run(4);
  const speedAt = scene === 7 ? 4 : 6;
  run.press(77);
  let ticks = 0;
  while (run.link === -1 && ticks < 400) {
    await run.tick();
    ticks++;
    assert.equal(run.pos.y, 20 * HILL.startY - carRise(run.pos.x), `the car stays on the road's line at x=${run.pos.x}`);
  }
  assert.equal(run.link, 0, `scene ${expect}: holding Right reaches the link`);
  assert.ok(Math.abs(ticks * speedAt - (scene === 7 ? 640 : 960)) <= 40, `scene ${expect}: ${ticks} ticks at ${speedAt} px`);
}

// The shipped recording wins without a nap, visits both levels and uses one arrow at a time.
const tour = new GameSim(readDisk(root));
const events = parseRecording(bytes('tour.rec'));
const allowed = new Set([72, 75, 77, 80, 57, 28]);
const held = new Set<number>();
let event = 0,
  due = events[0]?.delta ?? Infinity;
for (let tick = 1; tick <= 9000 && !tour.ended; tick++) {
  while (event < events.length && due <= tick) {
    const key = events[event].key;
    assert.ok(allowed.has(key & 0x7f), `the recording must use arrows, Space and Enter only (key ${key & 0x7f})`);
    if (key & 0x80) {
      tour.release(key & 0x7f);
      held.delete(key & 0x7f);
    } else {
      tour.press(key);
      held.add(key);
    }
    assert.ok(held.size <= 1, 'the recording never holds two keys at once');
    event++;
    due += events[event]?.delta ?? Infinity;
  }
  await tour.tick();
}
assert.equal(tour.ended, 'won', `the shipped demo must win; stopped in scene ${tour.scene} at ${JSON.stringify(tour.pos)}`);
assert.equal(tour.deaths, 0, 'the demonstration must finish without a nap');
assert.deepEqual(
  tour.trail,
  CHAPTERS.map((_, index) => index + 2),
  'the demonstration must visit every level',
);
console.log('Stripe Hypothesis checks passed: scenes, text, speeds 20/25/30, stripe palettes, both levels, demo');

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

const root = join(import.meta.dirname, '../public/game');
const bytes = (name: string) => new Uint8Array(readFileSync(join(root, name)));
const game = parseGame(bytes('hypo.gam'));

// Scene graph: the title, the end, then the levels in order, each with one link on its door.
assert.equal(game.scenes.length, CHAPTERS.length + 2, 'the page must describe every playable level');
for (const [index, scene] of game.scenes.entries()) {
  if (index < 2) continue;
  const chapter = CHAPTERS[index - 2];
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
for (const name of ['intro.fli', 'garage.fli', 'results.fli']) {
  assert.deepEqual(fliFaults(bytes(name)), [], `${name}: animation must fit the original DOS player`);
  const movie = parseFli(bytes(name));
  const seconds = (movie.frameCount * movie.speed) / 70;
  assert.ok(seconds >= 1.5 && seconds <= 8, `${name}: ${seconds}s should be readable but short`);
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

// The shipped recording wins without a nap, visits both levels and uses one arrow at a time.
const tour = new GameSim(readDisk(root));
const events = parseRecording(bytes('tour.rec'));
const allowed = new Set([72, 75, 77, 80, 57, 28]);
const held = new Set<number>();
let event = 0,
  due = events[0]?.delta ?? Infinity;
for (let tick = 1; tick <= 5000 && !tour.ended; tick++) {
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

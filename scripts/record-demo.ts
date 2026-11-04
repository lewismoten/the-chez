// Plays the shipped game headless like a patient person (arrows only, one key at a time) and saves
// the input as the DOS recording the page's "Watch" button replays: assets/teddy-tour.rec.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { GameSim, readDisk } from '@lewismoten/gamemaker-sandbox-tools/simulation';
import { serializeRecording, type RecordedKey } from '@lewismoten/gamemaker-sandbox-tools/formats/recording';
import { ITEMS, DRIVEWAY } from './hypo-driveway.ts';
import { TAPE_ROUTE, TAPE } from './hypo-tape.ts';

const root = join(import.meta.dirname, '../public/game');
const sim = new GameSim(readDisk(root));
const keys: RecordedKey[] = [];
let last = 0;
let total = 0;
const step = async () => {
  await sim.tick();
  total++;
};
const note = (key: number) => {
  const at = total + 1;
  keys.push({ delta: at - last, key });
  last = at;
};
const LEFT = 75,
  RIGHT = 77,
  UP = 72,
  DOWN = 80;
const down = new Set<number>();
const hold = (scan: number | undefined) => {
  for (const key of [...down])
    if (key !== scan) {
      sim.release(key);
      note(key | 0x80);
      down.delete(key);
    }
  if (scan !== undefined && !down.has(scan)) {
    sim.press(scan);
    note(scan);
    down.add(scan);
  }
};
// Walk to a block, one axis at a time, never holding two keys.
async function walkTo(bx: number, by: number, first: 'x' | 'y' = 'x', limit = 600) {
  const scene = sim.scene;
  for (let i = 0; i < limit && sim.scene === scene; i++) {
    const { x, y } = sim.pos;
    if (x === bx && y === by) break;
    const horizontal = x !== bx && (first === 'x' || y === by);
    hold(horizontal ? (x < bx ? RIGHT : LEFT) : y > by ? UP : DOWN);
    await step();
  }
  const at = sim.pos;
  if (sim.scene <= 4 && (at.x !== bx || at.y !== by)) console.log('stuck going to', bx, by, 'at', at.x, at.y);
  hold(undefined);
}
await step();
// Level 1: around the hedges to the clipboard, then the stopwatch, then the garage door.
const [clipboard, stopwatch] = ITEMS;
await walkTo(DRIVEWAY.startX, 44, 'y');
await walkTo(clipboard.x, 44);
await walkTo(clipboard.x, clipboard.y);
await walkTo(clipboard.x, 44, 'y');
await walkTo(24, 44);
await walkTo(24, 38, 'y');
await walkTo(stopwatch.x, 38);
await walkTo(stopwatch.x, stopwatch.y, 'y');
await walkTo(DRIVEWAY.doorX - 2, 36, 'x');
await walkTo(DRIVEWAY.doorX, 36, 'x');
await walkTo(DRIVEWAY.doorX, DRIVEWAY.doorY + 1, 'y');
for (let i = 0; i < 200 && sim.scene === 2; i++) {
  hold(UP);
  await step();
}
hold(undefined);
// Level 2: hold Right the whole way; the barrier waits for GO by itself.
// The maze (level 3) is walked by hand after the street: Right again after each scene change, since the
// engine lets go of every key then.
hold(RIGHT);
let scene = sim.scene;
for (let i = 0; i < 3000 && sim.scene < 4; i++) {
  if (sim.scene !== scene) {
    scene = sim.scene;
    hold(undefined);
    for (let wait = 0; wait < 40; wait++) await step();
    hold(RIGHT);
  }
  await step();
}
hold(undefined);
for (let wait = 0; wait < 40; wait++) await step();
// Level 3, Gwinn and the Tape: down the maze's corridors, one arrow at a time, to the tape and on to the door.
for (const [x, y] of TAPE_ROUTE.slice(1)) {
  const horizontal = sim.pos.y === y;
  await walkTo(x, y, horizontal ? 'x' : 'y');
}
// line the body up with the door's column (Teddy is a block wide and may straddle two)
for (let i = 0; i < 20 && sim.pos.sx !== 0; i++) {
  hold(LEFT);
  await step();
}
hold(undefined);
await walkTo(TAPE.doorX, TAPE.doorY + 1, 'y');
for (let i = 0; i < 200 && sim.scene === 4; i++) {
  hold(UP);
  await step();
}
hold(undefined);
for (let wait = 0; wait < 40; wait++) await step();
// Level 4, the tricycle: hold Right. A hen stops the car, so let go, tap Space (the honk), wait for the hen
// to flap away and hold Right again: never two keys at once, and no timing that needs quick hands.
const SPACE = 57;
hold(RIGHT);
const recent: number[] = [];
for (let i = 0; i < 3000 && sim.scene === 5; i++) {
  await step();
  recent.push(sim.pos.x);
  const last = recent.slice(-10);
  if (last.length === 10 && Math.max(...last) - Math.min(...last) <= 12) {
    hold(undefined);
    for (let wait = 0; wait < 12; wait++) await step();
    hold(SPACE);
    for (let wait = 0; wait < 4; wait++) await step();
    hold(undefined);
    for (let wait = 0; wait < 20; wait++) await step();
    hold(RIGHT);
    recent.length = 0;
  }
}
hold(undefined);
for (let wait = 0; wait < 40; wait++) await step();
// The hill (the last two levels): hold Right; again after each scene change.
hold(RIGHT);
scene = sim.scene;
for (let i = 0; i < 3000 && !sim.ended; i++) {
  if (sim.scene !== scene) {
    scene = sim.scene;
    hold(undefined);
    for (let wait = 0; wait < 40; wait++) await step();
    hold(RIGHT);
  }
  await step();
}
hold(undefined);
console.log('ended:', sim.ended, 'deaths:', sim.deaths, 'trail:', sim.trail.join(','), 'ticks:', total, 'events:', keys.length);
if (sim.ended === 'won' && sim.deaths === 0) {
  writeFileSync(join(import.meta.dirname, '../assets/teddy-tour.rec'), serializeRecording(keys));
  console.log('Saved assets/teddy-tour.rec');
} else process.exitCode = 1;

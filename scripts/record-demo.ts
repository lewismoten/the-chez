// Plays the shipped game headless like a patient person (arrows only, one key at a time) and saves
// the input as the DOS recording the page's "Watch" button replays: assets/teddy-tour.rec.
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { GameSim, readDisk } from '@lewismoten/gamemaker-sandbox-tools/simulation';
import { serializeRecording, type RecordedKey } from '@lewismoten/gamemaker-sandbox-tools/formats/recording';
import { ITEMS, DRIVEWAY } from './hypo-driveway.ts';

const root = join(import.meta.dirname, '../public/game');
const sim = new GameSim(readDisk(root));
const keys: RecordedKey[] = [];
let last = 0;
const note = (key: number) => {
  const at = sim.ticks + 1;
  keys.push({ delta: at - last, key });
  last = at;
};
const LEFT = 75, RIGHT = 77, UP = 72, DOWN = 80;
const down = new Set<number>();
const hold = (scan: number | undefined) => {
  for (const key of [...down]) if (key !== scan) { sim.release(key); note(key | 0x80); down.delete(key); }
  if (scan !== undefined && !down.has(scan)) { sim.press(scan); note(scan); down.add(scan); }
};
// Walk to a block, one axis at a time, never holding two keys.
async function walkTo(bx: number, by: number, first: 'x' | 'y' = 'x', limit = 600) {
  const scene = sim.scene;
  for (let i = 0; i < limit && sim.scene === scene; i++) {
    const { x, y } = sim.pos;
    if (x === bx && y === by) break;
    const horizontal = x !== bx && (first === 'x' || y === by);
    hold(horizontal ? (x < bx ? RIGHT : LEFT) : y > by ? UP : DOWN);
    await sim.tick();
  }
  const at = sim.pos;
  if (sim.scene === 2 && (at.x !== bx || at.y !== by)) console.log('stuck going to', bx, by, 'at', at.x, at.y);
  hold(undefined);
}
await sim.tick();
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
for (let i = 0; i < 200 && sim.scene === 2; i++) { hold(UP); await sim.tick(); }
hold(undefined);
// Level 2: hold Right the whole way; the barrier waits for GO by itself.
hold(RIGHT);
for (let i = 0; i < 2500 && !sim.ended; i++) await sim.tick();
hold(undefined);
console.log('ended:', sim.ended, 'deaths:', sim.deaths, 'trail:', sim.trail.join(','), 'ticks:', sim.ticks, 'events:', keys.length);
if (sim.ended === 'won' && sim.deaths === 0) {
  writeFileSync(join(import.meta.dirname, '../assets/teddy-tour.rec'), serializeRecording(keys));
  console.log('Saved assets/teddy-tour.rec');
} else process.exitCode = 1;

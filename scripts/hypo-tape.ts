// Level 3, Gwinn and the Tape: a hedge maze at dusk. Gwinn ran off with the stripe tape and sits on it
// at the far end of a dead end; Teddy fetches it (one pickup on a counter), then the garage door at
// the other side of the maze opens. Four ways, Teddy on foot, no timers and nothing that moves.
import { emptyBlock, serializeBlocks } from '@lewismoten/gamemaker-sandbox-tools/formats/blocks';
import { newMap, serializeMap } from '@lewismoten/gamemaker-sandbox-tools/formats/map';
import { newMonsterSet, serializeMonsters } from '@lewismoten/gamemaker-sandbox-tools/formats/monster';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/drawing';
import { micro } from '../assets/source/teddy/art/draw.ts';
import { GWINN } from '../assets/source/teddy/sprites/gwinn.ts';
import { C, palette, timeOfDay } from './hypo-art.ts';
import { matchNear } from './hypo-driveway.ts';

const CELLS_W = 8;
const CELLS_H = 6;
const X0 = 6;
const Y0 = 30;
const COUNTER = 22;
type Cell = [number, number];
const key = (x: number, y: number) => `${x},${y}`;
const DIRS: Cell[] = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/** A depth-first maze from a fixed seed, so every build is the same: the open walls between cells. */
function carve(): Set<string> {
  let seed = 20261104;
  const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  const seen = new Set([key(0, CELLS_H - 1)]);
  const open = new Set<string>();
  const stack: Cell[] = [[0, CELLS_H - 1]];
  while (stack.length) {
    const [x, y] = stack[stack.length - 1];
    const next = DIRS.map(([dx, dy]): Cell => [x + dx, y + dy]).filter(([nx, ny]) => nx >= 0 && ny >= 0 && nx < CELLS_W && ny < CELLS_H && !seen.has(key(nx, ny)));
    if (!next.length) {
      stack.pop();
      continue;
    }
    const [nx, ny] = next[Math.floor(rnd() * next.length)];
    seen.add(key(nx, ny));
    open.add(`${key(x, y)}-${key(nx, ny)}`).add(`${key(nx, ny)}-${key(x, y)}`);
    stack.push([nx, ny]);
  }
  return open;
}
const OPEN = carve();
const links = (x: number, y: number): Cell[] => DIRS.map(([dx, dy]): Cell => [x + dx, y + dy]).filter(([nx, ny]) => OPEN.has(`${key(x, y)}-${key(nx, ny)}`));

/** Breadth-first path from one cell to another (the maze has exactly one). */
function path(from: Cell, to: Cell): Cell[] {
  const prev = new Map<string, Cell | null>([[key(...from), null]]);
  const queue = [from];
  for (let q = 0; q < queue.length; q++) for (const n of links(...queue[q])) if (!prev.has(key(...n))) (prev.set(key(...n), queue[q]), queue.push(n));
  const out: Cell[] = [];
  for (let at: Cell | null | undefined = to; at; at = prev.get(key(...at))) out.unshift(at);
  return out;
}
const START: Cell = [0, CELLS_H - 1];
const allCells: Cell[] = Array.from({ length: CELLS_W * CELLS_H }, (_, i): Cell => [i % CELLS_W, Math.floor(i / CELLS_W)]);
const length = (to: Cell) => path(START, to).length;
const DOOR_CELL = allCells.filter(([, y]) => y === 0).sort((a, b) => length(b) - length(a))[0];
const TAPE_CELL = allCells
  .filter((c) => links(...c).length === 1 && key(...c) !== key(...DOOR_CELL) && key(...c) !== key(...START))
  .sort((a, b) => length(b) - length(a))[0];
const centre = ([cx, cy]: Cell): Cell => [X0 + cx * 4 + 2, Y0 + cy * 4 + 2];

export const TAPE = {
  startX: centre(START)[0],
  startY: centre(START)[1],
  doorX: centre(DOOR_CELL)[0],
  doorY: Y0,
  tapeX: centre(TAPE_CELL)[0],
  tapeY: centre(TAPE_CELL)[1],
  counter: COUNTER,
  required: 1,
};
/** The cell centres, in block coordinates, from the start to the tape and on to the door's cell (the demonstration walks them). */
export const TAPE_ROUTE: Cell[] = [...path(START, TAPE_CELL), ...path(TAPE_CELL, DOOR_CELL).slice(1)].map(centre);

export function tapeFiles(put: (name: string, data: Uint8Array) => void): void {
  const pal = timeOfDay(palette(0), 'dusk');
  const blocks = Array.from({ length: 150 }, (_, i) => emptyBlock(i));
  const map = newMap();
  const c = (r: number, g: number, b: number) => matchNear(pal, r, g, b);
  const path0 = c(34, 34, 30),
    path1 = c(28, 28, 26),
    hedge = c(5, 24, 9),
    hedgeHi = c(9, 33, 12),
    wall = c(46, 34, 24),
    wood = c(36, 24, 12),
    roof = c(30, 12, 9);
  const draw = (id: number, fn: (p: Pixels) => void, solid = 0) => {
    const p = new Pixels(20, 20, path0);
    fn(p);
    blocks[id].pixels.set(p.px);
    blocks[id].solid = solid;
  };
  draw(0, (p) => {
    for (let i = 0; i < 20; i += 3) p.set((i * 7) % 20, (i * 11) % 20, path1);
  });
  draw(
    1,
    (p) => {
      p.rect(0, 0, 20, 20, hedge);
      for (let i = 0; i < 20; i += 4) p.disc(i + 2, ((i * 3) % 18) + 2, 3, hedgeHi);
    },
    15,
  );
  // the garage door in the maze's outer wall: shut until the tape is found
  const garage = (open: boolean) => (p: Pixels) => {
    p.rect(0, 0, 20, 20, wall);
    p.rect(1, 1, 18, 19, open ? C.dark : wood);
    p.rect(0, 0, 20, 3, roof);
    if (!open) for (let y = 5; y < 20; y += 5) p.rect(1, y, 18, 1, path1);
    micro(p, 4, 9, open ? '' : 'GO', C.cream, 1);
  };
  draw(2, garage(false), 15);
  draw(3, garage(true));
  blocks[2].effect = COUNTER;
  blocks[2].eamt = -TAPE.required;
  blocks[2].touchBl = 3;
  blocks[3].nextBl = 3;
  blocks[3].touchBl = 3;
  // the tape: a red roll with a white stripe, picked up by touching it
  draw(4, (p) => {
    p.disc(10, 11, 8, C.red);
    p.disc(10, 11, 3, path0);
    p.rect(2, 10, 16, 2, C.white);
    p.rect(2, 14, 16, 1, C.black);
  });
  Object.assign(blocks[4], { effect: COUNTER, eamt: 1, scorePts: 25, touchBl: 0, nextBl: 0 });
  // Gwinn sits beside it, looking pleased with herself
  draw(5, (p) => {
    const g = GWINN.gwinn1;
    for (let i = 0; i < g.px.length && i < 400; i++) if (g.px[i] !== 255) p.px[i] = g.px[i];
  });
  for (let y = 0; y < 100; y++) for (let x = 0; x < 100; x++) map.blocks[y * 100 + x] = 1;
  const W = CELLS_W * 4 + 1;
  const H = CELLS_H * 4 + 1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) map.blocks[(Y0 + y) * 100 + X0 + x] = 1;
  for (const [cx, cy] of allCells) {
    for (let y = 1; y <= 3; y++) for (let x = 1; x <= 3; x++) map.blocks[(Y0 + cy * 4 + y) * 100 + X0 + cx * 4 + x] = 0;
    for (const [nx, ny] of links(cx, cy)) {
      if (nx < cx || ny < cy) continue; // each wall once
      for (let k = 1; k <= 3; k++) {
        const bx = nx > cx ? X0 + cx * 4 + 4 : X0 + cx * 4 + k;
        const by = ny > cy ? Y0 + cy * 4 + 4 : Y0 + cy * 4 + k;
        map.blocks[by * 100 + bx] = 0;
      }
    }
  }
  map.blocks[TAPE.doorY * 100 + TAPE.doorX] = 2;
  map.blocks[TAPE.tapeY * 100 + TAPE.tapeX] = 4;
  map.blocks[TAPE.tapeY * 100 + TAPE.tapeX - 1] = 5;
  put('tape.pal', pal);
  put('tape.map', serializeMap(map));
  put('tape.bbl', serializeBlocks(blocks));
  put('tape.mon', serializeMonsters(newMonsterSet()));
  put('tape.mbl', serializeBlocks(Array.from({ length: 100 }, (_, i) => emptyBlock(i, true))));
}

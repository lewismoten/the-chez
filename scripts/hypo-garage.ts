// Level 5, the Wind Tunnel: Doc Leo's garage at night. Teddy walks on foot and rides his box fans, which blow
// up through grates in the floor and the benches. Each fan's draft is a two-cell column of "suck up" gravity
// blocks (animated streaks); it lifts Teddy through the one-way bench above (solid on top only) and drops him back
// onto it. A post beside each column keeps a player who holds Right in the draft. The third bench holds the white
// stripe roll and the door out. Gravity pulls down everywhere else, so Teddy simply falls off an edge and tries again.
import { emptyBlock, serializeBlocks, type Block } from '@lewismoten/gamemaker-sandbox-tools/formats/blocks';
import { newMap, serializeMap } from '@lewismoten/gamemaker-sandbox-tools/formats/map';
import { newMonsterSet, serializeMonsters } from '@lewismoten/gamemaker-sandbox-tools/formats/monster';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/drawing';
import { micro } from '../assets/source/teddy/art/draw.ts';
import { docLeo } from '../assets/source/teddy/sprites/people.ts';
import { GWINN } from '../assets/source/teddy/sprites/gwinn.ts';
import { C, palette, timeOfDay } from './hypo-art.ts';
import { R } from './hypo-colors.ts';
import { hash } from './hypo-tiles.ts';
import { trike } from './hypo-critters.ts';
import { teddyData } from './hypo-driveway.ts';

/** Rows and columns: Teddy stands on row `floor` (the slab is below); each bench is four rows above the last. */
const FLOOR = 70;
const BENCH = [FLOOR + 1, 67, 63, 59];
export const WIND = {
  startX: 6,
  startY: FLOOR,
  doorX: 56,
  doorY: 58,
  rollX: 51,
  rollY: 58,
  counter: 23,
  required: 1,
  /** Left cell of each fan's draft (the right cell is the next one) and the grate row it blows from. */
  fans: [
    { x: 18, row: FLOOR + 1 },
    { x: 30, row: 67 },
    { x: 42, row: 63 },
  ],
};
const R0 = 49; // the picture's first map row
const COLS = 62;
const ROWS = 25;
const px = (cx: number, cy: number): [number, number] => [cx * 20, (cy - R0) * 20];

type Draw = (p: Pixels) => void;
const tile = (fn: Draw): Pixels => {
  const p = new Pixels(20, 20, 0);
  fn(p);
  return p;
};

/** The back wall: green clapboards ten pixels wide with seams, grain and nail heads; it repeats every block. */
const plank = (): Pixels =>
  tile((p) => {
    for (let y = 0; y < 20; y++)
      for (let x = 0; x < 20; x++) {
        const edge = x % 10 === 9 ? 0 : x % 10 === 0 ? 3 : hash(x, y >> 1, 7) < 0.18 ? 1 : 2;
        p.set(x, y, R('siding', edge));
      }
    for (const [x, y] of [[4, 3], [14, 3], [4, 16], [14, 16]]) p.set(x, y, R('iron', 1));
  });

/** One cell of a wooden bench top: a thick plank over the wall, with a gusset bracket under every fourth cell. */
const bench = (gusset: boolean): Pixels =>
  tile((p) => {
    p.blit(plank(), 0, 0);
    p.rect(0, 0, 20, 9, R('wood', 2));
    p.rect(0, 0, 20, 1, R('stucco', 3));
    p.rect(0, 1, 20, 1, R('stucco', 2));
    for (let x = 3; x < 20; x += 7) p.rect(x, 3, 3, 1, R('wood', 1));
    p.rect(0, 7, 20, 2, R('wood', 1));
    p.rect(0, 9, 20, 2, R('wood', 0));
    if (gusset) for (let i = 0; i < 8; i++) p.rect(9, 11 + i, 2, 1, R('iron', 2)), p.rect(9 - i, 11 + i, 1, 1, R('iron', 1));
  });

/** A stacked crate (the posts beside the fans): planks, a brace, nails. */
const crate = (n: number): Pixels =>
  tile((p) => {
    p.rect(0, 0, 20, 20, R('wood', 2));
    p.frame(0, 0, 20, 20, R('wood', 0));
    p.frame(2, 2, 16, 16, R('wood', 1));
    p.line(3, 3, 16, 16, R('wood', 1));
    p.line(16, 3, 3, 16, R('wood', 1));
    for (const [x, y] of [[1, 1], [18, 1], [1, 18], [18, 18]]) p.set(x, y, R('iron', 2));
    if (n === 1) micro(p, 5, 8, 'UP', R('flag', 0), 1);
  });

const concrete = (row: number, seam: boolean): Pixels =>
  tile((p) => {
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, R('stone', row === 0 ? (hash(x, y, 9) < 0.15 ? 1 : 2) : hash(x, y, 5) < 0.2 ? 0 : 1));
    if (row === 0) p.rect(0, 0, 20, 2, R('stone', 3));
    if (seam) p.rect(0, 0, 1, 20, R('stone', 0));
    if (row > 0) p.rect(0, 0, 20, 1, R('stone', 0));
  });

const rafter = (kind: number): Pixels =>
  tile((p) => {
    p.rect(0, 0, 20, 20, R('iron', 0));
    if (kind === 1) {
      p.rect(0, 12, 20, 8, R('wood', 1));
      p.rect(0, 12, 20, 1, R('wood', 2));
      p.rect(0, 19, 20, 1, R('wood', 0));
    } else for (let x = 2; x < 20; x += 10) p.rect(x, 0, 3, 20, R('wood', 0));
  });

/** The fan grate seen from above, 40x20: a cream box fan lying in the bench with its white blades at `turn`. */
function grate(turn: number): Pixels {
  const p = new Pixels(40, 20, 0);
  p.rect(0, 0, 40, 20, R('wood', 2));
  p.rect(0, 0, 40, 1, R('stucco', 3));
  p.rect(1, 2, 38, 17, C.cream);
  p.frame(1, 2, 38, 17, R('stone', 1));
  p.rect(2, 3, 36, 15, R('stone', 2));
  for (let y = 4; y < 17; y++)
    for (let x = 3; x < 37; x++) {
      const dx = (x - 19.5) / 16.5;
      const dy = (y - 10.5) / 6.2;
      if (dx * dx + dy * dy < 1) p.set(x, y, R('iron', 0));
    }
  // three broad blades, turned a third of a step each frame
  for (let b = 0; b < 3; b++) {
    const a = turn * 0.4 + (b * Math.PI * 2) / 3;
    for (const spread of [-0.22, 0, 0.22]) {
      const ex = 19.5 + Math.cos(a + spread) * 14.5;
      const ey = 10.5 + Math.sin(a + spread) * 5.4;
      p.line(20, 10, Math.round(ex), Math.round(ey), spread === 0 ? C.white : R('stone', 3));
    }
  }
  p.disc(20, 10, 2, C.gold);
  p.set(20, 10, C.red);
  for (const [x, y] of [[3, 3], [36, 3], [3, 17], [36, 17]]) p.set(x, y, R('iron', 2));
  return p;
}

/** A draft cell: the wall with a clear duct edge and three rising streaks, `turn` of three frames. */
function draftCell(base: Pixels, side: 0 | 1, turn: number): Pixels {
  const p = new Pixels(20, 20, 0);
  p.px.set(base.px);
  for (let k = 0; k < 3; k++) {
    const x = 4 + k * 5 + (side ? 0 : 1);
    const y0 = (turn * 6 + k * 7) % 20;
    for (let d = 0; d < 9; d++) {
      const y = (y0 + d) % 20;
      const bx = x + (d % 4 === 1 ? 1 : d % 4 === 3 ? -1 : 0);
      p.set(bx, y, d < 2 ? R('cloud', 1) : R('cloud', 2));
      p.set(bx + 1, y, d < 6 ? R('cloud', 1) : R('cloud', 0));
    }
  }
  return p;
}
const duct = (base: Pixels, side: 0 | 1): Pixels => {
  const p = new Pixels(20, 20, 0);
  p.px.set(base.px);
  // two clear acrylic edges and a darker interior
  p.rect(side ? 18 : 0, 0, 2, 20, R('glass', 2));
  p.rect(side ? 17 : 2, 0, 1, 20, R('glass', 1));
  for (let y = 0; y < 20; y++) for (let x = side ? 0 : 3; x < (side ? 17 : 20); x++) if ((x + y) % 3 === 0) p.set(x, y, R('siding', 0));
  return p;
};

// ---- the scenery on the back wall -------------------------------------------------------------------------
function pegboard(p: Pixels, cx: number, cy: number, tools: number): void {
  const [x, y] = px(cx, cy);
  p.rect(x, y, 80, 40, R('stucco', 2));
  for (let yy = 3; yy < 40; yy += 6) for (let xx = 3; xx < 80; xx += 6) p.set(x + xx, y + yy, R('stucco', 0));
  p.frame(x, y, 80, 40, R('wood', 1));
  const hang = (xx: number, draw: (hx: number) => void) => draw(x + xx);
  hang(8, (hx) => {
    p.rect(hx + 2, y + 6, 3, 18, R('iron', 2));
    p.rect(hx, y + 4, 7, 5, R('iron', 1));
  });
  hang(24, (hx) => {
    p.rect(hx + 3, y + 7, 2, 20, R('wood', 1));
    p.rect(hx, y + 5, 8, 4, R('iron', 2));
  });
  hang(40, (hx) => {
    p.disc(hx + 6, y + 14, 7, tools ? R('flag', 0) : R('flag', 2));
    p.disc(hx + 6, y + 14, 3, R('stucco', 2));
  });
  hang(58, (hx) => {
    p.rect(hx, y + 6, 12, 3, R('iron', 2));
    p.rect(hx + 2, y + 9, 2, 14, R('wood', 1));
    p.rect(hx + 8, y + 9, 2, 14, R('wood', 1));
  });
  // a tape measure and a row of white stripe rolls on hooks (the third stripe is what this garage is for)
  for (let k = 0; k < 3; k++) {
    p.disc(x + 14 + k * 14, y + 33, 4, C.white);
    p.disc(x + 14 + k * 14, y + 33, 1, C.black);
  }
}

function chalkboard(p: Pixels, cx: number, cy: number): void {
  const [x, y] = px(cx, cy);
  p.rect(x, y, 100, 60, R('wood', 1));
  p.rect(x + 3, y + 3, 94, 54, C.navy);
  p.rect(x + 3, y + 53, 94, 4, R('wood', 2));
  micro(p, x + 6, y + 8, 'WIND TUNNEL', C.cream, 2);
  micro(p, x + 10, y + 22, 'HYP: STRIPES GO FAST', C.cream, 1);
  micro(p, x + 10, y + 31, 'FAN UP = TEDDY UP', C.gold, 1);
  micro(p, x + 10, y + 40, 'TOP SPEED: STILL 25', C.cream, 1);
}

function window(p: Pixels, cx: number, cy: number): void {
  const [x, y] = px(cx, cy);
  p.rect(x, y, 60, 60, R('wood', 1));
  p.rect(x + 4, y + 4, 52, 52, R('glass', 0));
  for (let yy = 4; yy < 56; yy++) for (let xx = 4; xx < 56; xx++) if ((xx * 3 + yy) % 13 === 0 && yy < 44) p.set(x + xx, y + yy, R('glass', 1));
  for (const [sx, sy] of [[12, 12], [40, 9], [47, 30], [20, 36], [34, 20]]) p.set(x + sx, y + sy, C.white);
  p.disc(x + 40, y + 18, 5, R('glow', 1));
  p.disc(x + 42, y + 17, 4, R('glass', 0));
  p.rect(x + 29, y + 4, 2, 52, R('wood', 1));
  p.rect(x + 4, y + 29, 52, 2, R('wood', 1));
  p.rect(x - 3, y + 58, 66, 4, R('wood', 2));
  p.rect(x - 3, y + 58, 66, 1, R('stucco', 3));
}

/** A work lamp hung from the beam on a short cord, over a pool of light on the clapboards (every lamp repeats the same blocks). */
function lamp(p: Pixels, cx: number): void {
  const [x, y] = px(cx, 53);
  p.rect(x + 9, y, 2, 14, R('iron', 1));
  for (let i = 0; i < 8; i++) p.rect(x + 10 - 3 - i, y + 14 + i, 7 + i * 2, 1, i < 2 ? R('iron', 2) : R('flag', 0));
  p.rect(x + 3, y + 22, 15, 3, R('glow', 1));
  for (let yy = 25; yy < 42; yy++)
    for (let xx = 10 - 3 - Math.floor((yy - 25) * 0.7); xx <= 10 + 3 + Math.floor((yy - 25) * 0.7); xx++)
      if ((xx + yy) % 2 === 0 && p.get(x + xx, y + yy) === R('siding', 2)) p.set(x + xx, y + yy, R('siding', 3));
}

function shelf(p: Pixels, cx: number, cy: number): void {
  const [x, y] = px(cx, cy);
  p.rect(x, y + 14, 80, 5, R('wood', 2));
  p.rect(x, y + 14, 80, 1, R('stucco', 3));
  p.rect(x + 4, y + 19, 3, 8, R('iron', 1));
  p.rect(x + 73, y + 19, 3, 8, R('iron', 1));
  const jars = [R('flag', 0), R('flag', 3), R('flag', 1), R('flag', 2), R('flag', 0), R('flag', 1)];
  jars.forEach((c, i) => {
    p.rect(x + 6 + i * 12, y + 3, 9, 11, R('glass', 2));
    p.rect(x + 7 + i * 12, y + 6, 7, 8, c);
    p.rect(x + 7 + i * 12, y + 1, 7, 2, R('iron', 2));
  });
}

function toolbox(p: Pixels, cx: number, cy: number): void {
  const [x, y] = px(cx, cy);
  p.rect(x, y + 6, 60, 34, R('flag', 0));
  p.rect(x, y + 6, 60, 3, R('flag', 0));
  p.rect(x + 1, y + 7, 58, 1, C.white);
  for (const yy of [16, 26]) p.rect(x + 2, y + yy, 56, 1, R('iron', 0));
  for (const hx of [8, 30]) p.rect(x + hx, y + 12, 12, 2, R('iron', 2));
  p.rect(x + 12, y, 36, 4, R('iron', 2));
  p.rect(x + 14, y + 2, 32, 2, R('iron', 1));
  p.rect(x, y + 36, 60, 4, R('iron', 0));
}

function sign(p: Pixels, cx: number, cy: number, lines: [string, number][]): void {
  const [x, y] = px(cx, cy);
  const w = Math.max(...lines.map(([t]) => t.length)) * 4 + 8;
  const h = 10 + lines.length * 9;
  p.rect(x, y, w, h, C.cream);
  p.frame(x, y, w, h, R('wood', 1));
  lines.forEach(([t, c], i) => micro(p, x + 4, y + 5 + i * 9, t, c, 1));
  p.set(x + 2, y + 2, R('iron', 1));
  p.set(x + w - 3, y + 2, R('iron', 1));
}

function crateStack(p: Pixels, cx: number, cy: number, w: number, h: number): void {
  const [x, y] = px(cx, cy);
  for (let j = 0; j < h; j++)
    for (let i = 0; i < w; i++) {
      const c = crate((i + j) % 2);
      p.blit(c, x + i * 20 + (j % 2) * 0, y + j * 20);
    }
}

/** One cell of bunting: a string with two pennants (colors by column, so the strand repeats every four blocks). */
const bunting = (n: number): Pixels =>
  tile((p) => {
    p.blit(plank(), 0, 0);
    p.line(0, 2, 19, 2, R('iron', 1));
    for (const [x0, k] of [[2, n], [11, n + 1]] as const) for (let i = 0; i < 7; i++) p.rect(x0 + i, 3 + i, 7 - i, 1, R('flag', k % 4)), p.rect(x0 + i, 3 + i, 1, 1, R('iron', 0));
  });

/** A round wall clock stuck at five to twelve. */
function clock(p: Pixels, cx: number, cy: number): void {
  const [x, y] = px(cx, cy);
  p.disc(x + 10, y + 10, 9, C.cream);
  p.ring(x + 10, y + 10, 9, R('iron', 1));
  p.ring(x + 10, y + 10, 8, R('iron', 2));
  for (let k = 0; k < 12; k++) p.set(x + 10 + Math.round(Math.cos((k * Math.PI) / 6) * 7), y + 10 + Math.round(Math.sin((k * Math.PI) / 6) * 7), R('iron', 0));
  p.line(x + 10, y + 10, x + 10, y + 3, R('iron', 0));
  p.line(x + 10, y + 10, x + 7, y + 6, R('iron', 0));
  p.set(x + 10, y + 10, R('flag', 0));
}

/** A stacked pair of tires (one block, repeated). */
const tires = (): Pixels =>
  tile((p) => {
    p.blit(plank(), 0, 0);
    for (const [cy, r] of [[14, 6], [6, 6]] as const) {
      p.disc(10, cy + 0, 9, R('iron', 0));
      p.ring(10, cy + 0, 9, R('iron', 1));
      p.disc(10, cy + 0, 4, R('iron', 1));
      p.disc(10, cy + 0, 2, R('stone', 1));
      void r;
    }
    p.rect(0, 18, 20, 2, R('iron', 0));
  });

/** A cork board with pinned notes and a snapshot of Teddy's ears. */
function bulletin(p: Pixels, cx: number, cy: number): void {
  const [x, y] = px(cx, cy);
  p.rect(x, y, 40, 40, R('wood', 1));
  p.rect(x + 2, y + 2, 36, 36, R('stucco', 1));
  for (let i = 0; i < 40; i++) p.set(x + 2 + ((i * 7) % 36), y + 2 + ((i * 11) % 36), R('stucco', 0));
  p.rect(x + 5, y + 5, 14, 11, C.white);
  micro(p, x + 7, y + 8, 'FAN', R('iron', 0), 1);
  p.set(x + 12, y + 5, R('flag', 0));
  p.rect(x + 22, y + 6, 13, 14, C.cream);
  p.rect(x + 25, y + 9, 3, 4, C.tan);
  p.rect(x + 29, y + 9, 3, 4, C.tan);
  p.rect(x + 27, y + 11, 3, 6, C.white);
  p.set(x + 28, y + 6, R('flag', 2));
  p.rect(x + 8, y + 22, 18, 13, C.gold);
  micro(p, x + 10, y + 24, 'NO', R('iron', 0), 1);
  micro(p, x + 10, y + 30, 'FOOD', R('iron', 0), 1);
  p.set(x + 17, y + 22, R('flag', 0));
}

/** Paints the whole garage as one picture; ledges, posts, columns and fans are painted in too. */
function paintGarage(): Pixels {
  const pic = new Pixels(COLS * 20, ROWS * 20, R('iron', 0));
  const wall = plank();
  const put = (cx: number, cy: number, t: Pixels) => pic.blit(t, ...px(cx, cy));
  // the room: clapboards between the beam (row 52) and the slab, a dark void around it
  for (let cy = 53; cy < FLOOR + 1; cy++) for (let cx = 3; cx < 58; cx++) put(cx, cy, wall);
  for (let cx = 0; cx < COLS; cx++) {
    put(cx, 52, rafter(1));
    for (let cy = 49; cy < 52; cy++) put(cx, cy, rafter(0));
    put(cx, 71, concrete(0, cx % 2 === 0));
    for (const cy of [72, 73]) put(cx, cy, concrete(1, cx % 2 === 1));
  }
  for (let cy = 53; cy < 71; cy++) for (const cx of [0, 1, 2, 58, 59, 60, 61]) put(cx, cy, rafter(0));
  for (let cy = 53; cy < 71; cy++) for (const cx of [2, 58]) put(cx, cy, rafter(1));
  // the scenery, kept clear of the draft columns and benches
  pegboard(pic, 4, 66, 0);
  shelf(pic, 9, 63);
  chalkboard(pic, 4, 58);
  window(pic, 11, 58);
  toolbox(pic, 8, 69);
  for (const cx of [7, 25, 38, 51]) lamp(pic, cx);
  window(pic, 21, 59);
  pegboard(pic, 24, 64, 1);
  sign(pic, 25, 61, [['SAFETY FIRST.', C.red], ['SECOND: THE FAN.', R('stone', 0)]]);
  crateStack(pic, 22, 69, 3, 2);
  window(pic, 35, 55);
  sign(pic, 35, 60, [['RESULTS SO FAR:', R('stone', 0)], ['INCONCLUSIVE.', C.red]]);
  crateStack(pic, 35, 69, 2, 2);
  pegboard(pic, 47, 54, 1);
  sign(pic, 47, 61, [['STRIPE 3 IS UP', R('stone', 0)], ['THERE. GO GET IT.', C.red]]);
  crateStack(pic, 48, 68, 3, 3);
  chalkboard(pic, 52, 64);
  for (const [from, to] of [[10, 24], [26, 37], [39, 50]]) for (let cx = from; cx <= to; cx++) put(cx, 53, bunting(cx));
  clock(pic, 29, 56);
  for (const [cx, cy] of [[28, 70], [28, 69], [29, 70]]) put(cx, cy, tires());
  bulletin(pic, 38, 57);
  // a tricycle hung on the wall (a hint of the last trial), and Doc Leo at the main switch
  const hung = new Pixels(40, 40, 255);
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) if (trike(0).get(x, y) !== 255) hung.set(x * 2, y * 2, trike(0).get(x, y)), hung.set(x * 2 + 1, y * 2, trike(0).get(x, y)), hung.set(x * 2, y * 2 + 1, trike(0).get(x, y)), hung.set(x * 2 + 1, y * 2 + 1, trike(0).get(x, y));
  pic.blit(hung, ...px(15, 55), 255);
  const leo = docLeo(undefined, true);
  pic.blit(leo, px(13, 69)[0], px(13, 69)[1] + 20 - leo.h + 20, 255);
  // gwinn naps under the first bench
  const g = GWINN.gwinn1;
  pic.blit(g, ...px(26, 70), 255);
  // benches and their crate posts
  for (let b = 1; b <= 3; b++) {
    const start = WIND.fans[b - 1].x;
    const end = start + 15;
    for (let cx = start; cx <= end; cx++) put(cx, BENCH[b], bench(cx % 4 === 0));
    const postX = start + 2;
    for (let cy = BENCH[b] + 1; cy < BENCH[b - 1] - (b === 1 ? 0 : 0); cy++) for (const cx of [postX, postX + 1]) put(cx, cy, crate((cx + cy) % 2));
  }
  // the fans' ducts and grates
  for (const [f, fan] of WIND.fans.entries()) {
    const top = BENCH[f + 1];
    for (let cy = top + 1; cy < fan.row; cy++) {
      put(fan.x, cy, duct(wall, 0));
      put(fan.x + 1, cy, duct(wall, 1));
    }
    pic.blit(grate(0), ...px(fan.x, fan.row));
  }
  // the door out and the roll to fetch
  put(WIND.doorX, WIND.doorY, doorArt(false));
  put(WIND.doorX, WIND.doorY - 1, tile((p) => {
    p.rect(0, 0, 20, 20, R('wood', 1));
    p.rect(1, 1, 18, 18, R('wood', 2));
    p.rect(2, 4, 16, 8, R('glow', 0));
    micro(p, 3, 6, 'EXIT', R('flag', 0), 1);
    p.rect(0, 19, 20, 1, R('wood', 0));
  }));
  put(WIND.rollX, WIND.rollY, rollArt());
  return pic;
}

/** The door in the garage wall: wood with a window and a handle, or standing open on the dark. */
function doorArt(open: boolean): Pixels {
  return tile((p) => {
    p.rect(0, 0, 20, 20, R('wood', 1));
    if (open) {
      p.rect(2, 0, 16, 20, R('iron', 0));
      p.rect(2, 0, 3, 20, R('wood', 2));
      p.rect(5, 3, 1, 14, R('iron', 1));
      return;
    }
    p.rect(2, 0, 16, 20, R('wood', 2));
    p.rect(4, 3, 12, 6, R('glass', 1));
    p.line(10, 3, 10, 8, R('wood', 1));
    p.rect(4, 11, 12, 8, R('wood', 1));
    p.rect(5, 12, 10, 6, R('wood', 2));
    p.disc(15, 10, 1, C.gold);
  });
}

/** A roll of white stripe tape standing on the bench. */
function rollArt(): Pixels {
  const wall = plank();
  wall.disc(10, 12, 7, C.white);
  wall.disc(10, 12, 7, C.white);
  wall.ring(10, 12, 7, R('stone', 2));
  wall.disc(10, 12, 3, R('iron', 0));
  wall.rect(5, 14, 11, 2, R('stone', 3));
  wall.rect(2, 19, 16, 1, R('wood', 0));
  return wall;
}

export function garageFiles(put: (name: string, data: Uint8Array) => void): void {
  const pal = timeOfDay(palette(2), 'late');
  const blocks = Array.from({ length: 150 }, (_, i) => emptyBlock(i));
  for (const b of blocks) b.grav = 4;
  const map = newMap();
  const pic = paintGarage();
  let used = 0;
  const arts: Pixels[] = [];
  const ids = new Map<string, number>();
  const make = (art: Pixels, rules: Partial<Block> = {}): number => {
    if (used >= 150) throw new Error('The garage needs more than 150 art blocks');
    const id = used++;
    arts[id] = art;
    blocks[id].pixels.set(art.px);
    Object.assign(blocks[id], rules);
    return id;
  };
  const unique = (art: Pixels): number => {
    const key = Buffer.from(art.px).toString('latin1');
    let id = ids.get(key);
    if (id === undefined) {
      id = make(art);
      ids.set(key, id);
    }
    return id;
  };
  const void0 = unique(tile((p) => p.rect(0, 0, 20, 20, R('iron', 0))));
  map.blocks.fill(void0);
  const cellArt = (cx: number, cy: number) => pic.crop(cx * 20, (cy - R0) * 20, 20, 20);
  for (let cy = R0; cy < R0 + ROWS; cy++) for (let cx = 0; cx < COLS; cx++) map.blocks[cy * 100 + cx] = unique(cellArt(cx, cy));
  const at = (cx: number, cy: number) => map.blocks[cy * 100 + cx];
  // rules for a cell's picture: a block used only by cells with the same rules takes them directly, otherwise a copy does
  const requests: [number, number, Partial<Block>][] = [];
  const variant = (cx: number, cy: number, rules: Partial<Block>): void => void requests.push([cx, cy, rules]);
  // solid: the slab, the beam, the side walls and the crate posts; one-way (solid on top only): the benches
  for (let cx = 0; cx < COLS; cx++) for (const cy of [49, 50, 51, 52, 71, 72, 73]) variant(cx, cy, { solid: 15 });
  for (let cy = 53; cy < 71; cy++) for (const cx of [0, 1, 2, 58, 59, 60, 61]) variant(cx, cy, { solid: 15 });
  for (let b = 1; b <= 3; b++) {
    const start = WIND.fans[b - 1].x;
    // the draft carries on through the one-way bench above each fan
    for (let cx = start; cx <= start + 15; cx++) variant(cx, BENCH[b], cx < start + 2 ? { solid: 1, grav: 1 } : { solid: 1 });
    for (let cy = BENCH[b] + 1; cy < BENCH[b - 1]; cy++) for (const cx of [start + 2, start + 3]) variant(cx, cy, { solid: 15 });
  }
  // the fans: each grate and each draft cell is a three-frame chain, so every fan turns and every draft streams in step
  const chain = (arts3: Pixels[], rules: Partial<Block>): number => {
    const first = used;
    arts3.forEach((art, i) => make(art, { ...rules, ntime: 2, nextBl: first + ((i + 1) % arts3.length) }));
    return first;
  };
  const grates = [0, 1, 2].map((t) => grate(t));
  const grateChain = [0, 1].map((side) => chain(grates.map((g) => g.crop(side * 20, 0, 20, 20)), { solid: 1 }));
  const wall = plank();
  const draftChain = [0, 1].map((side) => chain([0, 1, 2].map((t) => draftCell(duct(wall, side as 0 | 1), side as 0 | 1, t)), { grav: 1 }));
  const fanBlocks = new Set([...grateChain, ...draftChain].flatMap((first) => [first, first + 1, first + 2]));
  for (const [f, fan] of WIND.fans.entries()) {
    for (const side of [0, 1]) {
      map.blocks[fan.row * 100 + fan.x + side] = grateChain[side];
      for (let cy = BENCH[f + 1] + 1; cy < fan.row; cy++) map.blocks[cy * 100 + fan.x + side] = draftChain[side];
    }
  }
  const uses = new Map<number, number>();
  for (let cy = R0; cy < R0 + ROWS; cy++) for (let cx = 0; cx < COLS; cx++) uses.set(map.blocks[cy * 100 + cx], (uses.get(map.blocks[cy * 100 + cx]) ?? 0) + 1);
  const asked = new Map<string, { id: number; rules: Partial<Block>; cells: [number, number][] }>();
  for (const [cx, cy, rules] of requests) {
    const from = at(cx, cy);
    if (fanBlocks.has(from)) continue; // the fans' own animated blocks keep their rules
    const key = `${from}|${JSON.stringify(rules)}`;
    const entry = asked.get(key) ?? { id: from, rules, cells: [] };
    entry.cells.push([cx, cy]);
    asked.set(key, entry);
  }
  for (const { id, rules, cells } of asked.values()) {
    const wholly = cells.length === uses.get(id) && [...asked.values()].filter((e) => e.id === id).length === 1;
    const target = wholly ? id : make(arts[id], rules);
    if (wholly) Object.assign(blocks[id], rules);
    for (const [cx, cy] of cells) map.blocks[cy * 100 + cx] = target;
  }
  // the roll (a counter pickup) and the door (shut until the roll is in, then open on touch)
  const open = make(doorArt(true), { solid: 0 });
  blocks[open].touchBl = open;
  blocks[open].nextBl = open;
  const shut = make(doorArt(false), { solid: 15, effect: WIND.counter, eamt: -WIND.required, touchBl: open });
  map.blocks[WIND.doorY * 100 + WIND.doorX] = shut;
  const wallId = unique(plank());
  const roll = make(rollArt(), { effect: WIND.counter, eamt: 1, scorePts: 25, touchBl: wallId, nextBl: wallId });
  map.blocks[WIND.rollY * 100 + WIND.rollX] = roll;
  put('garage.pal', pal);
  put('garage.map', serializeMap(map));
  put('garage.bbl', serializeBlocks(blocks as Block[]));
  put('garage.mon', serializeMonsters(newMonsterSet()));
  put('garage.mbl', serializeBlocks(Array.from({ length: 100 }, (_, i) => emptyBlock(i, true))));
  const side = teddyData(true);
  put('teddy-side.chr', side.chr);
  console.log(`The garage uses ${used} of 150 art blocks`);
}

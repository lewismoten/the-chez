// Tile painters for the street: periodic wall textures, windows, doors, shop fronts, the sidewalk and
// the road. Every painter returns one 20x20 block whose pattern repeats every 20 pixels, so a long
// street dedupes to a small set of blocks (the build merges identical pictures). The brick fronts,
// dithered sky and bunting follow Tune-Up's parade street (Lewis Moten, MIT; see NOTICE.md).
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/drawing';
import { micro } from '../assets/source/teddy/art/draw.ts';
import { C } from './hypo-art.ts';
import { R, type RampName } from './hypo-colors.ts';

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
/** A repeatable pseudo-random number in [0, 1) from a few integers. */
export const hash = (a: number, b = 0, c = 0): number => {
  let h = (a * 374761393 + b * 668265263 + c * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

/** The dithered sky: ramp step by height (0 at the top of the picture, 1 at the horizon). */
export function skyAt(x: number, y: number, horizon: number): number {
  const level = Math.min(1, y / horizon) * 7;
  const i = Math.min(6, Math.floor(level));
  const threshold = (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
  return R('sky', level - i > threshold ? i + 1 : i);
}

export type Wall = 'brick' | 'stucco' | 'siding' | 'blue';
const WALL_RAMP: Record<Wall, RampName> = { brick: 'brick', stucco: 'stucco', siding: 'siding', blue: 'blue' };

/** The bare wall: brick courses, plaster speckle, or clapboards. */
export function wall(kind: Wall): Pixels {
  const p = new Pixels(20, 20, 0);
  const ramp = WALL_RAMP[kind];
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      let c: number;
      if (kind === 'brick') {
        const course = Math.floor(y / 5);
        const bx = (x + (course % 2) * 5) % 10;
        const joint = y % 5 === 4 || bx === 9;
        const shade = hash(course, Math.floor((x + (course % 2) * 5) / 10), 3);
        c = joint ? R('stone', 1) : R(ramp, shade < 0.2 ? 1 : shade > 0.8 ? 3 : 2);
        if (!joint && y % 5 === 0 && shade > 0.4) c = R(ramp, 3);
      } else if (kind === 'stucco') {
        const n = hash(x, y, 7);
        c = R(ramp, n < 0.1 ? 1 : n > 0.9 ? 3 : 2);
      } else {
        c = R(ramp, y % 5 === 0 ? 3 : y % 5 === 4 ? 0 : 2);
        if (y % 5 === 4 && x % 7 === 3) c = R(ramp, 1);
      }
      p.set(x, y, c);
    }
  return p;
}

/** A sash window in a wall tile: trim, two panes of sky glass, a sill, and a dressing. */
export function windowTile(kind: Wall, dressing: 'plain' | 'curtains' | 'shutters' | 'flowers'): Pixels {
  const p = wall(kind);
  const trim = R('stone', 3);
  if (dressing === 'shutters') {
    const color = kind === 'siding' ? R('brick', 1) : R('siding', 1);
    for (const x of [2, 15]) {
      p.rect(x, 3, 3, 13, color);
      for (let y = 5; y < 15; y += 2) p.rect(x, y, 3, 1, R('siding', 0));
    }
  }
  p.rect(4, 3, 12, 14, R('stone', 0));
  p.rect(5, 4, 10, 12, trim);
  for (let y = 0; y < 10; y++) {
    const c = R('glass', y < 3 ? 2 : y < 6 ? 1 : 0);
    p.rect(6, 5 + y, 8, 1, y === 0 ? R('glass', 2) : c);
  }
  p.rect(6, 5, 8, 10, R('glass', 1));
  for (let y = 0; y < 10; y++) for (let x = 0; x < 8; x++) if ((x + y) % 6 === 0 && y < 6) p.set(6 + x, 5 + y, R('glass', 2));
  for (let y = 0; y < 10; y++) for (let x = 0; x < 8; x++) if (y > 6 && (x + y) % 2 === 0) p.set(6 + x, 5 + y, R('glass', 0));
  p.rect(9, 5, 2, 10, trim);
  p.rect(6, 9, 8, 1, trim);
  p.rect(3, 16, 14, 2, R('stone', 2));
  p.rect(3, 18, 14, 1, R('stone', 0));
  if (dressing === 'curtains') {
    p.rect(6, 5, 2, 7, R('flag', 1));
    p.rect(12, 5, 2, 7, R('flag', 1));
    p.rect(6, 5, 8, 1, R('flag', 0));
  }
  if (dressing === 'flowers') {
    p.rect(3, 16, 14, 3, R('wood', 1));
    p.rect(3, 16, 14, 1, R('wood', 2));
    for (let x = 4; x < 16; x += 2) {
      p.set(x, 15, R('leaf', 3));
      p.set(x + (x % 4 === 0 ? 0 : 1), 14, R('bloom', x % 3));
    }
  }
  return p;
}

/** A front door under a stone lintel; `paint` colors it. */
export function doorTile(kind: Wall, paint: RampName): Pixels {
  const p = wall(kind);
  p.rect(3, 0, 14, 3, R('stone', 2));
  p.rect(3, 3, 14, 1, R('stone', 0));
  p.rect(4, 4, 12, 16, R('stone', 1));
  p.rect(5, 4, 10, 16, R(paint, 1));
  p.rect(5, 4, 10, 1, R(paint, 2));
  for (const [x, y] of [[6, 7], [11, 7], [6, 13], [11, 13]]) {
    p.rect(x, y, 3, 4, R(paint, 0));
    p.rect(x, y, 3, 1, R(paint, 2));
  }
  p.set(13, 12, C.gold);
  p.rect(2, 19, 16, 1, R('stone', 2));
  return p;
}

/** The sign over a shop: a painted board, full height, the name in gold. */
export function signBoard(text: string, w: number, x0: number, scale = 2): Pixels {
  const board = new Pixels(w * 20, 20, R('awnB', 0));
  board.rect(0, 0, w * 20, 20, C.navy);
  board.frame(1, 1, w * 20 - 2, 18, C.gold);
  board.frame(3, 3, w * 20 - 6, 14, R('wood', 1));
  const width = text.length * 4 * scale - scale;
  micro(board, Math.round((w * 20 - width) / 2) + x0, 5, text, C.gold, scale);
  return board;
}

type Awning = 'awnR' | 'awnG' | 'awnB';
/** A shop window under a striped scalloped awning; the goods change with `goods`. */
export function shopWindow(awning: Awning, goods: 'cups' | 'books' | 'tools'): Pixels {
  const p = new Pixels(20, 20, R('stone', 0));
  for (let y = 7; y < 20; y++) p.rect(1, y, 18, 1, R('glass', y < 11 ? 2 : y < 15 ? 1 : 0));
  p.frame(0, 6, 20, 14, R('stone', 3));
  for (let y = 12; y < 19; y++) for (let x = 2; x < 18; x++) if ((x + y) % 7 === 0) p.set(x, y, R('glass', 2));
  p.rect(1, 17, 18, 2, R('wood', 1));
  p.rect(1, 17, 18, 1, R('wood', 2));
  if (goods === 'cups')
    for (const x of [3, 8, 13]) {
      p.rect(x, 13, 4, 4, C.cream);
      p.rect(x + 4, 14, 1, 2, C.cream);
      p.rect(x, 13, 4, 1, R('wood', 1));
    }
  if (goods === 'books')
    for (let x = 3; x < 17; x++) p.rect(x, 12 + (x % 3), 1, 5 - (x % 3), R('flag', x % 4));
  if (goods === 'tools') {
    p.rect(4, 11, 1, 6, R('iron', 2));
    p.rect(3, 11, 3, 1, R('iron', 2));
    p.rect(9, 13, 6, 1, R('iron', 2));
    p.rect(14, 12, 1, 4, R('wood', 2));
    p.rect(7, 15, 4, 2, R('flag', 1));
  }
  for (let x = 0; x < 20; x++) {
    p.rect(x, 0, 1, 5, Math.floor(x / 5) % 2 ? R(awning, 1) : R(awning, 0));
    const scallop = x % 5 === 0 || x % 5 === 4 ? 5 : 6;
    p.rect(x, 5, 1, scallop - 5 + 1, Math.floor(x / 5) % 2 ? R(awning, 1) : R(awning, 0));
  }
  p.rect(0, 0, 20, 1, R('stone', 0));
  for (let x = 0; x < 20; x++) p.set(x, 7, R('stone', 0));
  return p;
}

/** A shop's glass door, under the same awning. */
export function shopDoor(awning: Awning): Pixels {
  const p = shopWindow(awning, 'cups');
  p.rect(4, 7, 12, 13, R('wood', 1));
  p.rect(5, 8, 10, 11, R('glass', 1));
  for (let y = 0; y < 5; y++) p.rect(5, 8 + y, 10, 1, R('glass', y < 2 ? 2 : 1));
  p.rect(9, 8, 2, 11, R('wood', 2));
  p.set(8, 14, C.gold);
  p.set(11, 14, C.gold);
  p.rect(5, 15, 10, 4, R('glass', 0));
  p.rect(1, 19, 18, 1, R('stone', 1));
  return p;
}

/** A cornice: a stone cap with its shadow over the wall. */
export function cornice(kind: Wall): Pixels {
  const p = wall(kind);
  p.rect(0, 0, 20, 4, R('stone', 3));
  p.rect(0, 0, 20, 1, C.white);
  p.rect(0, 4, 20, 1, R('stone', 1));
  p.rect(0, 5, 20, 2, R('stone', 2));
  p.rect(0, 7, 20, 2, R(WALL_RAMP[kind], 0));
  for (let x = 2; x < 20; x += 5) p.rect(x, 5, 2, 2, R('stone', 3));
  return p;
}

/** The car's row: a stone footing, the sidewalk pavers, the curb, and the far lane's asphalt. */
export function sidewalk(variant: 0 | 1 = 0): Pixels {
  const p = new Pixels(20, 20, 0);
  p.rect(0, 0, 20, 3, R('stone', 1));
  p.rect(0, 0, 20, 1, R('stone', 2));
  p.rect(0, 2, 20, 1, R('stone', 0));
  for (let y = 3; y < 11; y++) for (let x = 0; x < 20; x++) p.set(x, y, R('stone', hash(x, y, 2) < 0.12 ? 1 : 2));
  p.rect(0, 6, 20, 1, R('stone', 1));
  p.rect(5, 3, 1, 3, R('stone', 1));
  p.rect(15, 7, 1, 4, R('stone', 1));
  if (variant === 1) p.line(8, 3, 10, 10, R('stone', 0));
  p.rect(0, 11, 20, 1, R('stone', 3));
  p.rect(0, 12, 20, 3, R('stone', 1));
  p.rect(0, 12, 20, 1, R('stone', 2));
  p.rect(0, 15, 20, 1, R('asphalt', 0));
  asphalt(p, 16, 20, 11);
  return p;
}

/** Asphalt with grit and worn patches, in the rows y0 to y1 of a tile. */
function asphalt(p: Pixels, y0: number, y1: number, salt: number): void {
  for (let y = y0; y < y1; y++)
    for (let x = 0; x < 20; x++) p.set(x, y, R('asphalt', hash(x, y, salt) < 0.1 ? 2 : hash(x, y, salt + 1) < 0.25 ? 0 : 1));
}

/** The far lane the car stands on: asphalt, a drain at the curb in one variant, and the yellow center dashes. */
export function roadTop(drain = false): Pixels {
  const p = new Pixels(20, 20, 0);
  asphalt(p, 0, 20, 5);
  if (drain) {
    p.rect(5, 0, 10, 2, R('iron', 0));
    for (let x = 6; x < 15; x += 2) p.rect(x, 0, 1, 2, R('iron', 2));
  }
  p.rect(3, 12, 14, 3, R('paint', 0));
  p.rect(3, 12, 14, 1, R('paint', 1));
  return p;
}

/** The near lane. */
export function roadLow(): Pixels {
  const p = new Pixels(20, 20, 0);
  asphalt(p, 0, 20, 9);
  p.rect(0, 14, 20, 1, R('asphalt', 3));
  for (let x = 4; x < 20; x += 9) p.set(x, 14, R('asphalt', 1));
  return p;
}

/** The near side: a white edge line, the curb, and the near sidewalk's pavers. */
export function nearSide(): Pixels {
  const p = new Pixels(20, 20, 0);
  asphalt(p, 0, 6, 12);
  p.rect(0, 1, 20, 1, C.white);
  for (let x = 1; x < 20; x += 6) p.set(x, 1, R('asphalt', 3));
  p.rect(0, 6, 20, 1, R('stone', 0));
  p.rect(0, 7, 20, 3, R('stone', 2));
  p.rect(0, 7, 20, 1, R('stone', 3));
  for (let y = 10; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, R('stone', hash(x, y, 3) < 0.12 ? 1 : 2));
  p.rect(0, 14, 20, 1, R('stone', 1));
  p.rect(6, 10, 1, 4, R('stone', 1));
  p.rect(14, 15, 1, 5, R('stone', 1));
  return p;
}

/** The foreground: the near pavers under a low flowering hedge, in front of everything. */
export function foreground(): Pixels {
  const p = new Pixels(20, 20, 0);
  for (let y = 0; y < 8; y++) for (let x = 0; x < 20; x++) p.set(x, y, R('stone', hash(x, y, 13) < 0.12 ? 1 : 2));
  p.rect(0, 0, 20, 1, R('stone', 1));
  p.rect(9, 1, 1, 7, R('stone', 1));
  p.rect(0, 8, 20, 1, R('leaf', 0));
  for (let y = 9; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      const n = hash(x, y, 14);
      p.set(x, y, R('leaf', y < 12 ? (n < 0.4 ? 3 : 2) : y < 16 ? (n < 0.3 ? 2 : 1) : n < 0.2 ? 1 : 0));
      if (n > 0.93 && y < 17) p.set(x, y, R('bloom', (x + y) % 3));
    }
  return p;
}

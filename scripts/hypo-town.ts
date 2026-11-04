// The street scenery for levels 2 and 3, painted as one wide picture and cut into a few dozen blocks:
// houses and shops with signs and bunting, parks with trees and lamps, a dithered sky and far
// skyline, the sidewalk, curb and a two-lane road. Everything repeats on the 20-pixel grid, so the
// picture dedupes to a small block set. Layout and painting ideas follow Tune-Up's parade street
// (Lewis Moten, MIT; see NOTICE.md).
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/drawing';
import { C } from './hypo-art.ts';
import { micro } from '../assets/source/teddy/art/draw.ts';
import { R } from './hypo-colors.ts';
import { cornice, doorTile, hash, foreground, nearSide, roadLow, roadTop, shopDoor, shopWindow, sidewalk, signBoard, skyAt, windowTile, type Wall } from './hypo-tiles.ts';

/** The car's row (its feet touch the road below it) and the first map row the picture covers. */
export const ROW = 95;
const TOP = ROW - 5;
const ROWS = 10;
const COLS = 100;
const HORIZON = 5 * 20;

type Awning = 'awnR' | 'awnG' | 'awnB';
type Lot =
  | { at: number; kind: 'house'; wall: Wall; floors: number }
  | { at: number; kind: 'shop'; wall: Wall; floors: number; name: string; awning: Awning; goods: 'cups' | 'books' | 'tools' }
  | { at: number; kind: 'park'; trees: 'oak' | 'blossom' | 'plain' | 'cross' | 'finish' };
/** Every lot is four blocks wide, so a repeated lot repeats its blocks exactly. */
const LOT_W = 4;

const WALLS: Wall[] = ['brick', 'stucco', 'siding', 'blue'];
const SHOPS = [
  { name: 'CAFE', awning: 'awnR', goods: 'cups' },
  { name: 'BOOKS', awning: 'awnG', goods: 'books' },
  { name: 'TOOLS', awning: 'awnB', goods: 'tools' },
] as const;
const PARKS = ['oak', 'blossom', 'oak', 'blossom', 'plain'] as const;
/** The lot sequence: house, shop, park, repeating; two parks meet at the turtle crossing and three at the finish. */
const KINDS = 'HSPHSPHSPHSPPHSPHSPHSPPPH';
/** The street is the Control Run's; the race is the tricycle trial's, the same lots in other walls, shops and trees. */
export type TownKind = 'street' | 'race';
function makeLots(kind: TownKind): Lot[] {
  const race = kind === 'race';
  let shopCount = race ? 2 : 0;
  return [...KINDS].map((k, i): Lot => {
    const at = i * LOT_W;
    const wall = WALLS[(i * 3 + 1 + (race ? 2 : 0)) % 4];
    const floors = [3, 3, 4, 3, 5, 3, 4, 3][(i + (race ? 3 : 0)) % 8];
    if (k === 'H') return { at, kind: 'house', wall, floors };
    if (k === 'S') return { at, kind: 'shop', wall: wall === 'siding' ? 'brick' : wall, floors, ...SHOPS[shopCount++ % 3] };
    const trees = i === 11 ? (race ? 'blossom' : 'cross') : i === 22 ? 'finish' : i === 12 || i >= 21 ? 'plain' : PARKS[(i + (race ? 2 : 0)) % 5];
    return { at, kind: 'park', trees };
  });
}
const LOTS: Lot[] = makeLots('street');
export const TOWN_LOTS = LOTS;

export class Scene {
  readonly pic: Pixels;
  constructor(rows = ROWS) {
    this.pic = new Pixels(COLS * 20, rows * 20, 0);
  }
  /** Put a 20x20 block at tile (tx, ty), ty counted from the picture's top. */
  put(tx: number, ty: number, tile: Pixels): void {
    this.pic.blit(tile, tx * 20, ty * 20);
  }
  /** Draw `src` with transparency (255) at pixel (x, y). */
  sprite(src: Pixels, x: number, y: number): void {
    this.pic.blit(src, x, y, 255);
  }
}

function sky(s: Scene): void {
  for (let y = 0; y < ROWS * 20; y++) for (let x = 0; x < COLS * 20; x++) s.pic.px[y * COLS * 20 + x] = skyAt(x, y, HORIZON);
}

/** A cloud: overlapping soft lumps, white on top and shaded under, dithered at its edge. */
export function cloud(s: Scene, x: number, y: number, w: number): void {
  const lumps: [number, number, number][] = [
    [w * 0.2, 9, 7],
    [w * 0.4, 5, 9],
    [w * 0.62, 7, 10],
    [w * 0.82, 10, 6],
    [w * 0.5, 11, 8],
  ];
  for (let py = 0; py < 22; py++)
    for (let px = 0; px < w + 8; px++) {
      let hit = false;
      let shade = 2;
      for (const [cx, cy, r] of lumps) {
        const d = Math.hypot(px - cx, (py - cy) * 1.25);
        if (d < r) {
          hit = true;
          shade = Math.min(shade, py - cy > r * 0.25 ? 0 : py - cy > -r * 0.2 ? 1 : 2);
        }
      }
      if (hit) s.pic.set(x + px, y + py, R('cloud', shade));
    }
}

/** The far skyline behind the houses: hazy blue towers dotted with windows, in 20-pixel modules. */
function skyline(s: Scene, x0: number, w: number, bottom: number): void {
  for (let tx = x0; tx < x0 + w; tx++) {
    const h = [40, 80, 40, 80][tx % 4];
    for (let y = bottom - h; y < bottom; y++)
      for (let x = tx * 20; x < tx * 20 + 20; x++) {
        const lx = x % 20;
        const win = lx % 6 === 3 && lx > 2 && lx < 17 && y % 8 === 3 && y > bottom - h + 5;
        const shade = lx > 16 ? 0 : lx === 0 ? 2 : y < bottom - h + 2 ? 2 : 1;
        s.pic.set(x, y, R('haze', win ? 2 : shade));
      }
    if (tx % 4 === 1) s.pic.rect(tx * 20 + 9, bottom - h - 8, 1, 8, R('haze', 0));
  }
}

function lamp(s: Scene, x: number, groundY: number): void {
  const top = groundY - 54;
  s.pic.rect(x, top + 6, 3, 54, R('iron', 1));
  s.pic.rect(x - 1, groundY - 8, 5, 8, R('iron', 0));
  s.pic.rect(x - 1, groundY - 8, 5, 1, R('iron', 2));
  s.pic.line(x + 1, top + 6, x + 1, top + 3, R('iron', 1));
  s.pic.rect(x - 3, top, 9, 2, R('iron', 0));
  s.pic.rect(x - 2, top + 2, 7, 7, R('glow', 0));
  s.pic.rect(x - 1, top + 3, 5, 5, R('glow', 1));
  s.pic.rect(x - 2, top + 9, 7, 1, R('iron', 0));
  s.pic.rect(x - 1, top - 2, 5, 2, R('iron', 1));
}

/** A round-topped tree: a trunk with roots and a crown of lit lumps. */
export function tree(s: Scene, cx: number, groundY: number, kind: 'oak' | 'blossom' | 'small'): void {
  const h = kind === 'small' ? 30 : 50;
  const r = kind === 'small' ? 12 : 17;
  s.pic.rect(cx - 2, groundY - h + 12, 5, h - 12, R('wood', 1));
  s.pic.rect(cx - 2, groundY - h + 12, 2, h - 12, R('wood', 2));
  s.pic.rect(cx + 2, groundY - h + 12, 1, h - 12, R('wood', 0));
  s.pic.rect(cx - 3, groundY - 3, 7, 3, R('wood', 1));
  const lumps: [number, number, number][] = [
    [cx, groundY - h, r],
    [cx - r * 0.7, groundY - h + 8, r * 0.7],
    [cx + r * 0.75, groundY - h + 7, r * 0.72],
    [cx + 2, groundY - h - r * 0.6, r * 0.6],
  ];
  for (let y = groundY - h - r * 1.4; y < groundY - h + r * 1.2; y++)
    for (let x = cx - r * 1.8; x < cx + r * 1.8; x++) {
      let level = -1;
      for (const [lx, ly, lr] of lumps) {
        const d = Math.hypot(x - lx, y - ly);
        if (d <= lr) level = Math.max(level, 1 - d / lr + (lx - x) * 0.012 + (ly - y) * 0.018 + 0.2);
      }
      if (level < 0) continue;
      const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5][((y | 0) & 3) * 4 + ((x | 0) & 3)] / 16;
      const idx = Math.max(0, Math.min(4, Math.floor(level * 4 + (bayer - 0.5) * 1.4)));
      s.pic.set(Math.round(x), Math.round(y), R('leaf', idx));
      if (kind === 'blossom' && hash(Math.round(x), Math.round(y), 8) < 0.1) s.pic.set(Math.round(x), Math.round(y), R('bloom', hash(Math.round(x), Math.round(y), 9) < 0.5 ? 0 : 1));
    }
}

/** A string of pennants sagging between two points. */
function bunting(s: Scene, x0: number, x1: number, y: number, sag: number): void {
  const dy = (x: number) => Math.round(y + sag * (1 - Math.pow((2 * (x - x0)) / (x1 - x0) - 1, 2)));
  for (let x = x0; x <= x1; x++) s.pic.set(x, dy(x), R('iron', 0));
  for (let x = x0 + 3, n = 0; x < x1 - 2; x += 7, n++)
    for (let k = 0; k < 6; k++) s.pic.rect(x + (k >> 1), dy(x) + 1 + k, 5 - k, 1, R('flag', n % 4));
}

const DRESSING: Record<Wall, 'curtains' | 'shutters'> = { brick: 'curtains', stucco: 'curtains', siding: 'shutters', blue: 'shutters' };
const DOOR: Record<Wall, 'wood' | 'brick' | 'siding' | 'blue'> = { brick: 'wood', stucco: 'brick', siding: 'blue', blue: 'siding' };
const GROUND = 4;
const FEET = (GROUND + 1) * 20 + 9;

/** A parking meter on the near sidewalk. */
function meter(s: Scene, x: number, y: number): void {
  s.pic.rect(x, y - 16, 2, 16, R('iron', 1));
  s.pic.rect(x - 2, y - 24, 6, 8, R('iron', 2));
  s.pic.rect(x - 1, y - 23, 4, 4, R('glass', 2));
  s.pic.rect(x - 1, y - 18, 4, 1, R('flag', 0));
}

/** A trash bin with a lid. */
function bin(s: Scene, x: number, y: number): void {
  s.pic.rect(x, y - 13, 10, 13, R('siding', 1));
  s.pic.rect(x, y - 13, 10, 2, R('siding', 2));
  for (const bx of [x + 3, x + 6]) s.pic.rect(bx, y - 10, 1, 9, R('siding', 0));
  s.pic.rect(x - 1, y - 15, 12, 2, R('iron', 1));
}

function bench(s: Scene, x: number, y: number): void {
  s.pic.rect(x, y - 9, 22, 2, R('wood', 2));
  s.pic.rect(x, y - 6, 22, 2, R('wood', 2));
  s.pic.rect(x, y - 3, 22, 3, R('wood', 1));
  for (const bx of [x + 1, x + 19]) s.pic.rect(bx, y - 9, 2, 12, R('iron', 1));
}

function hydrant(s: Scene, x: number, y: number): void {
  s.pic.rect(x, y - 9, 6, 9, R('flag', 0));
  s.pic.rect(x + 1, y - 11, 4, 2, R('flag', 0));
  s.pic.rect(x - 1, y - 6, 8, 2, R('flag', 0));
  s.pic.rect(x + 1, y - 9, 1, 8, C.white);
  s.pic.rect(x - 1, y - 1, 8, 1, R('iron', 0));
}

function paintLot(s: Scene, lot: Lot): void {
  const gx = (n: number) => (lot.at + n) * 20;
  if (lot.kind === 'park') {
    for (let x = lot.at; x < lot.at + LOT_W; x++) {
      // a low hedge along the back of the park
      const hedge = s.pic.crop(x * 20, GROUND * 20, 20, 20);
      for (let y = 12; y < 20; y++)
        for (let px = 0; px < 20; px++) hedge.set(px, y, R('leaf', y === 12 ? 3 : hash(px, y, 4) < 0.2 ? 2 : y > 17 ? 0 : 1));
      s.put(x, GROUND, hedge);
    }
    if (lot.trees === 'oak') {
      tree(s, gx(2), FEET, 'oak');
      lamp(s, gx(0) + 6, FEET);
      bunting(s, gx(0) + 7, gx(4) - 1, FEET - 49, 9);
    }
    if (lot.trees === 'blossom') {
      tree(s, gx(1) + 12, FEET, 'blossom');
      hydrant(s, gx(3) + 4, FEET + 2);
    }
    if (lot.trees === 'cross') {
      // the turtle crossing: the sign's pole at the left, a zebra crossing painted on the road
      s.pic.rect(gx(1) - 3, 2 * 20, 3, FEET - 40, R('iron', 1));
      s.pic.rect(gx(1) - 3, 2 * 20, 1, FEET - 40, R('iron', 2));
      for (let x = 1; x <= 3; x++) for (let bar = 0; bar < 20; bar += 6) s.pic.rect((lot.at + x) * 20 + bar + 1, 6 * 20 + 1, 4, 40, C.white);
    }
    if (lot.trees === 'finish') {
      lamp(s, gx(0) + 8, FEET);
      lamp(s, gx(3) + 6, FEET);
      // a checkered banner hung between the lamps, FINISH across it, and a mat on the sidewalk
      const top = FEET - 53;
      const banner = new Pixels(gx(3) - gx(0) - 8 - 3, 16, C.white);
      for (let y = 0; y < 16; y++) for (let x = 0; x < banner.w; x++) if (y < 3 || y > 12) banner.set(x, y, (x >> 2) % 2 === (y < 3 ? 0 : 1) ? C.black : C.white);
      banner.rect(0, 3, banner.w, 10, C.navy);
      micro(banner, Math.floor((banner.w - 46) / 2), 4, 'FINISH', C.gold, 2);
      s.sprite(banner, gx(0) + 11, top);
      const line = new Pixels(20, 20, 0);
      line.px.set(s.pic.crop(gx(2), 6 * 20, 20, 20).px);
      for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) line.set(x, y, ((x >> 2) + (y >> 2)) % 2 ? C.black : C.white);
      s.put(lot.at + 2, 6, line);
    }
    if (lot.trees === 'plain') {
      bench(s, gx(1) + 4, FEET + 3);
      lamp(s, gx(3) + 6, FEET);
    }
    return;
  }
  const door = 2;
  for (let f = 0; f < lot.floors; f++) {
    const row = GROUND - f;
    for (let i = 0; i < LOT_W; i++) {
      let tile: Pixels;
      if (f === lot.floors - 1) tile = cornice(lot.wall);
      else if (f === 0 && lot.kind === 'shop') tile = i === door ? shopDoor(lot.awning) : shopWindow(lot.awning, lot.goods);
      else if (f === 0) tile = i === door ? doorTile(lot.wall, DOOR[lot.wall] === 'wood' ? 'wood' : DOOR[lot.wall] === 'brick' ? 'brick' : DOOR[lot.wall] === 'siding' ? 'siding' : 'blue') : windowTile(lot.wall, DRESSING[lot.wall]);
      else tile = windowTile(lot.wall, DRESSING[lot.wall]);
      s.put(lot.at + i, row, tile);
    }
  }
  // the shop's name on a painted board across the frieze
  if (lot.kind === 'shop') s.sprite(signBoard(lot.name, LOT_W, 0), gx(0), (GROUND - 1) * 20);
}

export interface Town {
  /** Unique 20x20 pictures; index is the block id (0 is the plain top sky). */
  tiles: Pixels[];
  /** Block ids for the whole 100x100 map. */
  map: Uint16Array;
}

/** Paint the whole street and cut it into blocks, adding any extra pictures via `extra`. */
export function paintTown(kind: TownKind = 'street'): { scene: Scene; cut: () => Town } {
  const s = new Scene();
  sky(s);
  // clouds at the top and a far skyline behind the houses
  for (const [x, y, w] of [[60, 90, 60], [460, 90, 60], [860, 90, 60], [1260, 90, 60], [1660, 90, 60], [1900, 90, 60]] as const) cloud(s, x, y, w);
  skyline(s, 0, COLS, (GROUND + 1) * 20);
  // the sidewalk and road run the full width
  for (let x = 0; x < COLS; x++) {
    s.put(x, 5, sidewalk(x % 6 === 2 ? 1 : 0));
    s.put(x, 6, roadTop(x % 17 === 6));
    s.put(x, 7, roadLow());
    s.put(x, 8, nearSide());
    s.put(x, 9, foreground());
    if (x % 12 === 3) meter(s, x * 20 + 9, 8 * 20 + 19);
    if (x % 12 === 9) bin(s, x * 20 + 4, 8 * 20 + 19);
  }
  for (const lot of kind === 'street' ? LOTS : makeLots(kind)) paintLot(s, lot);
  return {
    scene: s,
    cut: () => {
      const tiles: Pixels[] = [];
      const seen = new Map<string, number>();
      const id = (tile: Pixels): number => {
        const key = Buffer.from(tile.px).toString('latin1');
        let n = seen.get(key);
        if (n === undefined) {
          n = tiles.length;
          tiles.push(tile);
          seen.set(key, n);
        }
        return n;
      };
      id(s.pic.crop(0, 0, 20, 20));
      const map = new Uint16Array(100 * 100);
      for (let y = 0; y < 100; y++) for (let x = 0; x < COLS; x++) map[y * 100 + x] = y < TOP ? 0 : id(s.pic.crop(x * 20, (y - TOP) * 20, 20, 20));
      return { tiles, map };
    },
  };
}
void C;

let cached: Pixels | undefined;
/** A 320x200 view of the street, as the engine shows it, starting at block column `tile`. */
export function townView(tile: number): Pixels {
  cached ??= paintTown().scene.pic;
  return cached.crop(tile * 20, 0, 320, ROWS * 20);
}

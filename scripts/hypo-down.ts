// Level 11, Thirty Downhill, the finale: a long parade route that only goes down. The 30 mph car falls one pixel for
// every six across (the same shear as the hill's downhill), and the road art follows that very line. A parade float shaped
// like a giant sneaker (nine monsters in lockstep, clowns waving from it) rolls down the lane below at a set 25 mph, so a
// car that holds Right passes it. Nothing hurts. The speedometer above the car reads 30 the whole way.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/drawing';
import { emptyBlock, serializeBlocks, type Block } from '@lewismoten/gamemaker-sandbox-tools/formats/blocks';
import { newMap, reindexMonsters, serializeMap } from '@lewismoten/gamemaker-sandbox-tools/formats/map';
import { newMonsterSet, serializeMonsters } from '@lewismoten/gamemaker-sandbox-tools/formats/monster';
import { micro } from '../assets/source/teddy/art/draw.ts';
import { C, palette, timeOfDay } from './hypo-art.ts';
import { R } from './hypo-colors.ts';
import { band, bank, verge } from './hypo-hill.ts';
import { floatCells } from './hypo-float.ts';
import { corner, mon } from './hypo-monsters.ts';
import { cloud, ROW, Scene, tree } from './hypo-town.ts';
import { skyAt } from './hypo-tiles.ts';

const FLAT = ROW - 3; // the car's row on the flat at the bottom, three rows clear of the map's end
export const DOWN = { startX: 9, startY: FLAT - 13, drop: 13, finishX: 87, floatSpeed: 5, floatLegs: [[36, 6], [78, 13]] as [number, number][] };
const DROP_PX = DOWN.drop * 20;
const START_PX = DOWN.startX * 20;
const FIRST_ROW = DOWN.startY - 6;
const ROWS = 100 - FIRST_ROW;
const BASE = (FLAT - FIRST_ROW) * 20; // the sidewalk's top edge on the flat, in picture pixels

/** How many pixels the road stands above the flat under the car whose left edge is at `x`. */
export function downRise(x: number): number {
  return Math.max(0, DROP_PX - Math.max(0, Math.floor((x - START_PX) / 6)));
}
const rise = (x: number): number => downRise(x - 10);

/** A cheering spectator on the bank: shirt, face, one arm up with a small flag. */
function cheerer(s: Scene, x: number, groundY: number, shirt: number, flag: number): void {
  s.pic.rect(x, groundY - 8, 5, 8, shirt);
  s.pic.rect(x + 1, groundY - 12, 3, 3, C.tan);
  s.pic.rect(x + 1, groundY - 13, 3, 1, R('wood', 1));
  s.pic.line(x + 4, groundY - 8, x + 7, groundY - 14, shirt);
  s.pic.line(x + 7, groundY - 15, x + 7, groundY - 20, R('iron', 1));
  s.pic.rect(x + 8, groundY - 20, 4, 3, flag);
  s.pic.rect(x - 1, groundY - 1, 2, 1, C.black);
  s.pic.rect(x + 3, groundY - 1, 2, 1, C.black);
}

/** A little cottage in the valley below the road, 40 wide: stucco walls, a tile roof and chimney, a door and two windows. */
function cottage(s: Scene, x: number, groundY: number): void {
  s.pic.rect(x, groundY - 16, 40, 16, R('stucco', 2));
  s.pic.rect(x, groundY - 2, 40, 2, R('stucco', 0));
  for (let k = 0; k < 11; k++) s.pic.rect(x - 3 + k, groundY - 17 - k, 46 - 2 * k, 1, k % 2 ? R('tile', 1) : R('tile', 2));
  s.pic.rect(x + 29, groundY - 32, 4, 12, R('brick', 1));
  s.pic.rect(x + 17, groundY - 11, 6, 11, R('wood', 1));
  for (const wx of [x + 4, x + 29]) {
    s.pic.rect(wx, groundY - 12, 7, 6, R('glass', 1));
    s.pic.rect(wx + 3, groundY - 12, 1, 6, R('stone', 3));
    s.pic.rect(wx - 1, groundY - 6, 9, 1, R('wood', 1));
  }
}

/** A round speed-limit sign on a post: 30, in red and white. */
function limit(s: Scene, x: number, groundY: number): void {
  s.pic.rect(x + 7, groundY - 40, 2, 40, R('iron', 1));
  s.pic.disc(x + 8, groundY - 46, 9, R('flag', 0));
  s.pic.disc(x + 8, groundY - 46, 7, C.white);
  micro(s.pic, x + 3, groundY - 49, '30', C.black, 2);
}

/** A sign on two posts planted at pixel column x on the sidewalk. */
function post(s: Scene, x: number, text: string): void {
  const w = text.length * 8 + 12;
  const y = BASE - rise(x + w / 2) - 62;
  for (const px of [x + 3, x + w - 5]) s.pic.rect(px, y + 20, 2, 42, R('iron', 1));
  const board = new Pixels(w, 20, C.navy);
  board.frame(0, 0, w, 20, C.gold);
  board.frame(2, 2, w - 4, 16, R('wood', 1));
  micro(board, 6, 7, text, C.gold, 2);
  s.pic.blit(board, x, y);
}

export function paintDown(): Scene {
  const s = new Scene(ROWS);
  const W = 2000;
  for (let y = 0; y < ROWS * 20; y++) for (let x = 0; x < W; x++) s.pic.px[y * W + x] = skyAt(x, y, 120);
  for (const x of [200, 1000]) cloud(s, x, 30 + ((x / 100) % 3) * 10, 60);
  const b = band();
  for (let x = 0; x < W; x++) {
    const top = BASE - 40 - rise(x);
    for (let y = 0; y < b.h; y++) s.pic.px[(top + y) * W + x] = b.px[y * 20 + (x % 20)];
    for (let y = top + b.h; y < ROWS * 20; y++) s.pic.px[y * W + x] = verge(x, y);
  }
  // everything on the bank repeats every 240 pixels (two whole-block shifts of 40 pixels), so the picture still dedupes
  const bankTop = (x: number) => BASE - 40 - rise(x) + 12;
  for (let x = 420; x < 1700; x += 240) tree(s, x, bankTop(x), 'oak');
  const shirts = [R('flag', 1), R('flag', 2), R('flag', 3), R('flag', 0)];
  for (let x = 330, k = 0; x < 1700; x += 240, k++) {
    cheerer(s, x, bankTop(x) + 9, shirts[k % 2], shirts[2]);
    cheerer(s, x + 14, bankTop(x + 14) + 9, shirts[3], shirts[1]);
  }
  for (let x = 300; x < 1600; x += 480) limit(s, x, BASE - 40 - rise(x) + 40);
  // parade barricades along the near edge of the road, and cottages in the valley below it
  for (let x = 0; x < W; x++) {
    const edge = BASE - 40 - rise(x) + 100;
    const striped = x % 20 < 10 ? R('flag', 0) : C.white;
    s.pic.px[(edge + 2) * W + x] = striped;
    s.pic.px[(edge + 3) * W + x] = striped;
    s.pic.px[(edge + 7) * W + x] = striped;
    if (x % 20 < 2) for (let y = 1; y < 12; y++) s.pic.px[(edge + y) * W + x] = R('iron', 1);
  }
  for (let x = 390; x < 1700; x += 240) cottage(s, x, BASE - 40 - rise(x) + 100 + 60);
  post(s, START_PX + 70, 'START');
  post(s, DOWN.finishX * 20 - 140, 'FINISH');
  // the checkered finish line across both lanes
  for (let x = DOWN.finishX * 20 - 12; x < DOWN.finishX * 20 + 28; x++)
    for (let y = 0; y < 40; y++) s.pic.px[(BASE - rise(x) + 20 + y) * W + x] = ((x >> 2) + (y >> 2)) % 2 ? C.black : C.white;
  return s;
}

function cut(s: Scene): { tiles: Pixels[]; map: Uint16Array } {
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
  const map = new Uint16Array(100 * 100);
  const topTile = id(s.pic.crop(0, 0, 20, 20));
  for (let y = 0; y < 100; y++) for (let x = 0; x < 100; x++) map[y * 100 + x] = y < FIRST_ROW ? topTile : id(s.pic.crop(x * 20, (y - FIRST_ROW) * 20, 20, 20));
  return { tiles, map };
}

/** The float's start: the cell column where its sole centre falls best inside its 60-pixel picture, and that picture's row. */
function floatStart(): { x: number; top: number; rc: number } {
  let best = { x: 0, top: 0, rc: 0, score: 99 };
  for (let x = DOWN.startX + 3; x <= DOWN.startX + 10; x++) {
    const ref = 20 * FLAT - downRise(x * 20 + 30 - 10); // the car's line under the float's centre
    const rc = ((ref + 59) % 20) + 36;
    const score = Math.abs(rc - 46);
    if (score < best.score) best = { x, top: (ref + 59 - rc) / 20, rc, score };
  }
  return best;
}
export const FLOAT = floatStart();

export function downFiles(put: (name: string, data: Uint8Array) => void): void {
  const picture = cut(paintDown());
  if (picture.tiles.length > 150) throw new Error(`The downhill needs ${picture.tiles.length} art blocks; 150 fit`);
  const blocks = Array.from({ length: 150 }, (_, i) => emptyBlock(i));
  picture.tiles.forEach((tile, id) => blocks[id].pixels.set(tile.px));
  const map = newMap();
  map.blocks.set(picture.map);
  // the float: nine monsters in lockstep, the clowns' cells with two waving frames
  const cells = floatCells(FLOAT.rc);
  const mblk = Array.from({ length: 100 }, (_, i) => emptyBlock(i, true));
  let pics = 0;
  const known = new Map<string, number>();
  const picOf = (px: Uint8Array): number => {
    const key = Buffer.from(px).toString('latin1');
    let n = known.get(key);
    if (n === undefined) {
      n = pics++;
      mblk[n].pixels.set(px);
      known.set(key, n);
    }
    return n;
  };
  const set = newMonsterSet();
  let slot = 0;
  for (let i = 0; i < 9; i++) {
    const a = cells[0][i];
    const b = cells[1][i];
    if (a.px.every((c) => c === 255) && b.px.every((c) => c === 255)) continue;
    const same = a.px.every((c, k) => c === b.px[k]);
    const frames: [number, number][] = same ? [[picOf(a.px), 10]] : [[picOf(a.px), 7], [picOf(b.px), 7]];
    set[slot] = mon(frames, { power: 150, thru: 1, fly: 1, end: -1, towards: 0 }, DOWN.floatLegs.map(([x, y]) => corner(x, y, DOWN.floatSpeed)));
    map.monsters[slot] = { monnum: slot, status: 0, xtra: 0, curx: FLOAT.x + (i % 3), cury: FLOAT.top + Math.floor(i / 3), extra: 0 };
    slot++;
  }
  reindexMonsters(map);
  put('down.pal', timeOfDay(palette(3), 'gold'));
  put('down.map', serializeMap(map));
  put('down.bbl', serializeBlocks(blocks as Block[]));
  put('down.mon', serializeMonsters(set));
  put('down.mbl', serializeBlocks(mblk as Block[]));
  console.log(`The parade route uses ${picture.tiles.length} of 150 art blocks, the float ${slot} monsters and ${pics} pictures`);
}

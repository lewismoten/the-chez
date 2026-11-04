// Level 3, the hill: the street's road, sidewalk and a grassy bank, sheared along the car's own path.
// The 20 mph car climbs one pixel for every tick it moves four across (1 in 4); the 30 mph car, after the
// crest link swaps its file, falls one pixel for every six across (1 in 6). The road art follows the very
// same line pixel column by pixel column, so the car sits on it exactly. Trees, clouds and signs are
// placed so each one repeats a whole block's shift and the picture still cuts into few blocks.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/drawing';
import { emptyBlock, serializeBlocks, type Block } from '@lewismoten/gamemaker-sandbox-tools/formats/blocks';
import { newMap, serializeMap } from '@lewismoten/gamemaker-sandbox-tools/formats/map';
import { newMonsterSet, serializeMonsters } from '@lewismoten/gamemaker-sandbox-tools/formats/monster';
import { serializeCharacter } from '@lewismoten/gamemaker-sandbox-tools/formats/character';
import { micro } from '../assets/source/teddy/art/draw.ts';
import { C, palette } from './hypo-art.ts';
import { R } from './hypo-colors.ts';
import { carCharacter, carSprites } from './hypo-car.ts';
import { ROW } from './hypo-town.ts';
import { cloud, Scene, tree } from './hypo-town.ts';
import { hash, roadLow, roadTop, sidewalk, skyAt } from './hypo-tiles.ts';

/** Blocks: the start, the crest where the 30 mph car takes over, and the finish at the bottom. */
export const HILL = { startX: 3, crestX: 35, finishX: 83, startY: ROW - 1, crestY: ROW - 9, up: 4, down: 6 };
const CLIMB = (HILL.startY - HILL.crestY) * 20;
const START_PX = HILL.startX * 20;
const CREST_PX = HILL.crestX * 20;
const FIRST_ROW = ROW - 23;
const ROWS = 100 - FIRST_ROW;
const BASE = (HILL.startY - FIRST_ROW) * 20; // the sidewalk's top edge on the flat, in picture pixels

/** How many pixels the road has risen above the flat where the car (whose left edge is at `x`) stands. */
export function carRise(x: number): number {
  if (x <= START_PX) return 0;
  if (x < CREST_PX) return Math.floor((x - START_PX) / HILL.up);
  return Math.max(0, CLIMB - Math.floor((x - CREST_PX) / HILL.down));
}
/** The road's rise under pixel column x: the car's centre is ten pixels in from its left edge. */
const rise = (x: number): number => carRise(x - 10);

/** The grassy bank behind the sidewalk: two blocks tall, its top edge lit. */
function bank(): Pixels {
  const p = new Pixels(20, 40, 0);
  for (let y = 0; y < 40; y++)
    for (let x = 0; x < 20; x++) {
      const n = hash(x, y, 31);
      p.set(x, y, R('leaf', y < 3 ? 4 : y < 14 ? (n < 0.35 ? 3 : 2) : y < 28 ? (n < 0.3 ? 2 : 1) : n < 0.25 ? 1 : 0));
      if (y > 6 && y < 24 && n > 0.95) p.set(x, y, R('bloom', (x + y) % 3));
    }
  p.rect(0, 36, 20, 4, R('stone', 0));
  p.rect(0, 36, 20, 1, R('stone', 1));
  return p;
}

/** The darker verge under the road, repeating every four rows so a block's shift leaves it unchanged. */
const verge = (x: number, y: number): number => R('leaf', hash(x % 20, y % 4, 33) < 0.3 ? 1 : 0);

function band(): Pixels {
  const b = new Pixels(20, 100, 0);
  [bank(), sidewalk(0), roadTop(), roadLow()].reduce((y, tile) => {
    b.blit(tile, 0, y);
    return y + tile.h;
  }, 0);
  return b;
}

/** A road sign on two posts, planted at pixel column x on the sidewalk. */
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

export function paintHill(skip = ''): Scene {
  const s = new Scene(ROWS);
  const W = 2000;
  for (let y = 0; y < ROWS * 20; y++) for (let x = 0; x < W; x++) s.pic.px[y * W + x] = skyAt(x, y, 120);
  // clouds ride along the road, higher as the road climbs
  if (!skip.includes('c')) for (const x of [260, 1100]) cloud(s, x, BASE - rise(x) - 170, 60);
  // the road, bank and sidewalk: every pixel column of the flat band, lifted by the road's rise
  const b = band();
  for (let x = 0; x < W; x++) {
    const top = BASE - 40 - rise(x);
    for (let y = 0; y < b.h; y++) s.pic.px[(top + y) * W + x] = b.px[y * 20 + (x % 20)];
    for (let y = top + b.h; y < ROWS * 20; y++) s.pic.px[y * W + x] = verge(x, y);
  }
  // trees on the bank: repeats of one whole-block shift (every 160 px up the hill, every 240 down it)
  const bankTop = (x: number) => BASE - 40 - rise(x) + 12;
  if (!skip.includes('t')) for (let x = 140; x < CREST_PX - 60; x += 160) tree(s, x, bankTop(x), 'oak');
  if (!skip.includes('t')) for (let x = CREST_PX + 100; x < HILL.finishX * 20 - 120; x += 240) tree(s, x, bankTop(x), 'oak');
  if (!skip.includes('p')) {
    post(s, CREST_PX + 20, 'CREST');
    post(s, HILL.finishX * 20 - 100, 'FINISH');
  }
  return s;
}

/** The map's block id for each cell and the unique blocks, cut from the picture. */
export function cutHill(s: Scene): { tiles: Pixels[]; map: Uint16Array } {
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
  const top = id(s.pic.crop(0, 0, 20, 20));
  for (let y = 0; y < 100; y++) for (let x = 0; x < 100; x++) map[y * 100 + x] = y < FIRST_ROW ? top : id(s.pic.crop(x * 20, (y - FIRST_ROW) * 20, 20, 20));
  return { tiles, map };
}

export function hillFiles(put: (name: string, data: Uint8Array) => void): void {
  const cut = cutHill(paintHill());
  if (cut.tiles.length > 150) throw new Error(`The hill needs ${cut.tiles.length} art blocks; 150 fit`);
  const blocks = Array.from({ length: 150 }, (_, i) => emptyBlock(i));
  cut.tiles.forEach((tile, id) => blocks[id].pixels.set(tile.px));
  const map = newMap();
  map.blocks.set(cut.map);
  // Gravity stays off on the hill: the frames' own offsets carry the car along the road.
  put('hill.pal', palette(1));
  put('hill.map', serializeMap(map));
  put('hill.bbl', serializeBlocks(blocks as Block[]));
  put('hill.mon', serializeMonsters(newMonsterSet()));
  put('hill.mbl', serializeBlocks(Array.from({ length: 100 }, (_, i) => emptyBlock(i, true))));
  put('car20.chr', serializeCharacter(carCharacter(20, 'up')));
  put('car30.chr', serializeCharacter(carCharacter(30, 'down')));
  console.log(`The hill uses ${cut.tiles.length} of 150 art blocks`);
}

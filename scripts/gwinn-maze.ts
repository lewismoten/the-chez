// Gwinn's impossibly long shortcut: a safe four-way garden maze in native DOS game files.
import { emptyBlock, serializeBlocks } from '@lewismoten/gamemaker-sandbox-tools/formats/blocks';
import { emptyFrame, newCharacter, serializeCharacter } from '@lewismoten/gamemaker-sandbox-tools/formats/character';
import { newMap, serializeMap } from '@lewismoten/gamemaker-sandbox-tools/formats/map';
import { newMonsterSet, serializeMonsters } from '@lewismoten/gamemaker-sandbox-tools/formats/monster';
import { matchColor, parsePalette } from '@lewismoten/gamemaker-sandbox-tools/formats/palette';
import type { ChezInk } from '../assets/source/chez.ts';
import { POSES } from '../assets/source/teddy/sprites/teddy.ts';
import { stripeCar } from './stripe-car.ts';

export const MAZE_ROUTE = [
  { x: 8, y: 39 },
  { x: 22, y: 39 },
  { x: 22, y: 31 },
  { x: 44, y: 31 },
  { x: 44, y: 39 },
  { x: 62, y: 39 },
  { x: 62, y: 27 },
  { x: 78, y: 27 },
  { x: 78, y: 39 },
  { x: 84, y: 39 },
];
export const MAZE_PIECES = [
  [12, 39],
  [18, 39],
  [22, 35],
  [26, 31],
  [34, 31],
  [40, 31],
  [44, 35],
  [48, 39],
  [56, 39],
  [62, 35],
  [62, 29],
  [68, 27],
  [74, 27],
  [78, 31],
  [78, 35],
  [82, 39],
  [32, 25],
  [34, 25],
  [36, 25],
  [50, 45],
  [52, 45],
  [54, 45],
  [68, 33],
  [70, 33],
  [72, 33],
];

export function gwinnMaze(
  read: (name: string) => Uint8Array,
  put: (name: string, data: Uint8Array) => void,
  restored: number,
): { palette: Uint8Array; ink: ChezInk } {
  const palette = parsePalette(read('backyard.pal'));
  const c = (r: number, g: number, b: number) => matchColor(palette, r, g, b);
  const red = c(54, 11, 7),
    black = c(6, 8, 10),
    white = c(63, 61, 56),
    gold = c(63, 45, 12);
  const green = c(8, 26, 11),
    leaf = c(14, 35, 15),
    path = c(48, 41, 27),
    grain = c(44, 37, 24);
  const ink: ChezInk = {
    body: [red, red, red],
    trim: black,
    glass: [black, white],
    roof: black,
    tire: black,
    hub: white,
    bumper: black,
    lamp: gold,
    tail: red,
    pin: white,
    rim: white,
  };
  const blocks = Array.from({ length: 150 }, (_, i) => emptyBlock(i));
  for (const block of blocks) block.pixels.fill(path);
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      if ((x * 7 + y * 11) % 29 === 0) blocks[0].pixels[y * 20 + x] = grain;
      blocks[1].pixels[y * 20 + x] = ((x % 6) - 2) ** 2 + ((y % 6) - 2) ** 2 < 7 ? leaf : green;
    }
  blocks[1].solid = 15;
  const map = newMap();
  map.blocks.fill(1);
  const clear = (x: number, y: number, w = 3, h = 3) => {
    for (let py = y - Math.floor(h / 2); py <= y + Math.floor(h / 2); py++)
      for (let px = x - Math.floor(w / 2); px <= x + Math.floor(w / 2); px++) map.blocks[py * 100 + px] = 0;
  };
  const corridor = (a: { x: number; y: number }, b: { x: number; y: number }) => {
    const steps = Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    for (let step = 0; step <= steps; step++) clear(a.x + Math.sign(b.x - a.x) * step, a.y + Math.sign(b.y - a.y) * step);
  };
  for (let i = 1; i < MAZE_ROUTE.length; i++) corridor(MAZE_ROUTE[i - 1], MAZE_ROUTE[i]);
  for (const [from, to] of [
    [
      { x: 34, y: 31 },
      { x: 34, y: 25 },
    ],
    [
      { x: 52, y: 39 },
      { x: 52, y: 45 },
    ],
    [
      { x: 70, y: 27 },
      { x: 70, y: 33 },
    ],
  ]) {
    corridor(from, to);
    clear(to.x, to.y, 5, 3);
  }
  // Paw-and-arrow tiles sit on one side of the path, leaving the central stripe trail clear.
  for (const [id, dx, dy] of [
    [3, 1, 0],
    [4, 0, -1],
    [5, 0, 1],
  ]) {
    blocks[id] = { ...blocks[0], pixels: blocks[0].pixels.slice(), nextBl: id, touchBl: id };
    for (let n = 0; n < 7; n++) {
      blocks[id].pixels[(10 + dy * n) * 20 + 10 + dx * n] = green;
      if (n < 4) for (const side of [-1, 1]) blocks[id].pixels[(10 + dy * (6 - n) + dx * n * side) * 20 + 10 + dx * (6 - n) - dy * n * side] = green;
    }
    for (const [x, y] of [
      [6, 6],
      [4, 8],
      [8, 4],
      [4, 4],
    ])
      blocks[id].pixels[y * 20 + x] = green;
  }
  for (let i = 1; i < MAZE_ROUTE.length; i++) {
    const a = MAZE_ROUTE[i - 1],
      b = MAZE_ROUTE[i],
      dx = Math.sign(b.x - a.x),
      dy = Math.sign(b.y - a.y);
    for (let n = 3; n < Math.abs(b.x - a.x) + Math.abs(b.y - a.y); n += 4) {
      const x = a.x + dx * n + (dy ? 1 : 0),
        y = a.y + dy * n + (dx ? 1 : 0);
      map.blocks[y * 100 + x] = dy < 0 ? 4 : dy > 0 ? 5 : 3;
    }
  }
  blocks[2] = { ...blocks[0], pixels: blocks[0].pixels.slice(), effect: 27, eamt: 1, scorePts: 25, nextBl: 2, touchBl: 0 };
  for (let y = 6; y <= 13; y++)
    for (let x = 2; x <= 17; x++) blocks[2].pixels[y * 20 + x] = y === 6 || y === 13 || x === 2 || x === 17 ? white : x < 7 || x > 12 ? black : red;
  for (const [x, y] of MAZE_PIECES) map.blocks[y * 100 + x] = 2;
  const car = stripeCar(ink, restored);
  for (const [id, half] of [
    [6, 0],
    [7, 1],
  ]) {
    blocks[id] = { ...blocks[0], pixels: blocks[0].pixels.slice(), nextBl: id, touchBl: id };
    for (let y = 0; y < 20; y++)
      for (let x = 0; x < 20; x++) {
        const color = car.px[y * 40 + x + half * 20];
        if (color !== 255) blocks[id].pixels[y * 20 + x] = color;
      }
    map.blocks[39 * 100 + 84 + half] = id;
  }
  blocks[6].effect = 27;
  blocks[6].eamt = -10;
  blocks[6].solid = 15;
  blocks[6].touchBl = 8;
  blocks[8] = { ...blocks[6], pixels: blocks[6].pixels.slice(), effect: 0, eamt: 0, solid: 0, nextBl: 8, touchBl: 8 };
  for (const y of [38, 40]) for (let x = 83; x <= 87; x++) map.blocks[y * 100 + x] = 1;
  blocks[9] = { ...blocks[0], pixels: blocks[0].pixels.slice(), nextBl: 9, touchBl: 9 };
  for (let i = 0; i < 400; i++) if (POSES.stand.px[i] !== 255) blocks[9].pixels[i] = POSES.stand.px[i];
  map.blocks[38 * 100 + 10] = 9;
  const character = newCharacter();
  character.meter[1] = 2;
  for (const i of [4, 6, 8, 10, 12, 14, 16, 18]) Object.assign(character.sequences[i], { sound: 0, bloc: 50, jstkBut: 0 });
  const set = (index: number, scan: number, x: number, y: number) => {
    const s = character.sequences[index];
    s.frames = [1, 0, 2].map((pic) => ({ ...emptyFrame(), pic1: 50, pic2: pic, x, y, orient: x < 0 ? 64 : 0 }));
    s.frames.push(...Array.from({ length: 7 }, () => emptyFrame(true)));
    Object.assign(s, { key: scan << 8, sound: 30, jstkBut: 4 });
  };
  character.sequences[0].frames[0] = { ...emptyFrame(), pic1: 50, pic2: 0 };
  for (const [i, scan, x, y] of [
    [5, 77, 4, 0],
    [7, 75, -4, 0],
    [9, 72, 0, -4],
    [11, 80, 0, 4],
    [13, 30, -4, 0],
    [15, 32, 4, 0],
    [17, 17, 0, -4],
    [19, 57, 0, 4],
  ])
    set(i, scan, x, y);
  put('maze.pal', palette);
  put('maze.map', serializeMap(map));
  put('maze.bbl', serializeBlocks(blocks));
  put('maze.mon', serializeMonsters(newMonsterSet()));
  put('maze.mbl', serializeBlocks(Array.from({ length: 100 }, (_, i) => emptyBlock(i, true))));
  put('maze.chr', serializeCharacter(character));
  return { palette, ink };
}

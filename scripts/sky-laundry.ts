// Teddy's cloud route: visible lifts, one-way ledges, and sleepy clouds beneath each crossing.
import type { Block } from '../../GameMaker/web/src/formats/blocks.ts';
import type { GameMap } from '../../GameMaker/web/src/formats/map.ts';
import { matchColor } from '../../GameMaker/web/src/formats/palette.ts';

export const CLOUD_GAPS = [25, 26, 45, 46, 65, 66];
export const NAP_COLUMNS = [24, 25, 44, 45, 64, 65];

export function skyLaundry(map: GameMap, blocks: Block[], slots: number[], palette: Uint8Array, sampleX: number): void {
  const [cloud, nap, puffA, puffB, highCloud] = slots;
  if ([cloud, nap, puffA, puffB, highCloud].some((id) => id === undefined)) throw new Error('Sky Laundry needs five scenery slots');
  const samples = Array.from({ length: 40 }, (_, y) => map.blocks[y * 100 + sampleX]);
  const air = samples[30];
  const color = (r: number, g: number, b: number) => matchColor(palette, r, g, b);
  const white = color(63, 62, 58),
    blue = color(21, 34, 49),
    purple = color(39, 27, 48);
  for (let y = 20; y <= 39; y++)
    for (let x = 8; x <= 78; x++) {
      map.blocks[y * 100 + x] = blocks[samples[y]].solid ? air : samples[y];
    }
  const make = (id: number, base = air) => ({
    ...blocks[base],
    pixels: blocks[base].pixels.slice(),
    solid: 0,
    grav: 4,
    effect: 0,
    eamt: 0,
    scorePts: 0,
    chHitPt: 0,
    nextBl: id,
    touchBl: id,
    ntime: 0,
  });
  blocks[cloud] = { ...make(cloud, samples[36]), solid: 1 };
  blocks[highCloud] = { ...make(highCloud, samples[34]), solid: 1 };
  blocks[nap] = { ...make(nap, samples[39]), chHitPt: -1000 };
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      const rounded = [3, 10, 17].some((cx) => (x - cx) ** 2 + (y - 6) ** 2 < 38);
      if (rounded || (y >= 6 && y <= 13)) for (const id of [cloud, highCloud]) blocks[id].pixels[y * 20 + x] = y > 10 ? blue : white;
      if (y >= 10 && y <= 18 && x >= 1 && x <= 18) blocks[nap].pixels[y * 20 + x] = purple;
    }
  // A big Z makes the consequence legible before Teddy reaches the first nap cloud.
  for (let y = 2; y <= 8; y++)
    for (let x = 7; x <= 13; x++) {
      if (y === 2 || y === 8 || x === 15 - y) blocks[nap].pixels[y * 20 + x] = white;
    }
  for (const [id, next, phase] of [
    [puffA, puffB, 0],
    [puffB, puffA, 3],
  ]) {
    blocks[id] = { ...make(id), grav: 1, nextBl: next, ntime: 4 };
    for (let y = 0; y < 20; y++)
      for (let x = 5; x <= 15; x++) {
        if (Math.abs(x - 10) === (y + phase) % 7) blocks[id].pixels[y * 20 + x] = white;
      }
  }
  for (const [from, to, row] of [
    [19, 31, 36],
    [39, 51, 34],
    [59, 71, 36],
  ]) {
    for (let x = from; x <= to; x++) map.blocks[row * 100 + x] = row === 34 ? highCloud : cloud;
  }
  for (const [from, to, top] of [
    [15, 18, 34],
    [35, 38, 31],
    [55, 58, 34],
  ]) {
    for (let y = top; y <= 39; y++) for (let x = from; x <= to; x++) map.blocks[y * 100 + x] = puffA;
  }
  for (const x of CLOUD_GAPS) map.blocks[(x < 39 || x > 55 ? 36 : 34) * 100 + x] = air;
  for (const x of NAP_COLUMNS) map.blocks[39 * 100 + x] = nap;
}

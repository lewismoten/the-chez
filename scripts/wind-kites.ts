// Native flying stripe pickups, with visible wind posts that replace missed or barked-away kites.
import type { Block } from '../../GameMaker/web/src/formats/blocks.ts';
import type { GameMap } from '../../GameMaker/web/src/formats/map.ts';
import type { Monster } from '../../GameMaker/web/src/formats/monster.ts';
import { matchColor } from '../../GameMaker/web/src/formats/palette.ts';

export const KITE = 16;
export const KITE_STARTS = [17, 27, 37, 47, 57, 67, 77];
export const KITE_POSTS = [17, 37, 57, 77];
export const KITE_INTERVAL = 64;
export const KITE_LIFETIME = 320;

export function windKites(map: GameMap, blocks: Block[], monsters: Monster[], pictures: Block[], slots: number[], palette: Uint8Array, counter: number): void {
  const [vane, stem] = slots;
  if (vane === undefined || stem === undefined) throw new Error('Wind kites need two scenery slots');
  const color = (r: number, g: number, b: number) => matchColor(palette, r, g, b);
  const white = color(63, 61, 57), red = color(55, 12, 9), dark = color(6, 9, 12);
  // Keep the original collectible's contact behavior. A closed path confines it
  // to the two sky rows above Teddy; walking alone cannot gather a flying piece.
  monsters[KITE] = structuredClone(monsters[12]);
  const kite = monsters[KITE];
  Object.assign(kite, { power: 1, newmon: 64, upscore: 0, end: KITE_LIFETIME, thru: 0, towards: 0, activate: 0 });
  kite.march[0].forEach((corner) => Object.assign(corner, { x: 0, y: 0, pic: 0, orient: 0 }));
  // PLAYGAME treats normal-path corners as offsets from the starting cell.
  // Return to (0, 0) before repeating, rather than accumulating relative steps.
  for (const [i, [x, y]] of [[2, -1], [0, 0], [-2, -1], [0, 0]].entries()) {
    kite.march[0][i] = { x, y, pic: 1, orient: 0 };
  }
  for (const [phase, index] of [kite.pic[0][0], kite.pic[1][0]].entries()) {
    const block = pictures[index];
    Object.assign(block, { effect: counter, eamt: 1, scorePts: 25, chHitPt: 0, solid: 0 });
    for (let x = 0; x < 6; x++) {
      const y = phase ? 4 + x : 9 - x;
      block.pixels[y * 20 + x] = white;
      block.pixels[y * 20 + 19 - x] = white;
    }
    for (let y = 14; y < 20; y++) block.pixels[y * 20 + 9 + y % 2] = y % 2 ? red : white;
  }
  for (const [i, x] of KITE_STARTS.entries()) map.monsters[i] = { monnum: KITE, status: 0, xtra: 0, curx: x, cury: 38, extra: 0 };

  for (const [id, row] of [[vane, 38], [stem, 39]]) {
    const base = map.blocks[row * 100 + 9];
    blocks[id] = { ...blocks[base], pixels: blocks[base].pixels.slice(), solid: 0, grav: 4, effect: 0, eamt: 0, scorePts: 0, chHitPt: 0, obj: 0, nextBl: id, touchBl: id, ntime: 0, birthTime: 0 };
    for (let y = 0; y < 20; y++) blocks[id].pixels[y * 20 + 10] = white;
  }
  blocks[vane].birthMon = KITE;
  blocks[vane].birthTime = KITE_INTERVAL;
  for (let y = 1; y <= 12; y++) for (let x = 3; x <= 16; x++) {
    if (Math.abs(x - 10) + Math.abs(y - 7) < 7) blocks[vane].pixels[y * 20 + x] = x < 10 ? red : white;
  }
  blocks[vane].pixels[7 * 20 + 10] = dark;
  for (let y = 17; y < 20; y++) for (let x = 6; x <= 14; x++) blocks[stem].pixels[y * 20 + x] = red;
  for (const x of KITE_POSTS) { map.blocks[38 * 100 + x] = vane; map.blocks[39 * 100 + x] = stem; }
}

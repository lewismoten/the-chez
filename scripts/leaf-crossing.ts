// Gwinn's leaf crossing: native timed block variants change both the sign and its safe barrier.
import type { Block } from '../../GameMaker/web/src/formats/blocks.ts';
import type { GameMap } from '../../GameMaker/web/src/formats/map.ts';
import { matchColor } from '../../GameMaker/web/src/formats/palette.ts';
import { Pixels } from '../../GameMaker/games/kit/pixels.ts';
import { centered } from '../../GameMaker/games/kit/pcText.ts';

export const LEAF_CROSSING = 45;
export const LEAF_WAIT = 54;
export const LEAF_GO = 54;

export function leafCrossing(map: GameMap, blocks: Block[], slots: number[], palette: Uint8Array): void {
  if (slots.length < 18) throw new Error('The leaf crossing needs eighteen scenery slots');
  const color = (r: number, g: number, b: number) => matchColor(palette, r, g, b);
  const dark = color(6, 10, 14), cream = color(63, 61, 53), red = color(58, 12, 9), green = color(10, 43, 23), gold = color(63, 45, 10);
  const variant = (id: number, next: number, base: number, open: boolean): Block => ({
    ...blocks[base], pixels: blocks[base].pixels.slice(), solid: 0, grav: 4,
    effect: 0, eamt: 0, scorePts: 0, chHitPt: 0, obj: 0, birthTime: 0,
    nextBl: next, ntime: open ? LEAF_GO : LEAF_WAIT, touchBl: id,
  });
  // PLAYGAME animates block IDs globally, so these rows and the sign stay in phase.
  // Only the closed variants are solid. Neither phase can hurt or consume a try.
  for (let row = 35; row <= 39; row++) {
    const [closed, open] = slots.slice((row - 35) * 2);
    const base = map.blocks[row * 100 + LEAF_CROSSING];
    blocks[closed] = { ...variant(closed, open, base, false), solid: 15 };
    blocks[open] = variant(open, closed, base, true);
    for (let y = 0; y < 20; y++) for (let x = 6; x <= 13; x++) {
      blocks[closed].pixels[y * 20 + x] = (x + y) % 10 < 5 ? dark : gold;
    }
    // Small rightward chevrons replace the closed barrier, including at Teddy's eye level.
    for (let y = 6; y <= 14; y++) for (let x = 7; x <= 13; x++) {
      if (x === 13 - Math.abs(y - 10)) blocks[open].pixels[y * 20 + x] = green;
    }
    map.blocks[row * 100 + LEAF_CROSSING] = closed;
  }
  // The absurdly important leaf swaps sides with the light. It uses the same
  // native animation cycle as the barrier, with no monster AI or page timer.
  for (const [side, x] of [[0, LEAF_CROSSING - 1], [1, LEAF_CROSSING + 1]]) {
    const closed = slots[14 + side * 2], go = slots[15 + side * 2];
    const at = 37 * 100 + x;
    for (const open of [false, true]) {
      const id = open ? go : closed;
      blocks[id] = variant(id, open ? closed : go, map.blocks[at], open);
      if (open === Boolean(side)) {
        for (let y = 3; y <= 16; y++) for (let px = 3; px <= 16; px++) {
          if (Math.abs(px - 10) + Math.abs(y - 9) < 9) blocks[id].pixels[y * 20 + px] = gold;
          if (px === y && y >= 6) blocks[id].pixels[y * 20 + px] = dark;
        }
      }
    }
    map.blocks[at] = closed;
  }
  for (const open of [false, true]) {
    const sign = new Pixels(40, 20, dark);
    sign.rect(0, 0, 40, 2, open ? green : red);
    sign.rect(0, 18, 40, 2, open ? green : red);
    centered(sign, 6, open ? 'GO >' : 'WAIT', cream);
    for (let half = 0; half < 2; half++) {
      const closed = slots[10 + half * 2], go = slots[11 + half * 2];
      const id = open ? go : closed;
      const at = 34 * 100 + LEAF_CROSSING - 1 + half;
      blocks[id] = variant(id, open ? closed : go, map.blocks[at], open);
      blocks[id].pixels.set(sign.crop(half * 20, 0, 20, 20).px);
      if (!open) map.blocks[at] = closed;
    }
  }
}

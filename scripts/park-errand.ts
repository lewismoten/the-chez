// A native two-objective park loop: find the leaf above the left branch, then open the right gate.
import type { Block } from '../../GameMaker/web/src/formats/blocks.ts';
import type { GameMap } from '../../GameMaker/web/src/formats/map.ts';
import { matchColor } from '../../GameMaker/web/src/formats/palette.ts';
import { Pixels } from '../../GameMaker/games/kit/pixels.ts';
import { PARK_GATE, PARK_LEAF } from '../src/park-route.ts';

type Make = (picture: Pixels, solid?: number, gravity?: number) => number;
export function parkErrand(map: GameMap, blocks: Block[], palette: Uint8Array, make: Make): void {
  const c = (r: number, g: number, b: number) => matchColor(palette, r, g, b);
  const green = c(12, 33, 14),
    leaf = c(21, 43, 18),
    gold = c(61, 44, 15),
    dark = c(7, 13, 19),
    white = c(63, 61, 55),
    wood = c(29, 23, 17),
    sky = blocks[0].pixels[0];
  const hedge = make(new Pixels(20, 20, green).frame(0, 0, 20, 20, leaf));
  for (let y = 34; y <= 39; y++) for (let x = 50; x <= 53; x++) map.blocks[y * 100 + x] = hedge;
  const wind = make(new Pixels(20, 20, sky).line(5, 12, 10, 6, white).line(10, 6, 15, 12, white), 0, 1);
  for (const x of [45, 56]) for (let y = 30; y <= 39; y++) map.blocks[y * 100 + x] = wind;
  const ledge = make(new Pixels(20, 20, sky).rect(0, 0, 20, 5, gold).rect(0, 5, 20, 2, dark), 1);
  for (let x = 31; x <= 44; x++) map.blocks[32 * 100 + x] = ledge;
  for (let x = 46; x <= 55; x++) map.blocks[34 * 100 + x] = ledge;
  const leafPicture = new Pixels(20, 20, sky);
  for (let y = 3; y <= 15; y++) for (let x = 3; x <= 16; x++) if (Math.abs(x - 10) + Math.abs(y - 9) < 9) leafPicture.set(x, y, gold);
  leafPicture.line(4, 16, 14, 6, dark).line(5, 17, 2, 19, gold);
  const token = make(leafPicture, 0);
  Object.assign(blocks[token], { effect: PARK_LEAF.counter, eamt: 1, scorePts: 125, touchBl: 0 });
  map.blocks[PARK_LEAF.y * 100 + PARK_LEAF.x] = token;
  // A tall tree trunk has one ground-level door. It cannot be jumped around.
  const bark = new Pixels(20, 20, wood).line(3, 0, 3, 19, dark).line(15, 0, 15, 19, dark).line(8, 3, 8, 12, gold);
  const trunk = make(bark);
  for (let y = 0; y < PARK_GATE.y; y++) map.blocks[y * 100 + PARK_GATE.x] = trunk;
  const door = make(bark.crop(0, 0, 20, 20).frame(0, 0, 20, 20, gold).blit(leafPicture, 0, 0, sky));
  const open = make(new Pixels(20, 20, sky).rect(0, 0, 2, 20, wood).rect(18, 0, 2, 20, wood), 0);
  Object.assign(blocks[door], { effect: PARK_LEAF.counter, eamt: -1, touchBl: open });
  map.blocks[PARK_GATE.y * 100 + PARK_GATE.x] = door;
  // Physical arrows mark both choices and the recovery stream, without another control key.
  for (const [dx, x, y] of [
    [-1, 43, 30],
    [1, 46, 30],
    [-1, 57, 36],
  ]) {
    const arrow = new Pixels(20, 20, sky).line(4, 10, 16, 10, white);
    const tip = dx < 0 ? 4 : 16;
    arrow.line(tip, 10, tip - dx * 5, 5, white).line(tip, 10, tip - dx * 5, 15, white);
    map.blocks[y * 100 + x] = make(arrow, 0);
  }
}

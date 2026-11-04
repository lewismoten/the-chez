// Level 2, Control Run: a flat street driven at 25 mph with no stripes. Halfway along, a turtle
// crosses on a native timed cycle: the barrier, the turtle and a countdown sign are block
// variants that change together (WAIT, then GO), so holding Right is safe and waiting wins.
import { emptyBlock, serializeBlocks, type Block } from '@lewismoten/gamemaker-sandbox-tools/formats/blocks';
import { newMap, serializeMap } from '@lewismoten/gamemaker-sandbox-tools/formats/map';
import { newMonsterSet, serializeMonsters } from '@lewismoten/gamemaker-sandbox-tools/formats/monster';
import { serializeCharacter } from '@lewismoten/gamemaker-sandbox-tools/formats/character';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/drawing';
import { micro } from '../assets/source/teddy/art/draw.ts';
import { C, palette } from './hypo-art.ts';
import { carCharacter, carSprites } from './hypo-car.ts';

export const STREET = { startX: 8, finishX: 90, crossX: 46, row: 39 };
/** Twelve states of nine ticks: six of WAIT with the bar draining, then six of GO. */
export const CROSS_STATES = 12;
export const CROSS_TICKS = 9;
const BARRIER = 20;
const SIGN = 40;

export function streetFiles(put: (name: string, data: Uint8Array) => void): void {
  const pal = palette(0);
  const blocks = Array.from({ length: 150 }, (_, i) => emptyBlock(i));
  const map = newMap();
  const draw = (id: number, fn: (p: Pixels) => void, solid = 0) => {
    const p = new Pixels(20, 20, C.sky);
    fn(p);
    blocks[id].pixels.set(p.px);
    blocks[id].solid = solid;
  };
  for (const block of blocks) block.grav = 4;
  draw(0, () => undefined);
  draw(1, (p) => { p.rect(0, 0, 20, 20, C.asphalt); p.rect(0, 0, 20, 2, C.white); }, 15);
  draw(2, (p) => p.rect(0, 0, 20, 20, C.asphalt), 15);
  const brick = C.tan, roofRed = C.red;
  draw(3, (p) => { p.rect(0, 0, 20, 20, brick); p.rect(5, 4, 10, 8, C.sky); p.frame(5, 4, 10, 8, C.white); });
  draw(4, (p) => { p.rect(0, 0, 20, 20, brick); p.rect(7, 6, 6, 14, C.dark); });
  draw(5, (p) => { p.rect(0, 8, 20, 12, roofRed); p.rect(0, 8, 20, 2, C.dark); });
  draw(6, (p) => p.rect(8, 0, 4, 20, C.dark));
  draw(7, (p) => { p.disc(10, 12, 9, C.green); p.disc(7, 9, 4, C.green); });
  draw(8, (p) => { p.rect(0, 0, 20, 20, C.sky); p.rect(8, 0, 4, 20, C.white); });
  // The finish: checkered flag cells (no collision; touching one ends the level).
  draw(9, (p) => { p.rect(8, 0, 3, 20, C.white); for (let y = 0; y < 8; y++) for (let x = 0; x < 10; x++) p.set(11 + x, y, (x + y) % 2 ? C.black : C.white); });
  draw(10, (p) => { for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) p.set(x, y, ((x >> 2) + (y >> 2)) % 2 ? C.black : C.white); });
  // Scenery: houses on both sides of the crossing, trees at the edges.
  const house = (x: number, w: number) => {
    for (let y = 36; y <= 39; y++) for (let c = 0; c < w; c++) map.blocks[y * 100 + x + c] = y === 39 && c === 1 ? 4 : 3;
    for (let c = 0; c < w; c++) map.blocks[35 * 100 + x + c] = 5;
  };
  for (let y = 0; y < 100; y++) for (let x = 0; x < 100; x++) map.blocks[y * 100 + x] = y === 40 ? 1 : y > 40 ? 2 : 0;
  for (const x of [14, 22, 30, 56, 64, 74, 82]) house(x, 3);
  for (const x of [11, 19, 27, 38, 61, 70, 86]) { map.blocks[39 * 100 + x] = 6; map.blocks[38 * 100 + x] = 7; }
  for (let y = 0; y < 41; y++) for (const x of [3, 97]) map.blocks[y * 100 + x] = 8;
  // The finish ribbon and arch.
  for (let y = 33; y <= 39; y++) map.blocks[y * 100 + STREET.finishX - 1] = 9;
  map.blocks[STREET.row * 100 + STREET.finishX] = 10;
  map.blocks[38 * 100 + STREET.finishX] = 10;

  // The turtle crossing: block chains whose ids advance together every CROSS_TICKS.
  const chain = (base: number, make: (state: number, p: Pixels) => boolean, solidWhen: (state: number) => boolean): void => {
    for (let s = 0; s < CROSS_STATES; s++) {
      const id = base + s;
      const p = new Pixels(20, 20, C.sky);
      make(s, p);
      blocks[id] = { ...blocks[0], pixels: Uint8Array.from(p.px), nextBl: base + ((s + 1) % CROSS_STATES), ntime: CROSS_TICKS, touchBl: id, solid: solidWhen(s) ? 15 : 0, grav: 4 };
    }
  };
  const closed = (s: number) => s < 6;
  // Row 39: the turtle sits in the road while closed. Row 38: the crossing arm over it.
  chain(BARRIER, (s, p) => {
    if (!closed(s)) return false;
    p.disc(10, 15, 8, C.green);
    p.rect(0, 16, 20, 4, C.sky);
    p.rect(3, 16, 14, 4, C.green);
    for (const x of [6, 10, 14]) p.rect(x, 9, 2, 3, C.gold);
    p.rect(17, 14, 3, 5, C.green);
    p.set(18, 15, C.black);
    return true;
  }, closed);
  chain(BARRIER + 12, (s, p) => {
    if (!closed(s)) return false;
    for (let x = 0; x < 20; x++) for (let y = 12; y < 20; y++) p.set(x, y, ((x + y) >> 2) % 2 ? C.red : C.white);
    p.rect(0, 0, 3, 20, C.white);
    return true;
  }, closed);
  const sign = (half: number, row: number) => (s: number, p: Pixels) => {
    const wait = closed(s);
    const face = new Pixels(40, 40, C.sky);
    face.rect(0, 0, 40, 40, C.dark);
    face.frame(0, 0, 40, 40, wait ? C.red : C.green);
    micro(face, wait ? 11 : 15, 5, wait ? 'WAIT' : 'GO', C.white, 2);
    // The countdown bar: six cells that drain, one every nine ticks.
    const left = 6 - (s % 6);
    for (let n = 0; n < 6; n++) face.rect(3 + n * 6, 26, 5, 8, n < left ? (wait ? C.red : C.green) : C.dark);
    p.blit(face.crop(half * 20, row * 20, 20, 20), 0, 0);
    return true;
  };
  for (const [index, [half, row]] of [[0, 0], [1, 0], [0, 1], [1, 1]].entries()) {
    chain(SIGN + index * 12, sign(half, row), () => false);
  }
  const crossing = (x: number) => x;
  map.blocks[39 * 100 + crossing(STREET.crossX)] = BARRIER;
  map.blocks[38 * 100 + crossing(STREET.crossX)] = BARRIER + 12;
  for (const [index, [dx, dy]] of [[0, 0], [1, 0], [0, 1], [1, 1]].entries()) map.blocks[(33 + dy) * 100 + STREET.crossX - 1 + dx] = SIGN + index * 12;

  put('street.pal', pal);
  put('street.map', serializeMap(map));
  put('street.bbl', serializeBlocks(blocks as Block[]));
  put('street.mon', serializeMonsters(newMonsterSet()));
  put('street.mbl', serializeBlocks(Array.from({ length: 100 }, (_, i) => emptyBlock(i, true))));
  put('car25.chr', serializeCharacter(carCharacter(25)));
  put('car.cbl', serializeBlocks(carSprites()));
}

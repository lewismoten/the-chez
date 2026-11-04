// Level 2, Control Run: a town street driven at 25 mph with no stripes. Halfway along, a turtle
// crosses on a native timed cycle: the barrier, the turtle and a countdown sign are block
// variants that change together (WAIT, then GO), so holding Right is safe and waiting wins.
// The scenery is painted by hypo-town.ts; this file adds the crossing, the solid road and the files.
import { emptyBlock, serializeBlocks, type Block } from '@lewismoten/gamemaker-sandbox-tools/formats/blocks';
import { newMap, serializeMap } from '@lewismoten/gamemaker-sandbox-tools/formats/map';
import { newMonsterSet, serializeMonsters } from '@lewismoten/gamemaker-sandbox-tools/formats/monster';
import { serializeCharacter } from '@lewismoten/gamemaker-sandbox-tools/formats/character';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/drawing';
import { micro } from '../assets/source/teddy/art/draw.ts';
import { C, palette } from './hypo-art.ts';
import { R } from './hypo-colors.ts';
import { carCharacter, carSprites } from './hypo-car.ts';
import { paintTown, ROW } from './hypo-town.ts';

export const STREET = { startX: 8, finishX: 90, crossX: 46, row: ROW };
/** Six states of eighteen ticks: three of WAIT with the bar draining, then three of GO. */
export const CROSS_STATES = 6;
export const CROSS_TICKS = 18;
const CLOSED_STATES = CROSS_STATES / 2;
const TOP = ROW - 5;
/** Block ids of the three timed chains (the art uses the ids below them). */
const BARRIER = 150 - 4 * CROSS_STATES;
const ARM = BARRIER + CROSS_STATES;
const SIGN = ARM + CROSS_STATES;

const closed = (s: number) => s < CLOSED_STATES;

/** The turtle in the road: a domed shell with scutes, a head, two legs, an eye. */
function turtle(p: Pixels): void {
  const o = 4;
  for (let y = 4; y < 16; y++)
    for (let x = 1; x < 17; x++) {
      const dx = (x - 8.5) / 8,
        dy = (y - 15) / 10;
      if (dx * dx + dy * dy < 1) {
        const lit = dx * -0.4 + dy * -0.7;
        p.set(x, y + o, R('leaf', lit > 0.35 ? 3 : lit > -0.15 ? 2 : 1));
      }
    }
  for (const [x, y] of [[5, 8], [9, 7], [13, 9], [7, 11], [11, 12]]) p.rect(x, y + o, 3, 2, R('wood', 2));
  p.rect(0, 15 + o, 18, 1, R('leaf', 0));
  p.rect(16, 10 + o, 4, 5, R('leaf', 3));
  p.rect(17, 9 + o, 3, 1, R('leaf', 3));
  p.set(18, 11 + o, C.black);
  for (const x of [3, 12]) p.rect(x, 15 + o, 3, 1, R('leaf', 2));
}

/** The crossing arm, down over the road's edge: a red and white striped bar on a post. */
function arm(p: Pixels): void {
  p.rect(0, 2, 3, 18, C.white);
  p.rect(0, 2, 1, 18, R('stone', 2));
  for (let x = 3; x < 20; x++) for (let y = 10; y < 18; y++) p.set(x, y, ((x + y) >> 2) % 2 ? R('flag', 0) : C.white);
  p.rect(3, 10, 17, 1, R('iron', 1));
  p.rect(3, 17, 17, 1, R('iron', 1));
}

/** The sign's face (40x20): WAIT or GO, and the countdown bar draining one cell per state. */
function signFace(s: number): Pixels {
  const wait = closed(s);
  const face = new Pixels(40, 20, C.dark);
  face.frame(0, 0, 40, 20, wait ? C.red : R('leaf', 3));
  face.frame(1, 1, 38, 18, R('iron', 0));
  micro(face, wait ? 5 : 13, 3, wait ? 'WAIT' : 'GO', C.white, 2);
  const left = CLOSED_STATES - (s % CLOSED_STATES);
  for (let n = 0; n < CLOSED_STATES; n++) face.rect(3 + n * 12, 14, 11, 3, n < left ? (wait ? C.red : R('leaf', 3)) : C.dark);
  return face;
}

export function streetFiles(put: (name: string, data: Uint8Array) => void): void {
  const pal = palette(0);
  const blocks = Array.from({ length: 150 }, (_, i) => emptyBlock(i));
  const map = newMap();
  const town = paintTown();
  const cut = town.cut();
  if (cut.tiles.length > BARRIER) throw new Error(`The street needs ${cut.tiles.length} art blocks; ${BARRIER} fit below the timed chains`);
  for (const block of blocks) block.grav = 4;
  cut.tiles.forEach((tile, id) => blocks[id].pixels.set(tile.px));
  map.blocks.set(cut.map);
  // The road's far lane is the floor the car stands on.
  const solidId = new Map<number, number>();
  const solidCopy = (id: number): number => {
    let n = solidId.get(id);
    if (n === undefined) {
      n = cut.tiles.length + solidId.size;
      if (n >= BARRIER) throw new Error('No room for another solid copy of an art block');
      blocks[n].pixels.set(blocks[id].pixels);
      blocks[n].solid = 15;
      blocks[n].grav = 4;
      solidId.set(id, n);
    }
    return n;
  };
  for (let x = 0; x < 100; x++) map.blocks[(ROW + 1) * 100 + x] = solidCopy(map.blocks[(ROW + 1) * 100 + x]);
  // The street's two ends are buildings you cannot drive through.
  for (const x of [0, 99]) for (const y of [ROW - 1, ROW]) map.blocks[y * 100 + x] = solidCopy(map.blocks[y * 100 + x]);

  // The turtle crossing: block chains whose ids advance together every CROSS_TICKS.
  const bg = (tx: number, ty: number, w = 1): Pixels => town.scene.pic.crop(tx * 20, (ty - TOP) * 20, w * 20, 20);
  const chain = (base: number, make: (state: number) => Pixels, solid: (state: number) => boolean): void => {
    for (let s = 0; s < CROSS_STATES; s++) {
      const id = base + s;
      blocks[id] = {
        ...blocks[0],
        id,
        pixels: Uint8Array.from(make(s).px),
        nextBl: base + ((s + 1) % CROSS_STATES),
        ntime: CROSS_TICKS,
        touchBl: id,
        solid: solid(s) ? 15 : 0,
        grav: 4,
      };
    }
  };
  chain(
    BARRIER,
    (s) => {
      const p = bg(STREET.crossX, ROW);
      if (closed(s)) {
        const t = new Pixels(20, 20, 255);
        turtle(t);
        p.blit(t, 0, 0, 255);
      }
      return p;
    },
    closed,
  );
  chain(
    ARM,
    (s) => {
      const p = bg(STREET.crossX, ROW - 1);
      if (closed(s)) {
        const t = new Pixels(20, 20, 255);
        arm(t);
        p.blit(t, 0, 0, 255);
      }
      return p;
    },
    closed,
  );
  for (const half of [0, 1]) chain(SIGN + half * CROSS_STATES, (s) => signFace(s).crop(half * 20, 0, 20, 20), () => false);
  map.blocks[ROW * 100 + STREET.crossX] = BARRIER;
  map.blocks[(ROW - 1) * 100 + STREET.crossX] = ARM;
  for (const half of [0, 1]) map.blocks[(ROW - 3) * 100 + STREET.crossX - 1 + half] = SIGN + half * CROSS_STATES;

  put('street.pal', pal);
  put('street.map', serializeMap(map));
  put('street.bbl', serializeBlocks(blocks as Block[]));
  put('street.mon', serializeMonsters(newMonsterSet()));
  put('street.mbl', serializeBlocks(Array.from({ length: 100 }, (_, i) => emptyBlock(i, true))));
  put('car25.chr', serializeCharacter(carCharacter(25)));
  put('car.cbl', serializeBlocks(carSprites()));
}

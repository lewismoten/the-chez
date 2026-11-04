// Level 1, The Hypothesis: Teddy on foot in the driveway, four ways. He fetches Doc Leo's clipboard
// and stopwatch (two pickups on a counter), then the garage door opens. Space barks.
import { emptyBlock, serializeBlocks } from '@lewismoten/gamemaker-sandbox-tools/formats/blocks';
import { emptyFrame, newCharacter, serializeCharacter, type Frame } from '@lewismoten/gamemaker-sandbox-tools/formats/character';
import { newMap, serializeMap } from '@lewismoten/gamemaker-sandbox-tools/formats/map';
import { newMonsterSet, serializeMonsters } from '@lewismoten/gamemaker-sandbox-tools/formats/monster';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/drawing';
import { POSES } from '../assets/source/teddy/sprites/teddy.ts';
import { micro } from '../assets/source/teddy/art/draw.ts';
import { C, palette } from './hypo-art.ts';

export const DRIVEWAY = {
  startX: 20,
  startY: 46,
  doorX: 21,
  doorY: 31,
  counter: 21,
  required: 2,
};
export const ITEMS = [
  { name: 'clipboard', x: 8, y: 42 },
  { name: 'stopwatch', x: 33, y: 36 },
];

export function drivewayFiles(put: (name: string, data: Uint8Array) => void): void {
  const pal = palette(0);
  const blocks = Array.from({ length: 150 }, (_, i) => emptyBlock(i));
  const map = newMap();
  const c = (r: number, g: number, b: number) => matchNear(pal, r, g, b);
  const lawn = c(14, 38, 14),
    lawn2 = c(10, 32, 11),
    slab = c(40, 40, 38),
    seam = c(30, 30, 29),
    hedge = c(5, 24, 9),
    hedgeHi = c(9, 33, 12);
  const wall = c(46, 34, 24),
    roof = c(30, 12, 9),
    wood = c(36, 24, 12);
  const draw = (id: number, fn: (p: Pixels) => void, solid = 0) => {
    const p = new Pixels(20, 20, lawn);
    fn(p);
    blocks[id].pixels.set(p.px);
    blocks[id].solid = solid;
  };
  draw(0, (p) => {
    for (let i = 0; i < 20; i += 3) p.set((i * 7) % 20, (i * 11) % 20, lawn2);
  });
  draw(1, (p) => {
    p.rect(0, 0, 20, 20, slab);
    p.rect(0, 19, 20, 1, seam);
  });
  draw(
    2,
    (p) => {
      p.rect(0, 0, 20, 20, hedge);
      for (let i = 0; i < 20; i += 4) p.disc(i + 2, ((i * 3) % 18) + 2, 3, hedgeHi);
    },
    15,
  );
  draw(
    3,
    (p) => {
      p.rect(0, 0, 20, 20, wall);
      p.rect(0, 16, 20, 4, roof);
    },
    15,
  );
  draw(
    4,
    (p) => {
      p.rect(0, 0, 20, 20, wall);
      p.rect(4, 3, 12, 9, C.sky);
      p.frame(4, 3, 12, 9, C.white);
    },
    15,
  );
  // The garage door: shut until both items are in, then open.
  const garage = (open: boolean) => (p: Pixels) => {
    p.rect(0, 0, 20, 20, wall);
    p.rect(1, 1, 18, 19, open ? C.dark : wood);
    if (!open) for (let y = 4; y < 20; y += 5) p.rect(1, y, 18, 1, seam);
    micro(p, 4, 9, open ? '' : 'GO', C.cream, 1);
  };
  draw(5, garage(false), 15);
  draw(6, garage(true));
  draw(9, garage(false), 15);
  blocks[5].effect = DRIVEWAY.counter;
  blocks[5].eamt = -DRIVEWAY.required;
  blocks[5].touchBl = 6;
  blocks[6].nextBl = 6;
  blocks[6].touchBl = 6;
  // Pickups sit on lawn; touching one puts the lawn back and adds one to the counter.
  const pickup = (id: number, fn: (p: Pixels) => void) => {
    draw(id, (p) => {
      p.rect(0, 0, 20, 20, lawn);
      fn(p);
    });
    Object.assign(blocks[id], {
      effect: DRIVEWAY.counter,
      eamt: 1,
      scorePts: 25,
      touchBl: 0,
      nextBl: id,
    });
  };
  pickup(7, (p) => {
    p.rect(4, 2, 12, 16, wood);
    p.rect(6, 5, 8, 11, C.white);
    p.rect(8, 1, 4, 3, C.gold);
    for (const y of [7, 10, 13]) p.rect(7, y, 6, 1, C.dark);
  });
  pickup(8, (p) => {
    p.disc(10, 11, 7, C.white);
    p.disc(10, 11, 5, C.cream);
    p.rect(9, 2, 3, 3, C.red);
    p.line(10, 11, 10, 7, C.black);
    p.line(10, 11, 13, 12, C.red);
  });
  for (let y = 0; y < 100; y++) for (let x = 0; x < 100; x++) map.blocks[y * 100 + x] = 2;
  for (let y = 28; y <= 50; y++) for (let x = 4; x <= 40; x++) map.blocks[y * 100 + x] = 0;
  // The house along the top, the driveway up the middle to its garage.
  for (let x = 4; x <= 40; x++) for (let y = 28; y <= 30; y++) map.blocks[y * 100 + x] = y === 29 && x % 6 === 2 ? 4 : 3;
  for (let y = 31; y <= 50; y++) for (const x of [19, 20, 21, 22]) map.blocks[y * 100 + x] = 1;
  for (let y = 30; y <= 31; y++) for (const x of [19, 23]) map.blocks[y * 100 + x] = 3;
  map.blocks[DRIVEWAY.doorY * 100 + DRIVEWAY.doorX] = 5;
  for (const x of [20, 22]) map.blocks[31 * 100 + x] = 9;
  // Hedge islands to walk around.
  for (const [x, y, w, h] of [
    [10, 36, 5, 2],
    [27, 40, 6, 2],
    [8, 46, 4, 2],
    [30, 32, 3, 2],
    [14, 41, 2, 3],
  ])
    for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) map.blocks[yy * 100 + xx] = 2;
  for (const [index, item] of ITEMS.entries()) map.blocks[item.y * 100 + item.x] = 7 + index;
  put('yard.pal', pal);
  put('yard.map', serializeMap(map));
  put('yard.bbl', serializeBlocks(blocks));
  put('yard.mon', serializeMonsters(newMonsterSet()));
  put('yard.mbl', serializeBlocks(Array.from({ length: 100 }, (_, i) => emptyBlock(i, true))));
  teddyFiles(put);
}

export function matchNear(pal: Uint8Array, r: number, g: number, b: number): number {
  let best = 0,
    bestD = Infinity;
  for (let i = 0; i < 248; i++) {
    const d = (pal[i * 3] - r) ** 2 + (pal[i * 3 + 1] - g) ** 2 + (pal[i * 3 + 2] - b) ** 2;
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

/** Teddy walking four ways: front, back and side poses (left is the side pose mirrored). */
/** Teddy's character and sprites; `sideOnly` drops Up and Down (the garage level has gravity and only walks sideways). */
export function teddyData(sideOnly = false): { chr: Uint8Array; cbl: Uint8Array } {
  const sprites = Array.from({ length: 50 }, (_, i) => emptyBlock(i, true));
  const poses = [
    POSES.front,
    POSES.front.flipX(),
    POSES.back,
    POSES.back.flipX(),
    POSES.stand,
    POSES.walk1,
    POSES.walk2,
    POSES.bark,
    POSES.frontBark,
  ];
  poses.forEach((pose, i) => sprites[i].pixels.set(pose.px));
  const character = newCharacter();
  character.meter[1] = 2;
  for (const i of [4, 6, 8, 10, 12, 14, 16, 18]) Object.assign(character.sequences[i], { sound: 0, bloc: 50, jstkBut: 0 });
  const frame = (pic: number, x: number, y: number, orient = 0): Frame => ({
    ...emptyFrame(),
    pic1: 50,
    pic2: pic,
    pause: 1,
    x,
    y,
    orient,
  });
  const walk = (index: number, scan: number, pics: number[], x: number, y: number, orient = 0) => {
    const s = character.sequences[index];
    s.frames = [...pics.map((pic) => frame(pic, x, y, orient)), ...Array.from({ length: 10 - pics.length }, () => emptyFrame(true))];
    Object.assign(s, { key: scan << 8, sound: 30, jstkBut: 4 });
  };
  const walkRight = [5, 4, 6, 4],
    front = [0, 1, 0, 1],
    back = [2, 3, 2, 3];
  // Arrows, with A, D and W as second keys (S is Down's neighbor; the arrows carry play).
  for (const [i, scan, pics, x, y, o] of [
    [5, 77, walkRight, 4, 0, 0],
    [7, 75, walkRight, -4, 0, 64],
    [9, 72, back, 0, -4, 0],
    [11, 80, front, 0, 4, 0],
    [13, 30, walkRight, -4, 0, 64],
    [15, 32, walkRight, 4, 0, 0],
    [17, 17, back, 0, -4, 0],
  ] as [number, number, number[], number, number, number][])
    if (!sideOnly || ![9, 11, 17].includes(i)) walk(i, scan, pics, x, y, o);
  character.sequences[0].frames[0] = { ...emptyFrame(), pic1: 50, pic2: 0 };
  // Space barks: the same bark Teddy always had.
  const bark = character.sequences[19];
  bark.frames = [{ ...frame(7, 0, 0), pause: 4 }, { ...frame(4, 0, 0), pause: 2 }, ...Array.from({ length: 8 }, () => emptyFrame(true))];
  Object.assign(bark, {
    key: (57 << 8) | 32,
    norepeat: 1,
    sound: 9,
    jstkBut: 4,
  });
  return { chr: serializeCharacter(character), cbl: serializeBlocks(sprites) };
}

function teddyFiles(put: (name: string, data: Uint8Array) => void): void {
  const files = teddyData();
  put('teddy.chr', files.chr);
  put('teddy.cbl', files.cbl);
}

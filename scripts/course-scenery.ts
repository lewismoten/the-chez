// Original whole-object scenery for the stripe chase, tiled into native DOS blocks.
// Uses Lewis Moten's MIT format and pixel helpers; see NOTICE.md.
import { emptyBlock, type Block } from '../../GameMaker/web/src/formats/blocks.ts';
import { newMap, type GameMap } from '../../GameMaker/web/src/formats/map.ts';
import { matchColor } from '../../GameMaker/web/src/formats/palette.ts';
import { Pixels } from '../../GameMaker/games/kit/pixels.ts';

export function courseScenery(theme: string, palette: Uint8Array): { map: GameMap; blocks: Block[] } {
  const c = (r: number, g: number, b: number) => matchColor(palette, r, g, b);
  const sky = c(29, 46, 60), white = c(63, 61, 55), dark = c(7, 13, 19);
  const red = c(52, 12, 9), gold = c(61, 44, 15), green = c(12, 33, 14);
  const leaf = c(21, 43, 18), earth = c(29, 23, 17), stone = c(42, 43, 39);
  const blocks = Array.from({ length: 150 }, (_, i) => emptyBlock(i));
  for (const b of blocks) { b.pixels.fill(sky); b.grav = 4; }
  const map = newMap(); map.blocks.fill(0);
  const keys = new Map<string, number>();
  let used = 0;
  const tile = (pixels: Uint8Array, solid = 0) => {
    const key = `${solid}:${Buffer.from(pixels).toString('base64')}`;
    const previous = keys.get(key); if (previous !== undefined) return previous;
    if (used >= 95) throw new Error(`${theme}: scenery exceeds 95 unique tiles`);
    const id = used++; keys.set(key, id);
    blocks[id].pixels.set(pixels); blocks[id].solid = solid;
    return id;
  };
  tile(new Pixels(20, 20, sky).px);
  const floor = new Pixels(20, 20, theme === 'city' ? stone : green);
  floor.rect(0, 0, 20, 3, theme === 'city' ? white : leaf);
  floor.rect(0, 4, 20, 16, earth);
  const floorId = tile(floor.px, 15), soilId = tile(new Pixels(20, 20, earth).px, 15);
  for (let y = 40; y < 100; y++) for (let x = 0; x < 100; x++) map.blocks[y * 100 + x] = y === 40 ? floorId : soilId;
  // Objects are drawn completely before tiling. Pickups later composite onto each tile.
  const put = (picture: Pixels, bx: number, by: number) => {
    for (let y = 0; y < picture.h / 20; y++) for (let x = 0; x < picture.w / 20; x++)
      map.blocks[(by + y) * 100 + bx + x] = tile(picture.crop(x * 20, y * 20, 20, 20).px);
  };
  const house = (x: number, factory = false) => {
    const p = new Pixels(120, 120, sky);
    p.rect(0, 20, 120, 100, factory ? stone : gold).rect(0, 18, 120, 6, dark);
    if (!factory) for (let y = 0; y < 20; y++) p.rect(60 - y * 3, y, y * 6, 1, red);
    else p.rect(80, 0, 20, 20, dark).rect(82, 2, 16, 18, red);
    for (const wx of [20, 80]) for (const wy of [40, 80])
      p.rect(wx, wy, 20, 20, dark).rect(wx + 2, wy + 2, 16, 16, white).rect(wx + 9, wy + 2, 2, 16, dark);
    p.rect(50, 80, 20, 40, dark).rect(53, 83, 14, 37, red);
    put(p, x, 34);
  };
  const tree = (x: number) => {
    const p = new Pixels(80, 120, sky);
    p.rect(35, 40, 10, 80, earth);
    for (const [cx, cy] of [[20, 40], [60, 40], [40, 20], [40, 60]]) p.disc(cx, cy, 19, green).disc(cx - 3, cy - 4, 13, leaf);
    put(p, x, 34);
  };
  const tent = (x: number) => {
    const p = new Pixels(200, 140, sky);
    for (let y = 0; y < 60; y++) for (let xx = 100 - Math.floor(y * 5 / 3); xx <= 100 + Math.floor(y * 5 / 3); xx++)
      p.set(xx, y, Math.floor(xx / 20) % 2 ? red : white);
    for (let xx = 0; xx < 200; xx++) p.rect(xx, 60, 1, 80, Math.floor(xx / 20) % 2 ? red : white);
    p.rect(70, 60, 60, 80, dark).rect(76, 66, 48, 74, gold);
    put(p, x, 33);
  };
  if (theme === 'stripe') { house(2); for (const x of [20, 45, 68]) tree(x); }
  if (theme === 'street') for (const x of [12, 36, 62]) house(x);
  if (theme === 'park') for (const x of [10, 22, 38, 62, 74]) tree(x);
  if (theme === 'city') for (const x of [10, 34, 62]) house(x, true);
  if (theme === 'club') for (const x of [12, 44, 66]) tent(x);
  if (theme === 'sky') {
    const p = new Pixels(160, 40, sky); p.line(0, 4, 159, 4, dark);
    for (const x of [20, 60, 100]) p.rect(x, 5, 20, 24, x === 60 ? red : white).rect(x + 6, 29, 8, 6, dark);
    for (const x of [20, 40, 60]) put(p, x, 25);
  }
  const wall = tile(new Pixels(20, 20, green).frame(0, 0, 20, 20, leaf).px, 15);
  for (const x of [4, 95]) for (let y = 0; y < 40; y++) map.blocks[y * 100 + x] = wall;
  return { map, blocks };
}

/** Preserve the exact scenery and physics beneath each collected stripe. */
export function placeStripes(map: GameMap, blocks: Block[], pieces: { x: number; y: number }[], counter: number, colors: [number, number, number], reserved: number[]): void {
  const occupied = new Set([...map.blocks, ...reserved]);
  for (const id of [...occupied]) { occupied.add(blocks[id].nextBl); occupied.add(blocks[id].touchBl); }
  const free = Array.from({ length: 150 }, (_, i) => 149 - i).filter(id => !occupied.has(id));
  const variants = new Map<number, number>();
  for (const { x, y } of pieces) {
    const at = y * 100 + x, base = map.blocks[at];
    let id = variants.get(base);
    if (id === undefined) {
      id = free.shift(); if (id === undefined) throw new Error('No stripe variant slot');
      const b = blocks[id] = { ...blocks[base], pixels: blocks[base].pixels.slice(), effect: counter, eamt: 1, scorePts: 25, nextBl: id, touchBl: base };
      for (let py = 6; py <= 13; py++) for (let px = 2; px <= 17; px++)
        b.pixels[py * 20 + px] = py === 6 || py === 13 || px === 2 || px === 17 ? colors[2] : px < 7 || px > 12 ? colors[0] : colors[1];
      variants.set(base, id);
    }
    map.blocks[at] = id;
  }
}

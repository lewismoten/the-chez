// Distinct, harmless physical challenges made from native collision and gravity blocks.
import type { Block } from '../../GameMaker/web/src/formats/blocks.ts';
import type { GameMap } from '../../GameMaker/web/src/formats/map.ts';
import { matchColor } from '../../GameMaker/web/src/formats/palette.ts';
import { Pixels } from '../../GameMaker/games/kit/pixels.ts';

export function courseObstacles(theme: string, map: GameMap, blocks: Block[], palette: Uint8Array, reserved: number[]): void {
  const used = new Set([...map.blocks, ...reserved]);
  for (const id of [...used]) {
    used.add(blocks[id].nextBl);
    used.add(blocks[id].touchBl);
  }
  const free = Array.from({ length: 150 }, (_, i) => 149 - i).filter((id) => !used.has(id));
  const color = (r: number, g: number, b: number) => matchColor(palette, r, g, b);
  const dark = color(7, 13, 19),
    gold = color(61, 44, 15),
    white = color(63, 61, 55),
    green = color(12, 33, 14),
    leaf = color(21, 43, 18),
    pink = color(56, 28, 41);
  const make = (p: Pixels, solid = 15, grav = 4) => {
    const id = free.shift();
    if (id === undefined) throw new Error('No course obstacle slot');
    blocks[id] = { ...blocks[0], pixels: p.px.slice(), solid, grav, nextBl: id, touchBl: id };
    return id;
  };
  const barrier = (xs: number[], height = 1) => {
    const p = new Pixels(20, 20, gold).frame(0, 0, 20, 20, dark).line(1, 1, 18, 18, white).line(18, 1, 1, 18, white);
    const id = make(p);
    for (const x of xs) for (let y = 40 - height; y < 40; y++) map.blocks[y * 100 + x] = id;
  };
  if (theme === 'stripe') barrier([28, 29, 52, 53]);
  if (theme === 'street') barrier([24, 25, 44, 45, 64, 65]);
  if (theme === 'city') {
    barrier([22, 23, 24]);
    barrier([62, 63], 2);
  }
  if (theme === 'park') {
    const hedge = make(new Pixels(20, 20, green).frame(0, 0, 20, 20, leaf));
    for (let y = 34; y <= 39; y++) for (let x = 50; x <= 53; x++) map.blocks[y * 100 + x] = hedge;
    const wind = make(new Pixels(20, 20, blocks[0].pixels[0]).line(5, 12, 10, 6, white).line(10, 6, 15, 12, white), 0, 1);
    // One column asks the player to stop and ride rather than run straight through.
    for (let y = 30; y <= 39; y++) map.blocks[y * 100 + 45] = wind;
    const ledge = make(new Pixels(20, 20, blocks[0].pixels[0]).rect(0, 0, 20, 5, gold).rect(0, 5, 20, 2, dark), 1);
    for (let x = 46; x <= 55; x++) map.blocks[34 * 100 + x] = ledge;
  }
  if (theme === 'club') {
    // A missed stepping stone lands in a foam tray. The lift at its far end returns you.
    const foam = make(new Pixels(20, 20, pink).disc(5, 7, 4, white).disc(15, 14, 4, white));
    const stone = make(new Pixels(20, 20, gold).frame(0, 0, 20, 20, dark));
    const lift = make(new Pixels(20, 20, blocks[0].pixels[0]).line(5, 13, 10, 6, white).line(10, 6, 15, 13, white), 0, 1);
    for (const start of [24, 48]) {
      for (let x = start; x <= start + 9; x++) {
        for (let y = 40; y <= 44; y++) map.blocks[y * 100 + x] = 0;
        map.blocks[45 * 100 + x] = foam;
      }
      for (const x of [start + 2, start + 3, start + 6, start + 7]) map.blocks[40 * 100 + x] = stone;
      for (let y = 37; y <= 44; y++) map.blocks[y * 100 + start + 9] = lift;
      for (let y = 41; y <= 44; y++) map.blocks[y * 100 + start] = lift;
    }
  }
}

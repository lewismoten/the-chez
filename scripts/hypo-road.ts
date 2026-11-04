// The flat street levels' block set: the painted town cut into blocks (gravity down so the car stands), the far lane
// as the solid floor, the street's two ends as walls, and optional puddles. A puddle is built of animated blocks:
// the car's row pulls the car back (left gravity) on one frame in three, so it slows without ever stopping; the road row
// below it is the same ripple on a solid floor. Cells in a puddle start on different frames, so the ripples travel.
import { emptyBlock, type Block } from '@lewismoten/gamemaker-sandbox-tools/formats/blocks';
import { newMap } from '@lewismoten/gamemaker-sandbox-tools/formats/map';
import { paintTown, ROW, type TownKind } from './hypo-town.ts';
import { puddleFrames } from './hypo-weather.ts';

export interface Road {
  blocks: Block[];
  map: ReturnType<typeof newMap>;
  used: number;
}

/** `puddles` are [first cell, width in cells] pairs along the car's lane. */
export function roadBlocks(kind: TownKind, puddles: [number, number][] = []): Road {
  const blocks = Array.from({ length: 150 }, (_, i) => emptyBlock(i));
  for (const block of blocks) block.grav = 4;
  const map = newMap();
  const cut = paintTown(kind).cut();
  let used = 0;
  const seen = new Map<string, number>();
  const make = (px: Uint8Array, rules: Partial<Block> = {}, share = true): number => {
    const key = Buffer.from(px).toString('latin1') + JSON.stringify(rules);
    const old = share ? seen.get(key) : undefined;
    if (old !== undefined) return old;
    if (used >= 150) throw new Error(`The ${kind} street needs more than 150 art blocks`);
    const id = used++;
    blocks[id].pixels.set(px);
    Object.assign(blocks[id], { grav: 4 }, rules);
    seen.set(key, id);
    return id;
  };
  for (let i = 0; i < map.blocks.length; i++) map.blocks[i] = make(cut.tiles[cut.map[i]].px);
  const floor = { solid: 15 };
  // the road's far lane is the floor the car stands on, and the street's two ends are buildings
  for (let x = 0; x < 100; x++) map.blocks[(ROW + 1) * 100 + x] = make(cut.tiles[cut.map[(ROW + 1) * 100 + x]].px, floor);
  for (const x of [0, 99]) for (const y of [ROW - 1, ROW]) map.blocks[y * 100 + x] = make(cut.tiles[cut.map[y * 100 + x]].px, floor);
  if (puddles.length) {
    const frames = puddleFrames();
    // three chains (cap, middle, cap) per row, each three frames; frame 0 of the car's row pulls the car back
    const chain = (pics: Uint8Array[], rules: (frame: number) => Partial<Block>): number => {
      const first = used;
      pics.forEach((px, f) => make(px, { ...rules(f), ntime: 3, nextBl: first + ((f + 1) % 3) }, false));
      return first;
    };
    const carChain = [0, 1, 2].map((part) => chain([0, 1, 2].map((ph) => frames.car[ph][part].px), (f) => ({ grav: f === 0 ? 12 : 4 })));
    const roadChain = [0, 1, 2].map((part) => chain([0, 1, 2].map((ph) => frames.road[ph][part].px), () => floor));
    for (const [first, width] of puddles)
      for (let k = 0; k < width; k++) {
        const part = k === 0 ? 0 : k === width - 1 ? 2 : 1;
        const phase = (first + k) % 3;
        map.blocks[ROW * 100 + first + k] = carChain[part] + phase;
        map.blocks[(ROW + 1) * 100 + first + k] = roadChain[part] + phase;
      }
  }
  return { blocks, map, used };
}

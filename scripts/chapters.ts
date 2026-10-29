// Two new stripe trails built from Teddy's original street and park scenery and Game-Maker files.
import { parseBlocks, serializeBlocks } from '../../GameMaker/web/src/formats/blocks.ts';
import { parseMap, reindexMonsters, serializeMap } from '../../GameMaker/web/src/formats/map.ts';
import { parseMonsters } from '../../GameMaker/web/src/formats/monster.ts';
import { matchColor, parsePalette } from '../../GameMaker/web/src/formats/palette.ts';
import { chezPicture, type ChezInk } from '../../GameMaker/games/kit/chez.ts';

export interface Chapter {
  source: 'street' | 'park';
  stem: string;
  name: string;
  carX: number;
  startX: number;
  required: number;
  counter: number;
  pieces: { x: number; y: number }[];
  sampleX: number;
}

export const CHAPTERS: Chapter[] = [
  {
    source: 'street', stem: 'street', name: 'Maple Street', carX: 83, startX: 8, required: 8, counter: 22, sampleX: 6,
    pieces: [12, 17, 22, 27, 32, 37, 42, 47, 52, 57, 62, 67, 72, 77].map((x, i) => ({ x, y: i % 2 ? 38 : 39 })),
  },
  {
    source: 'park', stem: 'park', name: 'Puddlewick Park', carX: 84, startX: 8, required: 8, counter: 23, sampleX: 17,
    pieces: [12, 17, 22, 27, 32, 37, 42, 47, 52, 57, 62, 67, 72, 77].map((x, i) => ({ x, y: i % 3 ? 38 : 39 })),
  },
];

/** Generate a chapter's real DOS palette, map, block sets and monsters. */
export function buildChapter(chapter: Chapter, read: (name: string) => Uint8Array, put: (name: string, data: Uint8Array) => void): { palette: Uint8Array; ink: ChezInk } {
  const pal = parsePalette(read(`${chapter.source}.pal`));
  const bbl = parseBlocks(read(`${chapter.source}.bbl`), 150);
  const mbl = parseBlocks(read(`${chapter.source}.mbl`), 100);
  const monsters = parseMonsters(read(`${chapter.source}.mon`));
  const map = parseMap(read(`${chapter.source}.map`));
  const color = (r: number, g: number, b: number) => matchColor(pal, r, g, b);
  const black = color(9, 12, 15), red = color(52, 12, 9), white = color(62, 61, 57);
  const ink: ChezInk = { body: [red, red, red], trim: black, glass: [black, white], roof: black, tire: black, hub: white, bumper: black, lamp: white, tail: red, pin: white, rim: white };

  // Replace the ticket animation with a stripe piece. Its existing effect adds one to
  // counter 21. The door consumes the whole chapter's quota, so no old pickup can buy it.
  for (const index of [monsters[12].pic[0][0], monsters[12].pic[1][0]]) {
    const block = mbl[index];
    block.pixels.fill(255);
    for (let y = 6; y <= 13; y++) for (let x = 2; x <= 17; x++) {
      const dx = x - 2;
      block.pixels[y * 20 + x] = y === 6 || y === 13 || x === 2 || x === 17 ? white : dx < 5 || dx > 10 ? black : red;
    }
  }

  const sample = chapter.sampleX;
  for (let x = chapter.startX; x < chapter.carX - 3; x++) {
    for (const y of [37, 38, 39]) map.blocks[y * 100 + x] = map.blocks[y * 100 + sample];
    map.blocks[40 * 100 + x] = map.blocks[40 * 100 + sample];
  }
  // Remove old Teddy-game prizes above the route. Their pictures would otherwise look
  // like extra stripe pieces and alter counters this quest never uses.
  for (let x = chapter.startX; x < chapter.carX - 3; x++) for (let y = 25; y < 37; y++) {
    const at = y * 100 + x;
    const block = bbl[map.blocks[at]];
    if (block.effect || block.obj || block.scorePts || block.chHitPt) map.blocks[at] = map.blocks[y * 100 + sample];
  }
  for (const placed of map.monsters) placed.monnum = 64;
  reindexMonsters(map);

  // Gwinn keeps the rendezvous by the car, using an unused background block slot.
  const sky = map.blocks[39 * 100 + sample];
  const gwinnBlock = Array.from({ length: 149 }, (_, i) => 148 - i).find((i) => !map.blocks.includes(i));
  if (gwinnBlock === undefined) throw new Error(`No block slot for Gwinn in ${chapter.name}`);
  bbl[gwinnBlock] = { ...bbl[sky], pixels: bbl[sky].pixels.slice(), nextBl: gwinnBlock, touchBl: gwinnBlock };
  const gwinn = mbl[monsters[10].pic[0][0]].pixels;
  for (let i = 0; i < 400; i++) if (gwinn[i] !== 255) bbl[gwinnBlock].pixels[i] = gwinn[i];
  map.blocks[39 * 100 + chapter.carX - 4] = gwinnBlock;

  const car = chezPicture(ink);
  const doorIndex = map.blocks[39 * 100 + chapter.carX];
  const backIndex = map.blocks[39 * 100 + chapter.carX + 1];
  const openIndex = Array.from({ length: 149 }, (_, i) => 148 - i).find((i) => i !== gwinnBlock && !map.blocks.includes(i));
  if (openIndex === undefined) throw new Error(`No block slot for the open car door in ${chapter.name}`);
  const pieceIndex = Array.from({ length: 149 }, (_, i) => 148 - i).find((i) => i !== gwinnBlock && i !== openIndex && !map.blocks.includes(i));
  const highPieceIndex = Array.from({ length: 149 }, (_, i) => 148 - i).find((i) => i !== gwinnBlock && i !== openIndex && i !== pieceIndex && !map.blocks.includes(i));
  if (pieceIndex === undefined || highPieceIndex === undefined) throw new Error(`No block slot for stripe pieces in ${chapter.name}`);
  for (const [y, index] of [[39, pieceIndex], [38, highPieceIndex]]) {
    const base = map.blocks[y * 100 + chapter.startX + 1];
    bbl[index] = { ...bbl[base], pixels: bbl[base].pixels.slice(), effect: chapter.counter, eamt: 1, scorePts: 25, nextBl: index, touchBl: base };
    for (let py = 6; py <= 13; py++) for (let px = 2; px <= 17; px++) {
      const dx = px - 2;
      bbl[index].pixels[py * 20 + px] = py === 6 || py === 13 || px === 2 || px === 17 ? white : dx < 5 || dx > 10 ? black : red;
    }
  }
  for (const { x, y } of chapter.pieces) map.blocks[y * 100 + x] = y === 39 ? pieceIndex : highPieceIndex;
  for (let half = 0; half < 2; half++) {
    const block = bbl[half ? backIndex : doorIndex];
    block.pixels.set(bbl[sky].pixels);
    for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) {
      const c = car.px[y * 40 + x + half * 20];
      if (c !== 255) block.pixels[y * 20 + x] = c;
    }
  }
  bbl[doorIndex].effect = chapter.counter;
  bbl[doorIndex].eamt = -chapter.required;
  bbl[doorIndex].solid = 15;
  bbl[doorIndex].touchBl = openIndex;
  bbl[openIndex] = { ...bbl[doorIndex], pixels: bbl[doorIndex].pixels.slice(), solid: 0, effect: 0, eamt: 0, nextBl: openIndex, touchBl: openIndex };
  for (let y = 7; y < 16; y++) for (let x = 6; x < 13; x++) bbl[openIndex].pixels[y * 20 + x] = black;
  put(`${chapter.stem}.pal`, pal);
  put(`${chapter.stem}.bbl`, serializeBlocks(bbl));
  put(`${chapter.stem}.mbl`, serializeBlocks(mbl));
  put(`${chapter.stem}.mon`, read(`${chapter.source}.mon`));
  put(`${chapter.stem}.map`, serializeMap(map));
  return { palette: pal, ink };
}

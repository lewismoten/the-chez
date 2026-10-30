// Original stripe courses using shared cast art and native Game-Maker files.
import { parseBlocks, serializeBlocks } from '@lewismoten/gamemaker-sandbox-tools/formats/blocks';
import { reindexMonsters, serializeMap } from '@lewismoten/gamemaker-sandbox-tools/formats/map';
import { parseMonsters, serializeMonsters } from '@lewismoten/gamemaker-sandbox-tools/formats/monster';
import { matchColor, parsePalette } from '@lewismoten/gamemaker-sandbox-tools/formats/palette';
import type { ChezInk } from '../assets/source/chez.ts';
import { courseObstacles } from './course-obstacles.ts';
import { courseScenery, placeStripes } from './course-scenery.ts';
import { skyLaundry } from './sky-laundry.ts';
import { umbrellaWeather } from './umbrella-weather.ts';
import { victoryLap } from './victory-lap.ts';
import { leafCrossing } from './leaf-crossing.ts';
import { stripeCar } from './stripe-car.ts';
import { windKites } from './wind-kites.ts';
import { gwinnMaze } from './gwinn-maze.ts';

export interface Chapter {
  source: 'backyard' | 'street' | 'park' | 'city' | 'klub';
  stem: string;
  name: string;
  carX: number;
  startX: number;
  required: number;
  counter: number;
  pieces: { x: number; y: number }[];
  sampleX: number;
  quip: string;
  beat: string;
}

export const CHAPTERS: Chapter[] = [
  {
    source: 'street',
    stem: 'street',
    name: 'Maple Street',
    carX: 83,
    startX: 8,
    required: 8,
    counter: 22,
    sampleX: 6,
    quip: 'HOP TO CATCH FLYING STRIPES!',
    beat: 'THE WIND ALWAYS SENDS MORE.',
    pieces: [12, 22, 32, 42, 52, 62, 72].map((x) => ({ x, y: 39 })),
  },
  {
    source: 'park',
    stem: 'park',
    name: 'Puddlewick Park',
    carX: 84,
    startX: 8,
    required: 8,
    counter: 23,
    sampleX: 17,
    quip: "RIDE UP. LEFT FOR GWINN'S LEAF.",
    beat: 'BRING IT TO THE WOODEN GATE.',
    pieces: [12, 17, 22, 27, 32, 37, 42, 57, 62, 67, 72, 77]
      .map((x, i) => ({ x, y: i % 3 ? 38 : 39 }))
      .concat([...[35, 39, 43].map((x) => ({ x, y: 31 })), { x: 48, y: 33 }, { x: 50, y: 33 }, { x: 53, y: 33 }]),
  },
  {
    source: 'city',
    stem: 'city',
    name: 'Downtown',
    carX: 80,
    startX: 8,
    required: 9,
    counter: 24,
    sampleX: 10,
    quip: 'WAIT FOR GO. ARROWS PUSH!',
    beat: 'DOC LEO TAKES A TURN!',
    pieces: [11, 15, 19, 23, 27, 31, 35, 39, 43, 47, 51, 55, 59, 63, 67, 71, 75].map((x, i) => ({ x, y: i % 3 === 0 ? 39 : 38 })),
  },
  {
    source: 'klub',
    stem: 'club',
    name: 'The Clown Club',
    carX: 78,
    startX: 8,
    required: 10,
    counter: 25,
    sampleX: 17,
    quip: 'HOP THE STONES. FOAM CATCHES!',
    beat: 'BALLOON STRIPES ARE BONUSES.',
    pieces: [...[11, 15, 19, 27, 31, 35, 51, 55, 59].map((x) => ({ x, y: 39 })), ...[39, 47, 60].map((x) => ({ x, y: 39 }))],
  },
  {
    source: 'park',
    stem: 'sky',
    name: 'Sky Laundry',
    carX: 84,
    startX: 8,
    required: 9,
    counter: 26,
    sampleX: 17,
    quip: 'PAUSE IN WIND. AVOID Z CLOUDS.',
    beat: 'THE WIND WASHED THE STRIPES.',
    pieces: [{ x: 11, y: 39 }, { x: 76, y: 39 }, ...[20, 23, 29, 60, 63, 69].map((x) => ({ x, y: 35 })), ...[40, 43, 49].map((x) => ({ x, y: 33 }))],
  },
  {
    source: 'park',
    stem: 'maze',
    name: "Gwinn's Shortcut",
    carX: 84,
    startX: 8,
    required: 10,
    counter: 27,
    sampleX: 17,
    quip: 'ARROWS MOVE. SPACE GOES DOWN.',
    beat: 'GWINN TAKES THE LEAD!',
    pieces: [],
  },
  {
    source: 'park',
    stem: 'umbrella',
    name: 'Umbrella Weather',
    carX: 84,
    startX: 8,
    required: 8,
    counter: 28,
    sampleX: 8,
    quip: 'SPACE: TAKE THE UMBRELLA.',
    beat: 'UP: OPEN AND RISE. LET GO: FOLD.',
    pieces: [],
  },
  {
    source: 'city',
    stem: 'lap',
    name: "Teddy's Victory Lap",
    carX: 10,
    startX: 84,
    required: 10,
    counter: 29,
    sampleX: 10,
    quip: 'LEFT: DRIVE. UP: BOUNCE.',
    beat: 'TEDDY FITTED EVERY STRIPE.',
    pieces: [],
  },
];

/** Generate a chapter's real DOS palette, map, block sets and monsters. */
export function buildChapter(
  chapter: Chapter,
  read: (name: string) => Uint8Array,
  put: (name: string, data: Uint8Array) => void,
): { palette: Uint8Array; ink: ChezInk } {
  if (chapter.stem === 'lap') return victoryLap(read, put, chapter.counter);
  if (chapter.stem === 'umbrella') return umbrellaWeather(read, put, chapter.counter);
  if (chapter.stem === 'maze') return gwinnMaze(read, put, 0);
  const pal = parsePalette(read('backyard.pal'));
  const { map, blocks: bbl } = courseScenery(chapter.stem, pal);
  const mbl = parseBlocks(read(`${chapter.source}.mbl`), 100);
  const monsters = parseMonsters(read(`${chapter.source}.mon`));
  const color = (r: number, g: number, b: number) => matchColor(pal, r, g, b);
  const black = color(9, 12, 15),
    red = color(52, 12, 9),
    white = color(62, 61, 57);
  const ink: ChezInk = {
    body: [red, red, red],
    trim: black,
    glass: [black, white],
    roof: black,
    tire: black,
    hub: white,
    bumper: black,
    lamp: white,
    tail: red,
    pin: white,
    rim: white,
  };

  // Replace the ticket animation with a stripe piece. Its existing effect adds one to
  // counter 21. The door consumes the whole chapter's quota, so no old pickup can buy it.
  for (const index of [monsters[12].pic[0][0], monsters[12].pic[1][0]]) {
    const block = mbl[index];
    block.pixels.fill(255);
    if (chapter.source === 'klub') {
      block.effect = chapter.counter;
      block.eamt = 1;
    }
    for (let y = 6; y <= 13; y++)
      for (let x = 2; x <= 17; x++) {
        const dx = x - 2;
        block.pixels[y * 20 + x] = y === 6 || y === 13 || x === 2 || x === 17 ? white : dx < 5 || dx > 10 ? black : red;
      }
  }

  for (const placed of map.monsters) placed.monnum = 64;
  if (chapter.source === 'klub') {
    // Friendly balloon dogs hand over their stripe pieces when Teddy says woof.
    // Their power keeps a simple touch from popping them; Teddy's bark is stronger.
    monsters[16] = { ...monsters[15], power: 102, newmon: 12, end: 0, towards: 0 };
    for (const [index] of monsters[15].pic)
      if (index < 100) {
        mbl[index].chHitPt = mbl[index].scorePts = mbl[index].effect = mbl[index].eamt = 0;
      }
    for (const [i, x] of [24, 43, 64, 70].entries()) map.monsters[i] = { monnum: 16, status: 0, xtra: 0, curx: x, cury: 39, extra: 0 };
  }
  // Gwinn keeps the rendezvous by the car, using an unused background block slot.
  const sky = map.blocks[39 * 100 + chapter.carX - 4];
  const gwinnBlock = Array.from({ length: 149 }, (_, i) => 148 - i).find((i) => !map.blocks.includes(i));
  if (gwinnBlock === undefined) throw new Error(`No block slot for Gwinn in ${chapter.name}`);
  bbl[gwinnBlock] = { ...bbl[sky], pixels: bbl[sky].pixels.slice(), nextBl: gwinnBlock, touchBl: gwinnBlock };
  const gwinn = mbl[monsters[10].pic[0][0]].pixels;
  for (let i = 0; i < 400; i++) if (gwinn[i] !== 255) bbl[gwinnBlock].pixels[i] = gwinn[i];
  map.blocks[39 * 100 + chapter.carX - 4] = gwinnBlock;

  const car = stripeCar(ink, 0);
  const free = Array.from({ length: 149 }, (_, i) => 148 - i).filter((i) => i !== gwinnBlock && !map.blocks.includes(i));
  const [doorIndex, backIndex, openIndex] = free;
  if ([doorIndex, backIndex, openIndex].some((index) => index === undefined)) throw new Error(`No block slots for THE CHEZ in ${chapter.name}`);
  const carBase = map.blocks[39 * 100 + chapter.carX];
  bbl[doorIndex] = { ...bbl[carBase], pixels: bbl[carBase].pixels.slice(), nextBl: doorIndex, touchBl: doorIndex };
  bbl[backIndex] = { ...bbl[carBase], pixels: bbl[carBase].pixels.slice(), nextBl: backIndex, touchBl: backIndex };
  map.blocks[39 * 100 + chapter.carX] = doorIndex;
  map.blocks[39 * 100 + chapter.carX + 1] = backIndex;
  if (chapter.stem === 'sky') skyLaundry(map, bbl, free.slice(5), pal, chapter.sampleX);
  else if (chapter.source === 'park' || chapter.source === 'city') {
    const mechanicIndex = free[5];
    if (mechanicIndex === undefined) throw new Error(`No block slot for ${chapter.name}'s road trick`);
    const base = map.blocks[39 * 100 + chapter.startX + 1];
    bbl[mechanicIndex] = {
      ...bbl[base],
      pixels: bbl[base].pixels.slice(),
      grav: chapter.source === 'park' ? 1 : 6,
      effect: 0,
      eamt: 0,
      nextBl: mechanicIndex,
      touchBl: mechanicIndex,
    };
    for (let py = 5; py < 15; py++)
      for (let px = 4; px < 16; px++) {
        if (chapter.source === 'park' ? Math.abs(px - 10) < (py % 5) + 2 : px >= (py % 6) + 4 && px < (py % 6) + 8)
          bbl[mechanicIndex].pixels[py * 20 + px] = py % 2 ? white : red;
      }
    for (let x = chapter.source === 'park' ? 45 : 28; x <= (chapter.source === 'park' ? 45 : 34); x++) map.blocks[39 * 100 + x] = mechanicIndex;
  }
  if (chapter.stem === 'street') windKites(map, bbl, monsters, mbl, free.slice(5), pal, chapter.counter);
  if (chapter.stem === 'city') leafCrossing(map, bbl, free.slice(6), pal);
  for (let half = 0; half < 2; half++) {
    const block = bbl[half ? backIndex : doorIndex];
    block.pixels.set(bbl[map.blocks[39 * 100 + chapter.carX + half]].pixels);
    for (let y = 0; y < 20; y++)
      for (let x = 0; x < 20; x++) {
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
  courseObstacles(chapter.stem, map, bbl, pal, [openIndex]);
  placeStripes(map, bbl, chapter.pieces, chapter.counter, [black, red, white], [openIndex]);
  reindexMonsters(map);
  put(`${chapter.stem}.pal`, pal);
  put(`${chapter.stem}.bbl`, serializeBlocks(bbl));
  put(`${chapter.stem}.mbl`, serializeBlocks(mbl));
  put(`${chapter.stem}.mon`, serializeMonsters(monsters));
  put(`${chapter.stem}.map`, serializeMap(map));
  return { palette: pal, ink };
}

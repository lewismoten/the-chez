// Inventory unlocks Teddy's umbrella flight in real DOS game data.
// Format and drawing helpers: Lewis Moten (MIT), credited in NOTICE.md.
import { emptyBlock, parseBlocks, serializeBlocks } from '@lewismoten/gamemaker-sandbox-tools/formats/blocks';
import { emptyFrame, newCharacter, serializeCharacter } from '@lewismoten/gamemaker-sandbox-tools/formats/character';
import { newMap, serializeMap } from '@lewismoten/gamemaker-sandbox-tools/formats/map';
import { newMonsterSet, serializeMonsters } from '@lewismoten/gamemaker-sandbox-tools/formats/monster';
import { matchColor, parsePalette } from '@lewismoten/gamemaker-sandbox-tools/formats/palette';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/drawing';
import { stripeCar } from './stripe-car.ts';
import { placeStripes } from './course-scenery.ts';
import { UMBRELLA_HOME, UMBRELLA_SLOT, WEATHER_WINDOWS } from '../src/umbrella-route.ts';

/** Also retained in the victory road's block set so the carried object's picture stays meaningful. */
export function umbrellaPicture(palette: Uint8Array): Pixels {
  const c = (r: number, g: number, b: number) => matchColor(palette, r, g, b);
  const p = new Pixels(20, 20, 255),
    red = c(54, 11, 7),
    white = c(63, 61, 55),
    dark = c(7, 13, 19);
  for (let y = 2; y <= 9; y++) for (let x = 2; x <= 17; x++) if ((x - 10) ** 2 + (y - 10) ** 2 < 70) p.set(x, y, Math.floor(x / 4) % 2 ? red : white);
  p.line(10, 9, 10, 17, dark).line(10, 17, 8, 19, dark).line(8, 19, 6, 17, dark);
  return p;
}

export function umbrellaWeather(
  read: (name: string) => Uint8Array,
  put: (name: string, data: Uint8Array) => void,
  counter: number,
): { palette: Uint8Array; ink: Parameters<typeof stripeCar>[0] } {
  const palette = parsePalette(read('backyard.pal'));
  const c = (r: number, g: number, b: number) => matchColor(palette, r, g, b);
  const sky = c(28, 37, 52),
    dark = c(7, 13, 19),
    white = c(63, 61, 55),
    red = c(54, 11, 7),
    blue = c(21, 34, 49),
    gold = c(61, 44, 15);
  const ink = {
    body: [red, red, red] as [number, number, number],
    trim: dark,
    glass: [dark, white] as [number, number],
    roof: dark,
    tire: dark,
    hub: white,
    bumper: dark,
    lamp: gold,
    tail: red,
    pin: white,
    rim: white,
  };
  const blocks = Array.from({ length: 150 }, (_, i) => emptyBlock(i));
  for (const b of blocks) {
    b.pixels.fill(sky);
    b.grav = 0;
  }
  const map = newMap();
  map.blocks.fill(0);
  blocks[1].pixels.fill(dark);
  blocks[1].solid = 15;
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) blocks[1].pixels[y * 20 + x] = y % 10 === 0 || x % 10 === 0 ? blue : dark;
  for (let y = 40; y < 100; y++) for (let x = 0; x < 100; x++) map.blocks[y * 100 + x] = 1;
  for (let x = 4; x <= 95; x++) map.blocks[22 * 100 + x] = 1;
  for (const x of [4, 95]) for (let y = 23; y <= 39; y++) map.blocks[y * 100 + x] = 1;
  // Full-height curtains force three different flight heights. Their openings are generous.
  blocks[2].solid = 15;
  blocks[2].pixels.fill(blue);
  for (let y = 0; y < 20; y++) for (const x of [0, 19]) blocks[2].pixels[y * 20 + x] = white;
  for (const [x, y] of [
    [6, 6],
    [13, 15],
  ]) {
    for (let dy = -2; dy <= 2; dy++) for (let dx = -1; dx <= 1; dx++) if (dy >= -1 || dx === 0) blocks[2].pixels[(y + dy) * 20 + x + dx] = white;
  }
  for (const [id, top] of [
    [7, false],
    [8, true],
  ] as const) {
    blocks[id] = { ...blocks[2], pixels: blocks[2].pixels.slice(), nextBl: id, touchBl: id };
    for (let y = 0; y < 3; y++) for (let x = 0; x < 20; x++) blocks[id].pixels[(top ? y : 19 - y) * 20 + x] = white;
  }
  for (const window of WEATHER_WINDOWS) {
    for (let y = 23; y <= 39; y++) if (y < window.top || y > window.bottom) map.blocks[y * 100 + window.x] = 2;
    map.blocks[(window.top - 1) * 100 + window.x] = 7;
    map.blocks[(window.bottom + 1) * 100 + window.x] = 8;
  }
  const arrow = new Pixels(20, 20, sky).line(4, 10, 15, 10, gold).line(15, 10, 10, 5, gold).line(15, 10, 10, 15, gold);
  blocks[3].pixels.set(arrow.px);
  for (const window of WEATHER_WINDOWS) map.blocks[(window.top + 2) * 100 + window.x] = 3;
  // A single recoverable object; no drop key is assigned in this character.
  const umbrella = umbrellaPicture(palette);
  blocks[UMBRELLA_SLOT].pixels.set(umbrella.px.map((v) => (v === 255 ? sky : v)));
  Object.assign(blocks[UMBRELLA_SLOT], { obj: 1, touchBl: 0 });
  map.blocks[UMBRELLA_HOME.y * 100 + UMBRELLA_HOME.x] = UMBRELLA_SLOT;
  const car = stripeCar(ink, 0);
  for (const [id, half] of [
    [4, 0],
    [5, 1],
  ]) {
    for (let y = 0; y < 20; y++)
      for (let x = 0; x < 20; x++) {
        const v = car.px[y * 40 + x + half * 20];
        if (v !== 255) blocks[id].pixels[y * 20 + x] = v;
      }
    map.blocks[39 * 100 + 84 + half] = id;
  }
  Object.assign(blocks[4], { solid: 15, effect: counter, eamt: -8, touchBl: 6 });
  blocks[6] = { ...blocks[4], pixels: blocks[4].pixels.slice(), solid: 0, effect: 0, eamt: 0, nextBl: 6, touchBl: 6 };
  const pieces = [16, 20, 76, 80].map((x) => ({ x, y: 39 }));
  for (const x of [25, 28, 31]) for (const y of [30, 32, 34]) pieces.push({ x, y });
  for (const x of [45, 48, 51]) pieces.push({ x, y: 39 });
  for (const x of [65, 68, 71]) for (const y of [26, 28, 30]) pieces.push({ x, y });
  placeStripes(map, blocks, pieces, counter, [dark, red, white], [6, UMBRELLA_SLOT]);
  const character = newCharacter();
  character.meter[1] = 2;
  for (const id of [4, 6, 8, 10, 12, 14, 16, 18]) Object.assign(character.sequences[id], { sound: 0, bloc: 50, jstkBut: 0 });
  const frame = (pic: number, x = 0, y = 0, top = 50) => ({ ...emptyFrame(), pic1: top, pic2: pic, x, y, orient: x < 0 ? 64 : 0 });
  const set = (id: number, frames: ReturnType<typeof frame>[], options: object = {}) => {
    const s = character.sequences[id];
    s.frames = [...frames, ...Array.from({ length: 10 - frames.length }, () => emptyFrame(true))];
    Object.assign(s, { sound: 30, jstkBut: 4 }, options);
  };
  set(0, [frame(0, 0, 2)]);
  set(1, [frame(0), frame(0)]);
  set(2, [frame(0)]);
  set(3, [{ ...frame(0, 0, 0, 30), pause: 3 }], { key: (57 << 8) | 32, norepeat: 1, ground: 1, sound: 22 });
  for (const [id, key, dx] of [
    [5, 77, 4],
    [7, 75, -4],
    [13, 30, -4],
    [15, 32, 4],
  ])
    set(id, [frame(1, dx, 2), frame(0, dx, 2), frame(2, dx, 2)], { key: key << 8 });
  for (const [id, key] of [
    [9, 72],
    [17, 17],
  ])
    set(id, [frame(0, 0, -1, 30)], { key: key << 8, momentum: 1, bloc: UMBRELLA_SLOT });
  set(11, [frame(0, 0, 2)], { key: 80 << 8, momentum: 1, bloc: UMBRELLA_SLOT });
  const sprites = parseBlocks(read('teddy.cbl'), 50);
  sprites[30].pixels.set(umbrella.px);
  put('umbrella.pal', palette);
  put('umbrella.map', serializeMap(map));
  put('umbrella.bbl', serializeBlocks(blocks));
  put('umbrella.mon', serializeMonsters(newMonsterSet()));
  put('umbrella.mbl', serializeBlocks(Array.from({ length: 100 }, (_, i) => emptyBlock(i, true))));
  put('umbrella.chr', serializeCharacter(character));
  put('umbrella.cbl', serializeBlocks(sprites));
  return { palette, ink };
}

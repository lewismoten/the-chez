// A native Game-Maker vehicle character and a leftward victory road, drawn from the measured CitiCar.
import { emptyBlock, serializeBlocks } from '../../GameMaker/web/src/formats/blocks.ts';
import { emptyFrame, newCharacter, serializeCharacter, type Frame, type Sequence } from '../../GameMaker/web/src/formats/character.ts';
import { newMap, serializeMap } from '../../GameMaker/web/src/formats/map.ts';
import { newMonsterSet, serializeMonsters } from '../../GameMaker/web/src/formats/monster.ts';
import { matchColor, parsePalette } from '../../GameMaker/web/src/formats/palette.ts';
import { chezPicture, type ChezInk } from '../../GameMaker/games/kit/chez.ts';
import { Pixels } from '../../GameMaker/games/kit/pixels.ts';
import { centered } from '../../GameMaker/games/kit/pcText.ts';
import { GWINN } from '../../GameMaker/games/teddy/src/sprites/gwinn.ts';

export const BUMPS = [64, 44, 24];
export const CHEERS = [79, 75, 71, 67, 59, 55, 51, 47, 39, 35, 31, 27, 19, 15];

export function victoryLap(read: (name: string) => Uint8Array, put: (name: string, data: Uint8Array) => void): { palette: Uint8Array; ink: ChezInk } {
  const palette = parsePalette(read('backyard.pal'));
  const color = (r: number, g: number, b: number) => matchColor(palette, r, g, b);
  const red = color(54, 11, 7), black = color(6, 8, 10), white = color(63, 61, 56), gold = color(63, 45, 12);
  const sky = color(14, 30, 42), asphalt = color(17, 19, 22), tan = color(50, 30, 13);
  const ink: ChezInk = { body: [red, red, red], trim: black, glass: [black, white], roof: black, tire: black, hub: white, bumper: black, lamp: gold, tail: red, pin: white, rim: white };
  const blocks = Array.from({ length: 150 }, (_, i) => emptyBlock(i));
  const map = newMap();
  for (const block of blocks) { block.pixels.fill(sky); block.grav = 4; }
  blocks[1].pixels.fill(asphalt);
  blocks[1].solid = 15;
  blocks[2] = { ...blocks[1], pixels: blocks[1].pixels.slice(), nextBl: 2, touchBl: 2 };
  for (let y = 0; y < 2; y++) blocks[1].pixels.fill(white, y * 20, (y + 1) * 20);
  for (let y = 5; y <= 15; y++) for (let x = 3; x < 17; x++) {
    if (x >= Math.abs(y - 10) + 3 && x <= 12) blocks[2].pixels[y * 20 + x] = gold;
  }
  for (let y = 40; y < 100; y++) for (let x = 0; x < 100; x++) map.blocks[y * 100 + x] = y === 42 && x % 4 === 0 ? 2 : 1;
  blocks[3].solid = 15;
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) blocks[3].pixels[y * 20 + x] = (Math.floor(x / 5) + Math.floor(y / 5)) % 2 ? black : gold;
  for (let y = 0; y < 40; y++) for (const x of [4, 95]) map.blocks[y * 100 + x] = 3;
  blocks[4].solid = 15;
  for (let y = 2; y < 20; y++) for (let x = 0; x < 20; x++) if (Math.abs(x - 10) < y + 2) blocks[4].pixels[y * 20 + x] = (x + y) % 8 < 4 ? black : gold;
  for (const x of BUMPS) for (const column of [x, x + 1]) map.blocks[39 * 100 + column] = 4;
  for (let y = 3; y < 16; y++) for (let x = 4; x < 16; x++) if (Math.abs(x - 10) === y - 3 || x === 10) blocks[9].pixels[y * 20 + x] = gold;
  for (const x of [68, 48, 28]) map.blocks[38 * 100 + x] = 9;
  // The same slow clouds from Downtown have turned up to cheer the tiny car home.
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) {
    if (y === 2) blocks[10].pixels[y * 20 + x] = black;
    if (y >= 3 && y < 15 && Math.abs(x - 10) < (15 - y) / 2) blocks[10].pixels[y * 20 + x] = x < 10 ? red : gold;
    if ([4, 10, 16].some((cx) => (x - cx) ** 2 + (y - 9) ** 2 < 40)) blocks[11].pixels[y * 20 + x] = white;
  }
  for (const [x, y] of [[6, 8], [13, 8], [8, 12], [9, 13], [10, 13], [11, 12]]) blocks[11].pixels[y * 20 + x] = black;
  for (let x = 12; x <= 92; x += 3) map.blocks[34 * 100 + x] = 10;
  for (const x of [30, 54, 78]) map.blocks[36 * 100 + x] = 11;
  for (const [id, row] of [[5, 39], [6, 37]]) {
    blocks[id].effect = 27;
    blocks[id].eamt = 1;
    blocks[id].scorePts = 50;
    blocks[id].touchBl = 0;
    for (let y = 3; y <= 18; y++) blocks[id].pixels[y * 20 + 7] = white;
    for (let y = 3; y <= 11; y++) for (let x = 8; x <= 17; x++) blocks[id].pixels[y * 20 + x] = (Math.floor(x / 3) + Math.floor(y / 3)) % 2 ? black : white;
    for (const x of row === 39 ? CHEERS : BUMPS) map.blocks[row * 100 + x] = id;
  }
  // A finish ribbon uses the same counter gate as the foot chapters.
  blocks[7] = { ...blocks[3], pixels: blocks[3].pixels.slice(), effect: 27, eamt: -10, nextBl: 7, touchBl: 0 };
  map.blocks[39 * 100 + 10] = 7;
  const banner = new Pixels(80, 40, black);
  banner.rect(2, 2, 76, 36, sky);
  for (let x = 0; x < 80; x += 5) banner.rect(x, 0, 5, 4, x % 10 ? black : white);
  centered(banner, 14, 'HOME!', white);
  for (let y = 0; y < 2; y++) for (let x = 0; x < 4; x++) {
    const id = 20 + y * 4 + x;
    blocks[id].pixels.set(banner.crop(x * 20, y * 20, 20, 20).px);
    map.blocks[(35 + y) * 100 + 8 + x] = id;
  }
  blocks[8].pixels.set(GWINN.gwinn1.px.map((pixel) => pixel === 255 ? sky : pixel));
  map.blocks[39 * 100 + 13] = 8;

  const character = newCharacter();
  character.meter[1] = 2;
  // PLAYGAME can resume frame -1 after two keys arrive together. Neutral spacer
  // records before each control keep that old memory-read behavior harmless.
  for (const index of [4, 6, 8, 10, 12, 14, 16]) Object.assign(character.sequences[index], { sound: 0, bloc: 50, jstkBut: 0 });
  const sprites = Array.from({ length: 50 }, (_, i) => emptyBlock(i, true));
  const car = chezPicture(ink, 'left');
  // A 20-pixel actor keeps the car's 2:1 side profile; the large cartoons retain every detail.
  for (let y = 0; y < 10; y++) for (let x = 0; x < 20; x++) sprites[0].pixels[(y + 10) * 20 + x] = car.px[(y * 2 + 1) * 40 + x * 2 + 1];
  for (let x = 3; x < 18; x++) {
    const rise = x > 13 ? 1 : 0;
    if (sprites[0].pixels[(15 - rise) * 20 + x] === red) sprites[0].pixels[(15 - rise) * 20 + x] = white;
    for (const y of [16 - rise, 18 - rise]) if (sprites[0].pixels[y * 20 + x] === red) sprites[0].pixels[y * 20 + x] = black;
  }
  // Teddy's matching ears and white blaze peek out of the passenger door window.
  for (const [x, y, c] of [[9, 11, tan], [11, 11, tan], [9, 12, tan], [10, 12, white], [11, 12, tan], [9, 13, black], [10, 13, white], [11, 13, white]]) sprites[0].pixels[y * 20 + x] = c;
  sprites[1].pixels.set(sprites[0].pixels);
  for (const x of [5, 15]) if (sprites[1].pixels[18 * 20 + x] !== 255) sprites[1].pixels[18 * 20 + x] = white;
  for (let y = 12; y < 18; y++) sprites[2].pixels[y * 20 + 3] = gold;
  sprites[2].pixels[19 * 20 + 3] = gold;
  const frame = (pic: number, x = 0, y = 0): Frame => ({ ...emptyFrame(), pic1: 50, pic2: pic, pause: 1, x, y });
  const set = (index: number, frames: Frame[], options: Partial<Sequence> = {}) => {
    const sequence = character.sequences[index];
    sequence.frames = [...frames, ...Array.from({ length: 10 - frames.length }, () => emptyFrame(true))];
    Object.assign(sequence, { sound: 30, jstkBut: 4 }, options);
  };
  set(0, [frame(0)]);
  set(1, [frame(0), frame(0)]);
  set(2, [frame(0)]);
  // Reversing backs up the car, keeping Teddy and the passenger side in view.
  const steer = (index: number, scan: number, direction: number) => set(index, [frame(0, direction * 2), frame(1, direction * 2)], { key: scan << 8, momentum: 1 });
  steer(5, 77, 1); steer(7, 75, -1); steer(13, 32, 1); steer(15, 30, -1);
  const bounce = { ...frame(0, 0, -10), pause: 3 };
  set(9, [bounce], { key: 72 << 8, momentum: 1, norepeat: 1, ground: 1, sound: 16 });
  set(17, [{ ...bounce }], { key: (17 << 8) | 119, momentum: 1, norepeat: 1, ground: 1, sound: 16 });
  set(11, [{ ...frame(0), pic1: 2, pause: 3 }, { ...frame(1), pause: 3 }], { key: (57 << 8) | 32, momentum: 1, norepeat: 1, sound: 20 });
  put('lap.pal', palette);
  put('lap.map', serializeMap(map));
  put('lap.bbl', serializeBlocks(blocks));
  put('lap.mon', serializeMonsters(newMonsterSet()));
  put('lap.mbl', serializeBlocks(Array.from({ length: 100 }, (_, i) => emptyBlock(i, true))));
  put('lap.chr', serializeCharacter(character));
  put('lap.cbl', serializeBlocks(sprites));
  return { palette, ink };
}

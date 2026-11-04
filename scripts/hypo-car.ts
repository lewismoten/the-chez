// The driving character in three speeds. Each is its own native character file: Right moves a fixed
// number of pixels every tick (5 = 25 mph, 6 = 30 mph, 4 = 20 mph), and its top block is the
// speedometer showing that same number. A scene link on the hill's crest swaps the file.
import { emptyBlock, type Block } from '@lewismoten/gamemaker-sandbox-tools/formats/blocks';
import { emptyFrame, newCharacter, type Character, type Frame, type Sequence } from '@lewismoten/gamemaker-sandbox-tools/formats/character';
import { C, carActor, dial } from './hypo-art.ts';

export type Mph = 20 | 25 | 30;
/** Pixels per tick for each speed: the speedometer's number divided by five. */
export const PIXELS_PER_TICK: Record<Mph, number> = { 20: 4, 25: 5, 30: 6 };
export const BACKING = 3;
/** Sprite slots in the driver's .CBL: 0 car, 1 car (wheels turning), 2 horn, 3 to 5 the dials. */
const DIAL_SLOT: Record<Mph, number> = { 20: 3, 25: 4, 30: 5 };

export function carSprites(): Block[] {
  const sprites = Array.from({ length: 50 }, (_, i) => emptyBlock(i, true));
  const car = carActor();
  for (let y = 0; y < 10; y++) for (let x = 0; x < 20; x++) sprites[0].pixels[(y + 10) * 20 + x] = car.px[y * 20 + x];
  // Teddy's matching ears and white blaze peek out of the passenger door window.
  for (const [x, y, c] of [
    [9, 11, C.tan],
    [11, 11, C.tan],
    [9, 12, C.tan],
    [10, 12, C.white],
    [11, 12, C.tan],
    [10, 13, C.white],
  ])
    sprites[0].pixels[y * 20 + x] = c;
  sprites[1].pixels.set(sprites[0].pixels);
  for (const x of [5, 15]) sprites[1].pixels[18 * 20 + x] = C.gold;
  sprites[2].pixels.set(sprites[0].pixels);
  for (let y = 12; y < 18; y++) sprites[2].pixels[y * 20 + 2] = C.gold;
  for (const mph of [20, 25, 30] as Mph[]) sprites[DIAL_SLOT[mph]].pixels.set(dial(mph).px);
  return sprites;
}

export function carCharacter(mph: Mph): Character {
  const character = newCharacter();
  character.meter[1] = 2;
  // PLAYGAME can resume frame -1 after two keys arrive together; neutral spacers keep that harmless.
  for (const index of [4, 6, 8, 10, 12, 14, 16, 18])
    Object.assign(character.sequences[index], {
      sound: 0,
      bloc: 50,
      jstkBut: 0,
    });
  const top = DIAL_SLOT[mph];
  const frame = (pic: number, x = 0): Frame => ({
    ...emptyFrame(),
    pic1: top,
    pic2: pic,
    pause: 1,
    x,
  });
  const set = (index: number, frames: Frame[], options: Partial<Sequence> = {}) => {
    const sequence = character.sequences[index];
    sequence.frames = [...frames, ...Array.from({ length: 10 - frames.length }, () => emptyFrame(true))];
    Object.assign(sequence, { sound: 30, jstkBut: 4 }, options);
  };
  for (const index of [0, 1, 2]) set(index, [frame(0)]);
  const drive = (index: number, scan: number, dx: number) => set(index, [frame(0, dx), frame(1, dx)], { key: scan << 8 });
  const speed = PIXELS_PER_TICK[mph];
  drive(5, 77, speed);
  drive(13, 32, speed);
  drive(7, 75, -BACKING);
  drive(15, 30, -BACKING);
  // Space honks while the car sits still.
  set(11, [{ ...frame(2), pause: 3 }, frame(0)], {
    key: (57 << 8) | 32,
    norepeat: 1,
    sound: 20,
  });
  return character;
}

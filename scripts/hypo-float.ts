// The parade float: a giant sneaker (white sole, blue upper, two charcoal racing stripes and a white pinstripe, white
// laces) with two friendly clowns waving from it. It is drawn level, then sheared a pixel for every six across so its
// sole sits on the downhill road, and sliced into a 3 by 3 block of monster pictures (the clowns' blocks have two frames).
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/drawing';
import { C } from './hypo-art.ts';
import { R } from './hypo-colors.ts';

const W = 60;
const H = 36;

/** The top edge of the shoe's upper at column x (the heel's collar, the ankle opening, the laces, the toe box). */
function top(x: number): number {
  if (x < 3) return 99;
  if (x < 10) return 5;
  if (x < 26) return 11 + (x < 14 ? 0 : 2);
  if (x < 44) return 13 + Math.floor((x - 26) / 3);
  if (x < 56) return 19 + Math.floor((x - 44) / 2);
  return 99;
}

function shoe(): Pixels {
  const p = new Pixels(W, H, 255);
  const blue = [R('blue', 0), R('blue', 1), R('blue', 2), R('blue', 3)];
  for (let x = 3; x < 57; x++) {
    const t = top(x);
    if (t >= 99) continue;
    for (let y = t; y < 30; y++) p.set(x, y, y < t + 2 ? blue[3] : y < 22 ? blue[2] : blue[1]);
    p.set(x, t, R('iron', 0));
  }
  // the toe box rounds off, and the back of the heel is dark
  for (let y = 22; y < 30; y++) p.set(56, y, y > 26 ? 255 : blue[1]);
  for (let y = 5; y < 30; y++) p.set(3, y, R('iron', 0));
  // the sole: thick and white, with a dark underside and tread notches
  for (let x = 1; x < 59; x++) {
    const round = x > 54 ? x - 54 : 0;
    for (let y = 30 + round; y < H; y++) p.set(x, y, y >= H - 2 ? C.cream : C.white);
    p.set(x, H - 1, R('iron', 0));
    if (x % 4 === 2) p.set(x, H - 2, R('iron', 1));
  }
  p.rect(1, 30, 58, 1, R('stone', 2));
  // the stripes: two charcoal bands and a white pinstripe, stepping up behind the middle like THE CHEZ
  for (let x = 6; x < 54; x++) {
    const up = x < 16 ? 4 : x < 20 ? 2 : 0;
    p.set(x, 22 - up, R('iron', 0));
    p.set(x, 23 - up, C.white);
    p.set(x, 24 - up, R('iron', 0));
    p.set(x, 25 - up, R('iron', 0));
  }
  // laces over the front, a tongue standing up, the ankle opening dark inside
  for (let x = 28; x < 44; x += 4) {
    const t = top(x);
    p.line(x, t + 1, x + 3, t + 4, C.white);
    p.line(x + 3, t + 1, x, t + 4, C.white);
  }
  p.rect(25, 10, 6, 3, R('blue', 3));
  p.rect(14, 9, 11, 3, R('iron', 0));
  return p;
}

/** A friendly clown, 10 wide and 16 tall: rainbow wig, white face, red nose, big smile, one hand waving. */
function clown(wave: boolean, suit: number, other: number): Pixels {
  const p = new Pixels(14, 18, 255);
  for (const [x, c] of [[2, R('flag', 0)], [4, R('flag', 1)], [6, R('flag', 2)], [8, R('flag', 3)], [10, R('flag', 0)]] as const) p.disc(x + 1, 3, 2, c);
  p.disc(7, 6, 3, C.white);
  p.set(6, 5, C.black);
  p.set(8, 5, C.black);
  p.set(7, 6, C.red); // the red nose
  p.set(6, 6, C.red);
  p.line(5, 8, 6, 9, R('flag', 0));
  p.line(6, 9, 8, 9, R('flag', 0));
  p.line(8, 9, 9, 8, R('flag', 0));
  p.rect(3, 10, 8, 8, suit);
  p.rect(3, 10, 8, 2, other);
  p.rect(3, 15, 8, 1, other);
  p.set(7, 12, other);
  p.set(7, 14, other);
  // the waving arm: raised high or out sideways
  if (wave) p.line(10, 11, 13, 6, suit);
  else p.line(10, 11, 13, 10, suit);
  p.set(wave ? 13 : 13, wave ? 5 : 9, C.white);
  p.line(3, 11, 1, 14, suit);
  p.set(1, 15, C.white);
  return p;
}

/** The float picture for a wave frame, sheared so its sole follows the road, with the sole's centre at row `rc` of 60. */
function floatPicture(frame: 0 | 1, rc: number): Pixels {
  const level = shoe();
  const p = new Pixels(W, 60, 255);
  const lift = (x: number) => Math.floor((x - 30) / 6); // downhill to the right: one pixel for each six across
  for (let x = 0; x < W; x++)
    for (let y = 0; y < H; y++) {
      const c = level.get(x, y);
      if (c !== 255) p.set(x, rc - (H - 1) + y + lift(x), c);
    }
  const put = (art: Pixels, x: number, bottom: number) => {
    for (let y = 0; y < art.h; y++)
      for (let ax = 0; ax < art.w; ax++) {
        const c = art.get(ax, y);
        if (c !== 255) p.set(x + ax, rc - (H - 1) + bottom - art.h + y + lift(x + ax), c);
      }
  };
  put(clown(frame === 0, C.gold, R('flag', 0)), 13, 14);
  put(clown(frame === 1, R('flag', 2), C.white), 34, top(40) + 3);
  return p;
}

/** The nine cells of the float (row-major, 3 by 3) for each of the two frames: pictures of 20x20 with 255 clear. */
export function floatCells(rc: number): Pixels[][] {
  return [0, 1].map((frame) => {
    const picture = floatPicture(frame as 0 | 1, rc);
    return Array.from({ length: 9 }, (_, i) => picture.crop((i % 3) * 20, Math.floor(i / 3) * 20, 20, 20));
  });
}

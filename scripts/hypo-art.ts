// The Stripe Hypothesis art: one car sprite whose stripes are palette slots, so each trial's
// palette (bare red, one stripe, both stripes, the white pinstripe) is a real palette swap.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { matchColor, parsePalette } from '@lewismoten/gamemaker-sandbox-tools/formats/palette';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/drawing';
import { chezPicture, type ChezInk } from '../assets/source/chez.ts';
import { micro } from '../assets/source/teddy/art/draw.ts';

/** Palette slots the car's stripes use: lower stripe, upper stripe, white pinstripe. */
export const SLOT = { low: 250, high: 251, pin: 252 } as const;
/** Trial stage: 0 bare red, 1 lower stripe, 2 both stripes, 3 the white pinstripe too. */
export type Stage = 0 | 1 | 2 | 3;

const disk = (name: string) => new Uint8Array(readFileSync(fileURLToPath(new URL(`../assets/source/teddy/disk/${name}`, import.meta.url))));
const BASE = parsePalette(disk('backyard.pal'));
const nearest = (r: number, g: number, b: number) => matchColor(BASE, r, g, b);
/** Colors for drawing, always from the shared base slots (never the three stripe slots). */
export const C = {
  red: nearest(54, 11, 7),
  black: nearest(6, 8, 10),
  white: nearest(63, 61, 56),
  gold: nearest(63, 45, 12),
  navy: nearest(4, 13, 19),
  cream: nearest(61, 56, 43),
  dark: nearest(9, 12, 15),
  asphalt: nearest(17, 19, 22),
  sky: nearest(14, 30, 42),
  green: nearest(10, 43, 23),
  tan: nearest(50, 30, 13),
};

/** The palette for a trial: the shared art, plus the three stripe slots for that stage. */
export function palette(stage: Stage): Uint8Array {
  const p = BASE.slice();
  const set = (slot: number, rgb: number[]) => p.set(rgb, slot * 3);
  const red = [54, 11, 7];
  set(SLOT.low, stage >= 1 ? [9, 10, 12] : red);
  set(SLOT.high, stage >= 2 ? [9, 10, 12] : red);
  set(SLOT.pin, stage >= 3 ? [63, 61, 56] : red);
  return p;
}

export const carInk: ChezInk = {
  body: [C.red, C.red, C.red],
  trim: C.black,
  glass: [C.black, C.white],
  roof: C.black,
  tire: C.black,
  hub: C.white,
  bumper: C.black,
  lamp: C.gold,
  tail: C.red,
  rim: C.white,
  lens: C.white,
};

/** THE CHEZ with stripe pixels in the reserved slots; pair it with palette(stage). */
export function car(facing: 'left' | 'right' = 'right', scale = 1): Pixels {
  const plain = chezPicture({ ...carInk, stripe: C.red, pin: C.red }, facing, scale);
  const marked = chezPicture({ ...carInk, stripe: SLOT.low, pin: SLOT.pin }, facing, scale);
  const out = plain.crop(0, 0, plain.w, plain.h);
  for (let i = 0; i < out.px.length; i++) {
    if (marked.px[i] === plain.px[i]) continue;
    const y = Math.floor(i / plain.w) / scale;
    out.px[i] = marked.px[i] === SLOT.pin ? SLOT.pin : y < 13 ? SLOT.high : SLOT.low;
  }
  return out;
}

/** The 20x10 actor car, halved from the large drawing (it keeps the stripe slots). */
export function carActor(): Pixels {
  const big = car('right', 1);
  const out = new Pixels(20, 10, 255);
  for (let y = 0; y < 10; y++)
    for (let x = 0; x < 20; x++) {
      // Prefer a stripe pixel from the 2x2 patch so the stripes survive the halving.
      const patch = [0, 1, 2, 3].map((n) => big.px[(y * 2 + (n >> 1)) * 40 + x * 2 + (n & 1)]);
      const stripe = patch.find((c) => c === SLOT.low || c === SLOT.high);
      out.px[y * 20 + x] = stripe ?? patch[3];
    }
  return out;
}

/** The speedometer block: a ring of blocks with a needle and the speed in 3x5 digits. */
export function dial(mph: 20 | 25 | 30): Pixels {
  const p = new Pixels(20, 20, 255);
  const cx = 9.5, cy = 9.5;
  for (let y = 0; y < 20; y++)
    for (let x = 0; x < 20; x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d <= 9.6) p.px[y * 20 + x] = C.dark;
      if (d > 8.2 && d <= 9.6) p.px[y * 20 + x] = C.cream;
    }
  // Needle: 20 points left, 25 straight up, 30 right of up.
  const angle = ((mph - 25) / 5) * 0.5;
  for (let r = 0; r <= 6; r += 0.5) p.set(Math.round(cx + Math.sin(angle) * r), Math.round(cy - 3 - Math.cos(angle) * r + 3), C.gold);
  // Tick marks for the three speeds, then the reading.
  for (const a of [-0.5, 0, 0.5]) p.set(Math.round(cx + Math.sin(a) * 7), Math.round(cy - Math.cos(a) * 7), C.cream);
  micro(p, 6, 11, String(mph), C.white);
  return p;
}

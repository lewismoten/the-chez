// Reveal Teddy's stripe repairs on the measured CitiCar without repainting its roof or wheels.
import { chezPicture, type ChezInk } from '../assets/source/chez.ts';
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/drawing';

export function stripeCar(ink: ChezInk, restored: number, facing: 'left' | 'right' = 'right', scale = 1): Pixels {
  if (!Number.isFinite(restored)) throw new Error('Stripe progress must be finite');
  const full = chezPicture(ink, facing, scale);
  if (restored >= 1) return full;
  const worn = chezPicture({
    ...ink, stripe: ink.body[1], pin: ink.body[1],
    // These also default to the pinstripe color in the source drawing. Keep them white.
    rim: ink.rim ?? ink.pin ?? ink.glass[1],
    lens: ink.lens ?? ink.pin ?? ink.glass[1],
  }, facing, scale);
  let first = full.w, last = -1;
  for (let i = 0; i < full.px.length; i++) if (full.px[i] !== worn.px[i]) {
    first = Math.min(first, i % full.w);
    last = Math.max(last, i % full.w);
  }
  const edge = first + (last - first + 1) * Math.max(0, restored);
  for (let i = 0; i < full.px.length; i++) {
    const x = i % full.w;
    // A few tatters remain during the search; the fitting cartoon reveals the repair.
    if (x < edge || (x - first) % (13 * scale) < Math.max(1, scale)) worn.px[i] = full.px[i];
  }
  return worn;
}

// The garage cartoon between trials: the next stripe goes on with a squeegee, the paint dries, and
// Gwinn sniffs it. The car's stripes are reserved palette slots, so "dry" is the palette stepping up.
import { Pixels, Reel, centered } from '@lewismoten/gamemaker-sandbox-tools/drawing';
import { GWINN } from '../assets/source/teddy/sprites/gwinn.ts';
import { docLeo } from '../assets/source/teddy/sprites/people.ts';
import { C, SLOT, palette, type Stage } from './hypo-art.ts';
import { carWithTeddy, garageRoom, scaled } from './hypo-cards.ts';

const CAR_X = 80;
const CAR_Y = 62;

/** Appends the stripe cartoon (stage `from` to `from + 1`) to a reel. */
export function addStripeCartoon(reel: Reel, from: 0 | 1 | 2): void {
  const to = (from + 1) as Stage;
  const slot = [SLOT.low, SLOT.high, SLOT.pin][from];
  const stripe = carWithTeddy(4);
  const bg = garageRoom(`STRIPE ${to} OF 3`);
  const before = palette(from);
  const after = palette(to);
  // where the new stripe runs, in car pixels
  let x0 = stripe.w;
  let x1 = 0;
  for (let i = 0; i < stripe.px.length; i++)
    if (stripe.px[i] === slot) {
      x0 = Math.min(x0, i % stripe.w);
      x1 = Math.max(x1, i % stripe.w);
    }
  const wet = slot === SLOT.pin ? C.white : C.navy;
  const drawCar = (p: Pixels, progress: number, dry: boolean) => {
    const img = new Pixels(stripe.w, stripe.h, 255);
    img.px.set(stripe.px);
    for (let i = 0; i < img.px.length; i++)
      if (img.px[i] === slot && !dry && i % stripe.w >= progress) img.px[i] = C.red; // not painted yet
      else if (img.px[i] === slot && !dry) img.px[i] = wet;
    p.blit(img, CAR_X, CAR_Y, 255);
  };
  const leo = (p: Pixels, sway: number) => scaled(p, docLeo(undefined, false), 250, 63 + sway, 2);
  // the squeegee: a long handle from Doc Leo's hand to a blade on the car
  const blade = (p: Pixels, at: number) => {
    const bx = CAR_X + at;
    const by = CAR_Y + 50;
    p.line(252, 100, bx + 2, by + 2, C.tan);
    p.rect(bx - 1, by - 5, 3, 12, C.cream);
  };
  const steps = 14;
  for (let i = 0; i <= steps; i++) {
    const at = x0 + Math.round(((x1 - x0 + 2) * i) / steps);
    reel.frame(
      bg,
      (p) => {
        drawCar(p, at, false);
        leo(p, i % 2);
        blade(p, at);
        scaled(p, GWINN.gwinn1, 20, 105, 2);
      },
      2,
      1,
      before,
    );
  }
  // the paint dries: sparkles on the stripe, then the real colors
  for (let i = 0; i < 8; i++)
    reel.frame(
      bg,
      (p) => {
        drawCar(p, x1 + 2, i >= 3);
        leo(p, 0);
        if (i < 6) for (let k = 0; k < 4; k++) p.rect(CAR_X + x0 + ((i * 17 + k * 29) % (x1 - x0)), CAR_Y + 46 + ((i + k * 3) % 8), 2, 2, C.gold);
        centered(p, 40, i < 3 ? 'WET.' : 'DRYING...', C.cream, 1, C.dark, 160);
        scaled(p, GWINN.gwinn1, 20, 105, 2);
      },
      3,
      1,
      i >= 3 ? after : before,
    );
  // Gwinn trots over and sniffs it
  for (let i = 0; i < 14; i++)
    reel.frame(
      bg,
      (p) => {
        drawCar(p, x1 + 2, true);
        leo(p, 0);
        const gx = Math.min(36, 4 + i * 6);
        scaled(p, GWINN[i % 2 && gx < 36 ? 'gwinn2' : 'gwinn1'], gx, 105, 2);
        if (i > 8) centered(p, 40, 'SNIFF. SNIFF.', C.cream, 1, C.dark, 160);
      },
      3,
      1,
      after,
    );
  reel.fadeOut(4);
}

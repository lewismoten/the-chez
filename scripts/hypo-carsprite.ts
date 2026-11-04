// The car the player drives, drawn by hand pixel by pixel to fill a block's 20 columns and 16 rows
// (an actor is one block wide, so it can't be wider; the top block holds the speedometer): tomato
// body, a thick BLACK roof, one door window, the two charcoal stripes with the white pinstripe
// stepping up behind the door, white wheels, square bumpers. Stripe pixels are the reserved palette
// slots so each trial's palette swap shows or hides them.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/drawing';
import { R } from './hypo-colors.ts';
import { C, SLOT } from './hypo-art.ts';

export const CAR_W = 20;
export const CAR_H = 16;
const FLAT = 9; // the roof's last column; the windshield slopes at 45 degrees from here

export function carSprite(): Pixels {
  const p = new Pixels(CAR_W, CAR_H, 255);
  const [red, mid, light] = [R('carRed', 0), R('carRed', 1), R('carRed', 2)];
  const [glass, glint] = [R('glass', 0), R('glass', 2)];
  const bottom = (x: number) => (x >= 8 && x <= 11 ? 13 : 12); // only the door comes down between the wheels
  for (let x = 3; x <= 17; x++)
    for (let y = 0; y <= bottom(x); y++) {
      if (x > FLAT + y) continue; // above the windshield's slope
      let c = x === FLAT + y && y < 10 ? light : mid;
      if (y <= 2) c = C.black; // the roof, three rows thick
      else if (y <= 6 && x >= 6 && x < FLAT + y - 2) c = glass; // the door window
      else if (y <= 6 && x === FLAT + y - 2) c = glint;
      else if (x === 5 && y <= 12) c = red; // the door's back seam
      else if (y >= 12 || x === 3) c = red;
      p.set(x, y, c);
    }
  // the stripes: high, pinstripe, low; the band steps up two rows behind the door
  for (let x = 3; x <= 17; x++) {
    const up = x <= 5 ? 2 : x === 6 ? 1 : 0;
    p.set(x, 8 - up, SLOT.high);
    p.set(x, 9 - up, SLOT.pin);
    p.set(x, 10 - up, SLOT.low);
  }
  p.set(8, 7, C.white); // the door handle
  p.set(9, 7, C.white);
  // square bumpers, amber marker up front, red one at the back
  for (const x of [1, 2, 18, 19]) for (let y = 9; y <= 11; y++) p.set(x, y, C.black);
  p.set(18, 10, C.gold);
  p.set(3, 11, C.red);
  // white wheels on black tires, tucked up behind the quarters
  for (const x of [3, 12])
    for (let y = 0; y < 5; y++)
      for (let dx = 0; dx < 5; dx++) {
        if ((y === 0 || y === 4) && (dx === 0 || dx === 4)) continue;
        p.set(x + dx, 11 + y, dx === 0 || dx === 4 || y === 0 || y === 4 ? C.black : C.white);
      }
  return p;
}

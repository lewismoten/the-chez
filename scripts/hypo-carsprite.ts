// The 20x10 car the player drives, drawn by hand pixel by pixel (a downsized copy of the big drawing
// loses the stripes): tomato body, black roof, one door window, the two charcoal stripes with the
// white pinstripe stepping up behind the door, white wheels, square bumpers. Stripe pixels are the
// reserved palette slots so each trial's palette swap shows or hides them.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/drawing';
import { R } from './hypo-colors.ts';
import { C, SLOT } from './hypo-art.ts';

const ROWS = [
  '....KKKKK...........',
  '...rKKKKKKH.........',
  '...rrGGGgrrH........',
  '...RrGGGGgRRH.......',
  '...RTGGGGggRRH......',
  '..KRTTRRPPPPPPPRHy..',
  '..KRRRRSSSSSSSSSSyK.',
  '..KRRRRRRRRRRRRRRRK.',
];
/** A white steel wheel on a black tire, four pixels across, its top at (x, 6). */
const WHEEL = ['.KK.', 'KWWK', 'KWWK', '.KK.'];

export function carSprite(): Pixels {
  const key: Record<string, number> = {
    K: C.black,
    r: R('carRed', 0),
    R: R('carRed', 1),
    H: R('carRed', 2),
    G: R('glass', 0),
    g: R('glass', 2),
    T: SLOT.high,
    S: SLOT.low,
    P: SLOT.pin,
    W: C.white,
    y: C.gold,
  };
  const p = new Pixels(20, 10, 255);
  ROWS.forEach((row, y) => [...row].forEach((ch, x) => ch !== '.' && p.set(x, y, key[ch])));
  for (const x of [3, 14]) WHEEL.forEach((row, y) => [...row].forEach((ch, dx) => ch !== '.' && p.set(x + dx, 6 + y, ch === 'K' ? C.black : C.white)));
  return p;
}

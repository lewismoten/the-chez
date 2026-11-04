// Monster pictures for Trial 1: the kid on a tricycle (the friendly rival), the chickens that wander onto
// the road, a flapping chicken for after the honk, and the honk itself. All are 20x20 with 255 clear.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/drawing';
import { C } from './hypo-art.ts';
import { R } from './hypo-colors.ts';

const clear = () => new Pixels(20, 20, 255);

/** The kid on a tricycle, riding right: a big front wheel whose spokes turn, a yellow helmet, streamers. */
export function trike(turn: 0 | 1 | 2): Pixels {
  const p = clear();
  const tire = C.black;
  const hub = C.white;
  // the big front wheel
  p.ring(14, 14, 5, tire);
  p.ring(14, 14, 4, tire);
  const a = (turn * Math.PI) / 6;
  for (let k = 0; k < 3; k++) {
    const t = a + (k * Math.PI) / 3;
    p.line(14 - Math.round(Math.cos(t) * 4), 14 - Math.round(Math.sin(t) * 4), 14 + Math.round(Math.cos(t) * 4), 14 + Math.round(Math.sin(t) * 4), C.cream);
  }
  p.set(14, 14, hub);
  // the rear wheels
  p.disc(3, 16, 3, tire);
  p.set(3, 16, hub);
  p.ring(3, 16, 3, tire);
  // the frame, seat, handlebars and pedal
  p.line(3, 14, 12, 12, R('flag', 0));
  p.line(3, 13, 12, 11, R('flag', 0));
  p.line(12, 12, 13, 8, R('iron', 1));
  p.rect(11, 7, 4, 1, R('iron', 2));
  p.rect(3, 11, 5, 2, C.navy);
  p.set(11 + (turn === 1 ? 1 : 0), 17, C.gold);
  p.line(11, 15, 12 + (turn === 1 ? 1 : 0), 17, R('iron', 1));
  // streamers fluttering off the grips
  p.set(15, 7, R('flag', 0));
  p.set(16, 8 + (turn === 2 ? 1 : 0), R('flag', 0));
  p.set(15, 6, R('flag', 2));
  p.set(16, 7 - (turn === 0 ? 1 : 0), R('flag', 2));
  // the kid: shirt, arms to the bars, legs to the pedals, face, helmet
  p.rect(5, 6, 4, 5, R('flag', 2));
  p.rect(5, 6, 1, 5, R('blue', 2));
  p.line(9, 7, 12, 8, R('flag', 2));
  p.line(9, 8, 12, 8, C.tan);
  p.line(7, 11, 11, 14 + (turn === 1 ? 1 : 0), R('blue', 1));
  p.disc(7, 4, 2, C.tan);
  p.set(8, 4, C.black);
  p.rect(5, 1, 6, 2, C.gold);
  p.rect(5, 3, 1, 1, C.gold);
  p.rect(6, 1, 3, 1, C.white);
  return p;
}

/** A hen in profile facing right, pecking (head down) or standing. */
export function hen(peck: boolean): Pixels {
  const p = clear();
  const white = C.white;
  const shade = R('stone', 3);
  p.disc(9, 12, 6, white);
  p.disc(7, 13, 4, shade);
  p.disc(9, 11, 5, white);
  // the tail feathers
  p.line(4, 10, 1, 6, white);
  p.line(5, 9, 2, 5, white);
  p.line(5, 11, 1, 8, shade);
  // a wing
  p.rect(6, 11, 5, 3, R('stone', 2));
  p.rect(7, 14, 3, 1, R('stone', 2));
  // neck, head, comb, beak and eye
  const hx = peck ? 15 : 14;
  const hy = peck ? 11 : 6;
  p.line(12, 9, hx, hy + 1, white);
  p.line(12, 10, hx, hy + 2, white);
  p.disc(hx, hy, 2, white);
  p.rect(hx - 1, hy - 3, 3, 2, C.red);
  p.set(hx + 1, hy + 2, C.red);
  p.rect(hx + 2, hy, 2, 1, C.gold);
  p.set(hx + 1, hy - 1, C.black);
  // legs
  p.rect(8, 17, 1, 3, C.gold);
  p.rect(11, 17, 1, 3, C.gold);
  p.rect(7, 19, 3, 1, C.gold);
  p.rect(10, 19, 3, 1, C.gold);
  return p;
}

/** The hen taking off in a puff of feathers, wings up or down. */
export function flapper(up: boolean): Pixels {
  const p = clear();
  const white = C.white;
  p.disc(10, 12, 5, white);
  p.disc(9, 13, 3, R('stone', 3));
  p.disc(15, 8, 2, white);
  p.rect(14, 4, 3, 2, C.red);
  p.rect(17, 8, 2, 1, C.gold);
  p.set(16, 7, C.black);
  if (up) {
    p.line(8, 10, 3, 2, white);
    p.line(9, 10, 5, 1, white);
    p.line(12, 10, 17, 2, white);
    p.line(11, 10, 14, 1, white);
  } else {
    p.line(8, 12, 2, 15, white);
    p.line(9, 13, 4, 17, white);
    p.line(12, 12, 18, 15, white);
    p.line(11, 13, 16, 17, white);
  }
  p.rect(8, 17, 1, 2, C.gold);
  p.rect(11, 17, 1, 2, C.gold);
  for (const [x, y] of [[2, 6], [18, 12], [4, 17], [14, 18]]) p.set(x, y, R('stone', 3));
  return p;
}

/** The honk: three arcs of sound with a bright rim, so it overlaps a hen wherever she stands. */
export function wave(): Pixels {
  const p = clear();
  for (const [r, c] of [[4, R('flag', 1)], [8, C.cream], [12, R('flag', 1)]] as const) {
    for (let a = -1.2; a <= 1.2; a += 0.04) {
      const x = 2 + Math.round(Math.cos(a) * r);
      const y = 10 + Math.round(Math.sin(a) * r * 0.9);
      p.set(x, y, c);
      p.set(x, y + 1, c);
    }
  }
  p.rect(0, 9, 3, 3, C.gold);
  return p;
}

/** The neighbor's riding mower, facing right: a green deck with a spinning blade, the neighbor under a big umbrella. */
export function mower(turn: 0 | 1): Pixels {
  const p = clear();
  // the umbrella: a dome of red and white wedges over the seat, its pole down to the lap
  const dome: [number, number][] = [[4, 12], [2, 14], [1, 15], [1, 15]];
  dome.forEach(([from, to], y) => {
    for (let x = from; x <= to; x++) p.set(x, y, (x >> 2) % 2 ? C.white : R('flag', 0));
  });
  for (const x of [1, 4, 7, 10, 13, 15]) p.set(x, 4, x % 2 ? C.white : R('flag', 0));
  p.line(8, 4, 8, 10, R('iron', 1));
  // the neighbor: a yellow raincoat, a tan face, hands on the wheel
  p.rect(6, 5, 5, 5, R('flag', 1));
  p.rect(6, 5, 1, 5, R('paint', 0));
  p.disc(8, 6, 1, C.tan);
  p.line(11, 7, 14, 9, R('flag', 1));
  // the mower: seat, steering post, body, hood, deck and wheels
  p.rect(4, 9, 4, 2, R('iron', 1));
  p.line(13, 9, 14, 12, R('iron', 2));
  p.rect(4, 11, 13, 4, R('leaf', 2));
  p.rect(4, 11, 13, 1, R('leaf', 4));
  p.rect(13, 12, 6, 3, R('leaf', 3));
  p.rect(4, 15, 15, 1, R('leaf', 0));
  p.rect(12, 16, 7, 2, R('iron', 1));
  p.rect(12 + turn * 2, 16, 3, 1, R('iron', 2));
  p.disc(6, 16, 3, C.black);
  p.set(6, 16, C.white);
  p.disc(16, 17, 1, C.black);
  // clippings flying off the deck
  for (const [x, y] of turn ? [[18, 15], [19, 13], [17, 14]] : [[19, 15], [18, 13], [19, 17]]) p.set(x, y, R('leaf', 4));
  return p;
}

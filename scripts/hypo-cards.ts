// Title, level and results cards plus the three skippable cartoons (intro, garage, results).
import { encodeGif } from '@lewismoten/gamemaker-sandbox-tools/formats/gif';
import { Pixels, Reel, centered } from '@lewismoten/gamemaker-sandbox-tools/drawing';
import { clubArt, centered as clubCentered } from '../assets/source/teddy/art/draw.ts';
import { POSES } from '../assets/source/teddy/sprites/teddy.ts';
import { GWINN } from '../assets/source/teddy/sprites/gwinn.ts';
import { docLeo } from '../assets/source/teddy/sprites/people.ts';
import { C, car, dial, palette, type Stage } from './hypo-art.ts';
import { townView } from './hypo-town.ts';
import { CHEZ_WINDOW } from '../assets/source/chez.ts';

export const TITLE = 'THE STRIPE HYPOTHESIS';
export const TITLE_CARD = 'THE STRIPE\nHYPOTHESIS';

function scaled(p: Pixels, src: Pixels, x: number, y: number, scale: number): void {
  for (let py = 0; py < src.h; py++)
    for (let px = 0; px < src.w; px++) {
      const color = src.px[py * src.w + px];
      if (color !== 255) p.rect(x + px * scale, y + py * scale, scale, scale, color);
    }
}

function inside(poly: readonly (readonly [number, number])[], x: number, y: number): boolean {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

/** THE CHEZ at `scale`, with Teddy's head looking out of the door window, clipped to the glass. */
function carWithTeddy(scale: number): Pixels {
  const out = car('right', scale);
  const head = POSES.front.crop(2, 4, 16, 11);
  const k = Math.max(1, Math.floor(scale / 4));
  const x0 = Math.round(15.4 * scale - (head.w * k) / 2);
  const y0 = Math.round(8.3 * scale) - head.h * k;
  for (let y = 0; y < head.h * k; y++)
    for (let x = 0; x < head.w * k; x++) {
      const c = head.get(Math.floor(x / k), Math.floor(y / k));
      if (c !== 255 && inside(CHEZ_WINDOW, (x0 + x + 0.5) / scale, (y0 + y + 0.5) / scale)) out.set(x0 + x, y0 + y, c);
    }
  return out;
}

/** A dark plaque with a gold rule, for text over the street picture. */
function plaque(p: Pixels, x: number, y: number, w: number, h: number): void {
  p.rect(x, y, w, h, C.dark);
  p.frame(x, y, w, h, C.gold);
  p.frame(x + 2, y + 2, w - 4, h - 4, C.navy);
}

/** A 320x200 card: the street behind a plaque with the headline, the car at full size, and short lines of text. */
export function card(headline: string, lines: string[], footer: string, stage: Stage = 0, tile = 0): Uint8Array {
  const p = townView(tile);
  const parts = headline.split('\n');
  const height = 12 + parts.length * 20 + lines.length * 11;
  plaque(p, 40, 4, 240, height);
  parts.forEach((part, i) => clubCentered(p, 12 + i * 20, clubArt(part), C.cream, 2));
  lines.forEach((line, i) => centered(p, 14 + parts.length * 20 + i * 11, line, C.cream, 1));
  p.blit(carWithTeddy(4), 80, 4 + height + 4 > 80 ? 4 + height + 6 : 80, 255);
  plaque(p, 40, 176, 240, 18);
  centered(p, 181, footer, C.gold, 1);
  return encodeGif({
    width: 320,
    height: 200,
    pixels: p.px,
    palette: palette(stage),
  });
}

/** The results page: the street, a panel with the dial and verdict, and a footer. */
function resultsBase(): Pixels {
  const p = townView(24);
  plaque(p, 40, 4, 240, 26);
  clubCentered(p, 10, clubArt('TRIAL RESULTS'), C.cream, 2);
  plaque(p, 40, 40, 240, 112);
  plaque(p, 40, 176, 240, 18);
  centered(p, 181, 'TEDDY IS NOT CONVINCED.', C.gold, 1);
  return p;
}

/** The results card: the dial, the top speed and the verdict (the second line, if any, is the reason). */
export function resultsCard(mph: 25 | 30 = 25, reason?: string, stage: Stage = 0): Uint8Array {
  const p = resultsBase();
  scaled(p, dial(mph), 52, 54, 4);
  centered(p, 70, 'TOP SPEED:', C.cream, 1, undefined, 204);
  centered(p, 88, `${mph} MPH.`, C.white, 2, undefined, 204);
  centered(p, 120, 'INCONCLUSIVE.', C.red, 1, undefined, 204);
  if (reason) centered(p, 134, reason, C.cream, 1, undefined, 204);
  return encodeGif({
    width: 320,
    height: 200,
    pixels: p.px,
    palette: palette(stage),
  });
}

const garageRoom = (headline = ''): Pixels => {
  const p = new Pixels(320, 200, C.dark);
  p.rect(0, 0, 320, 142, C.navy);
  p.rect(0, 142, 320, 58, C.asphalt);
  p.rect(0, 141, 320, 3, C.gold);
  for (let x = 0; x < 320; x += 40) p.rect(x + 8, 177, 22, 3, C.gold);
  if (headline) clubCentered(p, 10, clubArt(headline), C.cream, 1, C.dark);
  return p;
};

export function introCartoon(): Uint8Array {
  const pal = palette(0);
  const bg = garageRoom('A SCIENCE EXPERIMENT');
  const reel = new Reel(pal);
  const leo = (wave: boolean) => docLeo(undefined, wave);
  // THE CHEZ rolls in, bare red.
  for (let i = 0; i < 12; i++)
    reel.frame(
      bg,
      (p) => {
        p.blit(car('right', 3), -130 + i * 22, 81, 255);
        scaled(p, POSES[i % 2 ? 'walk1' : 'walk2'], 12 + i * 7, 105, 2);
      },
      2,
    );
  // Doc Leo reads the hypothesis; Teddy is doubtful.
  for (let i = 0; i < 16; i++)
    reel.frame(
      bg,
      (p) => {
        p.blit(car('right', 3), 128, 81, 255);
        scaled(p, leo(i % 4 < 2), 232, 63, 2);
        scaled(p, POSES.front, 70, 105, 2);
        scaled(p, GWINN[i % 2 ? 'gwinn1' : 'gwinn2'], 18, 105, 2);
        p.rect(28, 40, 150, 28, C.cream);
        p.frame(28, 40, 150, 28, C.dark);
        centered(p, 46, 'HYPOTHESIS:', C.dark, 1, undefined, 103);
        centered(p, 56, 'STRIPES = SPEED', C.red, 1, undefined, 103);
        if (i > 8) centered(p, 120, '...', C.cream, 2, C.dark, 98);
      },
      3,
    );
  reel.fadeOut(5);
  return reel.fli(5);
}

/** The garage door rolls up and THE CHEZ backs out into the street. */
export function garageCartoon(): Uint8Array {
  const bg = garageRoom('INTO THE GARAGE');
  const reel = new Reel(palette(0));
  for (let i = 0; i < 18; i++)
    reel.frame(
      bg,
      (p) => {
        const door = Math.min(60, i * 6);
        p.rect(110, 60, 110, 82, C.dark);
        p.blit(car('right', 2), 120 + Math.max(0, i - 6) * 6, 104, 255);
        p.rect(110, 60, 110, 82 - door, C.tan);
        for (let y = 66; y < 142 - door; y += 10) p.rect(110, y, 110, 1, C.dark);
        scaled(p, POSES.front, 40, 105, 2);
      },
      2,
    );
  reel.fadeOut(4);
  return reel.fli(5);
}

/** The needle climbs to the top speed and stops; the stamp lands. */
export function resultsCartoon(top: 25 | 30 = 25, reason?: string, stage: Stage = 0): Uint8Array {
  const reel = new Reel(palette(stage));
  const base = resultsBase();
  const speeds = top === 25 ? ([20, 25] as const) : ([20, 25, 30] as const);
  for (const mph of speeds)
    for (let i = 0; i < 6; i++)
      reel.frame(
        base,
        (p) => {
          scaled(p, dial(mph), 52, 54, 4);
          centered(p, 70, 'TOP SPEED:', C.cream, 1, undefined, 204);
          if (mph === top && i > 1) centered(p, 88, `${top} MPH.`, C.white, 2, undefined, 204);
          if (mph === top && i > 3) centered(p, 120, 'INCONCLUSIVE.', C.red, 1, undefined, 204);
          if (mph === top && i > 4 && reason) centered(p, 134, reason, C.cream, 1, undefined, 204);
        },
        mph === top ? 3 : 1,
      );
  return reel.fli(5);
}

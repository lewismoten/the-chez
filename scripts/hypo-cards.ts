// Title, level and results cards plus the three skippable cartoons (intro, garage, results).
import { encodeGif } from '@lewismoten/gamemaker-sandbox-tools/formats/gif';
import { Pixels, Reel, centered } from '@lewismoten/gamemaker-sandbox-tools/drawing';
import { clubArt, centered as clubCentered } from '../assets/source/teddy/art/draw.ts';
import { POSES } from '../assets/source/teddy/sprites/teddy.ts';
import { GWINN } from '../assets/source/teddy/sprites/gwinn.ts';
import { docLeo } from '../assets/source/teddy/sprites/people.ts';
import { C, car, dial, palette, type Stage } from './hypo-art.ts';

export const TITLE = 'THE STRIPE HYPOTHESIS';

function scaled(p: Pixels, src: Pixels, x: number, y: number, scale: number): void {
  for (let py = 0; py < src.h; py++)
    for (let px = 0; px < src.w; px++) {
      const color = src.px[py * src.w + px];
      if (color !== 255) p.rect(x + px * scale, y + py * scale, scale, scale, color);
    }
}

/** A 320x200 card: headline in the club font, the car, and short lines of text. */
export function card(headline: string, lines: string[], footer: string, stage: Stage = 0): Uint8Array {
  const p = new Pixels(320, 200, C.navy);
  p.rect(0, 151, 320, 49, C.dark);
  p.rect(0, 154, 320, 3, C.gold);
  p.blit(car('right', 3), 100, 84, 255);
  clubCentered(p, 20, clubArt(headline), C.cream, headline.length > 18 ? 1 : 2);
  lines.forEach((line, i) => centered(p, 58 + i * 12, line, C.cream, 1));
  centered(p, 177, footer, C.gold, 1);
  return encodeGif({ width: 320, height: 200, pixels: p.px, palette: palette(stage) });
}

/** The results card: the dial reads 25, and the verdict. */
export function resultsCard(): Uint8Array {
  const p = new Pixels(320, 200, C.navy);
  p.rect(0, 0, 320, 200, C.navy);
  clubCentered(p, 14, clubArt('TRIAL RESULTS'), C.cream, 2);
  p.rect(70, 50, 180, 104, C.dark);
  p.frame(70, 50, 180, 104, C.gold);
  scaled(p, dial(25), 78, 62, 4);
  centered(p, 66, 'TOP SPEED:', C.cream, 1, undefined, 195 + 30);
  centered(p, 84, '25 MPH.', C.white, 2, undefined, 195 + 30);
  centered(p, 116, 'INCONCLUSIVE.', C.red, 1, undefined, 195 + 30);
  centered(p, 168, 'TEDDY IS NOT CONVINCED.', C.gold, 1);
  return encodeGif({ width: 320, height: 200, pixels: p.px, palette: palette(0) });
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
    reel.frame(bg, (p) => {
      p.blit(car('right', 3), -130 + i * 22, 81, 255);
      scaled(p, POSES[i % 2 ? 'walk1' : 'walk2'], 12 + i * 7, 105, 2);
    }, 2);
  // Doc Leo reads the hypothesis; Teddy is doubtful.
  for (let i = 0; i < 16; i++)
    reel.frame(bg, (p) => {
      p.blit(car('right', 3), 128, 81, 255);
      scaled(p, leo(i % 4 < 2), 232, 63, 2);
      scaled(p, POSES.front, 70, 105, 2);
      scaled(p, GWINN[i % 2 ? 'gwinn1' : 'gwinn2'], 18, 105, 2);
      p.rect(28, 40, 150, 28, C.cream);
      p.frame(28, 40, 150, 28, C.dark);
      centered(p, 46, 'HYPOTHESIS:', C.dark, 1, undefined, 103);
      centered(p, 56, 'STRIPES = SPEED', C.red, 1, undefined, 103);
      if (i > 8) centered(p, 120, '...', C.cream, 2, C.dark, 98);
    }, 3);
  reel.fadeOut(5);
  return reel.fli(5);
}

/** The garage door rolls up and THE CHEZ backs out into the street. */
export function garageCartoon(): Uint8Array {
  const bg = garageRoom('INTO THE GARAGE');
  const reel = new Reel(palette(0));
  for (let i = 0; i < 18; i++)
    reel.frame(bg, (p) => {
      const door = Math.min(60, i * 6);
      p.rect(110, 60, 110, 82, C.dark);
      p.blit(car('right', 2), 120 + Math.max(0, i - 6) * 6, 104, 255);
      p.rect(110, 60, 110, 82 - door, C.tan);
      for (let y = 66; y < 142 - door; y += 10) p.rect(110, y, 110, 1, C.dark);
      scaled(p, POSES.front, 40, 105, 2);
    }, 2);
  reel.fadeOut(4);
  return reel.fli(5);
}

/** The needle climbs to 25 and stops; the stamp lands. */
export function resultsCartoon(): Uint8Array {
  const reel = new Reel(palette(0));
  const base = new Pixels(320, 200, C.navy);
  clubCentered(base, 14, clubArt('TRIAL RESULTS'), C.cream, 2);
  base.rect(70, 50, 180, 104, C.dark);
  base.frame(70, 50, 180, 104, C.gold);
  for (const mph of [20, 25] as const)
    for (let i = 0; i < 6; i++)
      reel.frame(base, (p) => {
        scaled(p, dial(mph), 78, 62, 4);
        centered(p, 66, 'TOP SPEED:', C.cream, 1, undefined, 225);
        if (mph === 25 && i > 1) centered(p, 84, '25 MPH.', C.white, 2, undefined, 225);
        if (mph === 25 && i > 3) centered(p, 116, 'INCONCLUSIVE.', C.red, 1, undefined, 225);
      }, mph === 20 ? 1 : 3);
  return reel.fli(5);
}

// The Conclusion: a science-fair table with the final board (TOP SPEED: 30 MPH. CONCLUSIVE!), Doc Leo celebrating, and
// Teddy's last line, as one skippable cartoon; then the credits cards for the end of the game.
import { encodeGif } from '@lewismoten/gamemaker-sandbox-tools/formats/gif';
import { Pixels, Reel, centered } from '@lewismoten/gamemaker-sandbox-tools/drawing';
import { clubArt, centered as clubCentered } from '../assets/source/teddy/art/draw.ts';
import { POSES } from '../assets/source/teddy/sprites/teddy.ts';
import { GWINN } from '../assets/source/teddy/sprites/gwinn.ts';
import { docLeo } from '../assets/source/teddy/sprites/people.ts';
import { C, dial, palette } from './hypo-art.ts';
import { R } from './hypo-colors.ts';
import { scaled } from './hypo-cards.ts';
import { hash } from './hypo-tiles.ts';
import { TITLE_CARD } from './hypo-cards.ts';

type Beat = 'build' | 'party' | 'line';

/** The hall: a banner, bunting, a long table with a cloth, the board, THE CHEZ's model, Gwinn, Teddy and Doc Leo. */
function hall(t: number, beat: Beat): Pixels {
  const p = new Pixels(320, 200, R('stucco', 1));
  p.rect(0, 0, 320, 142, R('stucco', 1));
  for (let y = 0; y < 142; y += 2) for (let x = (y / 2) % 2; x < 320; x += 4) p.set(x, y, R('stucco', 0));
  p.rect(0, 142, 320, 58, R('wood', 2));
  for (let x = 0; x < 320; x += 24) p.rect(x, 142, 1, 58, R('wood', 1));
  p.rect(0, 140, 320, 3, R('wood', 0));
  // the banner and bunting
  p.rect(30, 6, 260, 22, R('flag', 0));
  p.frame(30, 6, 260, 22, C.gold);
  clubCentered(p, 10, clubArt('SCIENCE FAIR'), C.cream, 1, undefined);
  for (let x = 6; x < 314; x += 14) {
    const sag = Math.round(Math.sin(((x % 70) / 70) * Math.PI) * 5);
    p.rect(x, 32 + sag, 8, 2, C.dark);
    for (let k = 0; k < 5; k++) p.rect(x + (k >> 1), 34 + sag + k, 6 - k, 1, R('flag', (x / 14) % 4 | 0));
  }
  // the long table with its cloth
  p.rect(14, 152, 292, 8, R('wood', 2));
  p.rect(14, 152, 292, 1, R('wood', 1));
  p.rect(18, 160, 284, 30, C.white);
  for (let x = 18; x < 302; x += 12) p.rect(x, 160, 1, 30, R('stone', 2));
  p.rect(18, 160, 284, 3, R('flag', 0));
  p.rect(18, 187, 284, 3, R('flag', 0));
  // the board: white, framed, the dial and the result
  p.rect(60, 56, 200, 96, R('wood', 1));
  p.rect(64, 60, 192, 88, C.white);
  p.frame(64, 60, 192, 88, C.navy);
  const swing = beat === 'build' ? [20, 20, 25, 25, 30][Math.min(4, t >> 1)] : 30;
  scaled(p, dial(swing as 20 | 25 | 30), 72, 76, 2);
  centered(p, 76, 'TOP SPEED:', C.dark, 1, undefined, 188);
  if (beat !== 'build' || t > 5) centered(p, 92, '30 MPH.', C.red, 2, undefined, 188);
  if (beat !== 'build' || t > 8) centered(p, 116, 'CONCLUSIVE!', C.green, 1, undefined, 188);
  p.rect(72, 130, 176, 1, R('stone', 2));
  centered(p, 136, 'THE ROAD DID IT.', C.dark, 1, undefined, 160);
  // Teddy behind the table (in the chair), Gwinn on the floor, Doc Leo jumping when it is time
  scaled(p, POSES.front, 12, 112, 2);
  scaled(p, GWINN[t % 4 < 2 ? 'gwinn1' : 'gwinn2'], 10, 150 + (beat === 'party' ? (t % 2) * 2 : 0), 2);
  const jump = beat === 'party' ? Math.abs(Math.sin(t * 0.7)) * 14 : 0;
  scaled(p, docLeo(undefined, beat !== 'build' && t % 4 < 2), 270, Math.round(74 - jump), 2);
  // confetti
  if (beat !== 'build')
    for (let k = 0; k < 40; k++) {
      const x = Math.floor(hash(k, 1, 5) * 320);
      const y = (Math.floor(hash(k, 2, 5) * 200) + t * (3 + (k % 3))) % 150;
      p.rect(x, y, 2, 2, R('flag', k % 4));
    }
  // Teddy's last line
  if (beat === 'line') {
    p.rect(8, 44, 108, 22, C.cream);
    p.frame(8, 44, 108, 22, C.dark);
    p.line(22, 66, 26, 108, C.dark);
    p.line(34, 66, 26, 108, C.dark);
    p.rect(23, 66, 11, 2, C.cream);
    centered(p, 52, 'IT\'S A HILL.', C.dark, 1, undefined, 62);
  }
  return p;
}

export function conclusionCartoon(): Uint8Array {
  const reel = new Reel(palette(3));
  for (let t = 0; t < 12; t++) reel.frame(hall(t, 'build'), () => undefined, 3);
  for (let t = 0; t < 20; t++) reel.frame(hall(t, 'party'), () => undefined, 3);
  for (let t = 0; t < 8; t++) reel.frame(hall(t, 'line'), () => undefined, 4);
  reel.frame(hall(8, 'line'), () => undefined, 40);
  reel.fadeOut(5);
  return reel.fli(5);
}

const gif = (p: Pixels) => encodeGif({ width: 320, height: 200, pixels: p.px, palette: palette(3) });

/** A plain card for the credits: a plaque of lines over the hall. */
function creditsCard(headline: string, lines: string[], footer?: string): Uint8Array {
  const p = hall(4, 'party');
  p.rect(30, 40, 260, 112, C.dark);
  p.frame(30, 40, 260, 112, C.gold);
  p.frame(32, 42, 256, 108, C.navy);
  clubCentered(p, 48, clubArt(headline), C.gold, 1, undefined);
  lines.forEach((line, i) => centered(p, 70 + i * 11, line, i % 2 ? C.cream : C.white, 1));
  if (footer) {
    p.rect(30, 164, 260, 18, C.dark);
    p.frame(30, 164, 260, 18, C.gold);
    centered(p, 169, footer, C.gold, 1);
  }
  return gif(p);
}

/** The end of the game: the final board, who made it, and THE END. Each is one slide of won.lst. */
export function endingCards(): Uint8Array[] {
  const board = hall(30, 'party');
  const results = new Pixels(320, 200, 0);
  results.px.set(board.px);
  clubCentered(results, 36, clubArt('TRIAL RESULTS'), C.dark, 1, undefined);
  return [
    gif(results),
    creditsCard('THE STRIPE HYPOTHESIS', ['A MADE-UP 1994 RELEASE,', 'MADE IN 2026.', 'DESIGN NOTE:', 'CLAUDE OPUS 5.5', 'CODE, ART AND TEXT:', 'CLAUDE SONNET 5.5']),
    creditsCard('AND ALSO', ['EARLIER VERSION MUSIC:', 'OPENAI CODEX', 'DOG RECORDINGS:', 'LEWIS MOTEN', 'ENGINE: GAME-MAKER', 'SANDBOX EDITION']),
    creditsCard(TITLE_CARD.replace('\n', ' '), ['THE END.', 'TEDDY WOULD LIKE A WALK.'], 'THANKS FOR PLAYING'),
  ];
}

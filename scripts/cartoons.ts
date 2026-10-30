// Skippable DOS FLI cartoons: lost stripes, seven little road stories, and a team triumph.
import { Reel } from '@lewismoten/gamemaker-sandbox-tools/drawing';
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/drawing';
import { centered } from '@lewismoten/gamemaker-sandbox-tools/drawing';
import type { ChezInk } from '../assets/source/chez.ts';
import { matchColor } from '@lewismoten/gamemaker-sandbox-tools/formats/palette';
import { POSES } from '../assets/source/teddy/sprites/teddy.ts';
import { GWINN } from '../assets/source/teddy/sprites/gwinn.ts';
import { docLeo } from '../assets/source/teddy/sprites/people.ts';
import { clubArt, centered as clubCentered } from '../assets/source/teddy/art/draw.ts';
import { stripeCar } from './stripe-car.ts';
import { ROAD_BEATS, paintRoadGag } from './road-stories.ts';

type Colors = { sky: number; road: number; edge: number; white: number; gold: number; red: number; blue: number; dark: number };
function colors(pal: Uint8Array): Colors {
  const c = (r: number, g: number, b: number) => matchColor(pal, r, g, b);
  return { sky: c(7, 21, 28), road: c(13, 16, 18), edge: c(55, 43, 25), white: c(62, 59, 52), gold: c(63, 45, 16), red: c(57, 12, 7), blue: c(12, 31, 48), dark: c(3, 8, 12) };
}

function roadside(c: Colors, label: string): Pixels {
  const p = new Pixels(320, 200, c.sky);
  p.disc(252, 38, 21, c.gold);
  p.rect(0, 142, 320, 58, c.road);
  p.rect(0, 141, 320, 3, c.edge);
  for (let x = 0; x < 320; x += 64) p.rect(x + 9, 177, 34, 3, c.gold);
  clubCentered(p, 14, clubArt(label), c.white, 1, c.dark);
  return p;
}

function sprite(p: Pixels, source: Pixels, x: number, y: number, scale = 2): void {
  for (let py = 0; py < source.h; py++) for (let px = 0; px < source.w; px++) {
    const color = source.px[py * source.w + px];
    if (color !== 255) p.rect(x + px * scale, y + py * scale, scale, scale, color);
  }
}

export function openingCartoon(pal: Uint8Array, ink: ChezInk): Uint8Array {
  const c = colors(pal);
  const bg = roadside(c, 'TEDDY PRESENTS: A TINY QUEST');
  const car = stripeCar(ink, 1, 'right', 3);
  const worn = stripeCar(ink, 0, 'right', 3);
  const reel = new Reel(pal);
  for (let i = 0; i < 12; i++) reel.frame(bg, (p) => {
    p.blit(car, -100 + i * 17, 81, 255);
    sprite(p, POSES[i % 2 ? 'walk1' : 'walk2'], 12 + i * 7, 105);
  }, 2);
  for (let i = 0; i < 12; i++) reel.frame(bg, (p) => {
    p.blit(stripeCar(ink, 1 - i / 11, 'right', 3), 87 + i * 3, 81, 255);
    sprite(p, POSES[i % 2 ? 'walk1' : 'walk2'], 48 + i * 5, 105);
    sprite(p, GWINN[i % 2 ? 'gwinn1' : 'gwinn2'], 264, 105);
    sprite(p, docLeo(undefined, i % 2 === 0), 214, 63);
    for (let bit = 0; bit < 4; bit++) {
      const x = 176 + bit * 12 - i * 7;
      const y = 117 + bit * 3 + i * 3;
      p.rect(x, y, 8, 2, bit % 2 ? c.white : c.dark);
    }
    centered(p, 42, 'THE WIND STOLE THE STRIPES!', c.gold, 1, c.dark);
  }, 2);
  for (let i = 0; i < 8; i++) reel.frame(bg, (p) => {
    p.blit(worn, 120, 81, 255);
    sprite(p, POSES[i % 2 ? 'walk1' : 'stand'], 70 + i * 4, 105);
    sprite(p, GWINN[i % 2 ? 'gwinn1' : 'gwinn2'], 264, 105);
    sprite(p, docLeo(undefined, i % 2 === 0), 214, 63);
    centered(p, 42, 'TEDDY HAS A PLAN. WOOF!', c.gold, 1, c.dark);
  }, 2);
  reel.fadeOut(5);
  return reel.fli(5);
}

// Match the passenger window in the measured left-facing drawing; keep both ears equal.
function passengerTeddy(car: Pixels, ink: ChezInk): void {
  const head = POSES.stand.crop(7, 4, 13, 8).flipX();
  for (let y = 0; y < head.h; y++) for (let x = 0; x < head.w; x++) {
    const color = head.get(x, y);
    if (color === 255) continue;
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
      const px = 55 + x * 2 + dx, py = 9 + y * 2 + dy;
      if (car.get(px, py) === ink.glass[0]) car.set(px, py, color);
    }
  }
}

export function driveCartoon(pal: Uint8Array, ink: ChezInk, destination: string, road: number): Uint8Array {
  const beat = ROAD_BEATS[road - 1];
  if (!beat) throw new Error(`No road story for ${road}`);
  const c = colors(pal);
  const bg = roadside(c, `NEXT: ${destination}`);
  const riding = road === ROAD_BEATS.length;
  const facing = riding ? 'left' : 'right';
  const reel = new Reel(pal);
  for (let i = 0; i < 56; i++) reel.frame(bg, (p) => {
    const repaired = riding ? Math.min(1, i / 30) : 0;
    const car = stripeCar(ink, repaired, facing, 3);
    const board = riding && i >= 30 ? Math.min(1, (i - 30) / 14) : 0;
    if (board === 1) passengerTeddy(car, ink);
    paintRoadGag(p, beat.gag, i, c);
    p.blit(car, 96, 81, 255);
    if (board < 1) sprite(p, POSES[i % 2 ? 'walk1' : 'stand'], 40 + Math.round(board * 96), 105 - Math.round(board * 26 + Math.sin(board * Math.PI) * 35));
    sprite(p, GWINN[i % 2 ? 'gwinn1' : 'gwinn2'], 264, 105);
    if (!riding || i < 40) sprite(p, docLeo(undefined, i % 8 < 4), 232, 63);
    p.rect(0, 153, 320, 43, c.dark);
    centered(p, 159, beat.lines[0], c.white);
    centered(p, 178, beat.lines[1], c.gold);
  });
  const car = stripeCar(ink, riding ? 1 : 0, facing, 3);
  if (riding) passengerTeddy(car, ink);
  for (let i = 0; i < 18; i++) reel.frame(bg, (p) => {
    const x = riding ? 320 - i * 25 : -110 + i * 25;
    p.blit(car, x, 81, 255);
    if (!riding) sprite(p, POSES[i % 2 ? 'walk1' : 'walk2'], x + 120, 105);
    for (let dash = 0; dash < 5; dash++) p.rect((dash * 73 - i * 17 + 500) % 320, 179, 34, 3, c.gold);
  });
  reel.fadeOut(4);
  return reel.fli(5);
}

export function winningCartoon(pal: Uint8Array, ink: ChezInk): Uint8Array {
  const c = colors(pal);
  const bg = roadside(c, 'TEDDY SAVED THE STRIPES!');
  const car = stripeCar(ink, 1, 'left', 3);
  passengerTeddy(car, ink);
  const reel = new Reel(pal);
  for (let i = 0; i < 20; i++) reel.frame(bg, (p) => {
    p.blit(car, 320 - i * 23, 81, 255);
    for (let j = 0; j < 4; j++) p.line(23 + j * 27, 111 + j * 9, 10 + j * 27, 111 + j * 9, c.white);
    if (i > 9) centered(p, 50, '900% MORE DASHING!', c.gold, 1, c.dark);
  }, 1);
  for (let i = 0; i < 10; i++) reel.frame(bg, (p) => {
    sprite(p, GWINN[i % 2 ? 'gwinn1' : 'gwinn2'], 40, 105);
    sprite(p, POSES[i % 2 ? 'walk1' : 'stand'], 128, 84, 3);
    sprite(p, docLeo(undefined, i % 2 === 0), 242, 63);
    for (let bit = 0; bit < 9; bit++) p.rect((bit * 39 + i * 7) % 320, 49 + (bit * 17 + i * 5) % 71, 4, 4, bit % 2 ? c.gold : c.red);
    centered(p, 30, 'TEAMWORK GETS THE STRIPES!', c.white, 1, c.dark);
  }, 2);
  reel.fadeOut(5);
  return reel.fli(5);
}

export function losingCartoon(pal: Uint8Array, ink: ChezInk): Uint8Array {
  const c = colors(pal);
  const bg = roadside(c, 'THE WIND GOT THIS ROUND');
  const car = stripeCar(ink, 0, 'right', 3);
  const reel = new Reel(pal);
  for (let i = 0; i < 12; i++) reel.frame(bg, (p) => {
    p.blit(car, 92, 81, 255);
    sprite(p, POSES[i % 2 ? 'walk1' : 'stand'], 36 + i * 3, 105);
    for (let bit = 0; bit < 3; bit++) p.rect(145 + bit * 31 + i * 5, 118 - bit * 12 - i * 2, 9, 3, bit % 2 ? c.white : c.dark);
  }, 2);
  for (let i = 0; i < 10; i++) reel.frame(bg, (p) => {
    sprite(p, GWINN[i % 2 ? 'gwinn1' : 'gwinn2'], 42, 105);
    sprite(p, POSES[i % 2 ? 'walk1' : 'stand'], 133, 84, 3);
    sprite(p, docLeo(undefined, i % 2 === 0), 244, 63);
    centered(p, 42, 'A TEAM CAN TRY AGAIN!', c.gold, 1, c.dark);
  }, 2);
  reel.fadeOut(5);
  return reel.fli(5);
}

// Short, skippable DOS FLI cartoons: a stripe blows away, the crew drives on, and the car races home.
import { Reel } from '../../GameMaker/games/kit/reel.ts';
import { Pixels } from '../../GameMaker/games/kit/pixels.ts';
import { centered } from '../../GameMaker/games/kit/pcText.ts';
import { chezPicture, type ChezInk } from '../../GameMaker/games/kit/chez.ts';
import { matchColor } from '../../GameMaker/web/src/formats/palette.ts';

type Colors = { sky: number; road: number; edge: number; white: number; gold: number; red: number; dark: number };
function colors(pal: Uint8Array): Colors {
  const c = (r: number, g: number, b: number) => matchColor(pal, r, g, b);
  return { sky: c(7, 21, 28), road: c(13, 16, 18), edge: c(55, 43, 25), white: c(62, 59, 52), gold: c(63, 45, 16), red: c(57, 12, 7), dark: c(3, 8, 12) };
}

function roadside(c: Colors, label: string): Pixels {
  const p = new Pixels(320, 200, c.sky);
  p.disc(252, 38, 21, c.gold);
  p.rect(0, 142, 320, 58, c.road);
  p.rect(0, 141, 320, 3, c.edge);
  for (let x = 0; x < 320; x += 64) p.rect(x + 9, 177, 34, 3, c.gold);
  centered(p, 14, label, c.white, 1, c.dark);
  return p;
}

export function openingCartoon(pal: Uint8Array, ink: ChezInk): Uint8Array {
  const c = colors(pal);
  const bg = roadside(c, 'TEDDY PRESENTS: A TINY QUEST');
  const car = chezPicture(ink, 'right', 3);
  const reel = new Reel(pal);
  for (let i = 0; i < 12; i++) reel.frame(bg, (p) => p.blit(car, -100 + i * 17, 81, 255), 2);
  for (let i = 0; i < 12; i++) reel.frame(bg, (p) => {
    p.blit(car, 87 + i * 3, 81, 255);
    for (let bit = 0; bit < 4; bit++) {
      const x = 176 + bit * 12 - i * 7;
      const y = 117 + bit * 3 + i * 3;
      p.rect(x, y, 8, 2, bit % 2 ? c.white : c.dark);
    }
    centered(p, 42, 'THE WIND STOLE THE STRIPES!', c.gold, 1, c.dark);
  }, 2);
  reel.fadeOut(5);
  return reel.fli(5);
}

export function driveCartoon(pal: Uint8Array, ink: ChezInk, destination: string): Uint8Array {
  const c = colors(pal);
  const bg = roadside(c, `TEDDY LEADS TO ${destination}`);
  const car = chezPicture(ink, 'right', 3);
  const reel = new Reel(pal);
  for (let i = 0; i < 18; i++) reel.frame(bg, (p) => {
    const x = -110 + i * 25;
    p.blit(car, x, 81, 255);
    for (let dash = 0; dash < 5; dash++) p.rect((dash * 73 - i * 17 + 500) % 320, 179, 34, 3, c.gold);
  }, 1);
  reel.fadeOut(4);
  return reel.fli(5);
}

export function winningCartoon(pal: Uint8Array, ink: ChezInk): Uint8Array {
  const c = colors(pal);
  const bg = roadside(c, 'TEDDY SAVED THE STRIPES!');
  const car = chezPicture(ink, 'right', 3);
  const reel = new Reel(pal);
  for (let i = 0; i < 20; i++) reel.frame(bg, (p) => {
    p.blit(car, -110 + i * 20, 81, 255);
    for (let j = 0; j < 4; j++) p.line(23 + j * 27, 111 + j * 9, 10 + j * 27, 111 + j * 9, c.white);
    if (i > 9) centered(p, 50, '900% MORE DASHING!', c.gold, 1, c.dark);
  }, 1);
  reel.fadeOut(5);
  return reel.fli(5);
}

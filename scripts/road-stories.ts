// Eight short, connected road jokes: Teddy earns trust, helps a leaf, and brings the crew home.
import type { Pixels } from '@lewismoten/gamemaker-sandbox-tools/drawing';
import { centered } from '@lewismoten/gamemaker-sandbox-tools/drawing';

type Gag = 'meter' | 'leaf' | 'puddle' | 'note' | 'balloons' | 'shortcut' | 'fitting' | 'umbrella';
export const ROAD_BEATS: readonly { gag: Gag; lines: readonly [string, string] }[] = [
  { gag: 'meter', lines: ["DOC LEO: THAT'S 900% FASTER!", "TEDDY: LET'S TRY FORWARD FIRST."] },
  { gag: 'leaf', lines: ['GWINN: A HIGHLY SUSPICIOUS LEAF!', 'TEDDY: SMALL FRIENDS GET A TURN.'] },
  { gag: 'puddle', lines: ['TEDDY: YOUR TURN, DOC LEO!', 'DOC LEO: MY CHICKEN SHALL SQUEAK.'] },
  { gag: 'note', lines: ['GWINN: THE LEAF SENT A THANK-YOU.', 'TEDDY: KINDNESS HAS GOOD MILEAGE.'] },
  { gag: 'balloons', lines: ['BALLOONS: THANKS FOR ASKING NICELY!', 'TEDDY: ONE WOOF. FOUR NEW FRIENDS.'] },
  { gag: 'shortcut', lines: ['GWINN: JUST ONE MORE LITTLE TURN!', 'TEDDY: YOUR TURN TO LEAD, GWINN.'] },
  { gag: 'umbrella', lines: ['GWINN: THE RAIN HAS A FLIGHT PLAN!', 'TEDDY: I SHALL PACK AN UMBRELLA.'] },
  { gag: 'fitting', lines: ['DOC LEO: READY FOR NINE HUNDRED?', 'TEDDY: TEAMWORK. THEN A LITTLE ZOOM.'] },
];

type StoryColors = { gold: number; dark: number; white: number; red: number; blue: number };
function leaf(p: Pixels, x: number, y: number, c: StoryColors) {
  for (let dy = -6; dy <= 6; dy++)
    for (let dx = -7; dx <= 7; dx++) {
      if (Math.abs(dx) + Math.abs(dy) < 8) p.set(x + dx, y + dy, c.gold);
    }
  p.line(x - 5, y + 5, x + 4, y - 4, c.dark);
  p.line(x - 7, y + 7, x - 3, y + 3, c.gold);
}

export function paintRoadGag(p: Pixels, gag: Gag, frame: number, c: StoryColors): void {
  switch (gag) {
    case 'meter':
      p.rect(132, 49, 80, 22, c.dark).frame(132, 49, 80, 22, c.gold);
      centered(p, 56, '900%', c.white, 1, undefined, 172);
      p.line(140, 74, 144 + (frame % 18) * 3, 74, c.red);
      break;
    case 'leaf':
      leaf(p, 248 - Math.min(frame, 52) * 3, 85 + Math.round(Math.sin(frame / 5) * 9), c);
      break;
    case 'puddle':
      p.rect(29, 141, 63, 7, c.blue).rect(35, 139, 51, 10, c.blue);
      for (let i = 0; i < 4; i++) {
        const t = (frame + i * 7) % 24;
        p.rect(43 + i * 11, 137 - Math.round(Math.sin((t / 24) * Math.PI) * 21), 2, 3, c.white);
      }
      p.line(34 + (frame % 12), 145, 48 + (frame % 12), 145, c.white);
      break;
    case 'note': {
      const x = 86 + Math.round(Math.sin(frame / 8) * 5);
      leaf(p, x + 13, 81, c);
      p.rect(x, 93, 28, 18, c.white).frame(x, 93, 28, 18, c.red);
      p.line(x, 93, x + 14, 104, c.red).line(x + 27, 93, x + 14, 104, c.red);
      break;
    }
    case 'balloons':
      for (const [i, x] of [26, 80, 260, 292].entries()) {
        const y = 57 + Math.round(Math.sin(frame / 6 + i) * 5);
        const color = i % 2 ? c.gold : c.red;
        p.line(x, y + 9, i < 2 ? 60 : 280, 128, c.white);
        p.disc(x, y, 9, color)
          .disc(x - 6, y - 7, 4, color)
          .disc(x + 6, y - 7, 4, color);
        p.rect(x - 4, y - 2, 2, 2, c.dark).rect(x + 3, y - 2, 2, 2, c.dark);
        p.line(x - 3, y + 3, x, y + 5, c.dark).line(x, y + 5, x + 3, y + 3, c.dark);
      }
      break;
    case 'shortcut':
      p.rect(118, 48, 96, 29, c.white).frame(118, 48, 96, 29, c.gold);
      for (let row = 0; row < 3; row++) {
        const x = 125 + row * 4 + (frame % 4);
        p.line(x, 54 + row * 7, 202 - row * 4, 54 + row * 7, c.dark);
        p.line(row % 2 ? x : 202 - row * 4, 54 + row * 7, row % 2 ? x : 202 - row * 4, 61 + row * 7, c.dark);
      }
      break;
    case 'umbrella':
      for (let y = 0; y < 18; y++)
        for (let x = -29; x <= 29; x++) if (x * x + (y - 18) ** 2 < 850) p.set(160 + x, 53 + y, Math.floor((x + 30) / 10) % 2 ? c.red : c.white);
      p.line(160, 71, 160, 103, c.gold).line(160, 103, 153, 109, c.gold);
      for (let i = 0; i < 8; i++) {
        const y = 45 + ((frame * 3 + i * 11) % 70);
        p.line(111 + i * 14, y, 109 + i * 14, y + 4, c.blue);
      }
      break;
    case 'fitting':
      for (let i = 0; i < 5; i++) {
        const x = 105 + i * 26,
          y = 76 + ((frame + i * 3) % 10);
        p.line(x - 2, y, x + 2, y, c.gold).line(x, y - 2, x, y + 2, c.gold);
      }
      break;
  }
}

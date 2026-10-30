// Teddy's colors: one set of named ramps shared by every block, sprite and screen, and a
// palette per time of day. The art never changes between levels; the .PAL does, so the
// same town goes from a pink morning in the backyard to the Clown Club's lights at night.
import { PaletteBuilder, TIME_OF_DAY_SKY as SKY, lightColor, type TimeOfDay } from '@lewismoten/gamemaker-sandbox-tools/drawing';
export type { TimeOfDay } from '@lewismoten/gamemaker-sandbox-tools/drawing';

type RGB = [number, number, number];

/** [name, shades, dark, light, mid?, glows at night?] */
const RAMPS: [string, number, RGB, RGB, RGB?, boolean?][] = [
  ['ink', 2, [20, 14, 18], [52, 40, 44]],
  ['sky', 8, [92, 150, 230], [214, 238, 255]],
  ['cloud', 3, [190, 204, 228], [255, 255, 255]],
  ['grass', 5, [30, 84, 26], [150, 214, 84]],
  ['leaf', 4, [16, 56, 30], [70, 140, 64]],
  ['dirt', 5, [60, 34, 18], [176, 122, 74]],
  ['wood', 5, [70, 38, 20], [212, 156, 96]],
  ['paint', 4, [150, 156, 170], [255, 255, 250]],
  ['brick', 5, [84, 26, 22], [214, 110, 82]],
  ['stone', 5, [70, 70, 80], [200, 196, 190]],
  ['asphalt', 4, [36, 36, 44], [104, 104, 116]],
  ['roof', 4, [64, 26, 34], [170, 72, 72]],
  ['siding', 4, [56, 90, 130], [150, 190, 226]],
  ['corgi', 5, [112, 44, 10], [250, 176, 92]],
  ['fur', 3, [196, 186, 176], [255, 252, 244]],
  ['gwinn', 5, [44, 22, 12], [170, 104, 62]],
  ['red', 4, [120, 10, 20], [255, 84, 84]],
  ['yellow', 4, [150, 104, 0], [255, 238, 96]],
  ['blue', 4, [20, 40, 120], [96, 160, 255]],
  ['green', 3, [20, 100, 50], [96, 220, 120]],
  ['purple', 4, [60, 20, 90], [190, 120, 240]],
  ['pink', 4, [170, 60, 110], [255, 190, 220]],
  ['skin', 4, [120, 70, 48], [255, 214, 180]],
  ['metal', 5, [50, 56, 66], [220, 226, 232]],
  ['water', 4, [24, 70, 150], [150, 220, 255]],
  ['tongue', 2, [190, 60, 80], [255, 130, 150]],
  ['glow', 4, [170, 110, 30], [255, 252, 200], undefined, true],
  ['neon', 4, [255, 60, 140], [80, 220, 255], [255, 230, 80], true],
  ['gold', 3, [150, 100, 10], [255, 230, 110]],
];

export interface Pal {
  pal: Uint8Array;
  r: (name: string) => number[];
  /** Shade k of a ramp, clamped. */
  c: (name: string, k: number) => number;
  b: PaletteBuilder;
}

export function buildPalette(time: TimeOfDay): Pal {
  const b = new PaletteBuilder();
  b.designerColors();
  for (const [name, n, from, to, mid, glows] of RAMPS) {
    if (name === 'sky') {
      const [a, z, m] = SKY[time];
      b.ramp(name, n, a, z, m);
      continue;
    }
    const lit = (c: RGB): RGB =>
      glows && (time === 'night' || time === 'sunset' || time === 'show')
        ? c
        : lightColor(c, time);
    b.ramp(name, n, lit(from), lit(to), mid ? lit(mid) : undefined);
  }
  return wrap(b);
}

/** The noon ramps plus extra inks and gradients for the 320x200 screens. */
export function buildScreenPalette(): Pal {
  const b = new PaletteBuilder();
  b.designerColors();
  for (const [name, n, from, to, mid] of RAMPS) b.ramp(name, n, from, to, mid);
  b.ramp('dusk', 12, [30, 20, 70], [255, 180, 110], [200, 80, 120]);
  b.ramp('tent', 4, [120, 10, 30], [255, 90, 90]);
  b.ramp('cream', 4, [200, 180, 140], [255, 248, 230]);
  // Display_File writes text in the color nearest (50,10,50)*4 and "MORE..." in the red
  // nearest (63,10,10)*4: give it a deep plum ink and a clown red.
  b.ramp('plum', 1, [170, 24, 140], [170, 24, 140]);
  b.ramp('menublue', 2, [24, 24, 150], [44, 44, 252]);
  b.ramp('menured', 1, [252, 40, 40], [252, 40, 40]);
  return wrap(b);
}

function wrap(b: PaletteBuilder): Pal {
  const r = (name: string) => b.get(name);
  return {
    pal: b.pal,
    r,
    c: (name, k) => {
      const ramp = r(name);
      return ramp[Math.max(0, Math.min(ramp.length - 1, k))];
    },
    b,
  };
}

/** Index of a ramp shade in every palette (the builders add ramps in the same order). */
export const P = buildPalette('noon');

// Extra palette colors for the street, the cards and the car: ramps written into the free slots
// (129 to 249) of the shared backyard palette, so Teddy, Doc Leo and the club font keep their slots.
// Ramp and gradient ideas follow Tune-Up's palette builder (Lewis Moten, MIT; see NOTICE.md).
type Rgb = readonly [number, number, number];

const lerp = (a: Rgb, b: Rgb, t: number): Rgb => [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * t)) as unknown as Rgb;
const ramp = (n: number, from: Rgb, to: Rgb): Rgb[] => Array.from({ length: n }, (_, i) => lerp(from, to, n === 1 ? 0 : i / (n - 1)));

/** Named ramps, in 6-bit VGA values (0 to 63), dark to light unless noted. */
const RAMPS = {
  sky: ramp(8, [17, 31, 52], [53, 59, 62]), // zenith to horizon
  cloud: [[50, 55, 61], [58, 61, 63], [63, 63, 63]] as Rgb[],
  haze: [[33, 41, 52], [40, 47, 57], [47, 53, 60]] as Rgb[],
  brick: [[20, 7, 6], [33, 13, 10], [44, 19, 13], [53, 27, 19]] as Rgb[],
  stucco: [[30, 25, 17], [42, 35, 23], [52, 45, 31], [59, 53, 40]] as Rgb[],
  siding: [[10, 24, 20], [15, 33, 27], [22, 42, 34], [31, 51, 42]] as Rgb[],
  blue: [[12, 20, 34], [18, 29, 45], [27, 40, 55], [38, 51, 61]] as Rgb[],
  slate: [[14, 16, 22], [22, 25, 33], [32, 36, 45]] as Rgb[],
  tile: [[30, 12, 7], [43, 20, 11], [53, 30, 18]] as Rgb[],
  glass: [[7, 13, 21], [16, 30, 45], [32, 48, 59]] as Rgb[],
  asphalt: [[13, 14, 17], [19, 20, 24], [26, 27, 32], [34, 35, 40]] as Rgb[],
  stone: [[28, 28, 28], [40, 40, 39], [51, 51, 49], [59, 59, 56]] as Rgb[],
  leaf: [[5, 18, 9], [8, 27, 12], [13, 37, 15], [21, 47, 19], [34, 55, 26]] as Rgb[],
  wood: [[17, 9, 5], [25, 15, 8], [35, 23, 12]] as Rgb[],
  iron: [[9, 11, 13], [20, 23, 27], [34, 38, 43]] as Rgb[],
  carRed: [[36, 5, 4], [54, 11, 7], [61, 25, 18]] as Rgb[],
  awnR: [[44, 8, 7], [60, 60, 56]] as Rgb[],
  awnG: [[8, 34, 18], [58, 58, 46]] as Rgb[],
  awnB: [[9, 20, 46], [58, 58, 56]] as Rgb[],
  paint: [[60, 56, 18], [61, 61, 58]] as Rgb[],
  flag: [[54, 10, 8], [63, 50, 10], [12, 28, 56], [10, 42, 20]] as Rgb[],
  bloom: [[60, 24, 34], [62, 52, 14], [40, 20, 48]] as Rgb[],
  glow: [[63, 58, 32], [63, 62, 52]] as Rgb[],
  water: [[10, 18, 31], [20, 33, 48], [38, 52, 62]] as Rgb[],
  drop: [[31, 44, 57]] as Rgb[],
};

export type RampName = keyof typeof RAMPS;
const FIRST = 129;
const slots = new Map<RampName, number>();
let next = FIRST;
for (const name of Object.keys(RAMPS) as RampName[]) {
  slots.set(name, next);
  next += RAMPS[name].length;
}
if (next > 250) throw new Error(`The street ramps use ${next - FIRST} colors; only 121 are free`);

/** Palette index of step `i` of a ramp. */
export const R = (name: RampName, i: number): number => {
  const base = slots.get(name)!;
  if (i < 0 || i >= RAMPS[name].length) throw new Error(`${name}[${i}] is outside the ramp`);
  return base + i;
};
/** All of a ramp's palette indices, dark to light. */
export const RAMP = (name: RampName): number[] => RAMPS[name].map((_, i) => R(name, i));

/** Write every ramp into a 768-byte palette. */
export function addStreetColors(pal: Uint8Array): void {
  for (const name of Object.keys(RAMPS) as RampName[]) RAMPS[name].forEach((rgb, i) => pal.set(rgb, (slots.get(name)! + i) * 3));
}
export const colorsUsed = next - FIRST;

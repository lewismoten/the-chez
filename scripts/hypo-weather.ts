// Weather and night for the street scenery. Rain streaks repeat every 20 pixels, so painting them over the
// whole picture adds no new blocks; lamp light is a dither of the glow ramp; the night garage is a lit open bay;
// a puddle is three animated frames (ripples) of a left cap, a middle and a right cap.
import { Pixels } from '@lewismoten/gamemaker-sandbox-tools/drawing';
import { R } from './hypo-colors.ts';
import { hash, roadTop, sidewalk } from './hypo-tiles.ts';
import { micro } from '../assets/source/teddy/art/draw.ts';

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

/** Slanted rain: five streaks per 20x20 cell, the same in every cell, drawn over the finished picture. */
export function rainOver(pic: Pixels): void {
  const streaks: [number, number][] = [];
  for (let i = 0; i < 5; i++) streaks.push([Math.floor(hash(i, 1, 77) * 20), Math.floor(hash(i, 2, 77) * 20)]);
  for (let cy = 0; cy < pic.h / 20; cy++)
    for (let cx = 0; cx < pic.w / 20; cx++)
      for (const [sx, sy] of streaks)
        for (let k = 0; k < 3; k++) pic.set(cx * 20 + ((sx - k + 20) % 20), cy * 20 + ((sy + k * 2) % 20), R('drop', 0));
}

/** A pool of lamp light: the glow ramp dithered thinner toward the edge of an ellipse. */
export function lightPool(pic: Pixels, cx: number, cy: number, rx: number, ry: number, top = 0): void {
  for (let y = Math.max(top, Math.floor(cy - ry)); y < cy + ry; y++)
    for (let x = Math.floor(cx - rx); x < cx + rx; x++) {
      const d = Math.hypot((x - cx) / rx, (y - cy) / ry);
      if (d >= 1 || x < 0 || x >= pic.w || y >= pic.h) continue;
      const t = (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;
      if ((1 - d) * 1.1 > t) pic.set(x, y, R('glow', d < 0.45 ? 1 : 0));
    }
}

/** Light the glass of one window tile (its cell's top-left is cx, cy in pixels). */
export function lightWindow(pic: Pixels, cx: number, cy: number): void {
  for (let y = 5; y < 15; y++)
    for (let x = 6; x < 14; x++) {
      const c = pic.get(cx + x, cy + y);
      if (c >= R('glass', 0) && c <= R('glass', 2)) pic.set(cx + x, cy + y, R('glow', (x + y) % 5 === 0 ? 1 : 0));
    }
}

/** The night garage: a lit open bay two floors tall in a four-cell lot whose left edge is at pixel x. */
export function garageBay(pic: Pixels, x: number, groundY: number): void {
  const left = x + 10;
  const w = 60;
  const top = groundY - 40 + 1;
  pic.rect(left - 3, top - 3, w + 6, 44, R('stone', 2));
  pic.rect(left - 3, top - 3, w + 6, 1, R('stone', 3));
  // the lit inside: a warm back wall, a bench with tools, a shelf, the rolled-up door at the top
  pic.rect(left, top, w, 40, R('glow', 0));
  for (let yy = 0; yy < 40; yy++) for (let xx = 0; xx < w; xx++) if (hash(xx, yy, 71) < 0.07) pic.set(left + xx, top + yy, R('glow', 1));
  pic.rect(left, top + 28, w, 12, R('wood', 2));
  pic.rect(left, top + 28, w, 1, R('wood', 1));
  pic.rect(left + 6, top + 34, 3, 6, R('wood', 0));
  pic.rect(left + 48, top + 34, 3, 6, R('wood', 0));
  pic.rect(left + 8, top + 18, 18, 2, R('wood', 1));
  for (const [bx, c] of [[10, R('flag', 0)], [15, R('flag', 2)], [20, R('flag', 3)]] as const) pic.rect(left + bx, top + 12, 4, 6, c);
  for (let k = 0; k < 4; k++) pic.rect(left + 34 + k * 5, top + 8, 1, 10 - (k % 2) * 3, R('iron', 1));
  pic.rect(left + 33, top + 7, 20, 1, R('iron', 2));
  for (let k = 0; k < 4; k++) {
    pic.rect(left, top + k * 2, w, 1, R('wood', 2));
    pic.rect(left, top + k * 2 + 1, w, 1, R('wood', 0));
  }
  pic.rect(left - 3, top - 3, 3, 44, R('stone', 1));
  pic.rect(left + w, top - 3, 3, 44, R('stone', 1));
  const sign = new Pixels(40, 12, R('wood', 1));
  sign.frame(0, 0, 40, 12, R('glow', 0));
  micro(sign, 4, 3, 'HOME', R('glow', 1), 2);
  pic.blit(sign, left + 10, top - 18, 255);
}

/** The three ripple frames of a puddle's left cap, middle and right cap, for the car's row and the road row below. */
export function puddleFrames(): { car: Pixels[][]; road: Pixels[][] } {
  const car: Pixels[][] = [];
  const road: Pixels[][] = [];
  for (let phase = 0; phase < 3; phase++) {
    const scratch = new Pixels(60, 40, 0);
    for (let i = 0; i < 3; i++) {
      scratch.blit(sidewalk(0), i * 20, 0);
      scratch.blit(roadTop(false), i * 20, 20);
    }
    const mid = 30;
    const level = 18; // near the row boundary
    const inside = (x: number, y: number): boolean => {
      const dy = (y - (level + 2)) / 7.2;
      if (Math.abs(dy) >= 1) return false;
      const reach = Math.sqrt(1 - dy * dy);
      // a stadium: rounded caps over the first and last cell, a flat middle
      if (x < 22) return x >= 22 - 20 * reach && x >= 3;
      if (x >= 38) return x <= 38 + 20 * reach && x <= 57;
      return true;
    };
    for (let y = 0; y < 40; y++)
      for (let x = 0; x < 60; x++) {
        if (!inside(x, y)) continue;
        const edge = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1);
        const upper = y < level + 2;
        scratch.set(x, y, edge ? R('water', 0) : R('water', upper ? 1 : hash(x, y, 4) < 0.18 ? 2 : 1));
      }
    for (const [fx, fy] of [[6, 17], [28, 18], [47, 21], [14, 23]] as const) if (inside(fx, fy)) scratch.rect(fx, fy, 3, 1, R('water', 2));
    // the ripple: a squashed ring around the middle that grows with the phase
    const r = 3 + phase * 3;
    for (let a = 0; a < 64; a++) {
      const x = Math.round(mid + Math.cos((a / 64) * Math.PI * 2) * r * 1.5);
      const y = Math.round(level + 2 + Math.sin((a / 64) * Math.PI * 2) * r * 0.55);
      if (inside(x, y) && x >= 22 && x < 38) scratch.set(x, y, R('water', 2));
    }
    car.push([0, 1, 2].map((i) => scratch.crop(i * 20, 0, 20, 20)));
    road.push([0, 1, 2].map((i) => scratch.crop(i * 20, 20, 20, 20)));
  }
  return { car, road };
}

// Level 10, the Night Trial: the white pinstripe is on, and THE CHEZ drives home through the town after dark. The
// night palette is a swap of the street's colors with the lamps, lit windows and the car's headlights kept bright;
// each lamp throws a pool of light on the road, and the road ends in the lit open garage. Nothing hurts or blocks.
import { serializeBlocks, emptyBlock, type Block } from '@lewismoten/gamemaker-sandbox-tools/formats/blocks';
import { serializeMap } from '@lewismoten/gamemaker-sandbox-tools/formats/map';
import { newMonsterSet, serializeMonsters } from '@lewismoten/gamemaker-sandbox-tools/formats/monster';
import { C, palette, timeOfDay } from './hypo-art.ts';
import { R } from './hypo-colors.ts';
import { carSprites } from './hypo-car.ts';
import { roadBlocks } from './hypo-road.ts';
import { ROW } from './hypo-town.ts';

export const NIGHT = { startX: 8, finishX: 90, row: ROW };
/** Slots the night keeps bright: lamp and window light, the car's lamps and the dial's gold, white and cream. */
export const NIGHT_KEEP = [C.gold, C.white, C.cream, R('glow', 0), R('glow', 1)];
export const nightPalette = (): Uint8Array => timeOfDay(palette(3), 'night', NIGHT_KEEP);

/** The car with its headlights on: a lit lamp at the front and light dithered on the bumper and the ground ahead. */
export function nightCarSprites(): Block[] {
  const sprites = carSprites();
  const TOP = 4; // the car's top row inside its block
  for (const n of [0, 1, 2])
    for (const [x, y, c] of [
      [18, 8, R('glow', 1)], [19, 8, R('glow', 1)],
      [18, 9, R('glow', 1)], [19, 9, R('glow', 0)],
      [19, 10, R('glow', 0)], [19, 7, R('glow', 0)],
      [19, 12, R('glow', 0)], [17, 12, R('glow', 0)],
    ] as const)
      sprites[n].pixels[(y + TOP) * 20 + x] = c;
  return sprites;
}

export function nightFiles(put: (name: string, data: Uint8Array) => void): void {
  const road = roadBlocks('night');
  put('night.pal', nightPalette());
  put('night.map', serializeMap(road.map));
  put('night.bbl', serializeBlocks(road.blocks as Block[]));
  put('night.mon', serializeMonsters(newMonsterSet()));
  put('night.mbl', serializeBlocks(Array.from({ length: 100 }, (_, i) => emptyBlock(i, true))));
  put('carnight.cbl', serializeBlocks(nightCarSprites()));
  console.log(`The night road uses ${road.used} of 150 art blocks`);
}

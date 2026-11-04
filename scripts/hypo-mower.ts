// Level 9, Trial 3: the Mower. The neighbor's riding mower (an umbrella over the neighbor, a set 15 mph) races THE CHEZ
// along a rainy park road to the finish line. The street is the town's rain palette; puddles ripple across the car's lane
// and slow the car. The mower never stops and nothing hurts: reaching the line ends the trial, and a car that holds
// Right the whole way is always first, puddles and all (checked in check-game).
import { serializeBlocks, emptyBlock, type Block } from '@lewismoten/gamemaker-sandbox-tools/formats/blocks';
import { reindexMonsters, serializeMap } from '@lewismoten/gamemaker-sandbox-tools/formats/map';
import { newMonsterSet, serializeMonsters } from '@lewismoten/gamemaker-sandbox-tools/formats/monster';
import { serializeCharacter } from '@lewismoten/gamemaker-sandbox-tools/formats/character';
import { corner, mon } from './hypo-monsters.ts';
import { palette, timeOfDay } from './hypo-art.ts';
import { R } from './hypo-colors.ts';
import { carCharacter } from './hypo-car.ts';
import { mower } from './hypo-critters.ts';
import { roadBlocks } from './hypo-road.ts';
import { ROW } from './hypo-town.ts';

export const MOWER = {
  startX: 8,
  finishX: 90,
  row: ROW,
  riderX: 22,
  riderSpeed: 3,
  puddles: [[34, 8], [54, 8], [73, 7]] as [number, number][],
};

export function mowerFiles(put: (name: string, data: Uint8Array) => void): void {
  const pal = timeOfDay(palette(3), 'rain', [R('drop', 0)]);
  const road = roadBlocks('park', MOWER.puddles);
  const set = newMonsterSet();
  set[0] = mon(
    [[0, 3], [1, 3]],
    { power: 150, thru: 0, fly: 1, end: -1, towards: 0 },
    // two legs: a corner more than half the map away would be walked the short way round, through the wrap
    [corner(40, 0, MOWER.riderSpeed), corner(MOWER.finishX + 1 - MOWER.riderX, 0, MOWER.riderSpeed)],
  );
  road.map.monsters[0] = { monnum: 0, status: 0, xtra: 0, curx: MOWER.riderX, cury: ROW + 1, extra: 0 };
  reindexMonsters(road.map);
  const mblk = Array.from({ length: 100 }, (_, i) => emptyBlock(i, true));
  [mower(0), mower(1)].forEach((pic, i) => mblk[i].pixels.set(pic.px));
  put('mower.pal', pal);
  put('mower.map', serializeMap(road.map));
  put('mower.bbl', serializeBlocks(road.blocks as Block[]));
  put('mower.mon', serializeMonsters(set));
  put('mower.mbl', serializeBlocks(mblk as Block[]));
  console.log(`The rainy park road uses ${road.used} of 150 art blocks`);
}

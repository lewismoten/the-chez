// Small helpers for filling in monster records: a monster with its pictures and path, and a path corner.
import { emptyMonster, type March, type Monster } from '@lewismoten/gamemaker-sandbox-tools/formats/monster';

/** A used monster: its picture sequence ([block, ticks] pairs), other fields, and its normal path. */
export function mon(pics: [number, number][], options: Partial<Monster>, path: March[] = []): Monster {
  const m = emptyMonster();
  m.used = 1;
  pics.forEach((pic, i) => (m.pic[i] = pic));
  Object.assign(m, options);
  path.forEach((corner, i) => (m.march[0][i] = corner));
  return m;
}

/** A path corner: blocks right and down from the start, pixels a tick to get there, and the picture's orientation. */
export const corner = (x: number, y: number, speed: number, orient = 0): March => ({ x, y, pic: speed, orient });

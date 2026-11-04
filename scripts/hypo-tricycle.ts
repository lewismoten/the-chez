// Level 4, Trial 1: the Tricycle. A kid on a tricycle (a friendly rival on a set path, 20 mph to the car's 25)
// races THE CHEZ down a morning street to the corner. Hens stand in the road ahead of the car,
// solid, until Space honks: the honk is a sound wave fired ahead of the car that sends a hen flapping off.
// Nothing here hurts. The rival never needs beating (reaching the corner ends the trial), and waiting works too.
import { emptyBlock, serializeBlocks, type Block } from '@lewismoten/gamemaker-sandbox-tools/formats/blocks';
import { newMap, reindexMonsters, serializeMap } from '@lewismoten/gamemaker-sandbox-tools/formats/map';
import { newMonsterSet, serializeMonsters, type Monster } from '@lewismoten/gamemaker-sandbox-tools/formats/monster';
import { serializeCharacter } from '@lewismoten/gamemaker-sandbox-tools/formats/character';
import { corner, mon } from './hypo-monsters.ts';
import { palette, timeOfDay } from './hypo-art.ts';
import { carCharacter, carSprites } from './hypo-car.ts';
import { flapper, hen, trike, wave } from './hypo-critters.ts';
import { paintTown, ROW } from './hypo-town.ts';

export const TRICYCLE = { startX: 8, finishX: 90, row: ROW, riderX: 12, hens: [26, 50, 70], riderSpeed: 4 };
/** Monster numbers in tric.mon. */
const MON = { rider: 0, hen: 1, flapper: 2, wave: 3 };
/** Monster picture numbers in tric.mbl. */
const PIC = { trike: 0, hen: 3, flapper: 7, wave: 9 };

/** The monsters: the rival, a hen that scurries onto the road when the car is near, the hen flapping away, the honk. */
function monsters(): Monster[] {
  const set = newMonsterSet();
  // power 150 (from 100 up nothing kills it by touch); only the honk (200) beats a hen.
  const base: Partial<Monster> = { power: 150, thru: 0, fly: 1 };
  set[MON.rider] = mon(
    [[PIC.trike, 3], [PIC.trike + 1, 3], [PIC.trike + 2, 3]],
    { ...base, end: -1, towards: 0 },
    // two legs: a corner more than half the map away would be walked the short way round, through the wrap
    [corner(40, 0, TRICYCLE.riderSpeed), corner(TRICYCLE.finishX + 1 - TRICYCLE.riderX, 0, TRICYCLE.riderSpeed)],
  );
  // a hen stands in the car's lane, pecking and looking about (still, so the car meets her cleanly)
  const look: [number, number][] = [[PIC.hen, 24], [PIC.hen + 1, 5], [PIC.hen, 4], [PIC.hen + 1, 5], [PIC.hen + 2, 20], [PIC.hen + 3, 5], [PIC.hen + 2, 4], [PIC.hen + 3, 5]];
  set[MON.hen] = mon(look, { ...base, newmon: MON.flapper, end: 0, towards: 0 });
  set[MON.flapper] = mon([[PIC.flapper, 2], [PIC.flapper + 1, 2]], { ...base, end: -1, towards: 0 }, [corner(0, -5, 4)]);
  set[MON.wave] = mon([[PIC.wave, 1]], { power: 200, thru: 1, fly: 1, towards: 10, end: 8 });
  return set;
}

export function tricycleFiles(put: (name: string, data: Uint8Array) => void): void {
  const pal = timeOfDay(palette(1), 'dawn');
  const blocks = Array.from({ length: 150 }, (_, i) => emptyBlock(i));
  const map = newMap();
  const town = paintTown('race');
  const cut = town.cut();
  if (cut.tiles.length > 120) throw new Error(`The race street needs ${cut.tiles.length} art blocks`);
  for (const block of blocks) block.grav = 4;
  cut.tiles.forEach((tile, id) => blocks[id].pixels.set(tile.px));
  map.blocks.set(cut.map);
  // The road's far lane is the floor the car stands on, and the street's two ends are buildings.
  const solidId = new Map<number, number>();
  const solidCopy = (id: number): number => {
    let n = solidId.get(id);
    if (n === undefined) {
      n = cut.tiles.length + solidId.size;
      if (n >= 150) throw new Error('No room for another solid copy of an art block');
      blocks[n].pixels.set(blocks[id].pixels);
      blocks[n].solid = 15;
      blocks[n].grav = 4;
      solidId.set(id, n);
    }
    return n;
  };
  for (let x = 0; x < 100; x++) map.blocks[(ROW + 1) * 100 + x] = solidCopy(map.blocks[(ROW + 1) * 100 + x]);
  for (const x of [0, 99]) for (const y of [ROW - 1, ROW]) map.blocks[y * 100 + x] = solidCopy(map.blocks[y * 100 + x]);

  // The rival rides in the road lane just below the car, a few blocks ahead; the hens stand in the car's lane.
  const place = (monnum: number, x: number, y: number, slot: number) => {
    map.monsters[slot] = { monnum, status: 0, xtra: 0, curx: x, cury: y, extra: 0 };
  };
  place(MON.rider, TRICYCLE.riderX, ROW + 1, 0);
  TRICYCLE.hens.forEach((x, i) => place(MON.hen, x, ROW, 1 + i));
  reindexMonsters(map);

  const mblk = Array.from({ length: 100 }, (_, i) => emptyBlock(i, true));
  [trike(0), trike(1), trike(2), hen(false), hen(true), hen(false).flipX(), hen(true).flipX(), flapper(true), flapper(false), wave()].forEach((pic, i) => mblk[i].pixels.set(pic.px));
  // a hen is solid (she holds the car back, gently); everything else is scenery the car can pass
  mblk[PIC.hen].solid = 15;
  for (const n of [1, 2, 3]) mblk[PIC.hen + n].solid = 15;

  put('tric.pal', pal);
  put('tric.map', serializeMap(map));
  put('tric.bbl', serializeBlocks(blocks as Block[]));
  put('tric.mon', serializeMonsters(monsters()));
  put('tric.mbl', serializeBlocks(mblk as Block[]));
  put('car25w.chr', serializeCharacter(carCharacter(25, undefined, MON.wave)));
  console.log(`The race street uses ${cut.tiles.length + solidId.size} of 150 art blocks`);
}

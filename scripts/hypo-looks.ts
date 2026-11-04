// How the levels with their own weather or hour show on a card or a results page: their street and palette.
import { palette, timeOfDay } from './hypo-art.ts';
import { R } from './hypo-colors.ts';
import type { Look } from './hypo-cards.ts';
import { nightPalette } from './hypo-night.ts';

export const rainLook: Look = { kind: 'park', pal: timeOfDay(palette(3), 'rain', [R('drop', 0)]), tile: 30 };
export const nightLook: Look = { kind: 'night', pal: nightPalette(), tile: 60 };
export const goldLook: Look = { kind: 'street', pal: timeOfDay(palette(3), 'gold'), tile: 8 };

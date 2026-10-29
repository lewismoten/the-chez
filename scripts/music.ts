// Original OPL2 themes for Stripe Chase; each chapter reshapes the same five-note hook.
import { INSTRUMENTS } from '../../GameMaker/web/src/audio/compose.ts';
import { tune, v } from '../../GameMaker/games/kit/tune.ts';

const { lead, pluck, bass, bell, pad } = INSTRUMENTS;
const join = (bars: string[]) => bars.join(', ');

/** A little rising "stripe" call: C–E–G, then a step back to C. */
const HOOK = [
  'C5 e, E5 e, G5 q, E5 q, D5 q',
  'D5 e, F5 e, A5 q, G5 q, F5 q',
  'E5 e, G5 e, C6 q, B5 q, G5 q',
  'A5 e, G5 e, E5 q, D5 q, C5 q',
];

const BASS = [
  'C3 q, G3 q, C4 q, G3 q',
  'F3 q, C4 q, F3 q, C4 q',
  'A3 q, E4 q, A3 q, E4 q',
  'G3 q, D4 q, G3 q, D4 q',
];

const PAD = ['C4 h, G4 h', 'F4 h, C5 h', 'A4 h, E5 h', 'G4 h, D5 h'];

export function chapterSong(chapter: number): Uint8Array {
  const orders = [[0, 1, 2, 3], [0, 2, 1, 3], [2, 1, 0, 3], [1, 3, 0, 2], [3, 2, 1, 0], [2, 0, 3, 1], [1, 0, 3, 2], [0, 3, 2, 1]];
  const order = orders[chapter];
  if (!order) throw new Error(`Unknown chapter song ${chapter}`);
  const melody = chapter === 6 ? ['E5 e, D5 e, C5 q, G4 q, C5 q', 'A4 q, C5 e, E5 e, D5 q, C5 q', 'F5 e, E5 e, D5 q, A4 q, D5 q', 'G4 e, B4 e, D5 q, E5 q, C5 q'] : order.map((i) => HOOK[i]);
  const kiteChimes = ['r h, C6 e, G5 e, E5 e, C5 e', 'r h, F6 e, C6 e, A5 e, F5 e', 'r h, E6 e, C6 e, A5 e, E5 e', 'r h, D6 e, B5 e, G5 e, D5 e'];
  const twice = <T>(bars: T[]) => [...bars, ...bars];
  return tune([124, 142, 154, 164, 136, 116, 128, 176][chapter], [
    v(0, chapter === 5 ? bell : chapter === 1 || chapter === 4 || chapter === 6 ? pluck : lead, join(twice(melody)), 110),
    v(1, bass, join(twice(order.map((i) => BASS[i]))), 91),
    v(2, pad, join(twice(order.map((i) => PAD[i]))), 56),
    v(3, bell, join(twice(chapter === 1 ? kiteChimes : ['r q, C5 e, r e, G5 q, r q', 'r q, F5 e, r e, C6 q, r q', 'r q, A5 e, r e, E6 q, r q', 'r q, G5 e, r e, D6 q, r q'])), 51),
  ]);
}

export function openingSong(): Uint8Array {
  return tune(118, [v(0, bell, join(HOOK), 100), v(1, bass, join(BASS), 80), v(2, pad, join(PAD), 55)]);
}

export function winningSong(): Uint8Array {
  const fanfare = [
    'C5 q, E5 q, G5 q, C6 q',
    'A5 q, G5 q, E5 q, G5 q',
    'C6 h, A5 q, G5 q',
    'E5 q, G5 q, C6 h',
  ];
  return tune(150, [v(0, lead, join(fanfare), 120), v(1, bass, join(BASS), 100), v(2, bell, join(['C5 h, G5 h', 'F5 h, C6 h', 'A5 h, E6 h', 'G5 h, C6 h']), 78)]);
}

export function retrySong(): Uint8Array {
  const gentle = ['C5 q, E5 q, D5 q, C5 q', 'A4 q, C5 q, G4 h', 'F4 q, A4 q, G4 q, E4 q', 'C5 h, r h'];
  return tune(104, [v(0, pluck, join(gentle), 95), v(1, bass, join(BASS), 64), v(2, pad, join(PAD), 46)]);
}

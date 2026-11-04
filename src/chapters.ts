// Level names, entrances, goals, and guidance shared by the page and verification.
export interface ChapterInfo {
  name: string;
  /** What the progress tile counts (the door's quota); 0 for a level with no counter. */
  required: number;
  goal: string;
  mission: string;
  help: string;
  blurb: string;
  startX: number;
  startY: number;
  /** The door's block (the engine reads its quota and whether it has opened). */
  doorX: number;
  doorY: number;
  counter?: number;
  /** What the progress tile shows when there is no counter: the level's top speed. */
  readout?: string;
  actor: 'Teddy' | 'THE CHEZ';
  mode: 'walk' | 'drive';
}

export const CHAPTERS: readonly ChapterInfo[] = [
  {
    name: 'The Hypothesis',
    required: 2,
    goal: 'THINGS FETCHED',
    mission: 'Fetch Doc Leo’s clipboard and stopwatch, then walk into the garage.',
    help: 'Walk around the hedges. The clipboard is by the mailbox lawn; the stopwatch is on the right.',
    blurb: 'Doc Leo has a hypothesis and no clipboard. Teddy knows where things are.',
    startX: 20,
    startY: 46,
    doorX: 21,
    doorY: 31,
    counter: 21,
    actor: 'Teddy',
    mode: 'walk',
  },
  {
    name: 'Control Run',
    required: 0,
    goal: 'SPEED',
    mission: 'Hold Right to drive. Stop for the turtle when the sign says WAIT; go on GO.',
    help: 'Holding Right is safe. The barrier opens on its own when the countdown ends.',
    blurb: 'No stripes at all, for science. The speedometer says 25 and means it.',
    startX: 8,
    startY: 95,
    doorX: 90,
    doorY: 95,
    readout: '25 MPH',
    actor: 'THE CHEZ',
    mode: 'drive',
  },
];

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
  /** The engine's scene number (0 title, 1 ending, then the levels in order). */
  scene: number;
  /** The car's speed in this scene, in mph (0 on foot). The page shows it. */
  speed: number;
  /** True when the scene is the second half of the level before it. */
  continues?: true;
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
    scene: 2,
    speed: 0,
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
    scene: 3,
    speed: 25,
    actor: 'THE CHEZ',
    mode: 'drive',
  },
  {
    name: 'Gwinn and the Tape',
    required: 1,
    goal: 'TAPE FOUND',
    mission: 'Gwinn has the stripe tape. Find her at a dead end, then reach the garage door.',
    help: 'Hold an arrow along the hedges. The tape roll is where Gwinn is sitting.',
    blurb: 'A hedge maze at dusk, a dog who thinks tape is a toy, and a very patient Teddy.',
    startX: 8,
    startY: 52,
    doorX: 8,
    doorY: 30,
    counter: 22,
    scene: 4,
    speed: 0,
    actor: 'Teddy',
    mode: 'walk',
  },
  {
    name: 'Trial 1: Uphill',
    required: 0,
    goal: 'SPEED',
    mission: 'Hold Right and keep going. THE CHEZ climbs the hill at 20 mph, one stripe richer.',
    help: 'Holding Right is safe. At the top the car changes gear by itself.',
    blurb: 'One charcoal stripe, a real hill, and a speedometer that drops to 20.',
    startX: 3,
    startY: 94,
    doorX: 35,
    doorY: 86,
    readout: '20 MPH',
    scene: 5,
    speed: 20,
    actor: 'THE CHEZ',
    mode: 'drive',
  },
  {
    name: 'Trial 1: Downhill',
    required: 0,
    goal: 'SPEED',
    mission: 'Over the crest. Hold Right: the road runs downhill and the needle reads 30.',
    help: 'Holding Right is safe. The finish is at the bottom of the hill.',
    blurb: 'The same hill the other way, at 30 mph. The stripes had nothing to do with it.',
    startX: 35,
    startY: 86,
    doorX: 83,
    doorY: 94,
    readout: '30 MPH',
    scene: 6,
    speed: 30,
    continues: true,
    actor: 'THE CHEZ',
    mode: 'drive',
  },
];

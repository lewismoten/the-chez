// Level names, entrances, goals, and guidance shared by the page and verification.
export interface ChapterInfo {
  name: string;
  /** What the progress tile counts (the door's quota); 0 for a level with no counter. */
  required: number;
  goal: string;
  mission: string;
  help: string;
  /** The strip's line once everything is fetched, when the default (tape or both things) doesn't fit. */
  found?: string;
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
    name: 'Trial 1: Tricycle',
    required: 0,
    goal: 'SPEED',
    mission: 'Hold Right to race a kid on a tricycle to the corner. A hen in the road? Release Right, then tap Space to honk.',
    help: 'Hens stand in the road and hold the car back. A honk sends one flapping off. The tricycle never needs beating.',
    blurb: 'A kid on a tricycle, three hens with opinions, and a corner to reach first. Honking is allowed.',
    startX: 8,
    startY: 95,
    doorX: 90,
    doorY: 95,
    readout: '25 MPH',
    scene: 5,
    speed: 25,
    actor: 'THE CHEZ',
    mode: 'drive',
  },
  {
    name: 'Wind Tunnel',
    required: 1,
    goal: 'ROLL FOUND',
    mission: 'Step into a fan’s draft and it lifts Teddy up through the bench. Climb to the stripe roll, then reach the door.',
    help: 'Walk right into the draft. Hold Right and the fan carries Teddy onto the bench. The roll is on the top bench.',
    blurb: 'Doc Leo’s box fans blow up through the garage benches, and Teddy goes with them.',
    startX: 6,
    startY: 70,
    doorX: 56,
    doorY: 58,
    counter: 23,
    found: 'Roll found. Walk into the door.',
    scene: 6,
    speed: 0,
    actor: 'Teddy',
    mode: 'walk',
  },
  {
    name: 'Trial 2: Uphill',
    required: 0,
    goal: 'SPEED',
    mission: 'Hold Right and keep going. THE CHEZ climbs the hill at 20 mph, three stripes richer.',
    help: 'Holding Right is safe. At the top the car changes gear by itself.',
    blurb: 'Three stripes, a real hill, and a speedometer that drops to 20.',
    startX: 3,
    startY: 94,
    doorX: 35,
    doorY: 86,
    readout: '20 MPH',
    scene: 7,
    speed: 20,
    actor: 'THE CHEZ',
    mode: 'drive',
  },
  {
    name: 'Trial 2: Downhill',
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
    scene: 8,
    speed: 30,
    continues: true,
    actor: 'THE CHEZ',
    mode: 'drive',
  },
  {
    name: 'Trial 3: Mower',
    required: 0,
    goal: 'SPEED',
    mission: 'Hold Right to race the neighbor’s mower along the rainy park road. Puddles slow the car.',
    help: 'Holding Right is safe. A puddle only slows THE CHEZ; the mower keeps one pace and never blocks the road.',
    blurb: 'Rain, a park road, puddles, and a neighbor mowing under an umbrella. Everything is a little slower.',
    startX: 8,
    startY: 95,
    doorX: 90,
    doorY: 95,
    readout: '25 MPH',
    scene: 9,
    speed: 25,
    actor: 'THE CHEZ',
    mode: 'drive',
  },
  {
    name: 'Night Trial',
    required: 0,
    goal: 'SPEED',
    mission: 'Hold Right to drive home after dark. The lamps and the headlights show the road, and the garage is lit.',
    help: 'Holding Right is safe. Nothing is in the road; drive to the lit garage at the end of the street.',
    blurb: 'The same street at night, lit by lamps and windows, with one lit garage at the end of it.',
    startX: 8,
    startY: 95,
    doorX: 90,
    doorY: 95,
    readout: '25 MPH',
    scene: 10,
    speed: 25,
    actor: 'THE CHEZ',
    mode: 'drive',
  },
  {
    name: 'Thirty Downhill',
    required: 0,
    goal: 'SPEED',
    mission: 'Hold Right and race the parade float, a giant sneaker with waving clowns, all the way down the hill.',
    help: 'Holding Right is safe. The needle reads 30 the whole way down. The float keeps a steady pace you can pass.',
    blurb: 'The finale: a long downhill route, a float shaped like a giant shoe, and a needle that finally reads 30.',
    startX: 3,
    startY: 79,
    doorX: 93,
    doorY: 94,
    readout: '30 MPH',
    scene: 11,
    speed: 30,
    actor: 'THE CHEZ',
    mode: 'drive',
  },
];

// Chapter names, entrances, goals, and guidance shared by the page and verification.
export interface ChapterInfo {
  name: string;
  required: number;
  mission: string;
  help: string;
  blurb: string;
  startX: number;
  carX: number;
  errand?: 'leaf';
  actor?: 'Teddy' | 'Doc Leo' | 'Gwinn';
  mode?: 'drive' | 'maze';
}

export const CHAPTERS: readonly ChapterInfo[] = [
  {
    name: 'The Stripe Road',
    required: 10,
    mission: 'Hop the crates. Follow the stripes to Doc Leo and THE\u00a0CHEZ.',
    help: 'Check the sidewalk behind you. The wind left spare pieces.',
    blurb: 'Teddy follows his nose. Doc Leo contributes enthusiastic arithmetic.',
    startX: 10,
    carX: 77,
  },
  {
    name: 'Maple Street',
    required: 8,
    mission: 'Hop for flying stripe kites. Wind posts keep sending more.',
    help: 'Try a hop near a wind post. The wind sends spare kites.',
    blurb: 'The wind gives the stripes wings. Teddy supplies the hop.',
    startX: 8,
    carX: 83,
  },
  {
    name: 'Puddlewick Park',
    required: 8,
    mission: 'Ride the tall stream. Turn LEFT above the hedge for Gwinn’s leaf, then return RIGHT.',
    help: 'The left branch holds the leaf. The far-side stream lets you return if you missed it.',
    blurb: 'Gwinn’s leaf has booked an upstairs seat. Teddy rescues it from a very tall appointment.',
    startX: 8,
    carX: 84,
    errand: 'leaf',
  },
  {
    name: 'Downtown',
    required: 9,
    mission: 'Doc Leo’s turn! Hop the crates, ride the belt, and wait for GO.',
    help: 'Hop for raised pieces and wait for GO at the leaf crossing.',
    blurb: 'Teddy appoints Doc Leo Chief Leaf Supervisor. The rubber chicken demands a title too.',
    startX: 8,
    carX: 80,
    actor: 'Doc Leo',
  },
  {
    name: 'The Clown Club',
    required: 10,
    mission: 'Hop between stepping stones. Foam catches missed jumps; arrows lift you back.',
    help: 'The twelve course pieces are enough. Balloons offer optional bark bonuses.',
    blurb: 'Teddy asks nicely. Four balloon dogs consider him extremely well spoken.',
    startX: 8,
    carX: 78,
  },
  {
    name: 'Sky Laundry',
    required: 9,
    mission: 'Pause in upward streams, then hop the gaps in the cloud ledges. Watch for Z clouds.',
    help: 'Follow an upward stream to the stripes on the cloud ledges.',
    blurb: 'The wind offers a lift. The Z clouds offer a nap nobody ordered.',
    startX: 8,
    carX: 84,
  },
  {
    name: "Gwinn's Shortcut",
    required: 10,
    mission: 'Gwinn’s turn! Follow the pawprints. Arrows move; Space also walks down.',
    help: 'Check the side nooks for spare stripes. Pawprints lead to the car.',
    blurb: "Gwinn promises one more turn. Teddy brings eight turns' worth of patience.",
    startX: 8,
    carX: 84,
    mode: 'maze',
    actor: 'Gwinn',
  },
  {
    name: "Teddy's Victory Lap",
    required: 10,
    mission: 'Drive left toward HOME. Bounce over marked bumps and gather the flags.',
    help: 'Right backs up to flags you missed. Up bounces over bumps.',
    blurb: 'Doc Leo drives. Teddy navigates. Gwinn gives the clouds a farewell woof.',
    startX: 84,
    carX: 10,
    mode: 'drive',
  },
];

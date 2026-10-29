// Chapter names, entrances, goals, and guidance shared by the page and verification.
export interface ChapterInfo {
  name: string;
  required: number;
  mission: string;
  help: string;
  blurb: string;
  startX: number;
  carX: number;
  mode?: 'drive' | 'maze';
}

export const CHAPTERS: readonly ChapterInfo[] = [
  { name: 'The Stripe Road', required: 10,
    mission: 'Follow the sidewalk to Doc Leo and THE\u00a0CHEZ.',
    help: 'Check the sidewalk behind you. The wind left spare pieces.',
    blurb: 'Teddy follows his nose. Doc Leo contributes enthusiastic arithmetic.',
    startX: 10, carX: 77 },
  { name: 'Maple Street', required: 8,
    mission: 'Hop for flying stripe kites. Wind posts keep sending more.',
    help: 'Try a hop near a wind post. The wind sends spare kites.',
    blurb: 'The wind gives the stripes wings. Teddy supplies the hop.',
    startX: 8, carX: 83 },
  { name: 'Puddlewick Park', required: 8,
    mission: 'Hop for high pieces. The upward arrows give Teddy a lift.',
    help: 'Look above the sidewalk. Hops and air puffs help reach the high pieces.',
    blurb: 'The puddles have opinions. Teddy earns a splashy round of applause.',
    startX: 8, carX: 84 },
  { name: 'Downtown', required: 9,
    mission: 'Arrows give a push. WAIT stops for a leaf; GO lets Teddy through.',
    help: 'Hop for raised pieces and wait for GO at the leaf crossing.',
    blurb: 'One leaf has very important leaf business. Teddy learns to take turns.',
    startX: 8, carX: 80 },
  { name: 'The Clown Club', required: 10,
    mission: 'Find the course pieces. Barking asks balloons for bonus stripes.',
    help: 'Look for the remaining course pieces. Bark at balloons for extras.',
    blurb: 'Teddy asks nicely. Four balloon dogs consider him extremely well spoken.',
    startX: 8, carX: 78 },
  { name: 'Sky Laundry', required: 9,
    mission: 'Pause in upward streams, then walk onto cloud ledges. Watch for Z clouds.',
    help: 'Follow an upward stream to the stripes on the cloud ledges.',
    blurb: 'The wind offers a lift. The Z clouds offer a nap nobody ordered.',
    startX: 8, carX: 84 },
  { name: "Gwinn's Shortcut", required: 10,
    mission: 'Follow the pawprints. All four arrows move; Space also walks down.',
    help: 'Check the side nooks for spare stripes. Pawprints lead to the car.',
    blurb: "Gwinn promises one more turn. Teddy brings eight turns' worth of patience.",
    startX: 8, carX: 84, mode: 'maze' },
  { name: "Teddy's Victory Lap", required: 10,
    mission: 'Drive left toward HOME. Bounce over marked bumps and gather the flags.',
    help: 'Right backs up to flags you missed. Up bounces over bumps.',
    blurb: 'Doc Leo drives. Teddy navigates. Gwinn gives the clouds a farewell woof.',
    startX: 84, carX: 10, mode: 'drive' },
];

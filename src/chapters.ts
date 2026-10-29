// Chapter names, entrances, and goals shared by the page and browser verification.
export interface ChapterInfo {
  name: string;
  required: number;
  startX: number;
  carX: number;
  mode?: 'drive';
}

export const CHAPTERS: readonly ChapterInfo[] = [
  { name: 'The Stripe Road', required: 10, startX: 10, carX: 77 },
  { name: 'Maple Street', required: 8, startX: 8, carX: 83 },
  { name: 'Puddlewick Park', required: 8, startX: 8, carX: 84 },
  { name: 'Downtown', required: 9, startX: 8, carX: 80 },
  { name: 'The Clown Club', required: 10, startX: 8, carX: 78 },
  { name: 'Sky Laundry', required: 9, startX: 8, carX: 84 },
  { name: "Teddy's Victory Lap", required: 10, startX: 84, carX: 10, mode: 'drive' },
];

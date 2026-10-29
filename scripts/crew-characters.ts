// Playable crew adaptations of Lewis Moten's MIT cast art and native character data.
import { emptyBlock, serializeBlocks } from '../../GameMaker/web/src/formats/blocks.ts';
import { parseCharacter, serializeCharacter } from '../../GameMaker/web/src/formats/character.ts';
import { docLeo } from '../../GameMaker/games/teddy/src/sprites/people.ts';
import { GWINN } from '../../GameMaker/games/teddy/src/sprites/gwinn.ts';

export function walkingCharacter(read: (name: string) => Uint8Array) {
  const character = parseCharacter(read('teddy.chr')); character.meter[1] = 2;
  character.sequences[2].sound = 30;
  for (const i of [7,17]) {
    const s = character.sequences[i]; s.momentum = 1; s.norepeat = 1;
    s.frames[0].y = -12;
  }
  for (const i of [9,10,11,12,13,14,18,19]) character.sequences[i].key = 0;
  return character;
}

export function crewCharacters(read: (name: string) => Uint8Array, put: (name: string, data: Uint8Array) => void): void {
  const blocks = Array.from({ length: 50 }, (_, i) => emptyBlock(i, true));
  const stand = docLeo(), wave = docLeo(undefined, true), step = stand.crop(0, 0, 20, 40);
  step.rect(0, 32, 20, 8, 255);
  for (let y = 32; y < 40; y++) for (let x = 0; x < 20; x++) {
    const color = stand.get(x, y); if (color !== 255) step.set(x + (x < 10 ? -1 : 1), y, color);
  }
  for (const [pose, p] of [stand, step, wave].entries()) {
    blocks[pose * 2].pixels.set(p.crop(0, 0, 20, 20).px);
    blocks[pose * 2 + 1].pixels.set(p.crop(0, 20, 20, 20).px);
  }
  const character = walkingCharacter(read);
  for (const [i, sequence] of character.sequences.entries()) {
    if (i === 2) sequence.sound = 30;
    if (i >= 9 && i <= 14 || i >= 18) { sequence.key = 0; continue; }
    const squeak = (sequence.key >> 8) === 57;
    if (squeak) sequence.sound = 21;
    for (const [index, frame] of sequence.frames.entries()) {
      if (frame.pic2 >= 50 && frame.pic2 !== 100) continue;
      if (frame.pic2 === 100) { frame.x = 0; frame.y = 0; }
      const pose = squeak || frame.pic2 === 100 ? 4 : index % 2 ? 2 : 0;
      frame.pic1 = pose; frame.pic2 = pose + 1;
      if (frame.orient === 64) frame.orient = 68;
    }
  }
  put('docleo.chr', serializeCharacter(character)); put('docleo.cbl', serializeBlocks(blocks));
  const dog = Array.from({ length: 50 }, (_, i) => emptyBlock(i, true));
  for (const [index, name] of ['gwinn1', 'gwinn2', 'gwinn3'].entries()) dog[index].pixels.set(GWINN[name].px);
  put('gwinn.cbl', serializeBlocks(dog));
}

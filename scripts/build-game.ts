// Build Teddy's five-chapter DOS Game-Maker stripe chase from source art and format helpers.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseBlocks, serializeBlocks } from '../../GameMaker/web/src/formats/blocks.ts';
import { ADVTYPE, emptyScene, newGame, serializeGame } from '../../GameMaker/web/src/formats/game.ts';
import { parseMap, reindexMonsters, serializeMap } from '../../GameMaker/web/src/formats/map.ts';
import { parseMonsters } from '../../GameMaker/web/src/formats/monster.ts';
import { matchColor, parsePalette } from '../../GameMaker/web/src/formats/palette.ts';
import { encodeGif } from '../../GameMaker/web/src/formats/gif.ts';
import { serializeSlideList } from '../../GameMaker/web/src/formats/graphicScripts.ts';
import { parseSoundSet, serializeSoundSet } from '../../GameMaker/web/src/formats/sound.ts';
import { chezPicture } from '../../GameMaker/games/kit/chez.ts';
import { Pixels } from '../../GameMaker/games/kit/pixels.ts';
import { centered } from '../../GameMaker/games/kit/pcText.ts';
import { SPEAKER, mix, osc, sample } from '../../GameMaker/games/kit/sound.ts';
import { chapterSong, openingSong, winningSong } from './music.ts';
import { driveCartoon, openingCartoon, winningCartoon } from './cartoons.ts';
import { buildChapter, CHAPTERS } from './chapters.ts';

const here = fileURLToPath(new URL('..', import.meta.url));
const source = join(here, '../GameMaker/games/teddy/disk');
const output = join(here, 'public/game');
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
const bytes = (name: string) => new Uint8Array(readFileSync(join(source, name)));
const put = (name: string, data: Uint8Array) => writeFileSync(join(output, name), data);

// Reuse Teddy's character, sounds, and morning palette. Draw new stripe pieces into the
// ticket monster's two animation frames, so each piece increments counter 21 on touch.
const pal = parsePalette(bytes('backyard.pal'));
const bbl = parseBlocks(bytes('backyard.bbl'), 150);
const mbl = parseBlocks(bytes('backyard.mbl'), 100);
const monsters = parseMonsters(bytes('backyard.mon'));
const ticket = monsters[12];
const black = matchColor(pal, 9, 12, 15);
const red = matchColor(pal, 52, 12, 9);
const white = matchColor(pal, 62, 61, 57);
for (const index of [ticket.pic[0][0], ticket.pic[1][0]]) {
  const block = mbl[index];
  block.pixels.fill(255);
  for (let y = 6; y <= 13; y++) for (let x = 2; x <= 17; x++) {
    const dx = x - 2;
    const edge = y === 6 || y === 13 || x === 2 || x === 17;
    block.pixels[y * 20 + x] = edge ? white : dx < 5 || dx > 10 ? black : red;
  }
}

// A level road leads from Teddy's house to Doc Leo and THE CHEZ. A few spare pieces
// allow a missed pickup; the car door opens only after ten have been collected.
const map = parseMap(bytes('backyard.map'));
const sky = map.blocks[39 * 100 + 6];
const upperSky = map.blocks[38 * 100 + 6];
const hedgeSky = map.blocks[37 * 100 + 6];
const grass = map.blocks[40 * 100 + 11];
const dirt = map.blocks[41 * 100 + 11];
for (let x = 10; x <= 74; x++) {
  map.blocks[37 * 100 + x] = hedgeSky;
  map.blocks[38 * 100 + x] = upperSky;
  map.blocks[39 * 100 + x] = sky;
  map.blocks[40 * 100 + x] = grass;
  map.blocks[41 * 100 + x] = dirt;
}
for (let x = 10; x <= 74; x++) for (let y = 25; y < 37; y++) {
  const at = y * 100 + x;
  const block = bbl[map.blocks[at]];
  if (block.effect || block.obj || block.scorePts || block.chHitPt) map.blocks[at] = map.blocks[y * 100 + 6];
}
for (const placed of map.monsters) placed.monnum = 64;
const spots = [11, 16, 21, 26, 31, 36, 41, 46, 51, 56, 61, 66, 71];
reindexMonsters(map);

// Gwinn waits near the car to meet Teddy at the end of the stripe trail.
const gwinnBlock = Array.from({ length: 149 }, (_, i) => 148 - i).find((i) => !map.blocks.includes(i));
if (gwinnBlock === undefined) throw new Error('No background block slot for Gwinn');
bbl[gwinnBlock] = { ...bbl[sky], pixels: bbl[sky].pixels.slice(), nextBl: gwinnBlock, touchBl: gwinnBlock };
const gwinnPixels = mbl[monsters[10].pic[0][0]].pixels;
for (let i = 0; i < 400; i++) if (gwinnPixels[i] !== 255) bbl[gwinnBlock].pixels[i] = gwinnPixels[i];
map.blocks[39 * 100 + 73] = gwinnBlock;

// The car uses the source project's measured CitiCar drawing. Preserve the existing
// door's touch behavior, but require all ten stripe pieces before it opens.
const doorIndex = map.blocks[39 * 100 + 77];
const backIndex = map.blocks[39 * 100 + 78];
const openIndex = Array.from({ length: 149 }, (_, i) => 148 - i).find((i) => i !== gwinnBlock && !map.blocks.includes(i));
if (openIndex === undefined) throw new Error('No background block slot for the open car door');
const pieceIndex = Array.from({ length: 149 }, (_, i) => 148 - i).find((i) => i !== gwinnBlock && i !== openIndex && !map.blocks.includes(i));
if (pieceIndex === undefined) throw new Error('No background block slot for stripe pieces');
const pieceBase = map.blocks[39 * 100 + 12];
bbl[pieceIndex] = { ...bbl[pieceBase], pixels: bbl[pieceBase].pixels.slice(), effect: 21, eamt: 1, scorePts: 25, nextBl: pieceIndex, touchBl: pieceBase };
for (let y = 6; y <= 13; y++) for (let x = 2; x <= 17; x++) {
  const dx = x - 2;
  bbl[pieceIndex].pixels[y * 20 + x] = y === 6 || y === 13 || x === 2 || x === 17 ? white : dx < 5 || dx > 10 ? black : red;
}
for (const x of spots) map.blocks[39 * 100 + x] = pieceIndex;
const ink = { body: [red, red, red] as [number, number, number], trim: black, glass: [black, white] as [number, number], roof: black, tire: black, hub: white, bumper: black, lamp: white, tail: red, pin: white, rim: white };
const car = chezPicture(ink, 'right');
for (let half = 0; half < 2; half++) {
  const block = bbl[half ? backIndex : doorIndex];
  block.pixels.set(bbl[sky].pixels);
  for (let y = 0; y < 20; y++) for (let x = 0; x < 20; x++) {
    const c = car.px[y * 40 + x + half * 20];
    if (c !== 255) block.pixels[y * 20 + x] = c;
  }
}
bbl[doorIndex].effect = 21;
bbl[doorIndex].eamt = -10;
bbl[doorIndex].solid = 15;
bbl[doorIndex].touchBl = openIndex;
bbl[openIndex] = { ...bbl[doorIndex], pixels: bbl[doorIndex].pixels.slice(), solid: 0, effect: 0, eamt: 0, nextBl: openIndex, touchBl: openIndex };
for (let y = 7; y < 16; y++) for (let x = 6; x < 13; x++) bbl[openIndex].pixels[y * 20 + x] = black;

// Draw a dedicated title and finish screen in the DOS picture format.
function screen(name: string, headline: string, line: string, scenePal = pal, sceneInk = ink, beat = '') {
  const navy = matchColor(scenePal, 4, 13, 19);
  const cream = matchColor(scenePal, 61, 56, 43);
  const gold = matchColor(scenePal, 63, 46, 21);
  const dark = matchColor(scenePal, 9, 12, 15);
  const p = new Pixels(320, 200, navy);
  p.rect(0, 151, 320, 49, dark);
  p.rect(0, 154, 320, 3, gold);
  p.blit(chezPicture(sceneInk, 'right', 3), 100, 84, 255);
  centered(p, 20, headline, cream, 2);
  if (beat) centered(p, 58, beat, cream, 1);
  centered(p, 177, line, gold, 1);
  put(name, encodeGif({ width: 320, height: 200, pixels: p.px, palette: scenePal }));
}
screen('menu.gif', "TEDDY'S STRIPE CHASE", 'A VERY SMALL CAR. A HUGE QUEST.');
screen('won.gif', 'TEDDY DID IT!', 'THE CHEZ IS 900% MORE DASHING');
screen('epilogue.gif', 'THE WHOLE CREW WON', 'TEAMWORK MAKES EVERY ROAD FUN', pal, ink, 'TEDDY FOUND THE WAY HOME.');
screen('lost.gif', 'ONE MORE TRY?', 'TEDDY BELIEVES IN YOU');
put('intro.fli', openingCartoon(pal, ink));
put('drive.fli', driveCartoon(pal, ink, 'MAPLE STREET'));
put('win.fli', winningCartoon(pal, ink));
put('won.lst', serializeSlideList([{ name: 'win.fli', pause: 0 }, { name: 'epilogue.gif', pause: 4 }, { name: 'won.gif', pause: 0 }]));
put('intro.cmf', openingSong());
put('yard.cmf', chapterSong(0));
put('win.cmf', winningSong());

// The stripe's bright two-note chirp and the door's little electric click are new sounds.
const snd = parseSoundSet(bytes('teddy.snd'));
snd.freqs[7] = SPEAKER.arpeggio([784, 1175, 1568]);
snd.digital[7] = 'stripe';
snd.freqs[8] = SPEAKER.fall(660, 240);
snd.digital[8] = 'gate';
put('stripe.snd', serializeSoundSet(snd));
put('stripe.voc', sample(0.22, mix([osc.sine(784), 0.42], [osc.sine((t) => 1175 + t * 1500), 0.35])));
copyFileSync(join(here, 'assets/gwinn-door.voc'), join(output, 'gate.voc'));

put('stripe.pal', pal);
put('stripe.bbl', serializeBlocks(bbl));
put('stripe.mbl', serializeBlocks(mbl));
put('stripe.mon', bytes('backyard.mon'));
put('stripe.map', serializeMap(map));
for (const name of ['teddy.chr', 'teddy.cbl']) copyFileSync(join(source, name), join(output, name));
for (const name of ['blip.voc', 'boing.voc', 'chomp.voc', 'crunch.voc', 'dig.voc', 'flop.voc', 'giggle.voc', 'honk.voc', 'rumble.voc', 'scratch.voc', 'sniff.voc', 'snore.voc', 'splash.voc', 'woof.voc', 'yelp.voc', 'yum.voc']) {
  try { copyFileSync(join(source, name), join(output, name)); } catch { /* Optional sound. */ }
}
copyFileSync(join(here, 'assets/teddy-bark.voc'), join(output, 'woof.voc'));
const text = (name: string, lines: string[]) => put(name, new TextEncoder().encode(lines.join('\r\n') + '\r\n'));
text('help.txt', ["TEDDY'S STRIPE CHASE", '', 'LEFT/RIGHT or A/D: walk', 'UP or W: hop', 'SPACE: bark', '', 'Find the stripe pieces.', 'The car door opens when', 'Teddy has enough for it.', '', 'High pieces need a hop.', 'At the Clown Club, bark at', 'balloon dogs for more.', '', 'Teddy scouts. Gwinn cheers.', 'Doc Leo drives.']);
text('story.txt', ["TEDDY'S STRIPE CHASE", '', 'THE CHEZ lost its stripes.', 'Doc Leo says new ones will', 'make it go 900% faster.', 'The wind says: prove it.', '', 'Teddy volunteers his nose.', 'Gwinn volunteers to bark', 'at anything suspicious.', '', 'Five roads. Many stripes.', 'One corgi-sized hero.', '', 'A team goes farther than', 'one very speedy nose.']);
text('credits.txt', ["TEDDY'S STRIPE CHASE", '', 'For Lewis Moten, Teddy,', 'Gwinn, Doc Leo and THE CHEZ.', '', 'Engine, source art, car:', 'Game-Maker Sandbox Edition', 'by Lewis Moten (MIT)', '', 'Dog barks: Lewis Moten', 'Game, text, music, sounds:', 'OpenAI Codex (GPT-6)']);

const game = newGame('STRIPE CHASE');
const [title, end] = game.scenes;
title.files[0] = 'intro.fli'; title.files[1] = 'intro.cmf'; title.files[2] = 'menu.gif'; title.files[3] = 'intro.cmf'; title.files[6] = 'help.txt'; title.files[4] = 'story.txt'; title.files[7] = 'credits.txt';
end.files[0] = 'won.lst'; end.files[1] = 'win.cmf'; end.files[2] = 'lost.gif';
const level = emptyScene(ADVTYPE);
level.desc = 'The Stripe Road';
level.pos = { x: 140, y: 110 };
level.files = ['stripe.pal', 'stripe.map', 'stripe.bbl', 'stripe.mon', 'stripe.mbl', 'teddy.chr', 'teddy.cbl', 'stripe.snd', 'yard.cmf', '', 'drive.fli', ...new Array(9).fill('')];
level.links[0] = { toScene: 3, from: { x: 77, y: 39 }, to: { x: CHAPTERS[0].startX, y: 39 } };
level.links[1] = { ...level.links[0], from: { x: 78, y: 39 } };
title.links[0] = { toScene: 2, from: { x: 0, y: 0 }, to: { x: 10, y: 39 } };
game.scenes.push(level);
CHAPTERS.forEach((chapter, index) => {
  const { palette, ink: chapterInk } = buildChapter(chapter, bytes, put);
  const card = `card${index + 2}.gif`;
  const list = `card${index + 2}.lst`;
  screen(card, chapter.name.toUpperCase(), chapter.quip, palette, chapterInk, chapter.beat);
  put(list, serializeSlideList([{ name: card, pause: 2 }]));
  put(`${chapter.stem}.cmf`, chapterSong(index + 1));
  const next = CHAPTERS[index + 1];
  const drive = next ? `drive${index + 2}.fli` : '';
  if (next) put(drive, driveCartoon(palette, chapterInk, next.name.toUpperCase()));
  const scene = emptyScene(ADVTYPE);
  scene.desc = chapter.name;
  scene.pos = { x: 190 + index * 50, y: 110 };
  scene.files = [`${chapter.stem}.pal`, `${chapter.stem}.map`, `${chapter.stem}.bbl`, `${chapter.stem}.mon`, `${chapter.stem}.mbl`, 'teddy.chr', 'teddy.cbl', 'stripe.snd', `${chapter.stem}.cmf`, list, drive, ...new Array(9).fill('')];
  scene.links[0] = { toScene: next ? index + 4 : 1, from: { x: chapter.carX, y: 39 }, to: next ? { x: next.startX, y: 39 } : { x: 0, y: 0 } };
  scene.links[1] = { ...scene.links[0], from: { x: chapter.carX + 1, y: 39 } };
  game.scenes.push(scene);
});
put('stripe.gam', serializeGame(game));
writeFileSync(join(output, 'manifest.json'), JSON.stringify(readdirSync(output).filter((name) => name !== 'manifest.json').sort()));
console.log(`Built ${output}`);

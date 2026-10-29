// Build Teddy's eight-chapter DOS Game-Maker stripe chase from source art and format helpers.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ADVTYPE, emptyScene, newGame, serializeGame } from '../../GameMaker/web/src/formats/game.ts';
import { matchColor } from '../../GameMaker/web/src/formats/palette.ts';
import { encodeGif } from '../../GameMaker/web/src/formats/gif.ts';
import { serializeSlideList } from '../../GameMaker/web/src/formats/graphicScripts.ts';
import { parseSoundSet, serializeSoundSet } from '../../GameMaker/web/src/formats/sound.ts';
import { parseCharacter, serializeCharacter } from '../../GameMaker/web/src/formats/character.ts';
import { stripeCar } from './stripe-car.ts';
import { clubArt, centered as clubCentered } from '../../GameMaker/games/teddy/src/art/draw.ts';
import { Pixels } from '../../GameMaker/games/kit/pixels.ts';
import { centered } from '../../GameMaker/games/kit/pcText.ts';
import { SPEAKER, mix, osc, sample } from '../../GameMaker/games/kit/sound.ts';
import { chapterSong, openingSong, retrySong, winningSong } from './music.ts';
import { driveCartoon, losingCartoon, openingCartoon, winningCartoon } from './cartoons.ts';
import { buildChapter, CHAPTERS } from './chapters.ts';

const here = fileURLToPath(new URL('..', import.meta.url));
const source = join(here, '../GameMaker/games/teddy/disk');
const output = join(here, 'public/game');
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
const bytes = (name: string) => new Uint8Array(readFileSync(join(source, name)));
const put = (name: string, data: Uint8Array) => writeFileSync(join(output, name), data);

// The tutorial is an original course, built by the same native pipeline as the later roads.
const { palette: pal, ink } = buildChapter({ source: 'backyard', stem: 'stripe', name: 'The Stripe Road', carX: 77, startX: 10, required: 10, counter: 21, sampleX: 6, quip: '', beat: '', pieces: [11,16,21,26,31,36,41,46,51,56,61,66,71].map(x => ({ x, y: 39 })) }, bytes, put);

// Draw a dedicated title and finish screen in the DOS picture format.
function screen(name: string, headline: string, line: string, scenePal = pal, sceneInk = ink, beat = '', restored = 0) {
  const navy = matchColor(scenePal, 4, 13, 19);
  const cream = matchColor(scenePal, 61, 56, 43);
  const gold = matchColor(scenePal, 63, 46, 21);
  const dark = matchColor(scenePal, 9, 12, 15);
  const p = new Pixels(320, 200, navy);
  p.rect(0, 151, 320, 49, dark);
  p.rect(0, 154, 320, 3, gold);
  p.blit(stripeCar(sceneInk, restored, 'right', 3), 100, 84, 255);
  clubCentered(p, 20, clubArt(headline), cream, 2);
  if (beat) centered(p, 58, beat, cream, 1);
  centered(p, 177, line, gold, 1);
  put(name, encodeGif({ width: 320, height: 200, pixels: p.px, palette: scenePal }));
}
screen('menu.gif', "TEDDY'S STRIPE CHASE", 'A VERY SMALL CAR. A HUGE QUEST.');
screen('won.gif', 'TEDDY DID IT!', 'THE CHEZ IS 900% MORE DASHING', pal, ink, '', 1);
screen('epilogue.gif', 'THE WHOLE CREW WON', 'TEAMWORK MAKES EVERY ROAD FUN', pal, ink, 'TEDDY FOUND THE WAY HOME.', 1);
screen('lost.gif', 'ONE MORE TRY?', 'TEDDY BELIEVES IN YOU');
put('intro.fli', openingCartoon(pal, ink));
put('drive.fli', driveCartoon(pal, ink, 'MAPLE STREET', 1));
put('win.fli', winningCartoon(pal, ink));
put('lost.fli', losingCartoon(pal, ink));
put('won.lst', serializeSlideList([{ name: 'win.fli', pause: 0 }, { name: 'epilogue.gif', pause: 4 }, { name: 'won.gif', pause: 0 }]));
put('lost.lst', serializeSlideList([{ name: 'lost.fli', pause: 0 }, { name: 'lost.gif', pause: 0 }]));
put('intro.cmf', openingSong());
put('yard.cmf', chapterSong(0));
put('win.cmf', winningSong());
put('retry.cmf', retrySong());

// The stripe's bright two-note chirp and the door's little electric click are new sounds.
const snd = parseSoundSet(bytes('teddy.snd'));
snd.freqs[7] = SPEAKER.arpeggio([784, 1175, 1568]);
snd.digital[7] = 'stripe';
snd.freqs[8] = SPEAKER.fall(660, 240);
snd.digital[8] = 'gate';
snd.freqs[18] = SPEAKER.arpeggio([392, 330, 262]);
snd.digital[18] = 'yawn';
snd.freqs[20] = SPEAKER.arpeggio([440, 660, 880]);
snd.digital[20] = 'meep';
put('stripe.snd', serializeSoundSet(snd));
put('stripe.voc', sample(0.22, mix([osc.sine(784), 0.42], [osc.sine((t) => 1175 + t * 1500), 0.35])));
put('meep.voc', sample(0.3, mix([osc.sine((t) => t < 0.14 ? 440 : 660), 0.5], [osc.square((t) => t < 0.14 ? 880 : 1320), 0.16])));
copyFileSync(join(here, 'assets/gwinn-door.voc'), join(output, 'gate.voc'));
copyFileSync(join(here, 'assets/teddy-yawn.voc'), join(output, 'yawn.voc'));

const teddy = parseCharacter(bytes('teddy.chr'));
// PLAYGAME stores extra lives: two extras plus the current attempt gives three tries.
teddy.meter[1] = 2;
teddy.sequences[2].sound = 30;
put('teddy.chr', serializeCharacter(teddy));
copyFileSync(join(source, 'teddy.cbl'), join(output, 'teddy.cbl'));
for (const name of ['blip.voc', 'boing.voc', 'chomp.voc', 'crunch.voc', 'dig.voc', 'flop.voc', 'giggle.voc', 'honk.voc', 'rumble.voc', 'scratch.voc', 'sniff.voc', 'snore.voc', 'splash.voc', 'woof.voc', 'yelp.voc', 'yum.voc']) {
  try { copyFileSync(join(source, name), join(output, name)); } catch { /* Optional sound. */ }
}
copyFileSync(join(here, 'assets/teddy-bark.voc'), join(output, 'woof.voc'));
copyFileSync(join(here, 'assets/teddy-tour.rec'), join(output, 'tour.rec'));
const text = (name: string, lines: string[]) => put(name, new TextEncoder().encode(lines.join('\r\n') + '\r\n'));
text('help.txt', ["TEDDY'S STRIPE CHASE", '', 'LEFT/RIGHT or A/D: walk', 'UP/W: hop. Maze: move UP.', 'SPACE: bark. Maze: DOWN.', 'Maze: all four arrows move.', 'Find stripes. Reach THE CHEZ.', 'Maple Street: hop for kites.', 'Club: bark for bonus stripes.', 'Downtown: WAIT, then GO.', 'Sky Laundry: pause in wind,', 'then walk onto cloud ledges.', 'Z clouds make Teddy nap.', 'Three tries. F5 saves a game.', 'Victory Lap: LEFT drives home.', 'UP bounces. SPACE honks.']);
text('story.txt', ["TEDDY'S STRIPE CHASE", '', 'THE CHEZ lost its stripes.', 'Doc Leo says new ones will', 'make it go 900% faster.', 'The wind says: prove it.', '', 'Teddy volunteers his nose.', 'Gwinn volunteers to bark', 'at anything suspicious.', '', 'Eight roads. Many stripes.', 'One corgi-sized hero.', '', 'A team goes farther than', 'one very speedy nose.']);
text('credits.txt', ["TEDDY'S STRIPE CHASE", '', 'For Lewis Moten, Teddy,', 'Gwinn, Doc Leo and THE CHEZ.', '', 'Engine, source art, car:', 'Game-Maker Sandbox Edition', 'by Lewis Moten (MIT)', '', 'Dog barks/yawn: Lewis Moten', 'Game, art, text, music,', 'and sounds:', 'OpenAI Codex (GPT-6/6.1)']);

const game = newGame('STRIPE CHASE');
const [title, end] = game.scenes;
title.files[0] = 'intro.fli'; title.files[1] = 'intro.cmf'; title.files[2] = 'menu.gif'; title.files[3] = 'intro.cmf'; title.files[6] = 'help.txt'; title.files[4] = 'story.txt'; title.files[7] = 'credits.txt';
end.files[0] = 'won.lst'; end.files[1] = 'win.cmf'; end.files[2] = 'lost.lst'; end.files[3] = 'retry.cmf';
const level = emptyScene(ADVTYPE);
level.desc = 'The Stripe Road';
level.pos = { x: 140, y: 110 };
level.files = ['stripe.pal', 'stripe.map', 'stripe.bbl', 'stripe.mon', 'stripe.mbl', 'teddy.chr', 'teddy.cbl', 'stripe.snd', 'yard.cmf', '', 'drive.fli', ...new Array(9).fill('')];
level.links[0] = { toScene: 3, from: { x: 77, y: 39 }, to: { x: CHAPTERS[0].startX, y: 39 } };
title.links[0] = { toScene: 2, from: { x: 0, y: 0 }, to: { x: 10, y: 39 } };
game.scenes.push(level);
CHAPTERS.forEach((chapter, index) => {
  const { palette, ink: chapterInk } = buildChapter(chapter, bytes, put);
  const card = `card${index + 2}.gif`;
  const list = `card${index + 2}.lst`;
  screen(card, chapter.name.toUpperCase(), chapter.quip, palette, chapterInk, chapter.beat, chapter.stem === 'lap' ? 1 : 0);
  put(list, serializeSlideList([{ name: card, pause: ['sky', 'maze', 'lap'].includes(chapter.stem) ? 4 : 2 }]));
  put(`${chapter.stem}.cmf`, chapterSong(index + 1));
  const next = CHAPTERS[index + 1];
  const drive = next ? `drive${index + 2}.fli` : '';
  if (next) put(drive, driveCartoon(palette, chapterInk, next.name.toUpperCase(), index + 2));
  const scene = emptyScene(ADVTYPE);
  scene.desc = chapter.name;
  scene.pos = { x: 190 + index * 50, y: 110 };
  scene.files = [`${chapter.stem}.pal`, `${chapter.stem}.map`, `${chapter.stem}.bbl`, `${chapter.stem}.mon`, `${chapter.stem}.mbl`, chapter.stem === 'lap' ? 'lap.chr' : chapter.stem === 'maze' ? 'maze.chr' : 'teddy.chr', chapter.stem === 'lap' ? 'lap.cbl' : 'teddy.cbl', 'stripe.snd', `${chapter.stem}.cmf`, list, drive, ...new Array(9).fill('')];
  scene.links[0] = { toScene: next ? index + 4 : 1, from: { x: chapter.carX, y: 39 }, to: next ? { x: next.startX, y: 39 } : { x: 0, y: 0 } };
  game.scenes.push(scene);
});
put('stripe.gam', serializeGame(game));
writeFileSync(join(output, 'manifest.json'), JSON.stringify(readdirSync(output).filter((name) => name !== 'manifest.json').sort()));
console.log(`Built ${output}`);

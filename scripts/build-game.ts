// Build The Stripe Hypothesis, a DOS Game-Maker game, from source art and the tools' format helpers.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ADVTYPE, emptyScene, newGame, serializeGame } from '@lewismoten/gamemaker-sandbox-tools/formats/game';
import { serializeSlideList } from '@lewismoten/gamemaker-sandbox-tools/formats/graphicScripts';
import { parseSoundSet, serializeSoundSet } from '@lewismoten/gamemaker-sandbox-tools/formats/sound';
import { SPEAKER, mix, osc, sample } from '@lewismoten/gamemaker-sandbox-tools/audio';
import { chapterSong, openingSong, retrySong, winningSong } from './music.ts';
import { card, garageCartoon, introCartoon, resultsCard, resultsCartoon, TITLE, TITLE_CARD } from './hypo-cards.ts';
import { addStripeCartoon, stripeCartoon } from './hypo-stripes.ts';
import { drivewayFiles, DRIVEWAY } from './hypo-driveway.ts';
import { streetFiles, STREET } from './hypo-street.ts';
import { hillFiles } from './hypo-hill.ts';
import { TAPE, tapeFiles } from './hypo-tape.ts';
import { CHAPTERS } from '../src/chapters.ts';

const here = fileURLToPath(new URL('..', import.meta.url));
const source = join(here, 'assets/source/teddy/disk');
const output = join(here, 'public/game');
rmSync(output, { recursive: true, force: true });
mkdirSync(output, { recursive: true });
const bytes = (name: string) => new Uint8Array(readFileSync(join(source, name)));
const put = (name: string, data: Uint8Array) => writeFileSync(join(output, name), data);
const text = (name: string, lines: string[]) => put(name, new TextEncoder().encode(lines.join('\r\n') + '\r\n'));

drivewayFiles(put);
streetFiles(put);
hillFiles(put);
tapeFiles(put);

// Cards: the title, one per level, the results card and the retry card.
put('menu.gif', card(TITLE_CARD, ['DOC LEO, PHD', 'TEDDY, FRONT SEAT'], 'A SCIENCE ADVENTURE', 3, 12));
put('card1.gif', card('THE HYPOTHESIS', ['FETCH THE CLIPBOARD', 'AND THE STOPWATCH.'], 'ARROWS WALK. SPACE BARKS.', 0, 56));
put('card2.gif', card('CONTROL RUN', ['NO STRIPES. 25 MPH.', 'WAIT FOR THE TURTLE.'], 'HOLD RIGHT TO DRIVE.', 0, 0));
put('card3.gif', card('GWINN AND\nTHE TAPE', ['GWINN HAS THE TAPE.', 'SHE IS NOT SORRY.'], 'ARROWS WALK THE MAZE.', 0, 40));
put('card4.gif', card('UPHILL TRIAL', ['ONE STRIPE. 20 MPH.', 'IT IS A REAL HILL.'], 'HOLD RIGHT TO DRIVE.', 1, 26));
put('card5.gif', card('OVER THE CREST', ['THE NEEDLE SAYS 30.', 'THE ROAD SAYS DOWNHILL.'], 'HOLD RIGHT TO DRIVE.', 1, 52));
put('card1.lst', serializeSlideList([{ name: 'card1.gif', pause: 3 }]));
put('card2.lst', serializeSlideList([{ name: 'card2.gif', pause: 3 }]));
put('card3.lst', serializeSlideList([{ name: 'card3.gif', pause: 3 }]));
put('card4.lst', serializeSlideList([{ name: 'card4.gif', pause: 3 }]));
put('card5.lst', serializeSlideList([{ name: 'card5.gif', pause: 3 }]));
put('results.gif', resultsCard(30, 'IT WAS A HILL.', 1));
put('lost.gif', card('ONE MORE TRY?', ['SCIENCE NEVER GIVES UP.'], 'TEDDY BELIEVES IN YOU', 0, 72));
put('intro.fli', introCartoon());
put('garage.fli', garageCartoon());
put('results.fli', resultsCartoon());
put('stripe.fli', stripeCartoon(0));
put('hill.fli', resultsCartoon(30, 'IT WAS A HILL.', 1, (reel) => addStripeCartoon(reel, 1)));
put('lost.lst', serializeSlideList([{ name: 'lost.gif', pause: 0 }]));
put('won.lst', serializeSlideList([{ name: 'results.gif', pause: 0 }]));
put('intro.cmf', openingSong());
put('yard.cmf', chapterSong(0));
put('street.cmf', chapterSong(1));
put('tape.cmf', chapterSong(4));
put('hill.cmf', chapterSong(2));
put('win.cmf', winningSong());
put('retry.cmf', retrySong());

// Sounds: Teddy's real bark, a pickup chirp, the garage door and the horn.
const snd = parseSoundSet(bytes('teddy.snd'));
snd.freqs[7] = SPEAKER.arpeggio([784, 1175, 1568]);
snd.digital[7] = 'ping';
snd.freqs[8] = SPEAKER.fall(660, 240);
snd.digital[8] = 'gate';
snd.freqs[20] = SPEAKER.arpeggio([440, 660, 880]);
snd.digital[20] = 'meep';
put('hypo.snd', serializeSoundSet(snd));
put('ping.voc', sample(0.22, mix([osc.sine(784), 0.42], [osc.sine((t) => 1175 + t * 1500), 0.35])));
put('meep.voc', sample(0.3, mix([osc.sine((t) => (t < 0.14 ? 440 : 660)), 0.5], [osc.square((t) => (t < 0.14 ? 880 : 1320)), 0.16])));
copyFileSync(join(here, 'assets/gwinn-door.voc'), join(output, 'gate.voc'));
copyFileSync(join(here, 'assets/teddy-bark.voc'), join(output, 'woof.voc'));
copyFileSync(join(here, 'assets/teddy-tour.rec'), join(output, 'tour.rec'));

text('help.txt', [
  TITLE,
  'Arrows: walk or drive.',
  'A and D also work.',
  'SPACE: bark, or honk.',
  'Yard: fetch two things,',
  'then the garage opens.',
  'Street: hold RIGHT.',
  'Stop when the sign says',
  'WAIT. Go when it says GO.',
  'Hill: hold RIGHT. The car',
  'changes speed at the top.',
  'F5/F6: save and load.',
]);
text('story.txt', [
  TITLE,
  '',
  'Doc Leo, PhD, says racing',
  'stripes make THE CHEZ go',
  'faster. The experiment',
  'starts with a clipboard.',
  '',
  'Teddy rides up front,',
  'taking notes. Gwinn',
  'is not taking notes.',
]);
text('credits.txt', [
  TITLE,
  '',
  'For Lewis Moten, Teddy,',
  'Gwinn, Doc Leo, THE CHEZ.',
  '',
  'Engine, source art, car:',
  'Game-Maker Sandbox Edition',
  'by Lewis Moten (MIT)',
  '',
  'Dog barks: Lewis Moten',
  'Code, art, text, levels:',
  'Claude Sonnet 5.5',
  'Music themes (OPL2):',
  'OpenAI Codex (GPT-6/6.1)',
]);

const game = newGame('STRIPE HYPOTHESIS');
const [title, end] = game.scenes;
title.files[0] = 'intro.fli';
title.files[1] = 'intro.cmf';
title.files[2] = 'menu.gif';
title.files[3] = 'intro.cmf';
title.files[6] = 'help.txt';
title.files[4] = 'story.txt';
title.files[7] = 'credits.txt';
end.files[0] = 'won.lst';
end.files[1] = 'win.cmf';
end.files[2] = 'lost.lst';
end.files[3] = 'retry.cmf';
const stems = ['yard', 'street', 'tape', 'hill', 'hill'];
const actors: [string, string][] = [
  ['teddy.chr', 'teddy.cbl'],
  ['car25.chr', 'car.cbl'],
  ['teddy.chr', 'teddy.cbl'],
  ['car20.chr', 'car.cbl'],
  ['car30.chr', 'car.cbl'],
];
const exits = ['garage.fli', 'results.fli', 'stripe.fli', '', 'hill.fli'];
const doors = [
  { x: DRIVEWAY.doorX, y: DRIVEWAY.doorY },
  { x: STREET.finishX, y: STREET.row },
  { x: TAPE.doorX, y: TAPE.doorY },
  { x: CHAPTERS[3].doorX, y: CHAPTERS[3].doorY },
  { x: CHAPTERS[4].doorX, y: CHAPTERS[4].doorY },
];
CHAPTERS.forEach((chapter, index) => {
  const scene = emptyScene(ADVTYPE);
  const stem = stems[index];
  scene.desc = chapter.name;
  scene.pos = { x: 140 + index * 50, y: 110 };
  scene.files = [
    `${stem}.pal`,
    `${stem}.map`,
    `${stem}.bbl`,
    `${stem}.mon`,
    `${stem}.mbl`,
    ...actors[index],
    'hypo.snd',
    `${stem}.cmf`,
    `card${index + 1}.lst`,
    exits[index],
    ...new Array(9).fill(''),
  ];
  const next = CHAPTERS[index + 1];
  scene.links[0] = {
    toScene: next ? index + 3 : 1,
    from: doors[index],
    to: next ? { x: next.startX, y: next.startY } : { x: 0, y: 0 },
  };
  game.scenes.push(scene);
});
title.links[0] = {
  toScene: 2,
  from: { x: 0, y: 0 },
  to: { x: CHAPTERS[0].startX, y: CHAPTERS[0].startY },
};
put('hypo.gam', serializeGame(game));
writeFileSync(
  join(output, 'manifest.json'),
  JSON.stringify(
    readdirSync(output)
      .filter((name) => name !== 'manifest.json')
      .sort(),
  ),
);
console.log(`Built ${output}`);

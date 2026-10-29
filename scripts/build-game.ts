// Build a one-level DOS Game-Maker quest using GameMaker's original format helpers and Teddy art.
import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseBlocks, serializeBlocks } from '../../GameMaker/web/src/formats/blocks.ts';
import { ADVTYPE, emptyScene, newGame, serializeGame } from '../../GameMaker/web/src/formats/game.ts';
import { parseMap, reindexMonsters, serializeMap } from '../../GameMaker/web/src/formats/map.ts';
import { parseMonsters } from '../../GameMaker/web/src/formats/monster.ts';
import { matchColor, parsePalette } from '../../GameMaker/web/src/formats/palette.ts';
import { encodeGif } from '../../GameMaker/web/src/formats/gif.ts';
import { chezPicture } from '../../GameMaker/games/kit/chez.ts';
import { Pixels } from '../../GameMaker/games/kit/pixels.ts';
import { centered } from '../../GameMaker/games/kit/pcText.ts';

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
for (const placed of map.monsters) placed.monnum = 64;
const spots = [11, 16, 21, 26, 31, 36, 41, 46, 51, 56, 61, 66, 71];
spots.forEach((x, i) => { map.monsters[i] = { monnum: 12, status: 0, xtra: 0, curx: x, cury: 39, extra: 0 }; });
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

// Draw a dedicated title and finish screen in the DOS picture format.
const navy = matchColor(pal, 4, 13, 19);
const cream = matchColor(pal, 61, 56, 43);
const gold = matchColor(pal, 63, 46, 21);
function screen(name: string, headline: string, line: string) {
  const p = new Pixels(320, 200, navy);
  p.rect(0, 151, 320, 49, black);
  p.rect(0, 154, 320, 3, gold);
  p.blit(chezPicture(ink, 'right', 3), 100, 84, 255);
  centered(p, 20, headline, cream, 2);
  centered(p, 177, line, gold, 1);
  put(name, encodeGif({ width: 320, height: 200, pixels: p.px, palette: pal }));
}
screen('menu.gif', 'STRIPE CHASE', 'TEDDY - GWINN - DOC LEO');
screen('won.gif', 'STRIPES BACK!', 'THE CHEZ GOES FASTER NOW');
screen('lost.gif', 'TRY AGAIN!', 'THE CREW IS READY');

put('stripe.pal', pal);
put('stripe.bbl', serializeBlocks(bbl));
put('stripe.mbl', serializeBlocks(mbl));
put('stripe.mon', bytes('backyard.mon'));
put('stripe.map', serializeMap(map));
for (const name of ['teddy.chr', 'teddy.cbl', 'teddy.snd', 'backyard.cmf']) copyFileSync(join(source, name), join(output, name));
for (const name of ['blip.voc', 'boing.voc', 'chomp.voc', 'crunch.voc', 'dig.voc', 'flop.voc', 'giggle.voc', 'honk.voc', 'rumble.voc', 'scratch.voc', 'sniff.voc', 'snore.voc', 'splash.voc', 'woof.voc', 'yelp.voc', 'yum.voc']) {
  try { copyFileSync(join(source, name), join(output, name)); } catch { /* Optional sound. */ }
}
const text = (name: string, lines: string[]) => put(name, new TextEncoder().encode(lines.join('\r\n') + '\r\n'));
text('help.txt', ['STRIPE CHASE', '', 'Move Teddy with LEFT and RIGHT', 'or A and D. UP or W hops.', '', 'Collect the stripe pieces on', 'the road. Find ten to open', 'the door of THE CHEZ.', '', 'Gwinn is cheering you on!', 'Doc Leo waits by the car.']);
text('story.txt', ['THE CHEZ: STRIPE CHASE', '', 'The old racing stripes have', 'nearly fallen off THE CHEZ.', 'Doc Leo needs fresh ones', 'to make the car go faster.', '', 'Teddy scouts the road.', 'Gwinn helps the crew.', 'Bring ten pieces to the car!']);
text('credits.txt', ['THE CHEZ: STRIPE CHASE', '', 'For Lewis Moten and his', 'CitiCar, Teddy, and Gwinn.', '', 'Game-Maker engine and art:', 'Game-Maker Sandbox Edition', '', 'Game and text: Codex GPT-6']);

const game = newGame('STRIPE CHASE');
const [title, end] = game.scenes;
title.files[2] = 'menu.gif'; title.files[6] = 'help.txt'; title.files[4] = 'story.txt'; title.files[7] = 'credits.txt';
end.files[0] = 'won.gif'; end.files[2] = 'lost.gif';
const level = emptyScene(ADVTYPE);
level.desc = 'The Stripe Road';
level.pos = { x: 140, y: 110 };
level.files = ['stripe.pal', 'stripe.map', 'stripe.bbl', 'stripe.mon', 'stripe.mbl', 'teddy.chr', 'teddy.cbl', 'teddy.snd', 'backyard.cmf', '', '', ...new Array(9).fill('')];
level.links[0] = { toScene: 1, from: { x: 77, y: 39 }, to: { x: 0, y: 0 } };
title.links[0] = { toScene: 2, from: { x: 0, y: 0 }, to: { x: 10, y: 39 } };
game.scenes.push(level);
put('stripe.gam', serializeGame(game));
writeFileSync(join(output, 'manifest.json'), JSON.stringify(readdirSync(output).filter((name) => name !== 'manifest.json').sort()));
console.log(`Built ${output}`);

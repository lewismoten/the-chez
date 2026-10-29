// Play the bundled DOS game or a locally selected game through the same Game-Maker engine.
import './style.css';
import { GameFiles, Machine, runGame } from '@lewismoten/gamemaker-sandbox-engine';
import { PARK_GATE, PARK_LEAF } from './park-route';
import { CHAPTERS } from './chapters';
import { fillRoadAtlas, roadMessage } from './road-guide';
import { createMusicControl } from './music-control';
import { forgetCheckpoint, loadCheckpoint, rememberCheckpoint } from './checkpoint';

const canvas = document.querySelector<HTMLCanvasElement>('#engine-canvas')!;
const overlay = document.querySelector<HTMLElement>('#game-overlay')!;
const overlayTitle = document.querySelector<HTMLElement>('#overlay-title')!;
const overlayText = document.querySelector<HTMLElement>('#overlay-text')!;
const startButton = document.querySelector<HTMLButtonElement>('#start')!;
const watchButton = document.querySelector<HTMLButtonElement>('#watch-demo')!;
const restartButton = document.querySelector<HTMLButtonElement>('#restart')!;
const attachMusic = createMusicControl(document.querySelector<HTMLButtonElement>('#music-toggle')!);
const status = document.querySelector<HTMLElement>('#status')!;
const engineStatus = document.querySelector<HTMLElement>('#engine-status')!;
const input = document.querySelector<HTMLInputElement>('#game-files')!;
const playSelected = document.querySelector<HTMLButtonElement>('#play-engine')!;
const filesStatus = document.querySelector<HTMLElement>('#files-status')!;
const chapterName = document.querySelector<HTMLElement>('#chapter-name')!;
const stripeProgress = document.querySelector<HTMLElement>('#stripe-progress')!;
const progressLabel = document.querySelector<HTMLElement>('#progress-label')!;
const roadTip = document.querySelector<HTMLElement>('#road-tip')!;
fillRoadAtlas(document.querySelector<HTMLOListElement>('#road-atlas-list')!);
function sayRoad(text: string) {
  if (roadTip.textContent !== text) roadTip.textContent = text;
}
sayRoad(roadMessage(CHAPTERS[0], 0));
let machine: Machine | undefined;
let selected: File[] = [];
let launch = 0;
let retryScene = loadCheckpoint();
const chapterLabels = CHAPTERS.map((chapter) => chapter.name);
const chapterGoals = CHAPTERS.map((chapter) => chapter.required);

function chapterControls(index: number) {
  const driving = CHAPTERS[index]?.mode === 'drive';
  const maze = CHAPTERS[index]?.mode === 'maze';
  for (const [id, direction] of [
    ['left', 'left'],
    ['right', 'right'],
  ])
    document
      .querySelector(`#${id}`)!
      .setAttribute('aria-label', `${driving ? 'Drive' : 'Move'} ${driving ? 'THE\u00a0CHEZ' : (CHAPTERS[index]?.actor ?? 'Teddy')} ${direction}`);
  document.querySelector('#bark-key')!.textContent = maze ? '↓ / Space' : 'Space';
  progressLabel.textContent = driving ? 'CHEERS' : 'STRIPES';
  document.querySelector('#move-label')!.textContent = driving ? 'Drive THE\u00a0CHEZ' : `Move ${CHAPTERS[index]?.actor ?? 'Teddy'}`;
  document.querySelector('#hop-label')!.textContent = maze ? 'Up' : driving ? 'Bounce' : 'Hop';
  document.querySelector('#bark-label')!.textContent = maze ? 'Down' : driving ? 'Honk' : CHAPTERS[index]?.actor === 'Doc Leo' ? 'Squeak' : 'Bark';
  document.querySelector('#hop')!.textContent = maze ? 'Up ↑' : driving ? 'Bounce ↑' : 'Hop ↑';
  document.querySelector('#bark')!.textContent = maze ? 'Down ↓' : driving ? 'Honk!' : CHAPTERS[index]?.actor === 'Doc Leo' ? 'Squeak!' : 'Bark!';
}

async function bundledFiles(): Promise<GameFiles> {
  const names = await fetch('/game/manifest.json').then((response) => {
    if (!response.ok) throw new Error('Could not load Stripe Chase.');
    return response.json() as Promise<string[]>;
  });
  const entries = await Promise.all(
    names.map(async (name): Promise<[string, Uint8Array]> => {
      const response = await fetch(`/game/${encodeURIComponent(name)}`);
      if (!response.ok) throw new Error(`Could not load ${name}.`);
      return [name, new Uint8Array(await response.arrayBuffer())];
    }),
  );
  return new GameFiles(entries);
}

async function run(files: GameFiles, skipMenu: boolean, demo = false, resume?: number) {
  machine?.destroy();
  const game = files.mainGame();
  if (!game) throw new Error('Choose a folder containing a .GAM file.');
  const playback = demo ? files.get('tour.rec') : undefined;
  if (demo && !playback) throw new Error('Teddy’s demonstration could not be loaded.');
  const current = new Machine(canvas, files);
  const musicLink = attachMusic(current.audio, () => canvas.focus({ preventScroll: true }));
  const entrance = resume ?? 2;
  let chapterIndex = skipMenu ? entrance - 2 : 0;
  let finished = false;
  let lastScene = entrance;
  let outcome: 'won' | 'lost' | 'quit' | undefined;
  machine = current;
  overlay.hidden = true;
  status.textContent = demo ? 'Teddy’s demo' : 'Playing';
  chapterControls(chapterIndex);
  if (skipMenu) {
    chapterName.textContent = chapterLabels[chapterIndex];
    stripeProgress.textContent = `0 / ${chapterGoals[chapterIndex]}`;
    sayRoad(roadMessage(CHAPTERS[chapterIndex], 0));
  } else {
    sayRoad('Playing a selected Game-Maker game. F1 opens its own instructions.');
    chapterName.textContent = 'Selected game';
    stripeProgress.textContent = '—';
  }
  canvas.focus({ preventScroll: true });
  canvas.closest('.game-shell')?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  await current.audio.resume();
  try {
    await runGame(current, game, {
      record: skipMenu && !demo,
      playback,
      onSession: (session) => {
        musicLink.session(session);
        if (skipMenu && resume !== undefined) {
          const title = session.game.scenes[0];
          title.links[0] = { ...title.links[0], toScene: resume, to: { x: CHAPTERS[resume - 2].startX, y: 39 } };
          title.files[0] = title.files[1] = '';
        }
        session.onScene = (scene) => {
          if (scene >= 2) musicLink.track(files.get(session.game.scenes[scene]?.files[8]));
          if (skipMenu && scene >= 2 && scene < chapterLabels.length + 2 && machine === current) {
            chapterIndex = scene - 2;
            lastScene = scene;
            if (!demo) {
              retryScene = scene;
              rememberCheckpoint(scene);
            }
            chapterControls(chapterIndex);
            sayRoad(roadMessage(CHAPTERS[chapterIndex], 0));
            chapterName.textContent = chapterLabels[chapterIndex];
            stripeProgress.textContent = `0 / ${chapterGoals[chapterIndex]}`;
          }
          if (skipMenu && scene === 1 && machine === current) {
            finished = true;
            if (!demo) {
              retryScene = undefined;
              forgetCheckpoint();
            }
            chapterName.textContent = 'Curtain call';
            stripeProgress.textContent = `${chapterGoals[chapterIndex]} / ${chapterGoals[chapterIndex]}`;
            status.textContent = demo ? 'Teddy’s grand finale' : 'Stripes restored!';
            sayRoad('Teddy did it! Teamwork was the real turbo button.');
          }
        };
      },
      onFrame: (world) => {
        if (!skipMenu || finished || machine !== current) return;
        const chapter = CHAPTERS[chapterIndex];
        const required = chapter.required;
        const gate = world.bg[world.blkmap[world.map[39 * 100 + chapter.carX]]];
        // An opened native gate has already spent its quota; keep the completed goal visible.
        const found = gate.solid === 0 ? required : Math.min(required, Math.max(0, world.ci.meter[21 + chapterIndex] - 1));
        const nearGate = Math.abs(world.chr.x[0] - chapter.carX) <= 3 && Math.abs(world.chr.y[0] - 39) <= 2;
        const leafReady =
          chapter.errand === 'leaf' &&
          (world.ci.meter[PARK_LEAF.counter] > 1 || world.bg[world.blkmap[world.map[PARK_GATE.y * 100 + PARK_GATE.x]]].solid === 0);
        const nearLeafGate = chapter.errand === 'leaf' && Math.abs(world.chr.x[0] - PARK_GATE.x) <= 3;
        sayRoad(roadMessage(chapter, found, nearGate || nearLeafGate, leafReady));
        const label = `${found} / ${required}`;
        if (stripeProgress.textContent !== label) stripeProgress.textContent = label;
        if (!demo) {
          const tries = world.ci.lives + 1;
          const playing = `Playing · ${tries} ${tries === 1 ? 'try' : 'tries'}`;
          if (status.textContent !== playing) status.textContent = playing;
        }
      },
      onPlayEnd: (_score, how) => {
        if (machine !== current) return;
        outcome = how;
        if (skipMenu && !demo) {
          retryScene = how === 'won' ? undefined : lastScene;
          if (retryScene === undefined) forgetCheckpoint();
          else rememberCheckpoint(retryScene);
        }
        if (skipMenu && how !== 'won')
          sayRoad(
            how === 'lost'
              ? 'A tiny nap calls for another go. Try this road again with three fresh tries.'
              : 'Teddy kept your road. Continue whenever you are ready.',
          );
        status.textContent = skipMenu && how === 'won' ? 'Stripes restored!' : how === 'lost' ? 'Try again' : 'Game finished';
      },
    });
    if (machine === current && demo) {
      status.textContent = 'Demo finished';
      sayRoad('Teddy showed the route. Your turn to move, hop, bark, and zoom.');
    }
    if (machine === current && !skipMenu) sayRoad('Selected game finished. Restart returns to Teddy’s adventure.');
    if (machine === current && !demo && !finished && outcome === undefined) status.textContent = 'Game finished';
    if (machine === current && skipMenu) {
      overlayTitle.textContent = demo
        ? 'Your turn, Teddy!'
        : finished
          ? 'Teddy did it!'
          : outcome === 'lost'
            ? 'Teddy tries again!'
            : 'Ready for another chase?';
      overlayText.textContent = demo
        ? 'Teddy showed the way. Move, hop, and bark the stripes home.'
        : finished
          ? 'THE\u00a0CHEZ is 900% more dashing. Teamwork was the real turbo button.'
          : outcome === 'lost'
            ? `${chapterLabels[lastScene - 2]} is ready for another go. Three fresh tries!`
            : 'The wind can wait. Teddy and the crew are ready whenever you are.';
      const canContinue = retryScene !== undefined;
      if (demo && retryScene !== undefined)
        overlayText.textContent = `${chapterLabels[retryScene - 2]} is saved for you. Continue there with three fresh tries.`;
      startButton.textContent = outcome === 'lost' ? 'Try this road again' : canContinue ? 'Continue with Teddy' : 'Play as Teddy';
      overlay.hidden = false;
    }
  } finally {
    musicLink.release();
    current.destroy();
    if (machine === current) machine = undefined;
  }
}

async function startBundled(demo = false) {
  const request = ++launch;
  startButton.disabled = true;
  watchButton.disabled = true;
  status.textContent = 'Loading game…';
  try {
    await run(await bundledFiles(), true, demo, demo ? undefined : retryScene);
  } catch (error) {
    if (error instanceof Error && error.message === 'Game aborted') return;
    status.textContent = 'Could not start';
    engineStatus.textContent = error instanceof Error ? error.message : 'Could not start the game.';
    overlay.hidden = false;
  } finally {
    if (request === launch) {
      startButton.disabled = false;
      watchButton.disabled = false;
    }
  }
}

if (retryScene !== undefined) {
  const chapter = CHAPTERS[retryScene - 2];
  overlayTitle.textContent = 'Teddy kept your place!';
  overlayText.textContent = `${chapter.name} is ready. Continue from its safe entrance with three fresh tries, or choose Restart for a brand-new chase.`;
  startButton.textContent = 'Continue with Teddy';
  chapterName.textContent = chapter.name;
  stripeProgress.textContent = `0 / ${chapter.required}`;
  status.textContent = 'Road saved';
  chapterControls(retryScene - 2);
  sayRoad(roadMessage(chapter, 0));
}

startButton.addEventListener('click', () => {
  void startBundled();
});
watchButton.addEventListener('click', () => {
  void startBundled(true);
});
restartButton.addEventListener('click', () => {
  retryScene = undefined;
  forgetCheckpoint();
  void startBundled();
});
input.addEventListener('change', () => {
  selected = Array.from(input.files ?? []);
  const hasGame = selected.some((file) => file.name.toLowerCase().endsWith('.gam'));
  playSelected.disabled = !hasGame;
  filesStatus.textContent = hasGame
    ? `${selected.length} files ready to play.`
    : selected.length
      ? 'Choose a folder containing a .GAM file.'
      : 'No other game selected.';
});
playSelected.addEventListener('click', async () => {
  playSelected.disabled = true;
  engineStatus.textContent = 'Loading selected game…';
  try {
    const entries = await Promise.all(selected.map(async (file): Promise<[string, Uint8Array]> => [file.name, new Uint8Array(await file.arrayBuffer())]));
    document.querySelector('#play')!.scrollIntoView({ behavior: 'smooth' });
    await run(new GameFiles(entries), false);
    engineStatus.textContent = 'Game ended.';
  } catch (error) {
    engineStatus.textContent = error instanceof Error ? error.message : 'Could not start this game.';
  } finally {
    playSelected.disabled = false;
  }
});

// The engine's Keyboard.inject is the same input path used for touch controls in GameMaker.
for (const [id, scan] of [
  ['left', 75],
  ['right', 77],
  ['hop', 72],
  ['bark', 57],
] as const) {
  const button = document.querySelector<HTMLButtonElement>(`#${id}`)!;
  button.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    machine?.keyboard.inject(scan, true);
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(type, () => machine?.keyboard.inject(scan, false));
}
window.addEventListener('pagehide', () => machine?.destroy());

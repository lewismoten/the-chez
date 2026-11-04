// Play the bundled DOS game or a locally selected game through the same Game-Maker engine.
import './style.css';
import { type GameFiles, Machine, runGame } from '@lewismoten/gamemaker-sandbox-engine';
import { bundledFiles, selectedFiles } from './game-files';
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
const archiveInput = document.querySelector<HTMLInputElement>('#game-archive')!;
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
const goalText = (index: number) => (chapterGoals[index] > 0 ? `0 / ${chapterGoals[index]}` : (CHAPTERS[index].readout ?? ''));

function chapterControls(index: number) {
  const driving = CHAPTERS[index]?.mode === 'drive';
  for (const direction of ['left', 'right'])
    document.querySelector(`#${direction}`)!.setAttribute('aria-label', `${driving ? 'Drive THE\u00a0CHEZ' : 'Move Teddy'} ${direction}`);
  progressLabel.textContent = CHAPTERS[index]?.goal ?? 'GOAL';
  document.querySelector('#move-label')!.textContent = driving ? 'Drive THE\u00a0CHEZ' : 'Move Teddy';
  document.querySelector('#bark-label')!.textContent = driving ? 'Honk' : 'Bark';
  document.querySelector('#bark')!.textContent = driving ? 'Honk!' : 'Bark!';
}

async function run(files: GameFiles, skipMenu: boolean, demo = false, resume?: number) {
  machine?.destroy();
  const game = files.mainGame();
  if (!game) throw new Error('Choose a game folder, ZIP, or self-extracting ZIP.');
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
    stripeProgress.textContent = goalText(chapterIndex);
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
          title.links[0] = {
            ...title.links[0],
            toScene: resume,
            to: {
              x: CHAPTERS[resume - 2].startX,
              y: CHAPTERS[resume - 2].startY,
            },
          };
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
            stripeProgress.textContent = goalText(chapterIndex);
          }
          if (skipMenu && scene === 1 && machine === current) {
            finished = true;
            if (!demo) {
              retryScene = undefined;
              forgetCheckpoint();
            }
            chapterName.textContent = 'Curtain call';
            stripeProgress.textContent =
              chapterGoals[chapterIndex] > 0
                ? `${chapterGoals[chapterIndex]} / ${chapterGoals[chapterIndex]}`
                : (CHAPTERS[chapterIndex].readout ?? '');
            status.textContent = demo ? 'The experiment ends' : 'Results are in!';
            sayRoad('Top speed: 25 mph. Inconclusive. More trials are coming.');
          }
        };
      },
      onFrame: (world) => {
        if (!skipMenu || finished || machine !== current) return;
        const chapter = CHAPTERS[chapterIndex];
        const required = chapter.required;
        const gate = world.bg[world.blkmap[world.map[chapter.doorY * 100 + chapter.doorX]]];
        // An opened native door has already spent its quota; keep the completed goal visible.
        const found =
          chapter.counter === undefined ? 0 : gate.solid === 0 ? required : Math.min(required, Math.max(0, world.ci.meter[chapter.counter] - 1));
        const nearGate = Math.abs(world.chr.x[0] - chapter.doorX) <= 4 && Math.abs(world.chr.y[0] - chapter.doorY) <= 4;
        sayRoad(roadMessage(chapter, found, nearGate));
        const label = required > 0 ? `${found} / ${required}` : (chapter.readout ?? '');
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
              ? 'Science calls for another go. Try this level again with three fresh tries.'
              : 'Teddy kept your place. Continue whenever you are ready.',
          );
        status.textContent = skipMenu && how === 'won' ? 'Results are in!' : how === 'lost' ? 'Try again' : 'Game finished';
      },
    });
    if (machine === current && demo) {
      status.textContent = 'Demo finished';
      sayRoad('Teddy showed the route. Your turn to walk, drive, and wait for the turtle.');
    }
    if (machine === current && !skipMenu) sayRoad('Selected game finished. Restart returns to Teddy’s adventure.');
    if (machine === current && !demo && !finished && outcome === undefined) status.textContent = 'Game finished';
    if (machine === current && skipMenu) {
      overlayTitle.textContent = demo
        ? 'Your turn, Teddy!'
        : finished
          ? 'Inconclusive!'
          : outcome === 'lost'
            ? 'Teddy tries again!'
            : 'Ready for another trial?';
      overlayText.textContent = demo
        ? 'Teddy showed the way. Fetch, drive, and wait for the turtle.'
        : finished
          ? 'Top speed: 25 mph. Inconclusive. Doc Leo says the next trial will prove it.'
          : outcome === 'lost'
            ? `${chapterLabels[lastScene - 2]} is ready for another go. Three fresh tries!`
            : 'The clipboard can wait. Teddy and the crew are ready whenever you are.';
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
  overlayText.textContent = `${chapter.name} is ready. Continue from its safe entrance with three fresh tries, or choose Restart for a brand-new experiment.`;
  startButton.textContent = 'Continue with Teddy';
  chapterName.textContent = chapter.name;
  stripeProgress.textContent = goalText(retryScene - 2);
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
function chooseFiles(files: FileList | null) {
  selected = Array.from(files ?? []);
  const hasGame = selected.some((file) => /\.(gam|zip|exe|gmpak|gz)$/i.test(file.name));
  playSelected.disabled = !hasGame;
  filesStatus.textContent = hasGame
    ? `${selected.length} files ready to play.`
    : selected.length
      ? 'Choose a game folder, ZIP, or self-extracting ZIP.'
      : 'No other game selected.';
}
input.addEventListener('change', () => chooseFiles(input.files));
archiveInput.addEventListener('change', () => chooseFiles(archiveInput.files));
playSelected.addEventListener('click', async () => {
  playSelected.disabled = true;
  engineStatus.textContent = 'Loading selected game…';
  try {
    const files = await selectedFiles(selected);
    document.querySelector('#play')!.scrollIntoView({ behavior: 'smooth' });
    await run(files, false);
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
  ['down', 80],
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

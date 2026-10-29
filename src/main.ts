// Play the bundled DOS game or a locally selected game through the same Game-Maker engine.
import './style.css';
import { GameFiles, Machine, runGame } from '@lewismoten/gamemaker-sandbox-engine';
import { CHAPTERS } from './chapters';

const canvas = document.querySelector<HTMLCanvasElement>('#engine-canvas')!;
const overlay = document.querySelector<HTMLElement>('#game-overlay')!;
const overlayTitle = document.querySelector<HTMLElement>('#overlay-title')!;
const overlayText = document.querySelector<HTMLElement>('#overlay-text')!;
const startButton = document.querySelector<HTMLButtonElement>('#start')!;
const watchButton = document.querySelector<HTMLButtonElement>('#watch-demo')!;
const restartButton = document.querySelector<HTMLButtonElement>('#restart')!;
const status = document.querySelector<HTMLElement>('#status')!;
const engineStatus = document.querySelector<HTMLElement>('#engine-status')!;
const input = document.querySelector<HTMLInputElement>('#game-files')!;
const playSelected = document.querySelector<HTMLButtonElement>('#play-engine')!;
const filesStatus = document.querySelector<HTMLElement>('#files-status')!;
const chapterName = document.querySelector<HTMLElement>('#chapter-name')!;
const stripeProgress = document.querySelector<HTMLElement>('#stripe-progress')!;
const progressLabel = document.querySelector<HTMLElement>('#progress-label')!;
let machine: Machine | undefined;
let selected: File[] = [];
let launch = 0;
let retryScene: number | undefined;
const chapterLabels = CHAPTERS.map((chapter) => chapter.name);
const chapterGoals = CHAPTERS.map((chapter) => chapter.required);

function chapterControls(index: number) {
  const driving = CHAPTERS[index]?.mode === 'drive';
  progressLabel.textContent = driving ? 'CHEERS' : 'STRIPES';
  document.querySelector('#move-label')!.textContent = driving ? 'Drive THE\u00a0CHEZ' : 'Move Teddy';
  document.querySelector('#hop-label')!.textContent = driving ? 'Bounce' : 'Hop';
  document.querySelector('#bark-label')!.textContent = driving ? 'Honk' : 'Bark';
  document.querySelector('#hop')!.textContent = driving ? 'Bounce ↑' : 'Hop ↑';
  document.querySelector('#bark')!.textContent = driving ? 'Honk!' : 'Bark!';
}

async function bundledFiles(): Promise<GameFiles> {
  const names = await fetch('/game/manifest.json').then((response) => {
    if (!response.ok) throw new Error('Could not load Stripe Chase.');
    return response.json() as Promise<string[]>;
  });
  const entries = await Promise.all(names.map(async (name): Promise<[string, Uint8Array]> => {
    const response = await fetch(`/game/${encodeURIComponent(name)}`);
    if (!response.ok) throw new Error(`Could not load ${name}.`);
    return [name, new Uint8Array(await response.arrayBuffer())];
  }));
  return new GameFiles(entries);
}

async function run(files: GameFiles, skipMenu: boolean, demo = false, resume?: number) {
  machine?.destroy();
  const game = files.mainGame();
  if (!game) throw new Error('Choose a folder containing a .GAM file.');
  const playback = demo ? files.get('tour.rec') : undefined;
  if (demo && !playback) throw new Error('Teddy’s demonstration could not be loaded.');
  const current = new Machine(canvas, files);
  let chapterIndex = 0;
  let finished = false;
  let lastScene = resume ?? 2;
  let outcome: 'won' | 'lost' | 'quit' | undefined;
  machine = current;
  overlay.hidden = true;
  status.textContent = demo ? 'Teddy’s demo' : 'Playing';
  chapterControls(0);
  if (skipMenu) {
    chapterName.textContent = 'The Stripe Road';
    stripeProgress.textContent = '0 / 10';
  } else {
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
        if (skipMenu && resume !== undefined) {
          const title = session.game.scenes[0];
          title.links[0] = { ...title.links[0], toScene: resume, to: { x: CHAPTERS[resume - 2].startX, y: 39 } };
          title.files[0] = title.files[1] = '';
        }
        session.onScene = (scene) => {
          if (skipMenu && scene >= 2 && scene < chapterLabels.length + 2 && machine === current) {
            chapterIndex = scene - 2;
            lastScene = scene;
            chapterControls(chapterIndex);
            chapterName.textContent = chapterLabels[chapterIndex];
            stripeProgress.textContent = `0 / ${chapterGoals[chapterIndex]}`;
          }
          if (skipMenu && scene === 1 && machine === current) {
            finished = true;
            chapterName.textContent = 'Curtain call';
            stripeProgress.textContent = `${chapterGoals[chapterIndex]} / ${chapterGoals[chapterIndex]}`;
            status.textContent = demo ? 'Teddy’s grand finale' : 'Stripes restored!';
          }
        };
      },
      onFrame: (world) => {
        if (!skipMenu || finished || machine !== current) return;
        const required = chapterGoals[chapterIndex];
        const found = Math.min(required, Math.max(0, world.ci.meter[21 + chapterIndex] - 1));
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
        if (skipMenu && !demo) retryScene = how === 'lost' ? lastScene : undefined;
        status.textContent = skipMenu && how === 'won' ? 'Stripes restored!' : how === 'lost' ? 'Try again' : 'Game finished';
      },
    });
    if (machine === current && demo) status.textContent = 'Demo finished';
    if (machine === current && !demo && !finished && outcome === undefined) status.textContent = 'Game finished';
    if (machine === current && skipMenu) {
      overlayTitle.textContent = demo ? 'Your turn, Teddy!' : finished ? 'Teddy did it!' : outcome === 'lost' ? 'Teddy tries again!' : 'Ready for another chase?';
      overlayText.textContent = demo
        ? 'Teddy showed the way. Move, hop, and bark the stripes home.'
        : finished
          ? 'THE\u00a0CHEZ is 900% more dashing. Teamwork was the real turbo button.'
          : outcome === 'lost'
            ? `${chapterLabels[lastScene - 2]} is ready for another go. Three fresh tries!`
            : 'The wind can wait. Teddy and the crew are ready whenever you are.';
      startButton.textContent = outcome === 'lost' ? 'Try this road again' : 'Play as Teddy';
      overlay.hidden = false;
    }
  } finally {
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

startButton.addEventListener('click', () => { void startBundled(); });
watchButton.addEventListener('click', () => { retryScene = undefined; void startBundled(true); });
restartButton.addEventListener('click', () => { retryScene = undefined; void startBundled(); });
input.addEventListener('change', () => {
  selected = Array.from(input.files ?? []);
  const hasGame = selected.some((file) => file.name.toLowerCase().endsWith('.gam'));
  playSelected.disabled = !hasGame;
  filesStatus.textContent = hasGame ? `${selected.length} files ready to play.` : selected.length ? 'Choose a folder containing a .GAM file.' : 'No other game selected.';
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
for (const [id, scan] of [['left', 75], ['right', 77], ['hop', 72], ['bark', 57]] as const) {
  const button = document.querySelector<HTMLButtonElement>(`#${id}`)!;
  button.addEventListener('pointerdown', (event) => { event.preventDefault(); button.setPointerCapture(event.pointerId); machine?.keyboard.inject(scan, true); });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(type, () => machine?.keyboard.inject(scan, false));
}
window.addEventListener('pagehide', () => machine?.destroy());

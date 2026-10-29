// Play the bundled DOS game or a locally selected game through the same Game-Maker engine.
import './style.css';
import { GameFiles, Machine, runGame } from '@lewismoten/gamemaker-sandbox-engine';

const canvas = document.querySelector<HTMLCanvasElement>('#engine-canvas')!;
const overlay = document.querySelector<HTMLElement>('#game-overlay')!;
const startButton = document.querySelector<HTMLButtonElement>('#start')!;
const restartButton = document.querySelector<HTMLButtonElement>('#restart')!;
const status = document.querySelector<HTMLElement>('#status')!;
const engineStatus = document.querySelector<HTMLElement>('#engine-status')!;
const input = document.querySelector<HTMLInputElement>('#game-files')!;
const playSelected = document.querySelector<HTMLButtonElement>('#play-engine')!;
const filesStatus = document.querySelector<HTMLElement>('#files-status')!;
const chapterName = document.querySelector<HTMLElement>('#chapter-name')!;
const stripeProgress = document.querySelector<HTMLElement>('#stripe-progress')!;
let machine: Machine | undefined;
let selected: File[] = [];
const chapterLabels = ['The Stripe Road', 'Maple Street', 'Puddlewick Park', 'Downtown', 'The Clown Club'];
const chapterGoals = [10, 8, 8, 9, 10];

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

async function run(files: GameFiles, skipMenu: boolean) {
  machine?.destroy();
  const game = files.mainGame();
  if (!game) throw new Error('Choose a folder containing a .GAM file.');
  const current = new Machine(canvas, files);
  let chapterIndex = 0;
  machine = current;
  overlay.hidden = true;
  status.textContent = 'Playing';
  if (skipMenu) {
    chapterName.textContent = 'The Stripe Road';
    stripeProgress.textContent = '0 / 10';
  } else {
    chapterName.textContent = 'Selected game';
    stripeProgress.textContent = '—';
  }
  canvas.focus();
  await current.audio.resume();
  try {
    await runGame(current, game, {
      record: skipMenu,
      onSession: (session) => {
        session.onScene = (scene) => {
          if (skipMenu && scene >= 2 && scene < chapterLabels.length + 2 && machine === current) {
            chapterIndex = scene - 2;
            chapterName.textContent = chapterLabels[chapterIndex];
            stripeProgress.textContent = `0 / ${chapterGoals[chapterIndex]}`;
          }
          if (skipMenu && scene === 1 && machine === current) status.textContent = 'Stripes restored!';
        };
      },
      onFrame: (world) => {
        if (!skipMenu || machine !== current) return;
        const required = chapterGoals[chapterIndex];
        const found = Math.max(0, world.ci.meter[21 + chapterIndex] - 1);
        const label = `${found} / ${required}`;
        if (stripeProgress.textContent !== label) stripeProgress.textContent = label;
      },
      onPlayEnd: (_score, how) => {
        if (machine === current) status.textContent = skipMenu && how === 'won' ? 'Stripes restored!' : how === 'lost' ? 'Try again' : 'Game finished';
      },
    });
    if (machine === current && status.textContent === 'Playing') status.textContent = 'Game finished';
  } finally {
    current.destroy();
    if (machine === current) machine = undefined;
  }
}

async function startBundled() {
  startButton.disabled = true;
  status.textContent = 'Loading game…';
  try {
    await run(await bundledFiles(), true);
  } catch (error) {
    if (error instanceof Error && error.message === 'Game aborted') return;
    status.textContent = 'Could not start';
    engineStatus.textContent = error instanceof Error ? error.message : 'Could not start the game.';
    overlay.hidden = false;
  } finally {
    startButton.disabled = false;
  }
}

startButton.addEventListener('click', () => { void startBundled(); });
restartButton.addEventListener('click', () => { void startBundled(); });
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
for (const [id, scan] of [['left', 75], ['right', 77], ['hop', 72]] as const) {
  const button = document.querySelector<HTMLButtonElement>(`#${id}`)!;
  button.addEventListener('pointerdown', (event) => { event.preventDefault(); button.setPointerCapture(event.pointerId); machine?.keyboard.inject(scan, true); });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) button.addEventListener(type, () => machine?.keyboard.inject(scan, false));
}
window.addEventListener('pagehide', () => machine?.destroy());

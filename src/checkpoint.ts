// Remember a safe road entrance, never live engine state or a demonstration's progress.
import { CHAPTERS } from './chapters';

const KEY = 'the-chez:road';
const ROUTE = `v1:${CHAPTERS.map((chapter) => chapter.name).join('|')}`;
const validScene = (scene: unknown): scene is number => typeof scene === 'number' && Number.isInteger(scene) && scene >= 2 && scene < CHAPTERS.length + 2;

export function loadCheckpoint(): number | undefined {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    if (saved?.route === ROUTE && validScene(saved.scene)) return saved.scene;
  } catch { /* Storage can be unavailable or contain an old, incomplete entry. */ }
  return undefined;
}

export function rememberCheckpoint(scene: number) {
  if (!validScene(scene)) return;
  try { localStorage.setItem(KEY, JSON.stringify({ route: ROUTE, scene })); }
  catch { /* The current session still keeps its in-memory checkpoint. */ }
}

export function forgetCheckpoint() {
  try { localStorage.removeItem(KEY); }
  catch { /* Restart and winning also clear the in-memory checkpoint. */ }
}

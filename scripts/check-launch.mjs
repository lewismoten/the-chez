// Exercise page launch wiring with a failing audio context and a minimal DOM.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { transform } from 'esbuild';
import { CHAPTERS } from '../src/chapters.ts';
import { bindGameButton } from '../src/game-button.ts';
import { createMusicControl } from '../src/music-control.ts';
class Element extends EventTarget {
  textContent = '';
  hidden = false;
  disabled = false;
  attributes = new Map();
  focus() { document.activeElement = this; }
  setAttribute(key, value) { this.attributes.set(key, value); }
  scrollIntoView() {}
  closest() { return this; }
  setPointerCapture() {}
}
const elements = new Map();
globalThis.document = {
  querySelector(id) {
    if (!elements.has(id)) elements.set(id, new Element());
    return elements.get(id);
  },
};
globalThis.window = new EventTarget();
const instances = [];
let rejectResume = true;
class Machine {
  destroyed = false;
  injected = [];
  keyboard = { inject: (...args) => this.injected.push(args) };
  resumes = 0;
  audio = {
    playSong: async () => true,
    stopSong() {},
    resume: async () => { this.resumes++; if (rejectResume) throw new Error('Audio unavailable. Try again.'); },
  };
  constructor() { instances.push(this); }
  destroy() { this.destroyed = true; }
}
const files = { mainGame: () => ({}), get: () => undefined };
globalThis.__launchTest = {
  Machine, CHAPTERS, bindGameButton, createMusicControl,
  runGame: async () => {}, bundledFiles: async () => files, selectedFiles: async () => files,
  fillRoadAtlas() {}, roadMessage: () => 'Mission',
  forgetCheckpoint() {}, loadCheckpoint() {}, rememberCheckpoint() {},
};
try {
  const source = (await readFile(new URL('../src/main.ts', import.meta.url), 'utf8'))
    .replace(/^import ['"].*?['"];$/gm, '')
    .replace(/^import \{([^}]+)\} from ['"][^'"]+['"];$/gm, (_, names) => {
      const values = names.split(',').map(s => s.trim()).filter(s => !s.startsWith('type '));
      return `const { ${values.join(', ')} } = globalThis.__launchTest;`;
    });
  const { code } = await transform(source, { loader: 'ts', format: 'esm' });
  await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
  const el = id => document.querySelector(`#${id}`);
  const click = id => el(id).dispatchEvent(new Event('click'));
  const settle = () => new Promise(resolve => setImmediate(resolve));
  click('start');
  await settle();
  assert.equal(instances.length, 1);
  assert.equal(instances[0].destroyed, true, 'resume rejection destroys the Machine');
  assert.equal(el('status').textContent, 'Could not start');
  assert.equal(el('game-overlay').hidden, false);
  assert.equal(document.activeElement, el('overlay-title'), 'error overlay heading receives focus');
  assert.equal(el('start').textContent, 'Retry');
  assert.equal(el('start').disabled, false);
  click('music-toggle');
  click('music-toggle');
  await settle();
  assert.equal(instances[0].resumes, 1, 'failed launch releases the music link');
  el('left').dispatchEvent(Object.assign(new Event('pointerdown', { cancelable: true }), { pointerId: 1 }));
  assert.deepEqual(instances[0].injected, [], 'failed launch clears the active Machine');
  rejectResume = false;
  click('start');
  await settle();
  assert.equal(instances[1].destroyed, true, 'finished launches also clean up');
  assert.equal(document.activeElement, el('overlay-title'), 'completion overlay receives focus');
  click('play-engine');
  await settle();
  assert.equal(el('move-label').textContent, 'Move');
  assert.equal(el('bark').textContent, 'Action');
  assert.equal(el('progress-label').textContent, 'GAME');
  assert.equal(el('left').attributes.get('aria-label'), 'Move left');
  console.log('Launch: resume rejection cleanup, music release, Retry focus, completion focus and generic imported-game controls passed.');
} finally {
  delete globalThis.__launchTest;
  delete globalThis.document;
  delete globalThis.window;
}

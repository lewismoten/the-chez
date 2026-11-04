// The music switch against the engine's real song and effect calls: muting before Play, resuming the
// current level's song, the saved preference after a reload, and barks that stay on while music is off.
import assert from 'node:assert/strict';
import { continueAt, withPage } from './page-check.mjs';

const anchor = 'const current = new Machine(canvas, files);';
const spy = `${anchor}
  window.__songs = []; window.__effects = 0;
  const song = current.audio.playSong.bind(current.audio);
  current.audio.playSong = async (bytes) => { window.__songs.push(Array.from(bytes ?? [])); return song(bytes); };
  const effect = current.audio.playVoc.bind(current.audio);
  current.audio.playVoc = (bytes) => { window.__effects++; return effect(bytes); };`;

await withPage({ port: 4178, patches: [[anchor, spy]] }, async ({ page, errors, url }) => {
  const file = async (name) => Array.from(new Uint8Array(await (await page.request.get(`${url}game/${name}`)).body()));
  await page.goto(url);
  const button = page.locator('#music-toggle');
  await button.click();
  assert.equal(await button.getAttribute('aria-pressed'), 'false');
  await page.locator('#start').click();
  await page.waitForFunction(() => document.querySelector('#status').textContent === 'Playing · 3 tries');
  assert.equal(await page.evaluate(() => window.__songs.length), 0, 'muting before Play keeps every song quiet');
  await button.click();
  await page.waitForFunction(() => window.__songs.length > 0);
  assert.deepEqual(await page.evaluate(() => window.__songs.at(-1)), await file('yard.cmf'), 'turning music on resumes the current level');
  await button.click();
  const before = await page.evaluate(() => window.__effects);
  await page.keyboard.down('Space');
  await page.waitForTimeout(180);
  await page.keyboard.up('Space');
  await page.waitForFunction((n) => window.__effects > n, before);
  await continueAt(page, url, 4);
  assert.equal(await button.getAttribute('aria-pressed'), 'false', 'the preference survives a reload');
  await page.locator('#start').click();
  await page.waitForFunction(() => document.querySelector('#chapter-name').textContent === 'Trial 1: Uphill' && document.querySelector('#status').textContent === 'Playing · 3 tries');
  assert.equal(await page.evaluate(() => window.__songs.length), 0, 'a new level respects the saved preference');
  await button.click();
  await page.waitForFunction(() => window.__songs.length > 0);
  assert.deepEqual(await page.evaluate(() => window.__songs.at(-1)), await file('hill.cmf'));
  assert.deepEqual(errors, []);
});
console.log('Music switch, saved preference, per-level songs and barks with music off: passed');

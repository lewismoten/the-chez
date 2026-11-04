// Plays the hill with the real keyboard in the real browser engine: the 20 mph climb (the car moves 4 px and
// rises 1 px a frame), the crest scene change, and the 30 mph descent (6 px across, 1 down), then the ending.
// The engine is only watched (its world is read each frame); every input is a key press.
import assert from 'node:assert/strict';
import { CHAPTERS } from '../src/chapters.ts';
import { carRise } from './hypo-hill.ts';
import { continueAt, withPage } from './page-check.mjs';

const [, , , , , uphill, downhill] = CHAPTERS;
const hook = ['onFrame: (world) => {', 'onFrame: (world) => { (window.__trace ??= []).push([world.chr.x[0] * 20 + world.chr.x[1], world.chr.y[0] * 20 + world.chr.y[1], document.querySelector("#chapter-name").textContent]);'];

await withPage({ port: 4175, width: 1280, height: 900, patches: [hook] }, async ({ page, errors, url }) => {
  await continueAt(page, url, uphill.scene);
  await page.locator('#start').click();
  await page.waitForFunction((name) => document.querySelector('#chapter-name').textContent === name, uphill.name);
  assert.equal(await page.locator('#stripe-progress').textContent(), '20 MPH');
  await page.waitForFunction(() => window.__trace?.length > 3, null, { timeout: 30_000 });
  await page.keyboard.down('ArrowRight');
  await page.waitForFunction((name) => document.querySelector('#chapter-name').textContent === name, downhill.name, { timeout: 60_000 });
  assert.equal(await page.locator('#stripe-progress').textContent(), '30 MPH', 'the page shows the new speed at the crest');
  await page.keyboard.up('ArrowRight');
  const trace = await page.evaluate(() => window.__trace);
  const climb = trace.filter((s) => s[2] === uphill.name);
  assert.ok(climb.length > 100, 'the climb was played');
  const steps = (rows, dx) => rows.slice(1).filter((s, i) => s[0] - rows[i][0] === dx && Math.abs(s[1] - rows[i][1]) === 1).length;
  assert.ok(steps(climb, 4) > 100, 'the 20 mph car moves 4 px and 1 px up per frame');
  // (the last sample is the frame of the scene change, which moves the car to the crest)
  assert.ok(climb.filter((s) => s[0] < 690).every((s) => s[1] === 1880 - carRise(s[0])), 'the climbing car stays on the road line');
  // The engine lets go of every key at a scene change: wait out the card, then hold Right again.
  await page.waitForTimeout(5000);
  const mark = await page.evaluate(() => window.__trace.length);
  await page.keyboard.down('ArrowRight');
  await page.waitForFunction((name) => document.querySelector('#chapter-name').textContent === name, 'Curtain call', { timeout: 90_000 });
  await page.keyboard.up('ArrowRight');
  const run = (await page.evaluate(() => window.__trace)).slice(mark).filter((s) => s[2] === downhill.name);
  assert.ok(steps(run, 6) > 100, 'the 30 mph car moves 6 px and 1 px down per frame');
  // (the last sample is the frame that moves to the ending)
  assert.ok(run.filter((s) => s[0] >= 700 && s[0] < 1640).every((s) => s[1] === 1880 - carRise(s[0])), 'the descending car stays on the road line');
  assert.deepEqual(errors, []);
});
console.log('The hill by keyboard in the browser engine: 20 mph up, crest swap, 30 mph down, ending: passed');

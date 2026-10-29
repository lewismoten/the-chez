// Verify road guidance and real crate hops using public page controls and keyboard input.
// Microsoft Playwright (Apache-2.0); see NOTICE.md.
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
import { CHAPTERS } from '../src/chapters.ts';
import { roadMessage } from '../src/road-guide.ts';

assert.match(roadMessage(CHAPTERS[1], 7, true), /1 more stripe.*wind post/);
assert.match(roadMessage(CHAPTERS[3], 2, true), /^Doc Leo needs/);
assert.match(roadMessage(CHAPTERS[6], 2, true), /^Gwinn needs/);
const root = fileURLToPath(new URL('..', import.meta.url));
const server = await createServer({ root, logLevel: 'error', server: { host: '127.0.0.1', port: 4177, strictPort: true } });
await server.listen();
let browser;
try {
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 800 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  // Observe position without changing the world or replacing the package's input handling.
  await page.route('**/src/main.ts', async (route) => {
    const response = await route.fetch();
    const body = (await response.text()).replace('onFrame: (world) => {', 'onFrame: (world) => { window.__guidanceWorld = world;');
    await route.fulfill({ response, body });
  });
  await page.goto('http://127.0.0.1:4177/');
  await page.evaluate(async () => {
    const { rememberCheckpoint } = await import('/src/checkpoint.ts');
    rememberCheckpoint(3);
  });
  await page.reload();
  await page.locator('#road-atlas summary').focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('#road-atlas-list li').count(), CHAPTERS.length);
  await page.locator('#start').click();
  await page.waitForFunction(() => document.querySelector('#chapter-name').textContent === 'Maple Street' && window.__guidanceWorld);
  assert.match(await page.locator('#road-tip').textContent(), /flying stripe kites/);
  await page.evaluate(() => {
    window.__roadGoal = [];
    new MutationObserver(() => {
      if (document.querySelector('#chapter-name').textContent === 'Maple Street')
        window.__roadGoal.push(document.querySelector('#stripe-progress').textContent);
    }).observe(document.querySelector('#stripe-progress'), { childList: true, characterData: true, subtree: true });
  });
  await page.keyboard.down('ArrowRight');
  for (const crate of [23, 43, 63]) {
    await page.waitForFunction((x) => window.__guidanceWorld?.chr.x[0] === x, crate, { timeout: 20_000 });
    await page.waitForTimeout(200);
    assert.equal(await page.evaluate(() => window.__guidanceWorld.chr.x[0]), crate, 'walking must stop at each crate');
    await page.keyboard.down('ArrowUp');
    await page.waitForTimeout(120);
    await page.keyboard.up('ArrowUp');
    await page.waitForFunction((x) => window.__guidanceWorld?.chr.x[0] > x, crate + 2);
  }
  await page.waitForFunction(() => document.querySelector('#chapter-name').textContent === 'Puddlewick Park', null, { timeout: 20_000 });
  await page.keyboard.up('ArrowRight');
  const goals = await page.evaluate(() => window.__roadGoal);
  const complete = goals.indexOf('8 / 8');
  assert.ok(complete >= 0 && goals.slice(complete).every((goal) => goal === '8 / 8'), 'spending the gate quota must keep the completed goal visible');
  assert.match(await page.locator('#road-tip').textContent(), /tall upward stream/);
  const shell = await page.locator('.game-shell').boundingBox(),
    tip = await page.locator('#road-tip').boundingBox();
  assert.ok(tip.y >= shell.y && tip.y + tip.height <= shell.y + shell.height);
  assert.deepEqual(errors, []);
  console.log('Road atlas, actor-specific hints, three public-keyboard crate hops, and completed goal: passed');
} finally {
  await browser?.close();
  await server.close();
}

// Verify the shipped demo through public controls in a scratch production build.
// Microsoft Playwright (Apache-2.0) drives Chrome; see NOTICE.md.
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { build, preview } from 'vite';
import { CHAPTERS } from '../src/chapters.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const directory = await mkdtemp(join(tmpdir(), 'chez-release-'));
const screenshots = await mkdtemp(join(tmpdir(), 'chez-release-images-'));
let server, browser;
try {
  await build({ root, logLevel: 'error', build: { outDir: directory, emptyOutDir: true } });
  server = await preview({ root, logLevel: 'error', build: { outDir: directory }, preview: { host: '127.0.0.1', port: 4176, strictPort: true } });
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 800 } });
  const errors = [], missing = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => {
    if (response.url().startsWith('http://127.0.0.1:4176/') && response.status() >= 400) missing.push(response.url());
  });
  await page.goto('http://127.0.0.1:4176/');
  await page.locator('#watch-demo').click();
  await page.waitForFunction(() => document.querySelector('#status')?.textContent === 'Teddy’s grand finale', null, { timeout: 210_000 });
  assert.equal(await page.locator('#chapter-name').textContent(), 'Curtain call');
  assert.equal(await page.locator('#stripe-progress').textContent(), `${CHAPTERS.at(-1).required} / ${CHAPTERS.at(-1).required}`);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: join(screenshots, 'mobile-finale.png') });
  await page.waitForTimeout(8000);
  for (let attempt = 0; attempt < 15 && await page.locator('#status').textContent() !== 'Demo finished'; attempt++) {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
  }
  assert.equal(await page.locator('#status').textContent(), 'Demo finished');
  assert.ok(await page.locator('#game-overlay').isVisible());
  const canvas = await page.locator('#engine-canvas').boundingBox();
  for (const selector of ['#start', '#watch-demo']) {
    const action = await page.locator(selector).boundingBox();
    assert.ok(action.y + action.height <= canvas.y + canvas.height, `${selector} must fit after the finale`);
  }
  await page.screenshot({ path: join(screenshots, 'your-turn.png') });
  await page.locator('#start').click();
  await page.waitForFunction(() => document.querySelector('#chapter-name')?.textContent === 'The Stripe Road' && document.querySelector('#status')?.textContent === 'Playing · 3 tries');
  assert.equal(await page.locator('#game-overlay').isVisible(), false);
  assert.equal(await page.locator('#progress-label').textContent(), 'STRIPES');
  assert.equal(await page.locator('#bark').textContent(), 'Bark!');
  assert.equal(await page.locator('#hop').textContent(), 'Hop ↑');
  assert.deepEqual(errors, [], 'production playback must have no browser errors');
  assert.deepEqual(missing, [], 'production assets must all load');
  console.log(`Production demo, mobile finale, and handoff to play: passed. Screenshots: ${screenshots}`);
} finally {
  await browser?.close();
  if (server) await new Promise((resolve, reject) => server.httpServer.close((error) => error ? reject(error) : resolve()));
  await rm(directory, { recursive: true, force: true });
}

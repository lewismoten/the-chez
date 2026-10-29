// Verify hints, a caught replacement kite, and the paid gate using only public UI and keyboard controls.
// Microsoft Playwright (Apache-2.0); see NOTICE.md.
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import { CHAPTERS } from '../src/chapters.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const screenshots = await mkdtemp(join(tmpdir(), 'chez-guidance-'));
const server = await createServer({ root, logLevel: 'error', server: { host: '127.0.0.1', port: 4177, strictPort: true } });
await server.listen();
let browser;
try {
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 800 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('http://127.0.0.1:4177/');
  // Seed a normal saved entrance, then use the page's own Continue action.
  await page.evaluate(async () => { const { rememberCheckpoint } = await import('/src/checkpoint.ts'); rememberCheckpoint(3); });
  await page.reload();
  await page.locator('#road-atlas summary').focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('#road-atlas-list li').count(), CHAPTERS.length);
  assert.ok(await page.locator('#road-atlas-list').isVisible());
  await page.locator('#start').click();
  await page.waitForFunction(() => document.querySelector('#chapter-name').textContent === 'Maple Street' && document.querySelector('#status').textContent === 'Playing · 3 tries');
  assert.ok((await page.locator('#road-tip').textContent()).includes('flying stripe kites'));
  await page.keyboard.down('ArrowRight');
  await page.waitForFunction(() => document.querySelector('#road-tip').textContent.includes('1 more stripe.'), null, { timeout: 35_000 });
  await page.waitForTimeout(1000);
  await page.keyboard.up('ArrowRight');
  assert.equal(await page.locator('#stripe-progress').textContent(), '7 / 8');
  assert.ok((await page.locator('#road-tip').textContent()).includes('wind post'));
  const shell = await page.locator('.game-shell').boundingBox();
  const tip = await page.locator('#road-tip').boundingBox();
  assert.ok(tip.y >= shell.y && tip.y + tip.height <= shell.y + shell.height, 'the hint stays with the playable screen');
  await page.screenshot({ path: join(screenshots, 'one-kite-needed.png') });
  await page.keyboard.down('ArrowLeft');
  await page.waitForFunction(() => document.querySelector('#road-tip').textContent.startsWith('Gather 8 stripes.'));
  await page.waitForTimeout(450);
  await page.keyboard.up('ArrowLeft');
  for (let hop = 0; hop < 24 && await page.locator('#stripe-progress').textContent() !== '8 / 8'; hop++) {
    await page.keyboard.down('ArrowUp');
    await page.waitForTimeout(180);
    await page.keyboard.up('ArrowUp');
    await page.waitForTimeout(500);
  }
  assert.equal(await page.locator('#stripe-progress').textContent(), '8 / 8', 'a player can catch a replacement with the ordinary Hop control');
  assert.ok((await page.locator('#road-tip').textContent()).includes('Meet Doc Leo'));
  // Watch the displayed goal, without reading or mutating engine objects.
  await page.evaluate(() => {
    window.__roadGoal = [];
    new MutationObserver(() => {
      if (document.querySelector('#chapter-name').textContent === 'Maple Street') window.__roadGoal.push(document.querySelector('#stripe-progress').textContent);
    }).observe(document.querySelector('#stripe-progress'), { childList: true, characterData: true, subtree: true });
  });
  await page.keyboard.down('ArrowRight');
  await page.waitForFunction(() => document.querySelector('#chapter-name').textContent === 'Puddlewick Park', null, { timeout: 20_000 });
  await page.keyboard.up('ArrowRight');
  assert.ok((await page.evaluate(() => window.__roadGoal)).every((goal) => goal === '8 / 8'), 'spending the gate quota must not empty the displayed goal');
  assert.ok((await page.locator('#road-tip').textContent()).includes('upward arrows'));
  assert.deepEqual(errors, []);
  console.log(`Road atlas, locked-gate hint, public Hop recovery, and completed goal: passed. Screenshots: ${screenshots}`);
} catch (error) {
  if (browser) for (const context of browser.contexts()) for (const page of context.pages()) await page.screenshot({ path: join(screenshots, 'failure.png') });
  console.error(`Screenshots: ${screenshots}`);
  throw error;
} finally {
  await browser?.close();
  await server.close();
}

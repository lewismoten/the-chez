// Play the complete game through the installed browser engine; optionally save its real input recording.
// Development tools: Microsoft Playwright (Apache-2.0), Deque axe-core (MPL-2.0); see NOTICE.md.
import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';

const root = fileURLToPath(new URL('..', import.meta.url));
const demo = process.argv.includes('--demo');
assert.ok(!(demo && process.argv.includes('--record')), 'record the played route, not its replay');
const screenshots = await mkdtemp(join(tmpdir(), 'chez-browser-'));
const server = await createServer({ root, logLevel: 'error', server: { host: '127.0.0.1', port: 4175, strictPort: true } });
await server.listen();
let browser;

// This controller uses the package's public input callbacks. It lives only in the test browser.
function installDriver() {
  let scene = 0, firstClock, lastClock, held = new Set(), target = 0, waiting = false, barkAt = -1, noHop = -1;
  window.__chezEnter = (next) => {
    scene = next;
    firstClock = lastClock = undefined;
    held = new Set();
    target = 0;
    waiting = false;
    barkAt = noHop = -1;
    window.__chezScene = next;
    console.log(`CHEZ entered scene ${next}`);
  };
  window.__chezDrive = (world, machine) => {
    window.__chezWorld = world;
    if (scene < 2 || scene > 6 || world.clock === lastClock) return;
    lastClock = world.clock;
    const key = (scan, down) => {
      if (held.has(scan) === down) return;
      if (down) held.add(scan); else held.delete(scan);
      machine.keyboard.inject(scan, down);
    };
    if (firstClock === undefined) { firstClock = world.clock; key(77, true); return; }
    const tick = world.clock - firstClock;
    const x = world.chr.x[0], y = world.chr.y[0] * 20 + world.chr.y[1];
    const car = [77, 83, 84, 80, 78][scene - 2], targets = [24, 43, 64, 70], hop = scene > 2;
    if (scene === 6) {
      if (target < targets.length && !waiting && barkAt < 0 && x >= targets[target] - 4) {
        key(77, false); key(72, false); waiting = true;
      }
      if (waiting && y >= 780) {
        noHop = targets[target] + 2; key(57, true); barkAt = tick; waiting = false; target++;
      }
      if (barkAt >= 0 && tick >= barkAt + 2) key(57, false);
      if (barkAt >= 0 && tick >= barkAt + 12) { key(77, true); barkAt = -1; }
    }
    if (hop && x >= car - 9) key(72, false);
    if (hop && !waiting && barkAt < 0 && x >= noHop && x < car - 9 && tick % 25 === 0) key(72, true);
    if (hop && !waiting && barkAt < 0 && tick % 25 === 3) { key(72, false); key(77, false); key(77, true); }
    if (tick > 700 && x > car) { key(77, false); key(75, true); }
  };
}

try {
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  for (const [width, height] of [[390, 800], [1440, 900], [844, 390], [568, 320]]) {
    for (const colorScheme of ['light', 'dark']) {
      const page = await browser.newPage({ viewport: { width, height }, colorScheme });
      try {
        await page.goto('http://127.0.0.1:4175/');
        const canvas = await page.locator('#engine-canvas').boundingBox();
        const shell = await page.locator('.game-shell').boundingBox();
        assert.ok(canvas.width >= 190 && shell.height <= height, `${width}×${height}: the game must remain usable`);
        for (const selector of ['#start', '#watch-demo']) {
          const action = await page.locator(selector).boundingBox();
          assert.ok(action.y + action.height <= canvas.y + canvas.height, `${selector} must fit inside the game`);
        }
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width, 'no horizontal scroll');
        await page.addScriptTag({ path: join(root, 'node_modules/axe-core/axe.min.js') });
        const violations = await page.evaluate(async () => (await window.axe.run(document, {
          runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
        })).violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target) })));
        assert.deepEqual(violations, [], `${width}×${height} ${colorScheme}: accessibility`);
      } finally { await page.close(); }
    }
  }
  console.log('Layout and accessibility: passed');

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.text().startsWith('CHEZ entered')) console.log(message.text()); });
  await page.addInitScript(installDriver);
  await page.addInitScript((watching) => { window.__chezDemo = watching; }, demo);
  // Add observation hooks to Vite's response; no diagnostics or autoplayer ship in the app.
  await page.route('**/src/main.ts', async (route) => {
    const response = await route.fetch();
    let body = await response.text();
    for (const [before, after] of [
      ['onSession: (session) => {', 'onSession: (session) => { window.__chezSession = session;'],
      ['session.onScene = (scene) => {', 'session.onScene = (scene) => { window.__chezEnter(scene);'],
      ['onFrame: (world) => {', 'onFrame: (world) => { if (!window.__chezDemo) window.__chezDrive(world, current);'],
      ['onPlayEnd: (_score, how) => {', 'onPlayEnd: (_score, how) => { window.__chezEnd = how;'],
    ]) {
      assert.ok(body.includes(before), `browser hook missing: ${before}`);
      body = body.replace(before, after);
    }
    await route.fulfill({ response, body });
  });
  await page.goto('http://127.0.0.1:4175/');
  await page.locator(demo ? '#watch-demo' : '#start').click();
  try {
    await page.waitForFunction(() => window.__chezScene === 1, null, { timeout: 140_000 });
    assert.equal(await page.locator('#stripe-progress').textContent(), '10 / 10');
    assert.equal(await page.locator('#chapter-name').textContent(), 'Curtain call');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: join(screenshots, 'win.png') });
    if (process.argv.includes('--record')) {
      const recording = new Uint8Array(await page.evaluate(() => Array.from(window.__chezSession.rec.save())));
      assert.ok(recording.length > 0 && recording.length < 3000, 'the route must fit Game-Maker recording limits');
      await writeFile(join(root, 'assets/teddy-tour.rec'), recording);
      console.log(`Recorded assets/teddy-tour.rec (${recording.length / 3} input events)`);
    }
    await page.waitForTimeout(8000);
    await page.keyboard.press('Enter');
    if (demo) {
      for (let attempt = 0; attempt < 10 && await page.locator('#status').textContent() !== 'Demo finished'; attempt++) {
        await page.waitForTimeout(1000);
        await page.keyboard.press('Enter');
      }
      assert.equal(await page.locator('#status').textContent(), 'Demo finished');
      assert.equal(await page.locator('#overlay-title').textContent(), 'Your turn, stripe scout!');
      assert.ok(await page.locator('#game-overlay').isVisible(), 'the demo must hand play back to the player');
      assert.ok(await page.locator('#start').isEnabled(), 'the player can start after watching');
    } else await page.waitForFunction(() => window.__chezEnd === 'won', null, { timeout: 15_000 });
    assert.deepEqual(errors, [], 'browser playthrough must have no page errors');
    console.log(`All five chapters and the win ending${demo ? ' in demo playback' : ''}: passed. Screenshot: ${join(screenshots, 'win.png')}`);
  } catch (error) {
    await page.screenshot({ path: join(screenshots, 'failure.png') });
    console.error(await page.evaluate(() => ({ scene: window.__chezScene, x: window.__chezWorld?.chr.x, y: window.__chezWorld?.chr.y })));
    console.error(`Screenshot: ${join(screenshots, 'failure.png')}`);
    throw error;
  }
} finally {
  await browser?.close();
  await server.close();
}

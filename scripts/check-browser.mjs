// Play the complete game through the installed browser engine; optionally save its real input recording.
// Development tools: Microsoft Playwright (Apache-2.0), Deque axe-core (MPL-2.0); see NOTICE.md.
import assert from 'node:assert/strict';
import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import { CHAPTERS } from '../src/chapters.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const demo = process.argv.includes('--demo');
const retry = process.argv.includes('--retry');
const lap = process.argv.includes('--lap');
assert.ok(!(demo && process.argv.includes('--record')), 'record the played route, not its replay');
assert.ok(!(retry && (demo || process.argv.includes('--record'))), 'verify retries separately from a full recording');
assert.ok(!(lap && (retry || demo || process.argv.includes('--record'))), 'verify the vehicle separately from a full recording');
const screenshots = await mkdtemp(join(tmpdir(), 'chez-browser-'));
const server = await createServer({ root, logLevel: 'error', server: { host: '127.0.0.1', port: 4175, strictPort: true } });
await server.listen();
let browser;

// This controller uses the package's public input callbacks. It lives only in the test browser.
function installDriver(chapters) {
  let scene = 0, firstClock, lastClock, held = new Set(), target = 0, waiting = false, barkAt = -1, noHop = -1, skyStop = 0, skyPhase = 'approach', bounce = 0, bouncedAt = -1, honkedAt = -1;
  window.__chezEnter = (next) => {
    scene = next;
    firstClock = lastClock = undefined;
    held = new Set();
    target = 0;
    waiting = false;
    barkAt = noHop = -1;
    skyStop = 0;
    skyPhase = 'approach';
    bounce = 0;
    bouncedAt = honkedAt = -1;
    window.__chezScene = next;
    (window.__chezEntries ??= []).push(next);
    console.log(`CHEZ entered scene ${next}`);
  };
  window.__chezDrive = (world, machine) => {
    window.__chezWorld = world;
    if (scene < 2 || scene >= chapters.length + 2 || world.clock === lastClock) return;
    const info = chapters[scene - 2];
    lastClock = world.clock;
    const key = (scan, down) => {
      if (held.has(scan) === down) return;
      if (down) held.add(scan); else held.delete(scan);
      machine.keyboard.inject(scan, down);
    };
    if (firstClock === undefined) {
      firstClock = world.clock;
      for (const scan of [75, 77, 72, 57]) machine.keyboard.inject(scan, false);
      key(info.mode === 'drive' ? 75 : 77, true);
      return;
    }
    const tick = world.clock - firstClock;
    const x = world.chr.x[0], y = world.chr.y[0] * 20 + world.chr.y[1];
    const car = info.carX, targets = [24, 43, 64, 70], hop = scene > 2;
    if (window.__chezTakeNaps) return;
    if (info.mode === 'drive') {
      if (honkedAt < 0 && x <= 80) { key(57, true); honkedAt = tick; }
      if (honkedAt >= 0 && tick >= honkedAt + 3) key(57, false);
      const ready = bounce === 0 ? x === 66 && world.chr.x[1] === 0 && world.ci.gravx === 0 : x <= [66, 48, 28][bounce];
      if (bounce < 3 && ready) { key(72, true); bouncedAt = tick; bounce++; }
      if (bouncedAt >= 0 && tick >= bouncedAt + 2) { key(72, false); bouncedAt = -1; }
      return;
    }
    if (scene === 7) {
      const stop = [{ lift: 16, land: 20, row: 35 }, { lift: 36, land: 40, row: 33 }, { lift: 56, land: 60, row: 35 }][skyStop];
      if (!stop) return;
      if (skyPhase === 'approach' && x >= stop.lift) { key(77, false); skyPhase = 'rise'; }
      if (skyPhase === 'rise' && y <= stop.row * 20 - 20) { key(77, true); skyPhase = 'fly'; }
      if (skyPhase === 'fly' && x >= stop.land) { key(77, false); skyPhase = 'land'; }
      if (skyPhase === 'land' && y === stop.row * 20) { key(77, true); skyStop++; skyPhase = 'approach'; }
      return;
    }
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
        const notebook = page.locator('.notebook-grid details');
        assert.equal(await notebook.count(), 8);
        await notebook.first().locator('summary').focus();
        await page.keyboard.press('Enter');
        assert.equal(await notebook.first().getAttribute('open'), '', 'notebook opens with the keyboard');
        await notebook.evaluateAll((pages) => pages.forEach((entry) => { entry.open = true; }));
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width, 'no horizontal scroll, including the open notebook');
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
  await page.addInitScript(installDriver, CHAPTERS);
  await page.addInitScript((watching) => { window.__chezDemo = watching; }, demo);
  await page.addInitScript((takingNaps) => { window.__chezTakeNaps = takingNaps; window.__chezRetryTest = takingNaps; }, retry);
  await page.addInitScript((driving) => { window.__chezLapTest = driving; }, lap);
  // Add observation hooks to Vite's response; no diagnostics or autoplayer ship in the app.
  await page.route('**/src/main.ts', async (route) => {
    const response = await route.fetch();
    let body = await response.text();
    for (const [before, after] of [
      ['onSession: (session) => {', `onSession: (session) => { window.__chezSession = session;
        if (window.__chezRetryTest) {
          const title = session.game.scenes[0];
          title.links[0] = { ...title.links[0], toScene: 7, to: { x: 23, y: 39 } };
          title.files[0] = title.files[1] = '';
        } else if (window.__chezLapTest) {
          const title = session.game.scenes[0];
          title.links[0] = { ...title.links[0], toScene: 8, to: { x: 84, y: 39 } };
          title.files[0] = title.files[1] = '';
        }`],
      ['session.onScene = (scene) => {', 'session.onScene = (scene) => { window.__chezEnter(scene);'],
      ['onFrame: (world) => {', 'onFrame: (world) => { window.__chezWorld = world; if (!window.__chezDemo) window.__chezDrive(world, current);'],
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
    if (retry) {
      await page.waitForFunction(() => window.__chezSession?.rec.halted, null, { timeout: 60_000 });
      await page.waitForTimeout(2000);
      await page.screenshot({ path: join(screenshots, 'try-again.png') });
      await page.waitForTimeout(5000);
      for (let attempt = 0; attempt < 15 && !await page.locator('#game-overlay').isVisible(); attempt++) {
        await page.keyboard.press('Enter');
        await page.waitForTimeout(1000);
      }
      assert.equal(await page.evaluate(() => window.__chezEnd), 'lost');
      assert.equal(await page.evaluate(() => window.__chezEntries.filter((scene) => scene === 7).length), 3, 'three naps must use exactly three tries');
      assert.ok((await page.locator('#overlay-text').textContent()).includes('Sky Laundry'));
      assert.equal(await page.locator('#start').textContent(), 'Try this road again');
      assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('the-chez:road')).scene), 7, 'loss keeps the saved road');
      await page.reload();
      assert.equal(await page.locator('#start').textContent(), 'Continue with Teddy', 'reload offers the saved road');
      assert.equal(await page.locator('#chapter-name').textContent(), 'Sky Laundry');
      await page.evaluate(() => { window.__chezTakeNaps = false; window.__chezRetryTest = false; window.__chezScene = 0; window.__chezEnd = undefined; });
      await page.locator('#start').click();
      await page.waitForFunction(() => window.__chezScene !== 0);
      assert.equal(await page.evaluate(() => window.__chezScene), 7, 'retry must resume Sky Laundry');
      await page.waitForFunction(() => window.__chezWorld?.ci.lives === 2);
      assert.equal(await page.locator('#status').textContent(), 'Playing · 3 tries');
      console.log('Nap loss, saved chapter after reload, and three fresh tries: passed');
    }
    if (!lap && !retry) {
      await page.waitForFunction(() => window.__chezScene === 3 && window.__chezWorld?.chr.x[0] >= 16 && window.__chezWorld?.chr.x[0] <= 22, null, { timeout: 90_000 });
      await page.screenshot({ path: join(screenshots, 'wind-kites.png') });
    }
    if (!lap && !retry && !demo) {
      await page.waitForFunction(() => window.__chezScene === 5 && window.__chezWorld?.chr.x[0] === 44 && window.__chezWorld?.chr.x[1] === 0, null, { timeout: 120_000 });
      await page.screenshot({ path: join(screenshots, 'leaf-crossing-wait.png') });
      await page.waitForFunction(() => window.__chezScene === 5 && window.__chezWorld?.chr.x[0] >= 46);
      await page.screenshot({ path: join(screenshots, 'leaf-crossing-go.png') });
    }
    if (!lap) {
      await page.waitForFunction(() => window.__chezScene === 7 && window.__chezWorld?.chr.x[0] >= 20 && window.__chezWorld?.chr.x[0] < 32 && window.__chezWorld?.chr.y[0] === 35, null, { timeout: 210_000 });
      await page.screenshot({ path: join(screenshots, 'sky-laundry.png') });
    }
    await page.waitForFunction(() => window.__chezScene === 8 && window.__chezWorld?.chr.x[0] <= 60 && window.__chezWorld?.chr.x[0] >= 50, null, { timeout: 60_000 });
    assert.equal(await page.locator('#progress-label').textContent(), 'CHEERS');
    assert.equal(await page.locator('#bark').textContent(), 'Honk!');
    assert.equal(await page.locator('#hop').textContent(), 'Bounce ↑');
    await page.screenshot({ path: join(screenshots, 'victory-lap.png') });
    await page.waitForFunction(() => window.__chezScene === 1, null, { timeout: 60_000 });
    assert.equal(await page.locator('#stripe-progress').textContent(), `${CHAPTERS.at(-1).required} / ${CHAPTERS.at(-1).required}`);
    assert.equal(await page.locator('#chapter-name').textContent(), 'Curtain call');
    if (!demo) assert.equal(await page.evaluate(() => localStorage.getItem('the-chez:road')), null, 'winning clears the saved road');
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
      assert.equal(await page.locator('#overlay-title').textContent(), 'Your turn, Teddy!');
      assert.ok(await page.locator('#game-overlay').isVisible(), 'the demo must hand play back to the player');
      assert.ok(await page.locator('#start').isEnabled(), 'the player can start after watching');
    } else await page.waitForFunction(() => window.__chezEnd === 'won', null, { timeout: 15_000 });
    assert.deepEqual(errors, [], 'browser playthrough must have no page errors');
    console.log(`${lap ? 'Victory lap' : retry ? 'Checkpoint recovery' : `All ${CHAPTERS.length} chapters`} and the win ending${demo ? ' in demo playback' : ''}: passed. Screenshot: ${join(screenshots, 'win.png')}`);
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

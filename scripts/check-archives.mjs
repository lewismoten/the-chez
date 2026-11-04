// Verify real archive downloads/imports through Chrome, plus accessible responsive file controls.
// Microsoft Playwright (Apache-2.0) and Deque axe-core (MPL-2.0); see NOTICE.md.
import assert from "node:assert/strict";
import { readFile, mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { chromium } from "playwright-core";
import { build, preview } from "vite";
import { createZip } from "@lewismoten/gamemaker-sandbox-archives/zip";
import {
  newGame,
  serializeGame,
} from "@lewismoten/gamemaker-sandbox-tools/formats/game";
const root = fileURLToPath(new URL("..", import.meta.url));
const scratch = await mkdtemp(join(tmpdir(), "chez-archives-browser-"));
const bytes = await readFile(join(root, "public/hypothesis.zip"));
let server, browser;
try {
  await build({
    root,
    logLevel: "error",
    build: { outDir: scratch, emptyOutDir: true },
  });
  server = await preview({
    root,
    logLevel: "error",
    build: { outDir: scratch },
    preview: { host: "127.0.0.1", port: 4180, strictPort: true },
  });
  browser = await chromium.launch({ headless: true });
  for (const width of [1440, 390])
    for (const colorScheme of ["light", "dark"]) {
      const page = await browser.newPage({
        viewport: { width, height: 900 },
        colorScheme,
      });
      await page.goto("http://127.0.0.1:4180/");
      await page.addScriptTag({
        path: createRequire(import.meta.url).resolve("axe-core/axe.min.js"),
      });
      const violations = await page.evaluate(async () =>
        (await window.axe.run()).violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => n.target),
        })),
      );
      assert.deepEqual(violations, [], `${width}/${colorScheme} accessibility`);
      assert.ok(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        `${width}: no horizontal overflow`,
      );
      for (const selector of ["#download-game", 'label[for="game-archive"]']) {
        const box = await page.locator(selector).boundingBox();
        assert.ok(box.width >= 24 && box.height >= 24);
      }
      await page.locator("#game-archive").focus();
      assert.equal(
        await page
          .locator("#game-archive")
          .evaluate((el) => el === document.activeElement),
        true,
      );
      await page.close();
    }
  const page = await browser.newPage();
  const errors = [],
    requests = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (r) => requests.push(new URL(r.url()).pathname));
  await page.route("**/game/**", (r) => r.abort());
  await page.goto("http://127.0.0.1:4180/");
  const download = page.waitForEvent("download");
  await page.locator("#download-game").click();
  const got = await download;
  assert.equal(got.suggestedFilename(), "hypothesis.zip");
  assert.deepEqual(await readFile(await got.path()), bytes);
  requests.length = 0;
  await page.locator("#start").click();
  await page.waitForFunction(
    () =>
      document.querySelector("#status")?.textContent === "Playing · 3 tries",
  );
  assert.equal(requests.filter((p) => p === "/hypothesis.zip").length, 1);
  assert.deepEqual(
    requests.filter((p) => p.startsWith("/game/")),
    [],
  );
  const stub = Buffer.alloc(1024);
  stub[0] = 77;
  stub[1] = 90;
  for (const [name, buffer] of [
    ["hypothesis.zip", bytes],
    ["stripe.exe", Buffer.concat([stub, bytes])],
  ]) {
    await page.reload();
    await page
      .locator("#game-archive")
      .setInputFiles({ name, mimeType: "application/octet-stream", buffer });
    assert.equal(await page.locator("#play-engine").isEnabled(), true);
    await page.locator("#play-engine").click();
    await page.waitForFunction(
      () =>
        document.querySelector("#chapter-name")?.textContent ===
        "Selected game",
    );
    await page.waitForTimeout(400);
    assert.equal(await page.locator("#status").textContent(), "Playing");
  }
  await page.reload();
  const collection = await createZip([
    { name: "a/alpha.gam", data: serializeGame(newGame("Alpha")) },
    { name: "b/beta.gam", data: serializeGame(newGame("Beta")) },
  ]);
  await page
    .locator("#game-archive")
    .setInputFiles({
      name: "collection.zip",
      mimeType: "application/zip",
      buffer: Buffer.from(collection),
    });
  await page.locator("#play-engine").click();
  await page.waitForFunction(() =>
    document
      .querySelector("#engine-status")
      ?.textContent?.includes("several games"),
  );
  assert.ok(
    !(await page.locator("#engine-status").textContent()).includes(
      "unpackGames",
    ),
  );
  assert.deepEqual(errors, []);
  console.log(
    "Single-file download/playback, ZIP/SFX imports, keyboard controls, and 1440/390 light/dark accessibility passed.",
  );
} finally {
  await browser?.close();
  if (server)
    await new Promise((resolve, reject) =>
      server.httpServer.close((e) => (e ? reject(e) : resolve())),
    );
  await rm(scratch, { recursive: true, force: true });
}

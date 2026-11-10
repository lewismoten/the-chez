// Regression checks for download recovery and pre-read folder budgets; no browser server needed.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { transform } from 'esbuild';
import { CHAPTERS } from '../src/chapters.ts';
const source = (await readFile(new URL('../src/game-files.ts', import.meta.url), 'utf8'))
  .replace('import.meta.env.BASE_URL', JSON.stringify('/'))
  .replaceAll(/from "([^"]+)"/g, (_, name) => `from ${JSON.stringify(import.meta.resolve(name))}`);
const { code } = await transform(source, { loader: 'ts', format: 'esm' });
const { bundledFiles, selectedFiles, MAX_FOLDER_BYTES, MAX_FOLDER_FILES } = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
const bytes = await readFile(new URL('../public/hypothesis.zip', import.meta.url));
const originalFetch = globalThis.fetch;
let requests = 0;
let response;
globalThis.fetch = async () => { requests++; return response(); };
try {
  for (const fail of [
    () => { throw new TypeError('Failed to fetch'); },
    () => new Response('', { status: 503 }),
    () => new Response('<html>Captive portal</html>'),
    () => new Response(bytes.subarray(0, 100)),
  ]) {
    response = fail;
    await assert.rejects(bundledFiles(), /Check your connection and try again/);
  }
  assert.equal(requests, 4, 'each failed load refetches');
  response = () => new Response(bytes);
  const first = await bundledFiles();
  assert.ok(first.mainGame());
  const second = await bundledFiles();
  assert.ok(second.mainGame());
  assert.notEqual(first, second, 'runs get independent game files');
  assert.equal(requests, 5, 'successful bytes are cached');
  let reads = 0;
  const file = (size) => ({ name: 'test.gam', size, arrayBuffer() { reads++; throw new Error('read'); } });
  for (const files of [[file(MAX_FOLDER_BYTES + 1)], [file(MAX_FOLDER_BYTES), file(1)], Array(MAX_FOLDER_FILES + 1).fill(file(0))])
    await assert.rejects(selectedFiles(files), /4,096 files and 128 MiB/);
  assert.equal(reads, 0, 'oversized folders are rejected before reading');
  await assert.rejects(selectedFiles([file(MAX_FOLDER_BYTES)]), /read/);
  assert.ok(reads > 0, 'the exact byte limit is accepted');
  console.log('Loading: offline/HTTP/HTML/truncated ZIP recovery, successful caching, independent files, and folder budgets passed.');
} finally {
  globalThis.fetch = originalFetch;
}

const page = await readFile(new URL('../index.html', import.meta.url), 'utf8');
assert.equal((page.match(new RegExp(`>${CHAPTERS.length} levels<`, 'g')) ?? []).length, 2, 'page level counts match the chapter table');
assert.ok(page.includes(`All ${CHAPTERS.length} levels run`));
const css = await readFile(new URL('../src/style.css', import.meta.url), 'utf8');
assert.ok(!css.includes('fonts.googleapis.com') && !css.includes('fonts.gstatic.com'), 'no external font requests');
for (const family of ['dm-sans', 'space-grotesk']) {
  const font = await readFile(new URL(`../public/fonts/${family}-latin.woff2`, import.meta.url));
  assert.equal(font.subarray(0, 4).toString(), 'wOF2');
  assert.equal(font.readUInt32BE(8), font.length, 'complete WOFF2 file');
  const license = await readFile(new URL(`../public/fonts/${family}-OFL.txt`, import.meta.url), 'utf8');
  assert.ok(license.includes('Copyright') && license.includes('SIL OPEN FONT LICENSE Version 1.1') && license.includes('OTHER DEALINGS IN THE FONT SOFTWARE.'));
}
console.log('Page level counts, self-hosted font files and complete licenses passed.');

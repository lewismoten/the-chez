// Shared by the three page checks: a Vite dev server on a private port, Playwright's bundled Chromium,
// the page's errors collected, and optional source patches to watch the engine from outside.
// Development tools: Microsoft Playwright (Apache-2.0); see NOTICE.md.
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import { realpathSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

/** Runs `body({ page, errors, url })` against a fresh page; `patches` rewrite src/main.ts as it is served. */
export async function withPage({ port, width = 390, height = 800, patches = [], scheme = 'light' }, body) {
  const server = await createServer({ root, logLevel: 'error', server: { host: '127.0.0.1', port, strictPort: true, fs: { allow: [root, dirname(realpathSync(join(root, 'node_modules')))] } } });
  await server.listen();
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width, height }, colorScheme: scheme });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
    if (patches.length)
      await page.route(/\/src\/main\.ts(\?.*)?$/, async (route) => {
        const { 'if-none-match': _a, 'if-modified-since': _b, ...headers } = route.request().headers();
        const response = await route.fetch({ headers });
        let text = await response.text();
        for (const [from, to] of patches) {
          if (!text.includes(from)) throw new Error(`main.ts no longer contains: ${from}`);
          text = text.replace(from, to);
        }
        await route.fulfill({ response, body: text });
      });
    return await body({ page, errors, url: `http://127.0.0.1:${port}/` });
  } finally {
    await browser?.close();
    await server.close();
  }
}

/** Starts a fresh visit that continues at `scene` (the page's own remembered safe entrance). */
export async function continueAt(page, url, scene) {
  await page.goto(url);
  await page.evaluate(async (n) => (await import('/src/checkpoint.ts')).rememberCheckpoint(n), scene);
  await page.reload();
}

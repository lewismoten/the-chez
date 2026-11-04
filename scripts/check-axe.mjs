// Accessibility of the page: axe-core at 1440 and 390 wide, in light and dark, with the road atlas open,
// plus no sideways scrolling at 390. Playwright (Apache-2.0) and axe-core (MPL-2.0); see NOTICE.md.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { withPage } from './page-check.mjs';

const axePath = createRequire(import.meta.url).resolve('axe-core/axe.min.js');
let port = 5431;
for (const width of [1440, 390])
  for (const scheme of ['light', 'dark'])
    await withPage({ port: port++, width, height: width === 390 ? 800 : 900, scheme }, async ({ page, errors, url }) => {
      await page.goto(url);
      await page.locator('#road-atlas summary').click();
      await page.addScriptTag({ path: axePath });
      const { violations } = await page.evaluate(() => window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] }));
      assert.deepEqual(
        violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
        [],
        `axe at ${width} ${scheme}`,
      );
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert.ok(width > 390 || overflow <= 0, `no sideways scroll at 390 (${overflow}px over)`);
      assert.deepEqual(errors, []);
      console.log(`axe ${width} ${scheme}: no violations`);
    });
console.log('Accessibility: passed');

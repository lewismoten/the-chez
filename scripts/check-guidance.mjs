// The road guidance: the level texts for each chapter, the atlas (one entry per level, not per scene) and the tip
// on the page after continuing at the hill, kept inside the game's frame on a phone.
import assert from 'node:assert/strict';
import { CHAPTERS } from '../src/chapters.ts';
import { roadMessage } from '../src/road-guide.ts';
import { continueAt, withPage } from './page-check.mjs';

const [yard, street, uphill, downhill] = CHAPTERS;
assert.equal(roadMessage(yard, 0), yard.mission);
assert.match(roadMessage(yard, 1, true), /1 more thing/);
assert.match(roadMessage(yard, 2), /Both things fetched/);
for (const chapter of [street, uphill, downhill]) {
  assert.equal(roadMessage(chapter, 0), chapter.mission);
  assert.match(roadMessage(chapter, 0, true), /finish is just ahead/);
}
assert.ok(CHAPTERS.every((chapter, index) => chapter.scene === index + 2), 'a chapter sits at its scene number');
assert.ok(CHAPTERS.every((chapter) => (chapter.mode === 'drive') === (chapter.speed > 0)), 'only the car has a speed');

await withPage({ port: 4177 }, async ({ page, errors, url }) => {
  await continueAt(page, url, uphill.scene);
  await page.locator('#road-atlas summary').click();
  assert.equal(await page.locator('#road-atlas-list li').count(), CHAPTERS.filter((chapter) => !chapter.continues).length, 'the atlas lists levels, not scenes');
  await page.locator('#start').click();
  await page.waitForFunction((name) => document.querySelector('#chapter-name').textContent === name, uphill.name);
  assert.equal(await page.locator('#road-tip').textContent(), uphill.mission);
  assert.equal(await page.locator('#stripe-progress').textContent(), uphill.readout);
  assert.equal(await page.locator('#progress-label').textContent(), 'SPEED');
  const shell = await page.locator('.game-shell').boundingBox();
  const tip = await page.locator('#road-tip').boundingBox();
  assert.ok(tip.y >= shell.y && tip.y + tip.height <= shell.y + shell.height, 'the tip stays inside the game frame');
  assert.deepEqual(errors, []);
});
console.log('Road guidance, the atlas by level, and the hill tip on a phone: passed');

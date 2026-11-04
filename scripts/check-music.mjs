// Verify the visible music preference against actual engine song/effect API calls.
// Microsoft Playwright (Apache-2.0); see NOTICE.md.
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('..',import.meta.url));
const server=await createServer({root,logLevel:'error',server:{host:'127.0.0.1',port:4178,strictPort:true}});
await server.listen();let browser;
try {
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:390,height:800}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/src/main.ts',async route=>{
    const response=await route.fetch();let body=await response.text();
    const anchor='const current = new Machine(canvas, files);';assert.ok(body.includes(anchor));
    body=body.replace(anchor,anchor+`
      window.__nativeSongs=[]; window.__effectCalls=0;
      const song=current.audio.playSong.bind(current.audio);
      current.audio.playSong=async bytes=>{window.__nativeSongs.push(Array.from(bytes??[]));return song(bytes)};
      const effect=current.audio.playVoc.bind(current.audio);
      current.audio.playVoc=bytes=>{window.__effectCalls++;return effect(bytes)};
    `);
    await route.fulfill({response,body});
  });
  await page.goto('http://127.0.0.1:4178/');
  const button=page.locator('#music-toggle');
  await button.click();assert.equal(await button.getAttribute('aria-pressed'),'false');
  await page.locator('#start').click();
  await page.waitForFunction(()=>document.querySelector('#status').textContent==='Playing · 3 tries');
  assert.equal(await page.evaluate(()=>window.__nativeSongs.length),0,'muting before Play must suppress intro and chapter songs');
  await button.click();await page.waitForFunction(()=>window.__nativeSongs.length>0);
  const yard=new Uint8Array(await (await page.request.get('http://127.0.0.1:4178/game/yard.cmf')).body());
  assert.deepEqual(await page.evaluate(()=>window.__nativeSongs.at(-1)),Array.from(yard),'enabling music must resume the current chapter');
  await button.click();assert.equal(await button.getAttribute('aria-pressed'),'false');
  const previousEffects=await page.evaluate(()=>window.__effectCalls);
  await page.keyboard.down('Space');await page.waitForTimeout(180);await page.keyboard.up('Space');
  await page.waitForFunction(before=>window.__effectCalls>before,previousEffects);
  await page.evaluate(async()=>{const{rememberCheckpoint}=await import('/src/checkpoint.ts');rememberCheckpoint(3);});
  await page.reload();assert.equal(await button.getAttribute('aria-pressed'),'false','the music preference must survive a reload');
  await page.locator('#start').click();
  await page.waitForFunction(()=>document.querySelector('#chapter-name').textContent==='Maple Street'&&document.querySelector('#status').textContent==='Playing · 3 tries');
  assert.equal(await page.evaluate(()=>window.__nativeSongs.length),0,'a new chapter must respect the saved music preference');
  await button.click();await page.waitForFunction(()=>window.__nativeSongs.length>0);
  const street=new Uint8Array(await(await page.request.get('http://127.0.0.1:4178/game/street.cmf')).body());
  assert.deepEqual(await page.evaluate(()=>window.__nativeSongs.at(-1)),Array.from(street));
  assert.deepEqual(errors,[]);
  console.log('Music on/off, intro mute, current-track resume, persistence, and independent bark effects: passed.');
}finally{await browser?.close();await server.close();}

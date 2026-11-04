// Render the bare red CitiCar for the landing page, with a transparent background.
// PNG/checksum helpers: Lewis Moten, MIT; see NOTICE.md.
import { writeFileSync } from 'node:fs';
import { encodePng, crc32 } from '@lewismoten/gamemaker-sandbox-tools/images';
import { car, palette } from './hypo-art.ts';

const pal = palette(0);
const picture = car('right', 8);
const png = await encodePng({ width: picture.w, height: picture.h, pixels: picture.px, palette: pal });
// Add the indexed transparency entry; 255 is the source drawing's transparent color.
const alpha = new Uint8Array(256).fill(255);
alpha[255] = 0;
const chunk = new Uint8Array(268),
  view = new DataView(chunk.buffer);
view.setUint32(0, 256);
chunk.set([116, 82, 78, 83], 4);
chunk.set(alpha, 8);
view.setUint32(264, crc32(chunk.subarray(4, 264)) >>> 0);
const afterPalette = 8 + 25 + 780;
const out = new Uint8Array(png.length + chunk.length);
out.set(png.subarray(0, afterPalette));
out.set(chunk, afterPalette);
out.set(png.subarray(afterPalette), afterPalette + chunk.length);
writeFileSync(new URL('../public/art/chez-worn.png', import.meta.url), out);
console.log('Rendered the bare red CitiCar with a transparent background.');

// Render the worn car from its measured drawing. PNG/checksum helpers: Lewis Moten, MIT; see NOTICE.md.
import { readFileSync, writeFileSync } from 'node:fs';
import { stripeCar } from './stripe-car.ts';
import { parsePalette, matchColor } from '../../GameMaker/web/src/formats/palette.ts';
import { encodePng } from '../../GameMaker/web/src/assistant/png.ts';
import { crc32 } from '../../GameMaker/web/src/project/zip.ts';
const palette = parsePalette(new Uint8Array(readFileSync(new URL('../../GameMaker/games/teddy/disk/backyard.pal', import.meta.url))));
const c=(r:number,g:number,b:number)=>matchColor(palette,r,g,b);
const red=c(54,11,7),black=c(6,8,10),white=c(63,61,56);
const car=stripeCar({body:[red,red,red],trim:black,glass:[black,white],roof:black,tire:black,hub:white,bumper:black,lamp:white,tail:red,pin:white,rim:white},0,'right',8);
const png=await encodePng({width:car.w,height:car.h,pixels:car.px,palette});
// Add the indexed transparency entry; 255 is the source drawing's transparent color.
const alpha=new Uint8Array(256).fill(255);alpha[255]=0;
const chunk=new Uint8Array(268),view=new DataView(chunk.buffer);
view.setUint32(0,256);chunk.set([116,82,78,83],4);chunk.set(alpha,8);view.setUint32(264,crc32(chunk.subarray(4,264))>>>0);
const afterPalette=8+25+780;
const out=new Uint8Array(png.length+chunk.length);out.set(png.subarray(0,afterPalette));out.set(chunk,afterPalette);out.set(png.subarray(afterPalette),afterPalette+chunk.length);
writeFileSync(new URL('../public/art/chez-worn.png',import.meta.url),out);
console.log('Rendered the worn CitiCar with a transparent background.');

// Build the downloadable DOS game ZIP with portable archive APIs; see NOTICE.md.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { createZip } from "@lewismoten/gamemaker-sandbox-archives/zip";
const root = fileURLToPath(new URL("..", import.meta.url));
const names = JSON.parse(
  readFileSync(join(root, "public/game/manifest.json"), "utf8"),
) as string[];
const entries = names.map((name) => ({
  name,
  data: new Uint8Array(readFileSync(join(root, "public/game", name))),
}));
entries.push(
  {
    name: "license.txt",
    data: new Uint8Array(readFileSync(join(root, "assets/source/LICENSE"))),
  },
  {
    name: "notice.txt",
    data: new Uint8Array(readFileSync(join(root, "NOTICE.md"))),
  },
  {
    name: "readme.txt",
    data: new TextEncoder().encode(
      "STRIPE CHASE\r\n\r\nTeddy has packed an entire adventure into one ZIP. Gwinn packed the packing list.\r\n\r\nKeep all files together. Open STRIPE.GAM with a compatible Game-Maker player,\r\nor choose this ZIP in the browser player. The archive contains game data;\r\nuse the player of your choice. HELP.TXT has the controls.\r\n\r\nSee LICENSE.TXT, NOTICE.TXT, and CREDITS.TXT for credits and licensing.\r\n",
    ),
  },
);
entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
const bytes = await createZip(entries, new Date(2000, 0, 1, 12));
writeFileSync(join(root, "public/stripe.zip"), bytes);
console.log(
  `Built public/stripe.zip (${entries.length} files, ${bytes.length} bytes)`,
);

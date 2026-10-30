// Rebuild and verify a fresh npm consumer with no sibling repository or runtime tools imports.
import assert from "node:assert/strict";
import { cp, mkdtemp, mkdir, readFile, readdir, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { build } from "vite";
const { values } = parseArgs({
  options: { "tools-package": { type: "string" } },
});
const root = fileURLToPath(new URL("..", import.meta.url));
const sandbox = await mkdtemp(join(tmpdir(), "chez-isolation-"));
const consumer = join(sandbox, "consumer");
const excluded = new Set([
  "node_modules",
  ".git",
  "dist",
  "verify-dist",
  ".DS_Store",
]);
const run = (script) =>
  execFileSync("npm", ["run", script], { cwd: consumer, stdio: "inherit" });
async function hashes(dir, prefix = "") {
  const result = {};
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    assert.ok(!entry.isSymbolicLink(), `external asset link: ${entry.name}`);
    const name = join(prefix, entry.name),
      path = join(dir, entry.name);
    if (entry.isDirectory()) Object.assign(result, await hashes(path, name));
    else
      result[name] = createHash("sha256")
        .update(await readFile(path))
        .digest("hex");
  }
  return result;
}
try {
  const pkg = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
  const tools = "@lewismoten/gamemaker-sandbox-tools";
  assert.ok(
    pkg.devDependencies[tools] && !pkg.dependencies[tools],
    "tools must be development-only",
  );
  await mkdir(consumer);
  for (const entry of await readdir(root, { withFileTypes: true })) {
    if (excluded.has(entry.name)) continue;
    assert.ok(!entry.isSymbolicLink(), `external project link: ${entry.name}`);
    await cp(join(root, entry.name), join(consumer, entry.name), {
      recursive: true,
    });
  }
  if (values["tools-package"]) {
    // Override only the scratch consumer when checking an unpublished npm candidate.
    execFileSync(
      "npm",
      [
        "install",
        "--save-dev",
        "--ignore-scripts",
        "--no-audit",
        "--no-fund",
        resolve(values["tools-package"]),
      ],
      { cwd: consumer, stdio: "inherit" },
    );
  }
  execFileSync(
    "npm",
    ["ci", "--include=dev", "--ignore-scripts", "--no-audit", "--no-fund"],
    { cwd: consumer, stdio: "inherit" },
  );
  const before = await hashes(join(consumer, "public"));
  run("build:game");
  run("build:art");
  run("check:game");
  run("check");
  assert.deepEqual(
    await hashes(join(consumer, "public")),
    before,
    "the isolated rebuild must preserve every public byte",
  );
  await rm(join(consumer, "node_modules/@lewismoten/gamemaker-sandbox-tools"), {
    recursive: true,
    force: true,
  });
  let checked = 0;
  await build({
    configFile: false,
    root: consumer,
    logLevel: "error",
    build: { outDir: join(consumer, "verify-dist") },
    plugins: [
      {
        name: "development-tools-runtime-boundary",
        moduleParsed(info) {
          const id = info.id.replaceAll("\\", "/");
          assert.ok(
            !id.includes("/gamemaker-sandbox-tools/"),
            `development tools entered browser graph: ${id}`,
          );
          if (id.includes("/src/") || id.includes("/gamemaker-sandbox-engine/"))
            checked++;
        },
      },
    ],
  });
  assert.ok(checked > 0, "inspect the actual application module graph");
  process.stdout.write(
    `Isolated npm install, byte-identical fixture rebuild, native checks, and browser build with tools removed passed (${checked} runtime modules).\n`,
  );
} finally {
  await rm(sandbox, { recursive: true, force: true });
}

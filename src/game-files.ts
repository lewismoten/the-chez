// Fetch one game ZIP, or read a chosen folder/archive, through the runtime archives package.
import { GameFiles } from "@lewismoten/gamemaker-sandbox-engine";
import { unpackGame, unpackGames } from "@lewismoten/gamemaker-sandbox-archives";
let archive: Promise<ArrayBuffer> | undefined;
let failedBefore = false;
const FETCH_TIMEOUT_MS = 30_000;

class BadDownload extends Error {}

export async function bundledFiles(): Promise<GameFiles> {
  // Only cache bytes after unpacking succeeds and a main game file is found.
  const pending = archive ??= (async () => {
    // A timeout keeps a stalled connection from leaving the page loading forever;
    // a retry skips the browser cache in case a bad copy was stored.
    const response = await fetch(`${import.meta.env.BASE_URL}hypothesis.zip`, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      ...(failedBefore ? { cache: 'reload' as const } : {}),
    });
    if (!response.ok) throw new Error('Game download failed.');
    const bytes = await response.arrayBuffer();
    let files: GameFiles;
    try {
      files = new GameFiles((await unpackGame(bytes, { name: 'hypothesis.zip' })).entries);
    } catch {
      throw new BadDownload();
    }
    if (!files.mainGame()) throw new BadDownload();
    return bytes;
  })();
  try {
    // Unpack afresh: each Machine must receive its own mutable game data.
    return new GameFiles((await unpackGame(await pending, { name: 'hypothesis.zip' })).entries);
  } catch (error) {
    if (archive === pending) archive = undefined;
    failedBefore = true;
    throw new Error(
      error instanceof BadDownload
        ? 'The game download looks damaged. Try again in a moment.'
        : 'Could not load The Stripe Hypothesis. Check your connection and try again.',
    );
  }
}

export const MAX_FOLDER_BYTES = 128 * 1024 * 1024;
export const MAX_ARCHIVE_BYTES = 128 * 1024 * 1024;
export const MAX_FOLDER_FILES = 4096;

export async function selectedFiles(files: File[]): Promise<GameFiles> {
  const isArchive = files.length === 1 && /\.(zip|exe|gmpak|gz)$/i.test(files[0].name);
  // Check metadata before the archive library reads any folder file into memory.
  if (!isArchive && (files.length > MAX_FOLDER_FILES || files.reduce((size, file) => size + file.size, 0) > MAX_FOLDER_BYTES))
    throw new Error('Choose a game folder with at most 4,096 files and 128 MiB in total.');
  if (isArchive && files[0].size > MAX_ARCHIVE_BYTES) throw new Error('Choose a game archive of 128 MiB or less.');
  const input = isArchive ? await files[0].arrayBuffer() : files;
  const games = await unpackGames(input, { name: files[0]?.name });
  if (games.length !== 1)
    throw new Error(
      games.length
        ? "Several games were found. Choose a folder containing one game, or extract the archive and choose one game's folder."
        : "No Game-Maker .GAM file was found in these files.",
    );
  return new GameFiles(games[0].entries);
}

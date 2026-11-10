// Fetch one game ZIP, or read a chosen folder/archive, through the runtime archives package.
import { GameFiles } from "@lewismoten/gamemaker-sandbox-engine";
import { unpackGame, unpackGames } from "@lewismoten/gamemaker-sandbox-archives";
let archive: Promise<ArrayBuffer> | undefined;

export async function bundledFiles(): Promise<GameFiles> {
  // Only retain bytes that have successfully unpacked into a playable game.
  const pending = archive ??= (async () => {
    const response = await fetch(`${import.meta.env.BASE_URL}hypothesis.zip`);
    if (!response.ok) throw new Error('Game download failed.');
    const bytes = await response.arrayBuffer();
    const files = new GameFiles((await unpackGame(bytes, { name: 'hypothesis.zip' })).entries);
    if (!files.mainGame()) throw new Error('No game in download.');
    return bytes;
  })();
  try {
    // Unpack afresh: each Machine must receive its own mutable game data.
    return new GameFiles((await unpackGame(await pending, { name: 'hypothesis.zip' })).entries);
  } catch {
    if (archive === pending) archive = undefined;
    throw new Error('Could not load The Stripe Hypothesis. Check your connection and try again.');
  }
}

export const MAX_FOLDER_BYTES = 128 * 1024 * 1024;
export const MAX_FOLDER_FILES = 4096;

export async function selectedFiles(files: File[]): Promise<GameFiles> {
  const isArchive = files.length === 1 && /\.(zip|exe|gmpak|gz)$/i.test(files[0].name);
  // Check metadata before the archive library reads any folder file into memory.
  if (!isArchive && (files.length > MAX_FOLDER_FILES || files.reduce((size, file) => size + file.size, 0) > MAX_FOLDER_BYTES))
    throw new Error('Choose a game folder with at most 4,096 files and 128 MiB in total.');
  const input = isArchive ? await files[0].arrayBuffer() : files;
  const games = await unpackGames(input, { name: files[0]?.name });
  if (games.length !== 1)
    throw new Error(
      games.length
        ? "This archive contains several games. Extract it and choose one game's folder."
        : "No Game-Maker .GAM file was found in these files.",
    );
  return new GameFiles(games[0].entries);
}

// Fetch one game ZIP, or read a chosen folder/archive, through the runtime archives package.
import { GameFiles } from "@lewismoten/gamemaker-sandbox-engine";
import {
  unpackGame,
  unpackGames,
} from "@lewismoten/gamemaker-sandbox-archives";
let archive: Promise<ArrayBuffer> | undefined;

export async function bundledFiles(): Promise<GameFiles> {
  const bytes = await (archive ??= fetch(`${import.meta.env.BASE_URL}hypothesis.zip`).then((response) => {
    if (!response.ok) throw new Error("Could not load The Stripe Hypothesis.");
    return response.arrayBuffer();
  })).catch((error: unknown) => {
    archive = undefined;
    throw error;
  });
  return new GameFiles(
    (await unpackGame(bytes, { name: "hypothesis.zip" })).entries,
  );
}

export async function selectedFiles(files: File[]): Promise<GameFiles> {
  const input =
    files.length === 1 && /\.(zip|exe|gmpak|gz)$/i.test(files[0].name)
      ? await files[0].arrayBuffer()
      : files;
  const games = await unpackGames(input, { name: files[0]?.name });
  if (games.length !== 1)
    throw new Error(
      games.length
        ? "This archive contains several games. Extract it and choose one game's folder."
        : "No Game-Maker .GAM file was found in these files.",
    );
  return new GameFiles(games[0].entries);
}

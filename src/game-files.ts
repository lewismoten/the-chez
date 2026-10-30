// Fetch one game ZIP, or read a chosen folder/archive, through the runtime archives package.
import { GameFiles } from "@lewismoten/gamemaker-sandbox-engine";
import { unpackGame } from "@lewismoten/gamemaker-sandbox-archives";
let archive: Promise<ArrayBuffer> | undefined;

export async function bundledFiles(): Promise<GameFiles> {
  const bytes = await (archive ??= fetch("/stripe.zip").then((response) => {
    if (!response.ok) throw new Error("Could not load Stripe Chase.");
    return response.arrayBuffer();
  })).catch((error: unknown) => {
    archive = undefined;
    throw error;
  });
  return new GameFiles(
    (await unpackGame(bytes, { name: "stripe.zip" })).entries,
  );
}

export async function selectedFiles(files: File[]): Promise<GameFiles> {
  const input =
    files.length === 1 && /\.(zip|exe|gmpak|gz)$/i.test(files[0].name)
      ? await files[0].arrayBuffer()
      : files;
  return new GameFiles(
    (await unpackGame(input, { name: files[0]?.name })).entries,
  );
}

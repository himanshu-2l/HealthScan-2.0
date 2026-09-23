import { copyFile, mkdir, readdir, stat } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceDirectory = resolve(projectRoot, 'node_modules/@mediapipe/tasks-vision/wasm');
const destinationDirectory = resolve(projectRoot, 'public/models/mediapipe/wasm');

await mkdir(destinationDirectory, { recursive: true });

const assets = (await readdir(sourceDirectory)).filter(
  (fileName) => fileName.endsWith('.js') || fileName.endsWith('.wasm')
);

if (assets.length === 0) {
  throw new Error(`No MediaPipe runtime assets found in ${sourceDirectory}`);
}

for (const fileName of assets) {
  const sourcePath = resolve(sourceDirectory, fileName);
  const destinationPath = resolve(destinationDirectory, fileName);
  const sourceStats = await stat(sourcePath);
  const destinationStats = await stat(destinationPath).catch(() => null);

  if (!destinationStats || destinationStats.size !== sourceStats.size) {
    await copyFile(sourcePath, destinationPath);
  }
}

console.log(`MediaPipe runtime ready (${assets.length} local assets).`);

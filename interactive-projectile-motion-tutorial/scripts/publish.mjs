import { readdir, rm, mkdir, copyFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');

async function copyDir(src, dest) {
  await rm(dest, { recursive: true, force: true });
  await mkdir(dest, { recursive: true });
  const entries = await readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await copyFile(srcPath, destPath);
    }
  }
}

async function main() {
  const entries = await readdir(distDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(distDir, entry.name);
    const destPath = path.join(projectRoot, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await copyFile(srcPath, destPath);
    }
  }
}

main().catch((err) => {
  console.error('Failed to publish dist files:', err);
  process.exitCode = 1;
});

/*
 * @license
 * Copyright (c) 2025 Rljson
 *
 * Use of this source code is governed by terms that can be
 * found in the LICENSE file in the root of this package.
 */

import { promises as fs } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const copyFile = async (src, dest) => {
  await fs.copyFile(src, dest);
};

const createDir = async (dir) => {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (err) {
    if (err.code !== 'EEXIST') throw err;
  }
};

const copyReadmeFiles = async () => {
  const srcDir = join(__dirname, '..');
  const destDir = join(__dirname, '..', 'dist');

  const files = await fs.readdir(srcDir);
  const readmeFiles = files.filter((file) => file.startsWith('README'));

  for (const file of readmeFiles) {
    const srcFile = join(srcDir, file);
    const destFile = join(destDir, file);
    await copyFile(srcFile, destFile);
  }
};

// Ships the use case page and its images, rljson.github.io shows them
const copyUsecaseDoc = async () => {
  const srcDir = join(__dirname, '..', 'doc');
  const destDir = join(__dirname, '..', 'dist', 'doc');
  await createDir(join(destDir, 'img'));
  await copyFile(
    join(srcDir, 'architecture.md'),
    join(destDir, 'architecture.md'),
  );

  const images = await fs.readdir(join(srcDir, 'img'));
  for (const file of images.filter((f) => f.startsWith('usecase-'))) {
    await copyFile(join(srcDir, 'img', file), join(destDir, 'img', file));
  }
};

const main = async () => {
  const srcExample = join(__dirname, '..', 'src', 'example.ts');
  const destExampleDir = join(__dirname, '..', 'dist', 'src');
  const destExample = join(destExampleDir, 'example.ts');

  await createDir(destExampleDir);
  await copyFile(srcExample, destExample);
  await copyReadmeFiles();
  await copyUsecaseDoc();

  console.log('Files copied successfully.');
};

main().catch(console.error);

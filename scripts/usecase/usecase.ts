// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

// Renders doc/architecture.md and the images in doc/img from a real run
// of Edge. build-usecase.ts writes them, test/usecase.spec.ts checks them.

import { mkdir, writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { usecaseFacts } from './usecase-facts.ts';
import { usecaseImages } from './usecase-images.ts';
import { usecaseText } from './usecase-text.ts';

/** The doc folder of the repo */
export const docDir = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'doc',
);

/** Renders the use case page and its images, by path relative to doc */
export const renderUsecase = async (): Promise<Record<string, string>> => {
  const facts = await usecaseFacts();
  const files: Record<string, string> = {
    'architecture.md': usecaseText(facts),
  };
  for (const [name, content] of Object.entries(usecaseImages(facts))) {
    files[`img/${name}`] = content;
  }
  return files;
};

/** Writes the use case page and its images into doc */
export const buildUsecase = async (): Promise<void> => {
  for (const [path, content] of Object.entries(await renderUsecase())) {
    const file = join(docDir, path);
    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, content);
  }
};

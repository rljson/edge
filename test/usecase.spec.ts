// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import { readFile } from 'fs/promises';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

import {
  buildUsecase,
  docDir,
  renderUsecase,
} from '../scripts/usecase/usecase.ts';

import { shouldUpdateGoldens } from './setup/goldens.ts';

describe('the use case page', () => {
  it('matches a real run of Edge', async () => {
    if (shouldUpdateGoldens()) await buildUsecase();

    const files = await renderUsecase();
    for (const [path, content] of Object.entries(files)) {
      const onDisk = await readFile(join(docDir, path), 'utf8').catch(() => '');
      expect(
        onDisk === content,
        `Run »pnpm usecase« and review doc/${path}.`,
      ).toBe(true);
    }
  });

  it('shows real things, no hashes', async () => {
    const files = await renderUsecase();
    const page = files['architecture.md'];
    expect(page).toContain('Velora Amita');
    expect(page).toContain('Hex bolt');
    expect(page).not.toMatch(/_hash|[A-Za-z0-9_-]{22}/);
  });

  it('gives every image a light and a dark mode', async () => {
    const files = await renderUsecase();
    const images = Object.keys(files).filter((p) => p.endsWith('.svg'));
    expect(images.length).toBe(7);
    for (const path of images) {
      expect(files[path]).toContain(
        '@media (prefers-color-scheme: dark){svg.uc{',
      );
      expect(files[path]).not.toMatch(/(fill|stroke)="#/);
    }
  });
});

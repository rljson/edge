// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

// Writes doc/en/architecture.md and the images in doc/en/img from a real run of
// Edge. Run it with »pnpm usecase« after the generator changed.

import { buildUsecase } from './usecase.ts';

await buildUsecase();
console.log('Wrote doc/en/architecture.md and doc/en/img/usecase-*.svg');

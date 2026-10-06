// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import { describe, expect, it } from 'vitest';

import {
  bodyTypeRanks,
  brandRow,
  powerKwOf,
} from '../../src/car-world/brands.ts';
import { modelsOf, vehicles } from '../../src/index.ts';

describe('brandRow(model, modelIndex)', () => {
  const [golf] = modelsOf('Volkswagen').filter((m) => m.model === 'Golf');

  it('describes the model with a power that grows by index', () => {
    expect(brandRow(golf, 2)).toEqual({
      brand: 'Volkswagen',
      model: 'Golf',
      bodyType: 'hatchback',
      fuel: 'petrol',
      powerKw: powerKwOf(golf, 0) + 2 * 15,
    });
  });
});

describe('bodyTypeRanks', () => {
  it('ranks every body type of the vehicles once', () => {
    const used = new Set(vehicles.map((v) => v.bodyType));
    expect(new Set(bodyTypeRanks)).toEqual(used);
    expect(bodyTypeRanks).toHaveLength(used.size);
  });
});

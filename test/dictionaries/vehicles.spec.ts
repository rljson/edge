// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import { describe, expect, it } from 'vitest';

import { manufacturers, modelsOf, vehicles } from '../../src/index.ts';

describe('vehicles', () => {
  it('lists more than 500 models', () => {
    expect(vehicles.length).toBeGreaterThan(500);
  });

  it('gives every manufacturer at least three models with unique names', () => {
    for (const manufacturer of manufacturers) {
      const models = modelsOf(manufacturer.brand);
      expect(models.length, manufacturer.brand).toBeGreaterThanOrEqual(3);
      expect(new Set(models.map((m) => m.model)).size, manufacturer.brand).toBe(
        models.length,
      );
    }
  });

  it('names only brands the manufacturers dictionary knows', () => {
    const brands = new Set(manufacturers.map((m) => m.brand));
    for (const vehicle of vehicles) {
      expect(brands.has(vehicle.brand), vehicle.brand).toBe(true);
    }
  });
});

// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import { describe, expect, it } from 'vitest';

import { cityNamed, manufacturers } from '../../src/index.ts';

describe('manufacturers', () => {
  it('lists more than 150 manufacturers with unique ids and brands', () => {
    expect(manufacturers.length).toBeGreaterThan(150);
    expect(new Set(manufacturers.map((m) => m.id)).size).toBe(
      manufacturers.length,
    );
    expect(new Set(manufacturers.map((m) => m.brand)).size).toBe(
      manufacturers.length,
    );
  });

  it('has a known city and a plausible founding year for every entry', () => {
    for (const manufacturer of manufacturers) {
      expect(
        () => cityNamed(manufacturer.city),
        manufacturer.brand,
      ).not.toThrow();
      expect(cityNamed(manufacturer.city).country).toBe(manufacturer.country);
      expect(manufacturer.founded).toBeGreaterThan(1850);
      expect(manufacturer.founded).toBeLessThan(2030);
      expect(manufacturer.id).toMatch(/^[a-z0-9-]+$/);
    }
  });
});

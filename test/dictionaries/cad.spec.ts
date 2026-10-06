// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import { describe, expect, it } from 'vitest';

import { cadDetails, cadMaterials, cadSystems } from '../../src/index.ts';

describe('cad', () => {
  it('has at least six systems with six unique components each', () => {
    expect(cadSystems.length).toBeGreaterThanOrEqual(6);
    expect(new Set(cadSystems.map((system) => system.id)).size).toBe(
      cadSystems.length,
    );
    for (const system of cadSystems) {
      expect(system.children, system.id).toHaveLength(6);
      expect(new Set(system.children).size, system.id).toBe(6);
    }
  });

  it('has at least six details and materials', () => {
    expect(cadDetails.length).toBeGreaterThanOrEqual(6);
    expect(new Set(cadDetails).size).toBe(cadDetails.length);
    expect(cadMaterials.length).toBeGreaterThanOrEqual(6);
  });
});

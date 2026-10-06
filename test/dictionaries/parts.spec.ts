// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import { describe, expect, it } from 'vitest';

import { assemblies, materialsOf, standardParts } from '../../src/index.ts';

describe('assemblies', () => {
  it('has at least six assemblies with six sub assemblies of six parts', () => {
    expect(assemblies.length).toBeGreaterThanOrEqual(6);
    for (const assembly of assemblies) {
      expect(assembly.subAssemblies, assembly.name).toHaveLength(6);
      for (const sub of assembly.subAssemblies) {
        expect(sub.parts, sub.name).toHaveLength(6);
        expect(new Set(sub.parts).size, sub.name).toBe(6);
      }
    }
  });

  it('knows materials for every category', () => {
    for (const assembly of assemblies) {
      expect(materialsOf[assembly.category], assembly.category).toBeDefined();
      expect(materialsOf[assembly.category].length).toBeGreaterThan(0);
    }
  });
});

describe('standardParts', () => {
  it('has forty standard parts with unique names', () => {
    expect(standardParts).toHaveLength(40);
    expect(new Set(standardParts.map((part) => part.name)).size).toBe(40);
  });
});

// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import { describe, expect, it } from 'vitest';

import {
  maxCarsPerCatalog,
  validateEdgeConfig,
  withDefaults,
} from '../../src/config/config.ts';
import { edgeDefaults, resolveEdgeConfig } from '../../src/index.ts';
import type { EConfig } from '../../src/index.ts';

describe('edgeDefaults()', () => {
  it('returns a fresh copy every time', () => {
    const [a, b] = [edgeDefaults(), edgeDefaults()];
    expect(a).toEqual(b);
    expect(a).not.toBe(b);
    expect(a.layers).not.toBe(b.layers);
  });
});

describe('withDefaults(fallback, overrides)', () => {
  it('keeps the default for undefined values and missing overrides', () => {
    expect([
      withDefaults({ a: 1, b: 2 }, { a: undefined, b: 3 }),
      withDefaults({ a: 1 }, undefined),
    ]).toEqual([{ a: 1, b: 3 }, { a: 1 }]);
  });
});

describe('resolveEdgeConfig(config)', () => {
  it('fills every default into an empty configuration', () => {
    expect(resolveEdgeConfig({})).toEqual(edgeDefaults());
  });

  it('merges partial sections and keeps layers that are off', () => {
    const progress = () => undefined;
    const resolved = resolveEdgeConfig({
      manufacturers: { count: 3 },
      catalogs: { carsPerCatalog: 7, revisions: { count: 2 } },
      layers: { prices: { roundTo: 100 }, parts: false },
      scale: { targetRows: 500 },
      progress,
      progressEvery: 5,
    });

    const defaults = edgeDefaults();
    expect(resolved).toEqual({
      manufacturers: { count: 3, catalogsPerManufacturer: 1 },
      catalogs: {
        carsPerCatalog: 7,
        startYear: 2026,
        revisions: { ...defaults.catalogs.revisions, count: 2 },
      },
      layers: {
        ...defaults.layers,
        prices: { ...defaults.layers.prices, roundTo: 100 },
        parts: false,
      },
      scale: { targetRows: 500 },
      progress,
      progressEvery: 5,
      abortSignal: undefined,
    });
  });

  const invalid: [string, EConfig, string][] = [
    [
      'a manufacturer count of 0',
      { manufacturers: { count: 0 } },
      'Edge: manufacturers.count must be an integer of at least 1, not 0',
    ],
    [
      'a fractional number of catalogs',
      { manufacturers: { catalogsPerManufacturer: 1.5 } },
      'Edge: manufacturers.catalogsPerManufacturer must be an integer of at least 1, not 1.5',
    ],
    ['no cars', { catalogs: { carsPerCatalog: 0 } }, 'catalogs.carsPerCatalog'],
    [
      'more than a million cars per catalog',
      { catalogs: { carsPerCatalog: maxCarsPerCatalog + 1 } },
      'Edge: catalogs.carsPerCatalog must be an integer of 1 to 1000000, not 1000001',
    ],
    [
      'a start year out of range',
      { catalogs: { startYear: 10000 } },
      'Edge: catalogs.startYear must be an integer of 1800 to 9999, not 10000',
    ],
    [
      'a negative revision count',
      { catalogs: { revisions: { count: -1 } } },
      'catalogs.revisions.count',
    ],
    [
      'an add share above 1',
      { catalogs: { revisions: { addShare: 1.5 } } },
      'Edge: catalogs.revisions.addShare must be between 0 and 1, not 1.5',
    ],
    [
      'a negative remove share',
      { catalogs: { revisions: { removeShare: -0.1 } } },
      'catalogs.revisions.removeShare',
    ],
    [
      'a change share that is not a number',
      { catalogs: { revisions: { changeShare: Number.NaN } } },
      'catalogs.revisions.changeShare',
    ],
    [
      'no currencies',
      { layers: { prices: { currencies: [] } } },
      'Edge: layers.prices.currencies must not be empty',
    ],
    [
      'a price range with min above max',
      { layers: { prices: { range: { min: 10, max: 5 } } } },
      'Edge: layers.prices.range needs 0 <= min < max',
    ],
    [
      'a rounding step of 0',
      { layers: { prices: { roundTo: 0 } } },
      'Edge: layers.prices.roundTo must be positive',
    ],
    [
      'a discount share above 1',
      { layers: { prices: { discountShare: 2 } } },
      'layers.prices.discountShare',
    ],
    [
      'no models',
      { layers: { brands: { modelsPerManufacturer: 0 } } },
      'layers.brands.modelsPerManufacturer',
    ],
    [
      'no workshops',
      { layers: { workshops: { perCatalog: 0 } } },
      'layers.workshops.perCatalog',
    ],
    [
      'no owners',
      { layers: { workshops: { ownersPerManufacturer: 0 } } },
      'layers.workshops.ownersPerManufacturer',
    ],
    [
      'a parts depth of 5',
      { layers: { parts: { depth: 5 as 4 } } },
      'Edge: layers.parts.depth must be an integer of 1 to 4, not 5',
    ],
    [
      'a parts fan-out of 7',
      { layers: { parts: { fanOut: 7 } } },
      'layers.parts.fanOut',
    ],
    [
      'a standard parts pool of 41',
      { layers: { parts: { standardPartsPool: 41 } } },
      'Edge: layers.parts.standardPartsPool must be an integer of 1 to 40, not 41',
    ],
    [
      'a CAD depth of 0',
      { layers: { cad: { depth: 0 as 1 } } },
      'layers.cad.depth',
    ],
    [
      'a CAD fan-out of 0',
      { layers: { cad: { fanOut: 0 } } },
      'layers.cad.fanOut',
    ],
    ['a target of 0 rows', { scale: { targetRows: 0 } }, 'scale.targetRows'],
    ['a progress interval of 0', { progressEvery: 0 }, 'progressEvery'],
  ];

  for (const [name, config, message] of invalid) {
    it(`rejects ${name}`, () => {
      expect(() => resolveEdgeConfig(config)).toThrow(message);
    });
  }
});

describe('validateEdgeConfig(config)', () => {
  it('accepts the defaults and a configuration with every layer off', () => {
    const off = edgeDefaults();
    off.layers = {
      prices: false,
      brands: false,
      workshops: false,
      parts: false,
      cad: false,
    };
    expect(() => validateEdgeConfig(edgeDefaults())).not.toThrow();
    expect(() => validateEdgeConfig(off)).not.toThrow();
  });
});

// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import { describe, expect, it } from 'vitest';

import {
  carNoOf,
  carSliceId,
  catalogBaseId,
  countVersions,
  modelCountOf,
  modelIndexOf,
  modelsWithoutBrands,
  planVersions,
  segmentOf,
  segments,
  variantOf,
} from '../../src/car-world/plan.ts';
import { modelsOf, resolveEdgeConfig } from '../../src/index.ts';

describe('segmentOf(catalogIndex)', () => {
  it('cycles through the segments and numbers further rounds', () => {
    expect([
      segmentOf(0),
      segmentOf(segments.length - 1),
      segmentOf(segments.length),
    ]).toEqual(['cars', 'electric', 'cars-2']);
  });
});

describe('catalogBaseId, carSliceId and carNoOf', () => {
  it('build and read the ids', () => {
    expect([
      catalogBaseId('yarant', 1),
      carSliceId('yarant-cars', 17),
      carNoOf('yarant-cars-000017'),
    ]).toEqual(['yarant-vans', 'yarant-cars-000017', 17]);
  });
});

describe('planVersions({ baseId, cars, startYear, revisions })', () => {
  const revisions = {
    count: 2,
    addShare: 0.3,
    removeShare: 0.2,
    changeShare: 0.2,
  };
  const plan = planVersions({
    baseId: 'yarant-cars',
    cars: 6,
    startYear: 2026,
    revisions,
  });
  const ids = (...numbers: number[]) =>
    numbers.map((n) => carSliceId('yarant-cars', n));

  it('lists every car in the first year', () => {
    expect(plan[0]).toEqual({
      year: 2026,
      carIds: ids(1, 2, 3, 4, 5, 6),
      added: ids(1, 2, 3, 4, 5, 6),
      removed: [],
      changed: [],
    });
  });

  it('removes, adds and changes cars by the shares', () => {
    expect(plan[1]).toEqual({
      year: 2027,
      carIds: ids(1, 2, 3, 4, 6, 7, 8),
      added: ids(7, 8),
      removed: ids(5),
      changed: ids(6),
    });
    expect(plan.map((version) => version.carIds.length)).toEqual([6, 7, 8]);
  });

  it('agrees with countVersions', () => {
    expect(countVersions(6, revisions)).toEqual({
      distinctCars: 10,
      priceRows: 12,
      priceRowsPerVersion: [6, 3, 3],
      assignments: 14,
    });
    expect(plan.reduce((sum, version) => sum + version.added.length, 0)).toBe(
      10,
    );
  });
});

describe('modelCountOf(config, models)', () => {
  const models = modelsOf('Yarant');

  it('caps the configured models by the models the brand has', () => {
    const config = resolveEdgeConfig({
      layers: { brands: { modelsPerManufacturer: 99 } },
    });
    expect(modelCountOf(config, models)).toBe(models.length);
  });

  it('uses a fixed number of models when the brands layer is off', () => {
    const config = resolveEdgeConfig({ layers: { brands: false } });
    expect(modelCountOf(config, models)).toBe(modelsWithoutBrands);
  });
});

describe('modelIndexOf({ carNo, initialCars, models, popularity })', () => {
  it('spreads the cars evenly or by a Zipf distribution', () => {
    const indices = (popularity: 'uniform' | 'zipf', cars: number) =>
      Array.from({ length: cars }, (_, i) =>
        modelIndexOf({
          carNo: i + 1,
          initialCars: cars,
          models: 3,
          popularity,
        }),
      );
    expect([indices('uniform', 6), indices('zipf', 10)]).toEqual([
      [0, 1, 2, 0, 1, 2],
      [0, 0, 0, 0, 0, 1, 1, 1, 2, 2],
    ]);
  });
});

describe('variantOf({ sharing, sliceId, model, modelIndex, segment, catalogIndex })', () => {
  const [dovix] = modelsOf('Yarant').filter((m) => m.model === 'Dovix');
  const options = {
    sliceId: 'yarant-cars-000017',
    model: dovix,
    modelIndex: 2,
    segment: 'cars',
    catalogIndex: 3,
  };

  it('returns a variant per car, per model or per catalog', () => {
    expect([
      variantOf({ ...options, sharing: 'perCar' }),
      variantOf({ ...options, sharing: 'perModel' }),
      variantOf({ ...options, sharing: 'perCatalog' }),
    ]).toEqual([
      { code: 'cars-000017', name: 'yarant-cars-000017', offset: 17 },
      { code: 'dovix', name: 'Yarant Dovix', offset: 2 },
      { code: 'cars', name: 'Yarant cars', offset: 3 },
    ]);
  });
});

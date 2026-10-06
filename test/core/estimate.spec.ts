// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import { describe, expect, it } from 'vitest';

import {
  estimateCarWorld,
  fitCarsPerCatalog,
  maxFittedCarsPerCatalog,
} from '../../src/core/estimate.ts';
import { carWorldTableKeys, Edge, resolveEdgeConfig } from '../../src/index.ts';
import type { EConfig, ESharing } from '../../src/index.ts';

describe('estimateCarWorld(config)', () => {
  const rowsOf = (config: EConfig) =>
    estimateCarWorld(resolveEdgeConfig(config)).rowsPerTable;

  it('matches a generated tiny world table by table', async () => {
    const edge = Edge.preset('tiny');
    const { cars, rowsTotal, rowsPerTable } = edge.estimate();
    const { stats } = await edge.generate();

    expect({ cars, rowsTotal, rowsPerTable }).toEqual({
      cars: stats.cars,
      rowsTotal: stats.rowsTotal,
      rowsPerTable: stats.rowsPerTable,
    });
  });

  it('is an upper bound for every table when rows fold', async () => {
    const edge = Edge.preset('small');
    const estimate = edge.estimate();
    const { stats } = await edge.generate();

    const exceeding = carWorldTableKeys.filter(
      (key) => stats.rowsPerTable[key] > estimate.rowsPerTable[key],
    );
    expect(exceeding).toEqual([]);
    expect(estimate.approxBytes).toBeGreaterThan(estimate.rowsTotal * 50);
  });

  it('counts nothing for layers that are off', () => {
    const estimate = estimateCarWorld(
      resolveEdgeConfig({
        layers: {
          prices: false,
          brands: false,
          workshops: false,
          parts: false,
          cad: false,
        },
      }),
    );

    expect(estimate).toEqual({
      cars: 10,
      rowsTotal: 21,
      rowsPerTable: {
        tableCfgs: 17,
        addresses: 1,
        persons: 0,
        workshops: 0,
        prices: 0,
        brands: 0,
        parts: 0,
        cadScenes: 0,
        carIds: 1,
        carPrices: 0,
        carBrands: 0,
        carWorkshops: 0,
        carParts: 0,
        carCad: 0,
        catalogs: 1,
        revisions: 0,
        manufacturers: 1,
      },
      approxBytes: expect.any(Number),
    });
  });

  for (const [sharing, trees] of [
    ['perCar', 10],
    ['perModel', 5],
    ['perCatalog', 1],
  ] as [ESharing, number][]) {
    it(`counts one bill of materials and one scene per ${sharing.slice(3)}`, () => {
      const rows = rowsOf({
        layers: {
          parts: { depth: 1, fanOut: 2, sharing },
          cad: { depth: 1, fanOut: 2, sharing },
        },
      });
      expect([rows.parts, rows.cadScenes]).toEqual([trees * 3, trees * 3]);
    });
  }

  it('adds the standard parts pool at depth 4', () => {
    const rows = rowsOf({
      layers: {
        parts: {
          depth: 4,
          fanOut: 1,
          sharing: 'perCatalog',
          standardPartsPool: 7,
        },
        cad: { depth: 2, fanOut: 3, sharing: 'perCatalog' },
      },
    });
    expect([rows.parts, rows.cadScenes]).toEqual([4 + 7, 1 + 3 + 9]);
  });

  it('counts price variants instead of cars when cars repeat prices', () => {
    const base: EConfig = {
      catalogs: { carsPerCatalog: 5000 },
      layers: {
        brands: { modelsPerManufacturer: 1 },
        parts: false,
        cad: false,
      },
    };
    const discounted: EConfig = {
      ...base,
      layers: { ...base.layers, prices: { discountShare: 0.5 } },
    };
    expect([rowsOf(base).prices, rowsOf(discounted).prices]).toEqual([
      100, 400,
    ]);
  });

  it('counts model years, revisions and price changes', () => {
    const rows = rowsOf({
      catalogs: { carsPerCatalog: 10, revisions: { count: 2 } },
      layers: { brands: false, workshops: false, parts: false, cad: false },
    });
    expect([
      rows.carIds,
      rows.carPrices,
      rows.catalogs,
      rows.revisions,
    ]).toEqual([3, 3, 3, 2]);
    expect(rows.prices).toBe(10 + (2 + 1) + (2 + 2));
  });
});

describe('fitCarsPerCatalog(config, targetRows)', () => {
  const config = resolveEdgeConfig({ layers: { parts: false, cad: false } });
  const rowsFor = (carsPerCatalog: number): number =>
    estimateCarWorld({
      ...config,
      catalogs: { ...config.catalogs, carsPerCatalog },
    }).rowsTotal;

  it('returns the largest number of cars within the rows', () => {
    const cars = fitCarsPerCatalog(config, 200);
    expect([rowsFor(cars) <= 200, rowsFor(cars + 1) > 200]).toEqual([
      true,
      true,
    ]);
  });

  it('returns 1 when even one car exceeds the rows', () => {
    expect(fitCarsPerCatalog(config, 1)).toBe(1);
  });

  it('stops at the most cars it fits when the rows never reach the target', () => {
    const shared = resolveEdgeConfig({ layers: { prices: false } });
    expect(fitCarsPerCatalog(shared, 1_000_000)).toBe(maxFittedCarsPerCatalog);
  });
});

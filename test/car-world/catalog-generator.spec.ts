// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import type { Cake, Layer, Revision, SliceIds } from '@rljson/rljson';
import { describe, expect, it } from 'vitest';

import { ECatalogGenerator } from '../../src/car-world/catalog-generator.ts';
import type { ECatalogCaches } from '../../src/car-world/catalog-generator.ts';
import { EEmitter } from '../../src/core/emitter.ts';
import {
  carWorldTableCfgs,
  carWorldTableKeys,
  EMemorySink,
  modelsOf,
  resolveEdgeConfig,
} from '../../src/index.ts';
import type { ECadMeta, ECarWorld, EConfig } from '../../src/index.ts';

describe('ECatalogGenerator', () => {
  const generate = async (edgeConfig: EConfig, catalogIndex = 0) => {
    const sink = new EMemorySink();
    const emitter = new EEmitter({
      sink,
      rowsTotal: 0,
      progressEvery: 1000,
    });
    const cfgs = carWorldTableCfgs();
    for (const key of carWorldTableKeys) {
      await emitter.table(cfgs[key]);
    }
    const caches: ECatalogCaches = { boms: new Map(), scenes: new Map() };
    const result = await new ECatalogGenerator({
      emitter,
      config: resolveEdgeConfig(edgeConfig),
      manufacturer: {
        index: 0,
        id: 'yarant',
        prefix: 'YAR',
        country: 'DE',
        models: modelsOf('Yarant'),
      },
      catalogIndex,
      caches,
    }).generate();
    const world = sink.toRljson() as ECarWorld;
    return { result, world, caches, emitter };
  };

  const keysOf = (record: object) =>
    Object.keys(record).filter((k) => !k.startsWith('_'));

  describe('generate()', () => {
    it('emits one cake per model year, linked by revisions', async () => {
      const { result, world } = await generate({
        catalogs: {
          carsPerCatalog: 6,
          revisions: {
            count: 2,
            addShare: 0.3,
            removeShare: 0.2,
            changeShare: 0.2,
          },
        },
        layers: { parts: false, cad: false },
      });

      expect({
        cakes: result.cakeRefs.length,
        cars: result.cars,
        ids: (world.catalogs._data as Cake[]).map((cake) => cake.id),
      }).toEqual({
        cakes: 3,
        cars: 10,
        ids: ['yarant-cars-2026', 'yarant-cars-2027', 'yarant-cars-2028'],
      });
      expect(world.revisions._data as Revision[]).toEqual([
        {
          table: 'catalogs',
          predecessor: result.cakeRefs[0],
          successor: result.cakeRefs[1],
          timestamp: Date.UTC(2027, 0, 1),
          id: 'yarant-cars',
          _hash: expect.any(String),
        },
        {
          table: 'catalogs',
          predecessor: result.cakeRefs[1],
          successor: result.cakeRefs[2],
          timestamp: Date.UTC(2028, 0, 1),
          id: 'yarant-cars',
          _hash: expect.any(String),
        },
      ]);
    });

    it('derives slice ids and layers from the year before', async () => {
      const { world } = await generate({
        catalogs: {
          carsPerCatalog: 6,
          revisions: {
            count: 1,
            addShare: 0.3,
            removeShare: 0.2,
            changeShare: 0.2,
          },
        },
        layers: { parts: false, cad: false },
      });

      const [first, second] = world.carIds._data as SliceIds[];
      expect([
        first.add.length,
        first.base,
        second.base,
        second.remove,
      ]).toEqual([6, undefined, first._hash, ['yarant-cars-000005']]);

      const [prices, nextPrices] = world.carPrices._data as Layer[];
      const [brands, nextBrands] = world.carBrands._data as Layer[];
      expect({
        priceBase: nextPrices.base,
        priceRemove: keysOf(nextPrices.remove ?? {}),
        priceAdd: keysOf(nextPrices.add),
        brandRemove: brands.remove,
        brandAdd: keysOf(nextBrands.add),
      }).toEqual({
        priceBase: prices._hash,
        priceRemove: ['yarant-cars-000005'],
        priceAdd: ['yarant-cars-000007', 'yarant-cars-000008', 'yarant-cars-000006'],
        brandRemove: undefined,
        brandAdd: ['yarant-cars-000007', 'yarant-cars-000008'],
      });
    });

    it('leaves out the layers that are off', async () => {
      const { world } = await generate({
        catalogs: { carsPerCatalog: 2 },
        layers: {
          prices: false,
          brands: false,
          workshops: false,
          parts: false,
          cad: false,
        },
      });
      const [cake] = world.catalogs._data as Cake[];
      const tables = [
        'prices',
        'brands',
        'workshops',
        'persons',
        'parts',
        'cadScenes',
      ] as const;
      expect({
        layers: keysOf(cake.layers),
        rows: tables.map((key) => world[key]._data.length),
      }).toEqual({ layers: [], rows: [0, 0, 0, 0, 0, 0] });
    });

    it('shares bills of materials and scenes per model', async () => {
      const { world, caches } = await generate({
        catalogs: { carsPerCatalog: 4 },
        layers: {
          brands: { modelsPerManufacturer: 2 },
          parts: { depth: 1, fanOut: 2, sharing: 'perModel' },
          cad: { depth: 1, fanOut: 2, sharing: 'perModel' },
        },
      });
      expect([
        caches.boms.size,
        caches.scenes.size,
        world.parts._data.length,
      ]).toEqual([2, 2, 2 * 3]);
    });

    for (const linkToParts of [true, false]) {
      it(`builds every bill of materials once per car when CAD links to parts is ${linkToParts}`, async () => {
        const { world, caches, emitter } = await generate({
          catalogs: { carsPerCatalog: 4 },
          layers: {
            brands: false,
            workshops: false,
            parts: { depth: 1, fanOut: 2, sharing: 'perCar' },
            cad: { depth: 1, fanOut: 2, sharing: 'perCar', linkToParts },
          },
        });
        expect({
          sharedCaches: [caches.boms.size, caches.scenes.size],
          rows: [world.parts._data.length, world.cadScenes._data.length],
          duplicates: emitter.rowsProduced - emitter.rowsDone,
        }).toEqual({
          sharedCaches: [0, 0],
          rows: [4 * 3, 4 * 3],
          duplicates: 0,
        });
      });
    }

    it('links no parts into the scenes when the parts layer is off', async () => {
      const { world } = await generate({
        catalogs: { carsPerCatalog: 2 },
        layers: {
          parts: false,
          cad: {
            depth: 1,
            fanOut: 2,
            sharing: 'perCatalog',
            linkToParts: true,
          },
        },
      });
      const links = world.cadScenes._data.map(
        (node) => (node.meta as ECadMeta).partRef,
      );
      expect(links).toEqual([null, null, null]);
    });

    it('names the catalog after its segment', async () => {
      const { world } = await generate(
        {
          catalogs: { carsPerCatalog: 1 },
          layers: { parts: false, cad: false },
        },
        1,
      );
      expect((world.catalogs._data[0] as Cake).id).toBe('yarant-vans-2026');
    });
  });
});

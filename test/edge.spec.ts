// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import type { Rljson, TableKey } from '@rljson/rljson';
import { BaseValidator, Validate } from '@rljson/rljson';
import { describe, expect, it } from 'vitest';

import { carWorldTableKeys, Edge, mergeConfigs } from '../src/index.ts';
import type { EProgress } from '../src/index.ts';

describe('Edge', () => {
  const validate = async (rljson: Rljson) => {
    const validator = new Validate();
    validator.addValidator(new BaseValidator());
    return validator.run(rljson);
  };

  describe('constructor(config)', () => {
    it('fills the defaults', () => {
      expect(new Edge().config.catalogs.carsPerCatalog).toBe(10);
    });

    it('fits the cars per catalog to a target number of rows', () => {
      const edge = new Edge({
        scale: { targetRows: 500 },
        layers: { parts: false, cad: false },
      });
      expect({
        cars: edge.config.catalogs.carsPerCatalog > 1,
        fits: edge.estimate().rowsTotal <= 500,
      }).toEqual({ cars: true, fits: true });
    });
  });

  describe('preset(name, overrides)', () => {
    it('merges the overrides into the preset', () => {
      const edge = Edge.preset('tiny', {
        catalogs: { carsPerCatalog: 3 },
        layers: { parts: { depth: 1 } },
      });
      expect({
        cars: edge.config.catalogs.carsPerCatalog,
        parts: edge.config.layers.parts,
      }).toEqual({
        cars: 3,
        parts: {
          depth: 1,
          fanOut: 2,
          sharing: 'perModel',
          standardPartsPool: 6,
        },
      });
    });
  });

  describe('example', () => {
    it('is the tiny preset', () => {
      expect(Edge.example.config).toEqual(Edge.preset('tiny').config);
    });
  });

  describe('generate()', () => {
    it('yields a valid world whose statistics match the estimate', async () => {
      const edge = Edge.preset('tiny');
      const { world, stats } = await edge.generate();

      expect(await validate(world)).toEqual({});
      expect({
        cars: stats.cars,
        rows: stats.rowsTotal,
        tables: Object.keys(world)
          .filter((key) => !key.startsWith('_'))
          .sort(),
      }).toEqual({
        cars: 5,
        rows: edge.estimate().rowsTotal,
        tables: [...carWorldTableKeys].sort(),
      });
    });

    it('yields the same hashes on every run', async () => {
      const hashesOf = async (edge: Edge) => {
        const { world } = await edge.generate();
        return carWorldTableKeys.map((key) => world[key]._hash);
      };
      const first = await hashesOf(Edge.preset('tiny'));
      const second = await hashesOf(Edge.preset('tiny'));
      const other = await hashesOf(
        Edge.preset('tiny', { catalogs: { carsPerCatalog: 4 } }),
      );
      expect(second).toEqual(first);
      expect(other).not.toEqual(first);
    });

    it('validates a world with model years and standard parts', async () => {
      const { world, stats } = await new Edge({
        catalogs: { carsPerCatalog: 6, revisions: { count: 2 } },
        layers: {
          prices: { discountShare: 0.5, currencies: ['EUR', 'CHF'] },
          brands: { popularity: 'zipf' },
          parts: { depth: 4, fanOut: 2, standardPartsPool: 5 },
          cad: { depth: 4, fanOut: 2 },
        },
      }).generate();

      expect(await validate(world)).toEqual({});
      expect({
        years: world.catalogs._data.length,
        dropsDuplicates: stats.dedupRatio > 0,
      }).toEqual({ years: 3, dropsDuplicates: true });
    });
  });

  describe('run(sink)', () => {
    it('announces every table before its rows and hands over every row', async () => {
      const tables: TableKey[] = [];
      const rowsBeforeTheirTable: TableKey[] = [];
      let rows = 0;
      const stats = await Edge.preset('tiny').run({
        onTable: (table) => void tables.push(table),
        onRow: (table) => {
          rows++;
          if (!tables.includes(table)) rowsBeforeTheirTable.push(table);
        },
      });
      expect({ tables, rows, rowsBeforeTheirTable }).toEqual({
        tables: [...carWorldTableKeys],
        rows: stats.rowsTotal,
        rowsBeforeTheirTable: [],
      });
    });

    it('drops the rows without a sink and reports the progress', async () => {
      const phases: string[] = [];
      const totals = new Set<number>();
      const stats = await Edge.preset('tiny', {
        progressEvery: 10,
        progress: (p: EProgress) => {
          if (phases[phases.length - 1] !== p.phase) phases.push(p.phase);
          totals.add(p.rowsTotal);
        },
      }).run();
      expect({
        rows: stats.rowsTotal,
        totals: [...totals],
        first: phases[0],
        hasParts: phases.includes('parts'),
        last: phases[phases.length - 1],
      }).toEqual({
        rows: 112,
        totals: [112],
        first: 'tableCfgs',
        hasParts: true,
        last: 'manufacturers',
      });
    });

    it('stops when the signal is aborted', async () => {
      const controller = new AbortController();
      const edge = Edge.preset('tiny', {
        abortSignal: controller.signal,
        progressEvery: 20,
        progress: (p: EProgress) => {
          if (p.rowsDone >= 20) controller.abort();
        },
      });
      await expect(edge.run()).rejects.toThrow(
        'Edge: generation aborted after 20 rows',
      );
    });
  });
});

describe('mergeConfigs(base, overrides)', () => {
  it('merges section by section and lets overrides switch layers off and on', () => {
    const merged = mergeConfigs(
      {
        manufacturers: { count: 2 },
        catalogs: { carsPerCatalog: 5, revisions: { count: 1 } },
        layers: { parts: { depth: 2 }, cad: false, prices: { roundTo: 5 } },
      },
      {
        manufacturers: { catalogsPerManufacturer: 3 },
        catalogs: { revisions: { addShare: 0.5 } },
        layers: {
          parts: false,
          cad: { depth: 1 },
          prices: { roundTo: 50 },
          brands: undefined,
        },
        scale: { targetRows: 9 },
      },
    );
    expect(merged).toEqual({
      manufacturers: { count: 2, catalogsPerManufacturer: 3 },
      catalogs: { carsPerCatalog: 5, revisions: { count: 1, addShare: 0.5 } },
      layers: {
        parts: false,
        cad: { depth: 1 },
        prices: { roundTo: 50 },
        brands: undefined,
      },
      scale: { targetRows: 9 },
    });
  });

  it('keeps the base when the overrides have no layers', () => {
    const base = { layers: { parts: { depth: 2 as const } } };
    expect(mergeConfigs(base, {}).layers).toEqual(base.layers);
    expect(mergeConfigs({}, {}).layers).toEqual({});
  });
});

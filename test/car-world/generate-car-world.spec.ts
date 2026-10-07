// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import { describe, expect, it } from 'vitest';

import {
  generateCarWorld,
  prefixOf,
} from '../../src/car-world/generate-car-world.ts';
import { EEmitter } from '../../src/core/emitter.ts';
import {
  EMemorySink,
  manufacturers,
  resolveEdgeConfig,
} from '../../src/index.ts';
import type { ECarWorld } from '../../src/index.ts';

describe('prefixOf(brand)', () => {
  it('takes the first three letters of the brand', () => {
    expect(['Mercedes-Benz', 'Lynk & Co', 'DS'].map(prefixOf)).toEqual([
      'MER',
      'LYN',
      'DS',
    ]);
  });
});

describe('generateCarWorld(config, emitter)', () => {
  it('numbers the manufacturers when they exceed the dictionary', async () => {
    const count = manufacturers.length + 1;
    const config = resolveEdgeConfig({
      manufacturers: { count },
      catalogs: { carsPerCatalog: 1 },
      layers: {
        prices: false,
        brands: false,
        workshops: false,
        parts: false,
        cad: false,
      },
    });
    const sink = new EMemorySink();
    const emitter = new EEmitter({
      sink,
      rowsTotal: 0,
      progressEvery: 1000,
    });
    const { cars } = await generateCarWorld(config, emitter);
    const world = sink.toRljson() as ECarWorld;
    const rows = world.manufacturers._data;

    expect({
      cars,
      manufacturers: rows.length,
      addresses: world.addresses._data.length,
      first: [rows[0].id, rows[0].catalogsRef],
    }).toEqual({
      cars: count,
      manufacturers: count,
      addresses: count,
      first: ['velora', [world.catalogs._data[0]._hash]],
    });
    expect(rows[count - 1]).toMatchObject({
      id: 'velora-2',
      name: 'Velora AG 2',
      brand: 'Velora',
    });
  });
});

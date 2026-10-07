// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import { describe, expect, it } from 'vitest';

import { priceRow } from '../../src/car-world/prices.ts';
import type { EPriceInput } from '../../src/car-world/prices.ts';
import { edgeDefaults, modelsOf } from '../../src/index.ts';
import type { EPricesConfig } from '../../src/index.ts';

describe('priceRow(config, input)', () => {
  const config: Required<EPricesConfig> = {
    ...(edgeDefaults().layers.prices as Required<EPricesConfig>),
    discountShare: 0.25,
  };
  const [amita] = modelsOf('Velora').filter((m) => m.model === 'Amita');
  const [xenade] = modelsOf('Quinis').filter((m) => m.model === 'Xenade');
  const input = (carNo: number, raises = 0): EPriceInput => ({
    model: amita,
    modelIndex: 0,
    carNo,
    year: 2026,
    currency: 'EUR',
    raises,
  });

  it('stays inside the range, rounded, with a discount for a share of cars', () => {
    const rows = Array.from({ length: 40 }, (_, i) =>
      priceRow(config, input(i + 1)),
    );
    const outside = rows.filter(
      ({ amount }) =>
        amount < config.range.min ||
        amount > config.range.max ||
        amount % config.roundTo !== 0,
    );
    expect(outside).toEqual([]);
    expect(rows.filter((row) => row.discountPercent > 0)).toHaveLength(10);
    expect(rows[3]).toEqual({
      amount: expect.any(Number),
      currency: 'EUR',
      validFrom: '2026-01-01',
      discountPercent: 5 * (1 + (4 % 3)),
      taxIncluded: true,
    });
  });

  it('prices an SUV above a hatchback and raises by three percent', () => {
    const cheap = priceRow(config, input(1)).amount;
    const dear = priceRow(config, { ...input(1), model: xenade }).amount;
    const raised = priceRow(config, input(1, 1)).amount;
    expect([dear > cheap, raised]).toEqual([
      true,
      Math.round((cheap * 1.03) / 10) * 10,
    ]);
  });

  it('never exceeds the maximum, however many raises', () => {
    const narrow = { ...config, range: { min: 0, max: 100 }, roundTo: 1 };
    expect(priceRow(narrow, input(1, 1000)).amount).toBe(100);
  });
});

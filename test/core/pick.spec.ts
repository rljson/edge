// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import { describe, expect, it } from 'vitest';

import {
  harmonic,
  inShare,
  padded,
  pick,
  pickMany,
  roundDecimals,
  roundTo,
  slug,
  zipfBucket,
} from '../../src/core/pick.ts';

describe('pick(list, index)', () => {
  it('wraps around the end of the list', () => {
    expect(pick(['a', 'b', 'c'], 4)).toBe('b');
  });

  it('throws on an empty list', () => {
    expect(() => pick([], 0)).toThrow('pick: the list is empty');
  });
});

describe('pickMany(list, offset, count)', () => {
  it('returns count entries from the offset, wrapping around', () => {
    expect(pickMany(['a', 'b', 'c'], 2, 3)).toEqual(['c', 'a', 'b']);
  });
});

describe('inShare(index, share)', () => {
  for (const [share, expected] of [
    [0, 0],
    [0.25, 5],
    [0.5, 10],
    [1, 20],
  ] as const) {
    it(`selects ${expected} of 20 indices for a share of ${share}`, () => {
      const indices = Array.from({ length: 20 }, (_, i) => i);
      expect(indices.filter((i) => inShare(i, share))).toHaveLength(expected);
    });
  }

  it('spreads the selected indices evenly', () => {
    const pattern = Array.from({ length: 8 }, (_, i) => inShare(i, 0.25));
    expect(pattern).toEqual([
      false,
      false,
      false,
      true,
      false,
      false,
      false,
      true,
    ]);
  });
});

describe('harmonic(n)', () => {
  it('sums the reciprocals of 1 to n', () => {
    expect([0, 1, 2, 3].map(harmonic)).toEqual([0, 1, 1.5, 1 + 1 / 2 + 1 / 3]);
  });
});

describe('zipfBucket({ index, count, buckets })', () => {
  it('gives the first bucket the most indices', () => {
    const buckets = Array.from({ length: 10 }, (_, index) =>
      zipfBucket({ index, count: 10, buckets: 3 }),
    );
    expect(buckets).toEqual([0, 0, 0, 0, 0, 1, 1, 1, 2, 2]);
  });

  it('puts an index beyond the count into the last bucket', () => {
    expect(zipfBucket({ index: 99, count: 10, buckets: 3 })).toBe(2);
  });

  it('uses the only bucket when there is one', () => {
    expect(zipfBucket({ index: 3, count: 10, buckets: 1 })).toBe(0);
  });
});

describe('padded(value, width)', () => {
  it('pads with leading zeros and keeps longer numbers', () => {
    expect([padded(17, 6), padded(1234567, 6)]).toEqual(['000017', '1234567']);
  });
});

describe('slug(name)', () => {
  it('turns a name into a kebab case slug of ASCII letters and digits', () => {
    const names = [
      'Lynk & Co',
      'Škoda',
      'Citroën C3 Aircross',
      "Sant'Agata",
      '--x--',
    ];
    expect(names.map(slug)).toEqual([
      'lynk-and-co',
      'skoda',
      'citroen-c3-aircross',
      'sant-agata',
      'x',
    ]);
  });
});

describe('roundTo(value, step)', () => {
  it('rounds to the nearest multiple of the step', () => {
    expect([roundTo(1234, 100), roundTo(1250, 100), roundTo(7, 10)]).toEqual([
      1200, 1300, 10,
    ]);
  });
});

describe('roundDecimals(value, decimals)', () => {
  it('rounds to the given number of decimals', () => {
    expect([roundDecimals(1.23456, 2), roundDecimals(2.71828, 3)]).toEqual([
      1.23, 2.718,
    ]);
  });
});

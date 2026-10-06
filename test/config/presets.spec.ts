// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import { describe, expect, it } from 'vitest';

import { Edge, edgePresetNames, edgePresets } from '../../src/index.ts';

describe('edgePresets', () => {
  it('lists the presets from the smallest to the largest', () => {
    expect(Object.keys(edgePresets)).toEqual([
      'tiny',
      'small',
      'medium',
      'large',
      'xl',
    ]);
    expect([...edgePresetNames]).toEqual(Object.keys(edgePresets));
  });

  it('grows from five cars to twenty million', () => {
    const cars = edgePresetNames.map(
      (name) => Edge.preset(name).estimate().cars,
    );
    expect(cars).toEqual([5, 400, 100000, 200000, 20000000]);
  });

  it('reaches more than twenty million rows with large', () => {
    expect(Edge.preset('large').estimate().rowsTotal).toBeGreaterThan(
      20_000_000,
    );
  });
});

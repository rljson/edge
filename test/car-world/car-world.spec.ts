// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import { describe, expect, it } from 'vitest';

import { carWorldTableKeys } from '../../src/index.ts';

describe('carWorldTableKeys', () => {
  it('names seventeen unique tables, the configurations first and the manufacturers last', () => {
    expect({
      count: carWorldTableKeys.length,
      unique: new Set(carWorldTableKeys).size,
      first: carWorldTableKeys[0],
      last: carWorldTableKeys[carWorldTableKeys.length - 1],
    }).toEqual({
      count: 17,
      unique: 17,
      first: 'tableCfgs',
      last: 'manufacturers',
    });
  });
});

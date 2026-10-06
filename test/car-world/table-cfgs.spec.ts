// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import { throwOnInvalidTableCfg } from '@rljson/rljson';
import { describe, expect, it } from 'vitest';

import { carWorldTableCfgs, carWorldTableKeys } from '../../src/index.ts';

describe('carWorldTableCfgs()', () => {
  const cfgs = carWorldTableCfgs();
  const refOf = (table: keyof typeof cfgs, key: string) =>
    cfgs[table].columns.find((c) => c.key === key)?.ref;

  it('configures every table of the world validly', () => {
    expect(Object.keys(cfgs).sort()).toEqual([...carWorldTableKeys].sort());
    for (const key of carWorldTableKeys) {
      expect(cfgs[key].key, key).toBe(key);
      expect(() => throwOnInvalidTableCfg(cfgs[key]), key).not.toThrow();
    }
  });

  it('makes the manufacturers the root of the world', () => {
    const { isRoot, isHead, isShared, columns } = cfgs.manufacturers;
    expect({
      isRoot,
      isHead,
      isShared,
      hasId: columns.some((c) => c.key === 'id'),
    }).toEqual({
      isRoot: true,
      isHead: true,
      isShared: false,
      hasId: true,
    });
  });

  it('declares the reference columns', () => {
    expect({
      catalogs: refOf('manufacturers', 'catalogsRef'),
      headquarters: refOf('manufacturers', 'headquartersRef'),
      subParts: refOf('parts', 'subPartRefs'),
      owner: refOf('workshops', 'ownerRef'),
      successor: refOf('revisions', 'successor'),
    }).toEqual({
      catalogs: { tableKey: 'catalogs', type: 'cakes' },
      headquarters: { tableKey: 'addresses', type: 'components' },
      subParts: { tableKey: 'parts', type: 'components' },
      owner: { tableKey: 'persons', type: 'components' },
      successor: { tableKey: 'catalogs', type: 'cakes' },
    });
  });

  it('gives every column of its own tables the same long and short title', () => {
    const own = [
      'tableCfgs',
      'addresses',
      'persons',
      'workshops',
      'prices',
      'brands',
      'parts',
      'revisions',
      'manufacturers',
    ] as const;
    const columns = own.flatMap((key) => cfgs[key].columns);
    expect(columns.filter((c) => c.titleLong !== c.titleShort)).toEqual([]);
  });
});

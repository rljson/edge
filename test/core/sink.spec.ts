// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import { hsh } from '@rljson/hash';
import type { TableCfg } from '@rljson/rljson';
import { describe, expect, it } from 'vitest';

import { EMemorySink } from '../../src/index.ts';

describe('EMemorySink', () => {
  const tableCfg = (key: string): TableCfg =>
    hsh<TableCfg>({
      key,
      type: key === 'tableCfgs' ? 'tableCfgs' : 'components',
      columns: [
        { key: '_hash', type: 'string', titleLong: 'Hash', titleShort: 'Hash' },
        { key: 'a', type: 'number', titleLong: 'A', titleShort: 'A' },
      ],
      isHead: false,
      isRoot: false,
      isShared: true,
    });

  describe('toRljson()', () => {
    it('collects the rows into hashed tables that name their configuration', () => {
      const sink = new EMemorySink();
      const things = tableCfg('things');
      const rows = [hsh({ a: 1 }), hsh({ a: 2 })];
      sink.onTable('things', things);
      rows.forEach((row) => sink.onRow('things', row));

      const { things: table } = sink.toRljson();
      expect(table).toEqual({
        _type: 'components',
        _data: rows,
        _tableCfg: things._hash,
        _hash: expect.any(String),
      });
    });

    it('gives the tableCfgs table no configuration reference', () => {
      const sink = new EMemorySink();
      sink.onTable('tableCfgs', tableCfg('tableCfgs'));
      sink.onRow('tableCfgs', tableCfg('things'));

      const { tableCfgs } = sink.toRljson();
      expect(tableCfgs).toEqual({
        _type: 'tableCfgs',
        _data: [tableCfg('things')],
        _hash: expect.any(String),
      });
    });

    it('throws when a table received rows but no configuration', () => {
      const sink = new EMemorySink();
      sink.onRow('things', hsh({ a: 1 }));
      expect(() => sink.toRljson()).toThrow(
        'EMemorySink: onTable was not called for "things"',
      );
    });
  });
});

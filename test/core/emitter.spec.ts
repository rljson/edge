// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import type { Row, TableCfg, TableKey } from '@rljson/rljson';
import { describe, expect, it } from 'vitest';

import { EEmitter } from '../../src/core/emitter.ts';
import type { EEmitterOptions } from '../../src/core/emitter.ts';
import type { EProgress } from '../../src/index.ts';

describe('EEmitter', () => {
  const tableCfg: TableCfg = {
    key: 'things',
    type: 'components',
    columns: [
      { key: '_hash', type: 'string', titleLong: 'Hash', titleShort: 'Hash' },
      { key: 'a', type: 'number', titleLong: 'A', titleShort: 'A' },
    ],
    isHead: false,
    isRoot: false,
    isShared: true,
  };

  const setup = (options: Partial<EEmitterOptions> = {}) => {
    const rows: [TableKey, Row][] = [];
    const tables: [TableKey, TableCfg][] = [];
    const emitter = new EEmitter({
      sink: {
        onRow: (table, row) => void rows.push([table, row]),
        onTable: (table, cfg) => void tables.push([table, cfg]),
      },
      rowsTotal: 10,
      progressEvery: 2,
      ...options,
    });
    return { rows, tables, emitter };
  };

  describe('table(tableCfg)', () => {
    it('hands the hashed configuration to the sink and to tableCfgs', async () => {
      const { emitter, tables, rows } = setup();
      const hashed = await emitter.table(tableCfg);

      expect(hashed._hash).toBeTypeOf('string');
      expect({ tables, rows, counts: emitter.rowsPerTable }).toEqual({
        tables: [['things', hashed]],
        rows: [['tableCfgs', hashed]],
        counts: { things: 0, tableCfgs: 1 },
      });
    });

    it('works with a sink that has no onTable', async () => {
      const emitter = new EEmitter({
        sink: { onRow: () => undefined },
        rowsTotal: 1,
        progressEvery: 1,
      });
      await expect(emitter.table(tableCfg)).resolves.toHaveProperty('_hash');
    });
  });

  describe('emit(table, row)', () => {
    it('hashes the row and hands equal rows to the sink once', async () => {
      const { emitter, rows } = setup();
      const first = await emitter.emit('things', { a: 1 });
      const second = await emitter.emit('things', { a: 1 });
      await emitter.emit('things', { a: 2 });

      expect(first._hash).toBe(second._hash);
      expect({
        values: rows.map(([, row]) => row.a),
        done: emitter.rowsDone,
        produced: emitter.rowsProduced,
        perTable: emitter.rowsPerTable,
      }).toEqual({
        values: [1, 2],
        done: 2,
        produced: 3,
        perTable: { things: 2 },
      });
    });

    it('throws when the signal is aborted', async () => {
      const controller = new AbortController();
      controller.abort();
      const { emitter } = setup({ abortSignal: controller.signal });

      await expect(emitter.emit('things', { a: 1 })).rejects.toThrow(
        'Edge: generation aborted after 0 rows',
      );
    });
  });

  describe('rowsPerTable', () => {
    it('returns a copy that callers cannot change', async () => {
      const { emitter } = setup();
      await emitter.emit('things', { a: 1 });
      emitter.rowsPerTable.things = 99;
      expect(emitter.rowsPerTable).toEqual({ things: 1 });
    });
  });

  describe('phaseIs(phase)', () => {
    it('reports a new phase once, and then every progressEvery rows', async () => {
      const reports: EProgress[] = [];
      const { emitter } = setup({ progress: (p) => reports.push(p) });

      emitter.phaseIs('things');
      emitter.phaseIs('things');
      for (const a of [1, 2, 3]) {
        await emitter.emit('things', { a });
      }

      expect(reports).toEqual([
        { phase: 'things', rowsDone: 0, rowsTotal: 10, table: undefined },
        { phase: 'things', rowsDone: 2, rowsTotal: 10, table: 'things' },
      ]);
    });
  });
});

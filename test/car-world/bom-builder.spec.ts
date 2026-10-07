// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import { describe, expect, it } from 'vitest';

import {
  EBomBuilder,
  standardPartsLevel,
} from '../../src/car-world/bom-builder.ts';
import { EEmitter } from '../../src/core/emitter.ts';
import type { EPart } from '../../src/index.ts';

describe('EBomBuilder', () => {
  const variant = { code: 'dovix', name: 'Yarant Dovix', offset: 1 };

  const build = async (depth: 1 | 2 | 3 | 4) => {
    const rows: EPart[] = [];
    const emitter = new EEmitter({
      sink: { onRow: (_, row) => void rows.push(row as EPart) },
      rowsTotal: 0,
      progressEvery: 1000,
    });
    const bom = await new EBomBuilder({
      emitter,
      config: { depth, fanOut: 2, sharing: 'perModel', standardPartsPool: 6 },
      prefix: 'YAR',
      variant,
    }).build();
    return { rows, bom };
  };

  describe('build()', () => {
    for (const [depth, nodes] of [
      [1, 3],
      [2, 7],
      [3, 15],
    ] as const) {
      it(`builds ${nodes} parts down to level ${depth}`, async () => {
        const { rows, bom } = await build(depth);
        expect({
          rows: rows.length,
          refs: bom.partRefs.length,
          deepest: Math.max(...rows.map((r) => r.level)),
        }).toEqual({ rows: nodes, refs: nodes, deepest: depth });
      });
    }

    it('shares the standard parts of level 4 between the parts', async () => {
      const { rows, bom } = await build(4);
      const standard = rows.filter((r) => r.level === standardPartsLevel);
      expect({
        rows: rows.length,
        standardPartNumbers: standard.every((r) =>
          r.partNumber.startsWith('STD-'),
        ),
        refsCountRepeats: bom.partRefs.length > rows.length,
      }).toEqual({
        rows: 15 + standard.length,
        standardPartNumbers: true,
        refsCountRepeats: true,
      });
      expect(standard.length).toBeLessThanOrEqual(6);
    });

    it('puts the bill of materials first and numbers parts before their sub parts', async () => {
      const { rows, bom } = await build(2);
      const root = rows.find((r) => r._hash === bom.rootRef) as EPart;
      expect(bom.partRefs[0]).toBe(bom.rootRef);
      expect(root).toEqual({
        name: 'Bill of materials Yarant Dovix',
        partNumber: 'YAR-DOVIX-BOM',
        category: 'bom',
        level: 0,
        quantity: 1,
        weightKg: expect.any(Number),
        material: null,
        subPartRefs: rows.filter((r) => r.level === 1).map((r) => r._hash),
        _hash: bom.rootRef,
      });
      expect(
        rows.filter((r) => r.level === 1).map((r) => r.partNumber),
      ).toEqual(['YAR-DOVIX-1-0001', 'YAR-DOVIX-1-0004']);
    });
  });
});

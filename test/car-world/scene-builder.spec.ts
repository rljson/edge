// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import type { Tree } from '@rljson/rljson';
import { describe, expect, it } from 'vitest';

import { ESceneBuilder } from '../../src/car-world/scene-builder.ts';
import { EEmitter } from '../../src/core/emitter.ts';
import type { ECadMeta } from '../../src/index.ts';

describe('ESceneBuilder', () => {
  const variant = { code: 'a4', name: 'Audi A4', offset: 1 };
  const meta = (row: Tree) => row.meta as ECadMeta;

  const build = async (
    depth: 1 | 2 | 3 | 4,
    { linkToParts = true, partRefs = ['p1', 'p2', 'p3'] } = {},
  ) => {
    const rows: Tree[] = [];
    const emitter = new EEmitter({
      sink: { onRow: (_, row) => void rows.push(row as Tree) },
      rowsTotal: 0,
      progressEvery: 1000,
    });
    const root = await new ESceneBuilder({
      emitter,
      config: { depth, fanOut: 2, sharing: 'perModel', linkToParts },
      variant,
      partRefs,
    }).build();
    return { rows, root };
  };

  describe('build()', () => {
    for (const [depth, nodes] of [
      [1, 3],
      [2, 7],
      [3, 15],
      [4, 31],
    ] as const) {
      it(`builds ${nodes} nodes down to level ${depth}`, async () => {
        const { rows, root } = await build(depth);
        const scene = rows.find((r) => r._hash === root) as Tree;
        expect({
          nodes: rows.length,
          scene: [scene.id, scene.isParent, scene.children?.length],
          variants: [...new Set(rows.map((r) => meta(r).variant))],
        }).toEqual({ nodes, scene: ['scene', true, 2], variants: ['Audi A4'] });
      });
    }

    it('links every mesh to a part and no group', async () => {
      const { rows } = await build(2);
      const summary = (row: Tree) => [
        meta(row).type,
        meta(row).partRef !== null,
      ];
      expect(rows.filter((r) => !r.isParent).map(summary)).toEqual(
        Array(4).fill(['mesh', true]),
      );
      expect(rows.filter((r) => r.isParent).map(summary)).toEqual(
        Array(3).fill(['group', false]),
      );
    });

    it('leaves the part link empty when linking is off or no parts exist', async () => {
      const off = await build(1, { linkToParts: false });
      const none = await build(1, { partRefs: [] });
      const links = [...off.rows, ...none.rows].map((r) => meta(r).partRef);
      expect(links).toEqual(Array(6).fill(null));
    });

    it('gives siblings unique ids at every depth', async () => {
      const { rows } = await build(4);
      const byHash = new Map(rows.map((r) => [r._hash, r]));
      const repeated = rows
        .filter((r) => r.isParent)
        .filter((parent) => {
          const ids = (parent.children as string[]).map(
            (ref) => byHash.get(ref)?.id,
          );
          return new Set(ids).size !== ids.length;
        });
      expect(repeated).toEqual([]);
    });
  });
});

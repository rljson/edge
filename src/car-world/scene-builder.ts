// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import type { Tree } from '@rljson/rljson';

import type { ECadConfig } from '../config/config.ts';
import type { EEmitter } from '../core/emitter.ts';
import { pick, pickMany, roundDecimals } from '../core/pick.ts';
import { cadDetails, cadMaterials, cadSystems } from '../dictionaries/cad.ts';
import type { ECadSystem } from '../dictionaries/cad.ts';

import type { ECadMeta } from './car-world.ts';
import type { EVariant } from './plan.ts';

// #############################################################################
/** What a scene builder needs */
export interface ESceneBuilderOptions {
  /** Receives the rows */
  emitter: EEmitter;

  /** The CAD layer configuration */
  config: Required<ECadConfig>;

  /** Who the scene belongs to */
  variant: EVariant;

  /** The parts of the variant's bill of materials, for linking meshes */
  partRefs: readonly string[];
}

// .............................................................................
/** How the nodes of a scene are laid out, in meters */
const layout = { xStep: 0.5, yStep: 0.3 } as const;

/** How many vertices a mesh has: a minimum plus a spread by index */
const vertexSpread = { min: 500, range: 20000, stride: 137 } as const;

/** Base, variants and step of the width, height and depth of a node */
const boundsSpread = [
  { base: 0.5, variants: 4, step: 0.25 },
  { base: 0.3, variants: 3, step: 0.2 },
  { base: 0.4, variants: 5, step: 0.1 },
] as const;

/** The level whose detail names start after the names of the level above */
const shiftedDetailLevel = 4;

// .............................................................................
/**
 * Returns the width, height and depth of the node with an index.
 * @param index - The index of the node within the scene
 */
const boundsOf = (index: number): number[] =>
  boundsSpread.map(({ base, variants, step }) =>
    roundDecimals(base + (index % variants) * step, 2),
  );

// #############################################################################
/**
 * Emits the scene of a variant as a tree, from the meshes up.
 *
 * Every node carries the variant in its meta data, so two variants never
 * share a node. Nodes are numbered in the order they are emitted, children
 * before their group. Build once per instance.
 */
export class ESceneBuilder {
  /**
   * Constructor
   * @param options - The emitter, the CAD layer, the variant and its parts
   */
  constructor(private readonly options: ESceneBuilderOptions) {}

  // ...........................................................................
  /** Emits the scene and returns the hash of its root */
  async build(): Promise<string> {
    const { config, variant } = this.options;
    const systems: string[] = [];
    for (const system of pickMany(cadSystems, variant.offset, config.fanOut)) {
      systems.push(await this.system(system));
    }
    return this.group('scene', 0, systems);
  }

  // ######################
  // Private
  // ######################

  private index = 0;

  private async system(system: ECadSystem): Promise<string> {
    if (this.options.config.depth < 2) {
      return this.mesh(system.id, 1);
    }
    return this.group(system.id, 1, await this.components(system));
  }

  private async components(system: ECadSystem): Promise<string[]> {
    const { depth, fanOut } = this.options.config;
    const result: string[] = [];
    for (const id of pickMany(system.children, 0, fanOut)) {
      result.push(
        depth > 2
          ? await this.group(id, 2, await this.details(id, 3))
          : await this.mesh(id, 2),
      );
    }
    return result;
  }

  private async details(parentId: string, level: number): Promise<string[]> {
    const { depth, fanOut } = this.options.config;
    const offset = level === shiftedDetailLevel ? fanOut : 0;
    const result: string[] = [];
    for (const name of pickMany(cadDetails, offset, fanOut)) {
      const id = `${parentId}-${name}`;
      result.push(
        level < depth
          ? await this.group(id, level, await this.details(id, level + 1))
          : await this.mesh(id, level),
      );
    }
    return result;
  }

  private group(id: string, level: number, children: string[]) {
    return this.node({
      id,
      isParent: true,
      meta: this.meta('group', level),
      children,
    });
  }

  private mesh(id: string, level: number): Promise<string> {
    return this.node({
      id,
      isParent: false,
      meta: this.meta('mesh', level),
      children: null,
    });
  }

  private async node(row: Tree): Promise<string> {
    return (await this.options.emitter.emit('cadScenes', row))._hash;
  }

  private meta(type: 'group' | 'mesh', level: number): ECadMeta {
    const i = this.index++;
    const isMesh = type === 'mesh';
    return {
      type,
      variant: this.options.variant.name,
      transform: {
        position: [
          roundDecimals(i * layout.xStep, 2),
          roundDecimals(level * layout.yStep, 2),
          0,
        ],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      },
      material: isMesh ? pick(cadMaterials, i) : null,
      vertices: isMesh
        ? vertexSpread.min + ((i * vertexSpread.stride) % vertexSpread.range)
        : null,
      boundsM: boundsOf(i),
      partRef: isMesh ? this.partRefOf(i) : null,
    };
  }

  private partRefOf(index: number): string | null {
    const { config, partRefs } = this.options;
    return config.linkToParts && partRefs.length > 0
      ? pick(partRefs, index)
      : null;
  }
}

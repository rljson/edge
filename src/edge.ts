// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import type { ECarWorld } from './car-world/car-world.ts';
import { generateCarWorld } from './car-world/generate-car-world.ts';
import { resolveEdgeConfig } from './config/config.ts';
import type {
  EConfig,
  ELayersConfig,
  EResolvedConfig,
} from './config/config.ts';
import { edgePresets } from './config/presets.ts';
import type { EPresetName } from './config/presets.ts';
import { EEmitter } from './core/emitter.ts';
import { estimateCarWorld, fitCarsPerCatalog } from './core/estimate.ts';
import type { EEstimate } from './core/estimate.ts';
import { EMemorySink } from './core/sink.ts';
import type { ESink } from './core/sink.ts';

// #############################################################################
/** What a run produced */
export interface EStats extends EEstimate {
  /** How long the run took, in milliseconds */
  durationMs: number;

  /** The share of produced rows that equalled an earlier row and were dropped */
  dedupRatio: number;
}

// #############################################################################
/** What the statistics of a run derive from */
interface ERunResult {
  estimate: EEstimate;
  emitter: EEmitter;
  cars: number;
  start: number;
}

// .............................................................................
/**
 * Returns the configuration with the cars per catalog fitted to the target
 * number of rows, or the configuration itself when it has no target.
 * @param config - The resolved configuration
 */
const fitToTarget = (config: EResolvedConfig): EResolvedConfig => {
  const { targetRows } = config.scale;
  if (targetRows === null) {
    return config;
  }
  const carsPerCatalog = fitCarsPerCatalog(config, targetRows);
  return { ...config, catalogs: { ...config.catalogs, carsPerCatalog } };
};

// .............................................................................
/**
 * Returns the statistics of a run.
 * @param result - The estimate, the emitter, the cars and the start time
 */
const statsOf = (result: ERunResult): EStats => {
  const { estimate, emitter, cars, start } = result;
  return {
    ...estimate,
    cars,
    rowsTotal: emitter.rowsDone,
    rowsPerTable: emitter.rowsPerTable,
    durationMs: performance.now() - start,
    dedupRatio: 1 - emitter.rowsDone / emitter.rowsProduced,
  };
};

// #############################################################################
/**
 * Edge, the example data generator for Rljson.
 *
 * Edge builds a car world: manufacturers with catalogs of cars, and for every
 * car a price, a brand, a workshop, a bill of materials and a CAD scene. The
 * world uses components, slice ids, layers, cakes, trees, revisions and table
 * configurations. Nothing is random: the same configuration yields the same
 * data and the same hashes, everywhere.
 */
export class Edge {
  /**
   * Constructor
   * @param config - The configuration; every field has a default
   */
  constructor(config: EConfig = {}) {
    this.config = fitToTarget(resolveEdgeConfig(config));
  }

  // ...........................................................................
  /**
   * Creates a generator from a preset.
   * @param name - tiny, small, medium, large or xl
   * @param overrides - Settings that replace parts of the preset
   */
  static preset(name: EPresetName, overrides: EConfig = {}): Edge {
    return new Edge(mergeConfigs(edgePresets[name], overrides));
  }

  // ...........................................................................
  /** Returns an example instance for test purposes: the tiny preset */
  static get example(): Edge {
    return Edge.preset('tiny');
  }

  // ...........................................................................
  /** Calculates how big the world will be, without generating a row */
  estimate(): EEstimate {
    return estimateCarWorld(this.config);
  }

  // ...........................................................................
  /**
   * Generates the world in memory and returns it with the statistics of the
   * run. This is the default way to use Edge and fits worlds up to the medium
   * preset.
   */
  async generate(): Promise<{ world: ECarWorld; stats: EStats }> {
    const sink = new EMemorySink();
    const stats = await this.run(sink);
    return { world: sink.toRljson() as ECarWorld, stats };
  }

  // ...........................................................................
  /**
   * Generates the world and hands every row to a sink, in the order of the
   * references. Nothing is kept. Without a sink the rows are dropped, which
   * serves benchmarks and progress tests.
   * @param sink - Receives the rows
   */
  async run(sink: ESink = { onRow: () => undefined }): Promise<EStats> {
    const { progressEvery, progress, abortSignal } = this.config;
    const estimate = this.estimate();
    const rowsTotal = estimate.rowsTotal;
    const emitter = new EEmitter({
      sink,
      rowsTotal,
      progressEvery,
      progress,
      abortSignal,
    });
    const start = performance.now();
    const { cars } = await generateCarWorld(this.config, emitter);
    return statsOf({ estimate, emitter, cars, start });
  }

  // ...........................................................................
  /** The configuration with every default filled in */
  readonly config: EResolvedConfig;
}

// .............................................................................
/**
 * Merges the configuration of one layer: false switches it off, an object
 * extends the existing settings.
 * @param existing - The layer configuration to start from
 * @param value - The layer configuration that overrides it
 */
const mergeLayer = <T extends object>(
  existing: T | false | undefined,
  value: T | false | undefined,
): T | false | undefined =>
  value === false || value === undefined || existing === false
    ? value
    : { ...existing, ...value };

// .............................................................................
/**
 * Merges the layer sections of two configurations.
 * @param base - The layers to start from
 * @param overrides - The layers that replace parts of them
 */
const mergeLayers = (
  base: ELayersConfig = {},
  overrides: ELayersConfig = {},
): ELayersConfig => {
  const result: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(overrides)) {
    result[key] = mergeLayer(result[key] as object | false | undefined, value);
  }
  return result as ELayersConfig;
};

// .............................................................................
/**
 * Merges overrides into a configuration, section by section.
 * @param base - The configuration to start from
 * @param overrides - The settings that replace parts of it
 */
export const mergeConfigs = (base: EConfig, overrides: EConfig): EConfig => ({
  ...base,
  ...overrides,
  manufacturers: { ...base.manufacturers, ...overrides.manufacturers },
  catalogs: {
    ...base.catalogs,
    ...overrides.catalogs,
    revisions: {
      ...base.catalogs?.revisions,
      ...overrides.catalogs?.revisions,
    },
  },
  layers: mergeLayers(base.layers, overrides.layers),
  scale: { ...base.scale, ...overrides.scale },
});

// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import type { TableKey } from '@rljson/rljson';

import { standardParts } from '../dictionaries/parts.ts';

// #############################################################################
/** Who shares a bill of materials or a CAD scene */
export type ESharing = 'perCar' | 'perModel' | 'perCatalog';

// #############################################################################
/** The prices layer */
export interface EPricesConfig {
  /** The currencies; each catalog uses one of them. Default ['EUR'] */
  currencies?: string[];

  /** The range of the prices. Default 5 000 to 150 000 */
  range?: { min: number; max: number };

  /** Prices are rounded to a multiple of this. Default 10 */
  roundTo?: number;

  /** The share of cars with a discount, between 0 and 1. Default 0 */
  discountShare?: number;
}

// #############################################################################
/** The brands layer */
export interface EBrandsConfig {
  /** How many models of a manufacturer the cars use. Default 5 */
  modelsPerManufacturer?: number;

  /** How the cars spread over the models. Default 'uniform' */
  popularity?: 'uniform' | 'zipf';
}

// #############################################################################
/** The workshops layer */
export interface EWorkshopsConfig {
  /** How many workshops serve a catalog. Default 10 */
  perCatalog?: number;

  /** How many persons own the workshops of a manufacturer. Default 5 */
  ownersPerManufacturer?: number;
}

// #############################################################################
/** The parts layer: bills of materials */
export interface EPartsConfig {
  /** Levels below the bill of materials, 1 to 4. Default 4 */
  depth?: 1 | 2 | 3 | 4;

  /** Sub parts per part, 1 to 6. Default 3 */
  fanOut?: number;

  /** Who shares a bill of materials. Default 'perModel' */
  sharing?: ESharing;

  /** How many distinct standard parts the lowest level uses, 1 to 40. Default 20 */
  standardPartsPool?: number;
}

// #############################################################################
/** The CAD layer: scenes as trees */
export interface ECadConfig {
  /** Levels below the scene, 1 to 4. Default 3 */
  depth?: 1 | 2 | 3 | 4;

  /** Children per group, 1 to 6. Default 4 */
  fanOut?: number;

  /** Who shares a scene. Default 'perModel' */
  sharing?: ESharing;

  /** Whether a mesh refers to a part of the bill of materials. Default true */
  linkToParts?: boolean;
}

// #############################################################################
/** The layers of every catalog. A layer set to false is left out. */
export interface ELayersConfig {
  /** The prices of the cars */
  prices?: EPricesConfig | false;

  /** The brands and models of the cars */
  brands?: EBrandsConfig | false;

  /** The workshops that service the cars */
  workshops?: EWorkshopsConfig | false;

  /** The bills of materials of the cars */
  parts?: EPartsConfig | false;

  /** The CAD scenes of the cars */
  cad?: ECadConfig | false;
}

// #############################################################################
/** Further model years of every catalog */
export interface ERevisionsConfig {
  /** How many model years follow the first one. Default 0 */
  count?: number;

  /** The share of cars a model year adds, between 0 and 1. Default 0.2 */
  addShare?: number;

  /** The share of cars a model year removes, between 0 and 1. Default 0.1 */
  removeShare?: number;

  /** The share of cars whose price a model year changes, between 0 and 1. Default 0.2 */
  changeShare?: number;
}

// #############################################################################
/** The progress of a run */
export interface EProgress {
  /** The phase of the run, e.g. the table being generated */
  phase: string;

  /** The rows handed to the sink so far */
  rowsDone: number;

  /** The rows the run produces at most, from the estimate */
  rowsTotal: number;

  /** The table of the row that triggered the report, if any */
  table?: TableKey;
}

// #############################################################################
/**
 * The configuration of a car world.
 *
 * Every field has a default. Nothing is random: the same configuration yields
 * the same data and the same hashes, on every machine.
 */
export interface EConfig {
  /** The manufacturers, the entry point of the world */
  manufacturers?: {
    /** How many manufacturers. Default 1 */
    count?: number;

    /** How many catalogs each manufacturer has. Default 1 */
    catalogsPerManufacturer?: number;
  };

  /** The catalogs: cakes whose slices are cars */
  catalogs?: {
    /** How many cars a catalog lists, up to a million. Default 10 */
    carsPerCatalog?: number;

    /** The model year of the first version of every catalog. Default 2026 */
    startYear?: number;

    /** Further model years */
    revisions?: ERevisionsConfig;
  };

  /** The layers of every catalog. A layer set to false is left out. */
  layers?: ELayersConfig;

  /** Lets Edge choose the cars per catalog for a number of rows */
  scale?: {
    /** The number of rows the world should have at most; null for no target */
    targetRows?: number | null;
  };

  /** Receives the progress of a run */
  progress?: (progress: EProgress) => void;

  /** Report progress after every this many rows. Default 1000 */
  progressEvery?: number;

  /** Stops a run when aborted */
  abortSignal?: AbortSignal;
}

// #############################################################################
/** The layers with every default filled in; a layer that is off stays false */
export interface EResolvedLayers {
  prices: Required<EPricesConfig> | false;
  brands: Required<EBrandsConfig> | false;
  workshops: Required<EWorkshopsConfig> | false;
  parts: Required<EPartsConfig> | false;
  cad: Required<ECadConfig> | false;
}

// #############################################################################
/** The configuration with every default filled in */
export interface EResolvedConfig {
  manufacturers: { count: number; catalogsPerManufacturer: number };
  catalogs: {
    carsPerCatalog: number;
    startYear: number;
    revisions: Required<ERevisionsConfig>;
  };
  layers: EResolvedLayers;
  scale: { targetRows: number | null };
  progress?: (progress: EProgress) => void;
  progressEvery: number;
  abortSignal?: AbortSignal;
}

// #############################################################################
/** The layers with their defaults, none of them off */
type EDefaultLayers = {
  [K in keyof EResolvedLayers]: Exclude<EResolvedLayers[K], false>;
};

// .............................................................................
/** The deepest level below a bill of materials or a scene */
export const maxDepth = 4;

/** The most children a part or a group has: the dictionaries list six */
export const maxFanOut = 6;

/** The most cars a catalog may list */
export const maxCarsPerCatalog = 1_000_000;

/** The model years a catalog may start with */
const modelYears = { min: 1800, max: 9999 } as const;

// .............................................................................
/** Returns the defaults of the layers */
const defaultLayers = (): EDefaultLayers => ({
  prices: {
    currencies: ['EUR'],
    range: { min: 5000, max: 150000 },
    roundTo: 10,
    discountShare: 0,
  },
  brands: { modelsPerManufacturer: 5, popularity: 'uniform' },
  workshops: { perCatalog: 10, ownersPerManufacturer: 5 },
  parts: { depth: 4, fanOut: 3, sharing: 'perModel', standardPartsPool: 20 },
  cad: { depth: 3, fanOut: 4, sharing: 'perModel', linkToParts: true },
});

// .............................................................................
/** Returns the defaults of every section */
export const edgeDefaults = (): EResolvedConfig => ({
  manufacturers: { count: 1, catalogsPerManufacturer: 1 },
  catalogs: {
    carsPerCatalog: 10,
    startYear: 2026,
    revisions: { count: 0, addShare: 0.2, removeShare: 0.1, changeShare: 0.2 },
  },
  layers: defaultLayers(),
  scale: { targetRows: null },
  progressEvery: 1000,
});

// .............................................................................
/**
 * Returns the fallback with every defined value of the overrides on top.
 * A value that is undefined keeps its default.
 * @param fallback - The defaults
 * @param overrides - The values of the user, or undefined
 */
export const withDefaults = <T extends object>(
  fallback: T,
  overrides: Partial<T> | undefined,
): T => {
  const result = { ...fallback };
  for (const [key, value] of Object.entries(overrides ?? {})) {
    if (value !== undefined) {
      (result as Record<string, unknown>)[key] = value;
    }
  }
  return result;
};

// .............................................................................
/**
 * Returns a layer with its defaults, or false when the layer is off.
 * @param value - The layer configuration of the user
 * @param fallback - The defaults of the layer
 */
const resolveLayer = <T extends object>(
  value: Partial<T> | false | undefined,
  fallback: T,
): T | false => (value === false ? false : withDefaults(fallback, value));

// .............................................................................
/**
 * Fills the defaults into the layers.
 * @param layers - The layers of the user
 */
const resolveLayers = (layers: ELayersConfig = {}): EResolvedLayers => {
  const defaults = defaultLayers();
  return {
    prices: resolveLayer(layers.prices, defaults.prices),
    brands: resolveLayer(layers.brands, defaults.brands),
    workshops: resolveLayer(layers.workshops, defaults.workshops),
    parts: resolveLayer(layers.parts, defaults.parts),
    cad: resolveLayer(layers.cad, defaults.cad),
  };
};

// .............................................................................
/**
 * Fills the defaults into a configuration and checks its values.
 * @param config - The configuration of the user
 */
export const resolveEdgeConfig = (config: EConfig): EResolvedConfig => {
  const defaults = edgeDefaults();
  const { revisions, ...catalogValues } = config.catalogs ?? {};
  const resolved: EResolvedConfig = {
    manufacturers: withDefaults(defaults.manufacturers, config.manufacturers),
    catalogs: {
      ...withDefaults(defaults.catalogs, catalogValues),
      revisions: withDefaults(defaults.catalogs.revisions, revisions),
    },
    layers: resolveLayers(config.layers),
    scale: { targetRows: config.scale?.targetRows ?? null },
    progress: config.progress,
    progressEvery: config.progressEvery ?? defaults.progressEvery,
    abortSignal: config.abortSignal,
  };

  validateEdgeConfig(resolved);
  return resolved;
};

// #############################################################################
/** An integer setting and the range it must lie in */
interface EIntegerRule {
  /** The path of the setting, for the error message */
  name: string;

  /** The value of the setting */
  value: number;

  /** The smallest allowed value */
  min: number;

  /** The largest allowed value; no limit when left out */
  max?: number;
}

// .............................................................................
/**
 * Throws unless a setting is an integer within its range.
 * @param rule - The setting and its range
 */
const expectInteger = (rule: EIntegerRule): void => {
  const { name, value, min, max } = rule;
  const upper = max ?? Infinity;
  if (Number.isInteger(value) && value >= min && value <= upper) {
    return;
  }
  const range = max === undefined ? `at least ${min}` : `${min} to ${max}`;
  throw new Error(`Edge: ${name} must be an integer of ${range}, not ${value}`);
};

// .............................................................................
/**
 * Throws unless a setting is a share between 0 and 1.
 * @param name - The path of the setting, for the error message
 * @param value - The value of the setting
 */
const expectShare = (name: string, value: number): void => {
  if (!(value >= 0 && value <= 1)) {
    throw new Error(`Edge: ${name} must be between 0 and 1, not ${value}`);
  }
};

// .............................................................................
/**
 * Checks the sizes of the world: manufacturers, catalogs and cars.
 * @param config - The resolved configuration
 */
const validateSizes = (config: EResolvedConfig): void => {
  const { manufacturers, catalogs } = config;
  expectInteger({
    name: 'manufacturers.count',
    value: manufacturers.count,
    min: 1,
  });
  expectInteger({
    name: 'manufacturers.catalogsPerManufacturer',
    value: manufacturers.catalogsPerManufacturer,
    min: 1,
  });
  expectInteger({
    name: 'catalogs.carsPerCatalog',
    value: catalogs.carsPerCatalog,
    min: 1,
    max: maxCarsPerCatalog,
  });
  expectInteger({
    name: 'catalogs.startYear',
    value: catalogs.startYear,
    ...modelYears,
  });
};

// .............................................................................
/**
 * Checks the model years that follow the first one.
 * @param revisions - The resolved revisions
 */
const validateRevisions = (revisions: Required<ERevisionsConfig>): void => {
  expectInteger({
    name: 'catalogs.revisions.count',
    value: revisions.count,
    min: 0,
  });
  expectShare('catalogs.revisions.addShare', revisions.addShare);
  expectShare('catalogs.revisions.removeShare', revisions.removeShare);
  expectShare('catalogs.revisions.changeShare', revisions.changeShare);
};

// .............................................................................
/**
 * Checks the prices layer.
 * @param prices - The resolved prices layer
 */
const validatePrices = (prices: Required<EPricesConfig>): void => {
  const { currencies, range, roundTo, discountShare } = prices;
  if (currencies.length === 0) {
    throw new Error('Edge: layers.prices.currencies must not be empty');
  }
  if (!(range.min >= 0 && range.min < range.max)) {
    throw new Error('Edge: layers.prices.range needs 0 <= min < max');
  }
  if (!(roundTo > 0)) {
    throw new Error('Edge: layers.prices.roundTo must be positive');
  }
  expectShare('layers.prices.discountShare', discountShare);
};

// .............................................................................
/**
 * Checks the brands and workshops layers.
 * @param layers - The resolved layers
 */
const validateBrandsAndWorkshops = (layers: EResolvedLayers): void => {
  const { brands, workshops } = layers;
  if (brands) {
    expectInteger({
      name: 'layers.brands.modelsPerManufacturer',
      value: brands.modelsPerManufacturer,
      min: 1,
    });
  }
  if (workshops) {
    expectInteger({
      name: 'layers.workshops.perCatalog',
      value: workshops.perCatalog,
      min: 1,
    });
    expectInteger({
      name: 'layers.workshops.ownersPerManufacturer',
      value: workshops.ownersPerManufacturer,
      min: 1,
    });
  }
};

// .............................................................................
/**
 * Checks the depth and the fan-out of a parts or CAD tree.
 * @param name - The name of the layer, parts or cad
 * @param tree - The depth and the fan-out of the layer
 */
const validateTree = (
  name: 'parts' | 'cad',
  tree: Pick<Required<ECadConfig>, 'depth' | 'fanOut'>,
): void => {
  const prefix = `layers.${name}`;
  expectInteger({
    name: `${prefix}.depth`,
    value: tree.depth,
    min: 1,
    max: maxDepth,
  });
  expectInteger({
    name: `${prefix}.fanOut`,
    value: tree.fanOut,
    min: 1,
    max: maxFanOut,
  });
};

// .............................................................................
/**
 * Checks the parts and CAD layers.
 * @param layers - The resolved layers
 */
const validateTrees = (layers: EResolvedLayers): void => {
  const { parts, cad } = layers;
  if (parts) {
    validateTree('parts', parts);
    expectInteger({
      name: 'layers.parts.standardPartsPool',
      value: parts.standardPartsPool,
      min: 1,
      max: standardParts.length,
    });
  }
  if (cad) {
    validateTree('cad', cad);
  }
};

// .............................................................................
/**
 * Checks the settings of a run: the target size and the progress interval.
 * @param config - The resolved configuration
 */
const validateRun = (config: EResolvedConfig): void => {
  const { scale, progressEvery } = config;
  if (scale.targetRows !== null) {
    expectInteger({
      name: 'scale.targetRows',
      value: scale.targetRows,
      min: 1,
    });
  }
  expectInteger({ name: 'progressEvery', value: progressEvery, min: 1 });
};

// .............................................................................
/**
 * Throws when a value of the configuration is out of range.
 * @param config - The resolved configuration
 */
export const validateEdgeConfig = (config: EResolvedConfig): void => {
  validateSizes(config);
  validateRevisions(config.catalogs.revisions);
  if (config.layers.prices) {
    validatePrices(config.layers.prices);
  }
  validateBrandsAndWorkshops(config.layers);
  validateTrees(config.layers);
  validateRun(config);
};

// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import { standardPartsLevel } from '../car-world/bom-builder.ts';
import { carWorldTableKeys } from '../car-world/car-world.ts';
import type { ECarWorldTableKey } from '../car-world/car-world.ts';
import { countVersions, modelCountOf } from '../car-world/plan.ts';
import type { EVersionCounts } from '../car-world/plan.ts';
import { discountSteps, pricesPerModel } from '../car-world/prices.ts';
import type {
  ECadConfig,
  EPartsConfig,
  EResolvedConfig,
  EResolvedLayers,
  ESharing,
} from '../config/config.ts';
import { manufacturers } from '../dictionaries/manufacturers.ts';
import { modelsOf } from '../dictionaries/vehicles.ts';

import { pick } from './pick.ts';

// #############################################################################
/** How big a world will be, calculated from the configuration alone */
export interface EEstimate {
  /** How many different cars the world holds */
  cars: number;

  /** How many rows the world has at most; rows that happen to be equal fold into one */
  rowsTotal: number;

  /** How many rows each table has at most */
  rowsPerTable: Record<string, number>;

  /** The approximate size of the world as JSON, in bytes */
  approxBytes: number;
}

// #############################################################################
/** The counts the rows of the tables derive from */
interface EWorldCounts {
  /** The catalogs of all manufacturers */
  catalogs: number;

  /** The model years of every catalog */
  versions: number;

  /** The different cars of all catalogs */
  cars: number;

  /** The models all manufacturers use together */
  models: number;

  /** The price rows all catalogs need at most */
  priceRows: number;

  /** The assignments the layers of all catalogs hold */
  assignments: number;
}

// .............................................................................
/** The approximate size of a row of each table, in bytes */
const bytesPerRow: Readonly<Record<ECarWorldTableKey, number>> = {
  tableCfgs: 600,
  addresses: 180,
  persons: 160,
  workshops: 260,
  prices: 140,
  brands: 150,
  parts: 220,
  cadScenes: 300,
  carIds: 60,
  carPrices: 100,
  carBrands: 100,
  carWorkshops: 100,
  carParts: 100,
  carCad: 100,
  catalogs: 250,
  revisions: 160,
  manufacturers: 320,
};

/** The bytes a slice id takes in a slice ids row or a layer */
const bytesPerAssignment = 50;

/** The most cars Edge puts into one catalog when it fits a target */
export const maxFittedCarsPerCatalog = 100_000;

// .............................................................................
/**
 * Sums the nodes of a tree: fanOut to the power of 0 up to levels.
 * @param fanOut - The children per node
 * @param levels - The levels below the root
 */
const treeNodes = (fanOut: number, levels: number): number => {
  let nodes = 0;
  for (let level = 0; level <= levels; level++) {
    nodes += fanOut ** level;
  }
  return nodes;
};

// .............................................................................
/**
 * Counts the models of every manufacturer and the price rows they allow: a
 * model has at most pricesPerModel prices per year, times the discounts.
 * @param config - The resolved configuration
 * @param versions - The counts of one catalog across its model years
 */
const countModels = (
  config: EResolvedConfig,
  versions: EVersionCounts,
): { models: number; priceRows: number } => {
  const { manufacturers: m, layers } = config;
  const discounted = layers.prices && layers.prices.discountShare > 0;
  const discountVariants = discounted ? discountSteps + 1 : 1;
  let models = 0;
  let priceRows = 0;
  for (let i = 0; i < m.count; i++) {
    const used = modelCountOf(config, modelsOf(pick(manufacturers, i).brand));
    const variants = used * pricesPerModel * discountVariants;
    models += used;
    for (const needed of versions.priceRowsPerVersion) {
      priceRows += m.catalogsPerManufacturer * Math.min(needed, variants);
    }
  }
  return { models, priceRows };
};

// .............................................................................
/**
 * Counts catalogs, model years, cars, models, prices and assignments.
 * @param config - The resolved configuration
 */
const countWorld = (config: EResolvedConfig): EWorldCounts => {
  const { manufacturers: m, catalogs: c } = config;
  const catalogs = m.count * m.catalogsPerManufacturer;
  const versions = countVersions(c.carsPerCatalog, c.revisions);
  return {
    catalogs,
    versions: c.revisions.count + 1,
    cars: catalogs * versions.distinctCars,
    ...countModels(config, versions),
    assignments: catalogs * versions.assignments,
  };
};

// .............................................................................
/**
 * Returns how many variants share bills of materials or scenes.
 * @param sharing - perCar, perModel or perCatalog
 * @param counts - The counts of the world
 */
const variantsOf = (sharing: ESharing, counts: EWorldCounts): number => {
  if (sharing === 'perCar') {
    return counts.cars;
  }
  return sharing === 'perModel' ? counts.models : counts.catalogs;
};

// .............................................................................
/**
 * Returns the rows of the parts table: one tree per variant down to level
 * 3, plus the pool of standard parts every tree shares.
 * @param parts - The parts layer, or false when it is off
 * @param counts - The counts of the world
 */
const partsRows = (
  parts: Required<EPartsConfig> | false,
  counts: EWorldCounts,
): number => {
  if (!parts) {
    return 0;
  }
  const levels = Math.min(parts.depth, standardPartsLevel - 1);
  const pool = parts.depth === standardPartsLevel ? parts.standardPartsPool : 0;
  return (
    variantsOf(parts.sharing, counts) * treeNodes(parts.fanOut, levels) + pool
  );
};

// .............................................................................
/**
 * Returns the rows of the scenes table: one tree per variant.
 * @param cad - The CAD layer, or false when it is off
 * @param counts - The counts of the world
 */
const cadRows = (
  cad: Required<ECadConfig> | false,
  counts: EWorldCounts,
): number =>
  cad ? variantsOf(cad.sharing, counts) * treeNodes(cad.fanOut, cad.depth) : 0;

// .............................................................................
/**
 * Returns the rows of every table.
 * @param config - The resolved configuration
 * @param counts - The counts of the world
 */
const rowsOf = (
  config: EResolvedConfig,
  counts: EWorldCounts,
): Record<ECarWorldTableKey, number> => {
  const { manufacturers: m, catalogs: c, layers } = config;
  const perVersion = counts.catalogs * counts.versions;
  const layerRows = (layer: object | false) => (layer ? perVersion : 0);
  const workshops = layers.workshops
    ? counts.catalogs * layers.workshops.perCatalog
    : 0;
  return {
    tableCfgs: carWorldTableKeys.length,
    addresses: m.count + workshops,
    persons: layers.workshops
      ? m.count * layers.workshops.ownersPerManufacturer
      : 0,
    workshops,
    prices: layers.prices ? counts.priceRows : 0,
    brands: layers.brands ? counts.models : 0,
    parts: partsRows(layers.parts, counts),
    cadScenes: cadRows(layers.cad, counts),
    carIds: perVersion,
    carPrices: layerRows(layers.prices),
    carBrands: layerRows(layers.brands),
    carWorkshops: layerRows(layers.workshops),
    carParts: layerRows(layers.parts),
    carCad: layerRows(layers.cad),
    catalogs: perVersion,
    revisions: counts.catalogs * c.revisions.count,
    manufacturers: m.count,
  };
};

// .............................................................................
/**
 * Returns the approximate size of the world in bytes. Every layer and the
 * slice ids hold one entry per assignment.
 * @param rows - The rows of every table
 * @param counts - The counts of the world
 * @param layers - The resolved layers
 */
const approxBytesOf = (
  rows: Record<ECarWorldTableKey, number>,
  counts: EWorldCounts,
  layers: EResolvedLayers,
): number => {
  let bytes = 0;
  for (const key of carWorldTableKeys) {
    bytes += rows[key] * bytesPerRow[key];
  }
  const lists = Object.values(layers).filter((l) => l !== false).length + 1;
  return bytes + counts.assignments * bytesPerAssignment * lists;
};

// .............................................................................
/**
 * Estimates the rows of a car world without generating a single one.
 *
 * The counts are exact for everything that is unique by construction, and an
 * upper bound where two rows may happen to be equal, like prices.
 * @param config - The resolved configuration
 */
export const estimateCarWorld = (config: EResolvedConfig): EEstimate => {
  const counts = countWorld(config);
  const rowsPerTable = rowsOf(config, counts);
  const rowsTotal = carWorldTableKeys.reduce(
    (sum, key) => sum + rowsPerTable[key],
    0,
  );
  const approxBytes = approxBytesOf(rowsPerTable, counts, config.layers);
  return { cars: counts.cars, rowsTotal, rowsPerTable, approxBytes };
};

// .............................................................................
/**
 * Returns the largest number of cars per catalog whose world stays within a
 * number of rows: at least 1, at most maxFittedCarsPerCatalog.
 *
 * When the rows never reach the target, because the cars share their bills
 * of materials and scenes, the result is maxFittedCarsPerCatalog. More rows
 * then come from more catalogs or from sharing per car.
 * @param config - The resolved configuration
 * @param targetRows - The number of rows the world should have at most
 */
export const fitCarsPerCatalog = (
  config: EResolvedConfig,
  targetRows: number,
): number => {
  const rowsFor = (carsPerCatalog: number): number =>
    estimateCarWorld({
      ...config,
      catalogs: { ...config.catalogs, carsPerCatalog },
    }).rowsTotal;

  if (rowsFor(1) > targetRows) {
    return 1;
  }
  let low = 1;
  let high = maxFittedCarsPerCatalog;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (rowsFor(middle) <= targetRows) {
      low = middle;
    } else {
      high = middle - 1;
    }
  }
  return low;
};

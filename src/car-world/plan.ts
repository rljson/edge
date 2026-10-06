// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import type {
  EResolvedConfig,
  ERevisionsConfig,
  ESharing,
} from '../config/config.ts';
import { inShare, padded, pick, slug, zipfBucket } from '../core/pick.ts';
import type { EVehicleModel } from '../dictionaries/vehicles.ts';

// .............................................................................
/** The segments a manufacturer's catalogs are named after */
export const segments = [
  'cars',
  'vans',
  'suvs',
  'fleet',
  'classics',
  'sports',
  'trucks',
  'compact',
  'premium',
  'electric',
] as const;

/** The digits of the car number in a slice id */
export const carNoDigits = 6;

/** The models a manufacturer uses when the brands layer is off */
export const modelsWithoutBrands = 5;

// .............................................................................
/**
 * Returns the segment of a catalog, unique within a manufacturer.
 * @param catalogIndex - The index of the catalog within the manufacturer
 */
export const segmentOf = (catalogIndex: number): string => {
  const segment = pick(segments, catalogIndex);
  const round = Math.floor(catalogIndex / segments.length);
  return round === 0 ? segment : `${segment}-${round + 1}`;
};

// .............................................................................
/**
 * Returns the id of a catalog without its year, e.g. "audi-cars".
 * @param manufacturerId - The id of the manufacturer
 * @param catalogIndex - The index of the catalog within the manufacturer
 */
export const catalogBaseId = (
  manufacturerId: string,
  catalogIndex: number,
): string => `${manufacturerId}-${segmentOf(catalogIndex)}`;

// .............................................................................
/**
 * Returns the slice id of a car, e.g. "audi-cars-000017".
 * @param baseId - The id of the catalog without its year
 * @param carNo - The number of the car, starting at 1
 */
export const carSliceId = (baseId: string, carNo: number): string =>
  `${baseId}-${padded(carNo, carNoDigits)}`;

// .............................................................................
/**
 * Returns the number of a car from its slice id.
 * @param sliceId - The slice id of the car
 */
export const carNoOf = (sliceId: string): number =>
  Number(sliceId.slice(sliceId.lastIndexOf('-') + 1));

// #############################################################################
/** One model year of a catalog */
export interface EVersionPlan {
  /** The model year */
  year: number;

  /** The slice ids of all cars of the year */
  carIds: string[];

  /** The cars the year adds; all cars in the first year */
  added: string[];

  /** The cars the year removes */
  removed: string[];

  /** The cars whose price the year changes */
  changed: string[];
}

// #############################################################################
/** What the model years of a catalog depend on */
export interface EPlanOptions {
  /** The id of the catalog without its year */
  baseId: string;

  /** The number of cars in the first year */
  cars: number;

  /** The first model year */
  startYear: number;

  /** How many years follow, and their shares */
  revisions: Required<ERevisionsConfig>;
}

// .............................................................................
/**
 * Returns a function that hands out the next slice ids of a catalog.
 * @param baseId - The id of the catalog without its year
 */
const carIdSequence = (baseId: string): ((count: number) => string[]) => {
  let next = 1;
  return (count) =>
    Array.from({ length: count }, () => carSliceId(baseId, next++));
};

// .............................................................................
/**
 * Plans the model year after another one: which cars it removes, keeps, adds
 * and gives a new price.
 * @param previous - The model year before
 * @param nextIds - Hands out the slice ids of new cars
 * @param revisions - The shares of the change
 */
const nextVersion = (
  previous: EVersionPlan,
  nextIds: (count: number) => string[],
  revisions: Required<ERevisionsConfig>,
): EVersionPlan => {
  const cars = previous.carIds;
  const removed = cars.filter((_, i) => inShare(i, revisions.removeShare));
  const kept = cars.filter((_, i) => !inShare(i, revisions.removeShare));
  const added = nextIds(Math.round(cars.length * revisions.addShare));
  const changed = kept.filter((_, i) => inShare(i, revisions.changeShare));
  const carIds = [...kept, ...added];
  return { year: previous.year + 1, carIds, added, removed, changed };
};

// .............................................................................
/**
 * Plans the model years of a catalog: which cars each year adds, removes and
 * changes. Everything derives from the shares, nothing is random.
 * @param options - The catalog, its first year and its revisions
 */
export const planVersions = (options: EPlanOptions): EVersionPlan[] => {
  const { baseId, cars, startYear, revisions } = options;
  const nextIds = carIdSequence(baseId);
  const initial = nextIds(cars);
  const first = { year: startYear, carIds: initial, added: initial };
  const result: EVersionPlan[] = [{ ...first, removed: [], changed: [] }];
  for (let v = 1; v <= revisions.count; v++) {
    result.push(nextVersion(result[v - 1], nextIds, revisions));
  }
  return result;
};

// #############################################################################
/** The counts of a catalog across its model years, for the estimate */
export interface EVersionCounts {
  /** How many different cars the catalog lists over all years */
  distinctCars: number;

  /** How many price rows the years need at most, all years together */
  priceRows: number;

  /** How many price rows each year needs at most: new cars and changed prices */
  priceRowsPerVersion: number[];

  /** How many assignments the layers of all years hold together */
  assignments: number;
}

// .............................................................................
/**
 * Counts what planVersions would plan, without building a single id.
 * @param cars - The number of cars in the first year
 * @param revisions - How many years follow, and their shares
 */
export const countVersions = (
  cars: number,
  revisions: Required<ERevisionsConfig>,
): EVersionCounts => {
  const counts: EVersionCounts = {
    distinctCars: cars,
    priceRows: cars,
    priceRowsPerVersion: [cars],
    assignments: cars,
  };
  let length = cars;
  for (let v = 1; v <= revisions.count; v++) {
    const removed = Math.floor(length * revisions.removeShare);
    const kept = length - removed;
    const added = Math.round(length * revisions.addShare);
    const changed = Math.floor(kept * revisions.changeShare);
    counts.distinctCars += added;
    counts.priceRows += added + changed;
    counts.priceRowsPerVersion.push(added + changed);
    counts.assignments += added + changed + removed;
    length = kept + added;
  }
  return counts;
};

// .............................................................................
/**
 * Returns how many models the cars of a manufacturer use: the configured
 * number, capped by the models the dictionary knows.
 * @param config - The resolved configuration
 * @param models - The models of the manufacturer
 */
export const modelCountOf = (
  config: EResolvedConfig,
  models: readonly EVehicleModel[],
): number =>
  Math.min(
    config.layers.brands
      ? config.layers.brands.modelsPerManufacturer
      : modelsWithoutBrands,
    models.length,
  );

// #############################################################################
/** What the model of a car depends on */
export interface EModelOptions {
  /** The number of the car, starting at 1 */
  carNo: number;

  /** The number of cars in the first year */
  initialCars: number;

  /** The number of models the manufacturer offers */
  models: number;

  /** uniform spreads the cars evenly, zipf favours the first models */
  popularity: 'uniform' | 'zipf';
}

// .............................................................................
/**
 * Returns the index of the model of a car. A car keeps its model over the
 * years, so the index derives from the car number alone.
 * @param options - The car, the catalog size and the models
 */
export const modelIndexOf = (options: EModelOptions): number => {
  const { carNo, initialCars, models, popularity } = options;
  return popularity === 'zipf'
    ? zipfBucket({ index: carNo - 1, count: initialCars, buckets: models })
    : (carNo - 1) % models;
};

// #############################################################################
/** Who shares a bill of materials or a scene: a code for ids and a name */
export interface EVariant {
  /** A short code for part numbers and cache keys, e.g. "a4" */
  code: string;

  /** A readable name, e.g. "Audi A4" */
  name: string;

  /** A number that varies the assemblies and systems the variant uses */
  offset: number;
}

// #############################################################################
/** What the variant of a car depends on */
export interface EVariantOptions {
  /** perCar, perModel or perCatalog */
  sharing: ESharing;

  /** The slice id of the car */
  sliceId: string;

  /** The model of the car */
  model: EVehicleModel;

  /** The index of the model within the manufacturer */
  modelIndex: number;

  /** The segment of the catalog */
  segment: string;

  /** The index of the catalog within the manufacturer */
  catalogIndex: number;
}

// .............................................................................
/**
 * Returns the variant a car's bill of materials or scene belongs to.
 * @param options - The sharing, the car, its model and its catalog
 */
export const variantOf = (options: EVariantOptions): EVariant => {
  const { sharing, sliceId, model, modelIndex, segment } = options;
  if (sharing === 'perCar') {
    const carNo = carNoOf(sliceId);
    const code = `${slug(segment)}-${padded(carNo, carNoDigits)}`;
    return { code, name: sliceId, offset: carNo };
  }
  if (sharing === 'perModel') {
    const name = `${model.brand} ${model.model}`;
    return { code: slug(model.model), name, offset: modelIndex };
  }
  const name = `${model.brand} ${segment}`;
  return { code: slug(segment), name, offset: options.catalogIndex };
};

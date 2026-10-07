// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import type { EResolvedConfig } from '../config/config.ts';
import type { EEmitter } from '../core/emitter.ts';
import { pick, slug } from '../core/pick.ts';
import { manufacturers } from '../dictionaries/manufacturers.ts';
import type { EManufacturerEntry } from '../dictionaries/manufacturers.ts';
import { cityNamed } from '../dictionaries/places.ts';
import { modelsOf } from '../dictionaries/vehicles.ts';

import { carWorldTableKeys } from './car-world.ts';
import type { EManufacturer } from './car-world.ts';
import { ECatalogGenerator } from './catalog-generator.ts';
import type {
  ECatalogCaches,
  ECatalogManufacturer,
} from './catalog-generator.ts';
import { carWorldTableCfgs } from './table-cfgs.ts';
import { addressRow } from './workshops.ts';

// #############################################################################
/** What generating a manufacturer needs */
interface EManufacturerInput {
  config: EResolvedConfig;
  emitter: EEmitter;

  /** The index of the manufacturer within the world */
  index: number;
}

// .............................................................................
/** Headquarters addresses start at this index, so they never collide with workshops */
const headquartersOffset = 100000;

/** The part number prefix takes this many letters of the brand */
const prefixLength = 3;

// .............................................................................
/**
 * Returns the part number prefix of a brand: its first three letters.
 * @param brand - The brand, e.g. "Velora"
 */
export const prefixOf = (brand: string): string =>
  slug(brand).replace(/-/g, '').slice(0, prefixLength).toUpperCase();

// .............................................................................
/**
 * Returns the id and the name of a manufacturer. When the world has more
 * manufacturers than the dictionary, the dictionary starts over and the
 * repetitions get a number.
 * @param entry - The manufacturer in the dictionary
 * @param index - The index of the manufacturer within the world
 */
const identityOf = (
  entry: EManufacturerEntry,
  index: number,
): { id: string; name: string } => {
  const round = Math.floor(index / manufacturers.length);
  return round === 0
    ? { id: entry.id, name: entry.name }
    : { id: `${entry.id}-${round + 1}`, name: `${entry.name} ${round + 1}` };
};

// .............................................................................
/**
 * Announces every table of the world with its configuration.
 * @param emitter - Receives the configurations
 */
const announceTables = async (emitter: EEmitter): Promise<void> => {
  emitter.phaseIs('tableCfgs');
  const tableCfgs = carWorldTableCfgs();
  for (const key of carWorldTableKeys) {
    await emitter.table(tableCfgs[key]);
  }
};

// .............................................................................
/**
 * Emits the catalogs of a manufacturer and returns their cakes and cars.
 * @param input - The configuration, the emitter and the manufacturer
 * @param manufacturer - What the catalogs need to know about the manufacturer
 */
const generateCatalogs = async (
  input: EManufacturerInput,
  manufacturer: ECatalogManufacturer,
): Promise<{ catalogsRef: string[]; cars: number }> => {
  const { config, emitter } = input;
  const caches: ECatalogCaches = { boms: new Map(), scenes: new Map() };
  const catalogsRef: string[] = [];
  let cars = 0;
  for (let c = 0; c < config.manufacturers.catalogsPerManufacturer; c++) {
    const result = await new ECatalogGenerator({
      emitter,
      config,
      manufacturer,
      catalogIndex: c,
      caches,
    }).generate();
    catalogsRef.push(...result.cakeRefs);
    cars += result.cars;
  }
  return { catalogsRef, cars };
};

// #############################################################################
/** What the row of a manufacturer is made of */
interface EManufacturerRowInput {
  /** The manufacturer in the dictionary */
  entry: EManufacturerEntry;

  /** The id and the name of the manufacturer within the world */
  identity: { id: string; name: string };

  /** The hash of the headquarters address */
  headquartersRef: string;

  /** The hashes of the catalogs, every model year, oldest first */
  catalogsRef: string[];
}

// .............................................................................
/**
 * Returns the row of a manufacturer.
 * @param input - The dictionary entry, the identity and the referenced rows
 */
const manufacturerRow = (input: EManufacturerRowInput): EManufacturer => {
  const { entry, identity, headquartersRef, catalogsRef } = input;
  return {
    ...identity,
    brand: entry.brand,
    country: entry.country,
    founded: entry.founded,
    website: `https://www.${slug(entry.brand)}.example`,
    headquartersRef,
    catalogsRef,
  };
};

// .............................................................................
/**
 * Emits a manufacturer: its headquarters, its catalogs and its own row.
 * Returns how many cars its catalogs hold.
 * @param input - The configuration, the emitter and the index
 */
const generateManufacturer = async (
  input: EManufacturerInput,
): Promise<number> => {
  const { emitter, index } = input;
  const entry = pick(manufacturers, index);
  const identity = identityOf(entry, index);

  emitter.phaseIs('addresses');
  const address = addressRow(cityNamed(entry.city), headquartersOffset + index);
  const headquarters = await emitter.emit('addresses', address);

  const { catalogsRef, cars } = await generateCatalogs(input, {
    index,
    id: identity.id,
    prefix: prefixOf(entry.brand),
    country: entry.country,
    models: modelsOf(entry.brand),
  });

  emitter.phaseIs('manufacturers');
  const headquartersRef = headquarters._hash;
  const row = manufacturerRow({
    entry,
    identity,
    headquartersRef,
    catalogsRef,
  });
  await emitter.emit('manufacturers', row);
  return cars;
};

// .............................................................................
/**
 * Emits a whole car world: the table configurations, then manufacturer by
 * manufacturer their catalogs, and returns how many cars it holds.
 * @param config - The resolved configuration
 * @param emitter - Receives the rows
 */
export const generateCarWorld = async (
  config: EResolvedConfig,
  emitter: EEmitter,
): Promise<{ cars: number }> => {
  await announceTables(emitter);
  let cars = 0;
  for (let index = 0; index < config.manufacturers.count; index++) {
    cars += await generateManufacturer({ config, emitter, index });
  }
  return { cars };
};

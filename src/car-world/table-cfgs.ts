// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import type { JsonValueType } from '@rljson/json';
import {
  createCakeTableCfg,
  createLayerTableCfg,
  createSliceIdsTableCfg,
  createTreesTableCfg,
} from '@rljson/rljson';
import type { ColumnCfg, ContentType, TableCfg } from '@rljson/rljson';

import type { ECarWorldTableKey } from './car-world.ts';

// #############################################################################
/** A column: key, json type, title and, for a reference, the referenced table */
type EColumnSpec = readonly [
  key: string,
  type: JsonValueType,
  title: string,
  ref?: ColumnCfg['ref'],
];

// .............................................................................
/**
 * Turns a column spec into a column configuration.
 * @param spec - Key, type, title and an optional reference
 */
const columnOf = (spec: EColumnSpec): ColumnCfg => {
  const [key, type, title, ref] = spec;
  return {
    key,
    type,
    titleLong: title,
    titleShort: title,
    ...(ref ? { ref } : {}),
  };
};

/** The first column of every table */
const hashColumn: EColumnSpec = ['_hash', 'string', 'Hash'];

// .............................................................................
/**
 * Returns a reference to a table.
 * @param tableKey - The key of the referenced table
 * @param type - The content type of the referenced table
 */
const refTo = (
  tableKey: string,
  type: ContentType = 'components',
): ColumnCfg['ref'] => ({ tableKey, type });

// .............................................................................
/**
 * Returns the configuration of a table whose rows several parents use.
 * @param key - The key of the table
 * @param columns - The columns after the hash column
 */
const shared = (key: string, columns: EColumnSpec[]): TableCfg => ({
  key,
  type: 'components',
  columns: [hashColumn, ...columns].map(columnOf),
  isHead: false,
  isRoot: false,
  isShared: true,
});

// .............................................................................
/** Returns the configuration of the manufacturers table: the root of the world */
export const manufacturersTableCfg = (): TableCfg => ({
  key: 'manufacturers',
  type: 'components',
  columns: (
    [
      hashColumn,
      ['id', 'string', 'Id'],
      ['name', 'string', 'Name'],
      ['brand', 'string', 'Brand'],
      ['country', 'string', 'Country'],
      ['founded', 'number', 'Founded'],
      ['website', 'string', 'Website'],
      ['headquartersRef', 'string', 'Headquarters', refTo('addresses')],
      ['catalogsRef', 'jsonArray', 'Catalogs', refTo('catalogs', 'cakes')],
    ] as EColumnSpec[]
  ).map(columnOf),
  isHead: true,
  isRoot: true,
  isShared: false,
});

// .............................................................................
/** Returns the configuration of the addresses table */
export const addressesTableCfg = (): TableCfg =>
  shared('addresses', [
    ['street', 'string', 'Street'],
    ['houseNumber', 'string', 'House number'],
    ['zip', 'string', 'Postal code'],
    ['city', 'string', 'City'],
    ['country', 'string', 'Country'],
    ['lat', 'number', 'Latitude'],
    ['lng', 'number', 'Longitude'],
  ]);

// .............................................................................
/** Returns the configuration of the persons table */
export const personsTableCfg = (): TableCfg =>
  shared('persons', [
    ['firstName', 'string', 'First name'],
    ['lastName', 'string', 'Last name'],
    ['email', 'string', 'Email'],
    ['phone', 'string', 'Phone'],
    ['birthYear', 'number', 'Year of birth'],
  ]);

// .............................................................................
/** Returns the configuration of the workshops table */
export const workshopsTableCfg = (): TableCfg =>
  shared('workshops', [
    ['name', 'string', 'Name'],
    ['addressRef', 'string', 'Address', refTo('addresses')],
    ['ownerRef', 'string', 'Owner', refTo('persons')],
    ['phone', 'string', 'Phone'],
    ['email', 'string', 'Email'],
    ['services', 'jsonArray', 'Services'],
    ['rating', 'number', 'Rating'],
  ]);

// .............................................................................
/** Returns the configuration of the prices table */
export const pricesTableCfg = (): TableCfg =>
  shared('prices', [
    ['amount', 'number', 'Amount'],
    ['currency', 'string', 'Currency'],
    ['validFrom', 'string', 'Valid from'],
    ['discountPercent', 'number', 'Discount in percent'],
    ['taxIncluded', 'boolean', 'Tax included'],
  ]);

// .............................................................................
/** Returns the configuration of the brands table */
export const brandsTableCfg = (): TableCfg =>
  shared('brands', [
    ['brand', 'string', 'Brand'],
    ['model', 'string', 'Model'],
    ['bodyType', 'string', 'Body type'],
    ['fuel', 'string', 'Fuel'],
    ['powerKw', 'number', 'Power in kW'],
  ]);

// .............................................................................
/** Returns the configuration of the parts table */
export const partsTableCfg = (): TableCfg =>
  shared('parts', [
    ['name', 'string', 'Name'],
    ['partNumber', 'string', 'Part number'],
    ['category', 'string', 'Category'],
    ['level', 'number', 'Level'],
    ['quantity', 'number', 'Quantity'],
    ['weightKg', 'number', 'Weight in kg'],
    ['material', 'string', 'Material'],
    ['subPartRefs', 'jsonArray', 'Sub parts', refTo('parts')],
  ]);

// .............................................................................
/** Returns the configuration of the revisions table */
export const revisionsTableCfg = (): TableCfg => ({
  key: 'revisions',
  type: 'revisions',
  columns: (
    [
      hashColumn,
      ['table', 'string', 'Table'],
      ['predecessor', 'string', 'Predecessor', refTo('catalogs', 'cakes')],
      ['successor', 'string', 'Successor', refTo('catalogs', 'cakes')],
      ['timestamp', 'number', 'Timestamp'],
      ['id', 'string', 'Id'],
    ] as EColumnSpec[]
  ).map(columnOf),
  isHead: false,
  isRoot: false,
  isShared: true,
});

// .............................................................................
/** Returns the configuration of the tableCfgs table itself */
export const tableCfgsTableCfg = (): TableCfg => ({
  key: 'tableCfgs',
  type: 'tableCfgs',
  columns: (
    [
      hashColumn,
      ['key', 'string', 'Table key'],
      ['type', 'string', 'Content type'],
      ['columns', 'jsonArray', 'Columns'],
      ['isHead', 'boolean', 'Is head'],
      ['isRoot', 'boolean', 'Is root'],
      ['isShared', 'boolean', 'Is shared'],
      ['previous', 'string', 'Previous'],
    ] as EColumnSpec[]
  ).map(columnOf),
  isHead: false,
  isRoot: false,
  isShared: true,
});

// .............................................................................
/** Returns the configurations of all tables of a car world, by table key */
export const carWorldTableCfgs = (): Record<ECarWorldTableKey, TableCfg> => ({
  tableCfgs: tableCfgsTableCfg(),
  addresses: addressesTableCfg(),
  persons: personsTableCfg(),
  workshops: workshopsTableCfg(),
  prices: pricesTableCfg(),
  brands: brandsTableCfg(),
  parts: partsTableCfg(),
  cadScenes: createTreesTableCfg('cadScenes'),
  carIds: createSliceIdsTableCfg('carIds'),
  carPrices: createLayerTableCfg('carPrices'),
  carBrands: createLayerTableCfg('carBrands'),
  carWorkshops: createLayerTableCfg('carWorkshops'),
  carParts: createLayerTableCfg('carParts'),
  carCad: createLayerTableCfg('carCad'),
  catalogs: createCakeTableCfg('catalogs'),
  revisions: revisionsTableCfg(),
  manufacturers: manufacturersTableCfg(),
});

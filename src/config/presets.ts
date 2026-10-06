// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import type { EConfig } from './config.ts';

// .............................................................................
/** The names of the presets, from the smallest to the largest */
export const edgePresetNames = [
  'tiny',
  'small',
  'medium',
  'large',
  'xl',
] as const;

// #############################################################################
/** The name of a preset */
export type EPresetName = (typeof edgePresetNames)[number];

// .............................................................................
/**
 * Ready-made configurations.
 *
 * tiny and small fit unit and component tests, medium an integration test.
 * large reaches more than 20 million rows by giving every car a bill of
 * materials and a scene of its own; xl reaches 20 million cars.
 */
export const edgePresets: Readonly<Record<EPresetName, EConfig>> = {
  tiny: {
    manufacturers: { count: 1, catalogsPerManufacturer: 1 },
    catalogs: { carsPerCatalog: 5 },
    layers: {
      workshops: { perCatalog: 2, ownersPerManufacturer: 2 },
      parts: { depth: 2, fanOut: 2, sharing: 'perModel', standardPartsPool: 6 },
      cad: { depth: 2, fanOut: 2, sharing: 'perModel' },
    },
  },
  small: {
    manufacturers: { count: 2, catalogsPerManufacturer: 2 },
    catalogs: { carsPerCatalog: 100 },
    layers: {
      workshops: { perCatalog: 10 },
      parts: { depth: 3, fanOut: 3, sharing: 'perModel' },
      cad: { depth: 2, fanOut: 4, sharing: 'perModel' },
    },
  },
  medium: {
    manufacturers: { count: 5, catalogsPerManufacturer: 4 },
    catalogs: { carsPerCatalog: 5000 },
    layers: {
      workshops: { perCatalog: 50 },
      parts: { depth: 4, fanOut: 3, sharing: 'perModel' },
      cad: { depth: 3, fanOut: 4, sharing: 'perModel' },
    },
  },
  large: {
    manufacturers: { count: 10, catalogsPerManufacturer: 10 },
    catalogs: { carsPerCatalog: 2000 },
    layers: {
      workshops: { perCatalog: 50 },
      parts: { depth: 4, fanOut: 3, sharing: 'perCar' },
      cad: { depth: 3, fanOut: 4, sharing: 'perCar' },
    },
  },
  xl: {
    manufacturers: { count: 20, catalogsPerManufacturer: 20 },
    catalogs: { carsPerCatalog: 50000 },
    layers: {
      workshops: { perCatalog: 100 },
      parts: { depth: 4, fanOut: 3, sharing: 'perModel' },
      cad: { depth: 3, fanOut: 4, sharing: 'perModel' },
    },
  },
};

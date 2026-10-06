// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import type { EBodyType, EVehicleModel } from '../dictionaries/vehicles.ts';

import type { EBrand } from './car-world.ts';

// .............................................................................
/** The body types from the cheapest to the most expensive */
export const bodyTypeRanks: readonly EBodyType[] = [
  'microcar',
  'hatchback',
  'minivan',
  'van',
  'sedan',
  'wagon',
  'pickup',
  'suv',
  'coupe',
  'convertible',
  'truck',
  'sportscar',
];

/** The typical power of a body type in kW */
const basePowerKw: Readonly<Record<EBodyType, number>> = {
  microcar: 45,
  hatchback: 85,
  minivan: 130,
  van: 110,
  sedan: 120,
  wagon: 130,
  pickup: 170,
  suv: 150,
  coupe: 200,
  convertible: 180,
  truck: 350,
  sportscar: 400,
};

/** The power a model gains for every model the manufacturer lists before it */
const powerKwPerModel = 15;

// .............................................................................
/**
 * Returns the power of a model in kW: the typical power of its body type,
 * plus a bit for every model the manufacturer lists before it.
 * @param model - The model
 * @param modelIndex - The index of the model within the manufacturer
 */
export const powerKwOf = (model: EVehicleModel, modelIndex: number): number =>
  basePowerKw[model.bodyType] + modelIndex * powerKwPerModel;

// .............................................................................
/**
 * Returns the brand row of a model.
 * @param model - The model
 * @param modelIndex - The index of the model within the manufacturer
 */
export const brandRow = (model: EVehicleModel, modelIndex: number): EBrand => ({
  brand: model.brand,
  model: model.model,
  bodyType: model.bodyType,
  fuel: model.fuel,
  powerKw: powerKwOf(model, modelIndex),
});

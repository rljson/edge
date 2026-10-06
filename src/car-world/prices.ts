// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import type { EPricesConfig } from '../config/config.ts';
import { inShare, roundTo } from '../core/pick.ts';
import type { EVehicleModel } from '../dictionaries/vehicles.ts';

import { bodyTypeRanks } from './brands.ts';
import type { EPrice } from './car-world.ts';

// .............................................................................
/** A model has at most this many different prices per model year */
export const pricesPerModel = 100;

/** The discounts are this many steps of discountStepPercent: 5, 10 and 15 */
export const discountSteps = 3;

/** The percent one discount step takes off */
const discountStepPercent = 5;

/** How much of the price range the body type, the model and the car decide */
const priceShares = { bodyType: 0.6, model: 0.25, car: 0.15 } as const;

/** The models of a manufacturer spread over this many price steps */
const modelPriceSteps = 5;

/** The share every raise adds to a price */
const raiseShare = 0.03;

// #############################################################################
/** What a price depends on */
export interface EPriceInput {
  /** The model of the car: its body type decides the price class */
  model: EVehicleModel;

  /** The index of the model within the manufacturer */
  modelIndex: number;

  /** The number of the car, starting at 1 */
  carNo: number;

  /** The model year the price is valid from */
  year: number;

  /** The currency of the catalog */
  currency: string;

  /** How many model years raised the price: 0 for the first price of a car */
  raises: number;
}

// .............................................................................
/**
 * Returns where a price lies in the range, between 0 and 1.
 * @param input - What the price depends on
 */
const positionInRange = (input: EPriceInput): number => {
  const { model, modelIndex, carNo } = input;
  const rank = bodyTypeRanks.indexOf(model.bodyType);
  return (
    ((rank + 1) / (bodyTypeRanks.length + 1)) * priceShares.bodyType +
    ((modelIndex % modelPriceSteps) / modelPriceSteps) * priceShares.model +
    ((carNo % pricesPerModel) / pricesPerModel) * priceShares.car
  );
};

// .............................................................................
/**
 * Returns the discount of a car in percent, 0 for none.
 * @param config - The prices layer configuration
 * @param carNo - The number of the car, starting at 1
 */
const discountOf = (config: Required<EPricesConfig>, carNo: number) =>
  inShare(carNo - 1, config.discountShare)
    ? discountStepPercent * (1 + (carNo % discountSteps))
    : 0;

// .............................................................................
/**
 * Returns the price row of a car.
 *
 * Expensive body types land high in the range, cheap ones low. The model and
 * the car number spread the prices a little: a model has at most a hundred
 * different prices per year. Every raise adds three percent.
 * @param config - The prices layer configuration
 * @param input - What the price depends on
 */
export const priceRow = (
  config: Required<EPricesConfig>,
  input: EPriceInput,
): EPrice => {
  const { min, max } = config.range;
  const base = min + (max - min) * positionInRange(input);
  const raised = base * (1 + raiseShare * input.raises);
  return {
    amount: Math.min(max, roundTo(raised, config.roundTo)),
    currency: input.currency,
    validFrom: `${input.year}-01-01`,
    discountPercent: discountOf(config, input.carNo),
    taxIncluded: true,
  };
};

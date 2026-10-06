// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import type { EWorkshopsConfig } from '../config/config.ts';
import type { EEmitter } from '../core/emitter.ts';
import { padded, pick, pickMany, roundDecimals, slug } from '../core/pick.ts';
import { firstNames, lastNames } from '../dictionaries/people.ts';
import { citiesIn, streets } from '../dictionaries/places.ts';
import type { ECity } from '../dictionaries/places.ts';

import type { EAddress, EPerson, EWorkshop } from './car-world.ts';

// .............................................................................
/** The services a workshop can offer */
export const services: readonly string[] = [
  'inspection',
  'tires',
  'brakes',
  'bodywork',
  'paint',
  'glass',
  'electrics',
  'ev-service',
  'air-conditioning',
  'towing',
];

/** How workshops are named; owner stands for the owner's last name, city for the city */
const nameTemplates: readonly string[] = [
  '{owner} Motors',
  'Autohaus {owner}',
  '{city} Car Service',
  'Garage {owner}',
  '{owner} & Sons',
  '{city} Motor Works',
  'Werkstatt {owner}',
  '{owner} Automotive',
];

/** The telephone country codes of the countries in the places dictionary */
const dialCodes: Readonly<Record<string, string>> = {
  DE: '49',
  FR: '33',
  IT: '39',
  SE: '46',
  CZ: '420',
  ES: '34',
  RO: '40',
  NL: '31',
  HR: '385',
  TR: '90',
  GB: '44',
  JP: '81',
  KR: '82',
  CN: '86',
  IN: '91',
  US: '1',
  MY: '60',
  VN: '84',
  RU: '7',
  AU: '61',
  CH: '41',
  AT: '43',
  PL: '48',
  BE: '32',
  PT: '351',
  DK: '45',
  NO: '47',
  FI: '358',
  IE: '353',
  CA: '1',
  BR: '55',
  MX: '52',
  ZA: '27',
  TH: '66',
  SG: '65',
  AE: '971',
};

/** How generated addresses spread around the center of their city */
const addressSpread = { latSteps: 7, lngSteps: 5, degrees: 0.01 } as const;

/** How generated persons vary with their index */
const personSpread = {
  firstNameStride: 7,
  lastNameStride: 11,
  mobilePrefix: '170',
  phoneBase: 1_000_000,
  oldestBirthYear: 1950,
  birthYears: 50,
  birthYearStride: 13,
} as const;

/** How generated workshops vary with their index */
const workshopSpread = {
  cityStride: 3,
  phoneBase: 2_000_000,
  minServices: 2,
  serviceVariants: 3,
  minRating: 3,
  ratingSteps: 21,
  ratingStride: 7,
} as const;

/** The digits of the subscriber part of a phone number */
const phoneDigits = 7;

// .............................................................................
/**
 * Returns the dial code of a country, 0 when the country is unknown.
 * @param country - The ISO 3166 country code
 */
const dialCodeOf = (country: string): string => dialCodes[country] ?? '0';

// .............................................................................
/**
 * Returns the address with an index in a city. Street and house number
 * derive from the index, so no two indices share an address.
 * @param city - The city
 * @param index - Any non-negative index
 */
export const addressRow = (city: ECity, index: number): EAddress => {
  const { latSteps, lngSteps, degrees } = addressSpread;
  return {
    street: pick(streets, index),
    houseNumber: String(1 + Math.floor(index / streets.length)),
    zip: city.zip,
    city: city.name,
    country: city.country,
    lat: roundDecimals(city.lat + (index % latSteps) * degrees, 4),
    lng: roundDecimals(city.lng + (index % lngSteps) * degrees, 4),
  };
};

// .............................................................................
/**
 * Returns the person with an index. The phone number makes every index a
 * different person, even when the names repeat.
 * @param index - Any non-negative index
 * @param country - The country the phone number belongs to
 */
export const personRow = (index: number, country: string): EPerson => {
  const spread = personSpread;
  const firstName = pick(firstNames, index * spread.firstNameStride);
  const lastName = pick(lastNames, index * spread.lastNameStride);
  const subscriber = padded(spread.phoneBase + index, phoneDigits);
  const birthYearOffset = (index * spread.birthYearStride) % spread.birthYears;
  return {
    firstName,
    lastName,
    email: `${slug(firstName)}.${slug(lastName)}@example.com`,
    phone: `+${dialCodeOf(country)} ${spread.mobilePrefix} ${subscriber}`,
    birthYear: spread.oldestBirthYear + birthYearOffset,
  };
};

// #############################################################################
/** What a workshop row depends on */
interface EWorkshopInput {
  /** The index of the workshop within the world */
  index: number;

  /** The city of the workshop */
  city: ECity;

  /** The owner of the workshop */
  owner: EPerson;

  /** The hash of the address row */
  addressRef: string;

  /** The hash of the owner row */
  ownerRef: string;

  /** The country of the manufacturer */
  country: string;
}

// .............................................................................
/**
 * Returns the row of a workshop.
 * @param input - The index, the city, the owner and the referenced rows
 */
const workshopRow = (input: EWorkshopInput): EWorkshop => {
  const { index, city, owner, country } = input;
  const spread = workshopSpread;
  const name = pick(nameTemplates, index)
    .replace('{owner}', owner.lastName)
    .replace('{city}', city.name);
  const serviceCount = spread.minServices + (index % spread.serviceVariants);
  const ratingTenths = (index * spread.ratingStride) % spread.ratingSteps;
  return {
    name,
    addressRef: input.addressRef,
    ownerRef: input.ownerRef,
    phone: `+${dialCodeOf(country)} ${padded(spread.phoneBase + index, phoneDigits)}`,
    email: `info@${slug(name)}.example`,
    services: pickMany(services, index, serviceCount),
    rating: roundDecimals(spread.minRating + ratingTenths / 10, 1),
  };
};

// #############################################################################
/** What the workshops of a catalog depend on */
export interface EWorkshopsOptions {
  /** Receives the rows */
  emitter: EEmitter;

  /** The workshops layer configuration */
  config: Required<EWorkshopsConfig>;

  /** The index of the manufacturer, for the owner pool */
  manufacturerIndex: number;

  /** The index of the catalog within the world */
  catalogIndex: number;

  /** The country of the manufacturer */
  country: string;
}

// #############################################################################
/** The cities of a country and the number of a workshop within its catalog */
interface EWorkshopSlot {
  cities: readonly ECity[];
  j: number;
}

// .............................................................................
/**
 * Emits one workshop with its address and owner and returns its hash.
 * @param options - What the workshops of the catalog depend on
 * @param position - The cities of the country and the number of the workshop
 */
const generateWorkshop = async (
  options: EWorkshopsOptions,
  position: EWorkshopSlot,
): Promise<string> => {
  const { emitter, config, manufacturerIndex, catalogIndex, country } = options;
  const { cities, j } = position;
  const index = catalogIndex * config.perCatalog + j;
  const city = pick(cities, index * workshopSpread.cityStride);
  const owners = config.ownersPerManufacturer;
  const ownerIndex = manufacturerIndex * owners + (j % owners);

  emitter.phaseIs('addresses');
  const address = await emitter.emit('addresses', addressRow(city, index));
  emitter.phaseIs('persons');
  const owner = personRow(ownerIndex, country);
  const person = await emitter.emit('persons', owner);
  emitter.phaseIs('workshops');
  const row = workshopRow({
    index,
    city,
    owner,
    addressRef: address._hash,
    ownerRef: person._hash,
    country,
  });
  return (await emitter.emit('workshops', row))._hash;
};

// .............................................................................
/**
 * Emits the workshops of a catalog with their addresses and owners, and
 * returns the hashes of the workshops.
 * @param options - The emitter, the layer and the catalog
 */
export const generateWorkshops = async (
  options: EWorkshopsOptions,
): Promise<string[]> => {
  const cities = citiesIn(options.country);
  const result: string[] = [];
  for (let j = 0; j < options.config.perCatalog; j++) {
    result.push(await generateWorkshop(options, { cities, j }));
  }
  return result;
};

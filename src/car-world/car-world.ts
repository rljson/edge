// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import type { Json } from '@rljson/json';
import type {
  CakesTable,
  ComponentsTable,
  LayersTable,
  Ref,
  RevisionsTable,
  Rljson,
  Row,
  SliceIdsTable,
  TablesCfgTable,
  TreesTable,
} from '@rljson/rljson';

import type { EBodyType, EFuel } from '../dictionaries/vehicles.ts';

// #############################################################################
/** A manufacturer: the entry point of the world */
export interface EManufacturer extends Row {
  /** The brand in kebab case, e.g. "mercedes-benz" */
  id: string;

  /** The name of the company */
  name: string;

  /** The brand the cars carry */
  brand: string;

  /** The ISO 3166 country code of the headquarters */
  country: string;

  /** The year the brand was founded */
  founded: number;

  /** The website, a made up address */
  website: string;

  /** The address of the headquarters */
  headquartersRef: Ref;

  /** The catalogs of the manufacturer, every model year, oldest first */
  catalogsRef: Ref[];
}

// #############################################################################
/** A postal address with coordinates */
export interface EAddress extends Row {
  street: string;
  houseNumber: string;
  zip: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
}

// #############################################################################
/** A person, e.g. the owner of a workshop */
export interface EPerson extends Row {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthYear: number;
}

// #############################################################################
/** A workshop that services cars */
export interface EWorkshop extends Row {
  name: string;

  /** The address of the workshop */
  addressRef: Ref;

  /** The person who owns the workshop */
  ownerRef: Ref;

  phone: string;
  email: string;

  /** The services the workshop offers */
  services: string[];

  /** The rating from 3 to 5 */
  rating: number;
}

// #############################################################################
/** The price of a car */
export interface EPrice extends Row {
  amount: number;
  currency: string;

  /** The first day of the model year, as ISO date */
  validFrom: string;

  /** The discount in percent, 0 for none */
  discountPercent: number;

  taxIncluded: boolean;
}

// #############################################################################
/** The brand and model of a car */
export interface EBrand extends Row {
  brand: string;
  model: string;
  bodyType: EBodyType;
  fuel: EFuel;
  powerKw: number;
}

// #############################################################################
/** A part of a bill of materials. Level 0 is the bill itself. */
export interface EPart extends Row {
  name: string;

  /** A part number, unique per manufacturer */
  partNumber: string;

  /** The category, e.g. "engine", or "bom" for the bill of materials */
  category: string;

  /** 0 for the bill of materials, up to 4 for a standard part */
  level: number;

  /** How many of the part the parent contains */
  quantity: number;

  /** The weight of one part in kilograms */
  weightKg: number;

  /** The material, or null for an assembly */
  material: string | null;

  /** The sub parts, empty for a leaf */
  subPartRefs: Ref[];
}

// #############################################################################
/** The meta data of a node of a CAD scene */
export interface ECadMeta extends Json {
  /** A group has children, a mesh has geometry */
  type: 'group' | 'mesh';

  /** What the scene shows, e.g. the model or the car it belongs to */
  variant: string;

  /** The position, rotation and scale relative to the parent */
  transform: { position: number[]; rotation: number[]; scale: number[] };

  /** The material of a mesh, null for a group */
  material: string | null;

  /** The number of vertices of a mesh, null for a group */
  vertices: number | null;

  /** Width, height and depth in meters */
  boundsM: number[];

  /** The part the mesh shows, or null */
  partRef: Ref | null;
}

// #############################################################################
/** The generated world: an Rljson object with typed tables */
export interface ECarWorld extends Rljson {
  manufacturers: ComponentsTable<EManufacturer>;
  addresses: ComponentsTable<EAddress>;
  persons: ComponentsTable<EPerson>;
  workshops: ComponentsTable<EWorkshop>;
  prices: ComponentsTable<EPrice>;
  brands: ComponentsTable<EBrand>;
  parts: ComponentsTable<EPart>;
  cadScenes: TreesTable;
  carIds: SliceIdsTable;
  carPrices: LayersTable;
  carBrands: LayersTable;
  carWorkshops: LayersTable;
  carParts: LayersTable;
  carCad: LayersTable;
  catalogs: CakesTable;
  revisions: RevisionsTable;
  tableCfgs: TablesCfgTable;
}

// .............................................................................
/** The keys of the tables of a car world, in the order they are announced */
export const carWorldTableKeys = [
  'tableCfgs',
  'addresses',
  'persons',
  'workshops',
  'prices',
  'brands',
  'parts',
  'cadScenes',
  'carIds',
  'carPrices',
  'carBrands',
  'carWorkshops',
  'carParts',
  'carCad',
  'catalogs',
  'revisions',
  'manufacturers',
] as const;

// #############################################################################
/** The key of a table of a car world */
export type ECarWorldTableKey = (typeof carWorldTableKeys)[number];

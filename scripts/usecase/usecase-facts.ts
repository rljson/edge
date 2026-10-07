// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import { Edge } from '../../src/edge.ts';
import { edgePresetNames, edgePresets } from '../../src/config/presets.ts';
import { mergeConfigs } from '../../src/edge.ts';
import { resolveSliceIds } from '@rljson/rljson';
import type { SliceIdsTable } from '@rljson/rljson';
import type {
  EAddress,
  EBrand,
  ECadMeta,
  EManufacturer,
  EPart,
  EPerson,
  EPrice,
  EWorkshop,
} from '../../src/car-world/car-world.ts';

// .............................................................................
/** A car of a catalog, in plain words */
export interface UcCar {
  id: string;
  number: number;
  model: string;
  bodyType: string;
  fuel: string;
  powerKw: number;
  price: number;
  currency: string;
  workshop: string;
}

/** A workshop with its owner and address */
export interface UcWorkshop {
  name: string;
  owner: string;
  street: string;
  city: string;
  services: string[];
  rating: number;
}

/** A part of a bill of materials with its sub parts */
export interface UcPart {
  name: string;
  quantity: number;
  material: string | null;
  level: number;
  children: UcPart[];
}

/** A node of a CAD scene */
export interface UcCadNode {
  id: string;
  type: 'group' | 'mesh';
  material: string | null;
  part: string | null;
  children: UcCadNode[];
}

/** A catalog: one model year of a manufacturer */
export interface UcCatalog {
  year: number;
  cars: UcCar[];
}

/** One size of the world */
export interface UcSize {
  name: string;
  manufacturers: number;
  cars: number;
  rows: number;
}

/** Everything the use case pages show, taken from a generated world */
export interface UcFacts {
  manufacturer: {
    name: string;
    brand: string;
    founded: number;
    country: string;
    headquarters: string;
  };
  catalogs: UcCatalog[];
  workshops: UcWorkshop[];
  car: UcCar;
  parts: UcPart;
  cad: UcCadNode;
  revision: {
    from: number;
    to: number;
    added: UcCar[];
    changed: { before: UcCar; after: UcCar }[];
  };
  sizes: UcSize[];
}

// .............................................................................
/** The world the use case pages show: the tiny preset, with a second year and screws */
export const usecaseEdge = (): Edge =>
  new Edge(
    mergeConfigs(edgePresets.tiny, {
      catalogs: { revisions: { count: 1 } },
      layers: { parts: { depth: 4 } },
    }),
  );

// .............................................................................
type Rows = { _data: any[] };

/**
 * Indexes the rows of a table by hash.
 * @param table - The table
 */
const byHash = <T>(table: Rows): Map<string, T> =>
  new Map(table._data.map((row) => [row._hash as string, row as T]));

/** The tables of a generated world, indexed by hash */
interface UcIndex {
  world: Record<string, Rows>;
  addresses: Map<string, EAddress>;
  persons: Map<string, EPerson>;
  workshops: Map<string, EWorkshop>;
  prices: Map<string, EPrice>;
  brands: Map<string, EBrand>;
  parts: Map<string, EPart>;
  cadNodes: Map<string, any>;
  catalogs: Map<string, any>;
  layers: Map<string, any>;
}

/**
 * Indexes the tables of a generated world by hash.
 * @param world - The world
 */
const indexWorld = (world: Record<string, Rows>): UcIndex => {
  const layers = new Map<string, any>();
  for (const key of [
    'carPrices',
    'carBrands',
    'carWorkshops',
    'carParts',
    'carCad',
  ]) {
    for (const [hash, row] of byHash<any>(world[key])) layers.set(hash, row);
  }
  return {
    world,
    addresses: byHash(world.addresses),
    persons: byHash(world.persons),
    workshops: byHash(world.workshops),
    prices: byHash(world.prices),
    brands: byHash(world.brands),
    parts: byHash(world.parts),
    cadNodes: byHash(world.cadScenes),
    catalogs: byHash(world.catalogs),
    layers,
  };
};

/**
 * Resolves a layer row and its bases into a map from car id to row hash.
 * @param layers - The rows of the layer tables by hash
 * @param hash - The hash of the layer row
 */
const resolveLayer = (
  layers: Map<string, any>,
  hash: string,
): Map<string, string> => {
  const layer = layers.get(hash)!;
  const result = layer.base
    ? resolveLayer(layers, layer.base)
    : new Map<string, string>();
  for (const [car, ref] of Object.entries(layer.add ?? {})) {
    if (car !== '_hash') result.set(car, ref as string);
  }
  for (const car of Object.keys(layer.remove ?? {})) result.delete(car);
  return result;
};

// .............................................................................
/**
 * Describes the manufacturer of the world.
 * @param ix - The indexed world
 */
const manufacturerFacts = (ix: UcIndex): UcFacts['manufacturer'] => {
  const m = ix.world.manufacturers._data[0] as EManufacturer;
  const hq = ix.addresses.get(m.headquartersRef)!;
  return {
    name: m.name,
    brand: m.brand,
    founded: m.founded,
    country: m.country,
    headquarters: `${hq.street} ${hq.houseNumber}, ${hq.city}`,
  };
};

/**
 * Describes a workshop with its owner and address.
 * @param ix - The indexed world
 * @param row - The workshop
 */
const workshopFacts = (ix: UcIndex, row: EWorkshop): UcWorkshop => {
  const owner = ix.persons.get(row.ownerRef)!;
  const address = ix.addresses.get(row.addressRef)!;
  return {
    name: row.name,
    owner: `${owner.firstName} ${owner.lastName}`,
    street: `${address.street} ${address.houseNumber}`,
    city: address.city,
    services: row.services,
    rating: row.rating,
  };
};

/** A catalog with the bill of materials and the scene of each car */
interface UcResolvedCatalog extends UcCatalog {
  partsOfCar: Map<string, string>;
  cadOfCar: Map<string, string>;
}

/**
 * Describes a catalog and its cars.
 * @param ix - The indexed world
 * @param ref - The hash of the catalog
 */
const catalogFacts = (ix: UcIndex, ref: string): UcResolvedCatalog => {
  const catalog = ix.catalogs.get(ref)!;
  const layer = (key: string) => resolveLayer(ix.layers, catalog.layers[key]);
  const [price, brand, shop] = ['carPrices', 'carBrands', 'carWorkshops'].map(
    layer,
  );
  const sliceIds = ix.world.carIds as unknown as SliceIdsTable;
  const row = sliceIds._data.find((r) => r._hash === catalog.sliceIdsRow)!;

  const cars = resolveSliceIds(sliceIds, row).map((id): UcCar => {
    const b = ix.brands.get(brand.get(id)!)!;
    const p = ix.prices.get(price.get(id)!)!;
    return {
      id,
      number: Number(id.split('-').pop()),
      model: `${b.brand} ${b.model}`,
      bodyType: b.bodyType,
      fuel: b.fuel,
      powerKw: b.powerKw,
      price: p.amount,
      currency: p.currency,
      workshop: ix.workshops.get(shop.get(id)!)!.name,
    };
  });

  return {
    year: Number(catalog.id.split('-').pop()),
    cars,
    partsOfCar: layer('carParts'),
    cadOfCar: layer('carCad'),
  };
};

/**
 * Describes a part and its sub parts.
 * @param ix - The indexed world
 * @param hash - The hash of the part
 */
const partFacts = (ix: UcIndex, hash: string): UcPart => {
  const row = ix.parts.get(hash)!;
  return {
    name: row.name,
    quantity: row.quantity,
    material: row.material,
    level: row.level,
    children: row.subPartRefs.map((ref) => partFacts(ix, ref)),
  };
};

/**
 * Describes a node of a CAD scene and its children.
 * @param ix - The indexed world
 * @param hash - The hash of the node
 */
const cadFacts = (ix: UcIndex, hash: string): UcCadNode => {
  const row = ix.cadNodes.get(hash)!;
  const meta = row.meta as ECadMeta;
  return {
    id: row.id,
    type: meta.type,
    material: meta.material,
    part: meta.partRef ? ix.parts.get(meta.partRef)!.name : null,
    children: (row.children ?? []).map((ref: string) => cadFacts(ix, ref)),
  };
};

/**
 * Describes what the second catalog adds and changes.
 * @param first - The first catalog
 * @param second - The second catalog
 */
const revisionFacts = (
  first: UcCatalog,
  second: UcCatalog,
): UcFacts['revision'] => {
  const before = new Map(first.cars.map((c) => [c.id, c]));
  return {
    from: first.year,
    to: second.year,
    added: second.cars.filter((c) => !before.has(c.id)),
    changed: second.cars
      .filter((c) => before.has(c.id) && before.get(c.id)!.price !== c.price)
      .map((after) => ({ before: before.get(after.id)!, after })),
  };
};

/** Describes the sizes of the presets */
const sizeFacts = (): UcSize[] =>
  edgePresetNames.map((name): UcSize => {
    const estimate = new Edge(edgePresets[name]).estimate();
    return {
      name,
      manufacturers: edgePresets[name].manufacturers!.count!,
      cars: estimate.cars,
      rows: estimate.rowsTotal,
    };
  });

// .............................................................................
/** Generates the use case world and collects the facts the pages show */
export const usecaseFacts = async (): Promise<UcFacts> => {
  const { world } = await usecaseEdge().generate();
  const ix = indexWorld(world as unknown as Record<string, Rows>);
  const m = ix.world.manufacturers._data[0] as EManufacturer;
  const [first, second] = m.catalogsRef.map((ref) => catalogFacts(ix, ref));
  const car = first.cars[0];
  const strip = ({ year, cars }: UcResolvedCatalog): UcCatalog => ({
    year,
    cars,
  });

  return {
    manufacturer: manufacturerFacts(ix),
    catalogs: [strip(first), strip(second)],
    workshops: [...ix.workshops.values()].map((w) => workshopFacts(ix, w)),
    car,
    parts: partFacts(ix, first.partsOfCar.get(car.id)!),
    cad: cadFacts(ix, first.cadOfCar.get(car.id)!),
    revision: revisionFacts(first, second),
    sizes: sizeFacts(),
  };
};

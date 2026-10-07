// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import { Edge } from '../../src/edge.ts';
import { edgePresetNames, edgePresets } from '../../src/config/presets.ts';
import { mergeConfigs } from '../../src/edge.ts';
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

/**
 * Resolves a layer row and its bases into a map from car id to row hash.
 * @param layers - The rows of the layer table by hash
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

/**
 * Resolves the car ids of a slice ids row and its bases.
 * @param sliceIds - The rows of the slice ids table by hash
 * @param hash - The hash of the slice ids row
 */
const resolveSliceIds = (
  sliceIds: Map<string, any>,
  hash: string,
): string[] => {
  const row = sliceIds.get(hash)!;
  const base = row.base ? resolveSliceIds(sliceIds, row.base) : [];
  const removed = new Set<string>(row.remove ?? []);
  return [...base, ...row.add].filter((id) => !removed.has(id));
};

// .............................................................................
/** Generates the use case world and collects the facts the pages show */
export const usecaseFacts = async (): Promise<UcFacts> => {
  const { world } = await usecaseEdge().generate();
  const w = world as unknown as Record<string, Rows>;

  const addresses = byHash<EAddress>(w.addresses);
  const persons = byHash<EPerson>(w.persons);
  const workshopRows = byHash<EWorkshop>(w.workshops);
  const prices = byHash<EPrice>(w.prices);
  const brands = byHash<EBrand>(w.brands);
  const parts = byHash<EPart>(w.parts);
  const cadNodes = byHash<any>(w.cadScenes);
  const sliceIds = byHash<any>(w.carIds);
  const layerRows = new Map<string, any>();
  for (const key of [
    'carPrices',
    'carBrands',
    'carWorkshops',
    'carParts',
    'carCad',
  ]) {
    for (const [h, row] of byHash<any>(w[key])) layerRows.set(h, row);
  }

  // Manufacturer
  const m = w.manufacturers._data[0] as EManufacturer;
  const hq = addresses.get(m.headquartersRef)!;

  // Workshops
  const workshop = (row: EWorkshop): UcWorkshop => {
    const owner = persons.get(row.ownerRef)!;
    const address = addresses.get(row.addressRef)!;
    return {
      name: row.name,
      owner: `${owner.firstName} ${owner.lastName}`,
      street: `${address.street} ${address.houseNumber}`,
      city: address.city,
      services: row.services,
      rating: row.rating,
    };
  };

  // Catalogs
  const catalogRows = byHash<any>(w.catalogs);
  const catalogs: UcCatalog[] = [];
  const cadOfCar = new Map<string, string>();
  const partsOfCar = new Map<string, string>();
  for (const ref of m.catalogsRef) {
    const catalog = catalogRows.get(ref)!;
    const ids = resolveSliceIds(sliceIds, catalog.sliceIdsRow);
    const price = resolveLayer(layerRows, catalog.layers.carPrices);
    const brand = resolveLayer(layerRows, catalog.layers.carBrands);
    const shop = resolveLayer(layerRows, catalog.layers.carWorkshops);
    const bom = resolveLayer(layerRows, catalog.layers.carParts);
    const cad = resolveLayer(layerRows, catalog.layers.carCad);
    const cars = ids.map((id): UcCar => {
      const b = brands.get(brand.get(id)!)!;
      const p = prices.get(price.get(id)!)!;
      partsOfCar.set(id, bom.get(id)!);
      cadOfCar.set(id, cad.get(id)!);
      return {
        id,
        number: Number(id.split('-').pop()),
        model: `${b.brand} ${b.model}`,
        bodyType: b.bodyType,
        fuel: b.fuel,
        powerKw: b.powerKw,
        price: p.amount,
        currency: p.currency,
        workshop: workshopRows.get(shop.get(id)!)!.name,
      };
    });
    catalogs.push({ year: Number(catalog.id.split('-').pop()), cars });
  }

  // The example car: the first car of the first catalog
  const car = catalogs[0].cars[0];

  const part = (hash: string): UcPart => {
    const row = parts.get(hash)!;
    return {
      name: row.name,
      quantity: row.quantity,
      material: row.material,
      level: row.level,
      children: row.subPartRefs.map(part),
    };
  };

  const cadNode = (hash: string): UcCadNode => {
    const row = cadNodes.get(hash)!;
    const meta = row.meta as ECadMeta;
    return {
      id: row.id,
      type: meta.type,
      material: meta.material,
      part: meta.partRef ? parts.get(meta.partRef)!.name : null,
      children: (row.children ?? []).map(cadNode),
    };
  };

  // The revision: what the second year adds and changes
  const [first, second] = catalogs;
  const before = new Map(first.cars.map((c) => [c.id, c]));
  const added = second.cars.filter((c) => !before.has(c.id));
  const changed = second.cars
    .filter((c) => before.has(c.id) && before.get(c.id)!.price !== c.price)
    .map((after) => ({ before: before.get(after.id)!, after }));

  // The sizes
  const sizes = edgePresetNames.map((name): UcSize => {
    const estimate = new Edge(edgePresets[name]).estimate();
    return {
      name,
      manufacturers: edgePresets[name].manufacturers!.count!,
      cars: estimate.cars,
      rows: estimate.rowsTotal,
    };
  });

  return {
    manufacturer: {
      name: m.name,
      brand: m.brand,
      founded: m.founded,
      country: m.country,
      headquarters: `${hq.street} ${hq.houseNumber}, ${hq.city}`,
    },
    catalogs,
    workshops: [...workshopRows.values()].map(workshop),
    car,
    parts: part(partsOfCar.get(car.id)!),
    cad: cadNode(cadOfCar.get(car.id)!),
    revision: { from: first.year, to: second.year, added, changed },
    sizes,
  };
};

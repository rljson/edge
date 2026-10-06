// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import type { Cake, Layer, Revision, SliceIds } from '@rljson/rljson';

import type {
  ECadConfig,
  EPartsConfig,
  EResolvedConfig,
  EResolvedLayers,
  ESharing,
} from '../config/config.ts';
import type { EEmitter } from '../core/emitter.ts';
import { pick } from '../core/pick.ts';
import type { EVehicleModel } from '../dictionaries/vehicles.ts';

import { brandRow } from './brands.ts';
import { EBomBuilder } from './bom-builder.ts';
import type { EBom } from './bom-builder.ts';
import { ESceneBuilder } from './scene-builder.ts';
import {
  carNoOf,
  catalogBaseId,
  modelCountOf,
  modelIndexOf,
  planVersions,
  segmentOf,
  variantOf,
} from './plan.ts';
import type { EVariant, EVersionPlan } from './plan.ts';
import { priceRow } from './prices.ts';
import type { EPriceInput } from './prices.ts';
import { generateWorkshops } from './workshops.ts';

// #############################################################################
/** What a catalog needs to know about its manufacturer */
export interface ECatalogManufacturer {
  /** The index of the manufacturer within the world */
  index: number;

  /** The id of the manufacturer, e.g. "audi" */
  id: string;

  /** The part number prefix, e.g. "AUD" */
  prefix: string;

  /** The ISO 3166 country code */
  country: string;

  /** The models the manufacturer offers */
  models: readonly EVehicleModel[];
}

// #############################################################################
/** Bills of materials and scenes shared by the catalogs of a manufacturer */
export interface ECatalogCaches {
  boms: Map<string, EBom>;
  scenes: Map<string, string>;
}

// #############################################################################
/** What generating a catalog yields */
export interface ECatalogResult {
  /** The hashes of the cakes, one per model year, oldest first */
  cakeRefs: string[];

  /** How many different cars the catalog lists over all years */
  cars: number;
}

// #############################################################################
/** What a catalog generator needs */
export interface ECatalogGeneratorOptions {
  /** Receives the rows */
  emitter: EEmitter;

  /** The resolved configuration */
  config: EResolvedConfig;

  /** The manufacturer of the catalog */
  manufacturer: ECatalogManufacturer;

  /** The index of the catalog within the manufacturer */
  catalogIndex: number;

  /** Bills of materials and scenes shared within the manufacturer */
  caches: ECatalogCaches;
}

// #############################################################################
/** The aspects a layer can describe */
type EAspect = 'prices' | 'brands' | 'workshops' | 'parts' | 'cad';

// #############################################################################
/** A cache, who shares its entries, and how to build an entry */
interface ESharedEntry<T> {
  cache: Map<string, T>;
  sharing: ESharing;
  car: string;
  build: (variant: EVariant) => Promise<T>;
}

// .............................................................................
/** The layers table and the components table of every aspect */
const aspectTables: Readonly<
  Record<EAspect, { layer: string; components: string }>
> = {
  prices: { layer: 'carPrices', components: 'prices' },
  brands: { layer: 'carBrands', components: 'brands' },
  workshops: { layer: 'carWorkshops', components: 'workshops' },
  parts: { layer: 'carParts', components: 'parts' },
  cad: { layer: 'carCad', components: 'cadScenes' },
};

// #############################################################################
/**
 * Emits one catalog with all its model years: components, slice ids, layers,
 * cakes and revisions.
 *
 * Every model year is a cake of its own. Its slice ids and layers build on
 * the year before, and a revision links the two cakes. Generate once per
 * instance.
 */
export class ECatalogGenerator {
  /**
   * Constructor
   * @param options - The emitter, the configuration and the catalog
   */
  constructor(private readonly options: ECatalogGeneratorOptions) {
    const { config, manufacturer, catalogIndex } = options;
    const { layers, catalogs } = config;
    this.catalogGlobal =
      manufacturer.index * config.manufacturers.catalogsPerManufacturer +
      catalogIndex;
    this.baseId = catalogBaseId(manufacturer.id, catalogIndex);
    this.segment = segmentOf(catalogIndex);
    this.plan = planVersions({
      baseId: this.baseId,
      cars: catalogs.carsPerCatalog,
      startYear: catalogs.startYear,
      revisions: catalogs.revisions,
    });
    this.modelCount = modelCountOf(config, manufacturer.models);
    this.currency = layers.prices
      ? pick(layers.prices.currencies, this.catalogGlobal)
      : '';
    this.aspects = (Object.keys(aspectTables) as EAspect[]).filter(
      (aspect) => layers[aspect] !== false,
    );
  }

  // ...........................................................................
  /** Emits the catalog and returns the hashes of its cakes */
  async generate(): Promise<ECatalogResult> {
    this.workshopRefs = await this.generateWorkshops();
    for (const version of this.plan) {
      await this.generateVersion(version);
    }
    const cars = this.plan.reduce((sum, v) => sum + v.added.length, 0);
    return { cakeRefs: this.cakeRefs, cars };
  }

  // ######################
  // Private
  // ######################

  private readonly catalogGlobal: number;
  private readonly baseId: string;
  private readonly segment: string;
  private readonly plan: EVersionPlan[];
  private readonly modelCount: number;
  private readonly currency: string;
  private readonly aspects: EAspect[];

  private workshopRefs: string[] = [];
  private previousSliceRef = '';
  private readonly cakeRefs: string[] = [];
  private readonly previousLayer: Partial<Record<EAspect, string>> = {};
  private readonly raises = new Map<string, number>();
  private readonly versionBoms = new Map<string, EBom>();
  private readonly current: Record<EAspect, Map<string, string>> = {
    prices: new Map(),
    brands: new Map(),
    workshops: new Map(),
    parts: new Map(),
    cad: new Map(),
  };

  private get emitter(): EEmitter {
    return this.options.emitter;
  }

  private get layers(): EResolvedLayers {
    return this.options.config.layers;
  }

  private isFirst(version: EVersionPlan): boolean {
    return version === this.plan[0];
  }

  private newCarsOf(version: EVersionPlan): string[] {
    return this.isFirst(version) ? version.carIds : version.added;
  }

  private async generateWorkshops(): Promise<string[]> {
    const { emitter, manufacturer } = this.options;
    if (!this.layers.workshops) {
      return [];
    }
    return generateWorkshops({
      emitter,
      config: this.layers.workshops,
      manufacturerIndex: manufacturer.index,
      catalogIndex: this.catalogGlobal,
      country: manufacturer.country,
    });
  }

  private async generateVersion(version: EVersionPlan): Promise<void> {
    const cars = this.newCarsOf(version);
    const sliceRef = await this.emitSliceIds(version);
    await this.assignBrands(cars);
    await this.assignPrices(version);
    this.assignWorkshops(cars);
    this.versionBoms.clear();
    await this.assignParts(cars);
    await this.assignScenes(cars);
    const cakeLayers = await this.emitLayers(version, sliceRef);
    this.forget(version.removed);
    await this.emitCake(version, { sliceRef, cakeLayers });
  }

  // ...........................................................................
  // Components

  private modelIndexOf(car: string): number {
    const popularity = this.layers.brands
      ? this.layers.brands.popularity
      : 'uniform';
    return modelIndexOf({
      carNo: carNoOf(car),
      initialCars: this.options.config.catalogs.carsPerCatalog,
      models: this.modelCount,
      popularity,
    });
  }

  private async assignBrands(cars: string[]): Promise<void> {
    if (!this.layers.brands) {
      return;
    }
    this.emitter.phaseIs('brands');
    for (const car of cars) {
      const modelIndex = this.modelIndexOf(car);
      const model = this.options.manufacturer.models[modelIndex];
      const brand = await this.emitter.emit(
        'brands',
        brandRow(model, modelIndex),
      );
      this.current.brands.set(car, brand._hash);
    }
  }

  private async assignPrices(version: EVersionPlan): Promise<void> {
    const prices = this.layers.prices;
    if (!prices) {
      return;
    }
    this.emitter.phaseIs('prices');
    for (const car of version.changed) {
      this.raises.set(car, (this.raises.get(car) ?? 0) + 1);
    }
    for (const car of [...this.newCarsOf(version), ...version.changed]) {
      const row = priceRow(prices, this.priceInputOf(car, version.year));
      const price = await this.emitter.emit('prices', row);
      this.current.prices.set(car, price._hash);
    }
  }

  private priceInputOf(car: string, year: number): EPriceInput {
    const modelIndex = this.modelIndexOf(car);
    return {
      model: this.options.manufacturer.models[modelIndex],
      modelIndex,
      carNo: carNoOf(car),
      year,
      currency: this.currency,
      raises: this.raises.get(car) ?? 0,
    };
  }

  private assignWorkshops(cars: string[]): void {
    if (!this.layers.workshops) {
      return;
    }
    for (const car of cars) {
      const workshop = pick(this.workshopRefs, carNoOf(car) - 1);
      this.current.workshops.set(car, workshop);
    }
  }

  private async assignParts(cars: string[]): Promise<void> {
    const parts = this.layers.parts;
    if (!parts) {
      return;
    }
    this.emitter.phaseIs('parts');
    for (const car of cars) {
      this.current.parts.set(car, (await this.bomOf(car, parts)).rootRef);
    }
  }

  private async assignScenes(cars: string[]): Promise<void> {
    const cad = this.layers.cad;
    if (!cad) {
      return;
    }
    this.emitter.phaseIs('cadScenes');
    for (const car of cars) {
      this.current.cad.set(car, await this.sceneOf(car, cad));
    }
  }

  // ...........................................................................
  // Bills of materials and scenes

  private variantOf(sharing: ESharing, car: string): EVariant {
    const modelIndex = this.modelIndexOf(car);
    return variantOf({
      sharing,
      sliceId: car,
      model: this.options.manufacturer.models[modelIndex],
      modelIndex,
      segment: this.segment,
      catalogIndex: this.options.catalogIndex,
    });
  }

  private async shared<T>(entry: ESharedEntry<T>): Promise<T> {
    const { cache, sharing, car, build } = entry;
    const variant = this.variantOf(sharing, car);
    const cached = cache.get(variant.code);
    if (cached) {
      return cached;
    }
    const result = await build(variant);
    cache.set(variant.code, result);
    return result;
  }

  private bomOf(car: string, config: Required<EPartsConfig>): Promise<EBom> {
    const { emitter, manufacturer, caches } = this.options;
    const cache = config.sharing === 'perCar' ? this.versionBoms : caches.boms;
    return this.shared({
      cache,
      sharing: config.sharing,
      car,
      build: (variant) =>
        new EBomBuilder({
          emitter,
          config,
          prefix: manufacturer.prefix,
          variant,
        }).build(),
    });
  }

  private sceneOf(car: string, config: Required<ECadConfig>): Promise<string> {
    const cache =
      config.sharing === 'perCar' ? new Map() : this.options.caches.scenes;
    return this.shared({
      cache,
      sharing: config.sharing,
      car,
      build: async (variant) =>
        new ESceneBuilder({
          emitter: this.emitter,
          config,
          variant,
          partRefs: await this.partRefsOf(car, config),
        }).build(),
    });
  }

  private async partRefsOf(
    car: string,
    cad: Required<ECadConfig>,
  ): Promise<string[]> {
    const parts = this.layers.parts;
    if (!parts || !cad.linkToParts) {
      return [];
    }
    return (await this.bomOf(car, parts)).partRefs;
  }

  // ...........................................................................
  // Slice ids, layers, cakes and revisions

  private async emitSliceIds(version: EVersionPlan): Promise<string> {
    this.emitter.phaseIs('carIds');
    const sliceIds: SliceIds = this.isFirst(version)
      ? { add: version.carIds }
      : {
          base: this.previousSliceRef,
          add: version.added,
          remove: version.removed,
        };
    this.previousSliceRef = (await this.emitter.emit('carIds', sliceIds))._hash;
    return this.previousSliceRef;
  }

  private async emitLayers(
    version: EVersionPlan,
    sliceRef: string,
  ): Promise<Record<string, string>> {
    this.emitter.phaseIs('layers');
    const cakeLayers: Record<string, string> = {};
    for (const aspect of this.aspects) {
      const table = aspectTables[aspect].layer;
      const layer = this.layerOf(aspect, { version, sliceRef });
      const ref = (await this.emitter.emit(table, layer))._hash;
      cakeLayers[table] = ref;
      this.previousLayer[aspect] = ref;
    }
    return cakeLayers;
  }

  private layerOf(
    aspect: EAspect,
    { version, sliceRef }: { version: EVersionPlan; sliceRef: string },
  ): Layer {
    const assignment = (car: string): [string, string] => [
      car,
      this.current[aspect].get(car) as string,
    ];
    const layer: Layer = {
      sliceIdsTable: 'carIds',
      sliceIdsTableRow: sliceRef,
      componentsTable: aspectTables[aspect].components,
      add: Object.fromEntries(this.addedCars(aspect, version).map(assignment)),
    };
    if (this.isFirst(version)) {
      return layer;
    }
    layer.base = this.previousLayer[aspect];
    if (version.removed.length > 0) {
      layer.remove = Object.fromEntries(version.removed.map(assignment));
    }
    return layer;
  }

  private addedCars(aspect: EAspect, version: EVersionPlan): string[] {
    if (this.isFirst(version)) {
      return version.carIds;
    }
    return aspect === 'prices'
      ? [...version.added, ...version.changed]
      : version.added;
  }

  private forget(removed: string[]): void {
    for (const car of removed) {
      for (const aspect of this.aspects) {
        this.current[aspect].delete(car);
      }
    }
  }

  private async emitCake(
    version: EVersionPlan,
    {
      sliceRef,
      cakeLayers,
    }: { sliceRef: string; cakeLayers: Record<string, string> },
  ): Promise<void> {
    this.emitter.phaseIs('catalogs');
    const cake: Cake = {
      id: `${this.baseId}-${version.year}`,
      sliceIdsTable: 'carIds',
      sliceIdsRow: sliceRef,
      layers: cakeLayers,
    };
    const cakeRef = (await this.emitter.emit('catalogs', cake))._hash;
    if (!this.isFirst(version)) {
      await this.emitRevision(version, cakeRef);
    }
    this.cakeRefs.push(cakeRef);
  }

  private async emitRevision(
    version: EVersionPlan,
    successor: string,
  ): Promise<void> {
    this.emitter.phaseIs('revisions');
    const revision: Revision = {
      table: 'catalogs',
      predecessor: this.cakeRefs[this.cakeRefs.length - 1],
      successor,
      timestamp: Date.UTC(version.year, 0, 1),
      id: this.baseId,
    };
    await this.emitter.emit('revisions', revision);
  }
}

// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

export { Edge, mergeConfigs } from './edge.ts';
export type { EStats } from './edge.ts';

export { edgeDefaults, resolveEdgeConfig } from './config/config.ts';
export type {
  EBrandsConfig,
  ECadConfig,
  EConfig,
  ELayersConfig,
  EPartsConfig,
  EPricesConfig,
  EProgress,
  EResolvedConfig,
  EResolvedLayers,
  ERevisionsConfig,
  ESharing,
  EWorkshopsConfig,
} from './config/config.ts';
export { edgePresetNames, edgePresets } from './config/presets.ts';
export type { EPresetName } from './config/presets.ts';

export { EMemorySink } from './core/sink.ts';
export type { ESink } from './core/sink.ts';
export type { EEstimate } from './core/estimate.ts';

export { carWorldTableKeys } from './car-world/car-world.ts';
export type {
  EAddress,
  EBrand,
  ECadMeta,
  ECarWorld,
  ECarWorldTableKey,
  EManufacturer,
  EPart,
  EPerson,
  EPrice,
  EWorkshop,
} from './car-world/car-world.ts';
export { carWorldTableCfgs } from './car-world/table-cfgs.ts';

export { manufacturers } from './dictionaries/manufacturers.ts';
export type { EManufacturerEntry } from './dictionaries/manufacturers.ts';
export { modelsOf, vehicles } from './dictionaries/vehicles.ts';
export type {
  EBodyType,
  EFuel,
  EVehicleModel,
} from './dictionaries/vehicles.ts';
export {
  assemblies,
  materialsOf,
  standardParts,
} from './dictionaries/parts.ts';
export type {
  EAssembly,
  EStandardPart,
  ESubAssembly,
} from './dictionaries/parts.ts';
export { cadDetails, cadMaterials, cadSystems } from './dictionaries/cad.ts';
export type { ECadSystem } from './dictionaries/cad.ts';
export { cities, citiesIn, cityNamed, streets } from './dictionaries/places.ts';
export type { ECity } from './dictionaries/places.ts';
export { firstNames, lastNames } from './dictionaries/people.ts';

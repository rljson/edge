<!--
@license
Copyright (c) 2025 Rljson

Use of this source code is governed by terms that can be
found in the LICENSE file in the root of this package.
-->

# @rljson/edge - The Rljson Example Data Generator

Edge generates example data for Rljson applications: a car world with
manufacturers, their catalogs of cars, and for every car a price, a brand,
a workshop, a bill of materials and a CAD scene. One generated world uses
every Rljson data type, from a hundred rows for a unit test to 25 million
rows for a load test.

## Goals

- Give the Uikit, `db`, the `io` backends and the validators realistic test
  data in every Rljson data type
- Generate the same rows and hashes on every run and every machine, without
  random numbers
- Scale from a unit test fixture to a load test with 20 million objects
- Run in Node.js, in the browser and in Web Workers, without file system or
  database dependencies
- Keep the data vivid: real brands and models, plausible parts, workshops
  with addresses and owners

## State

[![Tests](https://github.com/rljson/edge/actions/workflows/quick_check.yaml/badge.svg)](https://github.com/rljson/edge/actions/workflows/quick_check.yaml)

## Installation

```bash
pnpm add @rljson/edge @rljson/rljson
```

## Documentation

- [Example data generator](https://github.com/rljson/rljson-pm/blob/main/doc/2026-Q4/concepts/topics/example-data-generator.md):
  design, sizes and ideas, in the project management repo
- [Decisions edge-001 to edge-004](https://github.com/rljson/rljson-pm/blob/main/doc/2026-Q4/concepts/decisions/000-index.md):
  no buffets, no randomness, callback sinks, derived model years
- The section »Generate Rljson« on [rljson.github.io](https://rljson.github.io):
  step-by-step tutorials
- [Guides](doc/guides): how to develop, test and review in this repo

## Code Examples

[src/example.ts](src/example.ts) runs these examples in the tests.

Generate a world in memory:

```ts
import { Edge } from '@rljson/edge';

// The tiny preset: one manufacturer with one catalog of five cars
const { world, stats } = await Edge.preset('tiny').generate();

console.log(`${stats.cars} cars, ${stats.rowsTotal} rows`);
console.log(world.manufacturers._data[0].name);
```

Configure a world and estimate its size first:

```ts
import { Edge } from '@rljson/edge';

const edge = new Edge({
  manufacturers: { count: 2, catalogsPerManufacturer: 2 },
  catalogs: { carsPerCatalog: 20, revisions: { count: 1 } },
  layers: {
    prices: { currencies: ['EUR', 'CHF'], range: { min: 20000, max: 80000 } },
    brands: { modelsPerManufacturer: 3, popularity: 'zipf' },
    workshops: { perCatalog: 4 },
    parts: { depth: 3, fanOut: 2 },
    cad: { depth: 2, fanOut: 3 },
  },
});

console.log(`estimated rows: ${edge.estimate().rowsTotal}`);
const { stats } = await edge.generate();
console.log(`generated rows: ${stats.rowsTotal}`);
```

Stream the rows of a large world through a callback instead of keeping
them:

```ts
import { Edge } from '@rljson/edge';

const rowsPerTable: Record<string, number> = {};
await Edge.preset('small').run({
  onRow: (table) => {
    rowsPerTable[table] = (rowsPerTable[table] ?? 0) + 1;
  },
});
console.log(`prices: ${rowsPerTable.prices}, parts: ${rowsPerTable.parts}`);
```

## How It Works

### The world

```text
Manufacturers              components  manufacturers   (the entry point)
└─ Manufacturer
   ├─ Headquarters         components  addresses
   └─ Catalogs             jsonArray   manufacturers.catalogsRef
      └─ Catalog           cakes       catalogs        (slices are cars)
         ├─ Slice ids      sliceIds    carIds
         ├─ Prices         layers      carPrices    →  components  prices
         ├─ Brands         layers      carBrands    →  components  brands
         ├─ Workshops      layers      carWorkshops →  components  workshops
         │                                              ├─ addressRef → addresses
         │                                              └─ ownerRef   → persons
         ├─ Parts          layers      carParts     →  components  parts
         │                                              └─ subPartRefs → parts
         ├─ CAD            layers      carCad       →  trees       cadScenes
         │                                              └─ meta.partRef → parts
         └─ Revisions      revisions   revisions    (link the model years)
```

- Every model year of a catalog is a cake of its own. Its slice ids and
  layers build on the year before with `base`, `add` and `remove`, and a
  revision links the two cakes.
- A bill of materials reaches up to four levels below the car. Levels 1 to
  3 belong to a variant, level 4 is a pool of standard parts every bill
  shares. A CAD scene is a tree of groups and meshes, and a mesh refers to
  a part.
- Lists are arrays of hashes in a `jsonArray` column that the table
  configuration declares as a reference. Every table has a `TableCfg`, so
  `BaseValidator` of `@rljson/rljson` checks types and references.

### No randomness

Every value derives from an index into the dictionaries: 166
manufacturers, 917 models, nine assemblies with 36 parts each, 40
standard parts, 126 cities, 100 streets, 185 first names and 180 last
names. A share like `discountShare` selects every k-th car. The same
configuration yields the same hashes.

### Row by row

Rows refer to rows by hash, so Edge emits a row after the rows it refers
to. It hashes every row, drops a row whose hash it emitted before, and
hands the rest to a sink, one at a time and awaited. `generate()` collects
them in an `EMemorySink`; `run(sink)` hands them to `onRow` and keeps
nothing, after `onTable` announced each table with its configuration.

Bills of materials and scenes are shared per car, per model or per
catalog. `estimate()` counts the rows of every table from the
configuration alone, and `scale.targetRows` uses it to pick the cars per
catalog.

### Public API

| Export                                   | Purpose                                                                                                                                                                                                    |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Edge`                                   | `new Edge(config)`, `preset()`, `estimate()`, `generate()`, `run()`                                                                                                                                        |
| `mergeConfigs`                           | Merges two configurations section by section                                                                                                                                                               |
| `edgeDefaults`, `resolveEdgeConfig`      | The defaults, and a configuration with defaults and checks                                                                                                                                                 |
| `edgePresets`, `edgePresetNames`         | The presets `tiny`, `small`, `medium`, `large` and `xl`                                                                                                                                                    |
| `ESink`, `EMemorySink`                   | The callback interface of `run()` and the sink of `generate()`                                                                                                                                             |
| `carWorldTableKeys`, `carWorldTableCfgs` | The table keys and their table configurations                                                                                                                                                              |
| `ECarWorld` and its row types            | `EManufacturer`, `EAddress`, `EPerson`, `EWorkshop`, `EPrice`, `EBrand`, `EPart`, `ECadMeta`                                                                                                               |
| `EConfig` and its sections               | `ELayersConfig`, `EPricesConfig`, `EBrandsConfig`, `EWorkshopsConfig`, `EPartsConfig`, `ECadConfig`, `ERevisionsConfig`, `EResolvedConfig`                                                                 |
| `EStats`, `EEstimate`, `EProgress`       | The results and the progress of a run                                                                                                                                                                      |
| Dictionaries                             | `manufacturers`, `vehicles`, `modelsOf`, `assemblies`, `standardParts`, `materialsOf`, `cadSystems`, `cadDetails`, `cadMaterials`, `cities`, `citiesIn`, `cityNamed`, `streets`, `firstNames`, `lastNames` |

## Contributing

Work ticket by ticket with `gg`, as the [Develop Guide](doc/guides/develop-guide.md)
describes. Reviews follow the [Review Guide](doc/guides/for-ai/ai-review-guide.md).

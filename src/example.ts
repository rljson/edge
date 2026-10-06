// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import { Edge } from './edge.ts';

// .............................................................................
/**
 * Prints a line of an example's result.
 * @param text - The line
 */
const print = (text: string) => console.log(`  ${text}`);

// .............................................................................
/** Generates the tiny preset in memory: the first README example */
const generateExample = async (): Promise<void> => {
  console.log('Generate a world');
  const { world, stats } = await Edge.preset('tiny').generate();
  print(`${stats.cars} cars, ${stats.rowsTotal} rows`);
  print(`${world.manufacturers._data[0].name}`);
};

// .............................................................................
/** Configures a world and estimates it first: the second README example */
const configureExample = async (): Promise<void> => {
  console.log('Configure a world');
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
  print(`estimated rows: ${edge.estimate().rowsTotal}`);
  const { stats } = await edge.generate();
  print(`generated rows: ${stats.rowsTotal}`);
};

// .............................................................................
/** Streams the rows through a callback: the third README example */
const streamExample = async (): Promise<void> => {
  console.log('Stream the rows through a callback');
  const rowsPerTable: Record<string, number> = {};
  await Edge.preset('small').run({
    onRow: (table) => {
      rowsPerTable[table] = (rowsPerTable[table] ?? 0) + 1;
    },
  });
  print(`prices: ${rowsPerTable.prices}, parts: ${rowsPerTable.parts}`);
};

// .............................................................................
/**
 * Runs the code examples of the README and prints what they produce.
 *
 * test/example.spec.ts runs it and compares the output with a golden file,
 * so the README examples stay in sync with the code.
 */
export const example = async (): Promise<void> => {
  await generateExample();
  await configureExample();
  await streamExample();
};

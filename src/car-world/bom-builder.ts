// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import type { EPartsConfig } from '../config/config.ts';
import type { EEmitter } from '../core/emitter.ts';
import { padded, pick, pickMany, roundDecimals } from '../core/pick.ts';
import {
  assemblies,
  materialsOf,
  standardParts,
} from '../dictionaries/parts.ts';
import type { EAssembly, ESubAssembly } from '../dictionaries/parts.ts';

import type { EPart } from './car-world.ts';
import type { EVariant } from './plan.ts';

// #############################################################################
/** A generated bill of materials */
export interface EBom {
  /** The hash of the bill of materials: the part of level 0 */
  rootRef: string;

  /**
   * The hashes of the parts in the order they were emitted, the root first.
   * A standard part appears once for every part that contains it.
   */
  partRefs: string[];
}

// #############################################################################
/** What a bill of materials builder needs */
export interface EBomBuilderOptions {
  /** Receives the rows */
  emitter: EEmitter;

  /** The parts layer configuration */
  config: Required<EPartsConfig>;

  /** The part number prefix of the manufacturer, e.g. "AUD" */
  prefix: string;

  /** Who the bill of materials belongs to */
  variant: EVariant;
}

// #############################################################################
/** Where a part sits in the dictionary */
interface EBomPosition {
  assembly: EAssembly;
  assemblyIndex: number;
  sub: ESubAssembly;
  subIndex: number;
}

// .............................................................................
/** The level of the standard parts, a pool every bill of materials shares */
export const standardPartsLevel = 4;

/** The parts of a sub assembly and of an assembly in the dictionary */
const partsPerSubAssembly = 6;
const partsPerAssembly = 6 * partsPerSubAssembly;

/** Standard parts of neighbouring parts start this far apart in the pool */
const standardPartStride = 3;

/** The quantities of parts at level 3, by index */
const quantities = [1, 2, 4, 8, 16];

/** The digits of the sequence number in a part number */
const partNumberDigits = 4;

/** The weights in kilograms: a base per level and steps by position */
const weights = {
  assembly: { base: 50, step: 20 },
  subAssembly: { base: 5, step: 3 },
  part: { base: 0.2, step: 0.3, subStep: 0.05 },
  standard: { base: 0.01, variants: 10, step: 0.005 },
} as const;

/** Standard parts come in up to this many pieces */
const standardQuantities = 4;

// .............................................................................
/**
 * Returns the weight of an assembly in kilograms.
 * @param assemblyIndex - The index of the assembly in the dictionary
 */
const assemblyWeight = (assemblyIndex: number): number =>
  weights.assembly.base + assemblyIndex * weights.assembly.step;

// .............................................................................
/**
 * Returns the row of a standard part.
 * @param index - The index of the standard part in the pool
 */
const standardPartRow = (index: number): EPart => {
  const { name, material } = standardParts[index];
  const { base, variants, step } = weights.standard;
  return {
    name,
    partNumber: `STD-${padded(index + 1, partNumberDigits)}`,
    category: 'standard',
    level: standardPartsLevel,
    quantity: 1 + (index % standardQuantities),
    weightKg: roundDecimals(base + (index % variants) * step, 3),
    material,
    subPartRefs: [],
  };
};

// #############################################################################
/**
 * Emits a bill of materials from the leaves up.
 *
 * Part numbers are handed out from the top down, so a part's number is
 * lower than the numbers of its sub parts. Levels 1 to 3 carry the variant
 * in their part numbers, so two variants never share them. Level 4, the
 * standard parts, comes from a pool every bill shares. Build once per
 * instance.
 */
export class EBomBuilder {
  /**
   * Constructor
   * @param options - The emitter, the parts layer and the variant
   */
  constructor(private readonly options: EBomBuilderOptions) {}

  // ...........................................................................
  /** Emits the bill of materials and returns its hashes */
  async build(): Promise<EBom> {
    const { config, variant } = this.options;
    const assemblyRefs: string[] = [];
    let weightKg = 0;
    for (const assembly of pickMany(
      assemblies,
      variant.offset,
      config.fanOut,
    )) {
      const assemblyIndex = assemblies.indexOf(assembly);
      weightKg += assemblyWeight(assemblyIndex);
      assemblyRefs.push(await this.assembly(assembly, assemblyIndex));
    }
    const rootRef = await this.root(assemblyRefs, weightKg);
    return { rootRef, partRefs: [rootRef, ...this.partRefs.slice(0, -1)] };
  }

  // ######################
  // Private
  // ######################

  private sequence = 0;
  private readonly partRefs: string[] = [];

  private get code(): string {
    return `${this.options.prefix}-${this.options.variant.code.toUpperCase()}`;
  }

  private nextPartNumber(level: number): string {
    this.sequence++;
    return `${this.code}-${level}-${padded(this.sequence, partNumberDigits)}`;
  }

  private async emit(part: EPart): Promise<string> {
    const { _hash } = await this.options.emitter.emit('parts', part);
    this.partRefs.push(_hash);
    return _hash;
  }

  private root(subPartRefs: string[], weightKg: number): Promise<string> {
    return this.emit({
      name: `Bill of materials ${this.options.variant.name}`,
      partNumber: `${this.code}-BOM`,
      category: 'bom',
      level: 0,
      quantity: 1,
      weightKg,
      material: null,
      subPartRefs,
    });
  }

  private async assembly(
    assembly: EAssembly,
    assemblyIndex: number,
  ): Promise<string> {
    const partNumber = this.nextPartNumber(1);
    const subPartRefs =
      this.options.config.depth >= 2
        ? await this.subAssemblies(assembly, assemblyIndex)
        : [];
    return this.emit({
      name: assembly.name,
      partNumber,
      category: assembly.category,
      level: 1,
      quantity: 1,
      weightKg: assemblyWeight(assemblyIndex),
      material: null,
      subPartRefs,
    });
  }

  private async subAssemblies(
    assembly: EAssembly,
    assemblyIndex: number,
  ): Promise<string[]> {
    const fanOut = this.options.config.fanOut;
    const result: string[] = [];
    for (const [subIndex, sub] of pickMany(
      assembly.subAssemblies,
      0,
      fanOut,
    ).entries()) {
      const position = { assembly, assemblyIndex, sub, subIndex };
      result.push(await this.subAssembly(position));
    }
    return result;
  }

  private async subAssembly(position: EBomPosition): Promise<string> {
    const { assembly, assemblyIndex, sub, subIndex } = position;
    const { base, step } = weights.subAssembly;
    const partNumber = this.nextPartNumber(2);
    const subPartRefs =
      this.options.config.depth >= 3 ? await this.parts(position) : [];
    return this.emit({
      name: sub.name,
      partNumber,
      category: assembly.category,
      level: 2,
      quantity: 1 + (subIndex % 2),
      weightKg: roundDecimals(base + subIndex * step + assemblyIndex, 3),
      material: pick(materialsOf[assembly.category], subIndex),
      subPartRefs,
    });
  }

  private async parts(position: EBomPosition): Promise<string[]> {
    const names = pickMany(position.sub.parts, 0, this.options.config.fanOut);
    const result: string[] = [];
    for (const [i, name] of names.entries()) {
      result.push(await this.part(position, { name, i }));
    }
    return result;
  }

  private async part(
    { assembly, assemblyIndex, subIndex }: EBomPosition,
    { name, i }: { name: string; i: number },
  ): Promise<string> {
    const { base, step, subStep } = weights.part;
    const partNumber = this.nextPartNumber(3);
    const partIndex =
      assemblyIndex * partsPerAssembly + subIndex * partsPerSubAssembly + i;
    const subPartRefs =
      this.options.config.depth >= standardPartsLevel
        ? await this.standardParts(partIndex)
        : [];
    return this.emit({
      name,
      partNumber,
      category: assembly.category,
      level: 3,
      quantity: pick(quantities, i),
      weightKg: roundDecimals(base + i * step + subIndex * subStep, 3),
      material: pick(materialsOf[assembly.category], i + subIndex),
      subPartRefs,
    });
  }

  private async standardParts(partIndex: number): Promise<string[]> {
    const { fanOut, standardPartsPool } = this.options.config;
    const first = partIndex * standardPartStride;
    const result: string[] = [];
    for (let i = 0; i < fanOut; i++) {
      const index = (first + i) % standardPartsPool;
      result.push(await this.emit(standardPartRow(index)));
    }
    return result;
  }
}

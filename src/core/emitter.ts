// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import { hsh } from '@rljson/hash';
import type { Json } from '@rljson/json';
import type { TableCfg, TableKey } from '@rljson/rljson';

import type { EProgress } from '../config/config.ts';

import type { ESink } from './sink.ts';

// #############################################################################
/** A row with the hash that hsh wrote into it */
export type EHashed<T extends Json> = T & { _hash: string };

// #############################################################################
/** What an emitter needs */
export interface EEmitterOptions {
  /** Receives the rows */
  sink: ESink;

  /** The number of rows the run will produce at most, from the estimate */
  rowsTotal: number;

  /** Report progress after every this many rows */
  progressEvery: number;

  /** Receives the progress */
  progress?: (progress: EProgress) => void;

  /** Stops the run when aborted */
  abortSignal?: AbortSignal;
}

// #############################################################################
/**
 * Hashes rows, drops duplicates and hands the rest to the sink.
 *
 * Equal content has an equal hash, so a row that was emitted before is not
 * emitted again; the emitter keeps one set of hashes per table for that.
 * The rows are handed over one after the other, and every handover is
 * awaited: a row may only follow the rows it refers to, and a slow sink
 * slows the generator down.
 */
export class EEmitter {
  /**
   * Constructor
   * @param options - The sink and the progress settings
   */
  constructor(private readonly options: EEmitterOptions) {}

  // ...........................................................................
  /**
   * Announces a table: hands its configuration to the sink and writes the
   * configuration into the tableCfgs table.
   * @param tableCfg - The configuration of the table
   */
  async table(tableCfg: TableCfg): Promise<EHashed<TableCfg>> {
    const hashed = hsh(tableCfg) as EHashed<TableCfg>;
    this.counts[tableCfg.key] ??= 0;
    await this.options.sink.onTable?.(tableCfg.key, hashed);
    await this.emit('tableCfgs', hashed);
    return hashed;
  }

  // ...........................................................................
  /**
   * Sets the phase of the run and reports it.
   * @param phase - The name of the phase, e.g. the table being generated
   */
  phaseIs(phase: string): void {
    if (phase !== this.phase) {
      this.phase = phase;
      this.report();
    }
  }

  // ...........................................................................
  /**
   * Hashes a row and hands it to the sink, unless an equal row was emitted
   * before. Returns the hashed row either way.
   * @param table - The key of the table
   * @param row - The row without hash
   */
  async emit<T extends Json>(table: TableKey, row: T): Promise<EHashed<T>> {
    const hashed = hsh(row) as EHashed<T>;
    this.produced++;
    if (this.isDuplicate(table, hashed._hash)) {
      return hashed;
    }

    this.throwIfAborted();
    await this.options.sink.onRow(table, hashed);
    this.count(table);
    return hashed;
  }

  // ...........................................................................
  /** The number of rows handed to the sink */
  get rowsDone(): number {
    return this.done;
  }

  /** The number of rows produced, including the duplicates that were dropped */
  get rowsProduced(): number {
    return this.produced;
  }

  /** The number of rows handed to the sink, per table */
  get rowsPerTable(): Record<string, number> {
    return { ...this.counts };
  }

  // ######################
  // Private
  // ######################

  private phase = '';
  private done = 0;
  private produced = 0;
  private readonly counts: Record<string, number> = {};
  private readonly seen = new Map<TableKey, Set<string>>();

  private isDuplicate(table: TableKey, hash: string): boolean {
    let seen = this.seen.get(table);
    if (!seen) {
      seen = new Set<string>();
      this.seen.set(table, seen);
    }
    if (seen.has(hash)) {
      return true;
    }
    seen.add(hash);
    return false;
  }

  private throwIfAborted(): void {
    if (this.options.abortSignal?.aborted) {
      throw new Error(`Edge: generation aborted after ${this.done} rows`);
    }
  }

  private count(table: TableKey): void {
    this.done++;
    this.counts[table] = (this.counts[table] ?? 0) + 1;
    if (this.done % this.options.progressEvery === 0) {
      this.report(table);
    }
  }

  private report(table?: TableKey): void {
    this.options.progress?.({
      phase: this.phase,
      rowsDone: this.done,
      rowsTotal: this.options.rowsTotal,
      table,
    });
  }
}

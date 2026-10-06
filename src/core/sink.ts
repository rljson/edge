// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import { hip } from '@rljson/hash';
import type { Rljson, Row, TableCfg, TableKey } from '@rljson/rljson';

// #############################################################################
/**
 * Receives the rows of a run.
 *
 * Edge writes nothing itself: no file, no database. The application decides
 * where the rows go, in Node.js, in the browser or in a Web Worker.
 */
export interface ESink {
  /**
   * Receives a row of a table. The rows come in the order of their
   * references. A returned promise is awaited, so a slow sink slows the
   * generator down.
   * @param table - The key of the table
   * @param row - The hashed row
   */
  onRow(table: TableKey, row: Row): void | Promise<void>;

  /**
   * Receives the configuration of a table before its first row. A database
   * creates the table here.
   * @param table - The key of the table
   * @param tableCfg - The hashed configuration of the table
   */
  onTable?(table: TableKey, tableCfg: TableCfg): void | Promise<void>;
}

// #############################################################################
/** The configuration and the rows a memory sink collected for a table */
interface ECollectedTable {
  tableCfg: TableCfg | null;
  rows: Row[];
}

// #############################################################################
/** Collects the rows of a run in memory: the sink behind generate() */
export class EMemorySink implements ESink {
  // ...........................................................................
  /**
   * Remembers the configuration of a table.
   * @param table - The key of the table
   * @param tableCfg - The hashed configuration of the table
   */
  onTable(table: TableKey, tableCfg: TableCfg): void {
    this.entry(table).tableCfg = tableCfg;
  }

  // ...........................................................................
  /**
   * Collects a row.
   * @param table - The key of the table
   * @param row - The hashed row
   */
  onRow(table: TableKey, row: Row): void {
    this.entry(table).rows.push(row);
  }

  // ...........................................................................
  /**
   * Returns the collected rows as an Rljson object.
   *
   * Every table carries its content type, the hash of its configuration and
   * a hash of its own.
   */
  toRljson(): Rljson {
    const result: Rljson = {};
    for (const [key, collected] of this.tables) {
      result[key] = this.tableOf(key, collected);
    }
    return result;
  }

  // ######################
  // Private
  // ######################

  private readonly tables = new Map<TableKey, ECollectedTable>();

  private entry(table: TableKey): ECollectedTable {
    let entry = this.tables.get(table);
    if (!entry) {
      entry = { tableCfg: null, rows: [] };
      this.tables.set(table, entry);
    }
    return entry;
  }

  private tableOf(key: TableKey, { tableCfg, rows }: ECollectedTable) {
    if (!tableCfg) {
      throw new Error(`EMemorySink: onTable was not called for "${key}"`);
    }
    const table: Row = { _type: tableCfg.type, _data: rows };
    if (key !== 'tableCfgs') {
      table._tableCfg = tableCfg._hash;
    }
    return hip(table) as Rljson[string];
  }
}

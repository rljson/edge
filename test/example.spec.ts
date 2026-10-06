// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import { describe, expect, it } from 'vitest';

import { example } from '../src/example.ts';

import { expectGolden } from './setup/goldens.ts';

describe('example()', () => {
  it('runs the README examples and prints what they produce', async () => {
    const logMessages: string[] = [];
    const log = console.log;
    console.log = (message: string) => logMessages.push(message);
    try {
      await example();
    } finally {
      console.log = log;
    }

    await expectGolden('example.log').toBe(logMessages.join('\n'));
    expect(logMessages[0]).toBe('Generate a world');
  });
});

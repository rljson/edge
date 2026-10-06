// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import { describe, expect, it } from 'vitest';

import { Edge } from '../src/edge';


describe('Edge', () => {
  it('should create an example', () => {
    const edge = Edge.example;
    expect(edge).toBeDefined();
  });
});

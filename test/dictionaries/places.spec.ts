// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import { describe, expect, it } from 'vitest';

import { cities, citiesIn, cityNamed, streets } from '../../src/index.ts';

describe('cities', () => {
  it('has many cities with unique names and sane coordinates', () => {
    expect(cities.length).toBeGreaterThan(100);
    expect(new Set(cities.map((city) => city.name)).size).toBe(cities.length);
    for (const city of cities) {
      expect(Math.abs(city.lat), city.name).toBeLessThanOrEqual(90);
      expect(Math.abs(city.lng), city.name).toBeLessThanOrEqual(180);
      expect(city.zip.length, city.name).toBeGreaterThan(0);
    }
  });
});

describe('streets', () => {
  it('has a hundred street names without duplicates', () => {
    expect(streets.length).toBeGreaterThanOrEqual(100);
    expect(new Set(streets).size).toBe(streets.length);
  });
});

describe('citiesIn(country)', () => {
  it('returns the cities of a country', () => {
    const german = citiesIn('DE');
    expect(german.length).toBeGreaterThan(10);
    expect(german.every((city) => city.country === 'DE')).toBe(true);
  });

  it('falls back to all cities for an unknown country', () => {
    expect(citiesIn('XX')).toBe(cities);
  });
});

describe('cityNamed(name)', () => {
  it('returns the city with the name', () => {
    expect(cityNamed('Wolfsburg').country).toBe('DE');
  });

  it('throws for an unknown city', () => {
    expect(() => cityNamed('Atlantis')).toThrow(
      'places: unknown city "Atlantis"',
    );
  });
});

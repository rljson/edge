// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

import type { Row } from '@rljson/rljson';
import { describe, expect, it } from 'vitest';

import {
  addressRow,
  generateWorkshops,
  personRow,
  services,
} from '../../src/car-world/workshops.ts';
import { EEmitter } from '../../src/core/emitter.ts';
import { cityNamed, streets } from '../../src/index.ts';
import type { EWorkshop } from '../../src/index.ts';

describe('addressRow(city, index)', () => {
  const hamburg = cityNamed('Hamburg');

  it('gives every index its own street and house number', () => {
    const keys = Array.from({ length: 250 }, (_, i) => {
      const { street, houseNumber } = addressRow(hamburg, i);
      return `${street} ${houseNumber}`;
    });
    expect(new Set(keys).size).toBe(250);
  });

  it('places the address near the center of the city', () => {
    const index = streets.length + 1;
    expect(addressRow(hamburg, index)).toEqual({
      street: streets[1],
      houseNumber: '2',
      zip: '20095',
      city: 'Hamburg',
      country: 'DE',
      lat: expect.closeTo(53.55 + (index % 7) * 0.01, 6),
      lng: expect.closeTo(10 + (index % 5) * 0.01, 6),
    });
  });
});

describe('personRow(index, country)', () => {
  it('derives name, email, phone and birth year from the index', () => {
    expect([personRow(0, 'DE'), personRow(1, 'DE').phone]).toEqual([
      {
        firstName: 'Mira',
        lastName: 'Lindqvist',
        email: 'mira.lindqvist@example.com',
        phone: '+49 170 1000000',
        birthYear: 1950,
      },
      '+49 170 1000001',
    ]);
  });

  it('uses a zero dial code for an unknown country', () => {
    expect(personRow(0, 'XX').phone).toBe('+0 170 1000000');
  });
});

describe('generateWorkshops(options)', () => {
  const generate = async (country: string) => {
    const rows = new Map<string, Row[]>();
    const emitter = new EEmitter({
      sink: {
        onRow: (table, row) => {
          rows.set(table, [...(rows.get(table) ?? []), row]);
        },
      },
      rowsTotal: 0,
      progressEvery: 1000,
    });
    const refs = await generateWorkshops({
      emitter,
      config: { perCatalog: 4, ownersPerManufacturer: 2 },
      manufacturerIndex: 0,
      catalogIndex: 0,
      country,
    });
    return { refs, rows };
  };

  it('emits workshops with their addresses and owners', async () => {
    const { refs, rows } = await generate('DE');
    const workshops = rows.get('workshops') as EWorkshop[];

    expect([
      refs.length,
      workshops.length,
      rows.get('addresses')?.length,
      rows.get('persons')?.length,
    ]).toEqual([4, 4, 4, 2]);
    expect(workshops[0]).toEqual({
      name: 'Lindqvist Motors',
      addressRef: rows.get('addresses')?.[0]._hash,
      ownerRef: rows.get('persons')?.[0]._hash,
      phone: '+49 2000000',
      email: 'info@lindqvist-motors.example',
      services: services.slice(0, 2),
      rating: 3,
      _hash: refs[0],
    });
  });

  it('keeps every rating between 3 and 5 and every service known', async () => {
    const { rows } = await generate('DE');
    const workshops = rows.get('workshops') as EWorkshop[];
    const invalid = workshops.filter(
      (w) =>
        w.rating < 3 ||
        w.rating > 5 ||
        w.services.some((s) => !services.includes(s)),
    );
    expect(invalid).toEqual([]);
  });

  it('uses a zero dial code for an unknown country', async () => {
    const { rows } = await generate('XX');
    const phones = (rows.get('workshops') as EWorkshop[]).map((w) => w.phone);
    expect(phones[0]).toBe('+0 2000000');
  });
});

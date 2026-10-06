// @license
// Copyright (c) 2025 Rljson
//
// Use of this source code is governed by terms that can be
// found in the LICENSE file in the root of this package.

// Deterministic selection helpers. Edge uses no random numbers: every value
// derives from an index, so two runs with the same configuration yield the
// same data.

// .............................................................................
/**
 * Returns the entry at an index, wrapping around the end of the list.
 * @param list - The list to pick from
 * @param index - Any non-negative index
 */
export const pick = <T>(list: readonly T[], index: number): T => {
  if (list.length === 0) {
    throw new Error('pick: the list is empty');
  }
  return list[index % list.length];
};

// .............................................................................
/**
 * Returns count entries starting at an offset, wrapping around the end.
 *
 * The entries are distinct as long as count does not exceed the length.
 * @param list - The list to pick from
 * @param offset - The index of the first entry
 * @param count - The number of entries
 */
export const pickMany = <T>(
  list: readonly T[],
  offset: number,
  count: number,
): T[] => Array.from({ length: count }, (_, i) => pick(list, offset + i));

// .............................................................................
/**
 * Tells whether an index falls into a share of a sequence.
 *
 * Of n consecutive indices, exactly round(n * share) are in the share, spread
 * evenly: with a share of 0.25 every fourth index is in.
 * @param index - The index within the sequence
 * @param share - The share between 0 and 1
 */
export const inShare = (index: number, share: number): boolean =>
  Math.floor((index + 1) * share) > Math.floor(index * share);

// #############################################################################
/** Where an index sits and how many buckets share the sequence */
export interface EZipfOptions {
  /** The index within the sequence */
  index: number;

  /** The length of the sequence */
  count: number;

  /** The number of buckets */
  buckets: number;
}

// .............................................................................
/**
 * Returns the harmonic number of n: 1 + 1/2 + … + 1/n.
 * @param n - The number of terms
 */
export const harmonic = (n: number): number => {
  let sum = 0;
  for (let k = 1; k <= n; k++) {
    sum += 1 / k;
  }
  return sum;
};

// .............................................................................
/**
 * Maps an index of a sequence to a bucket, following a Zipf distribution.
 *
 * Bucket 0 receives the most indices, bucket 1 half as many, bucket 2 a
 * third, and so on. Consecutive indices land in the same bucket.
 * @param options - The index, the length of the sequence and the buckets
 */
export const zipfBucket = (options: EZipfOptions): number => {
  const { index, count, buckets } = options;
  const total = harmonic(buckets);
  const position = (index + 0.5) / count;
  let cumulative = 0;
  for (let bucket = 0; bucket < buckets - 1; bucket++) {
    cumulative += 1 / (bucket + 1) / total;
    if (position < cumulative) {
      return bucket;
    }
  }
  return buckets - 1;
};

// .............................................................................
/**
 * Pads a number with leading zeros.
 * @param value - The number
 * @param width - The minimum number of digits
 */
export const padded = (value: number, width: number): string =>
  String(value).padStart(width, '0');

// .............................................................................
/**
 * Turns a name into a kebab case slug: lower case, ASCII letters and digits.
 * @param name - The name, e.g. "Lynk & Co"
 */
export const slug = (name: string): string =>
  name
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

// .............................................................................
/**
 * Rounds a value to the nearest multiple of a step.
 * @param value - The value
 * @param step - The step, e.g. 100
 */
export const roundTo = (value: number, step: number): number =>
  Math.round(value / step) * step;

// .............................................................................
/**
 * Rounds a value to a number of decimals.
 * @param value - The value
 * @param decimals - The decimals to keep
 */
export const roundDecimals = (value: number, decimals: number): number => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

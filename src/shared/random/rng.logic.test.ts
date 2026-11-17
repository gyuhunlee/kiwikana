import { describe, expect, it } from 'vitest';
import { rng } from './rng.logic';

const take = (seed: number, count: number) => {
  const source = rng(seed);
  return Array.from({ length: count }, () => source.next());
};

describe('rng', () => {
  it('gives the same sequence for the same seed', () => {
    expect(take(1, 20)).toEqual(take(1, 20));
  });

  it('gives a different sequence for a different seed', () => {
    expect(take(1, 20)).not.toEqual(take(2, 20));
  });

  it('stays in [0, 1)', () => {
    for (const value of take(7, 1000)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

export interface Rng {
  /** A number in [0, 1). */
  next(): number;
}

/** Deterministic rng (mulberry32) for tests, scenarios and simulations: `rng(1)`. */
export function rng(seed: number): Rng {
  let state = seed >>> 0;
  return {
    next: () => {
      state = (state + 0x6d2b79f5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
  };
}

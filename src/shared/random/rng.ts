import type { Rng } from './rng.logic';

export const systemRng: Rng = {
  next: () => Math.random(),
};

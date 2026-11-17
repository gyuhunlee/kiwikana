import { defineConfig } from 'vitest/config';

// Logic tests only: plain Node, no React Native preset (docs/testing.md section 3).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['admin/src/**/*.ts', 'server/src/**/*.ts'],
      exclude: [
        '**/*.d.ts',
        'admin/src/**/*.tsx',
        'admin/src/**/index.ts',
        'server/src/**/index.ts',
      ],
    },
  },
});

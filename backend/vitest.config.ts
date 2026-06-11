import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    globalSetup: ['./tests/global-setup.ts'],
    // Тестовые сьюты используют общую БД — выполняем файлы последовательно
    fileParallelism: false,
    hookTimeout: 120_000,
    testTimeout: 30_000,
    coverage: {
      provider: 'v8',
      include: ['src/services/**', 'src/repositories/**', 'src/controllers/**'],
    },
  },
});

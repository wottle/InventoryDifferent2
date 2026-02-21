import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        testTimeout: 10000,
        hookTimeout: 15000,
        include: ['tests/**/*.test.ts'],
        globals: true,
        fileParallelism: false,
    },
});

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ command }) => ({
  define:
    command === 'build'
      ? {
          'process.env.NODE_ENV': 'production',
        }
      : undefined,
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  },
  build: {
    target: 'node20',
    outDir: 'dist',
    emptyOutDir: true,
    ssr: path.resolve(root, 'src/index.ts'),
    rollupOptions: {
      output: {
        entryFileNames: 'index.js',
        format: 'es',
        inlineDynamicImports: true,
      },
    },
  },
  ssr: {
    noExternal: true,
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
}));

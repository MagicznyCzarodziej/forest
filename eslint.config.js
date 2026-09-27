import eslintReact from '@eslint-react/eslint-plugin';
import eslintJs from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import vitest from '@vitest/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';

export default defineConfig([
  {
    ignores: ['dist/**', 'package-lock.json'],
  },
  eslintJs.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      ...tseslint.configs.recommended,
      eslintReact.configs['recommended-typescript'],
      reactHooks.configs.flat.recommended,
    ],
  },
  {
    files: ['tests/**'],
    plugins: vitest.configs.recommended.plugins,
    rules: vitest.configs.recommended.rules,
  },
  eslintPluginPrettierRecommended,
  {
    rules: {
      'prettier/prettier': 'warn',
    },
  },
]);

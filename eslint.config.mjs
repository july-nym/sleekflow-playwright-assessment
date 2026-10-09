// @ts-check
import js from '@eslint/js';
import playwright from 'eslint-plugin-playwright';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  { ignores: ['.features-gen/', 'playwright-report/', 'test-results/'] },
  {
    files: ['**/*.ts'],
    extends: [js.configs.recommended, tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
  },
  {
    files: ['src/**/*.ts'],
    extends: [playwright.configs['flat/recommended']],
    rules: {
      // Page objects and steps run inside the tests that bddgen generates.
      'playwright/no-standalone-expect': 'off',
    },
  },
);

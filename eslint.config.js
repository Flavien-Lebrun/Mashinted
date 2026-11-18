import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import globals from 'globals';

export default [
  {
    // Completely ignore build files and configuration files from checks
    ignores: ['dist/**', 'node_modules/**', 'scratch/**', 'vite.config.js', 'eslint.config.js'],
  },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.webextensions,
        ...globals.node,
        __MASHINTED_DEV__: 'readonly', // injected by vite.config.js (true only for MASHINTED_DEV=1 builds)
      },
    },
    plugins: {
      import: importPlugin,
    },
    rules: {
      'import/named': 'error',
      'import/no-unresolved': 'error',
      'no-unused-vars': 'warn',
      'no-console': 'error', // use createLogger() from src/shared/logger.js
    },
    settings: {
      // Use standard node resolution but tell it which file extensions to care about
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.json', 'svg'],
        },
      },
    },
  },
  {
    files: ['src/shared/logger.js', 'src/dev/**/*.js'], // dev tools print tables on purpose
    rules: { 'no-console': 'off' },
  },
];

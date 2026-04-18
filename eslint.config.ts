/* eslint-disable n/no-unpublished-import */
import simpleImportSortPlugin from 'eslint-plugin-simple-import-sort';
import mwtsConfig from 'mwts/eslint.config.js';

export default [
  ...mwtsConfig,
  {
    ignores: [
      'node_modules',
      'dist',
      'test',
      'jest.config.js',
      'gulpfile.js',
      'typings',
      'src/entity/*.entity.ts',
      'src/dto/*.dto.ts',
    ],
  },
  {
    languageOptions: {
      globals: {
        jest: 'readonly',
      },
    },
    plugins: {
      'simple-import-sort': simpleImportSortPlugin,
    },
    rules: {
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            ['^node:'],
            ['^@?\\w'],
            ['^'],
            ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
            ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
          ],
        },
      ],
      'simple-import-sort/exports': 'error',
    },
  },
];

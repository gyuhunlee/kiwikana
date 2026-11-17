import tseslint from 'typescript-eslint';

const noDate = [
  {
    selector: "NewExpression[callee.name='Date']",
    message: 'Time comes from a Clock. Only src/shared/time may create dates (docs/architecture.md, Time).',
  },
  {
    selector: "MemberExpression[object.name='Date'][property.name='now']",
    message: 'Time comes from a Clock. Only src/shared/time may read the clock.',
  },
];

const noRandom = [
  {
    selector: "MemberExpression[object.name='Math'][property.name='random']",
    message: 'Randomness comes from an Rng (docs/architecture.md, Randomness).',
  },
];

const noHex = [
  {
    selector: 'Literal[value=/^#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/]',
    message: 'Colors come from theme tokens (docs/theme.md).',
  },
];

const restrict = (...groups) => ['error', ...groups.flat()];

export default tseslint.config(
  { ignores: ['node_modules/', '.expo/', 'dist/', 'ios/', 'android/', 'targets/', 'scripts/**/*.mjs', 'eslint.config.mjs'] },
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      'no-restricted-syntax': restrict(noDate, noRandom, noHex),
    },
  },
  {
    files: ['src/shared/time/**'],
    rules: { 'no-restricted-syntax': restrict(noRandom, noHex) },
  },
  {
    files: ['src/shared/random/rng.ts'],
    rules: { 'no-restricted-syntax': restrict(noDate, noHex) },
  },
  {
    files: ['src/shared/theme/tokens.ts'],
    rules: { 'no-restricted-syntax': restrict(noDate, noRandom) },
  },
  {
    // Keeps the fast test tier fast (docs/testing.md section 3).
    files: ['**/*.logic.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-native', 'react-native-*', 'expo', 'expo-*', '@expo/*', '@shopify/*', 'zustand'],
              message: 'Logic files are pure TypeScript: no React, React Native, Expo or stores.',
            },
            {
              regex: '\\.store$',
              message: 'Logic files must not import stores.',
            },
            {
              regex: '/[A-Z][^/]*$',
              message: 'Logic files must not import components (.tsx).',
            },
          ],
        },
      ],
    },
  },
);

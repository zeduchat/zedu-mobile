module.exports = {
  root: true,
  extends: '@react-native',
  plugins: ['unused-imports'],
  ignorePatterns: [
    'node_modules/',
    'android/',
    'ios/',
    'vendor/',
    'coverage/',
    '**/* copy.*',
    '.pnp.cjs',
    '.pnp.loader.mjs',
  ],
  rules: {
    // React Native UI conventions — warn, do not block commits
    'react-native/no-inline-styles': 'warn',
    'react/no-unstable-nested-components': 'warn',
    'react/self-closing-comp': 'warn',
    '@typescript-eslint/no-shadow': 'warn',

    // Unused imports/vars — error; imports are auto-removed with --fix
    '@typescript-eslint/no-unused-vars': 'off',
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': [
      'error',
      {
        args: 'after-used',
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrors: 'all',
        caughtErrorsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
    ],
    'react-hooks/exhaustive-deps': 'warn',
  },
};

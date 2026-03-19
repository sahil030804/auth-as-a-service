module.exports = {
  env: {
    browser: true,
    es6: true,
  },
  extends: ['airbnb-base'],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  rules: {
    'no-unused-vars': [
      2,
      {
        argsIgnorePattern: 'next',
      },
    ],
    'comma-spacing': ['error', { before: false, after: true }],
    'no-useless-catch': 0,
    'class-methods-use-this': 0,
    'no-underscore-dangle': 0,
    camelcase: 0,
    'max-len': 0,
    'no-param-reassign': 0,
    'no-loop-func': 0,
    'no-console': ['error', { allow: ['info', 'error'] }],
    'object-curly-newline': 'off',
    'implicit-arrow-linebreak': 'off',
    'function-paren-newline': 'off',
    'operator-linebreak': 'off',
    'newline-per-chained-call': 'off',
    'no-undef': 'error',
    'no-shadow': 'off',
    'no-return-await': 'off',
    'prefer-const': 'off',
    'spaced-comment': 'off',
    'prefer-destructuring': 'off',
    'no-nested-ternary': 'off',
  },
};

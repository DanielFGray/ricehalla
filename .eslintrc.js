const extensions = ['.ts', '.tsx', '.js', '.jsx', '.cjs', '.gql']
module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'airbnb',
    'airbnb/hooks',
  ],
  plugins: ['@typescript-eslint'],
  env: {
    browser: true,
  },
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      pragma: 'React',
      version: 'detect',
    },
    'import/extensions': extensions,
    'import/parsers': {
      '@typescript-eslint/parser': extensions,
    },
    'import/resolver': {
      node: {
        extensions,
      },
    },
  },
  parserOptions: {
    project: './tsconfig.json',
  },
  rules: {
    semi: ['error', 'never'],
    indent: ['error', 2, { flatTernaryExpressions: true }],
    'no-unexpected-multiline': 'error',
    'no-nested-ternary': 'off',
    'no-unused-vars': 'off',
    'arrow-parens': ['error', 'as-needed'],
    'space-unary-ops': ['error', { overrides: { '!': true } }],
    'object-curly-newline': 'off',
    'no-unused-vars': 'off',
    'react/destructuring-assignment': 'off',
    'react/prop-types': 'off',
    'react/jsx-props-no-spreading': 'off',
    'valid-jsdoc': 'warn',
    'react/jsx-filename-extension': ['error', { extensions: ['.tsx', '.jsx'] }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/ban-ts-ignore': 'warn',
    '@typescript-eslint/require-await': 'warn',
    '@typescript-eslint/await-thenable': 'warn',
    '@typescript-eslint/member-delimiter-style': [
      'error',
      {
        multiline: { delimiter: 'none' },
        singleline: { delimiter: 'comma' },
      },
    ],
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        ts: 'never',
        tsx: 'never',
        js: 'never',
        jsx: 'never',
        gql: 'always',
      },
    ],
  },
}

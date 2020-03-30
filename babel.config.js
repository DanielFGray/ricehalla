module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current',
        },
        loose: true,
        useBuiltIns: 'usage',
        corejs: 3,
      },
    ],
    [
      '@babel/preset-typescript',
      {
        allExtensions: true,
        isTSX: true,
      },
    ],
    '@babel/preset-react',
  ],
  plugins: [
    ['import-graphql', { extensions: ['.gql'] }],
    '@babel/plugin-syntax-dynamic-import',
    '@loadable/babel-plugin',
  ],
  env: {
    development: {
      plugins: [],
    },
    production: {
      plugins: [],
    },
  },
}

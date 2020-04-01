/* eslint-disable
  @typescript-eslint/no-var-requires,
  import/no-extraneous-dependencies,
  global-require */

require('dotenv').config()
const path = require('path')
const webpack = require('webpack')
const WebpackAssetsManifest = require('webpack-assets-manifest')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const nodeExternals = require('webpack-node-externals')
const TerserPlugin = require('terser-webpack-plugin')
const WatchMissingNodeModulesPlugin = require('react-dev-utils/WatchMissingNodeModulesPlugin')
const ModuleNotFoundPlugin = require('react-dev-utils/ModuleNotFoundPlugin')
const WebpackBar = require('webpackbar')
// const WorkboxWebpackPlugin = require('workbox-webpack-plugin')
// const LoadablePlugin = require('@loadable/webpack-plugin')

const { NODE_ENV, PUBLIC_DIR, OUTPUT_DIR, APP_TITLE, APP_BASE, MOUNT, HOST, PORT } = process.env

if (NODE_ENV !== 'production' && NODE_ENV !== 'development') throw new Error('NODE_ENV must be set to "development" or "production"')

const devMode = NODE_ENV === 'development'

/** @type {webpack.RuleSetRule[]} */
const cssLoaders = [
  {
    test: /node_modules[\\/].*\.css$/,
    use: [MiniCssExtractPlugin.loader, 'css-loader'],
  },
  {
    exclude: /node_modules/,
    test: /\.css$/,
    use: [
      {
        loader: MiniCssExtractPlugin.loader,
        options: { hmr: devMode },
      },
      'css-loader',
      'postcss-loader',
    ],
  },
]

/** @type {webpack.RuleSetRule} */
const babelLoader = {
  test: /\.[tj]sx?$/,
  exclude: /node_modules/,
  use: ['babel-loader'],
}

const stats = {
  chunks: false,
  modules: false,
  colors: true,
}

const extensions = ['.ts', '.tsx', '.js', '.jsx', '.cjs']

const definePlugin = () => new webpack.DefinePlugin({
  'process.env': {
    NODE_ENV: JSON.stringify(NODE_ENV),
    APP_BASE: JSON.stringify(APP_BASE),
    APP_TITLE: JSON.stringify(APP_TITLE),
    MOUNT: JSON.stringify(MOUNT),
    HOST: JSON.stringify(HOST),
    PORT: JSON.stringify(PORT),
  },
})

/** @type {webpack.Configuration} */
const clientConfig = {
  name: 'client',
  mode: NODE_ENV,
  entry: ['./src/client/index'],
  resolve: {
    extensions,
  },
  output: {
    path: path.resolve(PUBLIC_DIR),
    publicPath: '/',
    filename: devMode ? '[name].js' : '[name]-[hash:8].js',
    chunkFilename: devMode ? '[name].js' : '[name]-[chunkhash:8].js',
  },
  module: {
    rules: cssLoaders.concat(babelLoader),
  },
  optimization: {
    minimize: ! devMode,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          ecma: 2016,
        },
        parallel: true,
        extractComments: false,
      }),
    ],
    splitChunks: {
      chunks: 'all',
    },
  },
  plugins: [
    // new LoadablePlugin({ writeToDisk: false }),
    new MiniCssExtractPlugin({
      filename: devMode ? '[name].css' : '[name]-[hash:8].css',
      chunkFilename: devMode ? '[name].css' : '[name]-[chunkhash:8].css',
    }),
    definePlugin(),
    new WebpackAssetsManifest({
      // https://github.com/webdeveric/webpack-assets-manifest/#readme
      output: path.join(path.resolve(OUTPUT_DIR), './manifest.json'),
      writeToDisk: true,
    }),
    ...(devMode
      ? [
        new WatchMissingNodeModulesPlugin(path.resolve('node_modules')),
        new ModuleNotFoundPlugin(path.resolve('src')),
      ]
      : [
        new OptimizeCssAssetsPlugin({
          cssProcessorPluginOptions: {
            preset: ['default', { discardComments: { removeAll: true } }],
          },
        }),
      ]),
  ],
  stats,
}

/** @type {webpack.Configuration} */
const serverConfig = {
  name: 'server',
  mode: NODE_ENV,
  entry: [devMode ? './src/app' : './src/index'],
  devtool: devMode ? 'eval-source-map' : 'source-map',
  target: 'async-node',
  externals: [nodeExternals()],
  resolve: {
    extensions,
  },
  plugins: [
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
    }),
    new webpack.BannerPlugin({
      banner: 'require("source-map-support").install();',
      entryOnly: false,
      include: ['main.js'],
      raw: true,
    }),
    definePlugin(),
    // new LoadablePlugin({ filename: 'loadable-node-stats.json', writeToDisk: true })
  ],
  output: {
    filename: '[name].js',
    libraryTarget: 'commonjs2',
    chunkFilename: '[name]-[hash].js',
    path: path.resolve(OUTPUT_DIR),
  },
  module: {
    rules: [babelLoader],
  },
  stats,
}

const configs = [clientConfig, serverConfig]

if (devMode) {
  configs.forEach(c => {
    c.plugins.push(new WebpackBar({ profile: true }))
  })
}

module.exports = configs

/* eslint-disable
  @typescript-eslint/no-var-requires,
  import/no-extraneous-dependencies,
  global-require */

require('dotenv').config()
const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const WatchMissingNodeModulesPlugin = require('react-dev-utils/WatchMissingNodeModulesPlugin')
const ModuleNotFoundPlugin = require('react-dev-utils/ModuleNotFoundPlugin')
const WebpackBar = require('webpackbar')
const { WebpackPluginServe: Serve } = require('webpack-plugin-serve')

const { NODE_ENV, PUBLIC_DIR, APP_TITLE, APP_BASE, MOUNT } = process.env

if (NODE_ENV !== 'production' && NODE_ENV !== 'development') {
  throw new Error('NODE_ENV must be set to "development" or "production"')
}

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

const extensions = ['.ts', '.tsx', '.js', '.jsx']

/** @type {webpack.Configuration} */
module.exports = {
  name: 'client',
  mode: NODE_ENV,
  entry: './src/client/index',
  resolve: {
    extensions,
  },
  devServer: {
    '/graphql': 'http://localhost:8080',
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
    new MiniCssExtractPlugin({
      filename: devMode ? '[name].css' : '[name]-[hash:8].css',
      chunkFilename: devMode ? '[name].css' : '[name]-[chunkhash:8].css',
    }),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(NODE_ENV),
        APP_BASE: JSON.stringify(APP_BASE),
        APP_TITLE: JSON.stringify(APP_TITLE),
        MOUNT: JSON.stringify(MOUNT),
      },
    }),
    new HtmlWebpackPlugin({
      template: 'src/client/html.ejs',
      inject: false,
      title: APP_TITLE,
      appMountId: MOUNT,
      mobile: true,
    }),
    ...(devMode
      ? [
        new WebpackBar({ profile: true }),
        new WatchMissingNodeModulesPlugin(path.resolve('node_modules')),
        new ModuleNotFoundPlugin(path.resolve('src')),
        new Serve({
          progress: 'minimal',
          port: 3000,
          static: './public',
          historyFallback: true,
          waitForBuild: true,
          middleware: (app, builtins) => {
            app.use(
              builtins.proxy('/graphiql', {
                target: 'http://localhost:8080',
              }),
            )
            app.use(
              builtins.proxy('/graphql', {
                target: 'http://localhost:8080',
              }),
            )
          },
        }),
      ] : [
        new OptimizeCssAssetsPlugin({
          cssProcessorPluginOptions: {
            preset: ['default', { discardComments: { removeAll: true } }],
          },
        }),
      ]),
  ],
  stats,
}

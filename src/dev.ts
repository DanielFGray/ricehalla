/* eslint-disable import/no-extraneous-dependencies, global-require */
import fetch from 'isomorphic-unfetch'
import webpack from 'webpack'
import compose from 'koa-compose'
import koaWebpack from 'koa-webpack'
import WebpackBar from 'webpackbar'
import hotServer from './hotServerMiddleware'
import config from '../webpack.config'

const { APP_URL } = process.env

export async function dev() {
  const multiCompiler = webpack(config)
  const clientCompiler = multiCompiler.compilers.find(c => c.name === 'client')

  multiCompiler.compilers.forEach(c => {
    new WebpackBar({ profile: true }).apply(c)

    c.hooks.afterEmit.tap('built', () => {
      fetch(APP_URL).catch(console.error)
    })
  })

  const hotClient = await koaWebpack({
    compiler: clientCompiler,
    devMiddleware: {
      publicPath: '/',
      serverSideRender: true,
      logLevel: 'trace',
      // stats: false,
      stats: {
        chunks: true,
        chunkModules: false,
        colors: true,
        modules: false,
        children: false,
      },
    },
  })

  return compose([
    hotClient,
    // hotServer: hotServer(multiCompiler),
  ])
}

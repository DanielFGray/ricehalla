/* eslint-disable import/no-extraneous-dependencies, global-require */
import { spawn } from 'child_process'
import fetch from 'isomorphic-unfetch'
import webpack from 'webpack'
import koaWebpack from 'koa-webpack'
import WebpackBar from 'webpackbar'
import runAll from 'npm-run-all'
// import compose from 'koa-compose'
// import hotServer from './hotServerMiddleware'
import config from '../webpack.config'

const { APP_URL } = process.env

spawn('tput', ['clear'], { stdio: 'inherit' })

const codegen = {
  watching: null,
  start() {
    if (! this.watching) {
      console.log('starting graphql-codegen')
      this.watching = runAll(['gentypes:w'], { silent: true, stdout: process.stdout /* , printName: true */ })
    }
    return this.watching
  },
}

export async function dev() {
  const multiCompiler = webpack(config)
  const clientCompiler = multiCompiler.compilers.find(c => c.name === 'client')

  multiCompiler.compilers.forEach(c => {
    new WebpackBar({ profile: true }).apply(c)

    c.hooks.done.tap('built', () => {
      codegen.start()
      if (APP_URL) fetch(APP_URL).catch(console.error)
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

  return hotClient
  // return compose([
  //   hotClient,
  //   hotServer: hotServer(multiCompiler),
  // ])
}

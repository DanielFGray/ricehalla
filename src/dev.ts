/* eslint-disable import/no-extraneous-dependencies, global-require */
import { spawn } from 'child_process'
import fetch from 'isomorphic-unfetch'
import webpack from 'webpack'
import koaWebpack from 'koa-webpack'
import runAll from 'npm-run-all'
import compose from 'koa-compose'
import formatWebpackMessages from 'react-dev-utils/formatWebpackMessages'
import connect from 'koa-connect'
import hotServer from './hotServerMiddleware'
import config from '../webpack.config'
import errorOverlayMiddleware from 'react-dev-utils/errorOverlayMiddleware'

const { APP_URL } = process.env

const codegen = {
  watching: null,
  start() {
    if (! this.watching) {
      this.watching = runAll(['gentypes -w'], {
        silent: true,
        stdout: process.stdout /* , printName: true */,
      })
    }
    return this.watching
  },
}

export async function dev() {
  const multiCompiler = webpack(config)
  const clientCompiler = multiCompiler.compilers.find(c => c.name === 'client')

  multiCompiler.compilers.forEach(c => {
    // c.hooks.invalid.tap(`compiling ${c.name}`, () => spawn('clear', { stdio: 'inherit' }))

    c.hooks.done.tap('built', stats => {
      codegen.start()

      if (APP_URL) fetch(APP_URL).catch(console.error)

      const rawMessages = stats.toJson({}, true)
      const messages = formatWebpackMessages(rawMessages)
      if (messages.errors.length) {
        console.log('Failed to compile.')
        messages.errors.forEach(e => console.log(e))
      } else if (messages.warnings.length) {
        console.log('Compiled with warnings.')
        messages.warnings.forEach(w => console.log(w))
      }
      else if (! messages.errors.length && ! messages.warnings.length) {
        console.log('Compiled successfully!')
      }
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
    connect(errorOverlayMiddleware),
    hotClient,
    // hotServer(multiCompiler),
  ])
}

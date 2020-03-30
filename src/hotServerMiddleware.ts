/* eslint-disable import/no-extraneous-dependencies,max-classes-per-file */

/*
  Forked from https://github.com/leebenson/reactql
  previously Forked from https://github.com/60frames/webpack-hot-server-middleware
  and modified for Typescript and Launch.js

  MIT License

  Copyright (c) 2016 [note: no attribution given]

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.
*/

// ----------------------------------------------------------------------------
// IMPORTS

import type fs from 'fs'
import type Koa from 'koa'
import type webpack from 'webpack'
import path from 'path'

import requireFromString from 'require-from-string'
import sourceMapSupport from 'source-map-support'

interface IStats {
  assetsByChunkName?: {
    main: string | string[]
  }
}

interface IOutput {
  client: Stats
  server: Stats
}

const statsConfig = new WeakMap<Stats, IStats>()

class Stats {
  public constructor(stats: IStats = {}) {
    statsConfig.set(this, stats)
  }

  public get raw(): any {
    return statsConfig.get(this)
  }

  public main(ext: string): string | undefined {
    const main: string | string[] = statsConfig.get(this)?.assetsByChunkName.main ?? []
    const file = (Array.isArray(main) ? main : [main]).find((c: string) => c.endsWith(`.${ext}`))
    return file && `/${file}`
  }

  public scripts(): string[] {
    const initial = this.raw.chunks.find((chunk: any) => chunk.initial)

    const scripts: string[] = initial.siblings
      .map((sibling: any) => this.raw.chunks.find((chunk: any) => chunk.id === sibling).files)
      .concat(initial.files)
      .flat()
      .filter((file: string) => file.endsWith('.js'))
      .map((file: string) => `/${file}`)

    return scripts
  }
}

const outputConfig = new WeakMap<Output, IOutput>()

export class Output {
  /* CONSTRUCTOR */
  public constructor(c: IOutput) {
    outputConfig.set(this, c)
  }

  /* GETTERS */

  // Return the Webpack client build stats
  public get client() {
    return outputConfig.get(this).client
  }

  // Return the Webpack server build stats
  public get server() {
    return outputConfig.get(this).server
  }
}

type OutputRenderer = (output: Output) => Koa.Middleware

function isMultiCompiler(compiler?: webpack.MultiCompiler) {
  // Duck typing as `instanceof MultiCompiler` fails when npm decides to
  // install multiple instances of webpack.
  return compiler && compiler.compilers
}

function findCompiler(multiCompiler: webpack.MultiCompiler, name: string) {
  return multiCompiler.compilers.filter(
    compiler => compiler.name.startsWith(name),
  )
}

function findStats(multiStats: any, name: string) {
  return multiStats.stats.filter(
    (stats: any) => stats.compilation.name.startsWith(name),
  )
}

function getFilename(serverStats: webpack.Stats, outputPath: string) {
  const { assetsByChunkName } = serverStats.toJson()
  const filename = assetsByChunkName?.main ?? ''
  // If source maps are generated `assetsByChunkName.main`
  // will be an array of filenames.
  return path.join(
    outputPath,
    Array.isArray(filename)
      ? filename.find(asset => asset.endsWith('.js'))
      : filename,
  )
}

function getServerRenderer(filename: string, buffer: Buffer, output: Output) {
  const errMessage = 'The "server" compiler must export a function in the form of `(output: Output) => (ctx: Koa.Context, next: () => Promise<any>) => void`'

  const outputRenderer: OutputRenderer = requireFromString(
    buffer.toString(),
    filename,
  ).default
  if (typeof outputRenderer !== 'function') {
    throw new Error(errMessage)
  }

  const serverRenderer = outputRenderer(output)
  if (typeof serverRenderer !== 'function') {
    throw new Error(errMessage)
  }

  return serverRenderer
}

function installSourceMapSupport(filesystem: typeof fs) {
  sourceMapSupport.install({
    // NOTE: If https://github.com/evanw/node-source-map-support/pull/149
    // lands we can be less aggressive and explicitly invalidate the source
    // map cache when Webpack recompiles.
    emptyCacheBetweenOperations: true,
    retrieveFile(source) {
      try {
        return filesystem.readFileSync(source, 'utf8')
      } catch (ex) {
        // Doesn't exist
        return ''
      }
    },
  })
}

/*
  Passes the request to the most up to date "server" bundle.
  NOTE: This must be mounted after webpackDevMiddleware to ensure this
  middleware doesn't get called until the compilation is complete.
 */
function webpackHotServerMiddleware(multiCompiler: webpack.MultiCompiler) {
  if (! isMultiCompiler(multiCompiler)) {
    throw new Error(
      'Expected webpack compiler to contain both a "client" and/or "server" config',
    )
  }

  const [serverCompiler] = findCompiler(multiCompiler, 'server')
  const clientCompilers = findCompiler(multiCompiler, 'client')

  console.log(serverCompiler && clientCompilers)

  const outputFs = serverCompiler.outputFileSystem as any
  const { outputPath } = serverCompiler

  installSourceMapSupport(outputFs)

  let serverRenderer: Koa.Middleware
  let error = false

  function doneHandler(multiStats: webpack.Stats) {
    console.log('\ndone handler fired\n')
    error = false

    const [serverStats] = findStats(multiStats, 'server')
    // Server compilation errors need to be propagated to the client.
    if (serverStats.compilation.errors.length) {
      [error] = serverStats.compilation.errors
      return
    }

    let clientStatsJson = null

    if (clientCompilers.length) {
      const clientStats = findStats(multiStats, 'client')
      clientStatsJson = clientStats.map((obj: webpack.Stats) => obj.toJson())

      if (clientStatsJson.length === 1) {
        [clientStatsJson] = clientStatsJson
      }
    }

    const filename = getFilename(serverStats, outputPath)
    const buffer: Buffer = outputFs.readFileSync(filename)

    // Create an `Output` instance, containing our client/server stats
    const output = new Output({
      client: new Stats(clientStatsJson),
      server: new Stats(serverStats.toJson()),
    })

    try {
      serverRenderer = getServerRenderer(filename, buffer, output)
    } catch (ex) {
      error = ex
    }
  }

  multiCompiler.compilers.forEach(c => c.hooks.done.tap('built', doneHandler))

  const createKoaHandler: Koa.Middleware = (ctx, next) => {
    if (error) {
      ctx.throw(error)
    }
    return serverRenderer(ctx, next)
  }

  return createKoaHandler
}

export default webpackHotServerMiddleware

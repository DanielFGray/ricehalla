import 'dotenv/config'
import { promises as fs } from 'fs'
import http from 'http'
import Koa from 'koa'
import { SubscriptionServer } from 'subscriptions-transport-ws'
import { execute, subscribe } from 'graphql'
import app from './app'
import { schema } from './resolvers'

const { APP_URL, NODE_ENV, PORT, HOST } = process.env

function die(e?: Error | string) {
  if (e) console.error(e)
  process.exit(1)
}

process.on('exit', () => die('exiting!'))
process.on('SIGINT', () => die('interrupted!'))
process.on('uncaughtException', die)

type Manifest = Record<string, string>

export default async function main() {
  const koa = new Koa()

  if (NODE_ENV === 'development') {
    koa.use(await (await import('./dev' /* webpackChunkName: "dev-tools" */)).dev())
  } else {
    const manifestFile = (await import('path')).resolve('./dist/manifest.json')
    const manifest = JSON.parse(await fs.readFile(manifestFile, 'utf8'))
    koa.use(async (ctx, next) => {
      ctx.state.manifest = manifest
      await next()
    })
  }

  await app({ app: koa, schema })

  const server = http.createServer()
  server.on('request', koa.callback()) // eslint-disable-line @typescript-eslint/no-misused-promises

  process.on('SIGUSR2', () => console.log('whoa'))

  await new Promise(res => server.listen(Number(PORT), HOST, res))

  console.info(`server now running on ${APP_URL}`)
  SubscriptionServer.create(
    {
      execute,
      subscribe,
      schema,
    },
    {
      server,
      path: '/subscriptions',
    },
  )
}

main().catch(die)

// if (! module.parent) {
//   main().catch(die)
// }

import type { GraphQLSchema } from 'graphql'
import Koa from 'koa'
import koaHelmet from 'koa-helmet'
import bodyParser from 'koa-bodyparser'
import koaSession from 'koa-session'
import { ApolloServer } from 'apollo-server-koa'
import send from 'koa-send'
import morgan from 'koa-morgan'
import SSR from './SSR'

const { NODE_ENV, SESSION_SECRET, PUBLIC_DIR } = process.env

async function time(ctx: Koa.Context, next: Koa.Next) {
  const start = Date.now()
  await next()
  const ms = Date.now() - start
  ctx.set('X-Response-Time', `${ms}ms`)
}

async function staticFiles(ctx: Koa.Context, next: Koa.Next) {
  try {
    if (ctx.path !== '/') {
      return await send(ctx, ctx.path, { root: PUBLIC_DIR })
    }
  } catch (e) { /* fallthrough */ }
  return next()
}

export default async function main({ app, schema }: { app: Koa, schema: GraphQLSchema }) {
  if (! SESSION_SECRET) throw new Error('missing env var SESSION_SECRET')

  const apolloServer = new ApolloServer({
    schema,
    tracing: NODE_ENV.startsWith('dev'),
    playground: {
      settings: {
        'editor.theme': 'light',
      },
    },
    subscriptions: {
      path: '/subscriptions',
      onConnect: (connection, websocket, context) => {
        console.log({ connection, websocket, context })
      },
    },
  })

  // eslint-disable-next-line no-param-reassign
  app.keys = [SESSION_SECRET]
  const sessionConf = {
    key: 'nodeapp_session',
    rolling: true,
    renew: true,
  }

  console.log('making middleware')

  app.use(koaHelmet())
  app.use(bodyParser())
  app.use(morgan('dev'))
  app.use(time)
  app.use(koaSession(sessionConf, app))
  app.use(staticFiles)
  app.use(apolloServer.getMiddleware())
  app.use(SSR({ schema }))
}

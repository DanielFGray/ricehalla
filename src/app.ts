/* eslint-disable prefer-arrow-callback */
import { GraphQLSchema } from 'graphql'
import Koa from 'koa'
import koaHelmet from 'koa-helmet'
import bodyParser from 'koa-bodyparser'
import { ApolloServer } from 'apollo-server-koa'
import send from 'koa-send'
import morgan from 'koa-morgan'
import SSR from './SSR'
import sessionPoolMiddleware from './sessionPoolMiddleware'

const { NODE_ENV, PUBLIC_DIR } = process.env

export default async function main({ app, schema }: { app: Koa; schema: GraphQLSchema }) {
  app.use(koaHelmet())
  app.use(bodyParser())
  app.use(morgan('dev'))

  app.use(async function time(ctx, next) {
    const start = Date.now()
    await next()
    const ms = Date.now() - start
    ctx.set('X-Response-Time', `${ms}ms`)
  })

  app.use(async function staticFiles(ctx, next) {
    try {
      if (ctx.path !== '/') {
        return await send(ctx, ctx.path, { root: PUBLIC_DIR })
      }
    } catch (e) {
      /* fallthrough */
    }
    return next()
  })

  await sessionPoolMiddleware(app)

  app.use(
    new ApolloServer({
      schema,
      playground: {
        settings: {
          'editor.theme': 'light',
        },
      },
      context(context) {
        console.log({ context })
        throw new Error('FIZZBUZZ')
        const { connection } = context.ctx.state
        const { session } = context.ctx
        return { connection, session }
      },
      // subscriptions: {
      //   path: '/subscriptions',
      //   onConnect: (connection, websocket, context) => {
      //     console.log({ connection, websocket, context })
      //   },
      // },
    }).getMiddleware(),
  )

  app.use(SSR({ schema }))
}

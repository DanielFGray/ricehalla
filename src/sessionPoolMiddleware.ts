import type Koa from 'koa'
import session from 'koa-session'
import { sql } from 'slonik'
import { visitorPool, ownerPool } from './db'

const { SESSION_SECRET } = process.env

// eslint-disable-next-line @typescript-eslint/require-await
export default async function sessionPoolMiddleware(app: Koa) {
  if (! SESSION_SECRET) throw new Error('missing env var SESSION_SECRET')
  // eslint-disable-next-line no-param-reassign
  app.keys = [SESSION_SECRET]

  app.use(session({
    key: 'ricehalla',
    rolling: true,
    renew: true,
    store: {
      async get(key, maxAge, { rolling }) {
        return ownerPool.query(sql`select * from app_private.sessions where key=${key}`)
      },
      async set(key, sess, maxAge, { rolling, changed }) {
        return ownerPool.query(sql`
          insert into app_private.sessions (sess, expire, id) values (${sess}, to_timestamp(${maxAge}), ${key})
            on conflict (id) do update set sess=${sess}, expire=to_timestamp(${maxAge}) returning *
        `)
      },
      async destroy(key) {
        return ownerPool.query(sql`delete from app_private.sessions where key=${key}`)
      },
    },
  }, app))

  app.use(async (ctx, next) => {
    await visitorPool.transaction(async connection => {
      // await connection.query(sql`set_config("my.session.key", ${ctx.session.key}, true)`)
      ctx.state.connection = connection
      await next()
    })
  })
}

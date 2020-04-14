import 'dotenv/config'
import pg from 'pg'
import express from 'express'
import session from 'express-session'
import connectPgSimple from 'connect-pg-simple'
import { postgraphile } from 'postgraphile'
import simplifyInflector from '@graphile-contrib/pg-simplify-inflector'
import { NodePlugin } from 'graphile-build'
import { loginPlugin } from './pgAuth'

const { SESSION_SECRET, OWNER_CONNECTION, VISITOR_CONNECTION, NODE_ENV } = process.env

const devMode = NODE_ENV.startsWith('dev')

const app = express()

const visitorPool = new pg.Pool({
  connectionString: VISITOR_CONNECTION,
})

const ownerPool = new pg.Pool({
  connectionString: OWNER_CONNECTION,
})

const PgStore = connectPgSimple(session)

app.use(session({
  store: new PgStore({
    pool: ownerPool,
    schemaName: 'app_private',
    tableName: 'connect_pg_simple_sessions',
  }),
  secret: SESSION_SECRET,
  cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 }, // 30 days
  rolling: true,
  resave: false,
  saveUninitialized: false,
}))

app.use(express.static('./public'))

app.use(postgraphile(visitorPool, 'app_public', {
  exportGqlSchemaPath: './src/typeDefs.gql',
  allowExplain: devMode,
  appendPlugins: [
    simplifyInflector,
    loginPlugin,
  ],
  skipPlugins: [NodePlugin],
  dynamicJson: true,
  enhanceGraphiql: true,
  extendedErrors: ['hint', 'detail', 'errcode'],
  graphiql: devMode,
  ignoreIndexes: false,
  ignoreRBAC: false,
  ownerConnectionString: OWNER_CONNECTION,
  showErrorStack: true,
  sortExport: true,
  watchPg: true,
  pgDefaultRole: 'visitor',
  additionalGraphQLContextFromRequest(req) {
    return {
      // The current session id
      sessionId: req.user && uuidOrNull(req.user.session_id),
      ownerPool,
      // Use this to tell Passport.js we're logged in
      login: (user: any) => new Promise((resolve, reject) => {
        req.login(user, err => (err ? reject(err) : resolve()))
      }),

      logout: () => {
        req.logout()
        return Promise.resolve()
      },
    }
  },
}))

app.listen(8080, () => {
  console.log('server running on port 8080')
})

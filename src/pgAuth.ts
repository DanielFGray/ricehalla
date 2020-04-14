import { gql, makeExtendSchemaPlugin } from 'graphile-utils'
import { GraphQLError } from 'graphql'
import { camelCase } from 'lodash'

const isDev = process.env.NODE_ENV === 'development'
const isTest = process.env.NODE_ENV === 'test'

const ERROR_PROPERTIES_TO_EXPOSE = isDev || isTest
  ? [
    'code',
    'severity',
    'detail',
    'hint',
    'positon',
    'internalPosition',
    'internalQuery',
    'where',
    'schema',
    'table',
    'column',
    'dataType',
    'constraint',
  ]
  : ['code']

function conflictFieldsFromError(err: any) {
  const { table, constraint } = err
  // TODO: extract a list of constraints from the DB
  if (constraint && table) {
    const PREFIX = `${table}_`
    const SUFFIX = '_key'
    if (constraint.startsWith(PREFIX) && constraint.endsWith(SUFFIX)) {
      const maybeColumnNames = constraint.substr(
        PREFIX.length,
        constraint.length - PREFIX.length - SUFFIX.length,
      )
      return [camelCase(maybeColumnNames)]
    }
  }
  return undefined
}


// This would be better as a macro...
const pluck = (err: any): { [key: string]: any } => ERROR_PROPERTIES_TO_EXPOSE.reduce((memo, key) => {
  const value = key === 'code'
    ? // err.errcode is equivalent to err.code; replace it
    err.code || err.errcode
    : err[key]
  if (value != null) {
    memo[key] = value
  }
  return memo
}, {})

/**
 * This map allows you to override the error object output to users from
 * database errors.
 *
 * See `docs/error_codes.md` for a list of error codes we use internally.
 *
 * See https://www.postgresql.org/docs/current/errcodes-appendix.html for a
 * list of error codes that PostgreSQL produces.
 */

export const ERROR_MESSAGE_OVERRIDES: { [code: string]: typeof pluck } = {
  42501: err => ({
    ...pluck(err),
    message: 'Permission denied (by RLS)',
  }),
  23505: err => ({
    ...pluck(err),
    message: 'Conflict occurred',
    fields: conflictFieldsFromError(err),
    code: 'NUNIQ',
  }),
}

export function handleErrors(
  errors: readonly GraphQLError[],
): Array<any> {
  return errors.map(error => {
    const { message: rawMessage, locations, path, originalError } = error
    const code = originalError ? originalError.code : null
    const localPluck = ERROR_MESSAGE_OVERRIDES[code] || pluck
    const exception = localPluck(originalError || error)
    return {
      message: exception.message || rawMessage,
      locations,
      path,
      extensions: {
        exception,
      },
    }
  })
}

export const loginPlugin = makeExtendSchemaPlugin(build => ({
  typeDefs: gql`
    input RegisterInput {
      username: String!
      password: String!
    }

    type RegisterPayload {
      user: User! @pgField
    }

    input LoginInput {
      username: String!
      password: String!
    }

    type LoginPayload {
      user: User! @pgField
    }

    type LogoutPayload {
      success: Boolean
    }

    extend type Mutation {
      """
      Use this mutation to create an account on our system. This may only be used if you are logged out.
      """
      register(input: RegisterInput!): RegisterPayload
      """
      Use this mutation to log in to your account; this login uses sessions so you do not need to take further action.
      """
      login(input: LoginInput!): LoginPayload
      """
      Use this mutation to logout from your account. Don't forget to clear the client state!
      """
      logout: LogoutPayload
    }
  `,
  resolvers: {
    Mutation: {
      async register(_mutation, args, context, resolveInfo) {
        const { selectGraphQLResultFromTable } = resolveInfo.graphile
        const { username, password } = args.input
        const { ownerPool, pgClient } = context
        try {
          // Call our login function to find out if the username/password combination exists
          const {
            rows: [details],
          } = await ownerPool.query(
            `with new_user as (
              select users.* from app_private.register_user($1, $2) users where not (users is null)
            ), new_session as (
              insert into app_private.sessions (user_id)
              select id from new_user
              returning *
            )
            select new_user.id as user_id, new_session.uuid as session_id
            from new_user, new_session`,
            [username, password],
          )

          if (! details || ! details.user_id) {
            const e = new Error('Registration failed')
            e.code = 'FFFFF'
            throw e
          }

          if (details.session_id) {
            // Store into transaction
            await pgClient.query('select set_config(\'jwt.claims.session_id\', $1, true)', [
              details.session_id,
            ])

            // Tell Passport.js we're logged in
            await login({ session_id: details.session_id })
          }

          // Fetch the data that was requested from GraphQL, and return it
          const sql = build.pgSql
          const [row] = await selectGraphQLResultFromTable(
            sql.fragment`app_public.users`,
            (tableAlias, sqlBuilder) => {
              sqlBuilder.where(sql.fragment`${tableAlias}.id = ${sql.value(details.user_id)}`)
            },
          )
          return {
            data: row,
          }
        } catch (e) {
          const { code } = e
          const safeErrorCodes = [
            'WEAKP',
            'LOCKD',
            'EMTKN',
            ...Object.keys(ERROR_MESSAGE_OVERRIDES),
          ]
          if (safeErrorCodes.includes(code)) {
            throw e
          } else {
            console.error(
              'Unrecognised error in PassportLoginPlugin; replacing with sanitized version',
            )
            console.error(e)
            const error = new Error('Registration failed')
            error.code = code
            throw error
          }
        }
      },
      async login(_mutation, args, context, resolveInfo) {
        const { selectGraphQLResultFromTable } = resolveInfo.graphile
        const { username, password } = args.input
        const { ownerPool, pgClient } = context
        try {
          // Call our login function to find out if the username/password combination exists
          const {
            rows: [session],
          } = await ownerPool.query(
            'select sessions.* from app_private.login($1, $2) sessions where not (sessions is null)',
            [username, password],
          )

          if (! session) {
            const error = new Error('Incorrect username/password')
            error.code = 'CREDS'
            throw error
          }

          // if (session.uuid) {
          //   // Tell Passport.js we're logged in
          //   await login({ session_id: session.uuid })
          // }

          // Get session_id from PG
          await pgClient.query('select set_config(\'jwt.claims.session_id\', $1, true)', [
            session.uuid,
          ])

          // Fetch the data that was requested from GraphQL, and return it
          const sql = build.pgSql
          const [row] = await selectGraphQLResultFromTable(
            sql.fragment`app_public.users`,
            (tableAlias, sqlBuilder) => {
              sqlBuilder.where(sql.fragment`${tableAlias}.id = app_public.current_user_id()`)
            },
          )
          return {
            data: row,
          }
        } catch (e) {
          const { code } = e
          const safeErrorCodes = ['LOCKD', 'CREDS']
          if (safeErrorCodes.includes(code)) {
            throw e
          } else {
            console.error(e)
            const error = new Error('Login failed')
            error.code = e.code
            throw error
          }
        }
      },

      async logout(_mutation, _args, context, _resolveInfo) {
        const { pgClient, logout } = context
        await pgClient.query('select app_public.logout();')
        await logout()
        return {
          success: true,
        }
      },
    },
  },
}))

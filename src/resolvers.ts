import { makeExecutableSchema } from 'graphql-tools'
import { UserInputError, PubSub } from 'apollo-server-koa'
import { sql } from 'slonik'
import { KoaState, KoaContext } from './types'
import type { Desktop, Resolvers } from './generated-types'
import typeDefs from './typeDefs.gql'

const pubsub = new PubSub()

export const resolvers: Resolvers<KoaState> = {
  Query: {
    async DesktopList(_, { offset, limit, order }, context) {
      if (! context) {
        throw new Error('missing connection context')
      }
      const { rows } = await context.connection.query<Desktop>(
        sql`select * from app_public.desktops limit ${limit} offset ${offset} orderby ${order.toLowerCase()} desc`,
      )
      return rows
    },
  },
  Mutation: {
    async DesktopCreate(_, { title, description, urls }, { connection }) {
      const data = await connection.query<Desktop>(
        sql`insert into app_public.desktops (title, description, urls) values (${title}, ${description}, ${urls}) returning *`,
      )
      pubsub.publish('DesktopCreated', { DesktopCreated: data })
      return data
    },
    async DesktopUpdate(_, { id, title, description, urls }, { connection }) {
      const { rows } = await connection.query<Desktop>(
        sql`update app_public.desktops set title = ${title}, description = ${description}, urls = ${sql.array(
          urls,
          'url[]',
        )} where id = ${id} returning *`,
      )
      if (! rows) throw new UserInputError(`error updating ${id}, probably doesn't exist`)
      pubsub.publish('DesktopUpdated', { DesktopUpdated: rows })
      return rows
    },
    async DesktopDelete(_, { id }, { connection }) {
      const data = await connection.query(sql`delete from app_public.desktops where id = ${id}`)
      if (data < 1) throw new UserInputError(`error deleting ${id}, probably doesn't exist`)
      pubsub.publish('DesktopDeleted', { DesktopDeleted: id })
      return data
    },
  },
  Subscription: {
    DesktopCreated: { subscribe: () => pubsub.asyncIterator('DesktopCreated') },
    DesktopUpdated: { subscribe: () => pubsub.asyncIterator('DesktopUpdated') },
    DesktopDeleted: { subscribe: () => pubsub.asyncIterator('DesktopDeleted') },
  },
}

export const schema = makeExecutableSchema({ typeDefs, resolvers })

import { makeExecutableSchema } from 'graphql-tools'
import { UserInputError, PubSub } from 'apollo-server-koa'
import db from './db'
import { Desktop, Resolvers } from './generated-types'
import typeDefs from './typeDefs.gql'

const pubsub = new PubSub()

export const resolvers: Resolvers<Desktop> = {
  Query: {
    Desktop: async () => db('desktops').select(),
  },
  Mutation: {
    DesktopCreate: async (_, { title, description, urls }) => {
      const [data] = await db<Desktop>('desktops')
        .insert({ title, description, urls })
        .returning('*')
      pubsub.publish('DesktopCreated', { DesktopCreated: data })
      return data
    },
    DesktopUpdate: async (_, { id, title, description, urls }) => {
      const [data] = await db<Desktop>('desktops')
        .where({ id })
        .update({ title, description, urls })
        .returning('*')
      if (! data) throw new UserInputError(`error updating ${id}, probably doesn't exist`)
      pubsub.publish('DesktopUpdated', { DesktopUpdated: data })
      return data
    },
    DesktopDelete: async (_, { id }) => {
      const data = await db<Desktop>('desktops')
        .where({ id })
        .delete()
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

import knex from 'knex'
import config from '../knexfile'

const { NODE_ENV } = process.env
if (! (NODE_ENV === 'production' || NODE_ENV === 'development')) {
  throw new Error(`cannot load knex config with unknown NODE_ENV: ${NODE_ENV}`)
}

export default knex(config[NODE_ENV])

require('dotenv/config')

const { PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE } = process.env

if (! PGHOST) throw new Error('missing knex env var PGHOST')
if (! PGPORT) throw new Error('missing knex env var PGPORT')
if (! PGDATABASE) throw new Error('missing knex env var PGDATABASE')

module.exports = {

  development: {
    client: 'postgresql',
    connection: {
      host: PGHOST,
      port: Number(PGPORT),
      user: PGUSER,
      password: PGPASSWORD,
      database: PGDATABASE,
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: 'knex_migrations',
    },
  },

  production: {
    client: 'postgresql',
    connection: {
      host: PGHOST,
      port: Number(PGPORT),
      user: PGUSER,
      password: PGPASSWORD,
      database: PGDATABASE,
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: 'knex_migrations',
    },
  },

}
